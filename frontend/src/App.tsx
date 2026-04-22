import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoadingOverlay from './components/LoadingOverlay';
import './App.css';

const LandingPage = lazy(() => import('./components/LandingPage'));
const Dashboard = lazy(() => import('./components/Dashboard'));
const Settings = lazy(() => import('./components/Settings'));

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
        <Suspense fallback={<LoadingOverlay />}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Suspense>
      </div>
    </Router>
  );
}

export default App;
