// src/components/cart/ShoppingCart.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { checkUserAuth } from '../../firebase/userAuth';
import { updateUserCart } from '../../firebase/userAuth';
import './ShoppingCart.css';

const ShoppingCart = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [user, setUser] = useState(null);
  const [merchantsExist, setMerchantsExist] = useState(true);

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

  // Add to cart with strict duplication prevention
  const handleAddToCart = useCallback((event) => {
    const newItem = event.detail;

    console.group('Add to Cart Debug');
    console.log('New Item:', newItem);

    setCartItems(prevItems => {
      console.log('Previous Cart Items:', prevItems);

      // Prevent duplicate items or excessive quantity
      const existingItemIndex = prevItems.findIndex(item =>
        item.itemName === newItem.itemName &&
        item.playerId === newItem.playerId
      );

      console.log('Existing Item Index:', existingItemIndex);

      if (existingItemIndex >= 0) {
        // If item exists, update only if quantity is less than purchase times
        const currentItem = prevItems[existingItemIndex];
        const maxPurchaseTimes = currentItem.purchaseTimes || 1;
        
        if (currentItem.quantity < maxPurchaseTimes) {
          const updatedItems = [...prevItems];
          updatedItems[existingItemIndex] = {
            ...currentItem,
            quantity: Math.min(currentItem.quantity + 1, maxPurchaseTimes)
          };

          console.log('Updated Existing Item:', updatedItems[existingItemIndex]);
          console.groupEnd();

          return updatedItems;
        }
        
        // If at max purchase times, return existing items
        console.log('Max purchase times reached');
        console.groupEnd();
        return prevItems;
      }

      // Add new item with quantity 1
      const newCartItems = [...prevItems, { ...newItem, quantity: 1 }];
      console.log('New Cart Items:', newCartItems);
      console.groupEnd();

      return newCartItems;
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
      const removedItem = updatedItems[index];

      updatedItems.splice(index, 1);

      const removeEvent = new CustomEvent('removeFromCart', {
        detail: {
          itemName: removedItem.itemName,
          playerId: removedItem.playerId
        }
      });
      window.dispatchEvent(removeEvent);

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

      return updatedItems;
    });
  };

  // Clear entire cart
  const clearCart = () => {
    setCartItems([]);

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
      }
    } catch (error) {
      console.error('Error loading cart:', error);
      resetCart();
    }
  }, [resetCart]);

  // Persist cart to localStorage and update user cart
  useEffect(() => {
    if (user) {
      try {
        // Save to localStorage
        localStorage.setItem('shoppingCart', JSON.stringify(cartItems));
        
        // Update user's cart in Firestore
        updateUserCart(user.userId, cartItems);

        // Notify other components
        const cartUpdatedEvent = new CustomEvent('cartUpdated', {
          detail: { cart: cartItems }
        });
        window.dispatchEvent(cartUpdatedEvent);
      } catch (error) {
        console.error('Error saving cart:', error);
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

  // Prevent infinite cart item growth
  const sanitizedCartItems = useMemo(() => {
    const uniqueItems = new Map();
    
    cartItems.forEach(item => {
      const key = `${item.itemName}_${item.playerId}`;
      const existingItem = uniqueItems.get(key);
      
      if (!existingItem || existingItem.quantity < (item.purchaseTimes || 1)) {
        uniqueItems.set(key, item);
      }
    });

    return Array.from(uniqueItems.values());
  }, [cartItems]);

  return (
    <div className="shopping-cart-container">
      <button
        className="cart-icon"
        onClick={toggleCart}
        aria-label="購物車"
      >
        {merchantsExist && sanitizedCartItems.length > 0 && (
          <span className="cart-badge">
            {sanitizedCartItems.reduce((total, item) => total + item.quantity, 0)}
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
          ) : sanitizedCartItems.length === 0 ? (
            <div className="empty-cart">
              <p>購物車是空的</p>
              <p className="empty-cart-help">點擊商品將其添加到購物車</p>
            </div>
          ) : (
            <>
              <div className="cart-items">
                {sanitizedCartItems.map((item, index) => (
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
                  <span className="summary-value">{sanitizedCartItems.reduce((total, item) => total + item.quantity, 0)} 件</span>
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