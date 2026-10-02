import React, { useEffect, useState } from 'react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  ChevronLeft, 
  LogOut, 
  User, 
  Sun, 
  Moon, 
  Monitor,
  AlertOctagon
} from 'lucide-react';
import './Settings.css';
import CloseAccountModal from './CloseAccountModal';
import { clearUserCache } from '../lib/cache';
import { toast } from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<SupabaseUser | null>(null);
  const [showCloseModal, setShowCloseModal] = useState(false);
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

  const clearBrowserAuthStorage = () => {
    [localStorage, sessionStorage].forEach((storage) => {
      Object.keys(storage).forEach((key) => {
        const isSupabaseAuthKey =
          key === 'supabase.auth.token' ||
          (key.startsWith('sb-') && key.endsWith('-auth-token'));

        if (isSupabaseAuthKey) {
          storage.removeItem(key);
        }
      });
    });

    document.cookie.split(';').forEach((cookie) => {
      const name = cookie.split('=')[0].trim();
      if (!name) return;
      document.cookie = `${name}=; Max-Age=0; path=/`;
    });
  };

  const handleSignOut = () => {
    // 1. Immediately navigate away without waiting for backend
    navigate('/');

    // 2. Clear client storage & user cache
    if (profile?.id) {
      clearUserCache(profile.id);
    }
    clearBrowserAuthStorage();

    // 3. Fire-and-forget background server & supabase logout
    fetch(`${API_URL}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    }).catch((err) => console.error('Logout endpoint error in background:', err));

    supabase.auth.signOut().catch((err) => console.error('Supabase signOut error in background:', err));
  };

  const handleCloseAccount = () => {
    if (!profile) return;
    const userId = profile.id;

    // 1. Immediately navigate away to landing page
    navigate('/');
    toast.success('Your account has been closed.', { duration: 4000 });

    // 2. Clear client storage & user cache
    clearUserCache(userId);
    clearBrowserAuthStorage();

    // 3. Fire-and-forget backend wipe of all data in background
    fetch(`${API_URL}/api/users/${userId}`, {
      method: 'DELETE',
    }).catch((err) => console.error('Close account backend error:', err));

    // 4. Background sign out
    supabase.auth.signOut().catch((err) => console.error('Supabase signOut error in background:', err));
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
             <div className="key-combo">Ctrl + N</div>
           </div>
           <div className="shortcut-item">
             <span>Save</span>
             <div className="key-combo">Ctrl + S</div>
           </div>
           <div className="shortcut-item">
             <span>Search</span>
             <div className="key-combo">Ctrl + K</div>
           </div>
           <div className="shortcut-item">
             <span>Delete</span>
             <div className="key-combo">Ctrl + D</div>
           </div>
           <div className="shortcut-item">
             <span>Toggle preview</span>
             <div className="key-combo">Ctrl + Shift + P</div>
           </div>
        </section>

        {/* Danger Zone */}
        <div className="section-label danger-label">DANGER ZONE</div>
        <section className="settings-card danger-card">
          <div className="danger-card-info">
            <div className="danger-title-row">
              <AlertOctagon size={18} className="danger-icon" />
              <span className="danger-title">Close Account</span>
            </div>
            <p className="danger-description">
              Permanently delete your account and all associated notes. This action cannot be reversed.
            </p>
          </div>
          <button 
            type="button" 
            className="danger-btn" 
            onClick={() => setShowCloseModal(true)}
          >
            Close Account
          </button>
        </section>

        {/* Sign Out Button */}
        <button className="outlined-signout-btn" onClick={handleSignOut}>
          <LogOut size={18} />
          <span>Sign Out</span>
        </button>
      </main>

      {/* Close Account 3-Step Modal */}
      {showCloseModal && (
        <CloseAccountModal 
          onClose={() => setShowCloseModal(false)}
          onConfirm={handleCloseAccount}
        />
      )}
    </div>
  );
};

export default Settings;

