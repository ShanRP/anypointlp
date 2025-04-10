
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import AuthPage from './pages/AuthPage';
import AuthCallback from './pages/AuthCallback';
import NotFound from './pages/NotFound';
import ExchangeItemDetails from './components/Exchange/ExchangeItemDetails';
import WorkspaceInvite from './pages/WorkspaceInvite';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard/*" element={<Dashboard />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/dashboard/exchange/item/:itemId" element={<ExchangeItemDetails />} />
        <Route path="/invite/:inviteToken" element={<WorkspaceInvite />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
