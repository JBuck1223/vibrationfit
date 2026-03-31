#!/usr/bin/env python3
"""
Testimonial Extractor Pipeline
===============================
Transcribes a video with speaker diarization, uses AI to identify
the best testimonial moments, and auto-cuts the video into clips.

Usage:
    python3 scripts/video/testimonial_extractor.py <video_path> [--step STEP]

Steps:
    1. extract_audio   - Extract audio from video (FFmpeg)
    2. transcribe      - Transcribe with speaker diarization (fal.ai Whisper)
    3. analyze         - AI picks best testimonial segments (OpenAI GPT-4)
    4. cut             - Auto-cut video into clips (FFmpeg)
    all                - Run all steps sequentially

Examples:
    # Run everything:
    python3 scripts/video/testimonial_extractor.py /path/to/video.mp4

    # Run only transcription (if audio already extracted):
    python3 scripts/video/testimonial_extractor.py /path/to/video.mp4 --step transcribe

    # Re-run AI analysis with different criteria:
    python3 scripts/video/testimonial_extractor.py /path/to/video.mp4 --step analyze
"""

import argparse
import json
import os
import subprocess
import sys
import time
from pathlib import Path

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

WORK_DIR_NAME = "testimonial_work"

AI_ANALYSIS_PROMPT = """You are an expert video editor specializing in testimonial and marketing videos.

I'm giving you a transcript of a recorded video interview/conversation. Each line has this format:
  [START_SECONDS - END_SECONDS] SPEAKER_ID: "text they said"

The timestamps are in SECONDS from the start of the video.
For example, [180.5 - 210.3] means from 3 minutes 0.5 seconds to 3 minutes 30.3 seconds.

Your job: identify the 8-15 BEST segments that would make compelling standalone testimonial clips.

## What Makes a Great Testimonial Clip:
- Authentic emotional moments (excitement, gratitude, realization, breakthroughs)
- Specific results or transformations ("I went from X to Y", "I used to... but now...")
- Quotable, powerful statements that stand on their own
- Ideal length: 15-90 seconds per clip
- Self-contained meaning (viewer doesn't need prior context)
- Complete thoughts - starts and ends cleanly

## What to AVOID:
- Small talk, logistics, or technical troubleshooting
- Segments that need context to understand
- Crosstalk or confusion
- Very short fragments (under 10 seconds)
- Generic filler ("that's great", "yeah", "right")

## IMPORTANT timestamp rules:
- start_time and end_time MUST be in SECONDS (decimal numbers), matching the transcript timestamps
- Add 2 seconds of padding before start_time and after end_time for clean transitions
- Double-check your timestamps against the transcript - they must be accurate!

## Your Output:
Return ONLY a JSON array (no markdown fences, no explanation). Each element:
{
  "rank": 1,           // 1=best, 2=great, 3=good
  "start_time": 180.0, // seconds from video start (WITH 2s padding before)
  "end_time": 230.0,   // seconds from video start (WITH 2s padding after)
  "speaker": "SPEAKER_03",
  "quote_preview": "the key quote from this segment",
  "reason": "why this is a great testimonial moment",
  "suggested_title": "short descriptive title"
}

Find AT LEAST 8 clips. Prioritize moments where speakers talk about transformations, breakthroughs, emotional shifts, or specific results.

Here is the transcript:
"""


def load_env_file(project_root: str) -> None:
    """Load API keys from .env.local if not already in environment."""
    env_path = os.path.join(project_root, ".env.local")
    if not os.path.exists(env_path):
        return
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, _, value = line.partition("=")
                key = key.strip()
                value = value.strip()
                if key and value and key not in os.environ:
                    os.environ[key] = value


def get_work_dir(video_path: str) -> Path:
    """Create a work directory next to the video file."""
    video = Path(video_path)
    work_dir = video.parent / f"{video.stem}_{WORK_DIR_NAME}"
    work_dir.mkdir(exist_ok=True)
    return work_dir


def format_timestamp(seconds: float) -> str:
    """Convert seconds to HH:MM:SS.mmm format."""
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = seconds % 60
    return f"{h:02d}:{m:02d}:{s:06.3f}"


def format_timestamp_short(seconds: float) -> str:
    """Convert seconds to MM:SS format for display."""
    m = int(seconds // 60)
    s = int(seconds % 60)
    return f"{m:02d}:{s:02d}"


# ---------------------------------------------------------------------------
# Step 1: Extract Audio
# ---------------------------------------------------------------------------

def extract_audio(video_path: str, work_dir: Path) -> str:
    """Extract audio track from video as MP3."""
    audio_path = str(work_dir / "audio.mp3")

    if os.path.exists(audio_path):
        size_mb = os.path.getsize(audio_path) / (1024 * 1024)
        print(f"  Audio already extracted ({size_mb:.1f} MB): {audio_path}")
        return audio_path

    print(f"  Extracting audio from video...")
    print(f"  This may take a minute for large files...")

    result = subprocess.run(
        [
            "ffmpeg", "-i", video_path,
            "-vn",                    # no video
            "-acodec", "libmp3lame",  # MP3 codec
            "-ab", "128k",            # 128kbps bitrate
            "-ar", "16000",           # 16kHz sample rate (optimal for Whisper)
            "-ac", "1",               # mono
            "-y",                     # overwrite
            audio_path,
        ],
        capture_output=True,
        text=True,
    )

    if result.returncode != 0:
        print(f"  ERROR: FFmpeg failed:\n{result.stderr[-500:]}")
        sys.exit(1)

    size_mb = os.path.getsize(audio_path) / (1024 * 1024)
    print(f"  Audio extracted: {audio_path} ({size_mb:.1f} MB)")
    return audio_path


# ---------------------------------------------------------------------------
# Step 2: Transcribe with Speaker Diarization
# ---------------------------------------------------------------------------

def transcribe(audio_path: str, work_dir: Path) -> dict:
    """Upload audio to fal.ai and transcribe with speaker diarization."""
    transcript_path = work_dir / "transcript.json"

    if transcript_path.exists():
        print(f"  Transcript already exists: {transcript_path}")
        with open(transcript_path) as f:
            return json.load(f)

    try:
        import fal_client
    except ImportError:
        print("  ERROR: fal-client not installed. Run: pip3 install fal-client")
        sys.exit(1)

    fal_key = os.environ.get("FAL_KEY")
    if not fal_key:
        print("  ERROR: FAL_KEY not found in environment or .env.local")
        sys.exit(1)

    # Upload audio file to fal storage
    print(f"  Uploading audio to fal.ai storage...")
    audio_url = fal_client.upload_file(audio_path)
    print(f"  Upload complete: {audio_url}")

    # Run Whisper with diarization
    print(f"  Running Whisper transcription with speaker diarization...")
    print(f"  (This may take several minutes for long audio)")

    start_time = time.time()

    def on_queue_update(update):
        if isinstance(update, fal_client.InProgress):
            elapsed = time.time() - start_time
            for log in update.logs:
                print(f"    [{elapsed:.0f}s] {log['message']}")

    result = fal_client.subscribe(
        "fal-ai/whisper",
        arguments={
            "audio_url": audio_url,
            "task": "transcribe",
            "language": "en",
            "diarize": True,
            "chunk_level": "segment",
            "batch_size": 64,
        },
        with_logs=True,
        on_queue_update=on_queue_update,
    )

    elapsed = time.time() - start_time
    print(f"  Transcription complete in {elapsed:.0f}s")

    # Save raw result
    with open(transcript_path, "w") as f:
        json.dump(result, f, indent=2)
    print(f"  Saved transcript: {transcript_path}")

    # Also save a human-readable version
    readable_path = work_dir / "transcript_readable.txt"
    write_readable_transcript(result, readable_path)
    print(f"  Saved readable transcript: {readable_path}")

    return result


def write_readable_transcript(result: dict, output_path: Path) -> None:
    """Write a human-readable transcript with speaker labels and timestamps."""
    chunks = result.get("chunks", [])

    # Group consecutive chunks by the same speaker into paragraphs
    grouped = []
    for chunk in chunks:
        ts = chunk.get("timestamp", [0, 0])
        start = ts[0] if ts[0] else 0
        end = ts[1] if ts[1] else 0
        speaker = chunk.get("speaker", "Unknown")
        text = chunk.get("text", "").strip()
        if not text:
            continue

        if grouped and grouped[-1]["speaker"] == speaker:
            grouped[-1]["end"] = end
            grouped[-1]["text"] += " " + text
        else:
            grouped.append({
                "speaker": speaker,
                "start": start,
                "end": end,
                "text": text,
            })

    with open(output_path, "w") as f:
        f.write("=" * 70 + "\n")
        f.write("TRANSCRIPT WITH SPEAKER DIARIZATION\n")
        f.write("=" * 70 + "\n\n")

        # Count unique speakers
        speakers = sorted(set(g["speaker"] or "Unknown" for g in grouped))
        f.write(f"Speakers detected: {len(speakers)} ({', '.join(speakers)})\n")
        f.write(f"Total segments: {len(grouped)}\n\n")
        f.write("-" * 70 + "\n\n")

        for g in grouped:
            f.write(
                f"[{format_timestamp_short(g['start'])} - {format_timestamp_short(g['end'])}] "
                f"{g['speaker']}:\n"
            )
            f.write(f"  {g['text']}\n\n")

        f.write("\n" + "=" * 70 + "\n")
        f.write("FULL TEXT\n")
        f.write("=" * 70 + "\n\n")
        f.write(result.get("text", ""))


# ---------------------------------------------------------------------------
# Step 3: AI Analysis
# ---------------------------------------------------------------------------

def analyze(work_dir: Path) -> list:
    """Use AI to analyze transcript and identify best testimonial segments."""
    clips_path = work_dir / "recommended_clips.json"

    if clips_path.exists():
        print(f"  Analysis already exists: {clips_path}")
        with open(clips_path) as f:
            return json.load(f)

    transcript_path = work_dir / "transcript.json"
    if not transcript_path.exists():
        print("  ERROR: No transcript found. Run the transcribe step first.")
        sys.exit(1)

    try:
        from openai import OpenAI
    except ImportError:
        print("  ERROR: openai not installed. Run: pip3 install openai")
        sys.exit(1)

    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        print("  ERROR: OPENAI_API_KEY not found in environment or .env.local")
        sys.exit(1)

    with open(transcript_path) as f:
        transcript_data = json.load(f)

    # Build the transcript text for the AI
    transcript_text = build_analysis_text(transcript_data)

    print(f"  Sending transcript to GPT-4o for analysis...")
    print(f"  Transcript length: {len(transcript_text):,} characters")

    client = OpenAI(api_key=api_key)

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {
                "role": "system",
                "content": "You are an expert video editor. Return only valid JSON arrays.",
            },
            {
                "role": "user",
                "content": AI_ANALYSIS_PROMPT + transcript_text,
            },
        ],
        temperature=0.3,
        max_tokens=4096,
    )

    raw_response = response.choices[0].message.content.strip()

    # Parse the JSON (handle markdown code fences if present)
    if raw_response.startswith("```"):
        raw_response = raw_response.split("\n", 1)[1]
        raw_response = raw_response.rsplit("```", 1)[0]

    try:
        clips = json.loads(raw_response)
    except json.JSONDecodeError:
        error_path = work_dir / "ai_response_raw.txt"
        with open(error_path, "w") as f:
            f.write(raw_response)
        print(f"  ERROR: AI returned invalid JSON. Raw response saved to: {error_path}")
        sys.exit(1)

    with open(clips_path, "w") as f:
        json.dump(clips, f, indent=2)

    # Print summary
    print(f"\n  Found {len(clips)} recommended testimonial clips:\n")
    for i, clip in enumerate(clips, 1):
        rank = clip.get("rank", "?")
        start = clip.get("start_time", 0)
        end = clip.get("end_time", 0)
        duration = end - start
        speaker = clip.get("speaker", "?")
        title = clip.get("suggested_title", "Untitled")
        reason = clip.get("reason", "")
        print(f"  #{i} [Rank {rank}] {title}")
        print(f"     Time: {format_timestamp_short(start)} - {format_timestamp_short(end)} ({duration:.0f}s)")
        print(f"     Speaker: {speaker}")
        print(f"     Why: {reason[:100]}")
        print(f"     Quote: \"{clip.get('quote_preview', '')[:80]}...\"")
        print()

    print(f"  Saved analysis: {clips_path}")
    return clips


def build_analysis_text(transcript_data: dict) -> str:
    """Build a formatted transcript text for AI analysis, grouped by speaker."""
    chunks = transcript_data.get("chunks", [])

    # Group consecutive chunks by the same speaker
    grouped = []
    for chunk in chunks:
        ts = chunk.get("timestamp", [0, 0])
        start = ts[0] if ts[0] else 0
        end = ts[1] if ts[1] else 0
        speaker = chunk.get("speaker", "Unknown")
        text = chunk.get("text", "").strip()
        if not text:
            continue

        if grouped and grouped[-1]["speaker"] == speaker:
            grouped[-1]["end"] = end
            grouped[-1]["text"] += " " + text
        else:
            grouped.append({
                "speaker": speaker,
                "start": start,
                "end": end,
                "text": text,
            })

    if not grouped:
        return transcript_data.get("text", "")

    lines = []
    for g in grouped:
        lines.append(
            f"[{g['start']:.1f} - {g['end']:.1f}] "
            f"{g['speaker'] or 'Unknown'}: {g['text']}"
        )

    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Step 4: Cut Video
# ---------------------------------------------------------------------------

def cut_video(video_path: str, work_dir: Path) -> None:
    """Cut the original video into clips based on AI recommendations."""
    clips_path = work_dir / "recommended_clips.json"
    if not clips_path.exists():
        print("  ERROR: No clip recommendations found. Run the analyze step first.")
        sys.exit(1)

    with open(clips_path) as f:
        clips = json.load(f)

    output_dir = work_dir / "clips"
    output_dir.mkdir(exist_ok=True)

    print(f"  Cutting {len(clips)} clips from video...\n")

    for i, clip in enumerate(clips, 1):
        rank = clip.get("rank", 0)
        start = clip.get("start_time", 0)
        end = clip.get("end_time", 0)
        title = clip.get("suggested_title", f"clip_{i}")

        # Sanitize title for filename
        safe_title = "".join(c if c.isalnum() or c in " -_" else "" for c in title)
        safe_title = safe_title.strip().replace(" ", "_")[:50]

        output_file = output_dir / f"rank{rank}_{i:02d}_{safe_title}.mp4"

        if output_file.exists():
            print(f"  [{i}/{len(clips)}] Already exists: {output_file.name}")
            continue

        duration = end - start
        print(f"  [{i}/{len(clips)}] Cutting: {format_timestamp_short(start)} - "
              f"{format_timestamp_short(end)} ({duration:.0f}s) -> {output_file.name}")

        result = subprocess.run(
            [
                "ffmpeg",
                "-ss", str(start),
                "-i", video_path,
                "-t", str(duration),
                "-c", "copy",       # no re-encoding = fast
                "-avoid_negative_ts", "make_zero",
                "-y",
                str(output_file),
            ],
            capture_output=True,
            text=True,
        )

        if result.returncode != 0:
            print(f"    WARNING: FFmpeg error on clip {i}. Trying with re-encode...")
            # Fallback: re-encode for problematic segments
            subprocess.run(
                [
                    "ffmpeg",
                    "-ss", str(start),
                    "-i", video_path,
                    "-t", str(duration),
                    "-c:v", "libx264", "-preset", "fast", "-crf", "18",
                    "-c:a", "aac", "-b:a", "192k",
                    "-y",
                    str(output_file),
                ],
                capture_output=True,
                text=True,
            )

    print(f"\n  All clips saved to: {output_dir}/")
    print(f"  Total clips: {len(clips)}")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description="Extract testimonial clips from video with AI assistance"
    )
    parser.add_argument("video", help="Path to the input video file")
    parser.add_argument(
        "--step",
        choices=["extract_audio", "transcribe", "analyze", "cut", "all"],
        default="all",
        help="Which step to run (default: all)",
    )
    args = parser.parse_args()

    video_path = os.path.abspath(args.video)
    if not os.path.exists(video_path):
        print(f"ERROR: Video file not found: {video_path}")
        sys.exit(1)

    # Try to load env from the VibrationFit project
    project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    load_env_file(project_root)

    work_dir = get_work_dir(video_path)
    print(f"\nTestimonial Extractor")
    print(f"{'=' * 50}")
    print(f"Video: {video_path}")
    print(f"Work dir: {work_dir}")
    print(f"Step: {args.step}\n")

    steps = {
        "extract_audio": lambda: extract_audio(video_path, work_dir),
        "transcribe": lambda: transcribe(
            str(work_dir / "audio.mp3"), work_dir
        ),
        "analyze": lambda: analyze(work_dir),
        "cut": lambda: cut_video(video_path, work_dir),
    }

    if args.step == "all":
        run_steps = ["extract_audio", "transcribe", "analyze", "cut"]
    else:
        run_steps = [args.step]

    for step_name in run_steps:
        print(f"\n--- Step: {step_name} ---")
        steps[step_name]()

    print(f"\n{'=' * 50}")
    print(f"Done! Check {work_dir}/ for all outputs.")


if __name__ == "__main__":
    main()
