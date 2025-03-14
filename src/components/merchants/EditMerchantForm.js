import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMerchantById, updateMerchant } from '../../firebase/firestore';
import { checkUserAuth } from '../../firebase/userAuth';
import SuccessNotification from '../common/SuccessNotification';

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
    items: [{
      category: '',
      customItem: '',
      quantity: '',
      purchaseTimes: '',
      price: '',
      allowsCoinExchange: true,
      allowsBarterExchange: false,
      exchangeItemName: '',
      exchangeQuantity: ''
    }]
  });

  const [isSpecialMerchant, setIsSpecialMerchant] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);

  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');

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
        '水果披薩',
        '海鮮披薩'
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
        '水果披薩',
        '海鮮披薩'
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
        const currentUser = checkUserAuth();
        if (!currentUser || currentUser.playerId !== merchantData.playerId) {
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
            // 添加可購買數量欄位，如果存在則使用，否則默認為物品數量
            purchaseTimes: item.purchaseTimes?.toString() || item.quantity?.toString() || '1',
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
        purchaseTimes: '1', // 添加可購買數量欄位 
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

  // 在EditMerchantForm.js中更新handleSubmit函數
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitResult(null);

    // Process data for submission with default values
    const processedData = {
      ...formData,
      isSpecialMerchant,
      items: formData.items.map(item => {
        // Validate required fields
        if (!item.category) {
          throw new Error('必須選擇物品類別');
        }
    
        if (item.category === '其他' && !item.customItem) {
          throw new Error('選擇「其他」類別時必須填寫自定義物品名稱');
        }
    
        if (!item.quantity || Number(item.quantity) <= 0) {
          throw new Error('物品數量必須為正數');
        }
    
        if (!item.purchaseTimes || Number(item.purchaseTimes) <= 0) {
          throw new Error('可購買次數必須為正數');
        }
    
        // Validate exchange method
        if (!item.allowsCoinExchange && !item.allowsBarterExchange) {
          throw new Error('必須選擇一種交易方式');
        }
    
        if (item.allowsCoinExchange && (!item.price || Number(item.price) <= 0)) {
          throw new Error('家園幣交易必須填寫有效單價');
        }
    
        if (item.allowsBarterExchange && !item.exchangeItemName) {
          throw new Error('以物易物必須選擇交換物品');
        }
    
        if (item.exchangeItemName === '其他' && !item.customExchangeItem) {
          throw new Error('選擇「其他」交換物品時必須填寫自定義物品名稱');
        }
    
        // Process and transform data
        return {
          ...item,
          // Use custom item name if category is '其他'
          itemName: item.category === '其他' ? item.customItem : item.category,
          
          // Convert to numbers, ensuring positive values
          price: item.allowsCoinExchange ? Number(item.price) : 0,
          quantity: Number(item.quantity),
          purchaseTimes: Number(item.purchaseTimes),
          
          // Handle exchange item name
          exchangeItemName: item.allowsBarterExchange 
            ? (item.exchangeItemName === '其他' ? item.customExchangeItem : item.exchangeItemName)
            : '',
          exchangeQuantity: item.allowsBarterExchange ? Number(item.exchangeQuantity || 1) : 0
        };
      })
    };

    try {
      // Preserve original timestamp and expiresAt
      if (originalData) {
        processedData.timestamp = originalData.timestamp;
        processedData.expiresAt = originalData.expiresAt;
      }

      const result = await updateMerchant(merchantId, processedData);

      setNotificationMessage('商人資訊已成功更新！');
      setShowNotification(true);

      if (result.success) {
        // Show the success notification
        setNotificationMessage('商人資訊已成功更新！');
        setShowNotification(true);

        setSubmitResult({
          success: true,
          message: '商人資訊已成功更新！'
        });
        
        // 更新購物車中的商品資訊
        try {
          // 從 localStorage 獲取購物車資料
          const savedCart = localStorage.getItem('shoppingCart');
          if (savedCart) {
            const cartItems = JSON.parse(savedCart);
            
            // 檢查購物車中是否有此商人的物品
            const hasUpdatedItems = cartItems.some(item => item.playerId === formData.playerId);
            
            if (hasUpdatedItems) {
              // 更新購物車中的相關物品
              const updatedCart = cartItems.map(cartItem => {
                // 如果不是當前商人的物品，保持不變
                if (cartItem.playerId !== formData.playerId) {
                  return cartItem;
                }
                
                // 尋找更新後的物品資訊
                const updatedItemInfo = processedData.items.find(
                  item => (item.category === '其他' ? item.customItem : item.category) === cartItem.itemName
                );
                
                // 如果找到更新後的物品，則更新購物車中的資料
                if (updatedItemInfo) {
                  return {
                    ...cartItem,
                    // 更新物品可用數量和交易資訊
                    purchaseTimes: updatedItemInfo.purchaseTimes,
                    price: updatedItemInfo.price,
                    allowsCoinExchange: updatedItemInfo.allowsCoinExchange,
                    allowsBarterExchange: updatedItemInfo.allowsBarterExchange,
                    exchangeItemName: updatedItemInfo.exchangeItemName,
                    exchangeQuantity: updatedItemInfo.exchangeQuantity,
                    // 確保購買數量不超過新的可用數量
                    quantity: Math.min(cartItem.quantity, updatedItemInfo.purchaseTimes)
                  };
                }
                
                return cartItem;
              });
              
              // 儲存更新後的購物車到 localStorage
              localStorage.setItem('shoppingCart', JSON.stringify(updatedCart));
              
              // 觸發購物車更新事件，通知其他組件
              const cartUpdatedEvent = new CustomEvent('cartUpdated', {
                detail: { cart: updatedCart }
              });
              window.dispatchEvent(cartUpdatedEvent);
              
              // 添加購物車更新的提示到成功訊息中
              setNotificationMessage('商人資訊和購物車內容已成功更新！');
            }
          }
        } catch (error) {
          console.error('更新購物車時發生錯誤:', error);
        }

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

                {/* 物品數量輸入欄位的更新 */}
                <div className="form-group form-group-spacing">
                  <label htmlFor={`quantity-${index}`}>物品數量</label>
                  <input
                    type="number"
                    id={`quantity-${index}`}
                    name="quantity"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, e)}
                    min="1"
                    placeholder="預設為1"
                  />
                  <small>如未填寫則預設為1</small>
                </div>

                {/* 可購買數量欄位的更新 */}
                <div className="form-group form-group-spacing">
                  <label htmlFor={`purchaseTimes-${index}`}>本攤位可購入次數</label>
                  <input
                    type="number"
                    id={`purchaseTimes-${index}`}
                    name="purchaseTimes"
                    value={item.purchaseTimes}
                    onChange={(e) => handleItemChange(index, e)}
                    min="1"
                    placeholder="預設為1"
                  />
                  <small>如未填寫則預設為1</small>
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

                    {/* 交換數量輸入欄位的更新 */}
                    <div className="form-group">
                      <label htmlFor={`exchange-quantity-${index}`}>交換數量</label>
                      <input
                        type="number"
                        id={`exchange-quantity-${index}`}
                        name="exchangeQuantity"
                        value={item.exchangeQuantity}
                        onChange={(e) => handleItemChange(index, e)}
                        min="1"
                        placeholder="預設為1"
                        required={item.allowsBarterExchange}
                      />
                      <small>如未填寫則預設為1</small>
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
              !item.quantity ||
              !item.purchaseTimes
            )}
          >
            {submitting ? '更新中...' : '更新商人資訊'}
          </button>
        </div>
      </form>
      {showNotification && (
        <SuccessNotification
          message={notificationMessage}
          duration={3000}
          onClose={() => {
            setShowNotification(false);
            // Clear the message after notification is closed
            setTimeout(() => setNotificationMessage(''), 300);
          }}
        />
      )}
    </div>
  );
}

export default EditMerchantForm;