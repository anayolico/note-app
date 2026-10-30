import React from 'react';
import logo from '../assets/logo.png';

interface HeaderProps {
  onLogin?: () => void;
}

const Header: React.FC<HeaderProps> = () => {
  return (
    <header className="header">
      <div className="logo-container">
        <img src={logo} alt="Mindful Canvas Logo" className="logo-img" />
        <span className="brand-name">Mindful Canvas</span>
      </div>
    </header>
  );
};

export default Header;
