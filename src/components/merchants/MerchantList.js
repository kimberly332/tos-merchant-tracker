// src/components/merchants/MerchantList.js
import React, { useState, useEffect, useMemo } from 'react';
import { getAllMerchants, deleteMerchant } from '../../firebase/firestore';
import ItemCategoryFilter from '../search/ItemCategoryFilter';
import { useNavigate } from 'react-router-dom';
import MerchantItem from './MerchantItem';
import SuccessNotification from '../common/SuccessNotification';
import SearchWithSuggestions from '../search/SearchWithSuggestions';
import '../search/SearchWithSuggestions.css';

function MerchantList() {
  const navigate = useNavigate();
  const [merchants, setMerchants] = useState([]);
  const [filteredMerchants, setFilteredMerchants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState(['全部']);
  const [error, setError] = useState(null);
  const [copyMessage, setCopyMessage] = useState(null);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');

  // 排序選項 - 默認為五商優先
  const [sortOption, setSortOption] = useState('specialMerchantFirst');

  // 篩選選項
  const [showRegularMerchants, setShowRegularMerchants] = useState(true);
  const [showSpecialMerchants, setShowSpecialMerchants] = useState(true);

  // 刪除中狀態
  const [deleting, setDeleting] = useState(false);

  // 新增：用於跟踪哪些商人被展開
  const [expandedMerchants, setExpandedMerchants] = useState({});

  // 從所有商人數據中提取關鍵詞 (即使不使用，仍保留這個邏輯作為參考)
  const searchKeywords = useMemo(() => {
    if (!merchants || merchants.length === 0) return [];

    const keywordsSet = new Set();

    merchants.forEach(merchant => {
      // 添加玩家ID作為關鍵詞
      if (merchant.playerId) keywordsSet.add(merchant.playerId);

      // 處理商人的物品
      if (merchant.items && Array.isArray(merchant.items)) {
        merchant.items.forEach(item => {
          // 添加物品名稱
          if (item.itemName) keywordsSet.add(item.itemName);

          // 添加物品類別，如果不是「其他」
          if (item.category && item.category !== "其他") {
            keywordsSet.add(item.category);
          }

          // 添加交換物品名稱，如果不是「其他」
          if (item.exchangeItemName && item.exchangeItemName !== "其他") {
            keywordsSet.add(item.exchangeItemName);
          }
        });
      }
    });

    // 轉換為數組並排序
    return Array.from(keywordsSet).sort();
  }, [merchants]);

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

        // Dispatch event about merchants' existence
        const merchantsExistEvent = new CustomEvent('merchantsExistence', {
          detail: { hasNoMerchants: data.length === 0 }
        });
        window.dispatchEvent(merchantsExistEvent);
      } catch (err) {
        console.error('Error fetching merchants:', err);
        setError('獲取商人資訊時發生錯誤，請稍後再試。');

        // Dispatch event about merchants' non-existence in case of error
        const merchantsExistEvent = new CustomEvent('merchantsExistence', {
          detail: { hasNoMerchants: true }
        });
        window.dispatchEvent(merchantsExistEvent);
      } finally {
        setLoading(false);
      }
    };

    fetchMerchants();
  }, []);

  // Search, filter and sort - UPDATED to support expanding merchants
  useEffect(() => {
    // Ensure we have merchant data to process
    if (!merchants || merchants.length === 0) {
      setFilteredMerchants([]);
      return;
    }

    // Create a deep copy of merchant data
    let results = JSON.parse(JSON.stringify(merchants));

    // If search term exists, filter items within each merchant
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();

      // Create a new array with filtered merchant data
      results = results.map(merchant => {
        // Store all original items for expansion
        const allItems = [...merchant.items];

        // If merchant has items, filter them based on search term
        if (merchant.items && merchant.items.length > 0) {
          const filteredItems = merchant.items.filter(item =>
            (item.itemName && item.itemName.toLowerCase().includes(term)) ||
            (item.category && item.category.toLowerCase().includes(term)) ||
            (item.exchangeItemName && item.exchangeItemName.toLowerCase().includes(term))
          );

          // Add a property to track if this merchant's items were filtered
          const wasFiltered = filteredItems.length < allItems.length && filteredItems.length > 0;

          // Check if this merchant is expanded
          const isExpanded = expandedMerchants[merchant.id];

          // Return merchant with matching items or all items if expanded
          return {
            ...merchant,
            items: isExpanded ? allItems : filteredItems,
            allItems: allItems, // Store all items for later expansion
            filteredItems: filteredItems, // Store filtered items for display info
            wasFiltered: wasFiltered // Flag to show expansion toggle
          };
        }

        return merchant;
      }).filter(merchant =>
        // Keep only merchants with matching items or whose basic info matches
        (merchant.filteredItems && merchant.filteredItems.length > 0) ||
        (merchant.serverName && merchant.serverName.toLowerCase().includes(term)) ||
        (merchant.playerId && merchant.playerId.toLowerCase().includes(term)) ||
        (merchant.guildName && merchant.guildName.toLowerCase().includes(term))
      );
    } else {
      // No search term, just prepare merchants with expansion properties
      results = results.map(merchant => ({
        ...merchant,
        allItems: merchant.items,
        filteredItems: merchant.items,
        wasFiltered: false
      }));
    }

    // Category filtering - only items that match the selected categories
    if (!selectedCategories.includes('全部') && selectedCategories.length > 0) {
      results = results.map(merchant => {
        // Already have allItems from search
        const allItems = merchant.allItems || merchant.items;

        if (allItems && allItems.length > 0) {
          const filteredItems = allItems.filter(item => {
            return selectedCategories.some(selectedCategory =>
              (item.itemName && item.itemName.includes(selectedCategory)) ||
              (item.category && item.category.includes(selectedCategory))
            );
          });

          const wasFiltered = filteredItems.length < allItems.length && filteredItems.length > 0;
          const isExpanded = expandedMerchants[merchant.id];

          return {
            ...merchant,
            items: isExpanded ? allItems : filteredItems,
            allItems: allItems,
            filteredItems: filteredItems,
            wasFiltered: wasFiltered
          };
        }
        return merchant;
      }).filter(merchant => merchant.filteredItems && merchant.filteredItems.length > 0);
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
          const aPrice = Math.min(...(a.filteredItems || []).filter(i => i.price && i.price > 0).map(i => i.price) || [0]);
          const bPrice = Math.min(...(b.filteredItems || []).filter(i => i.price && i.price > 0).map(i => i.price) || [0]);
          return aPrice - bPrice;
        });
        break;
      case 'priceDesc':
        results.sort((a, b) => {
          if (a.isSpecialMerchant && !b.isSpecialMerchant) return -1;
          if (!a.isSpecialMerchant && b.isSpecialMerchant) return 1;
          const aPrice = Math.max(...(a.filteredItems || []).filter(i => i.price && i.price > 0).map(i => i.price) || [0]);
          const bPrice = Math.max(...(b.filteredItems || []).filter(i => i.price && i.price > 0).map(i => i.price) || [0]);
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
  }, [merchants, searchTerm, selectedCategories, showRegularMerchants, showSpecialMerchants, sortOption, expandedMerchants]);

  // 處理搜尋動作
  const handleSearch = (term) => {
    setSearchTerm(term);
    // Reset expanded merchants when performing a new search
    setExpandedMerchants({});
  };

  const handleCategorySelect = (categories) => {
    setSelectedCategories(categories);
    // Reset expanded merchants when changing category filters
    setExpandedMerchants({});
  };

  const handleSortChange = (e) => {
    setSortOption(e.target.value);
  };

  // 新增：處理展開/收起商人物品的切換
  const toggleMerchantExpansion = (merchantId) => {
    setExpandedMerchants(prev => ({
      ...prev,
      [merchantId]: !prev[merchantId]
    }));
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

  // Handle merchant deletion
  const handleDeleteMerchant = async (merchantId) => {
    if (!window.confirm('確定要刪除這個商人資訊嗎？此操作無法撤銷。')) {
      return;
    }

    setDeleting(true);
    try {
      const result = await deleteMerchant(merchantId);

      if (result.success) {
        // Update local merchant list
        const updatedMerchants = merchants.filter(m => m.id !== merchantId);
        setMerchants(updatedMerchants);

        // Clear cart if it contains items from this merchant
        try {
          const savedCart = localStorage.getItem('shoppingCart');
          if (savedCart) {
            const cartItems = JSON.parse(savedCart);
            const updatedCart = cartItems.filter(item =>
              !item.merchantId || item.merchantId !== merchantId
            );

            localStorage.setItem('shoppingCart', JSON.stringify(updatedCart));

            // Notify shopping cart component
            const cartUpdatedEvent = new CustomEvent('cartUpdated', {
              detail: { cart: updatedCart }
            });
            window.dispatchEvent(cartUpdatedEvent);
          }
        } catch (error) {
          console.error('Error updating cart after deletion:', error);
        }

        // Show success notification
        setNotificationMessage('商人資訊已成功刪除！');
        setShowNotification(true);
      } else {
        setError('刪除商人資訊時發生錯誤，請稍後再試。');
      }
    } catch (err) {
      console.error('Error deleting merchant:', err);
      setError('刪除商人資訊時發生錯誤，請稍後再試。');
    } finally {
      setDeleting(false);
    }
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
        {/* 使用新的搜尋組件，設置為使用資料庫數據 */}
        <SearchWithSuggestions
          onSearch={handleSearch}
          placeholder="搜尋物品..."
          initialValue={searchTerm}
          useRealTimeItems={false} // 不使用實時物品，而是使用固定資料庫
          allItems={searchKeywords} // 這個值不會被使用，但保留參數傳遞
        />

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
          {filteredMerchants.filter(merchant => merchant.items && merchant.items.length > 0).map((merchant, index) => {
            // Skip if expired
            if (!merchant.expiresAt || new Date() > new Date(merchant.expiresAt)) return null;

            // Get current user playerId from localStorage
            const currentPlayerId = localStorage.getItem('submitterPlayerId');
            const isOwnMerchant = currentPlayerId === merchant.playerId;

            // Check if this merchant is expanded
            const isExpanded = expandedMerchants[merchant.id];

            // Determine if there are more items to show
            const hasMoreItems = merchant.wasFiltered &&
              merchant.allItems &&
              merchant.filteredItems &&
              merchant.allItems.length > merchant.filteredItems.length;

            return (
              <div key={index} className={`merchant-card ${merchant.isSpecialMerchant ? 'special-merchant-card' : ''}`}>
                <div className="merchant-header">
                  <div className="merchant-title">
                    <h3
                      className="player-id-copy"
                      onClick={() => copyToClipboard(merchant.playerId)}
                      title="點擊複製玩家ID"
                    >
                      {/* {merchant.playerId} 提供 <span className="copy-icon">📋 (複製ID)</span> */}
                      {merchant.playerId} <i className="fas fa-copy copy-icon"></i>
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
                    <ul className={`items-list ${merchant.wasFiltered && isExpanded ? 'items-expanding' : ''}`}>
                      {merchant.items.map((item, itemIndex) => (
                        <MerchantItem
                          key={itemIndex}
                          item={{ ...item, showQuantity: true }}
                          merchantInfo={{ ...merchant, id: merchant.id }}
                        />
                      ))}
                    </ul>

                    {/* Show expand/collapse button at the bottom if there are more items */}
                    {hasMoreItems && (
                      <button
                        className="expand-collapse-btn"
                        onClick={() => toggleMerchantExpansion(merchant.id)}
                      >
                        {isExpanded ? '收起顯示' : '顯示所有商品'}
                        <i className={`fas ${isExpanded ? 'fa-chevron-up' : 'fa-chevron-down'}`}></i>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="no-items">此商人沒有符合搜尋條件的物品</div>
                )}

                <div className="merchant-footer">
                  <div className="footer-content">
                    <div className="time-info">
                      <p className="submission-time">
                        {/* <span className="time-label">提交時間:</span> */}
                        <span>{formatTimestamp(merchant.timestamp)}</span>
                      </p>
                    </div>

                    {isOwnMerchant && (
                      <div className="edit-controls">
                        <button
                          className="edit-btn"
                          onClick={() => navigate(`/edit-merchant/${merchant.id}`)}
                          title="編輯商人資訊"
                          disabled={deleting}
                        >
                          {/* <span className="edit-icon">✏️</span> */}
                          編輯
                        </button>
                        <button
                          className="delete-btn"
                          onClick={() => handleDeleteMerchant(merchant.id)}
                          title="刪除商人資訊"
                          disabled={deleting}
                        >
                          {/* <span className="delete-icon">🗑️</span> */}
                          {deleting ? '刪除中...' : '刪除'}
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

      {/* Success notification */}
      {showNotification && (
        <SuccessNotification
          message={notificationMessage}
          duration={3000}
          onClose={() => {
            setShowNotification(false);
            setTimeout(() => setNotificationMessage(''), 300);
          }}
        />
      )}
    </div>
  );
}

export default MerchantList;