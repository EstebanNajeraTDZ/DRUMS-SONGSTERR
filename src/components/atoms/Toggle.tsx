import React from 'react';

export interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  size?: 'sm' | 'md';
  disabled?: boolean;
  id?: string;
}

export const Toggle: React.FC<ToggleProps> = ({
  checked,
  onChange,
  label,
  size = 'md',
  disabled = false,
  id,
}) => {
  const switchSizes = {
    sm: 'w-8 h-4',
    md: 'w-10 h-5',
  }[size];

  const thumbSizes = {
    sm: 'w-3 h-3 translate-x-0.5',
    md: 'w-4 h-4 translate-x-0.5',
  }[size];

  const thumbChecked = {
    sm: 'translate-x-4',
    md: 'translate-x-5',
  }[size];

  return (
    <label
      htmlFor={id}
      className={`inline-flex items-center gap-2 cursor-pointer select-none ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      <div className="relative inline-block">
        <input
          id={id}
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={(e) => !disabled && onChange(e.target.checked)}
          disabled={disabled}
        />
        <div
          className={`${switchSizes} rounded-full transition-colors duration-200 border border-[var(--color-border)] ${
            checked ? 'bg-[var(--color-brand-primary)]' : 'bg-[var(--color-bg-elevated)]'
          }`}
        >
          <div
            className={`absolute top-0.5 bg-white rounded-full shadow-md transition-transform duration-200 ${thumbSizes} ${
              checked ? thumbChecked : ''
            }`}
          />
        </div>
      </div>
      {label && (
        <span className="text-xs font-medium text-[var(--color-text-main)]">{label}</span>
      )}
    </label>
  );
};
