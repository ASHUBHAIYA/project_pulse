import React from 'react';

interface ProgressRingProps {
  progress: number; // 0 to 100
  size?: number;
  strokeWidth?: number;
  color?: string; // hex or tailwind class color
  trackColor?: string;
  showText?: boolean;
  textSize?: string;
  subtitle?: string;
  className?: string;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  progress,
  size = 56,
  strokeWidth = 5,
  color = '#10b981',
  trackColor = 'rgba(255, 255, 255, 0.08)',
  showText = true,
  textSize = 'text-xs',
  subtitle,
  className = '',
}) => {
  const clampedProgress = Math.min(100, Math.max(0, Math.round(progress)));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clampedProgress / 100) * circumference;

  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{
            transition: 'stroke-dashoffset 400ms cubic-bezier(0.16, 1, 0.3, 1), stroke 300ms ease',
          }}
        />
      </svg>
      {showText && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none pointer-events-none">
          <span className={`font-mono font-semibold tabular-nums ${textSize} text-slate-100 leading-none`}>
            {clampedProgress}%
          </span>
          {subtitle && (
            <span className="text-[9px] text-slate-400 mt-0.5 tracking-tight uppercase leading-none">
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
