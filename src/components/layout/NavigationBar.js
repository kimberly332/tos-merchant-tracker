// Open src/components/layout/NavigationBar.js
// Update the imports (if needed)
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function NavigationBar() {
  // Keep your existing mobile menu state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Add new state for user ID
  const [playerId, setPlayerId] = useState('');
  
  // Add useEffect to load player ID from localStorage
  useEffect(() => {
    const storedPlayerId = localStorage.getItem('submitterPlayerId');
    if (storedPlayerId) {
      setPlayerId(storedPlayerId);
    }
  }, []);
  
  // Add logout handler
  const handleLogout = () => {
    localStorage.removeItem('submitterPlayerId');
    setPlayerId('');
  };

  // Keep your existing mobile menu toggle function
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <nav className="navigation-bar">
      <div className="logo">
        <Link to="/">ToS Merchant Tracker</Link>
      </div>
      
      {/* Keep your existing mobile menu toggle button */}
      <button className="menu-toggle" onClick={toggleMobileMenu}>
        <span className={mobileMenuOpen ? "rotate-down" : ""}></span>
        <span className={mobileMenuOpen ? "fade-out" : ""}></span>
        <span className={mobileMenuOpen ? "rotate-up" : ""}></span>
      </button>
      
      {/* Update your navigation links */}
      <ul className={`nav-links ${mobileMenuOpen ? "show" : ""}`}>
        <li><Link to="/" onClick={() => setMobileMenuOpen(false)}>搜尋商品</Link></li>
        <li><Link to="/add-merchant" onClick={() => setMobileMenuOpen(false)}>新增商人</Link></li>
        
        {/* Add user information display */}
        {playerId && (
          <li className="user-info">
            <span className="user-greeting">您好，{playerId}</span>
            <button className="logout-btn" onClick={handleLogout}>登出</button>
          </li>
        )}
      </ul>
    </nav>
  );
}

export default NavigationBar;