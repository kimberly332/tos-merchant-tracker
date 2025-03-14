// src/components/merchants/MerchantItem.js
import React, { useState, useEffect } from 'react';

const MerchantItem = ({ item, merchantInfo }) => {
  const [isInCart, setIsInCart] = useState(false);
  
  // Check initial cart status when component mounts
useEffect(() => {
    // Check localStorage directly on mount
    const checkCartStatus = () => {
      try {
        const savedCart = localStorage.getItem('shoppingCart');
        if (savedCart) {
          const cart = JSON.parse(savedCart);
          const found = cart.some(cartItem => 
            cartItem.itemName === item.itemName && 
            cartItem.playerId === merchantInfo.playerId
          );
          setIsInCart(found);
        } else {
          setIsInCart(false);
        }
      } catch (error) {
        console.error('Error checking cart status:', error);
        setIsInCart(false);
      }
    };
    
    // Initial check
    checkCartStatus();
    
    // Add direct event listener for storage changes
    const handleStorageChange = (e) => {
      if (e.key === 'shoppingCart') {
        checkCartStatus();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [item.itemName, merchantInfo.playerId]);
  
  // Listen for cart updates from other components
  useEffect(() => {
    const handleCartUpdate = (event) => {
      const cart = event?.detail?.cart || [];
      const found = cart.some(cartItem => 
        cartItem.itemName === item.itemName && 
        cartItem.playerId === merchantInfo.playerId
      );
      setIsInCart(found);
    };
    
    // Handle item removal events from cart
    const handleRemoveFromCart = (event) => {
      if (event.detail.itemName === item.itemName && 
          event.detail.playerId === merchantInfo.playerId) {
        setIsInCart(false);
      }
    };
    
    window.addEventListener('cartUpdated', handleCartUpdate);
    window.addEventListener('removeFromCart', handleRemoveFromCart);
    
    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
      window.removeEventListener('removeFromCart', handleRemoveFromCart);
    };
  }, [item.itemName, merchantInfo.playerId]);

const handleToggleCart = () => {
    if (isInCart) {
      // Remove from cart - send a simple event with just the item identifier
      const removeFromCartEvent = new CustomEvent('removeFromCart', {
        detail: {
          itemName: item.itemName,
          playerId: merchantInfo.playerId
        }
      });
      window.dispatchEvent(removeFromCartEvent);
    } else {
      // Add to cart
      const cartItem = {
        itemName: item.itemName || '未知物品',
        playerId: merchantInfo.playerId,
        merchantId: merchantInfo.id,
        quantity: 1,
        purchaseTimes: item.purchaseTimes || item.availableQuantity || 10,
        allowsCoinExchange: item.allowsCoinExchange,
        allowsBarterExchange: item.allowsBarterExchange,
        price: item.price,
        exchangeItemName: item.exchangeItemName,
        exchangeQuantity: item.exchangeQuantity || 1
      };
      
      const addToCartEvent = new CustomEvent('addToCart', {
        detail: cartItem
      });
      window.dispatchEvent(addToCartEvent);
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
      
      {/* Cart indicator badge */}
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