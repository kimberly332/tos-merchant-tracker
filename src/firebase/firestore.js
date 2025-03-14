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
    
    // 設置過期時間為台灣午夜
    const expiresAt = getTaiwanEndOfDay();
    
    // 確保每個物品有 purchaseTimes 屬性
    const processedItems = merchantData.items.map(item => {
      // 如果沒有提供 purchaseTimes，或 purchaseTimes 大於 quantity，則設置為 quantity
      if (!item.purchaseTimes || Number(item.purchaseTimes) > Number(item.quantity)) {
        return {
          ...item,
          purchaseTimes: Number(item.quantity)
        };
      }
      return item;
    });
    
    // 使用伺服器子集合添加商人資料
    const serverMerchantsRef = collection(db, `servers/${serverId}/merchants`);
    const docRef = await addDoc(serverMerchantsRef, {
      ...merchantData,
      serverId, // 添加伺服器ID
      items: processedItems,
      timestamp: serverTimestamp(),
      expiresAt
    });
    
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('添加商人時發生錯誤:', error);
    return { success: false, error };
  }
};

// 更新現有商人資料
export const updateMerchant = async (merchantId, updatedData) => {
  try {
    // 導入需要的函數
    const { doc, updateDoc } = await import('firebase/firestore');
    
    // 獲取當前用戶伺服器
    const serverId = getCurrentServerId();
    if (!serverId) {
      return { success: false, error: '用戶未登入或伺服器信息缺失' };
    }
    
    // 確保每個物品有 purchaseTimes 屬性
    const processedItems = updatedData.items.map(item => {
      // 如果沒有提供 purchaseTimes，或 purchaseTimes 大於 quantity，則設置為 quantity
      if (!item.purchaseTimes || Number(item.purchaseTimes) > Number(item.quantity)) {
        return {
          ...item,
          purchaseTimes: Number(item.quantity)
        };
      }
      return item;
    });
    
    // 引用伺服器商人文件
    const merchantRef = doc(db, `servers/${serverId}/merchants`, merchantId);
    
    // 更新文件
    await updateDoc(merchantRef, {
      ...updatedData,
      items: processedItems
    });
    
    return { success: true };
  } catch (error) {
    console.error('更新商人時發生錯誤:', error);
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
    
    // 只搜索未過期的商人
    const merchantQuery = query(
      collection(db, `servers/${serverId}/merchants`),
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
          items: matchingItems,
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