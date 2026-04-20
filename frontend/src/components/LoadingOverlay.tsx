import React from 'react';
import './LoadingOverlay.css';

const LoadingOverlay: React.FC = () => {
  return (
    <div className="loading-overlay">
      <div className="loader-container">
        <div className="loader-ring"></div>
        <div className="loader-logo">
          <span className="dot"></span>
        </div>
      </div>
      <p className="loading-text">Preparing your creative space...</p>
    </div>
  );
};

export default LoadingOverlay;
