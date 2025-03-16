// src/utils/CartSyncService.js

/**
 * Service for synchronizing cart items with updated merchant data
 */
export const CartSyncService = {
    /**
     * Sync cart items with updated merchant data
     * @param {string} merchantId - Merchant ID of the updated merchant
     * @param {Array} updatedItems - Updated merchant items
     * @returns {Object} - Information about the sync operation
     */
    syncCartItems: (merchantId, updatedItems) => {
      try {
        const savedCart = localStorage.getItem('shoppingCart');
        if (!savedCart) return { updated: false, message: 'No cart found' };
        
        const cartItems = JSON.parse(savedCart);
        const itemsToUpdate = cartItems.filter(item => item.merchantId === merchantId);
        
        if (itemsToUpdate.length === 0) {
          return { updated: false, message: 'No items from this merchant in cart' };
        }
        
        let updatedCount = 0;
        const updatedCart = cartItems.map(cartItem => {
          // If the item is from this merchant, update its properties
          if (cartItem.merchantId === merchantId) {
            // Find the corresponding updated item
            const updatedItem = updatedItems.find(item => 
              (item.itemName === cartItem.itemName) || 
              (item.category === cartItem.itemName) ||
              (item.category === '其他' && item.customItem === cartItem.itemName)
            );
            
            if (updatedItem) {
              updatedCount++;
              
              // Get the correct itemName based on the updated item's properties
              const updatedItemName = updatedItem.category === '其他' 
                ? updatedItem.customItem 
                : updatedItem.itemName || updatedItem.category;
              
              // Create a new item with updated values
              return {
                ...cartItem,
                // Update item properties with new values
                itemName: updatedItemName,
                price: updatedItem.price || cartItem.price,
                itemQuantity: updatedItem.quantity || cartItem.itemQuantity,
                purchaseTimes: updatedItem.purchaseTimes || cartItem.purchaseTimes,
                // Ensure quantity doesn't exceed the new purchaseTimes
                quantity: Math.min(cartItem.quantity, updatedItem.purchaseTimes || 1),
                allowsCoinExchange: updatedItem.allowsCoinExchange !== undefined 
                  ? updatedItem.allowsCoinExchange 
                  : cartItem.allowsCoinExchange,
                allowsBarterExchange: updatedItem.allowsBarterExchange !== undefined 
                  ? updatedItem.allowsBarterExchange 
                  : cartItem.allowsBarterExchange,
                // Update exchange item if available
                exchangeItemName: updatedItem.exchangeItemName || cartItem.exchangeItemName,
                exchangeQuantity: updatedItem.exchangeQuantity || cartItem.exchangeQuantity,
                // Add a flag to indicate this item was auto-updated
                wasUpdated: true,
                lastUpdated: new Date().toISOString()
              };
            }
          }
          
          // Return the original item if no update needed
          return cartItem;
        });
        
        // Save the updated cart
        localStorage.setItem('shoppingCart', JSON.stringify(updatedCart));
        
        // Dispatch an event about the update
        const cartUpdatedEvent = new CustomEvent('cartUpdated', {
          detail: { 
            cart: updatedCart,
            autoUpdated: true,
            updatedCount
          }
        });
        window.dispatchEvent(cartUpdatedEvent);
        
        return { 
          updated: true, 
          count: updatedCount,
          message: `Updated ${updatedCount} items in cart`
        };
      } catch (error) {
        console.error('Error synchronizing cart items:', error);
        return { 
          updated: false, 
          error,
          message: 'Error synchronizing cart items'
        };
      }
    },
    
    /**
     * Check if cart needs sync based on merchant updates
     * Should be called when loading cart
     * @returns {Object} - Information about needed updates
     */
    checkCartForUpdates: () => {
      try {
        const savedCart = localStorage.getItem('shoppingCart');
        if (!savedCart) return { needsSync: false };
        
        const cartItems = JSON.parse(savedCart);
        
        // Group cart items by merchant ID
        const merchantItems = {};
        cartItems.forEach(item => {
          if (item.merchantId) {
            if (!merchantItems[item.merchantId]) {
              merchantItems[item.merchantId] = [];
            }
            merchantItems[item.merchantId].push(item);
          }
        });
        
        // For each merchant group, check if any items were updated
        const merchantsToCheck = Object.keys(merchantItems);
        
        if (merchantsToCheck.length === 0) {
          return { needsSync: false };
        }
        
        // Return the list of merchants that need checking
        // The actual check would require loading merchant data from Firestore
        return { 
          needsSync: true, 
          merchantsToCheck
        };
      } catch (error) {
        console.error('Error checking cart for updates:', error);
        return { needsSync: false, error };
      }
    }
  };
  
  export default CartSyncService;