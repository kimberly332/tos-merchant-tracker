// src/components/merchants/MerchantItem.js
import React, { useState, useEffect } from 'react';

const MerchantItem = ({ item, merchantInfo }) => {
  const [isHighlighted, setIsHighlighted] = useState(false);
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
    
    // Cleanup event listener
    return () => {
      window.removeEventListener('cartUpdated', checkIfInCart);
    };
  }, [item.itemName, merchantInfo.playerId]);

  const handleAddToCart = () => {
    // Create the item data to be added to the cart
    const cartItem = {
      itemName: item.itemName || '未知物品',
      playerId: merchantInfo.playerId,
      quantity: 1,
      availableQuantity: item.availableQuantity || item.quantity || 1,
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

    // Always show highlight effect on click, whether new or already in cart
    setIsHighlighted(true);
    setTimeout(() => {
      setIsHighlighted(false);
    }, 500);
    
    // Mark item as in cart
    setIsInCart(true);
  };

  return (
    <li 
      className={`item ${isHighlighted ? 'highlight-item' : ''} ${isInCart ? 'in-cart' : ''}`}
      onClick={handleAddToCart}
    >
      <div className="item-name-container">
        <span className="item-name">{item.itemName || '未知物品'}</span>
        {item.quantity > 1 && (
          <span className="item-quantity">x{item.quantity}</span>
        )}
        {item.availableQuantity && item.availableQuantity < item.quantity && (
          <span className="item-available-quantity">可購: {item.availableQuantity}</span>
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
      
      {/* 移除文字和圖標，只保留簡單的高亮效果 */}
    </li>
  );
};

export default MerchantItem;