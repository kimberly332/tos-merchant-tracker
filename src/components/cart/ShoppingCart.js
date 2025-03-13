// src/components/cart/ShoppingCart.js
import React, { useState, useEffect } from 'react';
import { checkUserAuth } from '../../firebase/userAuth';
import { updateUserCart } from '../../firebase/userAuth';
import './ShoppingCart.css';

const ShoppingCart = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [totalCoins, setTotalCoins] = useState(0);
  const [requiredMaterials, setRequiredMaterials] = useState({});
  const [user, setUser] = useState(null);

  // 加載用戶資料和購物車
  useEffect(() => {
    const currentUser = checkUserAuth();
    setUser(currentUser);

    // 加載購物車資料
    try {
      const savedCart = localStorage.getItem('shoppingCart');
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        setCartItems(parsedCart);
      }
    } catch (error) {
      console.error('加載購物車時發生錯誤:', error);
    }
    
    // 監聽購物車事件
    const handleAddToCart = (event) => {
      const newItem = event.detail;
      
      setCartItems(prevItems => {
        // 檢查商品是否已存在
        const existingItemIndex = prevItems.findIndex(item => 
          item.itemName === newItem.itemName && 
          item.playerId === newItem.playerId
        );
        
        let updatedItems;
        if (existingItemIndex >= 0) {
          // 更新數量
          updatedItems = [...prevItems];
          updatedItems[existingItemIndex].quantity += 1;
        } else {
          // 添加新商品
          updatedItems = [...prevItems, { ...newItem, quantity: 1 }];
        }
        
        // 如果用戶已登入，同步到雲端
        if (user) {
          updateUserCart(user.userId, updatedItems);
        }
        
        return updatedItems;
      });
    };
    
    const handleRemoveFromCart = (event) => {
      const itemToRemove = event.detail;
      
      setCartItems(prevItems => {
        // 移除商品
        const updatedItems = prevItems.filter(
          item => !(item.itemName === itemToRemove.itemName && 
                    item.playerId === itemToRemove.playerId)
        );
        
        // 如果用戶已登入，同步到雲端
        if (user) {
          updateUserCart(user.userId, updatedItems);
        }
        
        return updatedItems;
      });
    };

    // 添加事件監聽
    window.addEventListener('addToCart', handleAddToCart);
    window.addEventListener('removeFromCart', handleRemoveFromCart);
    
    // 清理
    return () => {
      window.removeEventListener('addToCart', handleAddToCart);
      window.removeEventListener('removeFromCart', handleRemoveFromCart);
    };
  }, [user]);

  // 當購物車項目變化時計算總數
  useEffect(() => {
    let coins = 0;
    let materials = {};
    
    cartItems.forEach(item => {
      if (item.allowsCoinExchange && item.price) {
        // 計算家園幣總數
        coins += item.price * item.quantity;
      }
      
      if (item.allowsBarterExchange && item.exchangeItemName) {
        const materialName = item.exchangeItemName;
        // 計算所需材料數量
        const materialQty = (item.exchangeQuantity || 1) * item.quantity;
        
        // 添加到總材料需求
        materials[materialName] = (materials[materialName] || 0) + materialQty;
      }
    });
    
    setTotalCoins(coins);
    setRequiredMaterials(materials);
    
    // 保存到 localStorage
    try {
      localStorage.setItem('shoppingCart', JSON.stringify(cartItems));
      
      // 如果用戶已登入，同步到雲端
      if (user && cartItems.length > 0) {
        updateUserCart(user.userId, cartItems);
      }
    } catch (error) {
      console.error('保存購物車時發生錯誤:', error);
    }
    
    // 發送購物車更新事件
    const cartUpdatedEvent = new CustomEvent('cartUpdated', {
      detail: { cart: cartItems }
    });
    window.dispatchEvent(cartUpdatedEvent);
  }, [cartItems, user]);

  const toggleCart = () => {
    setIsOpen(!isOpen);
  };

  const removeFromCart = (index) => {
    setCartItems(prevItems => {
      const updatedItems = [...prevItems];
      updatedItems.splice(index, 1);
      return updatedItems;
    });
  };

  const updateQuantity = (index, newQuantity) => {
    if (newQuantity < 1) return;
    
    // 獲取商品的可購買數量上限
    const availableQuantity = cartItems[index].availableQuantity || 1;
    
    // 確保新數量不超過可購買數量
    const limitedQuantity = Math.min(newQuantity, availableQuantity);
    
    setCartItems(prevItems => {
      const updatedItems = [...prevItems];
      updatedItems[index].quantity = limitedQuantity;
      return updatedItems;
    });
  };

  const clearCart = () => {
    setCartItems([]);
    
    // 如果用戶已登入，同步空購物車到雲端
    if (user) {
      updateUserCart(user.userId, []);
    }
  };

  // 如果用戶未登入，不顯示購物車
  if (!user) {
    return null;
  }

  return (
    <div className="shopping-cart-container">
      {/* 購物車圖標 */}
      <button 
        className="cart-icon" 
        onClick={toggleCart}
        aria-label="購物車"
      >
        <i className="fas fa-shopping-cart"></i>
        {cartItems.length > 0 && (
          <span className="cart-badge">{cartItems.reduce((total, item) => total + item.quantity, 0)}</span>
        )}
      </button>
      
      {/* 購物車面板 */}
      <div className={`cart-panel ${isOpen ? 'open' : ''}`}>
        <div className="cart-header">
          <h3>購物車</h3>
          <button className="close-cart" onClick={toggleCart}>×</button>
        </div>
        
        {cartItems.length === 0 ? (
          <div className="empty-cart">
            <p>購物車是空的</p>
            <p className="empty-cart-help">點擊商品將其添加到購物車</p>
          </div>
        ) : (
          <>
            <div className="cart-items">
              {cartItems.map((item, index) => (
                <div key={index} className="cart-item">
                  <div className="cart-item-details">
                    <div className="cart-item-name">{item.itemName}</div>
                    <div className="cart-item-seller">賣家: {item.playerId}</div>
                    <div className="cart-item-exchange">
                      {item.allowsCoinExchange && (
                        <span className="cart-item-price">💰 {item.price} 枚</span>
                      )}
                      {item.allowsBarterExchange && (
                        <span className="cart-item-exchange-material">
                          🔄 {item.exchangeQuantity || 1} 個 {item.exchangeItemName}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="cart-item-actions">
                    <div className="quantity-control">
                      <button 
                        onClick={() => updateQuantity(index, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                      >-</button>
                      <span>{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(index, item.quantity + 1)}
                        disabled={item.quantity >= (item.availableQuantity || 1)}
                        title={`最多可購買 ${item.availableQuantity || 1} 個`}
                      >+</button>
                    </div>
                    <div className="quantity-limit">
                      數量: {item.quantity}/{item.availableQuantity || 1} 個
                    </div>
                    <button 
                      className="remove-item" 
                      onClick={() => removeFromCart(index)}
                    >
                      <i className="fas fa-trash-alt"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="cart-summary">
              <h4>總計:</h4>
              {totalCoins > 0 && (
                <div className="summary-item">
                  <span className="summary-label">需要家園幣:</span>
                  <span className="summary-value">💰 {totalCoins.toLocaleString()} 枚</span>
                </div>
              )}
              
              {Object.keys(requiredMaterials).length > 0 && (
                <div className="materials-list">
                  <h5>需要交換材料:</h5>
                  {Object.entries(requiredMaterials).map(([material, quantity]) => (
                    <div key={material} className="summary-item">
                      <span className="summary-label">{material}:</span>
                      <span className="summary-value">{quantity.toLocaleString()} 個</span>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="cart-item-count">
                <span className="summary-label">購物車商品總數:</span>
                <span className="summary-value">{cartItems.reduce((total, item) => total + item.quantity, 0)} 件</span>
              </div>
              
              <button className="clear-cart" onClick={clearCart}>
                清空購物車
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ShoppingCart;