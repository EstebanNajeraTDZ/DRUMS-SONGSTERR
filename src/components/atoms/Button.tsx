import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'subtle' | 'accent' | 'danger' | 'ghost';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'icon';
  glow?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'secondary',
  size = 'md',
  glow = false,
  icon,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center font-medium transition-all duration-150 cursor-pointer select-none rounded-lg focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]';

  const sizeClasses = {
    xs: 'px-2 py-1 text-xs gap-1',
    sm: 'px-2.5 py-1.5 text-xs font-semibold gap-1.5',
    md: 'px-3.5 py-2 text-sm font-semibold gap-2',
    lg: 'px-5 py-2.5 text-base font-bold gap-2.5',
    icon: 'p-2 text-sm',
  }[size];

  const variantClasses = {
    primary:
      'bg-[var(--color-brand-primary)] text-slate-950 hover:brightness-110 font-bold border border-transparent shadow-sm',
    secondary:
      'bg-[var(--color-bg-elevated)] text-[var(--color-text-main)] hover:border-[var(--color-brand-primary)] border border-[var(--color-border)] hover:bg-[var(--color-bg-surface)]',
    subtle:
      'bg-[var(--color-bg-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] border border-[var(--color-border)] hover:border-[var(--color-brand-primary)]',
    accent:
      'bg-[var(--color-brand-secondary)] text-slate-950 hover:brightness-110 font-bold border border-transparent',
    danger:
      'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30',
    ghost:
      'bg-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-bg-surface)]',
  }[variant];

  const glowClass = glow ? 'shadow-[0_0_20px_var(--color-glow-primary)]' : '';

  return (
    <button
      className={`${baseClasses} ${sizeClasses} ${variantClasses} ${glowClass} ${className}`}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  );
};
