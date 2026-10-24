import React from 'react';

export const AudioController: React.FC = () => {
  return (
    <div className="songsterr-audio-controller">
      {/* Segment 1: Track Audio Source Dropdown & Mode */}
      <div className="audio-ctrl-card source-card">
        <div className="ctrl-card-title">🎵 PISTA DE AUDIO & VIDEO</div>
        <div className="source-select-wrapper">
          <span className="source-icon">🎧</span>
          <select id="audio-source-select" className="songsterr-dropdown" title="Selecciona la pista de audio de Songsterr">
            <option value="full">Mezcla completa (Audio Original)</option>
            <option value="backing">Pista de acompañamiento (Sin Batería)</option>
            <option value="solo">Pista Solo (Instrumento)</option>
            <option value="synth">Sintetizador Virtual (Web Drums)</option>
          </select>
        </div>
        <div className="source-actions-row">
          <button id="toggle-yt-video-btn" className="btn btn-secondary-subtle small-btn" title="Mostrar / Ocultar pantalla de video de YouTube">
            🎬 <span id="yt-video-btn-text">Ver Video</span>
          </button>
          {/* Practice Mode Pill (CON CANCIÓN / SIN CANCIÓN) */}
          <div className="songsterr-mode-pill" title="Elige si deseas escuchar la canción original o practicar solo con tu batería y el metrónomo">
            <button id="mode-orig-btn" className="mode-pill-opt active" data-mode="orig">
              CON CANCIÓN
            </button>
            <button id="mode-synth-btn" className="mode-pill-opt" data-mode="synth">
              SIN CANCIÓN
            </button>
          </div>
        </div>
      </div>

      {/* Segment 2: Speed & Audio/Video Sync Controls */}
      <div className="audio-ctrl-card speed-sync-card">
        <div className="ctrl-card-title">⏱ VELOCIDAD & SINCRONIZACIÓN</div>
        {/* Speed Controller (50%, 75%, 100%, 125%) */}
        <div className="songsterr-speed-group" title="Velocidad de reproducción">
          <span className="speed-runner-icon">🏃</span>
          <div className="speed-buttons-pill">
            <button className="speed-opt-btn" data-speed="0.5">50%</button>
            <button className="speed-opt-btn" data-speed="0.75">75%</button>
            <button className="speed-opt-btn active" data-speed="1.0">100%</button>
            <button className="speed-opt-btn" data-speed="1.25">125%</button>
          </div>
        </div>

        {/* Audio/Songsterr Sync Offset Calibration */}
        <div id="songsterr-sync-group" className="songsterr-sync-group" title="Ajuste de sincronización entre el audio del video y la partitura">
          <div className="sync-buttons-pill">
            <button id="offset-minus-500-btn" className="sync-nudge-btn" title="Adelantar audio 500ms (-0.5s)">-0.5s</button>
            <button id="offset-minus-100-btn" className="sync-nudge-btn" title="Adelantar audio 100ms (-0.1s)">-0.1s</button>
            <button id="offset-minus-20-btn" className="sync-nudge-btn" title="Adelantar audio 20ms">-20ms</button>
            <span id="sync-offset-display" className="sync-val-badge" title="Haz clic para restablecer la sincronización a 0 ms">0 ms</span>
            <button id="offset-plus-20-btn" className="sync-nudge-btn" title="Atrasar audio 20ms">+20ms</button>
            <button id="offset-plus-100-btn" className="sync-nudge-btn" title="Atrasar audio 100ms (+0.1s)">+0.1s</button>
            <button id="offset-plus-500-btn" className="sync-nudge-btn" title="Atrasar audio 500ms (+0.5s)">+0.5s</button>
          </div>
          <button id="sync-capture-beat1-btn" className="btn btn-secondary-subtle small-btn" title="Fijar el segundo actual del video como Beat 1 para alinear intros habladas o videos con silencios">
            🎯 Fijar Beat 1
          </button>
        </div>
      </div>

      {/* Segment 3: Auto-Demo Mode & Master Volume Boost (0% - 200%) */}
      <div className="audio-ctrl-card demo-volume-card">
        <div className="ctrl-card-title">🔊 VOLUMEN & DEMO BATERÍA</div>
        <div className="demo-vol-row">
          {/* Auto Drummer / Demo Mode Button */}
          <button id="auto-demo-btn" className="btn btn-auto-demo" title="Modo Auto / Demo: Las notas suenan solas automáticamente para que escuches la batería sonar">
            <span className="demo-icon">🤖</span>
            <span id="demo-btn-text">MODO DEMO: OFF</span>
          </button>

          {/* Master Drum Volume Slider with 200% Boost */}
          <div className="volume-boost-wrapper" title="Volumen maestro de batería con Boost de hasta 200%">
            <span className="vol-icon">🔊</span>
            <input type="range" id="drum-volume-slider" min="0" max="200" defaultValue="100" className="vol-slider" />
            <span id="drum-volume-badge" className="vol-badge">100%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
