// src/pages/LoginPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser, checkUserAuth } from '../firebase/userAuth';

function LoginPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    serverId: 'cargo_bay_sunshine_orchard',
    playerId: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // 伺服器選項
  const serverOptions = [
    { id: 'morning_harbor', name: '晨曦海港' },
    { id: 'endless_seas', name: '無盡海域' },
    { id: 'harbor_lights', name: '港灣燈火' },
    { id: 'whisper_beach', name: '輕語海灘' },
    { id: 'narrow_coast', name: '狹長海岸' },
    { id: 'sea_breeze_pier', name: '海風碼頭' },
    { id: 'summer_shallows', name: '盛夏淺灘' },
    { id: 'winter_warmth_snow_route', name: '冬日暖屋&覆雪之路' },
    { id: 'snow_traveler_winter_lake', name: '雪夜旅人&冬湖冰泉' },
    { id: 'cargo_bay_sunshine_orchard', name: '貨運海灣&陽光果叢' },
    { id: 'forest_hill_sunlit_path_dense_canyon', name: '林中山丘&沐光小徑&密林峽谷' },
    { id: 'valley_sunset_mountain_trail_canyon_spring', name: '谷間餘暉&山嶺古道&峽谷清泉' },
    { id: 'ancient_exploration_dark_cave_trial_path', name: '尋覓古跡&幽暗地洞&試煉之路' }
  ];
  
  // 檢查用戶是否已登入
  useEffect(() => {
    const currentUser = checkUserAuth();
    if (currentUser) {
      // 已登入則跳轉到首頁
      navigate('/');
    }
    
    // 嘗試從localStorage恢復之前填寫的ID
    const lastPlayerId = localStorage.getItem('submitterPlayerId');
    if (lastPlayerId) {
      setFormData(prev => ({
        ...prev,
        playerId: lastPlayerId
      }));
    }
  }, [navigate]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // 調用登入函數
      const result = await loginUser(formData.serverId, formData.playerId);
      
      if (result.success) {
        // 將用戶信息存儲到localStorage
        localStorage.setItem('currentUser', JSON.stringify({
          userId: result.userId,
          serverId: result.serverId,
          playerId: result.playerId
        }));

        const loginEvent = new CustomEvent('userLoginStateChanged');
        window.dispatchEvent(loginEvent);
        
        // 儲存提交者ID以便在創建商人記錄時使用
        localStorage.setItem('submitterPlayerId', result.playerId);
        
        // 恢復用戶的購物車
        if (result.shoppingCart && result.shoppingCart.length > 0) {
          localStorage.setItem('shoppingCart', JSON.stringify(result.shoppingCart));
          
          // 通知購物車組件更新
          const cartUpdatedEvent = new CustomEvent('cartUpdated', {
            detail: { cart: result.shoppingCart }
          });
          window.dispatchEvent(cartUpdatedEvent);
        }
        
        setSuccess('登入成功！將跳轉到首頁...');
        
        // 延遲跳轉以顯示成功訊息
        setTimeout(() => {
          navigate('/');
        }, 1500);
      } else {
        setError(result.message || '登入失敗，請稍後再試');
      }
    } catch (err) {
      console.error('登入時發生錯誤:', err);
      setError('登入時發生錯誤，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page login-page">
      <h1 className="login-title">登入</h1>
      <p className="description">
        選擇您的伺服器並輸入遊戲名稱進入本系統。
      </p>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      
      <div className="login-form-container">
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="serverId">伺服器</label>
            <select
              id="serverId"
              name="serverId"
              value={formData.serverId}
              onChange={handleChange}
              required
            >
              <option value="" disabled>請選擇伺服器</option>
              {serverOptions.map(server => (
                <option key={server.id} value={server.id}>
                  {server.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="playerId">遊戲名稱</label>
            <input
              type="text"
              id="playerId"
              name="playerId"
              value={formData.playerId}
              onChange={handleChange}
              placeholder="輸入您的遊戲名稱"
              required
            />
          </div>
          
          <button 
            type="submit" 
            className="submit-btn" 
            disabled={loading}
          >
            {loading ? '登入中...' : '登入'}
          </button>
        </form>
      </div>
      
      <div className="login-info">
        <h3>系統說明</h3>
        <ul>
          <li>每個伺服器都有獨立的商人資訊</li>
          <li>登入後可以查看和提交商人資訊</li>
          <li>您可以刪除自己提交的商人資訊</li>
          <li>購物車資訊會被保存，下次登入時仍可使用</li>
          <li>所有資訊會在每日台灣時間午夜 (00:00) 自動重置</li>
        </ul>
      </div>
    </div>
  );
}

export default LoginPage;