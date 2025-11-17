"use client";

import { useEffect, useRef } from 'react';

interface SimpleLevelMeterProps {
  stream?: MediaStream | null;
  className?: string;
  barCount?: number;
  circular?: boolean;
}

export default function SimpleLevelMeter({ 
  stream, 
  className = '',
  barCount = 40,
  circular = false
}: SimpleLevelMeterProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!stream) return;

    async function start(mediaStream: MediaStream) {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const audioCtx = new AudioCtx();
        audioContextRef.current = audioCtx;
        if (audioCtx.state === "suspended") {
          await audioCtx.resume();
        }

        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.7;
        analyserRef.current = analyser;

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

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      rafRef.current = requestAnimationFrame(render);

      analyser.getByteFrequencyData(dataArray);

      // Get average level
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }
      const average = sum / bufferLength;
      
      // Amplify and clamp (make it more sensitive to normal speech)
      const amplified = (average / 255) * 3.0; // 3x amplification
      const normalizedLevel = Math.min(1.0, amplified); // Clamp to 0-1

      // Clear with transparency for circular mode
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (circular) {
        // Draw circular level meter
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 4;
        const barCountCircular = 24; // Number of bars around the circle
        const angleStep = (Math.PI * 2) / barCountCircular;
        const activeBars = Math.floor(normalizedLevel * barCountCircular);

        for (let i = 0; i < barCountCircular; i++) {
          const angle = i * angleStep - Math.PI / 2; // Start from top
          const barLength = 8;
          const innerRadius = radius - barLength;
          
          // Calculate bar positions
          const x1 = centerX + Math.cos(angle) * innerRadius;
          const y1 = centerY + Math.sin(angle) * innerRadius;
          const x2 = centerX + Math.cos(angle) * radius;
          const y2 = centerY + Math.sin(angle) * radius;

          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.lineWidth = 3;
          ctx.strokeStyle = i < activeBars ? "#FFFFFF" : "#333333";
          ctx.stroke();
        }
      } else {
        // Original vertical bar mode
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const barWidth = canvas.width / barCount;
        const barHeight = canvas.height / barCount;
        const activeBars = Math.floor(normalizedLevel * barCount);

        for (let i = 0; i < barCount; i++) {
          const y = canvas.height - (i + 1) * barHeight;
          
          if (i < activeBars) {
            ctx.fillStyle = "#FFFFFF";
          } else {
            ctx.fillStyle = "#1A1A1A";
          }
          
          ctx.fillRect(0, y, canvas.width, barHeight - 2);
        }
      }
    };

    render();
  }

  if (circular) {
    return (
      <canvas
        ref={canvasRef}
        width={100}
        height={100}
        className={`w-[100px] h-[100px] ${className}`}
        style={{ imageRendering: 'auto' }}
      />
    );
  }

  return (
    <canvas
      ref={canvasRef}
      width={100}
      height={100}
      className={`w-[60px] h-[100px] bg-black rounded-lg border-2 border-neutral-700 ${className}`}
      style={{ imageRendering: 'pixelated' }}
    />
  );
}

