import React from 'react';

export const LegacyModals: React.FC = () => {
  return (
    <>
      {/* Academy & Lessons Modal */}
      <div id="academy-modal" className="modal-overlay">
        <div className="modal-content academy-modal-box">
          <div className="modal-header">
            <div className="modal-title-wrap">
              <h3>🎓 Academia de Batería DED-300X</h3>
              <p>Rudimentos Fundamentales (PAS 40), Fills Profesionales y Grooves de Coordinación con bucle aislado de práctica.</p>
            </div>
            <button id="close-academy-modal-btn" className="modal-close-btn">&times;</button>
          </div>

          {/* Categories Filter Tabs */}
          <div className="academy-category-tabs">
            <button className="academy-tab-btn active" data-category="all">Todos</button>
            <button className="academy-tab-btn" data-category="Rudimentos Fundamentales">🥁 Rudimentos (PAS 40)</button>
            <button className="academy-tab-btn" data-category="Fills & Redobles">💥 Fills & Redobles</button>
            <button className="academy-tab-btn" data-category="Grooves & Independencia">🎵 Grooves & Independencia</button>
          </div>

          {/* Lessons Grid Container */}
          <div className="academy-lessons-scroll">
            <div id="academy-lessons-container" className="academy-lessons-grid">
              <div className="loading-hint">Cargando lecciones profesionales...</div>
            </div>
          </div>
        </div>
      </div>

      {/* Songsterr Search & Presets Modal */}
      <div id="songsterr-modal" className="modal-overlay">
        <div className="modal-content">
          <div className="modal-header">
            <div className="modal-title-wrap">
              <h3>Descargar Partituras de Songsterr</h3>
              <p>Busca cualquier canción por nombre, artista o pega directamente el enlace de Songsterr</p>
            </div>
            <button id="close-modal-btn" className="modal-close-btn">&times;</button>
          </div>

          <div className="modal-search-bar">
            <input type="text" id="song-search-input" placeholder="Ej: Hoobastank The Reason, Smells Like Teen Spirit, o URL de Songsterr..." />
            <button id="song-search-btn" className="btn btn-primary">Buscar</button>
          </div>

          {/* Featured Presets */}
          <div className="presets-section">
            <span className="presets-label">EJERCICIOS & CANCIONES DESTACADAS:</span>
            <div id="presets-list-container" className="presets-chips-wrap">
              {/* Populated dynamically */}
            </div>
          </div>

          <div className="modal-results-container">
            <span className="results-header">RESULTADOS DE SONGSTERR:</span>
            <div id="search-results-list" className="search-results-list">
              <div className="search-hint">Escribe una canción o selecciona un ejercicio arriba para comenzar.</div>
            </div>
          </div>
        </div>
      </div>

      {/* MIDI Diagnostic & Settings Modal */}
      <div id="midi-diagnostic-modal" className="modal-overlay">
        <div className="modal-content midi-modal-box">
          <div className="modal-header">
            <div className="modal-title-wrap">
              <h3>🎹 Diagnóstico y Conexión MIDI USB</h3>
              <p>Conexión, prueba en tiempo real y detección para tu Donner DED-300X</p>
            </div>
            <button id="close-midi-modal-btn" className="modal-close-btn">&times;</button>
          </div>

          {/* Insecure context alert if accessed via network IP without HTTPS */}
          <div id="midi-insecure-warning" className="midi-insecure-alert hidden">
            <span className="alert-icon">⚠️</span>
            <div className="alert-text">
              <strong>Atención: Estás accediendo por dirección IP de red.</strong><br />
              Por seguridad, los navegadores (Chrome, Edge) <em>bloquean</em> el acceso al puerto USB-MIDI a menos que la página esté en <code>localhost</code> o con <code>HTTPS</code>.<br />
              <strong>Solución:</strong> Abre el programa directamente en la computadora donde tienes conectada la batería mediante <code>iniciar.bat</code> (en <code>http://localhost:5000</code>).
            </div>
          </div>

          <div className="midi-modal-body">
            {/* Status & Re-scan bar */}
            <div className="midi-status-toolbar">
              <div className="status-summary">
                <span id="modal-midi-dot" className="status-dot offline"></span>
                <span id="modal-midi-status-text">Buscando puertos MIDI USB...</span>
              </div>
              <button id="rescan-midi-btn" className="btn btn-primary-compact">
                🔄 Re-escanear / Solicitar Permiso
              </button>
            </div>

            {/* Input Port Selector */}
            <div className="midi-device-selector-group">
              <label htmlFor="midi-input-select" className="midi-label">ENTRADA MIDI SELECCIONADA:</label>
              <div className="select-row">
                <select id="midi-input-select" className="custom-select full-width">
                  <option value="all">Escuchar todas las entradas (Recomendado)</option>
                </select>
              </div>
            </div>

            {/* Live MIDI Monitor Console */}
            <div className="midi-monitor-section">
              <div className="monitor-header">
                <span className="monitor-title">📡 MONITOR DE GOLPES EN TIEMPO REAL:</span>
                <span className="monitor-hint">Golpea cualquier pad o pedal de tu Donner para probar</span>
                <button id="clear-midi-log-btn" className="btn-text-clear">Limpiar</button>
              </div>
              <div id="midi-live-console" className="midi-live-console">
                <div className="console-empty-hint">Esperando golpes de la batería...</div>
              </div>
            </div>

            {/* Pad Mapping Quick Reference */}
            <div className="midi-mapping-section">
              <span className="mapping-title">MAPEO ESTÁNDAR DONNER DED-300X:</span>
              <div className="midi-pads-grid">
                <div className="midi-pad-chip"><span className="pad-name">Bombo (Kick)</span> <span className="pad-note">Nota 36</span></div>
                <div className="midi-pad-chip"><span className="pad-name">Caja (Snare)</span> <span className="pad-note">Nota 38 / 40</span></div>
                <div className="midi-pad-chip"><span className="pad-name">Hi-Hat Cerrado</span> <span className="pad-note">Nota 42</span></div>
                <div className="midi-pad-chip"><span className="pad-name">Hi-Hat Pedal</span> <span className="pad-note">Nota 44</span></div>
                <div className="midi-pad-chip"><span className="pad-name">Hi-Hat Abierto</span> <span className="pad-note">Nota 46</span></div>
                <div className="midi-pad-chip"><span className="pad-name">Tom 1 (Agudo)</span> <span className="pad-note">Nota 48</span></div>
                <div className="midi-pad-chip"><span className="pad-name">Tom 2 (Medio)</span> <span className="pad-note">Nota 45</span></div>
                <div className="midi-pad-chip"><span className="pad-name">Tom 3 (Piso)</span> <span className="pad-note">Nota 41 / 43</span></div>
                <div className="midi-pad-chip"><span className="pad-name">Crash</span> <span className="pad-note">Nota 49 / 57</span></div>
                <div className="midi-pad-chip"><span className="pad-name">Plato Ride</span> <span className="pad-note">Nota 51 / 53</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Calibration Wizard Modal */}
      <div id="calibration-modal" className="modal-overlay">
        <div className="modal-content calibration-modal-card">
          <div className="modal-header">
            <div className="modal-title-wrap">
              <h3>🎯 ASISTENTE DE CALIBRACIÓN DONNER DED-300X</h3>
              <p>Golpea cada elemento de tu batería para calibrar notas, aros y pedales con máxima precisión.</p>
            </div>
            <button id="close-calib-modal-btn" className="modal-close-btn">&times;</button>
          </div>

          <div className="calib-progress-section">
            <div className="calib-progress-track">
              <div id="calib-progress-bar" className="calib-progress-fill" style={{ width: '0%' }}></div>
            </div>
            <span id="calib-step-counter" className="calib-counter">Paso 1 de 11</span>
          </div>

          <div id="calib-step-container" className="calib-step-container">
            <div className="calib-step-card">
              <div id="calib-step-icon" className="calib-icon">🥁</div>
              <h2 id="calib-step-title" className="calib-step-heading">Bombo / Kick</h2>
              <p id="calib-step-prompt" className="calib-prompt">Pisa el pedal del Bombo con fuerza media o normal</p>
              
              <div id="calib-step-feedback" className="calib-feedback-box waiting">
                <span className="pulse-dot"></span> Esperando golpe en la batería...
              </div>
            </div>
          </div>

          <div className="calib-footer-actions">
            <button id="calib-reset-factory-btn" className="btn btn-secondary-subtle">
              ↺ Restaurar Fábrica
            </button>
            <div className="calib-right-btns">
              <button id="calib-skip-btn" className="btn btn-secondary">
                Saltar este pad ➔
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Loading Overlay */}
      <div id="loading-overlay" className="loading-overlay">
        <div className="loading-spinner-box">
          <div className="spinner-ring"></div>
          <div id="loading-msg" className="loading-text">Cargando...</div>
        </div>
      </div>
    </>
  );
};
