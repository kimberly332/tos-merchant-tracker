import React, { useState } from 'react';
import { searchItems } from '../../firebase/firestore';
import ItemCategoryFilter from './ItemCategoryFilter';

function ItemSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);
  // 修改為數組以支持多選
  const [selectedCategories, setSelectedCategories] = useState(['全部']);
  const [copyMessage, setCopyMessage] = useState(null);

  // 複製到剪貼板的函數
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        // 顯示提示訊息
        setCopyMessage(`已複製: ${text}`);
        // 3秒後清除訊息
        setTimeout(() => setCopyMessage(null), 3000);
      })
      .catch(err => {
        console.error('無法複製文本: ', err);
        setCopyMessage('複製失敗，請手動複製');
        setTimeout(() => setCopyMessage(null), 3000);
      });
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!searchTerm.trim()) return;
    
    setSearching(true);
    setSearchResults([]);
    
    try {
      const results = await searchItems(searchTerm);
      setSearchResults(results);
      setSearchPerformed(true);
    } catch (error) {
      console.error('Error searching for items:', error);
    } finally {
      setSearching(false);
    }
  };
  
  // 更新類別選擇處理函數以支持多選
  const handleCategorySelect = (categories) => {
    setSelectedCategories(categories);
  };
  
  // Filter results by categories if needed
  const filteredResults = searchResults.filter(merchant => {
    // 如果選擇了「全部」類別或沒有選擇任何類別，則不進行類別篩選
    if (selectedCategories.includes('全部') || selectedCategories.length === 0) {
      return true;
    }
    
    // 檢查商人是否有任何項目匹配已選擇的類別
    return merchant.items.some(item => 
      selectedCategories.some(selectedCategory => 
        item.category === selectedCategory || 
        item.itemName === selectedCategory || 
        // Handle case when items don't have categories in older data
        (selectedCategory === '其他' && !item.category)
      )
    );
  });

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

  return (
    <div className="item-search-container">
        {copyMessage && (
          <div className="copy-message">
            {copyMessage}
          </div>
        )}
      <form onSubmit={handleSubmit} className="search-form">
        <div className="search-input-container">
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="輸入物品名稱"
            className="search-input"
            required
          />
          <button type="submit" className="search-button" disabled={searching}>
            {searching ? '搜尋中...' : '搜尋'}
          </button>
        </div>
      </form>

      {searchPerformed && (
        <div className="search-results">
          <h2>搜尋結果</h2>
          
          {searchPerformed && <ItemCategoryFilter 
            onCategorySelect={handleCategorySelect}
            selectedCategories={selectedCategories}
          />}
          
          {(filteredResults.length === 0 && searchPerformed) ? (
            <p className="no-results">
              無法找到符合「{searchTerm}」
              {!selectedCategories.includes('全部') ? 
                `和選定類別 ${selectedCategories.join(', ')} ` : 
                ''}
              的商人資訊。
            </p>
          ) : (
            <div className="results-list">
              {filteredResults.map((merchant, index) => {
                const remainingTime = true; // 保留這個變數但改變其用途，僅用於檢查項目是否已過期
                
                // Skip if expired
                if (!merchant.expiresAt || new Date() > new Date(merchant.expiresAt)) return null;
                
                return (
                  <div key={index} className={`merchant-item ${merchant.isSpecialMerchant ? 'special-merchant' : ''}`}>
                    <div className="merchant-header">
                      <p 
                        className="player-info-copy" 
                        onClick={() => copyToClipboard(merchant.playerId)}
                        title="點擊複製玩家ID"
                      >
                        {merchant.playerId} 提供 <span className="copy-icon">📋 (複製ID)</span>
                      </p>
                      {merchant.discount && (
                        <p className="discount-info">今日折扣: {merchant.discount}</p>
                      )}
                      {merchant.isSpecialMerchant && (
                        <div className="special-merchant-badge">五商</div>
                      )}
                    </div>
                    
                    <div className="items-list">
                      <h4>販售物品:</h4>
                      <ul>
                        {merchant.items.map((item, itemIndex) => (
                          <li key={itemIndex} className="item">
                            <span className="item-name">{item.itemName}</span>
                            <span className="item-category">類別: {item.category || '其他'}</span>
                            
                            {/* 數量顯示 */}
                            <div className="item-quantities">
                              <span className="item-quantity">總數量: {item.quantity || 1}</span>
                              {item.availableQuantity && (
                                <span className="item-available-quantity">本攤位可購: {item.availableQuantity}</span>
                              )}
                            </div>
                            
                            {item.allowsCoinExchange && (
                              <span className="item-price">單價: {item.price} 銀幣</span>
                            )}
                            
                            {item.allowsBarterExchange && (
                              <span className="item-exchange">
                                交換: {item.exchangeQuantity} {item.exchangeItemName}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="merchant-footer">
                      <p className="timestamp">
                        <small>
                          提交時間: {formatTimestamp(merchant.timestamp)}
                        </small>
                      </p>
                    </div>
                  </div>
                );
              }).filter(Boolean)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ItemSearch;