import React from 'react';
import { Link } from 'react-router-dom';

function NavigationBar() {
  return (
    <nav className="navigation-bar">
      <div className="logo">
        <Link to="/">ToS Merchant Tracker</Link>
      </div>
      <ul className="nav-links">
        <li><Link to="/">搜尋商品</Link></li>
        <li><Link to="/add-merchant">新增普通商人</Link></li>
        <li><Link to="/add-special-merchant">新增五商</Link></li>
      </ul>
    </nav>
  );
}

export default NavigationBar;