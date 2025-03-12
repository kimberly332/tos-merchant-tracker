import React, { useState } from 'react';
import { addRegularMerchant } from '../../firebase/firestore';

function MerchantInputForm() {
  const [formData, setFormData] = useState({
    playerId: '',
    serverName: '',
    guildName: '',
    merchantName: '',
    discount: '',
    items: [{ itemName: '', price: '', quantity: '1', category: '其他' }]
  });
  
  // Available item categories
  const itemCategories = [
    '全部', // All categories
    '女神', 
    '風車', 
    '貼紙', 
    '戲劇舞台',
    '藍藍天空',
    '木質邊框',
    '奇思妙想', 
    '貴族',
    '田園',
    '嫣紅拱門',
    '嫣紅花圃',
    '嫣紅花壇',
    '嫣紅盆栽',
    '紫紅花圃',
    '湛藍方門',
    '湛藍花圃',
    '湛藍花壇',
    '湛藍盆栽',
    '明黃木門',
    '明黃花圃',
    '明黃花壇',
    '明黃盆栽',
    '奇異果凳',
    '檸檬凳',
    '西瓜凳',
    '香橙凳',
    '淺原木圍欄',
    '深原木圍欄',
    '白蠟木圍欄',
    '紅橡木圍欄',
    '淺灰尖頭圍欄',
    '淺藍尖頭圍欄',
    '家園幣 $1000', 
    '家園幣 $1200', 
    '家園幣 $1500',
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
      items: [...prev.items, { itemName: '', price: '', quantity: '1', category: '其他' }]
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

    // Convert price and quantity to numbers
    const processedData = {
      ...formData,
      items: formData.items.map(item => ({
        ...item,
        price: Number(item.price),
        quantity: Number(item.quantity)
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
          merchantName: '',
          discount: '',
          items: [{ itemName: '', price: '', quantity: '1', category: '其他' }]
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
          <label htmlFor="merchantName">商人名稱</label>
          <input
            type="text"
            id="merchantName"
            name="merchantName"
            value={formData.merchantName}
            onChange={handleChange}
            required
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
        
        <h3>商品資訊</h3>
        
        {formData.items.map((item, index) => (
          <div key={index} className="item-entry">
            <div className="form-group">
              <label htmlFor={`itemName-${index}`}>物品名稱</label>
              <input
                type="text"
                id={`itemName-${index}`}
                name="itemName"
                value={item.itemName}
                onChange={(e) => handleItemChange(index, e)}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor={`category-${index}`}>物品類別</label>
              <select
                id={`category-${index}`}
                name="category"
                value={item.category}
                onChange={(e) => handleItemChange(index, e)}
              >
                {itemCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor={`price-${index}`}>價格</label>
              <input
                type="number"
                id={`price-${index}`}
                name="price"
                value={item.price}
                onChange={(e) => handleItemChange(index, e)}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor={`quantity-${index}`}>數量</label>
              <input
                type="number"
                id={`quantity-${index}`}
                name="quantity"
                value={item.quantity}
                onChange={(e) => handleItemChange(index, e)}
                min="1"
                required
              />
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
          添加更多物品
        </button>
        
        <button 
          type="submit" 
          className="submit-btn" 
          disabled={submitting}
        >
          {submitting ? '提交中...' : '提交商人資訊'}
        </button>
      </form>
    </div>
  );
}

export default MerchantInputForm;