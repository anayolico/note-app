import React, { useEffect } from 'react';
import { toast } from 'react-hot-toast';
import anayoLogo from '../assets/anayolico.png.png';

const AD_INTERVAL = 5 * 60 * 1000; // 5 minutes

const showAdToast = () => {
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
            e.stopPropagation();
            toast.dismiss(t.id);
          }}
        >
          ×
        </button>
      </div>
    ),
    {
      duration: 8000,     // Stay on screen for 8 seconds then auto-dismiss
      position: 'bottom-right',
      id: 'recurring-ad-toast',
    }
  );
};

const AdToast: React.FC = () => {
  useEffect(() => {
    // First appearance after 5 minutes, then repeats every 5 minutes
    const timerId = setTimeout(() => {
      showAdToast();
      const intervalId = setInterval(showAdToast, AD_INTERVAL);
      return () => clearInterval(intervalId);
    }, AD_INTERVAL);

    return () => clearTimeout(timerId);
  }, []);

  return null; // This component runs silently in the background
};

export default AdToast;
