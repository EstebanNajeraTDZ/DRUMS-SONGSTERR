import React from 'react';

export const DrumNotationCard: React.FC = () => {
  return (
    <div className="notation-wrapper">
      <div className="notation-card-header">
        <div className="notation-title-group">
          <span className="notation-title">DRUM NOTATION</span>
          <span className="notation-badge">PARTITURA PROFESIONAL</span>
        </div>
        <div className="notation-controls">
          <button
            id="toggle-scroll-mode-btn"
            className="notation-btn active"
            title="Alternar entre Pista Continua (Guitar Hero / Scroll suave) y Compás Fijo"
          >
            🎮 GUITAR HERO: ON
          </button>
          <button id="toggle-cursor-btn" className="notation-btn active">
            CURSOR: ON
          </button>
          <button id="toggle-sticking-btn" className="notation-btn active">
            STICKING: ON
          </button>
          <button id="toggle-legend-btn" className="notation-btn" title="Ver guía de notación Songsterr">
            📋 LEYENDA NOTAS
          </button>
        </div>
      </div>
      <div className="notation-canvas-container">
        <canvas id="notation-canvas" width={1280} height={175}></canvas>
      </div>

      {/* Songsterr Drum Notation Visual Guide Panel */}
      <div id="songsterr-legend-panel" className="songsterr-legend-panel hidden">
        <div className="legend-header">
          <div className="legend-title-wrapper">
            <span className="legend-title">📖 GUÍA OFICIAL DE NOTACIÓN SONGSTERR (DRUM KEY COMPLETA)</span>
            <span className="legend-subtitle">Mapeo 1:1 de las 71 notaciones, cabezas de nota y posiciones de pentagrama</span>
          </div>
          <button id="close-legend-btn" className="close-legend-btn">&times;</button>
        </div>

        {/* SECTION 1: BATERÍA ACÚSTICA */}
        <div className="legend-main-section">
          <div className="legend-section-heading">🥁 BATERÍA ACÚSTICA & PLATOS (DONNER DED-300X)</div>
          <div className="legend-grid">
            <div className="legend-category">
              <span className="cat-title">BOMBO (KICK)</span>
              <div className="legend-items">
                <div className="legend-item"><span className="legend-sym kick">●</span> <span className="legend-desc"><strong>Normal:</strong> Óvalo espacio 1 (Pie K)</span></div>
                <div className="legend-item"><span className="legend-sym kick">●</span> <span className="legend-desc"><strong>Acústico:</strong> Óvalo línea adic. inferior (K)</span></div>
              </div>
            </div>

            <div className="legend-category">
              <span className="cat-title">CAJA (SNARE)</span>
              <div className="legend-items">
                <div className="legend-item"><span className="legend-sym snare">●</span> <span className="legend-desc"><strong>Normal:</strong> Óvalo en espacio 3 (L/R)</span></div>
                <div className="legend-item"><span className="legend-sym snare">◇</span> <span className="legend-desc"><strong>Rimshot:</strong> Diamante en espacio 3</span></div>
                <div className="legend-item"><span className="legend-sym snare">×</span> <span className="legend-desc"><strong>Golpe de aro:</strong> Cruz en espacio 3</span></div>
              </div>
            </div>

            <div className="legend-category">
              <span className="cat-title">CHARLES (HI-HAT)</span>
              <div className="legend-items">
                <div className="legend-item"><span className="legend-sym hihat">×</span> <span className="legend-desc"><strong>Cerrado:</strong> Cruz arriba pentagrama (R/L)</span></div>
                <div className="legend-item"><span className="legend-sym hihat">⊗</span> <span className="legend-desc"><strong>Abierto:</strong> Círculo con cruz (R/L)</span></div>
                <div className="legend-item"><span className="legend-sym hihat">⊘</span> <span className="legend-desc"><strong>Semiabierto:</strong> Círculo con barra (R/L)</span></div>
                <div className="legend-item"><span className="legend-sym hihat">×</span> <span className="legend-desc"><strong>De pedal:</strong> Cruz bajo pentagrama (F)</span></div>
              </div>
            </div>

            <div className="legend-category">
              <span className="cat-title">TOMS (1, 2, 3)</span>
              <div className="legend-items">
                <div className="legend-item"><span className="legend-sym tom1">●</span> <span className="legend-desc"><strong>Tom Agudo (1):</strong> Línea 4 / Espacio 4</span></div>
                <div className="legend-item"><span className="legend-sym tom2">●</span> <span className="legend-desc"><strong>Tom Medio (2):</strong> Línea 3</span></div>
                <div className="legend-item"><span className="legend-sym tom3">●</span> <span className="legend-desc"><strong>Tom de Piso (3):</strong> Línea 2 / Espacio 2</span></div>
              </div>
            </div>

            <div className="legend-category">
              <span className="cat-title">CRASH 1 & CRASH 2</span>
              <div className="legend-items">
                <div className="legend-item"><span className="legend-sym crash">×</span> <span className="legend-desc"><strong>Crash 1 (Medio):</strong> Línea adic. 1 superior</span></div>
                <div className="legend-item"><span className="legend-sym crash2">×</span> <span className="legend-desc"><strong>Crash 2 (Agudo):</strong> Línea adic. 2 superior (Mano R)</span></div>
                <div className="legend-item"><span className="legend-sym crash">×′</span> <span className="legend-desc"><strong>Apagado (Choke):</strong> Cruz con marca de mute</span></div>
              </div>
            </div>

            <div className="legend-category">
              <span className="cat-title">PLATO RIDE</span>
              <div className="legend-items">
                <div className="legend-item"><span className="legend-sym ride">×</span> <span className="legend-desc"><strong>Plato (Bow):</strong> Cruz sobre línea 5</span></div>
                <div className="legend-item"><span className="legend-sym ride">◇</span> <span className="legend-desc"><strong>Campana (Bell):</strong> Diamante en línea 5</span></div>
                <div className="legend-item"><span className="legend-sym ride">×~</span> <span className="legend-desc"><strong>Borde (Edge):</strong> Cruz con tilde curva</span></div>
              </div>
            </div>

            <div className="legend-category">
              <span className="cat-title">SPLASH & CHINA</span>
              <div className="legend-items">
                <div className="legend-item"><span className="legend-sym crash">×</span> <span className="legend-desc"><strong>Splash:</strong> Cruz alta (Abierto/Apagado)</span></div>
                <div className="legend-item"><span className="legend-sym china">⨝</span> <span className="legend-desc"><strong>China:</strong> Doble cruz reloj de arena</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: ELECTRÓNICA & PERCUSIÓN */}
        <div className="legend-main-section">
          <div className="legend-section-heading">⚡ ELECTRÓNICA & PERCUSIÓN LATINA / ORQUESTAL</div>
          <div className="legend-grid">
            <div className="legend-category">
              <span className="cat-title">ELECTRÓNICA</span>
              <div className="legend-items">
                <div className="legend-item"><span className="legend-sym snare">◇</span> <span className="legend-desc"><strong>Caja Electrónica / Clic:</strong> Diamante</span></div>
                <div className="legend-item"><span className="legend-sym hihat">×</span> <span className="legend-desc"><strong>Scratch Push/Pull / Clic:</strong> Cruz</span></div>
                <div className="legend-item"><span className="legend-sym tom3">●</span> <span className="legend-desc"><strong>Slap:</strong> Óvalo línea 2</span></div>
                <div className="legend-item"><span className="legend-sym perc">◇/×</span> <span className="legend-desc"><strong>Metrónomo:</strong> Clic (×) / Campana (◇)</span></div>
              </div>
            </div>

            <div className="legend-category">
              <span className="cat-title">CAMPANAS & METALES</span>
              <div className="legend-items">
                <div className="legend-item"><span className="legend-sym perc">▲</span> <span className="legend-desc"><strong>Cencerro (Cowbell):</strong> Grave, Normal, Agudo</span></div>
                <div className="legend-item"><span className="legend-sym perc">▲</span> <span className="legend-desc"><strong>Agogó:</strong> Agudo & Grave (Triángulo)</span></div>
                <div className="legend-item"><span className="legend-sym perc">▲</span> <span className="legend-desc"><strong>Pandereta:</strong> Triángulo en espacio 3</span></div>
                <div className="legend-item"><span className="legend-sym perc">×/●</span> <span className="legend-desc"><strong>Triángulo:</strong> Apagado (×) / Abierto (●)</span></div>
              </div>
            </div>

            <div className="legend-category">
              <span className="cat-title">TAMBORES LATINOS</span>
              <div className="legend-items">
                <div className="legend-item"><span className="legend-sym tom1">●</span> <span className="legend-desc"><strong>Bongó:</strong> Agudo & Grave (Óvalos)</span></div>
                <div className="legend-item"><span className="legend-sym perc">×/●</span> <span className="legend-desc"><strong>Conga:</strong> Apagado (×) / Abierto (●)</span></div>
                <div className="legend-item"><span className="legend-sym tom1">●</span> <span className="legend-desc"><strong>Timbal:</strong> Agudo & Grave</span></div>
                <div className="legend-item"><span className="legend-sym tom3">×/●</span> <span className="legend-desc"><strong>Surdo:</strong> Apagado (×) / Abierto (●)</span></div>
              </div>
            </div>

            <div className="legend-category">
              <span className="cat-title">EFECTOS & MADERA</span>
              <div className="legend-items">
                <div className="legend-item"><span className="legend-sym perc">▲</span> <span className="legend-desc"><strong>Caja China (Woodblock):</strong> Agudo & Grave</span></div>
                <div className="legend-item"><span className="legend-sym perc">■</span> <span className="legend-desc"><strong>Castañuelas:</strong> Cuadrado (■)</span></div>
                <div className="legend-item"><span className="legend-sym perc">●</span> <span className="legend-desc"><strong>Claves, Cascabel, Shaker, Güiro:</strong> Óvalo</span></div>
                <div className="legend-item"><span className="legend-sym perc">◇</span> <span className="legend-desc"><strong>Maracas & Vibraslap:</strong> Diamante</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
