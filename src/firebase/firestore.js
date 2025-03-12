import { collection, addDoc, query, where, getDocs, serverTimestamp, orderBy, limit } from 'firebase/firestore';
import { db } from './config';

// Add merchant data (handles both regular and special merchants)
export const addMerchant = async (merchantData) => {
  try {
    // Calculate expiration time (24 hours)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);
    
    const docRef = await addDoc(collection(db, 'merchants'), {
      ...merchantData,
      timestamp: serverTimestamp(),
      expiresAt
    });
    
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error adding merchant:', error);
    return { success: false, error };
  }
};

// Get all merchant data (with optional limit)
export const getAllMerchants = async (maxResults = 100) => {
  try {
    const now = new Date();
    const merchantsRef = collection(db, 'merchants');
    // 只獲取未過期的商人資訊，並按時間戳降序排序
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
        playerId: data.playerId,
        serverName: data.serverName,
        guildName: data.guildName,
        items: data.items || [],
        timestamp: data.timestamp?.toDate() || new Date(),
        discount: data.discount || null
      };
      
      // 添加五商特有資訊
      if (data.isSpecialMerchant) {
        merchantData.isSpecialMerchant = true;
        merchantData.location = data.location;
        merchantData.exchangeRate = data.exchangeRate;
        merchantData.totalAmount = data.totalAmount;
      }
      
      merchants.push(merchantData);
    });
    
    return merchants;
  } catch (error) {
    console.error('Error fetching merchants:', error);
    throw error;
  }
};

// Search for items
export const searchItems = async (searchTerm) => {
  try {
    // Search in merchants collection
    const results = [];
    const merchantQuery = query(collection(db, 'merchants'));
    const merchantSnapshot = await getDocs(merchantQuery);
    
    merchantSnapshot.forEach(doc => {
      const data = doc.data();
      const matchingItems = data.items.filter(item => 
        item.itemName.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      if (matchingItems.length > 0) {
        const commonData = {
          id: doc.id,
          playerId: data.playerId,
          serverName: data.serverName,
          guildName: data.guildName,
          items: matchingItems,
          timestamp: data.timestamp?.toDate() || new Date(),
          discount: data.discount || null
        };
        
        // Add special merchant data if available
        if (data.isSpecialMerchant) {
          commonData.isSpecialMerchant = true;
          commonData.location = data.location;
          commonData.exchangeRate = data.exchangeRate;
          commonData.totalAmount = data.totalAmount;
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