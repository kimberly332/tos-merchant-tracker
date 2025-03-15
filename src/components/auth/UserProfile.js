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
    'morning_harbor': '晨曦海港',
    'endless_seas': '無盡海域',
    'harbor_lights': '港灣燈火',
    'whisper_beach': '輕語海灘',
    'narrow_coast': '狹長海岸',
    'sea_breeze_pier': '海風碼頭',
    'summer_shallows': '盛夏淺灘',
    'winter_warmth_snow_route': '冬日暖屋&覆雪之路',
    'snow_traveler_winter_lake': '雪夜旅人&冬湖冰泉',
    'cargo_bay_sunshine_orchard': '貨運海灣&陽光果叢',
    'forest_hill_sunlit_path_dense_canyon': '林中山丘&沐光小徑&密林峽谷',
    'valley_sunset_mountain_trail_canyon_spring': '谷間餘暉&山嶺古道&峽谷清泉',
    'ancient_exploration_dark_cave_trial_path': '尋覓古跡&幽暗地洞&試煉之路'
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
              <span>遊戲名稱: {user.playerId}</span>
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