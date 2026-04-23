#!/bin/bash
# Music Catalog Preparation Script
# Copies and renames all VibrationFit music assets into a standardized structure
# ready for S3 upload and database seeding.
#
# Source: /Volumes/company-engineers/assets/Vibration Fit/Music/
# Output: /tmp/vibrationfit-music/{slug}/audio.{ext} + artwork.jpg
#
# After running, upload the /tmp/vibrationfit-music/ folder to S3:
#   aws s3 sync /tmp/vibrationfit-music/ s3://vibration-fit-client-storage/site-assets/music/

set -e

SRC="/Volumes/company-engineers/assets/Vibration Fit/Music"
OUT="/tmp/vibrationfit-music"

mkdir -p "$OUT"

slugify() {
  echo "$1" | tr '[:upper:]' '[:lower:]' | sed "s/[''']//g" | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-//;s/-$//'
}

copy_asset() {
  local title="$1"
  local slug=$(slugify "$title")
  local dir="$SRC/$title"
  local dest="$OUT/$slug"

  mkdir -p "$dest"

  # Find best audio file (prefer Mixea mastered WAV, then .mp3, then raw .wav)
  local audio=""
  # Check Published Track subfolder first
  if [ -d "$dir/Published Track" ]; then
    audio=$(find "$dir/Published Track" -maxdepth 1 -name 'Mixea_*' -type f 2>/dev/null | head -1)
  fi
  # Then check root for Mixea mastered
  if [ -z "$audio" ]; then
    audio=$(find "$dir" -maxdepth 1 -name 'Mixea_*' -type f 2>/dev/null | head -1)
  fi
  # Then check for .mp3 in root
  if [ -z "$audio" ]; then
    audio=$(find "$dir" -maxdepth 1 -name '*.mp3' -type f 2>/dev/null | head -1)
  fi
  # Then any .wav in root (not stems like vocals.wav, drums.wav, etc.)
  if [ -z "$audio" ]; then
    audio=$(find "$dir" -maxdepth 1 -name '*.wav' -not -name 'vocals.wav' -not -name 'drums.wav' -not -name 'bass.wav' -not -name 'instrumental.wav' -not -name 'other.wav' -type f 2>/dev/null | head -1)
  fi

  if [ -n "$audio" ]; then
    local ext="${audio##*.}"
    cp "$audio" "$dest/audio.$ext"
    echo "  audio: $(basename "$audio") -> audio.$ext"
  else
    echo "  WARNING: No audio file found!"
  fi

  # Find best artwork (prefer .jpg, then .png, check Album Art subfolder too)
  local art=""
  # Check Album Art / Album Artwork subfolders
  if [ -d "$dir/Album Art" ]; then
    art=$(find "$dir/Album Art" -maxdepth 1 \( -name '*.jpg' -o -name '*.png' \) -type f 2>/dev/null | head -1)
  fi
  if [ -z "$art" ] && [ -d "$dir/Album Artwork" ]; then
    art=$(find "$dir/Album Artwork" -maxdepth 1 \( -name '*.jpg' -o -name '*.png' \) -type f 2>/dev/null | head -1)
  fi
  # Then check root for .jpg
  if [ -z "$art" ]; then
    art=$(find "$dir" -maxdepth 1 -name '*.jpg' -type f 2>/dev/null | head -1)
  fi
  # Then .png (skip ChatGPT drafts)
  if [ -z "$art" ]; then
    art=$(find "$dir" -maxdepth 1 -name '*.png' -not -name 'ChatGPT*' -type f 2>/dev/null | head -1)
  fi
  # Last resort: ChatGPT images
  if [ -z "$art" ]; then
    art=$(find "$dir" -maxdepth 1 -name '*.png' -type f 2>/dev/null | head -1)
  fi

  if [ -n "$art" ]; then
    local ext="${art##*.}"
    cp "$art" "$dest/artwork.$ext"
    echo "  artwork: $(basename "$art") -> artwork.$ext"
  else
    echo "  WARNING: No artwork found!"
  fi
}

echo "Preparing VibrationFit Music Catalog"
echo "===================================="
echo ""

# Process each song folder
while IFS= read -r folder; do
  title=$(basename "$folder")
  slug=$(slugify "$title")
  echo "[$slug] $title"
  copy_asset "$title"
  echo ""
done < <(find "$SRC" -mindepth 1 -maxdepth 1 -type d | sort)

echo "===================================="
echo "Done! Output: $OUT"
echo ""
echo "Next steps:"
echo "  1. Review /tmp/vibrationfit-music/ to verify all files"
echo "  2. Upload to S3: aws s3 sync /tmp/vibrationfit-music/ s3://vibration-fit-client-storage/site-assets/music/ --acl public-read"
echo "  3. Run the SQL seed script to populate the database"
