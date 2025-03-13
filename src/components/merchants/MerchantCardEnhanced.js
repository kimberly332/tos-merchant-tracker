import React from 'react';

const MerchantCardEnhanced = ({ 
  merchant, 
  copyToClipboard, 
  formatTimestamp, 
  navigate 
}) => {
  return (
    <div className={`merchant-card ${merchant.isSpecialMerchant ? 'special-merchant-card' : ''}`}>
      <div className="merchant-header">
        <div className="merchant-title">
          <h3 
            className="player-id-copy" 
            onClick={() => copyToClipboard(merchant.playerId)}
            title="點擊複製玩家ID"
          >
            {merchant.playerId} <span className="copy-icon">📋 (複製ID)</span>
          </h3>
          {merchant.isSpecialMerchant && (
            <span className="special-merchant-badge">五商</span>
          )}
        </div>
        {merchant.discount && (
          <p className="discount-info">折扣: {merchant.discount}</p>
        )}
      </div>
      
      {merchant.items && merchant.items.length > 0 ? (
        <div className="items-section">
          <h4>販售物品:</h4>
          <div className="items-list">
            {merchant.items.map((item, itemIndex) => (
              <div key={itemIndex} className="item">
                <div className="item-name-container">
                  <span className="item-name">{item.itemName || '未知物品'}</span>
                  {item.quantity > 1 && (
                    <span className="item-quantity">x{item.quantity}</span>
                  )}
                </div>
                
                <div className="item-details">
                  {item.category && item.category !== '其他' && item.category !== item.itemName && (
                    <span className="item-category">{item.category}</span>
                  )}
                  
                  {/* 價格顯示，如果允許家園幣交易 */}
                  {(item.allowsCoinExchange || typeof item.allowsCoinExchange === 'undefined') && item.price > 0 && (
                    <div className="price-tag">
                      <span className="coin-icon">💰</span>
                      <span>{item.price}</span>
                    </div>
                  )}
                  
                  {/* 交換物品顯示，如果允許以物易物交易 */}
                  {item.allowsBarterExchange && item.exchangeItemName && (
                    <div className="exchange-tag">
                      <span className="exchange-icon">🔄</span>
                      <span>{item.exchangeQuantity || 1} {item.exchangeItemName}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="no-items">此商人沒有物品信息</div>
      )}
      
      <div className="merchant-footer">
        <div className="time-info">
          <p className="submission-time">
            <span className="time-label">提交時間:</span>
            <span>{formatTimestamp(merchant.timestamp)}</span>
          </p>
        </div>
        
        {localStorage.getItem('submitterPlayerId') === merchant.playerId && (
          <div className="edit-controls">
            <button 
              className="edit-btn"
              onClick={() => navigate(`/edit-merchant/${merchant.id}`)}
              title="編輯商人資訊"
            >
              <span className="edit-icon">✏️</span> 編輯
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MerchantCardEnhanced;