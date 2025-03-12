import { collection, addDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from './config';

// Add regular merchant data
export const addRegularMerchant = async (merchantData) => {
  try {
    // Calculate expiration time (24 hours)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);
    
    const docRef = await addDoc(collection(db, 'regularMerchants'), {
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

// Add special merchant data
export const addSpecialMerchant = async (merchantData) => {
  try {
    // Calculate expiration time (24 hours)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);
    
    const docRef = await addDoc(collection(db, 'specialMerchants'), {
      ...merchantData,
      timestamp: serverTimestamp(),
      expiresAt
    });
    
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error adding special merchant:', error);
    return { success: false, error };
  }
};

// Search for items
export const searchItems = async (searchTerm) => {
  try {
    // Search in regular merchants
    const results = [];
    const regularQuery = query(collection(db, 'regularMerchants'));
    const regularSnapshot = await getDocs(regularQuery);
    
    regularSnapshot.forEach(doc => {
      const data = doc.data();
      const matchingItems = data.items.filter(item => 
        item.itemName.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      if (matchingItems.length > 0) {
        results.push({
          id: doc.id,
          playerId: data.playerId,
          serverName: data.serverName,
          guildName: data.guildName,
          items: matchingItems,
          timestamp: data.timestamp?.toDate() || new Date()
        });
      }
    });
    
    return results;
  } catch (error) {
    console.error('Error searching items:', error);
    throw error;
  }
};