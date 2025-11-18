"use client";

import { useEffect, useRef } from "react";

interface VoiceWaveformProps {
  stream?: MediaStream | null;
  className?: string;
}

export default function VoiceWaveform({ stream, className = "" }: VoiceWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!stream) return;

    async function start(mediaStream: MediaStream) {
      try {
        // Audio context
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const audioCtx = new AudioCtx();
        audioContextRef.current = audioCtx;
        if (audioCtx.state === "suspended") {
          await audioCtx.resume();
        }

        // Analyser
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 2048;
        analyser.smoothingTimeConstant = 0.8;
        analyserRef.current = analyser;

        // Source
        const source = audioCtx.createMediaStreamSource(mediaStream);
        sourceRef.current = source;
        source.connect(analyser);

        draw();
      } catch (e: any) {
        console.error(e);
        stop();
      }
    }

    start(stream);

    return () => {
      stop();
    };
  }, [stream]);

  function stop() {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (sourceRef.current) {
      try {
        sourceRef.current.disconnect();
      } catch {}
      sourceRef.current = null;
    }
    if (analyserRef.current) {
      try {
        analyserRef.current.disconnect();
      } catch {}
      analyserRef.current = null;
    }
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch {}
      audioContextRef.current = null;
    }
  }

  function draw() {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const bufferLength = analyser.fftSize;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      rafRef.current = requestAnimationFrame(render);

      // Handle high-DPI
      const dpr = window.devicePixelRatio || 1;
      const logicalWidth = canvas.clientWidth || canvas.width;
      const logicalHeight = canvas.clientHeight || canvas.height;
      if (
        canvas.width !== logicalWidth * dpr ||
        canvas.height !== logicalHeight * dpr
      ) {
        canvas.width = logicalWidth * dpr;
        canvas.height = logicalHeight * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }

      analyser.getByteTimeDomainData(dataArray);

      // Clear
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, logicalWidth, logicalHeight);

      // Center line
      ctx.strokeStyle = "#1f2933"; // subtle
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, logicalHeight / 2);
      ctx.lineTo(logicalWidth, logicalHeight / 2);
      ctx.stroke();

      // Waveform
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#ffffff";
      ctx.shadowBlur = 6;
      ctx.shadowColor = "#ffffff";

      ctx.beginPath();
      const sliceWidth = logicalWidth / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0; // 0..2
        const y = (v * logicalHeight) / 2; // center around middle

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        x += sliceWidth;
      }

      ctx.stroke();
      ctx.shadowBlur = 0;
    };

    render();
  }

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-[100px] rounded-xl border-2 border-neutral-700 bg-black ${className}`}
    />
  );
}

