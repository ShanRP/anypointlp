
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './providers/ThemeProvider';
import { Toaster } from './components/ui/toaster';
import { Toaster as SonnerToaster } from 'sonner';
import Index from './pages/Index';

// Main application component
const App = () => {
  return (
    <ThemeProvider>
      <Router>
        {/* Main content with routes */}
        <main className="min-h-screen">
          <Routes>
            <Route path="/" element={<Index />} />
            {/* Additional routes can be added here */}
          </Routes>
        </main>
        {/* Toast notifications */}
        <Toaster />
        <SonnerToaster position="top-right" />
      </Router>
    </ThemeProvider>
  );
};

export default App;
