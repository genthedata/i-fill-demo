import React from 'react';
import './PencilLoader.css';

interface PencilLoaderProps {
  className?: string;
}

export const PencilLoader: React.FC<PencilLoaderProps> = ({ className = '' }) => {
  return (
    <div className={`flex flex-col items-center justify-center space-y-4 ${className}`}>
      <svg className="pencil" viewBox="0 0 200 200">
        <defs>
          <linearGradient id="pencilBodyGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="50%" stopColor="#1d4ed8" />
            <stop offset="100%" stopColor="#1e40af" />
          </linearGradient>
          <linearGradient id="pencilTipGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
        </defs>
        
        {/* Pencil Body - Main blue circle */}
        <g className="pencil__rotate">
          <circle 
            className="pencil__body1" 
            cx="100" 
            cy="100" 
            fill="none" 
            r="60" 
            stroke="url(#pencilBodyGradient)" 
            strokeWidth="12" 
            strokeDasharray="377 377" 
            strokeLinecap="round"
          />
          
          {/* Pencil ferrule (metal band) */}
          <circle 
            className="pencil__ferrule" 
            cx="100" 
            cy="100" 
            fill="none" 
            r="50" 
            stroke="#c0c0c0" 
            strokeWidth="4" 
            strokeDasharray="20 20" 
          />
          
          {/* Pencil tip */}
          <g className="pencil__tip">
            <polygon 
              points="100,40 110,60 90,60" 
              fill="url(#pencilTipGradient)" 
              stroke="#d97706" 
              strokeWidth="1"
            />
            <circle 
              cx="100" 
              cy="45" 
              r="2" 
              fill="#374151"
            />
          </g>
          
          {/* Eraser */}
          <g className="pencil__eraser">
            <circle 
              cx="100" 
              cy="160" 
              r="8" 
              fill="#ef4444" 
              stroke="#dc2626" 
              strokeWidth="1"
            />
          </g>
        </g>
        
        {/* Progress stroke */}
        <circle 
          className="pencil__stroke" 
          cx="100" 
          cy="100" 
          fill="none" 
          r="70" 
          stroke="hsl(var(--primary))" 
          strokeWidth="2" 
          strokeDasharray="439.82 439.82" 
          opacity="0.3"
        />
      </svg>
      <p className="text-muted-foreground text-sm">Processing transcription...</p>
    </div>
  );
};