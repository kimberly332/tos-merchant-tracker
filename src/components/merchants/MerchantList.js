import React, { useState, useEffect } from 'react';
import { getAllMerchants } from '../../firebase/firestore';

function MerchantList() {
  const [merchants, setMerchants] = useState([]);
  const [filteredMerchants, setFilteredMerchants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [showSpecialMerchants, setShowSpecialMerchants] = useState(true);
  const [sortOption, setSortOption] = useState('五商優先');
  
  const categories = ['全部', '家園幣', '食品原料', '調味品', '飲料'];
  
  // Fetch merchants
  useEffect(() => {
    const fetchMerchants = async () => {
      setLoading(true);
      try {
        const data = await getAllMerchants();
        setMerchants(data);
        setFilteredMerchants(data);
      } catch (error) {
        console.error('Error fetching merchants:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMerchants();
  }, []);
  
  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };
  
  // Handle search form submission
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    // Filter merchants based on search term
    filterMerchants();
  };
  
  // Filter merchants based on all criteria
  const filterMerchants = () => {
    let filtered = [...merchants];
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(merchant => 
        merchant.playerId.toLowerCase().includes(term) ||
        merchant.items.some(item => 
          item.itemName.toLowerCase().includes(term)
        )
      );
    }
    
    // Filter by category
    if (selectedCategory !== '全部') {
      filtered = filtered.filter(merchant =>
        merchant.items.some(item => 
          item.category === selectedCategory || item.itemName === selectedCategory
        )
      );
    }
    
    // Filter by merchant type
    if (!showSpecialMerchants) {
      filtered = filtered.filter(merchant => !merchant.isSpecialMerchant);
    }
    
    // Sort merchants
    if (sortOption === '五商優先') {
      filtered.sort((a, b) => {
        if (a.isSpecialMerchant && !b.isSpecialMerchant) return -1;
        if (!a.isSpecialMerchant && b.isSpecialMerchant) return 1;
        return 0;
      });
    }
    
    setFilteredMerchants(filtered);
  };
  
  return (
    <div className="merchant-list">
      <h1 className="page-title">搜尋商人</h1>
      
      <div className="search-container">
        <form className="search-form" onSubmit={handleSearchSubmit}>
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="搜尋物品、商人..."
            className="search-input"
          />
          <button type="submit" className="search-button">搜尋</button>
        </form>
        
        <div className="filter-pills">
          {categories.map(category => (
            <button
              key={category}
              className={`filter-pill ${selectedCategory === category ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
        
        <div className="filter-row">
          <div className="merchant-type-filter">
            <input
              type="checkbox"
              id="special-merchant-filter"
              checked={showSpecialMerchants}
              onChange={() => setShowSpecialMerchants(!showSpecialMerchants)}
            />
            <label htmlFor="special-merchant-filter">五商</label>
          </div>
          
          <select
            className="sort-dropdown"
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
          >
            <option value="五商優先">五商優先</option>
            <option value="最新發布">最新發布</option>
            <option value="價格低到高">價格低到高</option>
          </select>
        </div>
      </div>
      
      {loading ? (
        <div className="loading">載入中...</div>
      ) : filteredMerchants.length === 0 ? (
        <div className="no-results">無符合條件的商人</div>
      ) : (
        <div className="merchant-cards">
          {filteredMerchants.map((merchant, index) => (
            <div 
              key={index}
              className={`merchant-card ${merchant.isSpecialMerchant ? 'special-merchant-card' : 'regular-merchant-card'}`}
            >
              <div className="merchant-header">
                <div className="merchant-id">玩家ID: {merchant.playerId}</div>
                {merchant.isSpecialMerchant && (
                  <div className="merchant-badge">五商</div>
                )}
              </div>
              
              <div className="merchant-items">
                {merchant.items.map((item, itemIndex) => (
                  <div key={itemIndex} className="item-row">
                    <div className="item-name">{item.itemName}</div>
                    <div className="item-quantity">x{item.quantity}</div>
                  </div>
                ))}
                
                {merchant.items.map((item, itemIndex) => (
                  <div key={`tag-${itemIndex}`} className="item-tags">
                    {item.allowsCoinExchange && (
                      <div className="item-tag price-tag">
                        💰 價格: {item.price}
                      </div>
                    )}
                    
                    {item.allowsBarterExchange && (
                      <div className="item-tag exchange-tag">
                        🔄 交換: {item.exchangeQuantity} {item.exchangeItemName}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="merchant-footer">
                提交時間: {new Date(merchant.timestamp).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MerchantList;