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
      // For barter exchanges
      exchangeItemName: '',
      exchangeQuantity: '1'
    }]
  });
  
  // 整理好的關鍵程式碼修改

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
  
  // 扁平化所有物品以供下拉選單使用
  const itemCategories = categoryGroups.flatMap(group => group.items);
  
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);
  const [exchangeType, setExchangeType] = useState('coin'); // 'coin' or 'barter'

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
      items: [...prev.items, { 
        category: '其他', 
        customItem: '',
        quantity: '1', 
        price: '', 
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
      exchangeType,
      items: formData.items.map(item => ({
        ...item,
        price: exchangeType === 'coin' ? Number(item.price) : item.price,
        quantity: Number(item.quantity),
        itemName: item.category // 這是您需要修改的地方
      }))
    };
  
    try {
      const result = await addRegularMerchant(processedData);
      // 處理提交結果...
    } catch (error) {
      // 處理錯誤...
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
      
      <style jsx>{`
        .item-entry-container {
          margin-bottom: 1.5rem;
          position: relative;
          border: 1px solid #eaeaea;
          border-radius: 8px;
          padding: 1rem;
          background-color: #f9fafb;
        }
        
        .item-entry {
          display: grid;
          grid-template-columns: ${exchangeType === 'coin' ? '3fr 1fr 1fr' : '1fr 1fr'};
          gap: 1rem;
          align-items: flex-start;
          margin-bottom: ${exchangeType === 'barter' ? '1rem' : '0'};
        }
        
        .barter-item-entry {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          padding: 1rem;
          background-color: #f0f8ff;
          border-radius: 4px;
          align-items: flex-start;
          border-top: 1px dashed #d1e8ff;
        }
        
        .exchange-type-selector {
          display: flex;
          gap: 2rem;
          margin-top: 0.5rem;
        }
        
        .radio-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
        }
        
        .remove-item-btn {
          position: absolute;
          top: 1rem;
          right: 1rem;
        }
      `}</style>
      
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
        
        <div className="form-group">
          <label>交易方式</label>
          <div className="exchange-type-selector">
            <label className="radio-label">
              <input
                type="radio"
                name="exchangeType"
                value="coin"
                checked={exchangeType === 'coin'}
                onChange={() => setExchangeType('coin')}
              />
              銀幣交易
            </label>
            <label className="radio-label">
              <input
                type="radio"
                name="exchangeType"
                value="barter"
                checked={exchangeType === 'barter'}
                onChange={() => setExchangeType('barter')}
              />
              以物易物
            </label>
          </div>
        </div>
        
        <h3>{exchangeType === 'coin' ? '商人出售的商品' : '商人交易的商品'}</h3>
        <p className="description">
          {exchangeType === 'coin' 
            ? '請填寫商人販售的商品及價格' 
            : '請填寫商人提供的商品以及需要交換的物品'}
        </p>
        
        {formData.items.map((item, index) => (
          <div key={index} className="item-entry-container">
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
              
              {exchangeType === 'coin' ? (
                <div className="form-group">
                  <label htmlFor={`price-${index}`}>價格 (家園幣)</label>
                  <input
                    type="number"
                    id={`price-${index}`}
                    name="price"
                    value={item.price}
                    onChange={(e) => handleItemChange(index, e)}
                    required={exchangeType === 'coin'}
                  />
                </div>
              ) : (
                <div className="barter-item-entry">
                  <div className="form-group">
                    <label htmlFor={`exchange-item-${index}`}>交換物品</label>
                    <select
                      id={`exchange-item-${index}`}
                      name="exchangeItemName"
                      value={item.exchangeItemName}
                      onChange={(e) => handleItemChange(index, e)}
                      required={exchangeType === 'barter'}
                    >
                      <option value="" disabled>請選擇交換物品</option>
                      {exchangeCategoryGroups.map((group) => (
                        <optgroup key={group.name} label={group.name}>
                          {group.items.map((item) => (
                            <option key={item} value={item}>
                              {item}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor={`exchange-quantity-${index}`}>交換數量</label>
                    <input
                      type="number"
                      id={`exchange-quantity-${index}`}
                      name="exchangeQuantity"
                      value={item.exchangeQuantity}
                      onChange={(e) => handleItemChange(index, e)}
                      min="1"
                      required={exchangeType === 'barter'}
                    />
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
          disabled={submitting}
        >
          {submitting ? '提交中...' : '提交商人資訊'}
        </button>
      </form>
    </div>
  );
}

export default MerchantInputForm;