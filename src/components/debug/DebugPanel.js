// Create a new file: src/components/debug/DebugPanel.js

import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { getCurrentServerId } from '../../firebase/firestore'; // You'll need to export this

const DebugPanel = () => {
  const [debugMode, setDebugMode] = useState(false);
  const [rawMerchants, setRawMerchants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchRawMerchants = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const serverId = getCurrentServerId();
      if (!serverId) {
        setError('No server ID found. Are you logged in?');
        setLoading(false);
        return;
      }
      
      const merchantsRef = collection(db, `servers/${serverId}/merchants`);
      const snapshot = await getDocs(merchantsRef);
      
      const merchants = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate()?.toISOString() || 'No timestamp',
        expiresAt: doc.data().expiresAt?.toDate()?.toISOString() || 'No expiration date'
      }));
      
      setRawMerchants(merchants);
    } catch (err) {
      console.error('Error fetching raw merchants:', err);
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Toggle debug mode
  const toggleDebugMode = () => {
    const newMode = !debugMode;
    setDebugMode(newMode);
    
    if (newMode) {
      fetchRawMerchants();
    }
  };

  return (
    <>
      {/* Small debug toggle in corner */}
      <button 
        onClick={toggleDebugMode}
        style={{
          position: 'fixed',
          bottom: '10px',
          left: '10px',
          background: 'rgba(0,0,0,0.5)',
          color: '#8ABAB3',
          border: '1px solid #8ABAB3',
          borderRadius: '4px',
          padding: '4px 8px',
          fontSize: '12px',
          zIndex: 1000
        }}
      >
        {debugMode ? 'Hide Debug' : 'Debug Mode'}
      </button>
      
      {/* Debug panel */}
      {debugMode && (
        <div 
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            width: '300px',
            maxHeight: '80vh',
            overflow: 'auto',
            background: 'rgba(16, 24, 35, 0.95)',
            border: '1px solid rgba(138, 186, 179, 0.2)',
            borderRadius: '8px',
            padding: '12px',
            zIndex: 1001,
            color: '#D6D8D9',
            fontSize: '12px'
          }}
        >
          <h3 style={{ color: '#8ABAB3', marginTop: 0 }}>Debug Information</h3>
          
          <div>
            <button 
              onClick={fetchRawMerchants}
              style={{
                background: '#48727B',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '6px 10px',
                marginBottom: '10px',
                cursor: 'pointer'
              }}
            >
              Refresh Data
            </button>
          </div>
          
          <div style={{ marginBottom: '10px' }}>
            <strong>Current Time (Local):</strong> {new Date().toLocaleString()}
          </div>
          
          {loading && <div>Loading...</div>}
          {error && <div style={{ color: '#ff8a80' }}>{error}</div>}
          
          <h4 style={{ color: '#8ABAB3', marginBottom: '8px' }}>Raw Merchant Data ({rawMerchants.length})</h4>
          
          {rawMerchants.map(merchant => (
            <div 
              key={merchant.id} 
              style={{ 
                border: '1px solid rgba(138, 186, 179, 0.15)',
                borderRadius: '4px',
                padding: '8px',
                marginBottom: '8px',
                backgroundColor: 'rgba(16, 24, 35, 0.7)'
              }}
            >
              <div><strong>ID:</strong> {merchant.id}</div>
              <div><strong>Player:</strong> {merchant.playerId}</div>
              <div><strong>Items:</strong> {merchant.items?.length || 0}</div>
              <div style={{ wordBreak: 'break-all' }}>
                <strong>Expires:</strong> {merchant.expiresAt}
              </div>
              <div>
                <strong>Created:</strong> {merchant.timestamp}
              </div>
              <div>
                <strong>Special:</strong> {merchant.isSpecialMerchant ? 'Yes' : 'No'}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default DebugPanel;