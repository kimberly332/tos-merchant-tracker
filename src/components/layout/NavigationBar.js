// src/components/layout/NavigationBar.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import UserProfile from '../auth/UserProfile';

function NavigationBar() {
  // State for menu toggle
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // Close mobile menu
  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <nav className="navigation-bar">
      <div className="logo">
        <Link to="/">雨果商人追蹤系統</Link>
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
          <Link to="/" onClick={closeMobileMenu}>搜尋商品</Link>
        </li>
        <li>
          <Link to="/add-merchant" onClick={closeMobileMenu}>新增商人</Link>
        </li>
        
        {/* 使用者個人資料 */}
        <li className="user-profile-container">
          <UserProfile />
        </li>
      </ul>
    </nav>
  );
}

export default NavigationBar;