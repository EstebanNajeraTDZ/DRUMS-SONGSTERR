import React from 'react';

export interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (val: number) => void;
  className?: string;
}

export const Slider: React.FC<SliderProps> = ({
  value,
  min,
  max,
  step = 1,
  onChange,
  className = '',
  ...props
}) => {
  const percentage = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));

  return (
    <div className={`relative flex items-center w-full ${className}`}>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-[var(--color-bg-elevated)] rounded-lg appearance-none cursor-pointer focus:outline-none accent-[var(--color-brand-primary)]"
        style={{
          background: `linear-gradient(to right, var(--color-brand-primary) 0%, var(--color-brand-primary) ${percentage}%, var(--color-bg-elevated) ${percentage}%, var(--color-bg-elevated) 100%)`,
        }}
        {...props}
      />
    </div>
  );
};
