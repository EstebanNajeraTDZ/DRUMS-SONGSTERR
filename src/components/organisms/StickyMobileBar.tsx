import React from 'react';

export const StickyMobileBar: React.FC = () => {
  return (
    <div id="mobile-sticky-playbar" className="mobile-sticky-playbar">
      <div className="m-bar-left">
        <button id="mobile-prev-btn" className="m-bar-btn" title="Compás Anterior">
          ◀
        </button>
        <div className="m-bar-meas">
          <span className="m-bar-meas-tag">C</span>
          <span id="mobile-meas-num" className="m-bar-meas-val">1</span>
        </div>
        <button id="mobile-next-btn" className="m-bar-btn" title="Compás Siguiente">
          ▶
        </button>
      </div>
      <button id="mobile-play-btn" className="m-bar-play-btn" title="Iniciar o pausar práctica">
        <span id="mobile-play-icon">▶</span>
        <span id="mobile-play-text">PRACTICAR</span>
      </button>
      <div className="m-bar-right">
        <div className="m-bar-bpm">
          <span id="mobile-bpm-val" className="m-bar-bpm-num">83</span>
          <span className="m-bar-bpm-tag">BPM</span>
        </div>
        <button id="mobile-open-sidebar-btn" className="m-bar-btn m-bar-score" title="Abrir Partitura">
          📖
        </button>
      </div>
    </div>
  );
};
