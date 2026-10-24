import React from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { StudioProvider } from './context/StudioContext';
import { StudioLayout } from './components/templates/StudioLayout';
import { StudioPage } from './components/pages/StudioPage';

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <StudioProvider>
        <StudioLayout>
          <StudioPage />
        </StudioLayout>
      </StudioProvider>
    </ThemeProvider>
  );
};

export default App;
