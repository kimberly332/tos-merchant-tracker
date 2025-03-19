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

  // 篩選選項 - 使用標準的複選框模式
  const [showRegularMerchants, setShowRegularMerchants] = useState(true);
  const [showSpecialMerchants, setShowSpecialMerchants] = useState(true);
  const [showHoneyMerchants, setShowHoneyMerchants] = useState(true);

  // 移動設備篩選選項 - 使用單一選擇模式
  const [mobileFilterType, setMobileFilterType] = useState('all');

  // 是否為移動設備視圖
  const [isMobileView, setIsMobileView] = useState(false);

  // 刪除中狀態
  const [deleting, setDeleting] = useState(false);

  // 用於跟踪哪些商人被展開
  const [expandedMerchants, setExpandedMerchants] = useState({});

  // 檢測視口寬度，判斷是否為移動設備視圖
  useEffect(() => {
    const checkViewportWidth = () => {
      setIsMobileView(window.innerWidth < 768);
    };

    // 初始檢查
    checkViewportWidth();

    // 監聽視口大小變化
    window.addEventListener('resize', checkViewportWidth);

    return () => {
      window.removeEventListener('resize', checkViewportWidth);
    };
  }, []);

  // 從所有商人數據中提取關鍵詞
  const searchKeywords = useMemo(() => {
    if (!merchants || merchants.length === 0) return [];

    const keywordsSet = new Set();

    merchants.forEach(merchant => {
      if (merchant.playerId) keywordsSet.add(merchant.playerId);
      if (merchant.items && Array.isArray(merchant.items)) {
        merchant.items.forEach(item => {
          if (item.itemName) keywordsSet.add(item.itemName);
          if (item.category && item.category !== "其他") {
            keywordsSet.add(item.category);
          }
          if (item.exchangeItemName && item.exchangeItemName !== "其他") {
            keywordsSet.add(item.exchangeItemName);
          }
        });
      }
    });

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

        const merchantsExistEvent = new CustomEvent('merchantsExistence', {
          detail: { hasNoMerchants: data.length === 0 }
        });
        window.dispatchEvent(merchantsExistEvent);
      } catch (err) {
        console.error('Error fetching merchants:', err);
        setError('獲取商人資訊時發生錯誤，請稍後再試。');

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

  // Search, filter and sort
  useEffect(() => {
    if (!merchants || merchants.length === 0) {
      setFilteredMerchants([]);
      return;
    }

    // Create a deep copy of merchant data
    let results = JSON.parse(JSON.stringify(merchants));

    // Check for honey merchants and mark them
    results = results.map(merchant => {
      let hasHoneyTrade = false;

      // Check if any item requires 蜂蜜 for exchange
      if (merchant.items && merchant.items.length > 0) {
        hasHoneyTrade = merchant.items.some(item =>
          item.allowsBarterExchange &&
          item.exchangeItemName === '蜂蜜'
        );
      }

      return {
        ...merchant,
        hasHoneyTrade
      };
    });

    // Search term filtering
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();

      results = results.map(merchant => {
        const allItems = [...merchant.items];

        if (merchant.items && merchant.items.length > 0) {
          const filteredItems = merchant.items.filter(item =>
            (item.itemName && item.itemName.toLowerCase().includes(term)) ||
            (item.category && item.category.toLowerCase().includes(term)) ||
            (item.exchangeItemName && item.exchangeItemName.toLowerCase().includes(term))
          );

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
      }).filter(merchant =>
        (merchant.filteredItems && merchant.filteredItems.length > 0) ||
        (merchant.serverName && merchant.serverName.toLowerCase().includes(term)) ||
        (merchant.playerId && merchant.playerId.toLowerCase().includes(term)) ||
        (merchant.guildName && merchant.guildName.toLowerCase().includes(term))
      );
    } else {
      results = results.map(merchant => ({
        ...merchant,
        allItems: merchant.items,
        filteredItems: merchant.items,
        wasFiltered: false
      }));
    }

    // Category filtering
    if (!selectedCategories.includes('全部') && selectedCategories.length > 0) {
      results = results.map(merchant => {
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

    // Merchant type filtering - 根據視圖類型使用不同的篩選模式
    if (isMobileView) {
      // 移動設備視圖 - 使用單一選擇模式
      switch (mobileFilterType) {
        case 'special':
          results = results.filter(merchant => merchant.isSpecialMerchant);
          break;
        case 'honey':
          results = results.filter(merchant => merchant.hasHoneyTrade);
          break;
        case 'regular':
          results = results.filter(merchant => !merchant.isSpecialMerchant && !merchant.hasHoneyTrade);
          break;
        default:
          // 'all' case - no filtering
          break;
      }
    } else {
      // 桌面視圖 - 使用複選框模式
      results = results.filter(merchant =>
        (showRegularMerchants && !merchant.isSpecialMerchant && !merchant.hasHoneyTrade) ||
        (showSpecialMerchants && merchant.isSpecialMerchant) ||
        (showHoneyMerchants && merchant.hasHoneyTrade)
      );
    }

    // Sorting
    switch (sortOption) {
      case "discountDesc":
        // 折扣高至低排序
        results.sort((a, b) => {
          // 五商優先
          if (a.isSpecialMerchant && !b.isSpecialMerchant) return -1;
          if (!a.isSpecialMerchant && b.isSpecialMerchant) return 1;

          // 解析折扣字符串，提取數字部分
          const getDiscountValue = (merchant) => {
            if (!merchant.discount) return 0;

            // 嘗試從字符串中提取數字
            const discountMatch = merchant.discount.match(/(\d+)/);
            if (discountMatch && discountMatch[1]) {
              return parseInt(discountMatch[1], 10);
            }
            return 0;
          };

          const aDiscount = getDiscountValue(a);
          const bDiscount = getDiscountValue(b);

          // 折扣高的優先顯示
          if (aDiscount !== bDiscount) {
            return bDiscount - aDiscount;
          }

          // 如果折扣相同，則按時間排序（最新優先）
          return new Date(b.timestamp) - new Date(a.timestamp);
        });
        break;
      case 'newest':
        results.sort((a, b) => {
          if (a.isSpecialMerchant && !b.isSpecialMerchant) return -1;
          if (!a.isSpecialMerchant && b.isSpecialMerchant) return 1;
          if (a.hasHoneyTrade && !b.hasHoneyTrade) return -1;
          if (!a.hasHoneyTrade && b.hasHoneyTrade) return 1;
          return new Date(b.timestamp) - new Date(a.timestamp);
        });
        break;
      case 'oldest':
        results.sort((a, b) => {
          if (a.isSpecialMerchant && !b.isSpecialMerchant) return -1;
          if (!a.isSpecialMerchant && b.isSpecialMerchant) return 1;
          if (a.hasHoneyTrade && !b.hasHoneyTrade) return -1;
          if (!a.hasHoneyTrade && b.hasHoneyTrade) return 1;
          return new Date(a.timestamp) - new Date(b.timestamp);
        });
        break;
      case 'specialMerchantFirst':
      default:
        results.sort((a, b) => {
          if (a.isSpecialMerchant && !b.isSpecialMerchant) return -1;
          if (!a.isSpecialMerchant && b.isSpecialMerchant) return 1;
          if (a.hasHoneyTrade && !b.hasHoneyTrade) return -1;
          if (!a.hasHoneyTrade && b.hasHoneyTrade) return 1;
          return new Date(b.timestamp) - new Date(a.timestamp);
        });
        break;
    }

    setFilteredMerchants(results);
  }, [merchants, searchTerm, selectedCategories, showRegularMerchants, showSpecialMerchants, showHoneyMerchants, mobileFilterType, isMobileView, sortOption, expandedMerchants]);

  // 處理搜尋動作
  const handleSearch = (term) => {
    setSearchTerm(term);
    setExpandedMerchants({});
  };

  const handleCategorySelect = (categories) => {
    setSelectedCategories(categories);
    setExpandedMerchants({});
  };

  const handleSortChange = (e) => {
    setSortOption(e.target.value);
  };

  // 處理商人類型選擇 (移動設備)
  const handleMobileFilterChange = (type) => {
    setMobileFilterType(type);
  };

  // 處理展開/收起商人物品的切換
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
        const updatedMerchants = merchants.filter(m => m.id !== merchantId);
        setMerchants(updatedMerchants);

        try {
          const savedCart = localStorage.getItem('shoppingCart');
          if (savedCart) {
            const cartItems = JSON.parse(savedCart);
            const updatedCart = cartItems.filter(item =>
              !item.merchantId || item.merchantId !== merchantId
            );

            localStorage.setItem('shoppingCart', JSON.stringify(updatedCart));

            const cartUpdatedEvent = new CustomEvent('cartUpdated', {
              detail: { cart: updatedCart }
            });
            window.dispatchEvent(cartUpdatedEvent);
          }
        } catch (error) {
          console.error('Error updating cart after deletion:', error);
        }

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

  // Count merchants by type for filter displays
  const specialMerchantCount = merchants.filter(m => m.isSpecialMerchant).length;
  const honeyMerchantCount = merchants.filter(m =>
    m.items && m.items.some(item => item.allowsBarterExchange && item.exchangeItemName === '蜂蜜')
  ).length;
  const regularMerchantCount = merchants.filter(m => {
    const isSpecial = m.isSpecialMerchant;
    const hasHoneyTrade = m.items && m.items.some(item =>
      item.allowsBarterExchange && item.exchangeItemName === '蜂蜜'
    );
    return !isSpecial && !hasHoneyTrade;
  }).length;

  return (
    <div className="merchant-list-container">
      {copyMessage && (
        <div className="copy-message">
          {copyMessage}
        </div>
      )}
      <div className="search-filter-section">
        <SearchWithSuggestions
          onSearch={handleSearch}
          placeholder="搜尋物品..."
          initialValue={searchTerm}
          useRealTimeItems={false}
          allItems={searchKeywords}
        />

        {/* 根據視圖顯示不同的過濾UI */}
        {isMobileView ? (
          /* 移動設備視圖 - 標籤式過濾器 */
          <div className="filter-row">
            <div className="merchant-type-tabs">
              <button
                className={`merchant-type-tab ${mobileFilterType === 'all' ? 'active' : ''}`}
                onClick={() => handleMobileFilterChange('all')}
              >
                全部 ({merchants.length})
              </button>
              <button
                className={`merchant-type-tab ${mobileFilterType === 'special' ? 'active' : ''}`}
                onClick={() => handleMobileFilterChange('special')}
              >
                五商 ({specialMerchantCount})
              </button>
              <button
                className={`merchant-type-tab ${mobileFilterType === 'honey' ? 'active' : ''}`}
                onClick={() => handleMobileFilterChange('honey')}
              >
                蜂蜜交易 ({honeyMerchantCount})
              </button>
              <button
                className={`merchant-type-tab ${mobileFilterType === 'regular' ? 'active' : ''}`}
                onClick={() => handleMobileFilterChange('regular')}
              >
                普通商人 ({regularMerchantCount})
              </button>
            </div>


            <div className="sort-options">
              <select
                id="sort-select"
                value={sortOption}
                onChange={handleSortChange}
                className="sort-select"
              >
                <option value="specialMerchantFirst">五商優先</option>
                <option value="discountDesc">折扣高至低</option>
                <option value="newest">最新發布</option>
                <option value="oldest">最早發布</option>
              </select>
            </div>
          </div>
        ) : (
          /* 桌面視圖 - 複選框過濾器 */
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
                  checked={showHoneyMerchants}
                  onChange={() => setShowHoneyMerchants(!showHoneyMerchants)}
                />
                顯示蜂蜜交易 ({honeyMerchantCount})
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
                <option value="discountDesc">折扣高至低</option>
                <option value="newest">最新發布</option>
                <option value="oldest">最早發布</option>
              </select>
            </div>
          </div>
        )}

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

            // Determine merchant card class based on merchant type
            const merchantCardClass = merchant.isSpecialMerchant
              ? 'merchant-card special-merchant-card'
              : merchant.hasHoneyTrade
                ? 'merchant-card honey-merchant-card'
                : 'merchant-card';

            return (
              <div key={index} className={merchantCardClass}>
                <div className="merchant-header">
                  <div className="merchant-title">
                    <h3
                      className="player-id-copy"
                      onClick={() => copyToClipboard(merchant.playerId)}
                      title="點擊複製玩家ID"
                    >
                      {merchant.playerId} <i className="fas fa-copy copy-icon"></i>
                    </h3>
                    {merchant.isSpecialMerchant && (
                      <span className="special-merchant-badge">五商</span>
                    )}
                    {merchant.hasHoneyTrade && !merchant.isSpecialMerchant && (
                      <span className="honey-merchant-badge">蜂蜜交易</span>
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
                          編輯
                        </button>
                        <button
                          className="delete-btn"
                          onClick={() => handleDeleteMerchant(merchant.id)}
                          title="刪除商人資訊"
                          disabled={deleting}
                        >
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