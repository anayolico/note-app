import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import LoadingOverlay from './components/LoadingOverlay';
import AdToast from './components/AdToast';
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
        <Toaster 
          position="bottom-right"
          gutter={8}
          containerStyle={{
            zIndex: 99999,
          }}
          toastOptions={{
            duration: 2500,
            style: {
              background: 'var(--bg-secondary, #18181b)',
              color: 'var(--text-primary, #ffffff)',
              border: '1px solid var(--border-color, rgba(255,255,255,0.1))',
              borderRadius: '8px',
              padding: '12px 16px',
            },
            success: {
              duration: 2500,
            },
            error: {
              duration: 3500,
            }
          }}
        />
        <AdToast />
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
