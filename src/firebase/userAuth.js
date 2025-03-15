// src/firebase/userAuth.js
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './config';

// 獲取台灣時間的今天日期字符串（YYYY-MM-DD格式）
const getTaiwanDateString = () => {
  const now = new Date();
  
  // 轉換至台灣時間 (UTC+8)
  const taiwanOffset = 8 * 60; // 台灣UTC+8（分鐘）
  const localOffset = now.getTimezoneOffset(); // 本地時區偏移（分鐘）
  const totalOffsetMinutes = taiwanOffset + localOffset;
  
  // 調整日期至台灣時間
  const taiwanTime = new Date(now.getTime() + totalOffsetMinutes * 60 * 1000);
  
  // 格式化為 YYYY-MM-DD
  const year = taiwanTime.getFullYear();
  const month = String(taiwanTime.getMonth() + 1).padStart(2, '0');
  const day = String(taiwanTime.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

// 用戶登入/註冊函數
export const loginUser = async (serverId, playerId) => {
  try {
    if (!serverId || !playerId.trim()) {
      return { success: false, message: '伺服器和遊戲名稱都必須填寫' };
    }
    
    // 檢查使用者是否已存在
    const userRef = doc(db, 'users', `${serverId}_${playerId}`);
    const userDoc = await getDoc(userRef);
    
    // 當前台灣日期
    const currentDate = getTaiwanDateString();
    
    if (userDoc.exists()) {
      // 更新用戶最後登入時間和伺服器
      const userData = userDoc.data();
      
      // 檢查購物車日期 - 如果不是今天，則重置購物車
      const cartLastUpdated = userData.cartLastUpdated || '';
      const shoppingCart = (cartLastUpdated === currentDate) 
        ? (userData.shoppingCart || []) 
        : [];
      
      await setDoc(userRef, {
        ...userData,
        serverId,
        lastLogin: new Date(),
        cartLastUpdated: currentDate,
        shoppingCart
      }, { merge: true });
      
      return { 
        success: true, 
        message: '登入成功！', 
        userId: `${serverId}_${playerId}`,
        serverId,
        playerId,
        shoppingCart
      };
    } else {
      // 創建新用戶
      await setDoc(userRef, {
        serverId,
        playerId,
        createdAt: new Date(),
        lastLogin: new Date(),
        shoppingCart: [],
        cartLastUpdated: currentDate
      });
      
      return { 
        success: true, 
        message: '帳號創建成功！', 
        userId: `${serverId}_${playerId}`,
        serverId,
        playerId,
        shoppingCart: []
      };
    }
  } catch (error) {
    console.error('登入/註冊時發生錯誤:', error);
    return { success: false, message: '登入時發生錯誤，請稍後再試。' };
  }
};

// 更新用戶的購物車
export const updateUserCart = async (userId, cartItems) => {
  try {
    if (!userId) return;
    
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      // 當前台灣日期
      const currentDate = getTaiwanDateString();
      
      await setDoc(userRef, {
        shoppingCart: cartItems,
        cartLastUpdated: currentDate
      }, { merge: true });
      
      return { success: true };
    }
    
    return { success: false };
  } catch (error) {
    console.error('更新購物車時發生錯誤:', error);
    return { success: false };
  }
};

// 登出功能
export const logoutUser = () => {
  localStorage.removeItem('currentUser');
  localStorage.removeItem('shoppingCart');
  
  // 可能需要重置其他儲存的用戶信息
  localStorage.removeItem('submitterPlayerId');
  
  return { success: true, message: '已登出' };
};

// 檢查用戶是否已登入
export const checkUserAuth = () => {
  try {
    const userJson = localStorage.getItem('currentUser');
    if (!userJson) return null;
    
    return JSON.parse(userJson);
  } catch (error) {
    console.error('檢查用戶認證狀態時發生錯誤:', error);
    return null;
  }
};