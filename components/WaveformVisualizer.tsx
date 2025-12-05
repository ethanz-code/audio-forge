import React, { useEffect, useRef } from 'react';
import { bufferToWaveform } from '../utils/audioUtils';

interface WaveformVisualizerProps {
  buffer: AudioBuffer | null;
  height?: number;
  color?: string;
  className?: string;
}

const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({ 
  buffer, 
  height = 64, 
  color = '#d35400',
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !buffer) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    canvas.width = rect.width * dpr;
    canvas.height = height * dpr;
    
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, rect.width, height);

    const data = bufferToWaveform(buffer, 100); 
    const barWidth = rect.width / data.length;
    const gap = 2; // slightly larger gap for sketchy look

    ctx.fillStyle = color;
    
    data.forEach((val, i) => {
      const x = i * barWidth;
      const barHeight = Math.max(val * height, 4); // Min height larger
      const y = (height - barHeight) / 2;
      
      // Rounded bar with slight imperfection could be cool but expensive to render "sketchy" lines on canvas
      // Just keep it rounded
      ctx.beginPath();
      ctx.roundRect(x, y, Math.max(barWidth - gap, 2), barHeight, 4);
      ctx.fill();
    });

  }, [buffer, height, color]);

  return (
    <canvas 
      ref={canvasRef} 
      className={`w-full ${className}`} 
      style={{ height: `${height}px` }} 
    />
  );
};

export default WaveformVisualizer;