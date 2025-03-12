import React, { useState } from 'react';
import { addRegularMerchant } from '../../firebase/firestore';

function MerchantInputForm() {
  const [formData, setFormData] = useState({
    playerId: '',
    serverName: '',
    guildName: '',
    discount: '',
    items: [{ 
      category: '其他', 
      customItem: '', 
      quantity: '1', 
      price: '', 
      allowsCoinExchange: true,
      allowsBarterExchange: false,
      exchangeItemName: '',
      customExchangeItem: '',
      exchangeQuantity: '1'
    }]
  });
  
  // 定義分類和物品
  // 物品名稱與交換物品將分別使用這些分類數據
  const categoryGroups = [
    {
      name: '食品原料',
      items: [
        '小麥',
        '玉米',
        '胡蘿蔔',
        '番茄',
        '甘蔗',
        '草莓',
        '雞蛋',
        '牛奶',
        '蜂蜜'
      ]
    },
    // Other category groups remain the same...
    {
      name: '其他',
      items: [
        '其他'
      ]
    }
  ];
  
  // 定義交換物品分類（不包含裝飾類別）
  const exchangeCategoryGroups = [
    {
      name: '食品原料',
      items: [
        '小麥',
        '玉米',
        '胡蘿蔔',
        '番茄',
        '甘蔗',
        '草莓',
        '雞蛋',
        '牛奶',
        '蜂蜜'
      ]
    },
    // Other exchange category groups remain the same...
    {
      name: '其他',
      items: [
        '其他'
      ]
    }
  ];
  
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleExchangeToggle = (index, exchangeType, isChecked) => {
    const updatedItems = [...formData.items];
    
    // 如果選取新的交易方式，取消另一種交易方式
    if (isChecked) {
      if (exchangeType === 'coin') {
        updatedItems[index].allowsCoinExchange = true;
        updatedItems[index].allowsBarterExchange = false;
      } else if (exchangeType === 'barter') {
        updatedItems[index].allowsBarterExchange = true;
        updatedItems[index].allowsCoinExchange = false;
      }
    } else {
      // 取消勾選時，直接設為 false
      if (exchangeType === 'coin') {
        updatedItems[index].allowsCoinExchange = false;
      } else if (exchangeType === 'barter') {
        updatedItems[index].allowsBarterExchange = false;
      }
    }
    
    setFormData(prev => ({
      ...prev,
      items: updatedItems
    }));
  };

  const handleItemChange = (index, e) => {
    const { name, value } = e.target;
    const updatedItems = [...formData.items];
    updatedItems[index] = {
      ...updatedItems[index],
      [name]: value
    };
    
    setFormData(prev => ({
      ...prev,
      items: updatedItems
    }));
  };
  
  const handleDiscountChange = (e) => {
    const { value } = e.target;
    setFormData(prev => ({
      ...prev,
      discount: value
    }));
  };

  const addItemField = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { 
        category: '其他', 
        customItem: '',
        quantity: '1', 
        price: '', 
        allowsCoinExchange: true,
        allowsBarterExchange: false,
        exchangeItemName: '',
        exchangeQuantity: '1'
      }]
    }));
  };

  const removeItemField = (index) => {
    if (formData.items.length === 1) return;
    
    const updatedItems = formData.items.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      items: updatedItems
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitResult(null);
  
    // 處理數據
    const processedData = {
      ...formData,
      items: formData.items.map(item => ({
        ...item,
        price: Number(item.price),
        quantity: Number(item.quantity),
        exchangeQuantity: Number(item.exchangeQuantity),
        itemName: item.category === '其他' ? item.customItem : item.category,
        exchangeItemName: item.exchangeItemName === '其他' ? item.customExchangeItem : item.exchangeItemName
      }))
    };
  
    try {
      const result = await addRegularMerchant(processedData);
      if (result.success) {
        setSubmitResult({ 
          success: true, 
          message: '商人資訊已成功提交！謝謝您的分享。' 
        });
        
        // Reset form
        setFormData({
          playerId: '',
          serverName: '',
          guildName: '',
          discount: '',
          items: [{ 
            category: '其他', 
            customItem: '',
            quantity: '1', 
            price: '', 
            allowsCoinExchange: true,
            allowsBarterExchange: false,
            exchangeItemName: '',
            customExchangeItem: '',
            exchangeQuantity: '1'
          }]
        });
      } else {
        setSubmitResult({ 
          success: false, 
          message: '提交時發生錯誤，請稍後再試。' 
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

  return (
    <div className="merchant-form-container">
      {submitResult && (
        <div className={`submit-result ${submitResult.success ? 'success' : 'error'}`}>
          {submitResult.message}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="merchant-form">
        <div className="form-group">
          <label htmlFor="playerId">您的遊戲ID</label>
          <input
            type="text"
            id="playerId"
            name="playerId"
            value={formData.playerId}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="serverName">伺服器名稱</label>
          <input
            type="text"
            id="serverName"
            name="serverName"
            value={formData.serverName}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="guildName">公會名稱</label>
          <input
            type="text"
            id="guildName"
            name="guildName"
            value={formData.guildName}
            onChange={handleChange}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="discount">今日折扣</label>
          <input
            type="text"
            id="discount"
            name="discount"
            value={formData.discount}
            onChange={handleDiscountChange}
            placeholder="例如: 20% 或 特殊折扣活動"
          />
          <small>商人提供的折扣或特殊活動</small>
        </div>
        
        <h3>商人販售的商品</h3>
        <p className="description">
          請填寫商人販售的商品及交易方式（選擇家園幣或以物易物其中一種）
        </p>
        
        {formData.items.map((item, index) => (
          <div key={index} className="item-entry-container">
            <div className="item-section">
              <h4 className="item-section-title">物品資訊</h4>
              <div className="item-entry">
                <div className="form-group">
                  <label htmlFor={`category-${index}`}>物品名稱</label>
                  <select
                    id={`category-${index}`}
                    name="category"
                    value={item.category}
                    onChange={(e) => handleItemChange(index, e)}
                    required
                  >
                    <option value="" disabled>請選擇物品</option>
                    {categoryGroups.map((group) => (
                      <optgroup key={group.name} label={group.name}>
                        {group.items.map((categoryItem) => (
                          <option key={categoryItem} value={categoryItem}>
                            {categoryItem}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                {/* 當選擇「其他」時顯示自定義輸入框 */}
                {item.category === '其他' && (
                  <div className="form-group">
                    <label htmlFor={`customItem-${index}`}>自定義物品名稱</label>
                    <input
                      type="text"
                      id={`customItem-${index}`}
                      name="customItem"
                      value={item.customItem}
                      onChange={(e) => handleItemChange(index, e)}
                      placeholder="請輸入物品名稱"
                      required={item.category === '其他'}
                    />
                  </div>
                )}
              
                <div className="form-group form-group-spacing">
                  <label htmlFor={`quantity-${index}`}>數量</label>
                  <input
                    type="number"
                    id={`quantity-${index}`}
                    name="quantity"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, e)}
                    min="1"
                    placeholder="1"
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
                    name={`exchangeType-${index}`}
                    checked={item.allowsCoinExchange}
                    onChange={(e) => handleExchangeToggle(index, 'coin', e.target.checked)}
                  />
                  支持家園幣交易
                </label>
                <label className="exchange-option exchange-option-spacing">
                  <input
                    type="radio"
                    name={`exchangeType-${index}`}
                    checked={item.allowsBarterExchange}
                    onChange={(e) => handleExchangeToggle(index, 'barter', e.target.checked)}
                  />
                  支持以物易物
                </label>
              </div>
            
              {/* 至少需要選擇一種交換方式的錯誤提示 */}
              {!item.allowsCoinExchange && !item.allowsBarterExchange && (
                <div className="error-message">
                  請選擇一種交易方式（家園幣或物品）
                </div>
              )}
              
              {/* 家園幣價格輸入 (當啟用家園幣交易時顯示) */}
              {item.allowsCoinExchange && (
                <div className="exchange-fields">
                  <div className="form-group">
                    <label htmlFor={`price-${index}`}>價格 (家園幣)</label>
                    <input
                      type="number"
                      id={`price-${index}`}
                      name="price"
                      value={item.price}
                      onChange={(e) => handleItemChange(index, e)}
                      required={item.allowsCoinExchange}
                      min="1"
                      placeholder=""
                    />
                  </div>
                </div>
              )}
              
              {/* 物品交換輸入 (當啟用以物易物時顯示) */}
              {item.allowsBarterExchange && (
                <div className="exchange-fields">
                  <div className="barter-item-entry">
                    <div className="form-group">
                      <label htmlFor={`exchange-item-${index}`}>交換物品名稱</label>
                      <select
                        id={`exchange-item-${index}`}
                        name="exchangeItemName"
                        value={item.exchangeItemName}
                        onChange={(e) => handleItemChange(index, e)}
                        required={item.allowsBarterExchange}
                      >
                        <option value="" disabled>請選擇交換物品</option>
                        {exchangeCategoryGroups.map((group) => (
                          <optgroup key={group.name} label={group.name}>
                            {group.items.map((exchangeItem) => (
                              <option key={exchangeItem} value={exchangeItem}>
                                {exchangeItem}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                    </div>
                    
                    {/* 當選擇「其他」作為交換物品時顯示自定義輸入框 */}
                    {item.exchangeItemName === '其他' && (
                      <div className="form-group">
                        <label htmlFor={`customExchangeItem-${index}`}>自定義交換物品名稱</label>
                        <input
                          type="text"
                          id={`customExchangeItem-${index}`}
                          name="customExchangeItem"
                          value={item.customExchangeItem || ''}
                          onChange={(e) => handleItemChange(index, e)}
                          placeholder="請輸入交換物品名稱"
                          required={item.exchangeItemName === '其他'}
                        />
                      </div>
                    )}
                    
                    <div className="form-group">
                      <label htmlFor={`exchange-quantity-${index}`}>交換數量</label>
                      <input
                        type="number"
                        id={`exchange-quantity-${index}`}
                        name="exchangeQuantity"
                        value={item.exchangeQuantity}
                        onChange={(e) => handleItemChange(index, e)}
                        min="1"
                        placeholder="1"
                        required={item.allowsBarterExchange}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <button 
              type="button" 
              className="remove-item-btn"
              onClick={() => removeItemField(index)}
              disabled={formData.items.length === 1}
            >
              移除
            </button>
          </div>
        ))}
        
        <button 
          type="button" 
          className="add-item-btn"
          onClick={addItemField}
        >
          添加更多商品
        </button>
        
        <button 
          type="submit" 
          className="submit-btn" 
          disabled={submitting || formData.items.some(item => 
            (!item.allowsCoinExchange && !item.allowsBarterExchange) || 
            (item.allowsCoinExchange && item.price === '') ||
            (item.allowsBarterExchange && item.exchangeItemName === '')
          )}
        >
          {submitting ? '提交中...' : '提交商人資訊'}
        </button>
      </form>
    </div>
  );
}

export default MerchantInputForm;