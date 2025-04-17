
import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { ThemeProvider } from './providers/ThemeProvider';
import { Toaster } from './components/ui/toaster';
import { Toaster as SonnerToaster } from 'sonner';

// Main application component
const App = () => {
  return (
    <ThemeProvider>
      <Router>
        {/* Main content goes here */}
        <main>
          {/* Your routes and components */}
        </main>
        {/* Toast notifications */}
        <Toaster />
        <SonnerToaster position="top-right" />
      </Router>
    </ThemeProvider>
  );
};

export default App;
