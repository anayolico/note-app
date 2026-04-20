import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import Settings from './components/Settings';
import './App.css';

function App() {
  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const applyTheme = () => {
      const savedTheme = localStorage.getItem('theme') || 'system';
      if (savedTheme === 'system') {
        const systemTheme = mediaQuery.matches ? 'dark' : 'light';
        root.setAttribute('data-theme', systemTheme);
      } else {
        root.setAttribute('data-theme', savedTheme);
      }
    };

    applyTheme();

    // Listen for storage changes (to sync across tabs or from settings)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'theme') applyTheme();
    };

    // Listen for system theme changes
    mediaQuery.addEventListener('change', applyTheme);
    window.addEventListener('storage', handleStorage);

    return () => {
      mediaQuery.removeEventListener('change', applyTheme);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
