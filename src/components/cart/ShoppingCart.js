// src/components/cart/ShoppingCart.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { checkUserAuth } from '../../firebase/userAuth';
import { updateUserCart } from '../../firebase/userAuth';
import { getMerchantById } from '../../firebase/firestore';
import { useLocation } from 'react-router-dom';
import SuccessNotification from '../common/SuccessNotification';
import './ShoppingCart.css';

const ShoppingCart = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [user, setUser] = useState(null);
  const [merchantsExist, setMerchantsExist] = useState(true);
  const location = useLocation(); // Get current location/route
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  
  // Check if the current page is the login page
  const isLoginPage = location.pathname === '/login';

  // Reset cart to prevent item duplication
  const resetCart = useCallback(() => {
    setCartItems([]);
    localStorage.removeItem('shoppingCart');
  }, []);

  // Group cart items by merchant ID
  const groupedCartItems = useMemo(() => {
    const groups = {};
    
    cartItems.forEach(item => {
      const merchantId = item.playerId;
      if (!groups[merchantId]) {
        groups[merchantId] = [];
      }
      groups[merchantId].push(item);
    });
    
    return groups;
  }, [cartItems]);

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

  // Listen for merchant deletions that affect cart items
useEffect(() => {
  const handleMerchantDelete = (event) => {
    const { merchantId } = event.detail;
    
    // Check if any cart items are from this deleted merchant
    const affectedItems = cartItems.filter(item => item.merchantId === merchantId);
    
    if (affectedItems.length > 0) {
      // Remove all items from this merchant
      setCartItems(prevItems => {
        const updatedItems = prevItems.filter(item => item.merchantId !== merchantId);
        
        // Save updated cart to localStorage
        localStorage.setItem('shoppingCart', JSON.stringify(updatedItems));
        
        return updatedItems;
      });
      
      // Show notification about cart update
      setNotificationMessage('您的購物車已更新，因為商人資訊已被刪除。');
      setShowNotification(true);
    }
  };
  
  window.addEventListener('merchantDeleted', handleMerchantDelete);
  
  return () => {
    window.removeEventListener('merchantDeleted', handleMerchantDelete);
  };
}, [cartItems]);
  
  // Listen for merchant updates that might affect cart items
useEffect(() => {
  const handleMerchantUpdate = async (event) => {
    const { merchantId } = event.detail;
    
    // Only process if there are cart items that might be affected
    if (cartItems.some(item => item.merchantId === merchantId)) {
      try {
        // Fetch the updated merchant data
        const updatedMerchant = await getMerchantById(merchantId);
        
        if (updatedMerchant && updatedMerchant.items) {
          // Update affected cart items
          setCartItems(prevItems => {
            // Map through existing cart items
            const updatedItems = prevItems.map(cartItem => {
              // If this item belongs to the updated merchant
              if (cartItem.merchantId === merchantId) {
                // Find the matching item in the updated merchant data
                const updatedMerchantItem = updatedMerchant.items.find(
                  item => item.itemName === cartItem.itemName
                );
                
                // If the item still exists in the merchant's inventory
                if (updatedMerchantItem) {
                  // Ensure the cart item quantity doesn't exceed the new purchaseTimes
                  const newQuantity = Math.min(
                    cartItem.quantity,
                    updatedMerchantItem.purchaseTimes || 1
                  );
                  
                  // Update cart item with new merchant data
                  return {
                    ...cartItem,
                    purchaseTimes: updatedMerchantItem.purchaseTimes || 1,
                    price: updatedMerchantItem.price,
                    allowsCoinExchange: updatedMerchantItem.allowsCoinExchange,
                    allowsBarterExchange: updatedMerchantItem.allowsBarterExchange,
                    exchangeItemName: updatedMerchantItem.exchangeItemName,
                    exchangeQuantity: updatedMerchantItem.exchangeQuantity || 1,
                    quantity: newQuantity
                  };
                }
                // If the item was removed from the merchant's inventory
                return null;
              }
              // Return unchanged items
              return cartItem;
            }).filter(Boolean); // Remove null items (ones that were removed)
            
            // Save updated cart to localStorage
            localStorage.setItem('shoppingCart', JSON.stringify(updatedItems));
            
            return updatedItems;
          });
          
          // Show notification about cart update
          setNotificationMessage('您的購物車已更新，因為商人資訊有所變更。');
          setShowNotification(true);
        }
      } catch (error) {
        console.error('更新購物車時發生錯誤:', error);
      }
    }
  };
  
  window.addEventListener('merchantUpdated', handleMerchantUpdate);
  
  return () => {
    window.removeEventListener('merchantUpdated', handleMerchantUpdate);
  };
}, [cartItems]);

  useEffect(() => {
    // Create a custom event listener for login events
    const handleLoginEvent = () => {
      const currentUser = checkUserAuth();
      setUser(currentUser);
    };
    
    // Listen for the custom event
    window.addEventListener('userLoginStateChanged', handleLoginEvent);
    
    // Initial check
    const currentUser = checkUserAuth();
    setUser(currentUser);
    
    return () => {
      window.removeEventListener('userLoginStateChanged', handleLoginEvent);
    };
  }, []);

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
      // Check if item already exists
      const existingItemIndex = prevItems.findIndex(item =>
        item.itemName === newItem.itemName &&
        item.playerId === newItem.playerId
      );
  
      let updatedItems;
  
      if (existingItemIndex >= 0) {
        // If item exists, update it but preserve original purchaseTimes
        const existingItem = prevItems[existingItemIndex];
        
        updatedItems = [...prevItems];
        updatedItems[existingItemIndex] = {
          ...existingItem,
          // Ensure we don't modify purchaseTimes
          purchaseTimes: newItem.purchaseTimes || existingItem.purchaseTimes
        };
      } else {
        // Add new item, ensuring we preserve purchaseTimes
        updatedItems = [...prevItems, {
          ...newItem,
          // Ensure we use original purchaseTimes
          purchaseTimes: newItem.purchaseTimes
        }];
      }
      
      // Update localStorage
      localStorage.setItem('shoppingCart', JSON.stringify(updatedItems));
      
      return updatedItems;
    });
  }, []);

  // Toggle cart open/closed
  const toggleCart = () => {
    setIsOpen(!isOpen);
  };

  // Copy merchant ID to clipboard
  const copyMerchantId = (merchantId) => {
    navigator.clipboard.writeText(merchantId)
      .then(() => {
        // Could add a mini notification here if desired
        console.log(`Copied: ${merchantId}`);
      })
      .catch(err => {
        console.error('Failed to copy:', err);
      });
  };

  // Remove item from cart
  const removeFromCart = (item) => {
    setCartItems(prevItems => {
      const updatedItems = prevItems.filter(cartItem => 
        !(cartItem.itemName === item.itemName && cartItem.playerId === item.playerId)
      );
      
      // Update localStorage immediately
      localStorage.setItem('shoppingCart', JSON.stringify(updatedItems));
      
      return updatedItems;
    });
  };

  // Update item quantity
  const updateQuantity = (item, newQuantity) => {
    if (newQuantity < 1) {
      // If quantity is less than 1, remove the item
      removeFromCart(item);
      return;
    }

    setCartItems(prevItems => {
      const updatedItems = prevItems.map(cartItem => {
        if (cartItem.itemName === item.itemName && cartItem.playerId === item.playerId) {
          // Ensure quantity doesn't exceed purchaseTimes
          const purchaseTimes = cartItem.purchaseTimes || 1;
          return {
            ...cartItem,
            quantity: Math.min(newQuantity, purchaseTimes)
          };
        }
        return cartItem;
      });
      
      // Update localStorage immediately
      localStorage.setItem('shoppingCart', JSON.stringify(updatedItems));

      return updatedItems;
    });
  };

  // Clear entire cart
  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem('shoppingCart');
    
    // Also clear the cart in Firestore if user is logged in
    if (user && user.userId) {
      try {
        // Update user's cart in Firestore with empty array
        updateUserCart(user.userId, []);
      } catch (error) {
        console.error('Error clearing cart in Firestore:', error);
      }
    }
    
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
  
        // Only set cart items if there are valid items
        if (validatedCart.length > 0) {
          setCartItems(validatedCart);
          
          // Initial notification
          const cartUpdatedEvent = new CustomEvent('cartUpdated', {
            detail: { cart: validatedCart }
          });
          window.dispatchEvent(cartUpdatedEvent);
        } else {
          // If no valid items, ensure cart is emptied in Firebase too
          updateUserCart(currentUser.userId, []);
        }
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
                {Object.entries(groupedCartItems).map(([merchantId, items]) => (
                  <div key={merchantId} className="merchant-group">
                    <div 
                      className="merchant-group-header"
                      onClick={() => copyMerchantId(merchantId)}
                    >
                      <div className="merchant-id">
                        {merchantId} <i className="fas fa-copy copy-icon"></i>
                      </div>
                      <div className="merchant-item-count">
                        {items.reduce((total, item) => total + item.quantity, 0)} 個商品
                      </div>
                    </div>
                    
                    <div className="merchant-items">
                      {items.map((item, index) => (
                        <div key={index} className="cart-item">
                          <div className="cart-item-details">
                            <div className="cart-item-name">
                              <span>{item.itemName}</span>
                              <span className="cart-item-name-quantity">x{(item.itemQuantity || 1) * item.quantity}</span>
                            </div>
                            <div className="cart-item-exchange">
                              {item.allowsCoinExchange && (
                                <span className="cart-item-price">
                                  💰 {(item.price * item.quantity).toLocaleString()} 枚
                                </span>
                              )}
                              {item.allowsBarterExchange && (
                                <span className="cart-item-exchange-material">
                                  🔄 {(item.exchangeQuantity || 1) * item.quantity} 個 {item.exchangeItemName}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="cart-item-actions">
                            <div className="quantity-control">
                              <button
                                onClick={() => updateQuantity(item, item.quantity - 1)}
                                disabled={item.quantity <= 1}
                              >-</button>
                              <span>{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(item, item.quantity + 1)}
                                disabled={item.quantity >= (item.purchaseTimes || 1)}
                                title={`最多可購買 ${item.purchaseTimes || 1} 個`}
                              >+</button>
                            </div>
                            <button
                              className="remove-item"
                              onClick={() => removeFromCart(item)}
                            >
                              <i className="fas fa-trash-alt"></i>
                            </button>
                          </div>
                        </div>
                      ))}
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

                <button className="clear-cart" onClick={clearCart}>
                  清空購物車
                </button>
              </div>
            </>
          )}
        </div>
      )}
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
};

export default ShoppingCart;