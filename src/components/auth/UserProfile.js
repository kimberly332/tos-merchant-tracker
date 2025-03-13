// src/components/auth/UserProfile.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { checkUserAuth, logoutUser } from '../../firebase/userAuth';

function UserProfile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  // 伺服器名稱映射
  const serverNames = {
    'varena': 'Varena',
    'saalfeld': 'Saalfeld',
    'fedimian': 'Fedimian',
    'klaipeda': 'Klaipeda'
  };
  
  // 檢查用戶登入狀態
  useEffect(() => {
    const currentUser = checkUserAuth();
    setUser(currentUser);
  }, []);
  
  // 處理登出
  const handleLogout = () => {
    logoutUser();
    setUser(null);
    setDropdownOpen(false);
    
    // 重新導向到登入頁面
    navigate('/login');
  };
  
  // 切換下拉選單
  const toggleDropdown = () => {
    setDropdownOpen(prev => !prev);
  };
  
  // 如果用戶未登入，顯示登入按鈕
  if (!user) {
    return (
      <div className="user-profile">
        <button 
          className="login-btn"
          onClick={() => navigate('/login')}
        >
          <i className="fas fa-sign-in-alt"></i> 登入
        </button>
      </div>
    );
  }
  
  // 用戶已登入，顯示用戶信息
  return (
    <div className="user-profile">
      <div className="user-info" onClick={toggleDropdown}>
        <span className="server-badge">
          {serverNames[user.serverId] || user.serverId}
        </span>
        <span className="user-name">{user.playerId}</span>
        <i className={`fas fa-chevron-${dropdownOpen ? 'up' : 'down'}`}></i>
      </div>
      
      {dropdownOpen && (
        <div className="user-dropdown">
          <div className="dropdown-info">
            <div className="dropdown-item">
              <i className="fas fa-server"></i>
              <span>伺服器: {serverNames[user.serverId] || user.serverId}</span>
            </div>
            <div className="dropdown-item">
              <i className="fas fa-user"></i>
              <span>遊戲ID: {user.playerId}</span>
            </div>
          </div>
          <div className="dropdown-actions">
            <button 
              className="logout-btn"
              onClick={handleLogout}
            >
              <i className="fas fa-sign-out-alt"></i> 登出
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserProfile;