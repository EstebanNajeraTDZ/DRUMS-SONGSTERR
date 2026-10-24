import React from 'react';
import { useStudio } from '../../context/StudioContext';

export const SequencerCard: React.FC = () => {
  const { setIsCustomScoreModalOpen } = useStudio();

  const handleQuickSave = () => {
    if (window.app && typeof window.app.saveCurrentAsCustom === 'function') {
      const name = prompt('Nombre para guardar esta partitura:', window.app.currentSong?.title || 'Mi Partitura');
      if (name) {
        window.app.saveCurrentAsCustom(name);
        alert(`¡Partitura "${name}" guardada con éxito! Podrás volver a probarla cuando quieras.`);
      }
    } else {
      setIsCustomScoreModalOpen(true);
    }
  };

  return (
    <div className="sequencer-wrapper">
      <div className="sequencer-card-header">
        <div className="seq-header-left">
          <span className="seq-header-title">🎛️ MATRIZ DE COMPÁS & NOTAS</span>
          <span className="seq-header-subtitle">
            Haz clic en una casilla para ciclar variantes (Cerrado/Semi/Abierto/etc.) • Clic derecho para borrar
          </span>
        </div>
        <div className="seq-header-controls">
          {/* Subdivisión rápida */}
          <div className="subdiv-selector-group">
            <span className="ctrl-label">SUBDIVISIÓN:</span>
            <button className="subdiv-btn" data-sub="2" title="2 golpes por pulso (Corcheas)">♪ Doble (2)</button>
            <button className="subdiv-btn" data-sub="3" title="3 golpes por pulso (Tresillos)">3️⃣ Triple (3)</button>
            <button className="subdiv-btn active" data-sub="4" title="4 golpes por pulso (Semicorcheas)">4️⃣ Cuatro (4)</button>
            <button className="subdiv-btn" data-sub="6" title="6 golpes por pulso (Sextillos - Fill Imagen 1)">6️⃣ Sextu (6)</button>
          </div>

          {/* Pulsos / Compás */}
          <div className="seq-beats-group">
            <span className="ctrl-label">COMPÁS:</span>
            <select id="seq-time-signature-select" className="custom-select small" defaultValue="4/4">
              <option value="4/4">4/4 (4 pulsos)</option>
              <option value="3/4">3/4 (3 pulsos)</option>
              <option value="6/8">6/8 (6 pulsos)</option>
              <option value="2/4">2/4 (2 pulsos)</option>
              <option value="5/4">5/4 (5 pulsos)</option>
              <option value="7/8">7/8 (7 pulsos)</option>
              <option value="12/8">12/8 (12 pulsos)</option>
            </select>
          </div>

          {/* Presets & Custom Actions */}
          <div className="seq-actions-group">
            <button
              onClick={() => setIsCustomScoreModalOpen(true)}
              className="btn btn-secondary-subtle small-btn"
              style={{ fontWeight: 800, color: 'var(--color-brand-primary)' }}
              title="Crear partitura o ejercicio personalizado desde cero"
            >
              ➕ Nueva
            </button>
            <button
              onClick={handleQuickSave}
              className="btn btn-secondary-subtle small-btn"
              style={{ fontWeight: 800, color: '#34d399' }}
              title="Guardar esta partitura con sus notas para volver a probarla en el futuro"
            >
              💾 Guardar
            </button>
            <button
              id="toggle-grid-scroll-btn"
              className="notation-btn active"
              title="Alternar entre Pista Continua (Guitar Hero / Scroll suave) y Compás Fijo en la Matriz"
            >
              🎮 GUITAR HERO: ON
            </button>
            <select id="seq-preset-patterns-select" className="custom-select small" title="Cargar patrón rítmico o fill de práctica" defaultValue="">
              <option value="" disabled>Ritmos & Fills...</option>
              <option value="fill_image1">🥁 Fill Sextuple (Imagen 1)</option>
              <option value="rock_basic">🎸 Rock Beat 4/4 (Básico)</option>
              <option value="shuffle_triplet">🎷 Shuffle Blues (Tresillos)</option>
              <option value="ballad_6_8">🎵 Balada 6/8</option>
              <option value="funk_16th">⚡ Funk Sincopado (16th)</option>
            </select>
            <button id="clear-grid-measure-btn" className="btn btn-secondary-subtle small-btn" title="Borrar todas las notas del compás">
              🗑️ Limpiar
            </button>
          </div>
        </div>
      </div>
      <div id="grid-sequencer-container" className="grid-sequencer-container">
        {/* Dynamically populated by GridSequencer engine */}
      </div>
    </div>
  );
};
