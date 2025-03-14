// src/components/merchants/MerchantItem.js
import React, { useState, useEffect } from 'react';

const MerchantItem = ({ item, merchantInfo }) => {
  const [isInCart, setIsInCart] = useState(false);
  
  // Check if item is in cart when component mounts and when cart changes
  useEffect(() => {
    // Create a function to check if the item is in cart
    const checkIfInCart = (event) => {
      const cart = event?.detail?.cart || [];
      const inCart = cart.some(cartItem => 
        cartItem.itemName === item.itemName && 
        cartItem.playerId === merchantInfo.playerId
      );
      setIsInCart(inCart);
    };
    
    // Function to handle removeFromCart events
    const handleRemoveFromCart = (event) => {
      // Check if this item was removed
      if (event.detail.itemName === item.itemName && 
          event.detail.playerId === merchantInfo.playerId) {
        setIsInCart(false);
      }
    };
    
    // Initial check - try to get cart from localStorage
    try {
      const savedCart = localStorage.getItem('shoppingCart');
      const cart = savedCart ? JSON.parse(savedCart) : [];
      const inCart = cart.some(cartItem => 
        cartItem.itemName === item.itemName && 
        cartItem.playerId === merchantInfo.playerId
      );
      setIsInCart(inCart);
    } catch (error) {
      console.error('Error checking cart status:', error);
    }

    // Listen for cart update events
    window.addEventListener('cartUpdated', checkIfInCart);
    // Listen for remove from cart events
    window.addEventListener('removeFromCart', handleRemoveFromCart);
    
    // Cleanup event listeners
    return () => {
      window.removeEventListener('cartUpdated', checkIfInCart);
      window.removeEventListener('removeFromCart', handleRemoveFromCart);
    };
  }, [item.itemName, merchantInfo.playerId]);

  const handleToggleCart = () => {
    if (isInCart) {
      // Remove from cart
      const removeFromCartEvent = new CustomEvent('removeFromCart', {
        detail: {
          itemName: item.itemName || '未知物品',
          playerId: merchantInfo.playerId
        }
      });
      window.dispatchEvent(removeFromCartEvent);
      
      setIsInCart(false);
    } else {
      // Prepare cart item with careful validation and include merchant ID
      const cartItem = {
        itemName: item.itemName || '未知物品',
        playerId: merchantInfo.playerId,
        merchantId: merchantInfo.id, // Store the merchant ID for easy filtering on delete
        quantity: 1,
        // Prioritize purchaseTimes, then availableQuantity, default to 1
        purchaseTimes: item.purchaseTimes || item.availableQuantity || 10,
        allowsCoinExchange: item.allowsCoinExchange,
        allowsBarterExchange: item.allowsBarterExchange,
        price: item.price,
        exchangeItemName: item.exchangeItemName,
        exchangeQuantity: item.exchangeQuantity || 1
      };
  
      // Create and dispatch a custom event
      const addToCartEvent = new CustomEvent('addToCart', {
        detail: cartItem
      });
      window.dispatchEvent(addToCartEvent);
      
      setIsInCart(true);
    }
  };

  return (
    <li 
      className={`item ${isInCart ? 'in-cart' : ''}`}
      onClick={handleToggleCart}
    >
      <div className="item-name-container">
        <span className="item-name">{item.itemName || '未知物品'}</span>
        {item.quantity > 1 && (
          <span className="item-quantity">x{item.quantity}</span>
        )}
        {item.purchaseTimes !== undefined && (
          <span className="item-available-quantity">可購: {item.purchaseTimes}</span>
        )}
      </div>
      
      <div className="item-details">
        {item.category && item.category !== '其他' && item.category !== item.itemName && (
          <span className="item-category">{item.category}</span>
        )}
        
        {/* 價格顯示，如果允許家園幣交易 */}
        {(item.allowsCoinExchange || typeof item.allowsCoinExchange === 'undefined') && item.price > 0 && (
          <div className="price-tag">
            <span className="coin-icon">💰</span>
            <span>{item.price}</span>
          </div>
        )}
        
        {/* 交換物品顯示，如果允許以物易物交易 */}
        {item.allowsBarterExchange && item.exchangeItemName && (
          <div className="exchange-tag">
            <span className="exchange-icon">🔄</span>
            <span>{item.exchangeQuantity || 1} {item.exchangeItemName}</span>
          </div>
        )}
      </div>
      
      {/* Show appropriate icon based on cart status */}
      <div className="in-cart-badge">
        {isInCart ? (
          <i className="fas fa-shopping-cart"></i>
        ) : (
          <i className="fas fa-plus"></i>
        )}
      </div>
    </li>
  );
};

export default MerchantItem;