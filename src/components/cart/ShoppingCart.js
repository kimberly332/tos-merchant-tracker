// src/components/cart/ShoppingCart.js
import React, { useState, useEffect } from 'react';
import './ShoppingCart.css';

const ShoppingCart = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [totalCoins, setTotalCoins] = useState(0);
  const [requiredMaterials, setRequiredMaterials] = useState({});

  // Load cart from localStorage on mount and listen for changes
useEffect(() => {
    // Load saved cart from localStorage
    try {
      const savedCart = localStorage.getItem('shoppingCart');
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        setCartItems(parsedCart);
      }
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
    }
    
    const handleAddToCart = (event) => {
      const newItem = event.detail;
      
      setCartItems(prevItems => {
        // Check if item already exists in cart
        const existingItemIndex = prevItems.findIndex(item => 
          item.itemName === newItem.itemName && 
          item.playerId === newItem.playerId
        );
        
        if (existingItemIndex >= 0) {
          // Update quantity if item exists
          const updatedItems = [...prevItems];
          updatedItems[existingItemIndex].quantity += 1;
          return updatedItems;
        } else {
          // Add new item with quantity 1
          return [...prevItems, { ...newItem, quantity: 1 }];
        }
      });
    };
    
    // Add the handleRemoveFromCart function here
    const handleRemoveFromCart = (event) => {
      const itemToRemove = event.detail;
      
      setCartItems(prevItems => {
        // Find and remove the item from cart
        return prevItems.filter(
          item => !(item.itemName === itemToRemove.itemName && 
                    item.playerId === itemToRemove.playerId)
        );
      });
    };
  
    // Then update the event listeners
    window.addEventListener('addToCart', handleAddToCart);
    window.addEventListener('removeFromCart', handleRemoveFromCart);
    
    // Clean up
    return () => {
      window.removeEventListener('addToCart', handleAddToCart);
      window.removeEventListener('removeFromCart', handleRemoveFromCart);
    };
  }, []);

  // Calculate totals when cart items change
  useEffect(() => {
    let coins = 0;
    let materials = {};
    
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
    
    setTotalCoins(coins);
    setRequiredMaterials(materials);
    
    // Save to localStorage
    try {
      localStorage.setItem('shoppingCart', JSON.stringify(cartItems));
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
    }
    
    // Dispatch cart updated event to notify MerchantItem components
    const cartUpdatedEvent = new CustomEvent('cartUpdated', {
      detail: { cart: cartItems }
    });
    window.dispatchEvent(cartUpdatedEvent);
  }, [cartItems]);

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
    
    setCartItems(prevItems => {
      const updatedItems = [...prevItems];
      updatedItems[index].quantity = newQuantity;
      return updatedItems;
    });
  };

  const clearCart = () => {
    setCartItems([]);
  };

  return (
    <div className="shopping-cart-container">
      {/* Cart Icon */}
      <button 
        className="cart-icon" 
        onClick={toggleCart}
        aria-label="Shopping Cart"
      >
        <i className="fas fa-shopping-cart"></i>
        {cartItems.length > 0 && (
          <span className="cart-badge">{cartItems.reduce((total, item) => total + item.quantity, 0)}</span>
        )}
      </button>
      
      {/* Cart Panel */}
      <div className={`cart-panel ${isOpen ? 'open' : ''}`}>
        <div className="cart-header">
          <h3>購物車</h3>
          <button className="close-cart" onClick={toggleCart}>×</button>
        </div>
        
        {cartItems.length === 0 ? (
          <div className="empty-cart">
            <p>購物車是空的</p>
            <p className="empty-cart-help">點擊物品將其添加到購物車</p>
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
                        <span className="cart-item-price">💰 {item.price} 家園幣</span>
                      )}
                      {item.allowsBarterExchange && (
                        <span className="cart-item-exchange-material">
                          🔄 {item.exchangeQuantity || 1} {item.exchangeItemName}
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
                        disabled={item.quantity >= (item.availableQuantity || item.quantity)}
                      >+</button>
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
                  <span className="summary-label">家園幣:</span>
                  <span className="summary-value">💰 {totalCoins}</span>
                </div>
              )}
              
              {Object.keys(requiredMaterials).length > 0 && (
                <div className="materials-list">
                  <h5>需要材料:</h5>
                  {Object.entries(requiredMaterials).map(([material, quantity]) => (
                    <div key={material} className="summary-item">
                      <span className="summary-label">{material}:</span>
                      <span className="summary-value">{quantity}</span>
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
    </div>
  );
};

export default ShoppingCart;