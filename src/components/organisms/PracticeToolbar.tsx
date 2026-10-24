import React from 'react';

export const PracticeToolbar: React.FC = () => {
  return (
    <div className="practice-toolbar">
      {/* Row 1: Practice Mode & Chunking + Auto-Advance + Sidebar Button */}
      <div className="toolbar-row practice-mode-row">
        <div className="toolbar-item-group">
          <span className="section-label">MODO PRÁCTICA:</span>
          <div className="chunk-buttons">
            <button className="chunk-size-btn" data-size="1" id="chunk-1-btn">
              1 Compás
            </button>
            <button className="chunk-size-btn" data-size="2" id="chunk-2-btn">
              2 Compases
            </button>
            <button className="chunk-size-btn" data-size="4" id="chunk-4-btn">
              4 Compases
            </button>
            <button className="chunk-size-btn active" data-size="0" id="chunk-cont-btn">
              Continuo
            </button>
          </div>
        </div>

        <div className="toolbar-item-group">
          <label className="toggle-control" title="Avanza automáticamente al compás siguiente">
            <input type="checkbox" id="auto-advance-toggle" defaultChecked />
            <span className="toggle-slider"></span>
            <span className="toggle-text">Auto-Avanzar</span>
          </label>
          <button id="toggle-sidebar-nav-btn" className="btn btn-secondary-subtle sidebar-open-btn" title="Mostrar u ocultar la partitura completa">
            📖 Partitura Completa
          </button>
        </div>
      </div>

      {/* Row 2: Measure Navigator (Arrows, Readout, Full-Width Scrubber) */}
      <div className="toolbar-row measure-nav-row">
        <div className="measure-stepper-wrap">
          <button id="prev-measure-btn" className="nav-arrow-btn" title="Compás Anterior (Flecha Izquierda)">
            ◀
          </button>
          <div className="measure-readout">
            <span className="meas-tag">COMPÁS</span>
            <span id="current-measure-num" className="meas-curr">1</span>
            <span className="meas-slash">/</span>
            <span id="total-measures-display" className="meas-total">1</span>
          </div>
          <button id="next-measure-btn" className="nav-arrow-btn" title="Compás Siguiente (Flecha Derecha)">
            ▶
          </button>
        </div>
        <div className="measure-slider-wrap">
          <input
            type="range"
            id="measure-slider"
            min="0"
            max="0"
            defaultValue="0"
            className="measure-slider-bar"
            title="Desliza para moverte a cualquier compás de la canción"
          />
        </div>
      </div>

      {/* Row 3: Song Sections & Kit Sound & Options */}
      <div className="toolbar-row settings-row">
        <div className="toolbar-item-group">
          <span className="section-label">SECCIÓN:</span>
          <select id="section-select" className="custom-select" title="Saltar a una sección"></select>
        </div>

        <div className="toolbar-item-group">
          <span className="section-label">KIT SONIDO:</span>
          <select id="drum-kit-select" className="custom-select" title="Selecciona el set de sonido de tu batería" defaultValue="original">
            <option value="original">🥁 Acústico Studio (Samples Reales)</option>
            <option value="rock">🎸 Rock & Heavy Punch</option>
            <option value="jazz">🎷 Jazz Vintage Bop</option>
            <option value="electronic">⚡ Electro 808</option>
            <option value="donner_direct">🎧 Audio Directo Consola Donner</option>
          </select>
        </div>

        <div className="toolbar-item-group">
          <span className="section-label">MANO GUÍA:</span>
          <select id="handedness-select" className="custom-select small" defaultValue="right">
            <option value="right">Diestro (R-Lead)</option>
            <option value="left">Zurdo (L-Lead)</option>
          </select>
          <label className="toggle-control" title="Escuchar sonido de batería de la canción">
            <input type="checkbox" id="drum-audio-toggle" defaultChecked />
            <span className="toggle-slider"></span>
            <span className="toggle-text">Pista Batería</span>
          </label>
        </div>
      </div>
    </div>
  );
};
