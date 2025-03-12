import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import UserIdentifier from './UserIdentifier';

function NavigationBar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="navigation-bar">
      <div className="logo">
        <Link to="/">ToS Merchant Tracker</Link>
      </div>
      
      {/* Mobile menu toggle button */}
      <button className="menu-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
        <span className={mobileMenuOpen ? "rotate-down" : ""}></span>
        <span className={mobileMenuOpen ? "fade-out" : ""}></span>
        <span className={mobileMenuOpen ? "rotate-up" : ""}></span>
      </button>
      
      {/* Navigation links with responsive class */}
      <ul className={`nav-links ${mobileMenuOpen ? "show" : ""}`}>
        <li><Link to="/" onClick={() => setMobileMenuOpen(false)}>搜尋商品</Link></li>
        <li><Link to="/add-merchant" onClick={() => setMobileMenuOpen(false)}>新增商人</Link></li>
      </ul>
      
      <UserIdentifier />
    </nav>
  );
}

export default NavigationBar;