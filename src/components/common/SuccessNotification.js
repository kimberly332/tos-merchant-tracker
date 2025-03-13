// src/components/common/SuccessNotification.js
import React, { useState, useEffect } from 'react';

const SuccessNotification = ({ message, duration = 3000, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isAutoDismiss, setIsAutoDismiss] = useState(true);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      if (onClose) onClose();
    }, duration);
    
    return () => clearTimeout(timer);
  }, [duration, onClose]);
  
  // Disable auto-dismiss animation when manually closing
  const handleClose = () => {
    setIsAutoDismiss(false);
    setIsVisible(false);
    if (onClose) onClose();
  };
  
  if (!isVisible) return null;
  
  return (
    <div className={`success-notification ${isAutoDismiss ? 'auto-dismiss' : ''}`}>
      <div className="success-notification-icon">✓</div>
      <div className="success-notification-content">
        <p>{message}</p>
      </div>
      <button 
        className="success-notification-close"
        onClick={handleClose}
        aria-label="Close notification"
      >
        ×
      </button>
    </div>
  );
};

export default SuccessNotification;