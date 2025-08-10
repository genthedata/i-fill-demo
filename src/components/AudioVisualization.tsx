import { useEffect, useRef } from "react";

interface AudioVisualizationProps {
  isActive: boolean;
}

export default function AudioVisualization({ isActive }: AudioVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    if (!isActive) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let time = 0;

    const animate = () => {
      time += 0.02;
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const maxRadius = Math.min(centerX, centerY) - 20;
      
      // Create multiple concentric circles with wave effects
      for (let ring = 0; ring < 5; ring++) {
        const baseRadius = (maxRadius / 5) * (ring + 1);
        const points = 60 + ring * 10;
        
        // Create gradient
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, maxRadius);
        gradient.addColorStop(0, `hsla(300, 100%, 70%, ${0.8 - ring * 0.15})`);
        gradient.addColorStop(0.5, `hsla(280, 100%, 60%, ${0.6 - ring * 0.1})`);
        gradient.addColorStop(1, `hsla(260, 100%, 50%, ${0.3 - ring * 0.05})`);
        
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        for (let i = 0; i <= points; i++) {
          const angle = (i / points) * Math.PI * 2;
          
          // Create wave effect with multiple frequencies
          const wave1 = Math.sin(time * 3 + angle * 4 + ring * 0.5) * 8;
          const wave2 = Math.sin(time * 2 + angle * 6 - ring * 0.3) * 5;
          const wave3 = Math.sin(time * 4 + angle * 8 + ring * 0.7) * 3;
          
          const radius = baseRadius + wave1 + wave2 + wave3;
          
          const x = centerX + Math.cos(angle) * radius;
          const y = centerY + Math.sin(angle) * radius;
          
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        
        ctx.closePath();
        ctx.stroke();
        
        // Add dots for extra visual effect
        if (ring % 2 === 0) {
          for (let i = 0; i < points; i += 3) {
            const angle = (i / points) * Math.PI * 2;
            const wave = Math.sin(time * 2 + angle * 3 + ring) * 6;
            const radius = baseRadius + wave;
            
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            
            ctx.fillStyle = `hsla(${280 + ring * 10}, 100%, 70%, ${0.7 - ring * 0.1})`;
            ctx.beginPath();
            ctx.arc(x, y, 1.5, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
      
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive]);

  if (!isActive) return null;

  return (
    <div className="flex flex-col items-center justify-center py-4 animate-fade-in">
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={200}
          height={200}
          className="drop-shadow-lg"
        />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <div className="text-sm font-medium text-primary animate-pulse">
              Listening...
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}