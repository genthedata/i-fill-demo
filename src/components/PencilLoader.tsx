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
          <clipPath id="pencil-eraser">
            <rect height="30" width="30" />
          </clipPath>
        </defs>
        <circle 
          className="pencil__stroke" 
          cx="100" 
          cy="100" 
          fill="none" 
          r="70" 
          stroke="hsl(var(--primary))" 
          strokeWidth="2" 
          strokeDasharray="439.82 439.82" 
        />
        <g className="pencil__rotate">
          <g fill="hsl(var(--accent-foreground))">
            <circle 
              className="pencil__body1" 
              cx="100" 
              cy="100" 
              fill="none" 
              r="56" 
              stroke="hsl(var(--primary))" 
              strokeWidth="5" 
              strokeDasharray="351.86 351.86" 
            />
            <circle 
              className="pencil__body2" 
              cx="100" 
              cy="100" 
              fill="none" 
              r="64.8" 
              stroke="hsl(var(--success))" 
              strokeWidth="4" 
              strokeDasharray="406.84 406.84" 
            />
            <circle 
              className="pencil__body3" 
              cx="100" 
              cy="100" 
              fill="none" 
              r="47.2" 
              stroke="hsl(var(--accent-foreground))" 
              strokeWidth="6" 
              strokeDasharray="296.88 296.88" 
            />
          </g>
          <g className="pencil__eraser" clipPath="url(#pencil-eraser)">
            <g className="pencil__eraser-skew">
              <circle 
                cx="100" 
                cy="100" 
                fill="hsl(var(--destructive))" 
                r="5" 
              />
            </g>
          </g>
          <circle 
            className="pencil__point" 
            cx="100" 
            cy="100" 
            fill="hsl(var(--primary))" 
            r="2" 
          />
        </g>
      </svg>
      <p className="text-muted-foreground text-sm">Processing transcription...</p>
    </div>
  );
};