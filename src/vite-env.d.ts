/// <reference types="vite/client" />

declare module '*.css' {
  const content: Record<string, string>;
  export default content;
}

interface Window {
  app?: any;
  notationRenderer?: any;
  gridSequencer?: any;
  drumAudio?: any;
  donnerMidi?: any;
  donnerMetronome?: any;
  fullScoreSidebar?: any;
  calibrationWizard?: any;
}
