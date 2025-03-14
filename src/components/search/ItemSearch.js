import React, { useState } from 'react';
import { searchItems } from '../../firebase/firestore';
import ItemCategoryFilter from './ItemCategoryFilter';
import MerchantItem from '../merchants/MerchantItem';

function ItemSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState(['全部']);
  const [copyMessage, setCopyMessage] = useState(null);

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

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!searchTerm.trim()) return;
    
    setSearching(true);
    setSearchResults([]);
    
    try {
      // This will fetch results where items match the search term
      // The backend searchItems function already filters to only matching items
      const results = await searchItems(searchTerm);
      setSearchResults(results);
      setSearchPerformed(true);
    } catch (error) {
      console.error('Error searching for items:', error);
    } finally {
      setSearching(false);
    }
  };
  
  // Update category selection to support multi-select
  const handleCategorySelect = (categories) => {
    setSelectedCategories(categories);
  };
  
  // Filter results by categories if needed
  const filteredResults = searchResults.map(merchant => {
    // If '全部' category is selected or no categories selected, don't filter items
    if (selectedCategories.includes('全部') || selectedCategories.length === 0) {
      return merchant;
    }
    
    // Filter merchant's items to only include those matching selected categories
    const filteredItems = merchant.items.filter(item => 
      selectedCategories.some(selectedCategory => 
        (item.itemName && item.itemName.includes(selectedCategory)) || 
        (item.category && item.category.includes(selectedCategory)) || 
        // Handle case when items don't have categories in older data
        (selectedCategory === '其他' && !item.category)
      )
    );
    
    // Return merchant with filtered items
    return {
      ...merchant,
      items: filteredItems
    };
  }).filter(merchant => merchant.items.length > 0); // Only include merchants with items after filtering

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
                      <h4>符合的物品:</h4>
                      <ul>
                        {merchant.items.map((item, itemIndex) => (
                          <MerchantItem 
                            key={itemIndex} 
                            item={{...item, showQuantity: true}} 
                            merchantInfo={merchant}
                          />
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