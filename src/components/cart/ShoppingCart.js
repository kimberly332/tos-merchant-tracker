// src/components/cart/ShoppingCart.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { checkUserAuth } from '../../firebase/userAuth';
import { updateUserCart } from '../../firebase/userAuth';
import { useLocation } from 'react-router-dom';
import './ShoppingCart.css';

const ShoppingCart = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [user, setUser] = useState(null);
  const [merchantsExist, setMerchantsExist] = useState(true);
  const location = useLocation(); // Get current location/route
  
  // Check if the current page is the login page
  const isLoginPage = location.pathname === '/login';

  // Reset cart to prevent item duplication
  const resetCart = useCallback(() => {
    setCartItems([]);
    localStorage.removeItem('shoppingCart');
  }, []);

  // Memoized calculation of total coins and required materials
  const { totalCoins, requiredMaterials } = useMemo(() => {
    let coins = 0;
    let materials = {};

    // Calculate for all cart items
    cartItems.forEach(item => {
      if (item.allowsCoinExchange && item.price) {
        coins += item.price * item.quantity;
      }

      if (item.allowsBarterExchange && item.exchangeItemName) {
        const materialName = item.exchangeItemName;
        const materialQty = (item.exchangeQuantity || 1) * item.quantity;

        materials[materialName] = (materials[materialName] || 0) + materialQty;
      }
    });

    return { totalCoins: coins, requiredMaterials: materials };
  }, [cartItems]);

  // Check for merchants existence
  const checkMerchantsExistence = useCallback((event) => {
    if (event.detail && event.detail.hasNoMerchants !== undefined) {
      setMerchantsExist(!(event.detail.hasNoMerchants));
    }
  }, []);

  // Listen for merchant existence event
  useEffect(() => {
    window.addEventListener('merchantsExistence', checkMerchantsExistence);
    return () => {
      window.removeEventListener('merchantsExistence', checkMerchantsExistence);
    };
  }, [checkMerchantsExistence]);

  // Notify components when cart changes
  useEffect(() => {
    // Don't dispatch during initial render or when cart is empty
    if (cartItems.length > 0) {
      const cartUpdatedEvent = new CustomEvent('cartUpdated', {
        detail: { cart: cartItems }
      });
      window.dispatchEvent(cartUpdatedEvent);
    }
  }, [cartItems]);

  // Listen for direct remove events (from clicking items)
  useEffect(() => {
    const handleRemoveItem = (event) => {
      const { itemName, playerId } = event.detail;
      
      setCartItems(prevItems => {
        // Find the item and remove it
        const updatedItems = prevItems.filter(item => 
          !(item.itemName === itemName && item.playerId === playerId)
        );
        
        // Update localStorage immediately
        localStorage.setItem('shoppingCart', JSON.stringify(updatedItems));
        
        return updatedItems;
      });
    };
    
    window.addEventListener('removeFromCart', handleRemoveItem);
    
    return () => {
      window.removeEventListener('removeFromCart', handleRemoveItem);
    };
  }, []);

  // Add to cart with strict duplication prevention
  const handleAddToCart = useCallback((event) => {
    const newItem = event.detail;
  
    setCartItems(prevItems => {
      // 检查物品是否已存在
      const existingItemIndex = prevItems.findIndex(item =>
        item.itemName === newItem.itemName &&
        item.playerId === newItem.playerId
      );
  
      let updatedItems;
  
      if (existingItemIndex >= 0) {
        // 如果物品已存在，可能需要更新它
        // 但确保保留原始 purchaseTimes 值
        const existingItem = prevItems[existingItemIndex];
        
        updatedItems = [...prevItems];
        updatedItems[existingItemIndex] = {
          ...existingItem,
          // 确保不修改 purchaseTimes
          purchaseTimes: newItem.purchaseTimes || existingItem.purchaseTimes
        };
      } else {
        // 添加新物品，确保保留 purchaseTimes
        updatedItems = [...prevItems, {
          ...newItem,
          // 确保使用原始 purchaseTimes
          purchaseTimes: newItem.purchaseTimes
        }];
      }
      
      // 更新本地存储
      localStorage.setItem('shoppingCart', JSON.stringify(updatedItems));
      
      return updatedItems;
    });
  }, []);

  // Toggle cart open/closed
  const toggleCart = () => {
    setIsOpen(!isOpen);
  };

  // Remove item from cart
  const removeFromCart = (index) => {
    setCartItems(prevItems => {
      const updatedItems = [...prevItems];
      updatedItems.splice(index, 1);
      
      // Update localStorage immediately
      localStorage.setItem('shoppingCart', JSON.stringify(updatedItems));
      
      return updatedItems;
    });
  };

  // Update item quantity
  const updateQuantity = (index, newQuantity) => {
    if (newQuantity < 1) {
      // If quantity is less than 1, remove the item
      removeFromCart(index);
      return;
    }

    setCartItems(prevItems => {
      const updatedItems = [...prevItems];
      const item = updatedItems[index];

      // Ensure quantity doesn't exceed purchaseTimes
      const purchaseTimes = item.purchaseTimes || 1;
      updatedItems[index] = {
        ...item,
        quantity: Math.min(newQuantity, purchaseTimes)
      };
      
      // Update localStorage immediately
      localStorage.setItem('shoppingCart', JSON.stringify(updatedItems));

      return updatedItems;
    });
  };

  // Clear entire cart
  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem('shoppingCart');
    
    // Notify about empty cart
    const cartUpdatedEvent = new CustomEvent('cartUpdated', {
      detail: { cart: [] }
    });
    window.dispatchEvent(cartUpdatedEvent);
  };

  // Initialize user and cart
  useEffect(() => {
    const currentUser = checkUserAuth();
    setUser(currentUser);

    // Reset cart if no user is logged in
    if (!currentUser) {
      resetCart();
      return;
    }

    // Load cart from localStorage
    try {
      const savedCart = localStorage.getItem('shoppingCart');
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        
        // Validate cart items
        const validatedCart = parsedCart.filter(item => 
          item.itemName && 
          item.playerId && 
          item.quantity > 0
        );

        setCartItems(validatedCart);
        
        // Initial notification
        const cartUpdatedEvent = new CustomEvent('cartUpdated', {
          detail: { cart: validatedCart }
        });
        window.dispatchEvent(cartUpdatedEvent);
      }
    } catch (error) {
      console.error('Error loading cart:', error);
      resetCart();
    }
  }, [resetCart]);

  // Persist cart to Firestore when it changes
  useEffect(() => {
    if (user && cartItems.length > 0) {
      try {
        // Update user's cart in Firestore
        updateUserCart(user.userId, cartItems);
      } catch (error) {
        console.error('Error saving cart to Firestore:', error);
      }
    }
  }, [cartItems, user]);

  // Add event listeners for cart events
  useEffect(() => {
    window.addEventListener('addToCart', handleAddToCart);
    
    return () => {
      window.removeEventListener('addToCart', handleAddToCart);
    };
  }, [handleAddToCart]);
  
  // Don't render the shopping cart on login page
  if (isLoginPage) {
    return null;
  }

  return (
    <div className="shopping-cart-container">
      <button
        className="cart-icon"
        onClick={toggleCart}
        aria-label="購物車"
      >
        {merchantsExist && cartItems.length > 0 && (
          <span className="cart-badge">
            {cartItems.reduce((total, item) => total + item.quantity, 0)}
          </span>
        )}
        <i className="fas fa-shopping-cart"></i>
      </button>

      {isOpen && user && (
        <div className={`cart-panel ${isOpen ? 'open' : ''}`}>
          <div className="cart-header">
            <h3>購物車</h3>
            <button className="close-cart" onClick={toggleCart}>×</button>
          </div>

          {!merchantsExist ? (
            <div className="empty-cart">
              <p>目前沒有商人資訊</p>
              <p className="empty-cart-help">請先新增商人</p>
            </div>
          ) : cartItems.length === 0 ? (
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
                          <span className="cart-item-price">
                            💰 {(item.price * item.quantity).toLocaleString()} 枚
                            <small className="unit-price">({item.price} 枚/個)</small>
                          </span>
                        )}
                        {item.allowsBarterExchange && (
                          <span className="cart-item-exchange-material">
                            🔄 {(item.exchangeQuantity || 1) * item.quantity} 個 {item.exchangeItemName}
                            <small className="unit-exchange">({item.exchangeQuantity || 1} 個/個)</small>
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
                          disabled={item.quantity >= (item.purchaseTimes || 1)}
                          title={`最多可購買 ${item.purchaseTimes || 1} 個`}
                        >+</button>
                      </div>
                      <div className="quantity-limit">
                        數量: {item.quantity}/{item.purchaseTimes || 1} 個
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
      )}
    </div>
  );
};

export default ShoppingCart;