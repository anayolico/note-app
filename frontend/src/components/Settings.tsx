import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  ChevronLeft, 
  LogOut, 
  User, 
  Shield, 
  Moon, 
  Bell,
  Mail
} from 'lucide-react';
import './Settings.css';

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);

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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <div className="settings-page fade-in">
      <header className="settings-header">
        <button className="back-btn" onClick={() => navigate('/dashboard')}>
          <ChevronLeft size={24} />
          <span>Back to Notes</span>
        </button>
        <h1>Settings</h1>
      </header>

      <main className="settings-content">
        {/* Profile Section */}
        <section className="settings-section profile">
          <div className="profile-card">
            <div className="avatar-wrapper">
              {profile?.user_metadata?.avatar_url ? (
                <img src={profile.user_metadata.avatar_url} alt="Avatar" />
              ) : (
                <div className="avatar-placeholder"><User size={40} /></div>
              )}
            </div>
            <div className="profile-info">
              <h3>{profile?.user_metadata?.full_name || 'Note Taker'}</h3>
              <p>{profile?.email}</p>
            </div>
          </div>
        </section> section

        {/* Preferences Section */}
        <section className="settings-section">
          <h2>Preferences</h2>
          <div className="settings-list">
            <div className="settings-item">
              <div className="item-label">
                <Moon size={20} />
                <span>Dark Mode</span>
              </div>
              <div className="toggle active"></div>
            </div>
            <div className="settings-item">
              <div className="item-label">
                <Bell size={20} />
                <span>Notifications</span>
              </div>
              <div className="toggle"></div>
            </div>
          </div>
        </section>

        {/* Account Section */}
        <section className="settings-section">
          <h2>Account & Security</h2>
          <div className="settings-list">
            <div className="settings-item">
              <div className="item-label">
                <Mail size={20} />
                <span>Email Subscriptions</span>
              </div>
              <button className="text-btn">Manage</button>
            </div>
            <div className="settings-item">
              <div className="item-label">
                <Shield size={20} />
                <span>Security</span>
              </div>
              <button className="text-btn">Details</button>
            </div>
          </div>
        </section>

        {/* Danger Zone */}
        <section className="settings-section danger-zone">
          <button className="sign-out-btn" onClick={handleSignOut}>
            <LogOut size={20} />
            <span>Sign Out</span>
          </button>
        </section>
      </main>
    </div>
  );
};

export default Settings;
