// src/firebase/firestore.js
import { collection, addDoc, query, where, getDocs, serverTimestamp, orderBy, limit } from 'firebase/firestore';
import { db } from './config';
import { checkUserAuth } from './userAuth';

// Improved function to get Taiwan time end of day (midnight)
export const getTaiwanEndOfDay = () => {
  // Get current date in local time
  const now = new Date();
  
  // Calculate Taiwan time (UTC+8)
  // First convert to UTC by adding the local offset
  const utcTime = now.getTime() + now.getTimezoneOffset() * 60 * 1000;
  
  // Then add 8 hours to get Taiwan time
  const taiwanTime = new Date(utcTime + 8 * 60 * 60 * 1000);
  
  // Set to next day midnight in Taiwan time
  taiwanTime.setHours(24, 0, 0, 0);
  
  // Convert back to local time for comparison
  return new Date(taiwanTime.getTime() - 8 * 60 * 60 * 1000 - now.getTimezoneOffset() * 60 * 1000);
};

// Improved function to get Taiwan time start of day (00:00)
const getTaiwanStartOfDay = () => {
  // Get current UTC time
  const now = new Date();
  
  // Create a date object for Taiwan time (UTC+8)
  const taiwanDate = new Date(now.getTime() + (8 * 60 * 60 * 1000));
  
  // Set to current day 00:00 in Taiwan time
  taiwanDate.setHours(0, 0, 0, 0);
  
  // Convert back to UTC for storage in Firestore
  return new Date(taiwanDate.getTime() - (8 * 60 * 60 * 1000));
};

// Helper function to check if a date is expired (for consistent use throughout the app)
export const isDateExpired = (expiresAt) => {
  if (!expiresAt) return true;
  
  // Convert to Date object if it's a timestamp or string
  const expiryDate = expiresAt instanceof Date ? expiresAt : new Date(expiresAt);
  
  // Get current time
  const now = new Date();
  
  // Compare
  return now > expiryDate;
};

// 獲取當前用戶的伺服器ID
export const getCurrentServerId = () => {
  const user = checkUserAuth();
  return user ? user.serverId : null;
};

// Adding a merchant with improved time handling and logging
export const addMerchant = async (merchantData) => {
  try {
    // Get current user's server
    const serverId = getCurrentServerId();
    if (!serverId) {
      console.error('User not logged in or server info missing');
      return { success: false, error: 'User not logged in or server info missing' };
    }

    // Check if current user has already submitted a merchant today
    const result = await checkUserHasSubmittedToday(merchantData.playerId);
    if (result.hasSubmitted) {
      console.log('User already submitted a merchant today');
      return { success: false, error: 'You have already submitted a merchant today. Please delete your existing information before submitting new information.' };
    }

    // Set expiration time to Taiwan midnight
    const expiresAt = getTaiwanEndOfDay();
    console.log('Setting merchant expiration to:', expiresAt.toISOString());

    // Ensure each item has purchaseTimes property
    const processedItems = merchantData.items.map(item => {
      // If no purchaseTimes provided, set to 1
      if (!item.purchaseTimes) {
        return {
          ...item,
          purchaseTimes: 1
        };
      }
      return item;
    });

    // Prepare data to be added
    const merchantToAdd = {
      ...merchantData,
      serverId, // Add server ID
      items: processedItems,
      timestamp: serverTimestamp(),
      expiresAt
    };

    // Use server subcollection to add merchant data
    const serverMerchantsRef = collection(db, `servers/${serverId}/merchants`);
    const docRef = await addDoc(serverMerchantsRef, merchantToAdd);
    
    console.log('Merchant added successfully with ID:', docRef.id);

    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error adding merchant:', error);
    return { success: false, error: error.message || 'An error occurred while adding merchant' };
  }
};

// Update a merchant
export const updateMerchant = async (merchantId, merchantData) => {
  try {
    // Import needed functions
    const { doc, updateDoc, getDoc, serverTimestamp } = await import('firebase/firestore');

    // Get current user's server ID
    const serverId = getCurrentServerId();
    if (!serverId) {
      return { success: false, error: '用戶未登入或伺服器信息缺失' };
    }

    // Get current user info
    const user = checkUserAuth();
    if (!user || !user.playerId) {
      return { success: false, error: '用戶未登入' };
    }

    // Reference to the merchant document
    const merchantRef = doc(db, `servers/${serverId}/merchants`, merchantId);

    // First, get the current merchant data to verify ownership
    const merchantSnap = await getDoc(merchantRef);
    if (!merchantSnap.exists()) {
      return { success: false, error: '找不到商人資訊' };
    }

    const currentData = merchantSnap.data();

    // Verify the current user is the owner of this merchant
    if (currentData.playerId !== user.playerId) {
      return { success: false, error: '您只能更新自己提交的商人資訊' };
    }

    // Process the items - ensure each item has purchaseTimes
    const processedItems = merchantData.items.map(item => {
      // If no purchaseTimes is provided, set to 1
      if (!item.purchaseTimes) {
        return {
          ...item,
          purchaseTimes: 1
        };
      }
      return item;
    });

    // Prepare the update data
    const updateData = {
      ...merchantData,
      serverId, // Keep the server ID
      items: processedItems,
      updatedAt: serverTimestamp(), // Add update timestamp
    };

    // Don't modify the original timestamp and playerId
    delete updateData.timestamp;
    delete updateData.playerId;

    // Update the document
    await updateDoc(merchantRef, updateData);

    // Dispatch a merchant update event
    try {
      // This will work in browser context
      if (typeof window !== 'undefined' && window.dispatchEvent) {
        const merchantUpdateEvent = new CustomEvent('merchantUpdated', {
          detail: { merchantId, items: processedItems }
        });
        window.dispatchEvent(merchantUpdateEvent);
      }
    } catch (eventError) {
      console.log('Could not dispatch event:', eventError);
      // Failing to dispatch event shouldn't fail the whole update
    }

    return { success: true, id: merchantId };
  } catch (error) {
    console.error('更新商人時發生錯誤:', error);
    return { success: false, error: error.message || '更新時發生錯誤' };
  }
};

// 刪除商人資料
export const deleteMerchant = async (merchantId) => {
  try {
    // 導入需要的函數
    const { doc, deleteDoc, getDoc } = await import('firebase/firestore');

    // 獲取當前用戶伺服器
    const serverId = getCurrentServerId();
    if (!serverId) {
      return { success: false, error: '用戶未登入或伺服器信息缺失' };
    }

    // 獲取當前用戶ID
    const user = checkUserAuth();
    if (!user || !user.playerId) {
      return { success: false, error: '用戶未登入' };
    }

    // 引用商人文件
    const merchantRef = doc(db, `servers/${serverId}/merchants`, merchantId);

    // 先取得商人資料，檢查是否為當前用戶所有
    const merchantSnap = await getDoc(merchantRef);
    if (!merchantSnap.exists()) {
      return { success: false, error: '商人資訊不存在' };
    }

    const merchantData = merchantSnap.data();
    if (merchantData.playerId !== user.playerId) {
      return { success: false, error: '您只能刪除自己提交的商人資訊' };
    }

    // 刪除文件
    await deleteDoc(merchantRef);

    // Dispatch a merchant deleted event
    try {
      // This will work in browser context
      if (typeof window !== 'undefined' && window.dispatchEvent) {
        const merchantDeletedEvent = new CustomEvent('merchantDeleted', {
          detail: { merchantId }
        });
        window.dispatchEvent(merchantDeletedEvent);
      }
    } catch (eventError) {
      console.log('Could not dispatch event:', eventError);
      // Failing to dispatch event shouldn't fail the whole deletion
    }

    return { success: true };
  } catch (error) {
    console.error('刪除商人時發生錯誤:', error);
    return { success: false, error };
  }
};

/**
 * Checks if a timestamp is from today in Taiwan time zone
 * @param {Date|Timestamp} timestamp - The timestamp to check
 * @returns {boolean} - True if the timestamp is from today in Taiwan time
 */
export const isTaiwanToday = (timestamp) => {
  if (!timestamp) return false;
  
  // Convert timestamp to Date if needed
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  
  // Get current date in Taiwan time
  const now = new Date();
  // Convert to UTC by adding local timezone offset, then add Taiwan timezone (+8)
  const taiwanNow = new Date(now.getTime() + now.getTimezoneOffset() * 60 * 1000 + 8 * 60 * 60 * 1000);
  
  // Start of today in Taiwan (midnight)
  const taiwanToday = new Date(taiwanNow);
  taiwanToday.setHours(0, 0, 0, 0);
  
  // Convert timestamp to Taiwan time
  const taiwanDate = new Date(date.getTime() + date.getTimezoneOffset() * 60 * 1000 + 8 * 60 * 60 * 1000);
  
  // Check if timestamp is from today (after midnight, before tomorrow)
  return taiwanDate >= taiwanToday && taiwanDate < new Date(taiwanToday.getTime() + 24 * 60 * 60 * 1000);
};

// 獲取所有商人資料（有選擇性地限制結果數量）
// Getting all merchants with improved logging and error handling
export const getAllMerchants = async (maxResults = 100) => {
  try {
    // Get current user's server
    const user = checkUserAuth();
    const serverId = user?.serverId;
    
    if (!serverId) {
      console.log('No server ID found, user likely not logged in');
      return []; // Return empty array when user not logged in
    }

    console.log('Fetching merchants for server:', serverId);

    // Reference server merchants collection
    const merchantsRef = collection(db, `servers/${serverId}/merchants`);
    
    // Create a basic query to get all merchants
    const merchantQuery = query(
      merchantsRef,
      orderBy('timestamp', 'desc'),
      limit(maxResults)
    );

    const merchantSnapshot = await getDocs(merchantQuery);
    console.log('Total merchants found:', merchantSnapshot.size);
    
    if (merchantSnapshot.empty) {
      console.log('No merchants found for this server');
      return [];
    }

    const merchants = [];
    const now = new Date();

    merchantSnapshot.forEach(doc => {
      const data = doc.data();
      if (!data) return; // Skip if no data
      
      // Format timestamp
      let timestamp = null;
      try {
        timestamp = data.timestamp?.toDate() || now;
      } catch (err) {
        console.error('Error converting timestamp:', err);
        timestamp = now;
      }
      
      // Only include merchants from today (Taiwan time)
      if (!isTaiwanToday(timestamp)) {
        console.log(`Merchant ${doc.id} is not from today, skipping`);
        return; // Skip this merchant
      }
      
      console.log(`Merchant ${doc.id} was created today (Taiwan time)`);

      // Format expiration date
      let expiresAt = null;
      try {
        expiresAt = data.expiresAt?.toDate() || null;
      } catch (err) {
        console.error('Error converting expiresAt:', err);
      }

      const merchantData = {
        id: doc.id,
        playerId: data.playerId || 'Unknown player',
        items: data.items || [],
        timestamp: timestamp,
        discount: data.discount || null,
        expiresAt: expiresAt
      };

      // Add special merchant info if applicable
      if (data.isSpecialMerchant) {
        merchantData.isSpecialMerchant = true;
        merchantData.notes = data.notes;
      }

      merchants.push(merchantData);
    });

    console.log('Today\'s merchants count:', merchants.length);
    
    // Dispatch event about merchants existence
    if (typeof window !== 'undefined') {
      const merchantsExistEvent = new CustomEvent('merchantsExistence', {
        detail: { hasNoMerchants: merchants.length === 0 }
      });
      window.dispatchEvent(merchantsExistEvent);
    }

    return merchants;
  } catch (error) {
    console.error('Error fetching merchants:', error);
    throw error;
  }
};

// 根據ID獲取單個商人
export const getMerchantById = async (merchantId) => {
  try {
    // 導入需要的函數
    const { doc, getDoc } = await import('firebase/firestore');

    // 獲取當前用戶伺服器
    const serverId = getCurrentServerId();
    if (!serverId) {
      throw new Error('用戶未登入或伺服器信息缺失');
    }

    // 引用商人文件
    const merchantRef = doc(db, `servers/${serverId}/merchants`, merchantId);

    // 獲取文件
    const merchantSnap = await getDoc(merchantRef);

    if (merchantSnap.exists()) {
      const data = merchantSnap.data();

      // 格式化數據
      const merchantData = {
        id: merchantSnap.id,
        playerId: data.playerId || '未知玩家',
        items: data.items || [],
        timestamp: data.timestamp?.toDate() || new Date(),
        discount: data.discount || null,
        expiresAt: data.expiresAt?.toDate() || getTaiwanEndOfDay()
      };

      // 添加五商信息（如果適用）
      if (data.isSpecialMerchant) {
        merchantData.isSpecialMerchant = true;
        merchantData.notes = data.notes;
      }

      return merchantData;
    } else {
      throw new Error('找不到商人');
    }
  } catch (error) {
    console.error('獲取商人時發生錯誤:', error);
    throw error;
  }
};

// 添加五商資料
export const addSpecialMerchant = async (merchantData) => {
  try {
    // 獲取當前用戶伺服器
    const serverId = getCurrentServerId();
    if (!serverId) {
      return { success: false, error: '用戶未登入或伺服器信息缺失' };
    }

    // 檢查當前用戶今天是否已提交過商人資訊
    const result = await checkUserHasSubmittedToday(merchantData.playerId);
    if (result.hasSubmitted) {
      return { success: false, error: '您今天已經提交過商人資訊，請先刪除已有資訊再重新提交。' };
    }

    // 設置過期時間為台灣午夜
    const expiresAt = getTaiwanEndOfDay();

    // 標記為五商
    const processedData = {
      ...merchantData,
      serverId,
      isSpecialMerchant: true,
      timestamp: serverTimestamp(),
      expiresAt
    };

    // 使用伺服器子集合添加五商資料
    const serverMerchantsRef = collection(db, `servers/${serverId}/merchants`);
    const docRef = await addDoc(serverMerchantsRef, processedData);

    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('添加五商時發生錯誤:', error);
    return { success: false, error };
  }
};


// 搜索商品
export const searchItems = async (searchTerm) => {
  try {
    // 獲取當前用戶伺服器
    const serverId = getCurrentServerId();
    if (!serverId) {
      return []; // 用戶未登入時返回空數組
    }

    // 在商人集合中搜索
    const results = [];
    const now = new Date();
    const term = searchTerm.toLowerCase();

    // 只搜索未過期的商人
    const merchantQuery = query(
      collection(db, `servers/${serverId}/merchants`),
      where('expiresAt', '>', now)
    );

    const merchantSnapshot = await getDocs(merchantQuery);

    merchantSnapshot.forEach(doc => {
      const data = doc.data();

      // 僅過濾出符合搜索條件的物品，不再返回所有物品
      const matchingItems = data.items ? data.items.filter(item =>
        item.itemName && item.itemName.toLowerCase().includes(term)
      ) : [];

      if (matchingItems.length > 0) {
        const commonData = {
          id: doc.id,
          playerId: data.playerId || '未知玩家',
          items: matchingItems, // 僅包含符合條件的物品
          timestamp: data.timestamp?.toDate() || new Date(),
          discount: data.discount || null,
          expiresAt: data.expiresAt?.toDate() || getTaiwanEndOfDay()
        };

        // 添加五商資料（如果有）
        if (data.isSpecialMerchant) {
          commonData.isSpecialMerchant = true;
          commonData.notes = data.notes;
        }

        results.push(commonData);
      }
    });

    return results;
  } catch (error) {
    console.error('搜索物品時發生錯誤:', error);
    throw error;
  }
};

// 檢查用戶今天是否已提交過商人資訊
export const checkUserHasSubmittedToday = async (playerId) => {
  try {
    if (!playerId) {
      return { hasSubmitted: false };
    }

    // 獲取當前用戶伺服器
    const serverId = getCurrentServerId();
    if (!serverId) {
      return { hasSubmitted: false };
    }

    // 獲取台灣時間的今天開始時間（凌晨5點）
    const startOfToday = getTaiwanStartOfDay();
    const now = new Date();

    // 引用伺服器商人集合
    const merchantsRef = collection(db, `servers/${serverId}/merchants`);

    // 查詢今天該用戶提交的商人資訊
    const merchantQuery = query(
      merchantsRef,
      where('playerId', '==', playerId),
      where('timestamp', '>=', startOfToday),
      where('timestamp', '<=', now),
      limit(1) // 只需要找到一個
    );

    const querySnapshot = await getDocs(merchantQuery);

    if (!querySnapshot.empty) {
      // 找到至少一個匹配的文檔
      const merchantDoc = querySnapshot.docs[0];
      return {
        hasSubmitted: true,
        merchantId: merchantDoc.id
      };
    }

    // 未找到匹配的商人資訊
    return { hasSubmitted: false };
  } catch (error) {
    console.error('檢查用戶提交記錄時發生錯誤:', error);
    return { hasSubmitted: false };
  }
};