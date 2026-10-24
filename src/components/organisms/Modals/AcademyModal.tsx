import React, { useState } from 'react';
import { useStudio } from '../../../context/StudioContext';
import { LessonItem } from '../../../types';

export const AcademyModal: React.FC = () => {
  const { isAcademyModalOpen, setIsAcademyModalOpen, lessons, loadSong } = useStudio();
  const [selectedCat, setSelectedCat] = useState<string>('all');

  if (!isAcademyModalOpen) return null;

  const categories = [
    { id: 'all', label: 'Todos' },
    { id: 'Rudimentos Fundamentales', label: '🥁 Rudimentos (PAS 40)' },
    { id: 'Fills & Redobles', label: '💥 Fills & Redobles' },
    { id: 'Grooves & Independencia', label: '🎵 Grooves & Independencia' },
  ];

  const filtered =
    selectedCat === 'all'
      ? lessons
      : lessons.filter((l: LessonItem) => l.category === selectedCat || (selectedCat.includes('Rudimentos') && l.title.includes('Single')));

  const handleSelectLesson = async (id: string) => {
    setIsAcademyModalOpen(false);
    await loadSong(id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-3xl max-h-[85vh] flex flex-col rounded-2xl glass-surface border border-[var(--color-border)] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
          <div>
            <h3 className="text-base font-black tracking-wider uppercase text-[var(--color-text-main)] flex items-center gap-2">
              <span>🎓</span> Academia de Batería DED-300X
            </h3>
            <p className="text-xs text-[var(--color-text-muted)]">
              Rudimentos Fundamentales (PAS 40), Fills Profesionales y Grooves con bucle de práctica
            </p>
          </div>
          <button
            onClick={() => setIsAcademyModalOpen(false)}
            className="w-8 h-8 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border)] text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] flex items-center justify-center cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 p-3 border-b border-[var(--color-border)] bg-[var(--color-bg-elevated)]/40 overflow-x-auto">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCat(c.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
                selectedCat === c.id
                  ? 'bg-[var(--color-brand-primary)] text-slate-950 shadow-sm'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-bg-surface)]'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Lessons Grid */}
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.length === 0 ? (
            <div className="col-span-2 text-center text-xs text-[var(--color-text-muted)] py-12">
              Cargando lecciones profesionales...
            </div>
          ) : (
            filtered.map((les: LessonItem) => (
              <button
                key={les.id}
                onClick={() => handleSelectLesson(les.id)}
                className="flex flex-col p-3 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border)] hover:border-[var(--color-brand-primary)] text-left cursor-pointer transition-all hover:scale-[1.01] group"
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="text-xs font-bold text-[var(--color-text-main)] group-hover:text-[var(--color-brand-primary)] transition-colors">
                    {les.title}
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[var(--color-brand-primary)]/15 text-[var(--color-brand-primary)]">
                    {les.difficulty}
                  </span>
                </div>

                <p className="text-[11px] text-[var(--color-text-muted)] line-clamp-2 mb-2 leading-relaxed">
                  {les.description}
                </p>

                <div className="flex items-center justify-between text-[10px] font-mono text-[var(--color-text-muted)] mt-auto pt-1 border-t border-white/5">
                  <span className="text-amber-400 font-bold">{les.bpm} BPM</span>
                  <span>Sticking: {les.sticking || 'R L R L'}</span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
