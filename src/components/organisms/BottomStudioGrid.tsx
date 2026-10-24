import React, { useState, useEffect } from 'react';

export const BottomStudioGrid: React.FC = () => {
  const [badgeState, setBadgeState] = useState<{ text: string; type: string; visible: boolean }>({
    text: '¡PERFECTO!',
    type: 'perfect',
    visible: false,
  });

  useEffect(() => {
    (window as any).onAccuracyBadge = (text: string, type: string) => {
      setBadgeState({ text, type, visible: true });
      clearTimeout((window as any).__badgeTimeout);
      (window as any).__badgeTimeout = setTimeout(() => {
        setBadgeState((prev) => ({ ...prev, visible: false }));
      }, 850);
    };
  }, []);

  return (
    <div className="bottom-studio-grid">
      {/* Left: Donner Kit Hit Feedback & Accuracy */}
      <div className="panel-card kit-accuracy-panel">
        <div className="panel-header kit-panel-header">
          <div className="panel-title-group">
            <span className="panel-title">⚡ DONNER DED-300X PADS & EVALUACIÓN</span>
            <span className="panel-subtitle">Haz clic en los pads o tócalos en tu batería física</span>
            <span id="console-kit-badge" className="console-kit-badge hidden">Consola: Kit #1</span>
          </div>
          <div className="panel-header-actions">
            <button id="open-calibration-btn" className="btn btn-secondary-subtle small-btn" title="Iniciar asistente guiado para calibrar cada parche y aro">
              🎯 Calibrar Batería
            </button>
            <div className="panel-kit-quickselect">
              <span className="quick-kit-label">KIT:</span>
              <select id="drum-kit-select-panel" className="custom-select small kit-dropdown" title="Cambiar preset de sonido de la batería" defaultValue="original">
                <option value="original">🥁 Acústico Studio (Samples Reales)</option>
                <option value="rock">🎸 Rock & Heavy Punch</option>
                <option value="jazz">🎷 Jazz Vintage Bop</option>
                <option value="electronic">⚡ Electro 808</option>
                <option value="donner_direct">🎧 Audio Directo Consola Donner</option>
              </select>
            </div>
          </div>
        </div>

        {/* Donner Direct Mode Banner */}
        <div id="donner-direct-banner" className="donner-direct-banner hidden">
          <span className="direct-icon">🎧</span>
          <div className="direct-text">
            <strong>Modo Audio Directo Consola:</strong> Batería virtual de la web silenciada para escuchar tus 100+ sonidos nativos por los audífonos de la consola Donner DED-300X.
          </div>
        </div>

        {/* Audio Unlock Banner */}
        <div id="audio-unlock-banner" className="audio-unlock-banner hidden">
          <span className="unlock-icon">🔊</span>
          <span className="unlock-text">Audio pausado por el navegador. <strong>Haz clic aquí</strong> para escuchar tu batería en vivo.</span>
          <button id="audio-unlock-btn" className="audio-unlock-btn">ACTIVAR SONIDO</button>
        </div>

        {/* Floating Accuracy Badge managed by React state & classes */}
        <div
          id="accuracy-floating-badge"
          className={`accuracy-badge ${badgeState.type} ${badgeState.visible ? 'show' : ''}`}
        >
          {badgeState.text}
        </div>

        {/* Interactive Visual Drum Kit */}
        <div className="drum-kit-visualizer">
          <div className="kit-row cymbals-row four-cymbals">
            <div className="drum-pad cymbal" data-row="CRASH_1">
              <span className="pad-label">CRASH 1</span>
              <span className="pad-note">49</span>
            </div>
            <div className="drum-pad cymbal" data-row="HI_HAT">
              <span className="pad-label">HI-HAT</span>
              <span className="pad-note">42/46</span>
            </div>
            <div className="drum-pad cymbal" data-row="CRASH_2">
              <span className="pad-label">CRASH 2</span>
              <span className="pad-note">57</span>
            </div>
            <div className="drum-pad cymbal" data-row="RIDE">
              <span className="pad-label">RIDE</span>
              <span className="pad-note">51/53</span>
            </div>
          </div>
          <div className="kit-row toms-row">
            <div className="drum-pad tom" data-row="TOM_1">
              <span className="pad-label">TOM 1</span>
              <span className="pad-note">48</span>
            </div>
            <div className="drum-pad tom" data-row="TOM_2">
              <span className="pad-label">TOM 2</span>
              <span className="pad-note">45</span>
            </div>
          </div>
          <div className="kit-row snare-floor-row">
            <div className="drum-pad snare" data-row="SNARE">
              <span className="pad-label">SNARE</span>
              <span className="pad-note">38/40</span>
            </div>
            <div className="drum-pad kick" data-row="KICK">
              <span className="pad-label">BOMBO / KICK</span>
              <span className="pad-note">36</span>
            </div>
            <div className="drum-pad tom" data-row="TOM_3">
              <span className="pad-label">TOM 3</span>
              <span className="pad-note">43</span>
            </div>
          </div>
        </div>

        {/* Real-Time Donner DED-300X Sensors Monitor */}
        <div className="donner-sensors-bar">
          <div className="sensor-meter-box">
            <div className="sensor-meter-header">
              <span className="sensor-title">🦶 PEDAL HI-HAT:</span>
              <span id="pedal-gauge-status" className="sensor-val-badge">0% (Abierto)</span>
            </div>
            <div className="sensor-track">
              <div id="pedal-gauge-fill" className="sensor-fill pedal-fill" style={{ width: '0%' }}></div>
            </div>
          </div>
          <div className="sensor-meter-box">
            <div className="sensor-meter-header">
              <span className="sensor-title">⚡ DINÁMICA DE GOLPE:</span>
              <span id="velocity-gauge-status" className="sensor-val-badge">Vel: 0 (mf)</span>
            </div>
            <div className="sensor-track">
              <div id="velocity-gauge-fill" className="sensor-fill vel-fill" style={{ width: '0%' }}></div>
            </div>
          </div>
        </div>

        {/* Precision & Groove Pocket Timing Meter */}
        <div className="timing-pocket-meter-container">
          <div className="timing-meter-header">
            <span className="timing-meter-title">🎯 PRECISIÓN & GROOVE:</span>
            <span id="timing-offset-badge" className="timing-offset-badge perfect">0 ms (100%)</span>
          </div>
          <div className="timing-groove-track">
            <div className="timing-track-labels">
              <span className="track-label early">◀ EARLY</span>
              <span className="track-label pocket">PERFECT</span>
              <span className="track-label late">LATE ▶</span>
            </div>
            <div className="timing-track-bar">
              <div className="timing-zone-bg early"></div>
              <div className="timing-zone-bg center"></div>
              <div className="timing-zone-bg late"></div>
              <div className="timing-center-notch"></div>
              <div id="timing-pocket-needle" className="timing-needle" style={{ left: '50%' }}></div>
            </div>
          </div>
        </div>

        {/* Scoring Stats */}
        <div className="scoring-stats-row">
          <div className="stat-box">
            <span className="stat-num" id="accuracy-pct">100%</span>
            <span className="stat-name">PRECISIÓN</span>
          </div>
          <div className="stat-box">
            <span className="stat-num stat-perfect" id="perfect-count">0</span>
            <span className="stat-name">PERFECTO</span>
          </div>
          <div className="stat-box">
            <span className="stat-num stat-early" id="early-count">0</span>
            <span className="stat-name">EARLY</span>
          </div>
          <div className="stat-box">
            <span className="stat-num stat-late" id="late-count">0</span>
            <span className="stat-name">LATE</span>
          </div>
          <div className="stat-box">
            <span className="stat-num stat-miss" id="miss-count">0</span>
            <span className="stat-name">OFF</span>
          </div>
          <div className="stat-box">
            <span className="stat-num" id="score-display">0</span>
            <span className="stat-name">PUNTOS</span>
          </div>
        </div>
      </div>

      {/* Right: Metronome (Matches Images 2 & 3!) */}
      <div className="panel-card metronome-panel">
        <div className="panel-header">
          <span className="panel-title">METRONOME</span>
          <div className="header-click-toggle">
            <label className="toggle-control small">
              <input type="checkbox" id="metronome-click-toggle" defaultChecked />
              <span className="toggle-slider"></span>
              <span className="toggle-text">Sonido Click</span>
            </label>
          </div>
        </div>

        {/* Pulses & Subdivisions Controller */}
        <div className="metronome-division-card">
          <div className="metro-row-control">
            <div className="metro-label-group">
              <span className="metro-ctrl-label">PULSOS / COMPÁS:</span>
              <span id="metro-beats-val" className="metro-val-tag">4 pulsos</span>
            </div>
            <div className="metro-pill-group" id="metro-beats-pills">
              <button className="metro-pill" data-beats="2">2</button>
              <button className="metro-pill" data-beats="3">3</button>
              <button className="metro-pill active" data-beats="4">4</button>
              <button className="metro-pill" data-beats="5">5</button>
              <button className="metro-pill" data-beats="6">6</button>
              <button className="metro-pill" data-beats="7">7</button>
              <button className="metro-pill" data-beats="8">8</button>
              <button className="metro-pill" data-beats="12">12</button>
            </div>
          </div>

          <div className="metro-row-control">
            <div className="metro-label-group">
              <span className="metro-ctrl-label">CLICKS POR PULSO (SUBDIVISIÓN):</span>
              <span id="metro-clicks-val" className="metro-val-tag">1 click (♩)</span>
            </div>
            <div className="metro-pill-group" id="metro-clicks-pills">
              <button className="metro-pill active" data-clicks="1" title="1 click por pulso (Negras ♩)">1 (♩)</button>
              <button className="metro-pill" data-clicks="2" title="2 clicks por pulso (Corcheas ♪♪ - un-y, dos-y...)">2 (un-y)</button>
              <button className="metro-pill" data-clicks="3" title="3 clicks por pulso (Tresillos)">3 (triple)</button>
              <button className="metro-pill" data-clicks="4" title="4 clicks por pulso (Semicorcheas)">4 (cuatro)</button>
              <button className="metro-pill" data-clicks="6" title="6 clicks por pulso (Seisillos)">6 (sextu)</button>
            </div>
          </div>

          <div id="metro-calculation-badge" className="metro-calc-badge">
            ⚡ 4 pulsos × 1 click = <strong>4 clicks por compás</strong>
          </div>
          <div id="metro-subdivision-ticker" className="metro-sub-ticker" style={{ display: 'none' }}></div>
        </div>

        {/* Dynamic Flashing Beat Orbs */}
        <div id="metronome-orbs-container" className="metronome-orbs-container">
          <div className="metronome-orb accent" data-beat="0"><span className="orb-num">1</span></div>
          <div className="metronome-orb" data-beat="1"><span className="orb-num">2</span></div>
          <div className="metronome-orb" data-beat="2"><span className="orb-num">3</span></div>
          <div className="metronome-orb" data-beat="3"><span className="orb-num">4</span></div>
        </div>

        {/* Tempo Readout & Delta Buttons */}
        <div className="metronome-tempo-control-grid">
          <div className="delta-col">
            <button id="bpm-minus-1" className="bpm-delta-btn">-1</button>
            <button id="bpm-minus-5" className="bpm-delta-btn">-5</button>
          </div>

          <div className="bpm-center-readout">
            <div className="main-bpm" id="bpm-display">83</div>
            <div className="tempo-term" id="tempo-term-display">Andante</div>
            <div id="bpm-lock-indicator" className="bpm-lock-indicator" style={{ display: 'none' }} title="BPM fijo definido para práctica">
              🔒 BPM Fijado
            </div>
          </div>

          <div className="delta-col">
            <button id="bpm-plus-1" className="bpm-delta-btn">+1</button>
            <button id="bpm-plus-5" className="bpm-delta-btn">+5</button>
          </div>
        </div>

        {/* Tempo Slider */}
        <div className="bpm-slider-wrap">
          <input type="range" id="bpm-slider" min="30" max="300" defaultValue="83" className="metronome-slider" />
        </div>

        {/* Reset & Tap Tempo Controls */}
        <div className="metronome-footer-actions">
          <button id="reset-bpm-btn" className="btn btn-secondary-subtle">
            ↺ Reset a BPM Original
          </button>
          <button id="tap-tempo-btn" className="btn btn-secondary-subtle">
            🥁 Tap Tempo
          </button>
        </div>

        {/* Giant Master Play Button */}
        <div className="master-play-container">
          <button id="master-play-btn" className="master-play-btn" title="Iniciar o pausar práctica (Barra Espaciadora)">
            <span id="play-icon" className="play-btn-icon">▶</span>
            <span id="play-text" className="play-btn-text">INICIAR PRÁCTICA</span>
          </button>
        </div>
      </div>
    </div>
  );
};
