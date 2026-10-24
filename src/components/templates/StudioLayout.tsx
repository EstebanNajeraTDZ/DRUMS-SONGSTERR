import React, { useEffect } from 'react';
import { useStudio } from '../../context/StudioContext';
import { AppHeader } from '../organisms/AppHeader';
import { LateralMenu } from '../organisms/LateralMenu';
import { LegacyModals } from '../organisms/LegacyModals';
import { StickyMobileBar } from '../organisms/StickyMobileBar';
import { CustomScoreModal } from '../organisms/Modals/CustomScoreModal';
import { initDrumStudio } from '../../engines';

export const StudioLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLateralMenuOpen, setIsLateralMenuOpen, isCustomScoreModalOpen, setIsCustomScoreModalOpen } = useStudio();

  // Initialize all engines and bind to DOM once mounted
  useEffect(() => {
    initDrumStudio();
  }, []);

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)]">
      {/* Top Navigation Header with Brand, Quick Dark/Light Toggle & Lateral Menu Burger */}
      <AppHeader onOpenMenu={() => setIsLateralMenuOpen(true)} />

      {/* Main Studio Workspace with exact two-column responsive layout */}
      <main className="main-container">
        <div className="studio-two-column-layout">
          {/* Left Main Column: Practicer & Controls */}
          <div className="practicer-main-col">
            {children}
          </div>

          {/* Backdrop overlay for mobile drawer */}
          <div id="sidebar-backdrop" className="sidebar-backdrop"></div>

          {/* Lateral Full Score Sidebar (dynamically rendered by FullScoreSidebar engine) */}
          <aside id="lateral-score-sidebar" className="lateral-score-sidebar"></aside>
        </div>
      </main>

      {/* Floating button to reopen sidebar if collapsed */}
      <button
        id="open-sidebar-floating-btn"
        className="open-sidebar-floating-btn"
        style={{ display: 'none' }}
        title="Abrir Partitura Completa"
      >
        📖 Partitura Completa
      </button>

      {/* Mobile Sticky Action Bar for quick practice control on small screens */}
      <StickyMobileBar />

      {/* Legacy Modals (Songsterr search, Academy, MIDI diagnostic, Calibration, Loading overlay) */}
      <LegacyModals />

      {/* Modern Lateral Options Menu (Drawer with Palettes, Dark/Light, Tabs) */}
      <LateralMenu />

      {/* Custom Score Creator & Saved Scores Modal */}
      <CustomScoreModal
        isOpen={isCustomScoreModalOpen}
        onClose={() => setIsCustomScoreModalOpen(false)}
      />
    </div>
  );
};
