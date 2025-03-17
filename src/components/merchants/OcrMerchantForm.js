import React, { useState, useEffect } from 'react';
import { addMerchant } from '../../firebase/firestore';
import SuccessNotification from '../common/SuccessNotification';
import SearchableSelect from '../common/SearchableSelect';
import ImageOCRMerchantInput from './ImageOCRMerchantInput';
import { checkUserAuth } from '../../firebase/userAuth';
import '../common/SearchableSelect.css';

const OcrMerchantForm = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [formData, setFormData] = useState({
    playerId: '',
    discount: '',
    items: Array(6).fill().map(() => ({
      category: '',
      customItem: '',
      quantity: '',
      purchaseTimes: '',
      price: '',
      allowsCoinExchange: true,
      allowsBarterExchange: false,
      exchangeItemName: '',
      customExchangeItem: '',
      exchangeQuantity: ''
    }))
  });

  const [user, setUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [isSpecialMerchant, setIsSpecialMerchant] = useState(false);
  const [showOcrInterface, setShowOcrInterface] = useState(true);

  // 檢查用戶登入狀態
  useEffect(() => {
    const currentUser = checkUserAuth();
    if (currentUser) {
      setUser(currentUser);
      setFormData(prev => ({
        ...prev,
        playerId: currentUser.playerId
      }));
    }
  }, []);

  // 定義分類和物品
  const categoryGroups = [
    {
      name: '原料',
      items: [
        '小麥', '玉米', '胡蘿蔔', '番茄', '甘蔗', '草莓', '雞蛋', '牛奶', '蜂蜜'
      ]
    },
    {
      name: '加工品',
      items: [
        '小麵包', '玉米麵包', '曲奇餅', '鮮奶油', '奶油', '起司',
        '胡蘿蔔汁', '番茄汁', '草莓鮮奶汁', '混合果汁',
        '番茄醬', '披薩醬', '草莓醬', '魚露',
        '砂糖', '方糖', '糖漿',
        '玉米霜淇淋', '奶油霜淇淋', '草莓霜淇淋', '鮮奶油霜淇淋',
        '鮮奶油蛋糕', '胡蘿蔔蛋糕', '起司蛋糕', '蜂蜜蛋糕', '草莓蛋糕',
        '田園披薩', '起司披薩', '水果披薩', '海鮮披薩'
      ]
    },
    {
      name: '果品',
      items: [
        '黃金汁液', '緋紅汁液', '濃綢汁液', '百里香', '阿奇米果', '高嶺樹果', '飛雲菇'
      ]
    },
    {
      name: '底板',
      items: [
        '戲劇舞臺', '藍藍天空'
      ]
    },
    {
      name: '田園系列',
      items: [
        '田園圓桌', '田園竹椅', '田園陽傘'
      ]
    },
    {
      name: '明黃系列',
      items: [
        '明黃木門', '明黃木門碎片', '明黃鬱金香花圃', '明黃花壇', '明黃盆栽'
      ]
    },
    {
      name: '水果系列',
      items: [
        '小小檸檬凳', '小小奇異果凳', '小小西瓜凳', '小小奇異果羹', '小小西瓜羹', '小小香橙凳'
      ]
    },
    {
      name: '其他物品',
      items: [
        '家園幣',
        '其他'
      ]
    }
  ];

  // 定義交換物品分類
  const exchangeCategoryGroups = [
    {
      name: '原料',
      items: [
        '小麥', '玉米', '胡蘿蔔', '番茄', '甘蔗', '草莓', '雞蛋', '牛奶', '蜂蜜'
      ]
    },
    {
      name: '水果',
      items: [
        '藍色漿果', '紅色漿果', '草莓'
      ]
    },
    {
      name: '其他物品',
      items: [
        '家園幣',
        '其他'
      ]
    }
  ];

  // 處理表單提交
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitResult(null);

    try {
      // 過濾掉未填寫的商品項
      const filledItems = formData.items.filter(
        item => item.category && item.quantity
      );

      if (filledItems.length === 0) {
        setSubmitResult({
          success: false,
          message: '請至少添加一個商品'
        });
        setSubmitting(false);
        return;
      }

      // 處理表單數據
const processedData = {
    ...formData,
    isSpecialMerchant,
    items: filledItems.map(item => {
      // 創建一個基本物品對象
      const processedItem = {
        itemName: item.category === '其他' ? item.customItem : item.category,
        quantity: Number(item.quantity) || 0,
        purchaseTimes: Number(item.purchaseTimes) || Number(item.quantity) || 1,
        price: item.allowsCoinExchange ? Number(item.price) || 0 : 0,
        allowsCoinExchange: Boolean(item.allowsCoinExchange),
        allowsBarterExchange: Boolean(item.allowsBarterExchange),
        exchangeItemName: item.allowsBarterExchange ? (item.exchangeItemName === '其他' ? item.customExchangeItem : item.exchangeItemName) : '',
        exchangeQuantity: item.allowsBarterExchange ? Number(item.exchangeQuantity) || 0 : 0
      };
      
      // 確保沒有 undefined 值
      Object.keys(processedItem).forEach(key => {
        if (processedItem[key] === undefined) {
          processedItem[key] = null; // 將 undefined 轉換為 null，Firestore 支持 null
        }
      });
      
      return processedItem;
    })
  };

      // 提交數據
      const result = await addMerchant(processedData);
      
      if (result.success) {
        localStorage.setItem('submitterPlayerId', formData.playerId);
        
        setNotificationMessage('商人資訊已成功提交！謝謝您的分享。');
        setShowNotification(true);
        
        setSubmitResult({
          success: true,
          message: '商人資訊已成功提交！謝謝您的分享。'
        });
        
        // 重置表單
        resetForm();
      } else {
        setSubmitResult({
          success: false,
          message: result.error || '提交時發生錯誤，請稍後再試。'
        });
      }
    } catch (error) {
      console.error('Error submitting merchant data:', error);
      setSubmitResult({
        success: false,
        message: '提交時發生錯誤，請稍後再試。'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // 重置表單
  const resetForm = () => {
    setFormData({
      playerId: user?.playerId || '',
      discount: '',
      items: Array(6).fill().map(() => ({
        category: '',
        customItem: '',
        quantity: '',
        purchaseTimes: '',
        price: '',
        allowsCoinExchange: true,
        allowsBarterExchange: false,
        exchangeItemName: '',
        customExchangeItem: '',
        exchangeQuantity: ''
      }))
    });
    setIsSpecialMerchant(false);
    setActiveTab(0);
    setShowOcrInterface(true);
  };

  // 處理OCR檢測到的商品資訊
  const handleOcrItemsDetected = (detectedItems) => {
    // 更新表單數據，保留現有的商品資訊，添加新檢測到的商品
    const updatedItems = [...formData.items];
    
    detectedItems.forEach((item, index) => {
      if (index < updatedItems.length) {
        updatedItems[index] = item;
      }
    });
    
    // 如果檢測到了折扣資訊
    if (detectedItems.discount) {
      setFormData(prev => ({
        ...prev,
        discount: detectedItems.discount,
        items: updatedItems
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        items: updatedItems
      }));
    }
    
    // 如果檢測到了家園幣商品，標記為特殊商人
    const hasHomeToken = updatedItems.some(item => item.category === '家園幣');
    setIsSpecialMerchant(hasHomeToken);
    
    // 隱藏OCR界面，顯示表單以便編輯
    setShowOcrInterface(false);
  };

  // 處理商品資訊變更
  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.items];
    
    if (field === 'category' && value === '家園幣') {
      // 如果是家園幣，強制使用物物交換
      updatedItems[index] = {
        ...updatedItems[index],
        [field]: value,
        allowsCoinExchange: false,
        allowsBarterExchange: true
      };
      setIsSpecialMerchant(true);
    } else {
      updatedItems[index] = {
        ...updatedItems[index],
        [field]: value
      };
      
      // 檢查是否還有家園幣商品
      const hasHomeToken = updatedItems.some(item => item.category === '家園幣');
      setIsSpecialMerchant(hasHomeToken);
    }
    
    setFormData(prev => ({
      ...prev,
      items: updatedItems
    }));
  };

  // 處理交換類型選擇
  const handleExchangeToggle = (index, exchangeType) => {
    const updatedItems = [...formData.items];
    
    if (exchangeType === 'coin') {
      updatedItems[index].allowsCoinExchange = true;
      updatedItems[index].allowsBarterExchange = false;
    } else {
      updatedItems[index].allowsCoinExchange = false;
      updatedItems[index].allowsBarterExchange = true;
    }
    
    setFormData(prev => ({
      ...prev,
      items: updatedItems
    }));
  };

  // 渲染標籤頁
  const renderTabs = () => {
    return (
      <div className="form-tabs">
        {formData.items.map((_, index) => (
          <button
            key={index}
            type="button"
            className={`form-tab ${activeTab === index ? 'active' : ''}`}
            onClick={() => setActiveTab(index)}
          >
            {formData.items[index].category ? formData.items[index].category : `商品 ${index + 1}`}
          </button>
        ))}
      </div>
    );
  };

  // 渲染當前標籤頁內容
  const renderActiveTabContent = () => {
    const item = formData.items[activeTab];
    
    return (
      <div className="item-entry-container">
        <div className="item-section">
          <div className="item-entry">
            <div className="form-group required-field">
              <label htmlFor={`category-${activeTab}`} className="required">物品名稱</label>
              <SearchableSelect
                groups={categoryGroups}
                value={item.category}
                onChange={(value) => handleItemChange(activeTab, 'category', value)}
                placeholder="請選擇物品"
                id={`category-${activeTab}`}
                name="category"
                required={true}
                showIcons={true}
                iconPath="/icons/"
              />
            </div>

            {item.category === '其他' && (
              <div className="form-group required-field">
                <label htmlFor={`customItem-${activeTab}`} className="required">自定義物品名稱</label>
                <input
                  type="text"
                  id={`customItem-${activeTab}`}
                  value={item.customItem}
                  onChange={(e) => handleItemChange(activeTab, 'customItem', e.target.value)}
                  placeholder="請輸入物品名稱"
                  required={item.category === '其他'}
                />
              </div>
            )}

            <div className="form-group required-field">
              <label htmlFor={`quantity-${activeTab}`} className="required">物品數量</label>
              <input
                type="number"
                id={`quantity-${activeTab}`}
                value={item.quantity}
                onChange={(e) => handleItemChange(activeTab, 'quantity', e.target.value)}
                placeholder="請輸入物品數量"
                required
              />
            </div>

            <div className="form-group required-field">
              <label htmlFor={`purchaseTimes-${activeTab}`} className="required">可購入次數</label>
              <input
                type="number"
                id={`purchaseTimes-${activeTab}`}
                value={item.purchaseTimes}
                onChange={(e) => handleItemChange(activeTab, 'purchaseTimes', e.target.value)}
                placeholder="請輸入可購入次數"
                required
              />
            </div>
          </div>
        </div>

        <div className="exchange-section">
          <div className="exchange-options">
            <label className="exchange-option">
              <input
                type="radio"
                checked={item.allowsCoinExchange}
                onChange={() => handleExchangeToggle(activeTab, 'coin')}
                disabled={item.category === '家園幣'} // 禁用家園幣的家園幣交易選項
              />
              支持家園幣交易
            </label>
            <label className="exchange-option">
              <input
                type="radio"
                checked={item.allowsBarterExchange}
                onChange={() => handleExchangeToggle(activeTab, 'barter')}
              />
              支持以物易物
              {item.category === '家園幣' && <span className="required-tag">必選</span>}
            </label>
          </div>

          {item.allowsCoinExchange && (
            <div className="exchange-fields">
              <div className="form-group required-field">
                <label htmlFor={`price-${activeTab}`} className="required">單價 (家園幣)</label>
                <input
                  type="number"
                  id={`price-${activeTab}`}
                  value={item.price}
                  onChange={(e) => handleItemChange(activeTab, 'price', e.target.value)}
                  required={item.allowsCoinExchange}
                  min="1"
                  placeholder="請輸入單價"
                />
              </div>
            </div>
          )}

          {item.allowsBarterExchange && (
            <div className="exchange-fields">
              <div className="form-group required-field">
                <label htmlFor={`exchange-item-${activeTab}`} className="required">交換物品名稱</label>
                <SearchableSelect
                  groups={exchangeCategoryGroups}
                  value={item.exchangeItemName}
                  onChange={(value) => handleItemChange(activeTab, 'exchangeItemName', value)}
                  placeholder="請選擇交換物品"
                  id={`exchange-item-${activeTab}`}
                  name="exchangeItemName"
                  required={item.allowsBarterExchange}
                  showIcons={true}
                  iconPath="/icons/"
                />
              </div>

              {item.exchangeItemName === '其他' && (
                <div className="form-group required-field">
                  <label htmlFor={`customExchangeItem-${activeTab}`} className="required">自定義交換物品名稱</label>
                  <input
                    type="text"
                    id={`customExchangeItem-${activeTab}`}
                    value={item.customExchangeItem || ''}
                    onChange={(e) => handleItemChange(activeTab, 'customExchangeItem', e.target.value)}
                    placeholder="請輸入交換物品名稱"
                    required={item.exchangeItemName === '其他'}
                  />
                </div>
              )}

              <div className="form-group required-field">
                <label htmlFor={`exchange-quantity-${activeTab}`} className="required">交換數量</label>
                <input
                  type="number"
                  id={`exchange-quantity-${activeTab}`}
                  value={item.exchangeQuantity}
                  onChange={(e) => handleItemChange(activeTab, 'exchangeQuantity', e.target.value)}
                  min="1"
                  placeholder="請輸入交換數量"
                  required={item.allowsBarterExchange}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="merchant-form-container">
      {submitResult && (
        <div className={`submit-result ${submitResult.success ? 'success' : 'error'}`}>
          {submitResult.message}
        </div>
      )}
      
      {showOcrInterface ? (
        <>
          <div className="ocr-section">
            <h3>拍照或上傳截圖</h3>
            <p className="ocr-description">
              上傳遊戲商人截圖，自動識別商品資訊，省去手動輸入的麻煩
            </p>
            
            <ImageOCRMerchantInput onItemsDetected={handleOcrItemsDetected} />
            
            <div className="ocr-skip-container">
              <button 
                type="button" 
                className="ocr-skip-btn"
                onClick={() => setShowOcrInterface(false)}
              >
                跳過，手動錄入商品 <i className="fas fa-arrow-right"></i>
              </button>
            </div>
          </div>
        </>
      ) : (
        <form onSubmit={handleSubmit} className="merchant-form">
          <div className="form-header">
            <h3>商人資訊錄入</h3>
            <button 
              type="button" 
              className="back-to-ocr-btn"
              onClick={() => setShowOcrInterface(true)}
            >
              <i className="fas fa-camera"></i> 返回拍照識別
            </button>
          </div>
        
          <div className="form-group">
            <label htmlFor="playerId" className="required">您的遊戲名稱</label>
            <input
              type="text"
              id="playerId"
              name="playerId"
              value={formData.playerId}
              disabled
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="discount">今日折扣</label>
            <input
              type="text"
              id="discount"
              name="discount"
              value={formData.discount}
              onChange={(e) => setFormData(prev => ({ ...prev, discount: e.target.value }))}
              placeholder="例如: -5% 或 特殊折扣活動"
            />
          </div>
          
          <h3>商人販售的商品</h3>
          
          {/* 標籤欄 */}
          {renderTabs()}
          
          {/* 當前標籤內容 */}
          {renderActiveTabContent()}
          
          <button
            type="submit"
            className="submit-btn"
            disabled={submitting || formData.items.every(item => !item.category)}
          >
            {submitting ? '提交中...' : '提交商人資訊'}
          </button>
        </form>
      )}
      
      {/* 成功通知 */}
      {showNotification && (
        <SuccessNotification
          message={notificationMessage}
          duration={3000}
          onClose={() => {
            setShowNotification(false);
            setTimeout(() => setNotificationMessage(''), 300);
          }}
        />
      )}
    </div>
  );
};

export default OcrMerchantForm;