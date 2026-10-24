import React from 'react';

export const YouTubePlayerScreen: React.FC = () => {
  return (
    <div id="youtube-player-container" className="youtube-player-container collapsed">
      <div className="yt-header">
        <span id="yt-now-playing" className="yt-title">
          Reproductor Songsterr Original (YouTube Sync)
        </span>
        <div className="yt-header-actions">
          <button
            id="yt-set-beat1-btn"
            className="btn btn-secondary-subtle small-btn"
            title="Pausa el video en el momento exacto en que empieza la música y pulsa aquí para sincronizar el Beat 1"
          >
            🎯 Sincronizar Beat 1 Aquí
          </button>
          <button id="yt-close-btn" className="yt-close-btn" title="Ocultar video">
            &times;
          </button>
        </div>
      </div>
      <div className="yt-frame-wrapper">
        <div id="youtube-iframe-holder"></div>
      </div>
    </div>
  );
};
