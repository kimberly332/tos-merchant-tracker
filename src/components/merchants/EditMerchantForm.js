import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMerchantById, updateMerchant } from '../../firebase/firestore';

function EditMerchantForm() {
  const { merchantId } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [unauthorized, setUnauthorized] = useState(false);
  const [originalData, setOriginalData] = useState(null);
  
  const [formData, setFormData] = useState({
    playerId: '',
    discount: '',
    items: []
  });
  
  const [isSpecialMerchant, setIsSpecialMerchant] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);
  
  // 定義分類和物品
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
    {
      name: '調味品',
      items: [
        '鮮奶油',
        '奶油',
        '起司',
        '砂糖',
        '方糖',
        '糖漿',
        '番茄醬',
        '披薩醬',
        '草莓醬',
        '魚露'
      ]
    },
    {
      name: '飲料',
      items: [
        '胡蘿蔔汁',
        '番茄汁',
        '草莓鮮奶汁',
        '混合果汁'
      ]
    },
    {
      name: '烘焙食品',
      items: [
        '小麵包',
        '玉米麵包',
        '曲奇餅'
      ]
    },
    {
      name: '甜點',
      items: [
        '鮮奶油霜淇淋',
        '玉米霜淇淋',
        '草莓霜淇淋',
        '奶油霜淇淋',
        '鮮奶油蛋糕',
        '起司蛋糕',
        '胡蘿蔔蛋糕',
        '蜂蜜蛋糕',
        '草莓蛋糕'
      ]
    },
    {
      name: '熟食',
      items: [
        '田園披薩',
        '起司披薩',
        '水果披薩'
      ]
    },
    {
      name: '裝飾 - 花園',
      items: [
        '湛藍花圃',
        '湛藍花壇',
        '湛藍盆栽',
        '明黃花圃',
        '明黃花壇',
        '明黃盆栽',
        '嫣紅花圃',
        '嫣紅花壇',
        '嫣紅盆栽',
        '紫紅花圃'
      ]
    },
    {
      name: '裝飾 - 建築',
      items: [
        '湛藍方門',
        '明黃木門',
        '嫣紅拱門'
      ]
    },
    {
      name: '裝飾 - 休憩',
      items: [
        '奇異果凳',
        '檸檬凳',
        '西瓜凳',
        '香橙凳'
      ]
    },
    {
      name: '裝飾 - 圍欄',
      items: [
        '淺原木圍欄',
        '深原木圍欄',
        '白蠟木圍欄',
        '紅橡木圍欄',
        '淺灰尖頭圍欄',
        '淺藍尖頭圍欄'
      ]
    },
    {
      name: '裝飾 - 主題',
      items: [
        '女神',
        '風車',
        '貼紙',
        '戲劇舞台',
        '藍藍天空',
        '木質邊框',
        '奇思妙想',
        '貴族',
        '田園'
      ]
    },
    {
      name: '家園幣',
      items: [
        '家園幣',
      ]
    },
    {
      name: '其他',
      items: [
        '其他'
      ]
    }
  ];
  
  // 定義交換物品分類
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
    {
      name: '調味品',
      items: [
        '鮮奶油',
        '奶油',
        '起司',
        '砂糖',
        '方糖',
        '糖漿',
        '番茄醬',
        '披薩醬',
        '草莓醬',
        '魚露'
      ]
    },
    {
      name: '飲料',
      items: [
        '胡蘿蔔汁',
        '番茄汁',
        '草莓鮮奶汁',
        '混合果汁'
      ]
    },
    {
      name: '烘焙食品',
      items: [
        '小麵包',
        '玉米麵包',
        '曲奇餅'
      ]
    },
    {
      name: '甜點',
      items: [
        '鮮奶油霜淇淋',
        '玉米霜淇淋',
        '草莓霜淇淋',
        '奶油霜淇淋',
        '鮮奶油蛋糕',
        '起司蛋糕',
        '胡蘿蔔蛋糕',
        '蜂蜜蛋糕',
        '草莓蛋糕'
      ]
    },
    {
      name: '熟食',
      items: [
        '田園披薩',
        '起司披薩',
        '水果披薩'
      ]
    },
    {
      name: '家園幣',
      items: [
        '家園幣',
      ]
    },
    {
      name: '其他',
      items: [
        '其他'
      ]
    }
  ];
  
  // Fetch merchant data
  useEffect(() => {
    const fetchMerchant = async () => {
      setLoading(true);
      try {
        const merchantData = await getMerchantById(merchantId);
        setOriginalData(merchantData);
        
        // Check if the current user is the author
        const submitterPlayerId = localStorage.getItem('submitterPlayerId');
        if (!submitterPlayerId || submitterPlayerId !== merchantData.playerId) {
          setUnauthorized(true);
          return;
        }
        
        // Set form data from the merchant data
        setFormData({
          playerId: merchantData.playerId || '未知玩家',
          discount: merchantData.discount || '',
          items: merchantData.items.map(item => ({
            category: item.category || (item.itemName === '家園幣' ? '家園幣' : '其他'),
            customItem: item.category === '其他' ? item.itemName : '',
            quantity: item.quantity?.toString() || '1',
            // 添加可購買數量欄位，如果存在則使用，否則默認為物品總數量
            availableQuantity: item.availableQuantity?.toString() || item.quantity?.toString() || '1',
            price: item.price ? item.price.toString() : '',
            allowsCoinExchange: item.allowsCoinExchange || false,
            allowsBarterExchange: item.allowsBarterExchange || false,
            exchangeItemName: item.exchangeItemName || '',
            customExchangeItem: item.exchangeItemName === '其他' ? item.exchangeItemName : '',
            exchangeQuantity: item.exchangeQuantity ? item.exchangeQuantity.toString() : '1'
          }))
        });
        
        setIsSpecialMerchant(merchantData.isSpecialMerchant || false);
      } catch (err) {
        console.error('Error fetching merchant:', err);
        setError('獲取商人資訊時發生錯誤，請稍後再試。');
      } finally {
        setLoading(false);
      }
    };
    
    fetchMerchant();
  }, [merchantId]);
  
  // Form handling functions - similar to MerchantInputForm
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleExchangeToggle = (index, exchangeType, isChecked) => {
    const updatedItems = [...formData.items];
    
    if (isChecked) {
      if (exchangeType === 'coin') {
        updatedItems[index].allowsCoinExchange = true;
        updatedItems[index].allowsBarterExchange = false;
      } else if (exchangeType === 'barter') {
        updatedItems[index].allowsBarterExchange = true;
        updatedItems[index].allowsCoinExchange = false;
      }
    } else {
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
    
    // Check if current item is 家園幣
    const isHomeToken = value === '家園幣';
    if (name === 'category' && isHomeToken) {
      setIsSpecialMerchant(true);
      
      // For 家園幣, force barter exchange and disable coin exchange
      updatedItems[index].allowsCoinExchange = false;
      updatedItems[index].allowsBarterExchange = true;
    } else if (name === 'category' && !isHomeToken && updatedItems.every(item => item.category !== '家園幣')) {
      setIsSpecialMerchant(false);
    }
    
    // 確保可購買數量不超過總數量
    if (name === 'quantity') {
      const totalQuantity = Number(value);
      const availableQuantity = Number(updatedItems[index].availableQuantity);
      
      if (availableQuantity > totalQuantity) {
        updatedItems[index].availableQuantity = value;
      }
    }
    
    setFormData(prev => ({
      ...prev,
      items: updatedItems
    }));
  };
  
  const addItemField = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { 
        category: '', 
        customItem: '',
        quantity: '1',
        availableQuantity: '1', // 添加可購買數量欄位 
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
    
    // Check if any remaining items are 家園幣
    const hasHomeToken = updatedItems.some(item => item.category === '家園幣');
    setIsSpecialMerchant(hasHomeToken);
    
    setFormData(prev => ({
      ...prev,
      items: updatedItems
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitResult(null);
    
    // Process data for submission
    const processedData = {
      ...formData,
      isSpecialMerchant,
      items: formData.items.map(item => ({
        ...item,
        price: Number(item.price),
        quantity: Number(item.quantity),
        availableQuantity: Number(item.availableQuantity), // 處理可購買數量
        exchangeQuantity: Number(item.exchangeQuantity),
        itemName: item.category === '其他' ? item.customItem : item.category,
        exchangeItemName: item.exchangeItemName === '其他' ? item.customExchangeItem : item.exchangeItemName
      }))
    };
    
    try {
      // Preserve original timestamp and expiresAt
      if (originalData) {
        processedData.timestamp = originalData.timestamp;
        processedData.expiresAt = originalData.expiresAt;
      }
      
      const result = await updateMerchant(merchantId, processedData);
      
      if (result.success) {
        setSubmitResult({ 
          success: true, 
          message: '商人資訊已成功更新！' 
        });
        
        // Navigate back to the list after 2 seconds
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } else {
        setSubmitResult({ 
          success: false, 
          message: '更新時發生錯誤，請稍後再試。' 
        });
      }
    } catch (error) {
      console.error('Error updating merchant data:', error);
      setSubmitResult({ 
        success: false, 
        message: '更新時發生錯誤，請稍後再試。' 
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading) {
    return <div className="loading-indicator">載入中...</div>;
  }
  
  if (error) {
    return <div className="error-message">{error}</div>;
  }
  
  if (unauthorized) {
    return (
      <div className="unauthorized-message">
        <h2>無權限編輯</h2>
        <p>您只能編輯自己提交的商人資訊。</p>
        <button 
          className="back-btn"
          onClick={() => navigate('/')}
        >
          返回首頁
        </button>
      </div>
    );
  }
  
  return (
    <div className="merchant-form-container">
      <h2>編輯商人資訊</h2>
      <p className="edit-description">
        您正在編輯商人資訊。修改完成後點擊「更新商人資訊」按鈕保存變更。
      </p>
      
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
            disabled // Don't allow changing the player ID
          />
          <small>不可更改遊戲ID</small>
        </div>
        
        <div className="form-group">
          <label htmlFor="discount">今日折扣</label>
          <input
            type="text"
            id="discount"
            name="discount"
            value={formData.discount}
            onChange={handleChange}
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
                  <label htmlFor={`quantity-${index}`}>物品總數量</label>
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
                
                {/* 新增: 可購買數量欄位 */}
                <div className="form-group form-group-spacing">
                  <label htmlFor={`availableQuantity-${index}`}>本攤位可購入次數</label>
                  <input
                    type="number"
                    id={`availableQuantity-${index}`}
                    name="availableQuantity"
                    value={item.availableQuantity}
                    onChange={(e) => handleItemChange(index, e)}
                    min="1"
                    max={item.quantity}
                    placeholder="1"
                    required
                  />
                  {/* <small>此攤位可購買的總數量 (不可超過物品總數量)</small> */}
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
                    disabled={item.category === '家園幣'} // 禁用家園幣的家園幣交易選項
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
                  {item.category === '家園幣' && <span className="required-tag">必選</span>}
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
                    <label htmlFor={`price-${index}`}>單價 (家園幣)</label>
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
                    <small>每個物品的單價</small>
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
                      <small>交換所需的數量</small>
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
        
        <div className="form-buttons">
          <button 
            type="button" 
            className="cancel-btn"
            onClick={() => navigate('/')}
          >
            取消編輯
          </button>
          
          <button 
            type="submit" 
            className="submit-btn" 
            disabled={submitting || formData.items.some(item => 
              (!item.allowsCoinExchange && !item.allowsBarterExchange) || 
              (item.allowsCoinExchange && item.price === '') ||
              (item.allowsBarterExchange && item.exchangeItemName === '') ||
              Number(item.availableQuantity) > Number(item.quantity) || // 確保可購數量不超過總數量
              Number(item.availableQuantity) < 1 // 確保可購數量至少為1
            )}
          >
            {submitting ? '更新中...' : '更新商人資訊'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default EditMerchantForm;