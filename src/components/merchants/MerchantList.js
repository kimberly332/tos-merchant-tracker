import React, { useState, useEffect } from 'react';
import { getAllMerchants } from '../../firebase/firestore';
import ItemCategoryFilter from '../search/ItemCategoryFilter';
import { useNavigate } from 'react-router-dom';
import MerchantItem from './MerchantItem';

function MerchantList() {
  const navigate = useNavigate();
  const [merchants, setMerchants] = useState([]);
  const [filteredMerchants, setFilteredMerchants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState(['全部']);
  const [error, setError] = useState(null);
  const [copyMessage, setCopyMessage] = useState(null);
  
  // 排序選項 - 默認為五商優先
  const [sortOption, setSortOption] = useState('specialMerchantFirst');

  // 篩選選項
  const [showRegularMerchants, setShowRegularMerchants] = useState(true);
  const [showSpecialMerchants, setShowSpecialMerchants] = useState(true);

  // Copy to clipboard function
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopyMessage(`已複製: ${text}`);
        setTimeout(() => setCopyMessage(null), 3000);
      })
      .catch(err => {
        console.error('無法複製文本: ', err);
        setCopyMessage('複製失敗，請手動複製');
        setTimeout(() => setCopyMessage(null), 3000);
      });
  };
  
  // Fetch all merchants
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

  // Search, filter and sort
  useEffect(() => {
    // Ensure we have merchant data to process
    if (!merchants || merchants.length === 0) {
      setFilteredMerchants([]);
      return;
    }
    
    // Create a deep copy of merchant data
    let results = JSON.parse(JSON.stringify(merchants));
    
    // Category filtering
    if (!selectedCategories.includes('全部') && selectedCategories.length > 0) {
      results = results.filter(merchant => 
        merchant.items && merchant.items.some(item => {
          return selectedCategories.some(selectedCategory => 
            (item.itemName && item.itemName.includes(selectedCategory)) || 
            (item.category && item.category.includes(selectedCategory))
          );
        })
      );
    }
    
    // Keyword search
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      results = results.filter(merchant =>
        // Search merchant basic info
        (merchant.serverName && merchant.serverName.toLowerCase().includes(term)) ||
        (merchant.playerId && merchant.playerId.toLowerCase().includes(term)) ||
        (merchant.guildName && merchant.guildName.toLowerCase().includes(term)) ||
        // Search item related info
        (merchant.items && merchant.items.some(item => 
          (item.itemName && item.itemName.toLowerCase().includes(term)) ||
          (item.category && item.category.toLowerCase().includes(term)) ||
          (item.exchangeItemName && item.exchangeItemName.toLowerCase().includes(term))
        ))
      );
    }
    
    // Merchant type filtering
    results = results.filter(merchant => 
      (showRegularMerchants && !merchant.isSpecialMerchant) || 
      (showSpecialMerchants && merchant.isSpecialMerchant)
    );
    
    // Sorting
    switch (sortOption) {
      case 'newest':
        // Sort by special merchant first, then by time
        results.sort((a, b) => {
          if (a.isSpecialMerchant && !b.isSpecialMerchant) return -1;
          if (!a.isSpecialMerchant && b.isSpecialMerchant) return 1;
          return new Date(b.timestamp) - new Date(a.timestamp);
        });
        break;
      case 'oldest':
        results.sort((a, b) => {
          if (a.isSpecialMerchant && !b.isSpecialMerchant) return -1;
          if (!a.isSpecialMerchant && b.isSpecialMerchant) return 1;
          return new Date(a.timestamp) - new Date(b.timestamp);
        });
        break;
      case 'priceAsc':
        results.sort((a, b) => {
          if (a.isSpecialMerchant && !b.isSpecialMerchant) return -1;
          if (!a.isSpecialMerchant && b.isSpecialMerchant) return 1;
          const aPrice = Math.min(...a.items.filter(i => i.price && i.price > 0).map(i => i.price) || [0]);
          const bPrice = Math.min(...b.items.filter(i => i.price && i.price > 0).map(i => i.price) || [0]);
          return aPrice - bPrice;
        });
        break;
      case 'priceDesc':
        results.sort((a, b) => {
          if (a.isSpecialMerchant && !b.isSpecialMerchant) return -1;
          if (!a.isSpecialMerchant && b.isSpecialMerchant) return 1;
          const aPrice = Math.max(...a.items.filter(i => i.price && i.price > 0).map(i => i.price) || [0]);
          const bPrice = Math.max(...b.items.filter(i => i.price && i.price > 0).map(i => i.price) || [0]);
          return bPrice - aPrice;
        });
        break;
      case 'specialMerchantFirst':
        // Special merchant priority sort
        results.sort((a, b) => {
          if (a.isSpecialMerchant && !b.isSpecialMerchant) return -1;
          if (!a.isSpecialMerchant && b.isSpecialMerchant) return 1;
          return new Date(b.timestamp) - new Date(a.timestamp);
        });
        break;
      default:
        // Default is also special merchant first
        results.sort((a, b) => {
          if (a.isSpecialMerchant && !b.isSpecialMerchant) return -1;
          if (!a.isSpecialMerchant && b.isSpecialMerchant) return 1;
          return new Date(b.timestamp) - new Date(a.timestamp);
        });
        break;
    }
    
    setFilteredMerchants(results);
  }, [merchants, searchTerm, selectedCategories, showRegularMerchants, showSpecialMerchants, sortOption]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleCategorySelect = (categories) => {
    setSelectedCategories(categories);
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

  // Count special and regular merchants
  const specialMerchantCount = filteredMerchants.filter(m => m.isSpecialMerchant).length;
  const regularMerchantCount = filteredMerchants.filter(m => !m.isSpecialMerchant).length;

  return (
    <div className="merchant-list-container">
      {copyMessage && (
        <div className="copy-message">
          {copyMessage}
        </div>
      )}
      <div className="search-filter-section">
        <div className="search-input-container">
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="搜尋物品..."
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
          selectedCategories={selectedCategories}
        />
      </div>

      {error && <div className="error-message">{error}</div>}
      
      {loading ? (
        <div className="loading-indicator">載入中...</div>
      ) : filteredMerchants.length === 0 ? (
        <div className="no-results">
          {searchTerm || !selectedCategories.includes('全部') ? 
            `沒有符合條件的商人資訊。` : 
            `目前沒有商人資訊，請添加商人。`}
        </div>
      ) : (
        <div className="merchants-grid">
          {filteredMerchants.map((merchant, index) => {
            // Skip if expired
            if (!merchant.expiresAt || new Date() > new Date(merchant.expiresAt)) return null;
            
            return (
              <div key={index} className={`merchant-card ${merchant.isSpecialMerchant ? 'special-merchant-card' : ''}`}>
                <div className="merchant-header">
                  <div className="merchant-title">
                    <h3 
                      className="player-id-copy" 
                      onClick={() => copyToClipboard(merchant.playerId)}
                      title="點擊複製玩家ID"
                    >
                      {merchant.playerId} 提供 <span className="copy-icon">📋 (複製ID)</span>
                    </h3>
                    {merchant.isSpecialMerchant && (
                      <span className="special-merchant-badge">五商</span>
                    )}
                  </div>
                  {merchant.discount && (
                    <p className="discount-info">折扣: {merchant.discount}</p>
                  )}
                </div>
                
                {merchant.items && merchant.items.length > 0 ? (
                  <div className="items-section">
                    <h4>販售物品:</h4>
                    <ul className="items-list">
                      {merchant.items.map((item, itemIndex) => (
                        <MerchantItem 
                          key={itemIndex} 
                          item={item} 
                          merchantInfo={merchant}
                        />
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="no-items">此商人沒有物品信息</div>
                )}
                
                <div className="merchant-footer">
                  <div className="footer-content">
                    <div className="time-info">
                      <p className="submission-time">
                        <span className="time-label">提交時間:</span>
                        <span>{formatTimestamp(merchant.timestamp)}</span>
                      </p>
                    </div>
                    
                    {localStorage.getItem('submitterPlayerId') === merchant.playerId && (
                      <div className="edit-controls">
                        <button 
                          className="edit-btn"
                          onClick={() => navigate(`/edit-merchant/${merchant.id}`)}
                          title="編輯商人資訊"
                        >
                          <span className="edit-icon">✏️</span> 編輯
                        </button>
                      </div>
                    )}
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