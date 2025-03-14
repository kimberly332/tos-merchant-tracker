import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { checkUserAuth } from '../firebase/userAuth';
import SuccessNotification from '../components/common/SuccessNotification';

function CartDetailPage() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copyMessage, setCopyMessage] = useState(null);
  const [selectedMerchant, setSelectedMerchant] = useState(null);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  
  // Group items by merchant
  const groupedItems = useMemo(() => {
    const groups = {};
    
    cartItems.forEach(item => {
      const merchantId = item.playerId;
      if (!groups[merchantId]) {
        groups[merchantId] = {
          playerId: merchantId,
          items: []
        };
      }
      groups[merchantId].items.push(item);
    });
    
    return Object.values(groups);
  }, [cartItems]);
  
  // Memoized calculation of total coins and required materials
  const { totalCoins, requiredMaterials, itemCount } = useMemo(() => {
    let coins = 0;
    let materials = {};
    let count = 0;

    // Calculate for all cart items
    cartItems.forEach(item => {
      count += item.quantity;
      
      if (item.allowsCoinExchange && item.price) {
        coins += item.price * item.quantity;
      }

      if (item.allowsBarterExchange && item.exchangeItemName) {
        const materialName = item.exchangeItemName;
        const materialQty = (item.exchangeQuantity || 1) * item.quantity;

        materials[materialName] = (materials[materialName] || 0) + materialQty;
      }
    });

    return { 
      totalCoins: coins, 
      requiredMaterials: materials,
      itemCount: count
    };
  }, [cartItems]);
  
  // Prepare shopping list by materials
  const materialShoppingList = useMemo(() => {
    const materialsByMerchant = {};
    
    cartItems.forEach(item => {
      if (item.allowsBarterExchange && item.exchangeItemName) {
        const merchantId = item.playerId;
        const materialName = item.exchangeItemName;
        const materialQty = (item.exchangeQuantity || 1) * item.quantity;
        
        if (!materialsByMerchant[materialName]) {
          materialsByMerchant[materialName] = [];
        }
        
        // Check if this merchant already exists in the list for this material
        const existingMerchantIndex = materialsByMerchant[materialName].findIndex(
          m => m.playerId === merchantId
        );
        
        if (existingMerchantIndex >= 0) {
          // Add to existing merchant's quantity
          materialsByMerchant[materialName][existingMerchantIndex].quantity += materialQty;
        } else {
          // Add new merchant for this material
          materialsByMerchant[materialName].push({
            playerId: merchantId,
            quantity: materialQty,
            items: [item.itemName]
          });
        }
      }
    });
    
    return materialsByMerchant;
  }, [cartItems]);
  
  // Initialize cart data
  useEffect(() => {
    const currentUser = checkUserAuth();
    if (!currentUser) {
      navigate('/login');
      return;
    }
    
    // Load cart from localStorage
    try {
      setLoading(true);
      const savedCart = localStorage.getItem('shoppingCart');
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        
        // Log cart items for debugging
        console.log("Loaded cart items:", parsedCart);
        
        // Validate cart items
        const validatedCart = parsedCart.filter(item => 
          item.itemName && 
          item.playerId
        );
        
        // Ensure quantity is a number
        validatedCart.forEach(item => {
          if (typeof item.quantity !== 'number' || isNaN(item.quantity)) {
            item.quantity = 1; // Default to 1 if not a valid number
          }
          console.log(`Item ${item.itemName} quantity: ${item.quantity} (${typeof item.quantity})`);
        });

        setCartItems(validatedCart);
      }
    } catch (error) {
      console.error('Error loading cart:', error);
      setError('載入購物車資訊時發生錯誤，請重新整理頁面或回到首頁。');
    } finally {
      setLoading(false);
    }
  }, [navigate]);
  
  // Listen for cart updates
  useEffect(() => {
    const handleCartUpdate = (event) => {
      const updatedCart = event?.detail?.cart || [];
      setCartItems(updatedCart);
    };
    
    window.addEventListener('cartUpdated', handleCartUpdate);
    
    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
    };
  }, []);
  
  // Copy merchant ID to clipboard
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
  
  // Remove item from cart
  const removeFromCart = (item) => {
    const updatedItems = cartItems.filter(cartItem => 
      !(cartItem.itemName === item.itemName && cartItem.playerId === item.playerId)
    );
    
    setCartItems(updatedItems);
    localStorage.setItem('shoppingCart', JSON.stringify(updatedItems));
    
    // Dispatch event to update cart in other components
    const cartUpdatedEvent = new CustomEvent('cartUpdated', {
      detail: { cart: updatedItems }
    });
    window.dispatchEvent(cartUpdatedEvent);
    
    setNotificationMessage('已從購物車移除物品');
    setShowNotification(true);
  };
  
  // Clear entire cart
  const clearCart = () => {
    if (window.confirm('確定要清空購物車嗎？')) {
      setCartItems([]);
      localStorage.removeItem('shoppingCart');
      
      // Notify about empty cart
      const cartUpdatedEvent = new CustomEvent('cartUpdated', {
        detail: { cart: [] }
      });
      window.dispatchEvent(cartUpdatedEvent);
      
      setNotificationMessage('已清空購物車');
      setShowNotification(true);
    }
  };
  
  // Toggle merchant details
  const toggleMerchantDetails = (merchantId) => {
    if (selectedMerchant === merchantId) {
      setSelectedMerchant(null);
    } else {
      setSelectedMerchant(merchantId);
    }
  };
  
  if (loading) {
    return (
      <div className="page cart-detail-page">
        <h1>購物計劃詳情</h1>
        <div className="loading-container">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="page cart-detail-page">
        <h1>購物計劃詳情</h1>
        <div className="error-message">{error}</div>
        <button 
          className="back-btn"
          onClick={() => navigate('/')}
        >
          返回首頁
        </button>
      </div>
    );
  }

  return (
    <div className="page cart-detail-page">
      {copyMessage && (
        <div className="copy-message">
          {copyMessage}
        </div>
      )}
      
      <h1>購物計劃詳情</h1>
      <p className="description">
        查看您的購物計劃，整理所需物品和商人資訊，輕鬆安排您的購物路線。
      </p>
      
      {cartItems.length === 0 ? (
        <div className="empty-cart-message">
          <div className="no-results">
            購物車是空的，請返回首頁添加商品。
          </div>
          <button 
            className="primary-btn"
            onClick={() => navigate('/')}
          >
            <i className="fas fa-arrow-left"></i> 返回首頁
          </button>
        </div>
      ) : (
        <div className="cart-detail-container">
          {/* 購物摘要 */}
          <div className="cart-summary-card">
            <h2 className="section-title">購物摘要</h2>
            <div className="summary-content">
              <div className="summary-item">
                <span className="summary-label">物品總數:</span>
                <span className="summary-value">{itemCount} 件</span>
              </div>
              
              <div className="summary-item">
                <span className="summary-label">商人數量:</span>
                <span className="summary-value">{groupedItems.length} 位</span>
              </div>
              
              {totalCoins > 0 && (
                <div className="summary-item">
                  <span className="summary-label">家園幣總額:</span>
                  <span className="summary-value total-coins">💰 {totalCoins.toLocaleString()} 枚</span>
                </div>
              )}
              
              <div className="summary-actions">
                <button 
                  className="secondary-btn"
                  onClick={() => navigate('/')}
                >
                  <i className="fas fa-arrow-left"></i> 返回首頁
                </button>
                <button 
                  className="danger-btn"
                  onClick={clearCart}
                >
                  <i className="fas fa-trash-alt"></i> 清空購物車
                </button>
              </div>
            </div>
          </div>
          
          {/* 材料準備列表 */}
          {Object.keys(requiredMaterials).length > 0 && (
            <div className="materials-card">
              <h2 className="section-title">需要準備的材料</h2>
              <div className="materials-list">
                {Object.entries(requiredMaterials).map(([material, quantity]) => (
                  <div key={material} className="material-item">
                    <div className="material-header">
                      <span className="material-name">{material}</span>
                      <span className="material-quantity">{quantity.toLocaleString()} 個</span>
                    </div>
                    
                    {materialShoppingList[material] && (
                      <div className="material-merchants">
                        <span className="material-usage-label">用於購買:</span>
                        <ul className="material-usage-list">
                          {materialShoppingList[material].map((merchant, idx) => (
                            <li key={idx} className="material-usage-item">
                              <span 
                                className="merchant-id-copy" 
                                onClick={() => copyToClipboard(merchant.playerId)}
                              >
                                {merchant.playerId} <i className="fas fa-copy copy-icon"></i>
                              </span>
                              <span className="usage-details">
                                需要 {merchant.quantity} 個 • 購買: {merchant.items.join(', ')}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* 商人購買清單 */}
          <div className="merchants-card">
            <h2 className="section-title">商人購買清單</h2>
            <div className="merchants-list">
              {groupedItems.map((merchant, index) => (
                <div key={index} className="merchant-shopping-card">
                  <div 
                    className="merchant-header"
                    onClick={() => toggleMerchantDetails(merchant.playerId)}
                  >
                    <div className="merchant-info">
                      <h3 
                        className="merchant-name"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(merchant.playerId);
                        }}
                      >
                        {merchant.playerId} <i className="fas fa-copy copy-icon"></i>
                      </h3>
                      <span className="item-count">{merchant.items.length} 件物品 • {merchant.items.reduce((acc, item) => acc + item.quantity, 0)} 總數量</span>
                    </div>
                    <div className="merchant-collapse-icon">
                      <i className={`fas fa-chevron-${selectedMerchant === merchant.playerId ? 'up' : 'down'}`}></i>
                    </div>
                  </div>
                  
                  {selectedMerchant === merchant.playerId && (
                    <div className="merchant-items">
                      {merchant.items.map((item, itemIndex) => (
                        <div key={itemIndex} className="merchant-item">
                          <div className="item-details">
                            <div className="item-name-row">
                              <span className="item-name">{item.itemName}</span>
                              <span className="item-quantity">×{item.quantity}</span>
                            </div>
                            
                            <div className="item-details-row">
                              <span className="purchase-times">可購買 {item.purchaseTimes || 1} 次 (總計 {item.quantity * (item.purchaseTimes || 1)} 個)</span>
                            </div>
                            
                            <div className="item-price-row">
                              {item.allowsCoinExchange && item.price > 0 && (
                                <div className="price-tag">
                                  <span className="coin-icon">💰</span>
                                  <span>{item.price} 枚 (每次購買{item.quantity}個)</span>
                                </div>
                              )}
                              
                              {item.allowsBarterExchange && item.exchangeItemName && (
                                <div className="exchange-tag">
                                  <span className="exchange-icon">🔄</span>
                                  <span>需要 {item.exchangeItemName} × {(item.exchangeQuantity || 1)} 個 (每次)</span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <button 
                            className="remove-item-btn"
                            onClick={() => removeFromCart(item)}
                            title="從購物車移除"
                          >
                            <i className="fas fa-trash-alt"></i>
                          </button>
                        </div>
                      ))}
                      
                      <div className="merchant-summary">
                        {merchant.items.some(item => item.allowsCoinExchange && item.price > 0) && (
                          <div className="merchant-total">
                            <span className="merchant-total-label">商人小計:</span>
                            <span className="merchant-total-value">
                              💰 {merchant.items.reduce((acc, item) => acc + (item.allowsCoinExchange ? item.price * item.quantity : 0), 0)} 枚
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* 成功通知 */}
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

export default CartDetailPage;