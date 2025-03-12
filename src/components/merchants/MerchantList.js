import React, { useState, useEffect } from 'react';
import { getAllMerchants } from '../../firebase/firestore';
import ItemCategoryFilter from '../search/ItemCategoryFilter';

function MerchantList() {
  const [merchants, setMerchants] = useState([]);
  const [filteredMerchants, setFilteredMerchants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [error, setError] = useState(null);
  
  // 排序選項 - 默認為五商優先
  const [sortOption, setSortOption] = useState('specialMerchantFirst');

  // 篩選選項
  const [showRegularMerchants, setShowRegularMerchants] = useState(true);
  const [showSpecialMerchants, setShowSpecialMerchants] = useState(true);
  
  // 獲取所有商人數據
  useEffect(() => {
    const fetchMerchants = async () => {
      setLoading(true);
      try {
        const data = await getAllMerchants();
        setMerchants(data);
        setFilteredMerchants(data);
      } catch (err) {
        console.error('Error fetching merchants:', err);
        setError('獲取商人資訊時發生錯誤，請稍後再試。');
      } finally {
        setLoading(false);
      }
    };

    fetchMerchants();
  }, []);

  // 搜尋、篩選和排序
  useEffect(() => {
    // 確保有商人數據才進行處理
    if (!merchants || merchants.length === 0) {
      setFilteredMerchants([]);
      return;
    }
    
    // 創建商人數據的深拷貝
    let results = JSON.parse(JSON.stringify(merchants));
    
    // 類別篩選
    if (selectedCategory !== '全部') {
      results = results.filter(merchant => 
        merchant.items && merchant.items.some(item => 
          (item.itemName && item.itemName.includes(selectedCategory)) || 
          (item.category && item.category.includes(selectedCategory)) ||
          (selectedCategory === '其他' && (!item.category || item.category === '其他'))
        )
      );
    }
    
    // 搜尋關鍵詞
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      results = results.filter(merchant =>
        // 搜尋商人基本信息
        (merchant.serverName && merchant.serverName.toLowerCase().includes(term)) ||
        (merchant.playerId && merchant.playerId.toLowerCase().includes(term)) ||
        (merchant.guildName && merchant.guildName.toLowerCase().includes(term)) ||
        (merchant.location && merchant.location.toLowerCase().includes(term)) ||
        // 搜尋物品相關信息
        (merchant.items && merchant.items.some(item => 
          (item.itemName && item.itemName.toLowerCase().includes(term)) ||
          (item.category && item.category.toLowerCase().includes(term)) ||
          (item.exchangeItemName && item.exchangeItemName.toLowerCase().includes(term))
        ))
      );
    }
    
    // 商人類型篩選
    results = results.filter(merchant => 
      (showRegularMerchants && !merchant.isSpecialMerchant) || 
      (showSpecialMerchants && merchant.isSpecialMerchant)
    );
    
    // 排序
    switch (sortOption) {
      case 'newest':
        // 先根據是否為五商排序，再根據時間
        results.sort((a, b) => {
          // 如果 a 是五商而 b 不是，a 應該在前面
          if (a.isSpecialMerchant && !b.isSpecialMerchant) return -1;
          // 如果 b 是五商而 a 不是，b 應該在前面
          if (!a.isSpecialMerchant && b.isSpecialMerchant) return 1;
          // 如果兩者都是五商或都不是五商，則按時間排序
          return new Date(b.timestamp) - new Date(a.timestamp);
        });
        break;
      case 'oldest':
        results.sort((a, b) => {
          // 五商優先
          if (a.isSpecialMerchant && !b.isSpecialMerchant) return -1;
          if (!a.isSpecialMerchant && b.isSpecialMerchant) return 1;
          // 時間排序
          return new Date(a.timestamp) - new Date(b.timestamp);
        });
        break;
      case 'priceAsc':
        results.sort((a, b) => {
          // 五商優先
          if (a.isSpecialMerchant && !b.isSpecialMerchant) return -1;
          if (!a.isSpecialMerchant && b.isSpecialMerchant) return 1;
          // 價格排序
          const aPrice = Math.min(...a.items.filter(i => i.price && i.price > 0).map(i => i.price) || [0]);
          const bPrice = Math.min(...b.items.filter(i => i.price && i.price > 0).map(i => i.price) || [0]);
          return aPrice - bPrice;
        });
        break;
      case 'priceDesc':
        results.sort((a, b) => {
          // 五商優先
          if (a.isSpecialMerchant && !b.isSpecialMerchant) return -1;
          if (!a.isSpecialMerchant && b.isSpecialMerchant) return 1;
          // 價格排序
          const aPrice = Math.max(...a.items.filter(i => i.price && i.price > 0).map(i => i.price) || [0]);
          const bPrice = Math.max(...b.items.filter(i => i.price && i.price > 0).map(i => i.price) || [0]);
          return bPrice - aPrice;
        });
        break;
      case 'specialMerchantFirst':
        // 專門的五商優先排序選項
        results.sort((a, b) => {
          if (a.isSpecialMerchant && !b.isSpecialMerchant) return -1;
          if (!a.isSpecialMerchant && b.isSpecialMerchant) return 1;
          // 如果都是五商或都不是五商，則按時間排序
          return new Date(b.timestamp) - new Date(a.timestamp);
        });
        break;
      default:
        // 默認也是五商優先
        results.sort((a, b) => {
          if (a.isSpecialMerchant && !b.isSpecialMerchant) return -1;
          if (!a.isSpecialMerchant && b.isSpecialMerchant) return 1;
          return new Date(b.timestamp) - new Date(a.timestamp);
        });
        break;
    }
    
    setFilteredMerchants(results);
  }, [merchants, searchTerm, selectedCategory, showRegularMerchants, showSpecialMerchants, sortOption]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
  };
  
  const handleSortChange = (e) => {
    setSortOption(e.target.value);
  };

  // Format timestamp to a readable date and time
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '未知時間';
    
    const date = new Date(timestamp);
    
    return date.toLocaleString('zh-TW', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateExpiration = (timestamp) => {
    if (!timestamp) return null;
    
    const createdDate = new Date(timestamp);
    const expirationDate = new Date(createdDate);
    expirationDate.setHours(expirationDate.getHours() + 24);
    
    const now = new Date();
    
    // If expired, return null
    if (now > expirationDate) return null;
    
    // Calculate remaining time
    const timeRemaining = expirationDate - now;
    const hoursRemaining = Math.floor(timeRemaining / (1000 * 60 * 60));
    const minutesRemaining = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hoursRemaining}小時 ${minutesRemaining}分鐘`;
  };

  // 計算五商數量和普通商人數量
  const specialMerchantCount = filteredMerchants.filter(m => m.isSpecialMerchant).length;
  const regularMerchantCount = filteredMerchants.filter(m => !m.isSpecialMerchant).length;

  return (
    <div className="merchant-list-container">
      <div className="search-filter-section">
        <div className="search-input-container">
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="搜尋物品、商人、伺服器..."
            className="search-input"
          />
        </div>
        
        <div className="filter-options">
          <div className="merchant-type-filter">
            <label className="filter-label">
              <input
                type="checkbox"
                checked={showSpecialMerchants}
                onChange={() => setShowSpecialMerchants(!showSpecialMerchants)}
              />
              顯示五商 ({specialMerchantCount})
            </label>
            <label className="filter-label">
              <input
                type="checkbox"
                checked={showRegularMerchants}
                onChange={() => setShowRegularMerchants(!showRegularMerchants)}
              />
              顯示普通商人 ({regularMerchantCount})
            </label>
          </div>
          
          <div className="sort-options">
            <label htmlFor="sort-select">排序方式:</label>
            <select 
              id="sort-select" 
              value={sortOption} 
              onChange={handleSortChange}
              className="sort-select"
            >
              <option value="specialMerchantFirst">五商優先</option>
              <option value="newest">最新發布</option>
              <option value="oldest">最早發布</option>
              <option value="priceAsc">價格低到高</option>
              <option value="priceDesc">價格高到低</option>
            </select>
          </div>
        </div>
        
        <ItemCategoryFilter 
          onCategorySelect={handleCategorySelect}
          selectedCategory={selectedCategory}
        />
      </div>

      {error && <div className="error-message">{error}</div>}
      
      {loading ? (
        <div className="loading-indicator">載入中...</div>
      ) : filteredMerchants.length === 0 ? (
        <div className="no-results">
          {searchTerm || selectedCategory !== '全部' ? 
            `沒有符合條件的商人資訊。` : 
            `目前沒有商人資訊，請添加商人。`}
        </div>
      ) : (
        <div className="merchants-grid">
          {filteredMerchants.map((merchant, index) => {
            const remainingTime = calculateExpiration(merchant.timestamp);
            
            // Skip if expired
            if (!remainingTime) return null;
            
            return (
              <div key={index} className={`merchant-card ${merchant.isSpecialMerchant ? 'special-merchant-card' : ''}`}>
                <div className="merchant-header">
                  <div className="merchant-title">
                    <h3>{merchant.serverName} 伺服器</h3>
                    {merchant.isSpecialMerchant && (
                      <span className="special-merchant-badge">五商</span>
                    )}
                  </div>
                  {merchant.guildName && (
                    <p className="guild-info">公會: {merchant.guildName}</p>
                  )}
                  {merchant.discount && (
                    <p className="discount-info">折扣: {merchant.discount}</p>
                  )}
                </div>
                
                {/* 五商特有信息 */}
                {merchant.isSpecialMerchant && (
                  <div className="special-merchant-info">
                    <p className="location">位置: {merchant.location || '未知'}</p>
                    <p className="exchange-rate">兌換比率: {merchant.exchangeRate} 銀幣/家園幣</p>
                    {merchant.totalAmount && (
                      <p className="total-amount">總額度: {merchant.totalAmount} 家園幣</p>
                    )}
                  </div>
                )}
                
                {merchant.items && merchant.items.length > 0 ? (
                  <div className="items-section">
                    <h4>販售物品:</h4>
                    <ul className="items-list">
                      {merchant.items.map((item, itemIndex) => (
                        <li key={itemIndex} className="item">
                          <div className="item-name-container">
                            <span className="item-name">{item.itemName || '未知物品'}</span>
                            {item.quantity > 1 && (
                              <span className="item-quantity">x{item.quantity}</span>
                            )}
                          </div>
                          
                          <div className="item-details">
                            {item.category && item.category !== '其他' && item.category !== item.itemName && (
                              <span className="item-category">{item.category}</span>
                            )}
                            
                            {/* 價格顯示，如果允許家園幣交易 */}
                            {(item.allowsCoinExchange || typeof item.allowsCoinExchange === 'undefined') && item.price > 0 && (
                              <div className="price-tag">
                                <span className="coin-icon">💰</span>
                                <span>{item.price}</span>
                              </div>
                            )}
                            
                            {/* 交換物品顯示，如果允許以物易物交易 */}
                            {item.allowsBarterExchange && item.exchangeItemName && (
                              <div className="exchange-tag">
                                <span className="exchange-icon">🔄</span>
                                <span>{item.exchangeQuantity || 1} {item.exchangeItemName}</span>
                              </div>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="no-items">此商人沒有物品信息</div>
                )}
                
                <div className="merchant-footer">
                  <p className="merchant-info">
                    <span className="player-label">提供者:</span>
                    <span className="player-id">{merchant.playerId}</span>
                  </p>
                  <div className="time-info">
                    <p className="submission-time">
                      <span className="time-label">提交時間:</span>
                      <span>{formatTimestamp(merchant.timestamp)}</span>
                    </p>
                    <p className="expiration-time">
                      <span className="time-label">剩餘時間:</span>
                      <span className="time-remaining">{remainingTime}</span>
                    </p>
                  </div>
                </div>
              </div>
            );
          }).filter(Boolean)}
        </div>
      )}
    </div>
  );
}

export default MerchantList;