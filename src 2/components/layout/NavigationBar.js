import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function NavigationBar() {
  // State for menu toggle
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // State for user ID
  const [playerId, setPlayerId] = useState('');
  
  // Load player ID from localStorage on component mount
  useEffect(() => {
    const storedPlayerId = localStorage.getItem('submitterPlayerId');
    if (storedPlayerId) {
      setPlayerId(storedPlayerId);
    }
  }, []);
  
  // Handle user logout
  const handleLogout = () => {
    localStorage.removeItem('submitterPlayerId');
    setPlayerId('');
    // Close mobile menu after logout
    setMobileMenuOpen(false);
  };

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <nav className="navigation-bar">
      <div className="logo">
        <Link to="/">救世者之樹M</Link>
      </div>
      
      {/* Font Awesome Hamburger Menu */}
      <button 
        className="menu-toggle" 
        onClick={toggleMobileMenu}
        aria-label="Toggle menu"
        aria-expanded={mobileMenuOpen}
      >
        <i className={mobileMenuOpen ? "fas fa-times" : "fas fa-bars"}></i>
      </button>
      
      {/* Navigation links */}
      <ul className={`nav-links ${mobileMenuOpen ? "show" : ""}`}>
        <li>
          <Link to="/" onClick={() => setMobileMenuOpen(false)}>搜尋商品</Link>
        </li>
        <li>
          <Link to="/add-merchant" onClick={() => setMobileMenuOpen(false)}>新增商人</Link>
        </li>
        
        {/* User information */}
        {playerId && (
          <li className="user-info-container">
            <div className="user-info">
              <span className="user-greeting">您好，{playerId}</span>
              <button 
                className="logout-btn" 
                onClick={handleLogout}
              >
                登出
              </button>
            </div>
          </li>
        )}
      </ul>
    </nav>
  );
}

export default NavigationBar;