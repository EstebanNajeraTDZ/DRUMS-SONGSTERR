import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useStudio } from '../../context/StudioContext';

export interface AppHeaderProps {
  onOpenMenu: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ onOpenMenu }) => {
  const { mode, toggleMode, currentPalette } = useTheme();
  const { setIsCustomScoreModalOpen } = useStudio();

  return (
    <header className="app-header">
      <div className="header-left">
        {/* Burger Button for New Lateral Menu */}
        <button
          id="open-lateral-menu-btn"
          onClick={onOpenMenu}
          className="btn btn-secondary-subtle"
          style={{ padding: '8px 12px', fontSize: '16px' }}
          title="Abrir Menú Lateral de Opciones & Ajustes"
        >
          ☰
        </button>

        <div className="brand-logo">
          <span className="logo-icon">⚡</span>
          <div className="logo-text">
            <span className="brand-title">DONNER DED-300X</span>
            <span className="brand-sub">STUDIO & PRACTICER</span>
          </div>
        </div>

        <div className="current-track-badge" title="Canción actualmente cargada">
          <span className="track-label">CANCION:</span>
          <span id="song-title" className="track-title">
            Cargando...
          </span>
          <span className="track-sep">•</span>
          <span id="song-artist" className="track-artist">
            ...
          </span>
        </div>
      </div>

      <div className="header-right">
        {/* Quick Theme Badge & Dark/Light Toggle Button */}
        <div className="flex items-center gap-1.5" style={{ display: 'inline-flex', gap: '6px' }}>
          <button
            id="toggle-dark-light-btn"
            onClick={toggleMode}
            className="btn btn-secondary-subtle"
            style={{ padding: '6px 12px', fontSize: '13px', fontWeight: 700 }}
            title={`Cambiar a modo ${mode === 'dark' ? 'Claro' : 'Oscuro'}`}
          >
            {mode === 'dark' ? '🌙 Dark' : '☀️ Light'}
          </button>

          <span
            className="hidden sm:inline-block"
            style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '4px 10px',
              borderRadius: '9999px',
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-surface-elevated)',
              color: 'var(--text-secondary)',
            }}
            title="Paleta activa"
          >
            {currentPalette.name.split(' ')[0]}
          </span>
        </div>

        {/* MIDI Status Indicator */}
        <div id="midi-status-badge" className="midi-status-card" title="Estado de conexión Donner DED-300X">
          <span id="midi-status-indicator" className="status-dot offline"></span>
          <span id="midi-status-text">Buscando Donner DED-300X...</span>
        </div>

        {/* Custom Score Creator Button */}
        <button
          id="open-custom-score-btn"
          onClick={() => setIsCustomScoreModalOpen(true)}
          className="btn btn-secondary-subtle"
          style={{ padding: '7px 12px', fontSize: '13px', fontWeight: 800, color: 'var(--color-brand-primary)' }}
          title="Crear partitura o ejercicio personalizado definiendo compás, tiempos y subdivisiones"
        >
          <span>➕ Crear Partitura</span>
        </button>

        {/* Academy & Lessons Button */}
        <button
          id="open-academy-btn"
          className="btn btn-academy"
          title="Biblioteca de Rudimentos (PAS 40), Fills Icónicos y Grooves de Coordinación"
        >
          <span>🎓 Academia</span>
        </button>

        {/* Songsterr Search Button */}
        <button id="open-search-modal-btn" className="btn btn-primary">
          <span>🔍 Buscar Canción</span>
        </button>

        {/* Header Mobile Fast Actions */}
        <button id="header-search-btn" className="btn btn-primary header-mobile-btn" title="Buscar canción">
          🔍
        </button>
        <button id="header-sidebar-btn" className="btn btn-secondary header-mobile-btn" title="Ver Partitura Completa">
          📖
        </button>

        {/* Export Buttons */}
        <div className="export-group">
          <button id="export-midi-btn" className="btn btn-secondary" title="Descargar pista en formato MIDI para tu DAW">
            <span>⬇ MIDI</span>
          </button>
          <button id="export-gp5-btn" className="btn btn-secondary" title="Descargar archivo Guitar Pro 5 (.gp5)">
            <span>⬇ GP5</span>
          </button>
        </div>
      </div>
    </header>
  );
};
