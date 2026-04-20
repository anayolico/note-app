import React from 'react';
import { ArrowRight } from 'lucide-react';
import logo from '../assets/logo.png';

interface HeaderProps {
  onLogin: () => void;
}

const Header: React.FC<HeaderProps> = ({ onLogin }) => {
  return (
    <header className="header">
      <div className="logo-container">
        <img src={logo} alt="Mindful Canvas Logo" className="logo-img" />
        <span className="brand-name">Mindful Canvas</span>
      </div>
      <button className="get-started-btn" onClick={onLogin}>
        Get Started <ArrowRight size={18} />
      </button>
    </header>
  );
};

export default Header;
