import React, { useState } from 'react';
import { Button } from '../atoms/Button';

export interface SearchBarProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  isLoading?: boolean;
  className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = 'Buscar canción por nombre, artista o URL de Songsterr...',
  onSearch,
  isLoading = false,
  className = '',
}) => {
  const [val, setVal] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (val.trim()) {
      onSearch(val.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`flex items-center gap-2 w-full ${className}`}>
      <div className="relative flex-1">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--color-text-muted)] pointer-events-none">
          🔍
        </span>
        <input
          type="text"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border)] text-[var(--color-text-main)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-brand-primary)] shadow-inner transition-colors"
        />
        {val && (
          <button
            type="button"
            onClick={() => setVal('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] cursor-pointer"
          >
            ✕
          </button>
        )}
      </div>
      <Button type="submit" variant="primary" disabled={isLoading || !val.trim()}>
        {isLoading ? 'Buscando...' : 'Buscar'}
      </Button>
    </form>
  );
};
