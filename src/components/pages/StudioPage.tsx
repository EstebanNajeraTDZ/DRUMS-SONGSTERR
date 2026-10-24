import React from 'react';
import { AudioController } from '../organisms/AudioController';
import { YouTubePlayerScreen } from '../organisms/YouTubePlayerScreen';
import { PracticeToolbar } from '../organisms/PracticeToolbar';
import { DrumNotationCard } from '../organisms/DrumNotationCard';
import { SequencerCard } from '../organisms/SequencerCard';
import { BottomStudioGrid } from '../organisms/BottomStudioGrid';

export const StudioPage: React.FC = () => {
  return (
    <>
      {/* Songsterr Studio Audio & YouTube Player Controller (Segmented Cards) */}
      <AudioController />

      {/* Collapsible YouTube Video Player Screen */}
      <YouTubePlayerScreen />

      {/* Controls & Section Selector Bar (Segmented & Responsive) */}
      <PracticeToolbar />

      {/* Section 1: Drum Notation Card (Guitar Hero / Stave Canvas) */}
      <DrumNotationCard />

      {/* Section 2: Step Sequencer Matrix (8 rows, subdivisions, dynamic cells) */}
      <SequencerCard />

      {/* View Switcher Tabs (Tablet & Mobile only) */}
      <div className="studio-view-tabs" id="studio-view-tabs">
        <button className="view-tab-btn active" data-view="both">📱 Todo</button>
        <button className="view-tab-btn" data-view="pads">⚡ Batería</button>
        <button className="view-tab-btn" data-view="metro">⏱ Metrónomo</button>
      </div>

      {/* Section 3: Bottom Control Panel (Metronome & Donner DED-300X Kit) */}
      <BottomStudioGrid />
    </>
  );
};
