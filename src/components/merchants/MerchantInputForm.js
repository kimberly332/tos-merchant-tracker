import React, { useState, useEffect } from 'react';
import { addMerchant } from '../../firebase/firestore';
import SuccessNotification from '../common/SuccessNotification';
import SearchableSelect from '../common/SearchableSelect';
import { checkUserAuth } from '../../firebase/userAuth';
import '../common/SearchableSelect.css';

function MerchantInputForm() {
  const [formData, setFormData] = useState({
    playerId: '',
    discount: '',
    items: [{
      category: '',
      customItem: '',
      quantity: '',  // 物品數量
      purchaseTimes: '', // 添加可購買數量欄位
      price: '',
      allowsCoinExchange: true,
      allowsBarterExchange: false,
      exchangeItemName: '',
      customExchangeItem: '',
      exchangeQuantity: ''
    }]
  });

  const [user, setUser] = useState(null);
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

  // State to track if current item is 家園幣
  const [isSpecialMerchant, setIsSpecialMerchant] = useState(false);

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

  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);

  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');

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
        category: '',
        customItem: '',
        quantity: '',
        purchaseTimes: '', // 添加可購買數量欄位
        price: '',
        allowsCoinExchange: true,
        allowsBarterExchange: false,
        exchangeItemName: '',
        exchangeQuantity: ''
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

  // 在handleSubmit函數中，修改處理數據的邏輯
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitResult(null);

    // In the submit handler, update the processing
    const processedData = {
      ...formData,
      isSpecialMerchant,
      items: formData.items.map(item => {
        if (!item.quantity || !item.purchaseTimes) {
          throw new Error('數量不能為空');
        }
        return {
          ...item,
          price: Number(item.price),
          quantity: Number(item.quantity),
          purchaseTimes: Number(item.purchaseTimes),
          exchangeQuantity: item.allowsBarterExchange ? Number(item.exchangeQuantity) : 0,
          itemName: item.category === '其他' ? item.customItem : item.category,
          exchangeItemName: item.exchangeItemName === '其他' ? item.customExchangeItem : item.exchangeItemName
        };
      })
    };

    try {
      const result = await addMerchant(processedData);
      if (result.success) {
        // Store the player ID in localStorage for later authentication
        localStorage.setItem('submitterPlayerId', formData.playerId);

        // Add these two lines here
        setNotificationMessage('商人資訊已成功提交！謝謝您的分享。');
        setShowNotification(true);

        setSubmitResult({
          success: true,
          message: '商人資訊已成功提交！謝謝您的分享。'
        });

        // Reset form
        setFormData({
          playerId: '',
          discount: '',
          items: [{
            category: '',
            customItem: '',
            quantity: '',  // 變更為空字串，讓預設機制生效
            purchaseTimes: '', // 變更為空字串，讓預設機制生效
            price: '',
            allowsCoinExchange: true,
            allowsBarterExchange: false,
            exchangeItemName: '',
            customExchangeItem: '',
            exchangeQuantity: ''  // 變更為空字串，讓預設機制生效
          }]
        });
        setIsSpecialMerchant(false);
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
            disabled
          />
          <small>遊戲ID已從登入資訊自動填入</small>
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
                  <SearchableSelect
                    groups={categoryGroups}
                    value={item.category}
                    onChange={(value) => handleItemChange(index, {
                      target: { name: 'category', value }
                    })}
                    placeholder="請選擇物品"
                    id={`category-${index}`}
                    name="category"
                    required={true}
                  />
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
                  <label htmlFor={`quantity-${index}`}>物品數量</label>
                  <input
                    type="number"
                    id={`quantity-${index}`}
                    name="quantity"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, e)}
                    required
                    placeholder="請輸入物品數量"
                  />
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
                    required
                    placeholder="請輸入可購入次數"
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
                      <SearchableSelect
                        groups={exchangeCategoryGroups}
                        value={item.exchangeItemName}
                        onChange={(value) => handleItemChange(index, {
                          target: { name: 'exchangeItemName', value }
                        })}
                        placeholder="請選擇交換物品"
                        id={`exchange-item-${index}`}
                        name="exchangeItemName"
                        required={item.allowsBarterExchange}
                      />
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
                        placeholder="請輸入交換數量"
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
            (item.allowsBarterExchange && item.exchangeItemName === '') ||
            item.category === '' ||
            item.quantity === '' ||
            item.purchaseTimes === ''
          )}
        >
          {submitting ? '提交中...' : '提交商人資訊'}
        </button>

      </form>
      {/* 成功通知 */}
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

export default MerchantInputForm;