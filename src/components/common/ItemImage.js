import React, { useState } from 'react';

/**
 * ItemImage component displays a small product image next to item names
 * 
 * @param {Object} props Component properties
 * @param {string} props.itemName Name of the item to display image for
 * @param {string} props.size Size of the image (small, medium, large)
 * @param {string} props.className Additional class names
 * @returns {React.Component} The ItemImage component
 */
const ItemImage = ({ itemName, size = 'small', className = '' }) => {
  const [imageError, setImageError] = useState(false);
  
  // Define sizes based on the size prop
  const sizeStyles = {
    small: { width: '20px', height: '20px' },
    medium: { width: '24px', height: '24px' },
    large: { width: '32px', height: '32px' }
  };
  
  // If the image failed to load, don't show anything
  if (imageError) {
    return null;
  }
  
  // Generate image path based on item name
  const imagePath = `/icons/${itemName}.png`;
  
  // Some items categories shouldn't attempt to show icons
  const skipIconCategories = [
    '其他', 
    '全部', 
    // Add other categories that shouldn't show icons
  ];
  
  // Skip icon rendering for certain categories
  if (!itemName || skipIconCategories.includes(itemName)) {
    return null;
  }
  
  return (
    <img
      src={imagePath}
      alt=""
      className={`item-icon ${className}`}
      style={sizeStyles[size] || sizeStyles.small}
      onError={() => setImageError(true)}
      title={itemName}
    />
  );
};

export default ItemImage;