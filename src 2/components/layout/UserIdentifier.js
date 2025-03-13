import React, { useState, useEffect } from 'react';

function UserIdentifier() {
  const [playerId, setPlayerId] = useState('');
  
  useEffect(() => {
    // Get stored player ID from localStorage
    const storedPlayerId = localStorage.getItem('submitterPlayerId');
    if (storedPlayerId) {
      setPlayerId(storedPlayerId);
    }
  }, []);
  
  const handleLogout = () => {
    // Clear the stored player ID
    localStorage.removeItem('submitterPlayerId');
    setPlayerId('');
  };
  
  if (!playerId) {
    return null;
  }
  
  return (
    <div className="user-identifier">
      <span className="user-greeting">您好，{playerId}</span>
      <button className="logout-btn" onClick={handleLogout}>登出</button>
    </div>
  );
}

export default UserIdentifier;