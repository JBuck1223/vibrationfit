"use client";

import { useEffect, useRef, useState } from 'react';

interface BaseVisualizerProps {
  autoStart?: boolean;
  onLevel?: (level: number) => void;
  stream?: MediaStream | null; // Pass in an existing stream
  className?: string;
}

interface VoiceVisualizerBarsProps extends BaseVisualizerProps {
  barCount?: number;
}

// Hook for managing audio context and analyzer
function useAudioAnalyzer(stream: MediaStream | null | undefined, autoStart: boolean, onLevel?: (level: number) => void) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [isActive, setIsActive] = useState(false);

  const startAnalyzer = async (mediaStream?: MediaStream) => {
    try {
      const streamToUse = mediaStream || stream;
      if (!streamToUse) {
        // Request microphone access
        streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      } else {
        streamRef.current = streamToUse;
      }

      // Create audio context
      audioContextRef.current = new AudioContext();
      
      // Ensure context is running
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      // Create analyzer
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 2048;
      analyserRef.current.smoothingTimeConstant = 0.8;

      // Connect stream to analyzer
      const source = audioContextRef.current.createMediaStreamSource(streamRef.current!);
      source.connect(analyserRef.current);

      setIsActive(true);

      // Start level monitoring if callback provided
      if (onLevel) {
        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const updateLevel = () => {
          if (!analyserRef.current) return;
          
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b, 0) / bufferLength;
          const normalizedLevel = average / 255; // 0 to 1
          onLevel(normalizedLevel);

          animationFrameRef.current = requestAnimationFrame(updateLevel);
        };

        updateLevel();
      }

      console.log('✅ Audio analyzer started');
    } catch (err) {
      console.error('Failed to start audio analyzer:', err);
    }
  };

  const stopAnalyzer = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    if (streamRef.current && !stream) {
      // Only stop the stream if we created it (not passed in)
      streamRef.current.getTracks().forEach(track => track.stop());
    }

    streamRef.current = null;
    analyserRef.current = null;
    setIsActive(false);
  };

  useEffect(() => {
    if (autoStart || stream) {
      startAnalyzer(stream || undefined);
    }

    return () => {
      stopAnalyzer();
    };
  }, [autoStart, stream]);

  return {
    audioContextRef,
    analyserRef,
    isActive,
    startAnalyzer,
    stopAnalyzer
  };
}

// Scrolling waveform visualizer
export function VoiceVisualizerWaveform({
  autoStart = false,
  onLevel,
  stream,
  className = '',
}: BaseVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const { analyserRef, isActive } = useAudioAnalyzer(stream, autoStart, onLevel);

  useEffect(() => {
    if (!isActive || !analyserRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.fftSize;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!analyserRef.current || !canvasRef.current) return;

      animationFrameRef.current = requestAnimationFrame(draw);

      analyser.getByteTimeDomainData(dataArray);

      // Optional: handle high-DPI
      const dpr = window.devicePixelRatio || 1;
      const logicalWidth = canvas.clientWidth || canvas.width;
      const logicalHeight = canvas.clientHeight || canvas.height;
      if (canvas.width !== logicalWidth * dpr || canvas.height !== logicalHeight * dpr) {
        canvas.width = logicalWidth * dpr;
        canvas.height = logicalHeight * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }

      // Clear
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, logicalWidth, logicalHeight);

      // Center line
      ctx.strokeStyle = '#1A1A1A';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, logicalHeight / 2);
      ctx.lineTo(logicalWidth, logicalHeight / 2);
      ctx.stroke();

      // Waveform
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.shadowBlur = 4;
      ctx.shadowColor = '#FFFFFF';

      ctx.beginPath();
      const sliceWidth = logicalWidth / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0; // ~0..2
        const y = (v * logicalHeight) / 2; // center around midline

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

    draw();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isActive, analyserRef]);

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={100}
      className={`w-full h-[100px] bg-black rounded-xl border-2 border-neutral-700 ${className}`}
    />
  );
}

// Frequency bars visualizer (scrolling)
export function VoiceVisualizerBars({ 
  autoStart = false, 
  onLevel, 
  stream, 
  className = '', 
  barCount = 64 
}: VoiceVisualizerBarsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const barHistoryRef = useRef<number[]>([]);
  const { analyserRef, isActive } = useAudioAnalyzer(stream, autoStart, onLevel);

  useEffect(() => {
    if (!isActive || !analyserRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    // Initialize bar history
    barHistoryRef.current = new Array(barCount).fill(0);
    
    let frameCount = 0;

    const draw = () => {
      if (!analyserRef.current || !canvasRef.current) return;
      
      animationFrameRef.current = requestAnimationFrame(draw);
      
      frameCount++;
      
      // Only update every 6 frames for slower scroll
      if (frameCount % 6 !== 0) {
        return;
      }
      
      // Get frequency data
      analyser.getByteFrequencyData(dataArray);
      
      // Sample average volume from frequency data
      let sum = 0;
      for (let i = 0; i < Math.min(bufferLength, 50); i++) {
        sum += dataArray[i];
      }
      const avgValue = sum / Math.min(bufferLength, 50);
      
      // Add new bar to history and remove oldest
      barHistoryRef.current.push(avgValue);
      barHistoryRef.current.shift();
      
      redrawBars();
    };
    
    const redrawBars = () => {
      if (!canvasRef.current) return;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d', { alpha: false });
      if (!ctx) return;
      
      // Disable smoothing for crisp rendering
      ctx.imageSmoothingEnabled = false;
      
      // Clear canvas
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw center line
      const centerY = canvas.height / 2;
      ctx.strokeStyle = '#1A1A1A';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(canvas.width, centerY);
      ctx.stroke();
      
      // Calculate bar dimensions - thinner and tighter
      const barWidth = (canvas.width / barCount) * 0.5; // Thinner bars (50% instead of 80%)
      const barGap = (canvas.width / barCount) * 0.5; // Tighter spacing
      
      // Solid primary green - no opacity changes
      ctx.fillStyle = '#199D67';
      
      // Draw bars from history (scrolling right to left)
      for (let i = 0; i < barHistoryRef.current.length; i++) {
        const value = barHistoryRef.current[i];
        
        // Smaller, sleeker bars (reduced amplification)
        const barHeight = (value / 255) * (canvas.height / 2) * 0.6;
        
        // Draw bar from center, extending both up and down
        const x = i * (barWidth + barGap);
        const yTop = centerY - barHeight;
        
        ctx.fillRect(x, yTop, barWidth, barHeight * 2);
      }
    };

    draw();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      barHistoryRef.current = [];
    };
  }, [isActive, analyserRef, barCount]);

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={100}
      className={`w-full h-[100px] bg-black rounded-xl border-2 border-neutral-700 ${className}`}
      style={{ imageRendering: 'pixelated' }}
    />
  );
}

// VU Meter component
export function VUMeter({ level = 0, className = '' }: { level: number; className?: string }) {
  // Convert 0-1 level to decibels for display
  const db = level > 0 ? 20 * Math.log10(level) : -Infinity;
  const dbClamped = Math.max(-60, Math.min(0, db)); // Clamp to -60dB to 0dB range
  const percentage = ((dbClamped + 60) / 60) * 100; // Convert to 0-100%

  // Color based on level
  const getColor = () => {
    if (percentage > 90) return 'bg-red-500';
    if (percentage > 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className={`flex items-center gap-4 p-4 rounded-xl bg-black border-2 border-neutral-700 ${className}`}>
      <span className="text-sm text-neutral-400 font-mono w-16">VU</span>
      <div className="flex-1 h-8 bg-neutral-900 rounded-lg overflow-hidden relative">
        {/* Background marks */}
        <div className="absolute inset-0 flex">
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className="flex-1 border-r border-neutral-800"
              style={{ opacity: i % 2 === 0 ? 1 : 0.3 }}
            />
          ))}
        </div>
        
        {/* Level bar */}
        <div
          className={`h-full transition-all duration-100 ${getColor()}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-sm text-neutral-400 font-mono w-16 text-right">
        {db === -Infinity ? '-∞' : `${Math.round(db)}dB`}
      </span>
    </div>
  );
}

// Default export - waveform visualizer
export default function VoiceVisualizer({ autoStart = false, onLevel, stream, className = '' }: BaseVisualizerProps) {
  return <VoiceVisualizerWaveform autoStart={autoStart} onLevel={onLevel} stream={stream} className={className} />;
}

