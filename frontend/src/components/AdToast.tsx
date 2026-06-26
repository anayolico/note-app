import React, { useEffect } from 'react';
import { toast } from 'react-hot-toast';
import anayoLogo from '../assets/anayolico.png.png';

const AdToast: React.FC = () => {
  useEffect(() => {
    // Show the first toast after 1 minute, and then repeat every 1 minute
    const intervalId = setInterval(() => {
      toast.custom(
        (t) => (
          <div
            className={`ad-toast-container ${t.visible ? 'animate-enter' : 'animate-leave'}`}
            onClick={() => {
              window.open('https://anayolico.name.ng', '_blank');
              toast.dismiss(t.id);
            }}
          >
            <div className="ad-toast-content">
              <img src={anayoLogo} alt="Caleb Anayolico" className="ad-toast-logo" />
              <div className="ad-toast-text">
                <span className="ad-toast-title">Built by Caleb Anayolico</span>
                <span className="ad-toast-subtitle">Click to visit my portfolio</span>
              </div>
            </div>
            <button
              className="ad-toast-close"
              onClick={(e) => {
                e.stopPropagation(); // Prevent opening the link when clicking close
                toast.dismiss(t.id);
              }}
            >
              ×
            </button>
          </div>
        ),
        { 
          duration: 8000, // Stay on screen for 8 seconds
          position: 'bottom-right',
          id: 'recurring-ad-toast' // Prevents duplicate toasts from stacking up
        }
      );
    }, 60000); // 60,000 ms = 1 minute

    return () => clearInterval(intervalId);
  }, []);

  return null; // This component runs silently in the background
};

export default AdToast;
