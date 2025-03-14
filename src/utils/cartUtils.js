// src/utils/cartUtils.js

/**
 * Enhanced utilities for shopping cart management
 */

/**
 * Load cart data from localStorage
 * @returns {Array} Cart items or empty array if no cart data exists
 */
export const loadCartFromLocalStorage = () => {
    try {
      const savedCart = localStorage.getItem('shoppingCart');
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
      return [];
    }
  };
  
  /**
   * Save cart data to localStorage
   * @param {Array} cartItems - Array of cart items to save
   * @returns {boolean} Success status
   */
  export const saveCartToLocalStorage = (cartItems) => {
    try {
      localStorage.setItem('shoppingCart', JSON.stringify(cartItems));
      return true;
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
      return false;
    }
  };
  
  /**
   * Check if an item exists in the cart
   * @param {Array} cartItems - Cart items array
   * @param {Object} itemToCheck - Item to check for existence
   * @returns {boolean} True if item exists in cart
   */
  export const isItemInCart = (cartItems, itemToCheck) => {
    return cartItems.some(item => 
      item.itemName === itemToCheck.itemName && 
      item.playerId === itemToCheck.playerId
    );
  };
  
  /**
   * Get the index of an item in the cart
   * @param {Array} cartItems - Cart items array
   * @param {Object} itemToFind - Item to find
   * @returns {number} Index of the item, or -1 if not found
   */
  export const getCartItemIndex = (cartItems, itemToFind) => {
    return cartItems.findIndex(item => 
      item.itemName === itemToFind.itemName && 
      item.playerId === itemToFind.playerId
    );
  };
  
  /**
   * Add an item to the cart
   * @param {Array} cartItems - Current cart items
   * @param {Object} newItem - Item to add to cart
   * @returns {Array} Updated cart items
   */
  export const addItemToCart = (cartItems, newItem) => {
    // Check if item already exists
    const existingItemIndex = getCartItemIndex(cartItems, newItem);
    
    if (existingItemIndex >= 0) {
      // Update quantity of existing item
      const updatedItems = [...cartItems];
      const currentItem = updatedItems[existingItemIndex];
      
      // Respect available quantity limit
      const maxQuantity = currentItem.purchaseTimes || 1;
      updatedItems[existingItemIndex] = {
        ...currentItem,
        quantity: Math.min(currentItem.quantity + 1, maxQuantity)
      };
      
      return updatedItems;
    } else {
      // Add new item with quantity 1
      return [...cartItems, { ...newItem, quantity: 1 }];
    }
  };
  
  /**
   * Remove an item from the cart
   * @param {Array} cartItems - Current cart items
   * @param {Object} itemToRemove - Item to remove
   * @returns {Array} Updated cart items
   */
  export const removeItemFromCart = (cartItems, itemToRemove) => {
    return cartItems.filter(item => 
      !(item.itemName === itemToRemove.itemName && 
        item.playerId === itemToRemove.playerId)
    );
  };
  
  /**
   * Update item quantity in cart
   * @param {Array} cartItems - Current cart items
   * @param {Object} itemToUpdate - Item to update
   * @param {number} newQuantity - New quantity
   * @returns {Array} Updated cart items
   */
  export const updateCartItemQuantity = (cartItems, itemToUpdate, newQuantity) => {
    const itemIndex = getCartItemIndex(cartItems, itemToUpdate);
    
    if (itemIndex === -1) return cartItems; // Item not found
    
    const updatedItems = [...cartItems];
    const item = updatedItems[itemIndex];
    
    // Respect min/max quantity constraints
    const maxQuantity = item.purchaseTimes || 1;
    const quantity = Math.min(Math.max(1, newQuantity), maxQuantity);
    
    updatedItems[itemIndex] = {
      ...item,
      quantity
    };
    
    return updatedItems;
  };
  
  /**
   * Calculate total cost of all items in the cart
   * @param {Array} cartItems - Cart items array
   * @returns {Object} Object containing totalCoins and requiredMaterials
   */
  export const calculateCartTotals = (cartItems) => {
    let totalCoins = 0;
    const requiredMaterials = {};
    
    cartItems.forEach(item => {
      if (item.allowsCoinExchange && item.price) {
        totalCoins += item.price * item.quantity;
      }
      
      if (item.allowsBarterExchange && item.exchangeItemName) {
        const materialName = item.exchangeItemName;
        const materialQty = (item.exchangeQuantity || 1) * item.quantity;
        
        requiredMaterials[materialName] = (requiredMaterials[materialName] || 0) + materialQty;
      }
    });
    
    return {
      totalCoins,
      requiredMaterials
    };
  };
  
  /**
   * Sync cart with available merchants
   * Removes cart items that no longer have available merchants
   * @param {Array} cartItems - Current cart items
   * @param {Array} availableMerchants - Available merchant data
   * @returns {Array} Updated cart items with only valid merchants
   */
  export const syncCartWithAvailableMerchants = (cartItems, availableMerchants) => {
    if (!cartItems || cartItems.length === 0) return [];
    if (!availableMerchants || availableMerchants.length === 0) return [];
    
    // Create map of available merchant IDs
    const validMerchantIds = new Set(availableMerchants.map(m => m.playerId));
    
    // Filter out cart items that don't have a corresponding merchant
    return cartItems.filter(item => validMerchantIds.has(item.playerId));
  };
  
  /**
   * Update cart items with latest merchant data
   * @param {Array} cartItems - Current cart items
   * @param {Array} merchants - Latest merchant data
   * @returns {Array} Updated cart items with current availability and prices
   */
  export const updateCartWithLatestMerchantData = (cartItems, merchants) => {
    if (!cartItems || cartItems.length === 0) return [];
    if (!merchants || merchants.length === 0) return [];
    
    // Create a map for quick merchant lookup
    const merchantMap = {};
    merchants.forEach(merchant => {
      merchantMap[merchant.playerId] = merchant.items;
    });
    
    const updatedItems = cartItems.map(cartItem => {
      // Find merchant items for this cart item
      const merchantItems = merchantMap[cartItem.playerId] || [];
      
      // Find matching item from merchant data
      const merchantItem = merchantItems.find(item => item.itemName === cartItem.itemName);
      
      // If no matching item found, keep the cart item as is
      if (!merchantItem) return cartItem;
      
      // Update cart item with latest merchant data
      const updatedItem = {
        ...cartItem,
        purchaseTimes: merchantItem.purchaseTimes || merchantItem.quantity || 1,
        price: merchantItem.price,
        allowsCoinExchange: merchantItem.allowsCoinExchange,
        allowsBarterExchange: merchantItem.allowsBarterExchange,
        exchangeItemName: merchantItem.exchangeItemName,
        exchangeQuantity: merchantItem.exchangeQuantity || 1
      };
      
      // Ensure quantity doesn't exceed available quantity
      updatedItem.quantity = Math.min(updatedItem.quantity, updatedItem.purchaseTimes);
      
      return updatedItem;
    });
    
    return updatedItems;
  };