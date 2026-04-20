import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  ChevronLeft, 
  LogOut, 
  User, 
  Sun,
  Moon,
  Monitor
} from 'lucide-react';
import './Settings.css';

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(
    (localStorage.getItem('theme') as 'light' | 'dark' | 'system') || 'system'
  );

  useEffect(() => {
    const getProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/');
        return;
      }
      setProfile(session.user);
    };
    getProfile();
  }, [navigate]);

  // Apply theme logic
  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = (t: 'light' | 'dark' | 'system') => {
      if (t === 'system') {
        const systemTheme = mediaQuery.matches ? 'dark' : 'light';
        root.setAttribute('data-theme', systemTheme);
      } else {
        root.setAttribute('data-theme', t);
      }
      localStorage.setItem('theme', t);
    };

    applyTheme(theme);

    const listener = () => {
      if (theme === 'system') applyTheme('system');
    };
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, [theme]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <div className="settings-page fade-in">
      <header className="settings-header">
        <button className="back-arrow" onClick={() => navigate('/dashboard')}>
          <ChevronLeft size={24} />
        </button>
        <h1>Settings</h1>
      </header>

      <main className="settings-content">
        {/* Account Section */}
        <div className="section-label">ACCOUNT</div>
        <section className="settings-card account-card">
          <div className="account-icon-wrapper">
             <User size={20} />
          </div>
          <div className="account-details">
            <span className="email-text">{profile?.email || 'user@example.com'}</span>
            <span className="provider-text">Google</span>
          </div>
        </section>

        {/* Appearance Section */}
        <div className="section-label">APPEARANCE</div>
        <section className="appearance-grid">
           <button 
             className={`theme-card ${theme === 'light' ? 'active' : ''}`}
             onClick={() => setTheme('light')}
           >
             <Sun size={20} />
             <span>Light</span>
           </button>
           <button 
             className={`theme-card ${theme === 'dark' ? 'active' : ''}`}
             onClick={() => setTheme('dark')}
           >
             <Moon size={20} />
             <span>Dark</span>
           </button>
           <button 
             className={`theme-card ${theme === 'system' ? 'active' : ''}`}
             onClick={() => setTheme('system')}
           >
             <Monitor size={20} />
             <span>System</span>
           </button>
        </section>

        {/* Shortcuts Section */}
        <div className="section-label">KEYBOARD SHORTCUTS</div>
        <section className="settings-card shortcuts-card">
           <div className="shortcut-item">
             <span>New note</span>
             <div className="key-combo">⌘ N</div>
           </div>
           <div className="shortcut-item">
             <span>Save</span>
             <div className="key-combo">⌘ S</div>
           </div>
           <div className="shortcut-item">
             <span>Search</span>
             <div className="key-combo">⌘ K</div>
           </div>
           <div className="shortcut-item">
             <span>Delete</span>
             <div className="key-combo">⌘ D</div>
           </div>
           <div className="shortcut-item">
             <span>Toggle preview</span>
             <div className="key-combo">⌘ ⇧ P</div>
           </div>
        </section>

        {/* Sign Out Button */}
        <button className="outlined-signout-btn" onClick={handleSignOut}>
          <LogOut size={18} />
          <span>Sign Out</span>
        </button>
      </main>
    </div>
  );
};

export default Settings;
