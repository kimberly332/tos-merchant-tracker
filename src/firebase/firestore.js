// src/firebase/firestore.js
import { collection, addDoc, query, where, getDocs, serverTimestamp, orderBy, limit } from 'firebase/firestore';
import { db } from './config';
import { checkUserAuth } from './userAuth';

// 獲取台灣時間結束時間（午夜）
const getTaiwanEndOfDay = () => {
  // 創建本地時區的日期對象
  const now = new Date();

  // 轉換至台灣時間 (UTC+8)
  const taiwanOffset = 8 * 60; // 台灣UTC+8（分鐘）
  const localOffset = now.getTimezoneOffset(); // 本地時區偏移（分鐘）
  const totalOffsetMinutes = taiwanOffset + localOffset;

  // 調整日期至台灣時間
  const taiwanDate = new Date(now.getTime() + totalOffsetMinutes * 60 * 1000);

  // 設置為下一個午夜（台灣時間）
  const taiwanReset = new Date(taiwanDate);
  taiwanReset.setHours(24, 0, 0, 0); // 設置為午夜

  // 轉換回本地時間以便存儲/比較
  return new Date(taiwanReset.getTime() - totalOffsetMinutes * 60 * 1000);
};

// 獲取台灣時間開始時間（5 AM）
const getTaiwanStartOfDay = () => {
  // 創建本地時區的日期對象
  const now = new Date();

  // 轉換至台灣時間 (UTC+8)
  const taiwanOffset = 8 * 60; // 台灣UTC+8（分鐘）
  const localOffset = now.getTimezoneOffset(); // 本地時區偏移（分鐘）
  const totalOffsetMinutes = taiwanOffset + localOffset;

  // 調整日期至台灣時間
  const taiwanDate = new Date(now.getTime() + totalOffsetMinutes * 60 * 1000);

  // 設置為台灣時間 5 AM
  const taiwanReset = new Date(taiwanDate);
  taiwanReset.setHours(5, 0, 0, 0); // 設置為早上 5 點

  // 如果當前台灣時間在早上 5 點之前，使用前一天的早上 5 點
  if (taiwanDate.getHours() < 5) {
    taiwanReset.setDate(taiwanReset.getDate() - 1);
  }

  // 轉換回本地時間以便存儲/比較
  return new Date(taiwanReset.getTime() - totalOffsetMinutes * 60 * 1000);
};

// 獲取當前用戶的伺服器ID
const getCurrentServerId = () => {
  const user = checkUserAuth();
  return user ? user.serverId : null;
};

// 添加商人資料（處理一般商人和五商）
export const addMerchant = async (merchantData) => {
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

    // 確保每個物品有 purchaseTimes 屬性，並且沒有 undefined 值
    const processedItems = merchantData.items.map(item => {
      // 如果沒有提供 purchaseTimes，設置為 1
      const processedItem = {
        ...item,
        purchaseTimes: item.purchaseTimes || 1
      };
      
      // 將所有 undefined 值替換為 null
      Object.keys(processedItem).forEach(key => {
        if (processedItem[key] === undefined) {
          processedItem[key] = null;
        }
      });
      
      return processedItem;
    });

    // 創建一個清理過的商人數據對象
    const cleanMerchantData = {
      ...merchantData,
      items: processedItems,
      serverId, // 添加伺服器ID
      timestamp: serverTimestamp(),
      expiresAt
    };
    
    // 將所有 undefined 值替換為 null (頂層屬性)
    Object.keys(cleanMerchantData).forEach(key => {
      if (cleanMerchantData[key] === undefined) {
        cleanMerchantData[key] = null;
      }
    });

    // 使用伺服器子集合添加商人資料
    const serverMerchantsRef = collection(db, `servers/${serverId}/merchants`);
    const docRef = await addDoc(serverMerchantsRef, cleanMerchantData);

    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('添加商人時發生錯誤:', error);
    return { success: false, error: error.message || '添加商人時發生錯誤' };
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

// 獲取所有商人資料（有選擇性地限制結果數量）
export const getAllMerchants = async (maxResults = 100) => {
  try {
    const now = new Date();

    // 獲取當前用戶伺服器
    const serverId = getCurrentServerId();
    if (!serverId) {
      return []; // 用戶未登入時返回空數組
    }

    // 引用伺服器商人集合
    const merchantsRef = collection(db, `servers/${serverId}/merchants`);

    // 只獲取尚未過期的商人（台灣午夜之前）
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

      // 添加五商信息
      if (data.isSpecialMerchant) {
        merchantData.isSpecialMerchant = true;
        merchantData.notes = data.notes;
      }

      merchants.push(merchantData);
    });

    return merchants;
  } catch (error) {
    console.error('獲取商人資料時發生錯誤:', error);
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