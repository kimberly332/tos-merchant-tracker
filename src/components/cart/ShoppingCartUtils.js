// src/components/cart/ShoppingCartUtils.js

// Function to add an item to the cart
export const addToCart = (item) => {
    // Create a custom event to pass the item data
    const addToCartEvent = new CustomEvent('addToCart', {
      detail: item
    });
    
    // Dispatch the event to be caught by the ShoppingCart component
    window.dispatchEvent(addToCartEvent);
  };
  
  // Helper function to calculate total materials needed for a list of items
  export const calculateTotalMaterials = (items) => {
    const materials = {};
    let totalCoins = 0;
    
    items.forEach(item => {
      if (item.allowsCoinExchange && item.price) {
        totalCoins += item.price * item.quantity;
      }
      
      if (item.allowsBarterExchange && item.exchangeItemName) {
        const materialName = item.exchangeItemName;
        const materialQty = (item.exchangeQuantity || 1) * item.quantity;
        
        materials[materialName] = (materials[materialName] || 0) + materialQty;
      }
    });
    
    return {
      totalCoins,
      materials
    };
  };
  
  // Helper function to format currency
  export const formatCurrency = (amount) => {
    return new Intl.NumberFormat('zh-TW').format(amount);
  };
  
  // Helper function to save cart state to localStorage
  export const saveCartToLocalStorage = (cartItems) => {
    try {
      localStorage.setItem('shoppingCart', JSON.stringify(cartItems));
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
    }
  };
  
  // Helper function to load cart state from localStorage
  export const loadCartFromLocalStorage = () => {
    try {
      const savedCart = localStorage.getItem('shoppingCart');
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
      return [];
    }
  };