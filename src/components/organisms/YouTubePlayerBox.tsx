import React, { useEffect, useRef } from 'react';
import { useStudio } from '../../context/StudioContext';
import { Button } from '../atoms/Button';

declare global {
  interface Window {
    YT: {
      Player: new (
        elementId: string | HTMLElement,
        options: {
          videoId?: string;
          playerVars?: Record<string, unknown>;
          events?: {
            onReady?: (event: { target: unknown }) => void;
            onStateChange?: (event: { data: number }) => void;
          };
        }
      ) => {
        playVideo: () => void;
        pauseVideo: () => void;
        seekTo: (seconds: number, allowSeekAhead?: boolean) => void;
        setPlaybackRate: (rate: number) => void;
        destroy: () => void;
      };
      PlayerState: {
        PLAYING: number;
        PAUSED: number;
        ENDED: number;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

export const YouTubePlayerBox: React.FC = () => {
  const { isYouTubeActive, toggleYouTubeVideo, song, captureBeat1, isPlaying } = useStudio();
  const playerRef = useRef<unknown>(null);
  const containerId = 'youtube-iframe-holder-react';

  // Video ID detection from song data
  const videoId = song?.youtube_video_id || (song?.song_id === '9374' ? 'fV4DiAyExN0' : null);

  useEffect(() => {
    if (!isYouTubeActive || !videoId) return;

    const initPlayer = () => {
      if (window.YT && window.YT.Player) {
        try {
          playerRef.current = new window.YT.Player(containerId, {
            videoId,
            playerVars: {
              autoplay: 0,
              controls: 1,
              modestbranding: 1,
              rel: 0,
            },
          });
        } catch (e) {
          console.warn('YouTube Player initialization notice:', e);
        }
      }
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      window.onYouTubeIframeAPIReady = initPlayer;
    }

    return () => {
      const p = playerRef.current as { destroy?: () => void };
      if (p && typeof p.destroy === 'function') {
        p.destroy();
      }
      playerRef.current = null;
    };
  }, [isYouTubeActive, videoId]);

  if (!isYouTubeActive) return null;

  return (
    <div className="flex flex-col rounded-2xl glass-surface border border-[var(--color-border)] overflow-hidden shadow-lg mb-3">
      <div className="flex items-center justify-between p-3 border-b border-[var(--color-border)] bg-[var(--color-bg-elevated)]/60">
        <span className="text-xs font-bold text-[var(--color-text-main)] flex items-center gap-1.5">
          🎬 Reproductor Songsterr Original (YouTube Sync)
        </span>
        <div className="flex items-center gap-2">
          <Button
            size="xs"
            variant="subtle"
            onClick={captureBeat1}
            title="Pausa el video en el momento exacto en que empieza la música y pulsa aquí"
          >
            🎯 Sincronizar Beat 1 Aquí
          </Button>
          <button
            onClick={toggleYouTubeVideo}
            className="w-6 h-6 rounded bg-[var(--color-bg-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] flex items-center justify-center text-xs cursor-pointer"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="relative w-full aspect-video bg-black flex items-center justify-center">
        {videoId ? (
          <div id={containerId} className="w-full h-full" />
        ) : (
          <div className="text-xs text-slate-500 text-center p-4">
            Este ejercicio no contiene video de YouTube asignado.
          </div>
        )}
      </div>
    </div>
  );
};
