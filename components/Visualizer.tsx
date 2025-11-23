
import React, { useRef, useEffect } from 'react';

interface VisualizerProps {
  analyser: AnalyserNode | null;
}

const Visualizer: React.FC<VisualizerProps> = ({ analyser }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !analyser) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Scale for high DPI devices to prevent blurriness
    const dpr = window.devicePixelRatio || 1;
    // Get actual CSS size
    const rect = canvas.getBoundingClientRect();
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    
    ctx.scale(dpr, dpr);

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    let animationId: number;

    const draw = () => {
      animationId = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      // Clear with white
      ctx.fillStyle = '#FFFFFF'; 
      ctx.fillRect(0, 0, rect.width, rect.height);

      // Draw Grid Lines (Static)
      ctx.strokeStyle = '#f0f0f0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for(let j=0; j<rect.width; j+=20) { ctx.moveTo(j,0); ctx.lineTo(j, rect.height); }
      ctx.stroke();

      const barWidth = (rect.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      ctx.fillStyle = '#000000'; // Black bars

      for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * rect.height;
        ctx.fillRect(x, rect.height - barHeight, barWidth, barHeight);
        x += barWidth + 1;
      }
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [analyser]);

  return (
    <div className="w-full h-full border border-black p-[1px] bg-white">
        <canvas 
            ref={canvasRef} 
            className="w-full h-full block"
        />
    </div>
  );
};

export default Visualizer;
