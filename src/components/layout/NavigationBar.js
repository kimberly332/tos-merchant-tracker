// src/components/layout/NavigationBar.js
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { checkUserAuth, logoutUser } from '../../firebase/userAuth';

function NavigationBar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // 檢查用戶登入狀態
  useEffect(() => {
    const currentUser = checkUserAuth();
    setUser(currentUser);
  }, [location.pathname]); // 重新檢查用戶狀態，特別是在路由變化時

  // 切換手機選單
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // 關閉手機選單
  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  // 處理登出
  const handleLogout = () => {
    logoutUser();
    setUser(null);
    setMobileMenuOpen(false);
    navigate('/login');
  };

  // 檢查是否在登入頁面
  const isLoginPage = location.pathname === '/login';

  return (
    <nav className="navigation-bar">
      <div className="logo">
        <Link to="/">雨果商人追蹤系統</Link>
      </div>
      
      {/* 漢堡選單按鈕 */}
      <button
        className="menu-toggle"
        onClick={toggleMobileMenu}
        aria-label="Toggle menu"
        aria-expanded={mobileMenuOpen}
      >
        <i className={mobileMenuOpen ? "fas fa-times" : "fas fa-bars"}></i>
      </button>
      
      {/* 導航連結 */}
      <ul className={`nav-links ${mobileMenuOpen ? "show" : ""}`}>
        {/* 只有在登入後才顯示的連結 */}
        {user && (
          <>
            <li>
              <Link to="/" onClick={closeMobileMenu}>搜尋商品</Link>
            </li>
            <li>
              <Link to="/add-merchant" onClick={closeMobileMenu}>新增商人</Link>
            </li>
            <li>
              <button
                className="logout-btn"
                onClick={handleLogout}
              >
                <i className="fas fa-sign-out-alt"></i> 登出 ({user.playerId})
              </button>
            </li>
          </>
        )}
        
        {/* 未登入且不在登入頁面時顯示登入按鈕 */}
        {!user && !isLoginPage && (
          <li>
            <Link to="/login" onClick={closeMobileMenu}>登入</Link>
          </li>
        )}
      </ul>
    </nav>
  );
}

export default NavigationBar;