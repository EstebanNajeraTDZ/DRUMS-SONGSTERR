import React from 'react';

export interface StatusDotProps {
  status: 'online' | 'offline' | 'warning' | 'connecting';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const StatusDot: React.FC<StatusDotProps> = ({
  status,
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
  }[size];

  const colorClasses = {
    online: 'bg-emerald-400 shadow-[0_0_8px_#34d399]',
    offline: 'bg-rose-500 shadow-[0_0_8px_#f43f5e]',
    warning: 'bg-amber-400 shadow-[0_0_8px_#fbbf24]',
    connecting: 'bg-cyan-400 animate-ping shadow-[0_0_8px_#22d3ee]',
  }[status];

  return (
    <span
      className={`inline-block rounded-full shrink-0 ${sizeClasses} ${colorClasses} ${className}`}
    />
  );
};
