import { collection, addDoc, query, where, getDocs, serverTimestamp, orderBy, limit } from 'firebase/firestore';
import { db } from './config';

// Helper function to get Taiwan time end of day (midnight)
const getTaiwanEndOfDay = () => {
  // Create date object for current time in local timezone
  const now = new Date();
  
  // Convert to Taiwan time (UTC+8)
  const taiwanOffset = 8 * 60; // Taiwan UTC+8 in minutes
  const localOffset = now.getTimezoneOffset(); // Local offset in minutes
  const totalOffsetMinutes = taiwanOffset + localOffset;
  
  // Adjust the date to Taiwan time
  const taiwanDate = new Date(now.getTime() + totalOffsetMinutes * 60 * 1000);
  
  // Set to next midnight in Taiwan time (5 AM to midnight rule)
  const taiwanReset = new Date(taiwanDate);
  taiwanReset.setHours(24, 0, 0, 0); // Set to midnight
  
  // Convert back to local time for storage/comparison
  return new Date(taiwanReset.getTime() - totalOffsetMinutes * 60 * 1000);
};

// Helper to get Taiwan time start of day (5 AM)
const getTaiwanStartOfDay = () => {
  // Create date object for current time in local timezone
  const now = new Date();
  
  // Convert to Taiwan time (UTC+8)
  const taiwanOffset = 8 * 60; // Taiwan UTC+8 in minutes
  const localOffset = now.getTimezoneOffset(); // Local offset in minutes
  const totalOffsetMinutes = taiwanOffset + localOffset;
  
  // Adjust the date to Taiwan time
  const taiwanDate = new Date(now.getTime() + totalOffsetMinutes * 60 * 1000);
  
  // Set to 5 AM in Taiwan time
  const taiwanReset = new Date(taiwanDate);
  taiwanReset.setHours(5, 0, 0, 0); // Set to 5 AM
  
  // If current Taiwan time is before 5 AM, use previous day's 5 AM
  if (taiwanDate.getHours() < 5) {
    taiwanReset.setDate(taiwanReset.getDate() - 1);
  }
  
  // Convert back to local time for storage/comparison
  return new Date(taiwanReset.getTime() - totalOffsetMinutes * 60 * 1000);
};

// 添加商人資料 (處理一般商人和特殊商人)
export const addMerchant = async (merchantData) => {
    try {
      // 設定過期時間為台灣午夜
      const expiresAt = getTaiwanEndOfDay();
      
      // 確保每個物品有 availableQuantity 屬性
      const processedItems = merchantData.items.map(item => {
        // 如果沒有提供 availableQuantity，或 availableQuantity 大於 quantity，則設置為 quantity
        if (!item.availableQuantity || Number(item.availableQuantity) > Number(item.quantity)) {
          return {
            ...item,
            availableQuantity: Number(item.quantity)
          };
        }
        return item;
      });
      
      const docRef = await addDoc(collection(db, 'merchants'), {
        ...merchantData,
        items: processedItems,
        timestamp: serverTimestamp(),
        expiresAt
      });
      
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('Error adding merchant:', error);
      return { success: false, error };
    }
  };
  
  // 更新現有商人資料
  export const updateMerchant = async (merchantId, updatedData) => {
    try {
      // 導入需要的函數
      const { doc, updateDoc } = await import('firebase/firestore');
      
      // 確保每個物品有 availableQuantity 屬性
      const processedItems = updatedData.items.map(item => {
        // 如果沒有提供 availableQuantity，或 availableQuantity 大於 quantity，則設置為 quantity
        if (!item.availableQuantity || Number(item.availableQuantity) > Number(item.quantity)) {
          return {
            ...item,
            availableQuantity: Number(item.quantity)
          };
        }
        return item;
      });
      
      // 參考商人文檔
      const merchantRef = doc(db, 'merchants', merchantId);
      
      // 更新文檔
      await updateDoc(merchantRef, {
        ...updatedData,
        items: processedItems
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error updating merchant:', error);
      return { success: false, error };
    }
  };
  
  // 獲取所有商人資料 (有選擇性地限制結果數量)
  export const getAllMerchants = async (maxResults = 100) => {
    try {
      const now = new Date();
      const merchantsRef = collection(db, 'merchants');
      
      // 只獲取尚未過期的商人 (台灣午夜之前)
      const merchantQuery = query(
        merchantsRef,
        where('expiresAt', '>', now),
        orderBy('expiresAt', 'desc'),
        limit(maxResults)
      );
      
      const merchantSnapshot = await getDocs(merchantQuery);
      const merchants = [];
      
      merchantSnapshot.forEach(doc => {
        const data = doc.data();
        const merchantData = {
          id: doc.id,
          playerId: data.playerId || '未知玩家',
          items: data.items || [],
          timestamp: data.timestamp?.toDate() || new Date(),
          discount: data.discount || null,
          expiresAt: data.expiresAt?.toDate() || getTaiwanEndOfDay()
        };
        
        // 添加特殊商人資訊
        if (data.isSpecialMerchant) {
          merchantData.isSpecialMerchant = true;
          merchantData.notes = data.notes;
        }
        
        merchants.push(merchantData);
      });
      
      return merchants;
    } catch (error) {
      console.error('Error fetching merchants:', error);
      throw error;
    }
  };
  
// Get a single merchant by ID
export const getMerchantById = async (merchantId) => {
  try {
      // Import needed functions
      const { doc, getDoc } = await import('firebase/firestore');
      
      // Reference to the merchant document
      const merchantRef = doc(db, 'merchants', merchantId);
      
      // Get the document
      const merchantSnap = await getDoc(merchantRef);
      
      if (merchantSnap.exists()) {
        const data = merchantSnap.data();
        
        // Format data similar to getAllMerchants output
        const merchantData = {
          id: merchantSnap.id,
          playerId: data.playerId || '未知玩家',
          items: data.items || [],
          timestamp: data.timestamp?.toDate() || new Date(),
          discount: data.discount || null,
          expiresAt: data.expiresAt?.toDate() || getTaiwanEndOfDay()
        };
        
        // Add special merchant info if applicable
        if (data.isSpecialMerchant) {
          merchantData.isSpecialMerchant = true;
          // Removed the fields: location, exchangeRate, totalAmount
          merchantData.notes = data.notes;
        }
        
        return merchantData;
      } else {
        throw new Error('Merchant not found');
      }
    } catch (error) {
      console.error('Error fetching merchant:', error);
      throw error;
    }
};

// Add special merchant data (for family token merchants)
export const addSpecialMerchant = async (merchantData) => {
  try {
    // Set expiration time to Taiwan midnight
    const expiresAt = getTaiwanEndOfDay();
    
    // Mark as special merchant
    const processedData = {
      ...merchantData,
      isSpecialMerchant: true,
      timestamp: serverTimestamp(),
      expiresAt
    };
    
    const docRef = await addDoc(collection(db, 'merchants'), processedData);
    
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error adding special merchant:', error);
    return { success: false, error };
  }
};

// Search for items
export const searchItems = async (searchTerm) => {
  try {
    // Search in merchants collection
    const results = [];
    const now = new Date();
    
    // Only search merchants that haven't expired
    const merchantQuery = query(
      collection(db, 'merchants'),
      where('expiresAt', '>', now)
    );
    
    const merchantSnapshot = await getDocs(merchantQuery);
    
    merchantSnapshot.forEach(doc => {
      const data = doc.data();
      const matchingItems = data.items ? data.items.filter(item => 
        item.itemName && item.itemName.toLowerCase().includes(searchTerm.toLowerCase())
      ) : [];
      
      if (matchingItems.length > 0) {
        const commonData = {
          id: doc.id,
          playerId: data.playerId || '未知玩家',
          // Removed serverName and guildName
          items: matchingItems,
          timestamp: data.timestamp?.toDate() || new Date(),
          discount: data.discount || null,
          expiresAt: data.expiresAt?.toDate() || getTaiwanEndOfDay()
        };
        
        // Add special merchant data if available
        if (data.isSpecialMerchant) {
          commonData.isSpecialMerchant = true;
          // Removed the fields: location, exchangeRate, and totalAmount
          commonData.notes = data.notes;
        }
        
        results.push(commonData);
      }
    });
    
    return results;
  } catch (error) {
    console.error('Error searching items:', error);
    throw error;
  }
};