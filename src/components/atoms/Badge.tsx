import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'accent' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md';
  className?: string;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  dot = false,
}) => {
  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-[10px] font-semibold gap-1',
    md: 'px-2.5 py-1 text-xs font-semibold gap-1.5',
  }[size];

  const variantClasses = {
    default:
      'bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)] border border-[var(--color-border)]',
    primary:
      'bg-[var(--color-brand-primary)]/15 text-[var(--color-brand-primary)] border border-[var(--color-brand-primary)]/30',
    accent:
      'bg-[var(--color-brand-secondary)]/15 text-[var(--color-brand-secondary)] border border-[var(--color-brand-secondary)]/30',
    success:
      'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    warning:
      'bg-amber-500/15 text-amber-400 border border-amber-500/30',
    danger:
      'bg-rose-500/15 text-rose-400 border border-rose-500/30',
  }[variant];

  const dotClasses = {
    default: 'bg-slate-400',
    primary: 'bg-[var(--color-brand-primary)]',
    accent: 'bg-[var(--color-brand-secondary)]',
    success: 'bg-emerald-400',
    warning: 'bg-amber-400',
    danger: 'bg-rose-400',
  }[variant];

  return (
    <span
      className={`inline-flex items-center rounded-full tracking-wide uppercase select-none ${sizeClasses} ${variantClasses} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotClasses} animate-pulse`} />}
      {children}
    </span>
  );
};
