// src/components/merchants/MerchantEditForm.js
import React, { useState, useEffect } from 'react';
import { updateMerchant } from '../../firebase/firestore';
import SearchableSelect from '../common/SearchableSelect';
import SuccessNotification from '../common/SuccessNotification';

function MerchantEditForm({ merchant, merchantId, onUpdateSuccess }) {
    const [formData, setFormData] = useState({
        playerId: '',
        discount: '',
        items: []
    });

    const [originalItems, setOriginalItems] = useState([]);
    const [isSpecialMerchant, setIsSpecialMerchant] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [submitResult, setSubmitResult] = useState(null);
    const [activeItemIndex, setActiveItemIndex] = useState(0);
    const [showNotification, setShowNotification] = useState(false);
    const [notificationMessage, setNotificationMessage] = useState('');

    // Initialize form with merchant data
    useEffect(() => {
        if (merchant) {
            // Format items with proper structure for the form
            const formattedItems = merchant.items.map(item => ({
                category: item.itemName,
                customItem: item.itemName && !categoryGroups.flat().includes(item.itemName) ? item.itemName : '',
                quantity: item.quantity || 1,
                purchaseTimes: item.purchaseTimes || 1,
                price: item.price || '',
                allowsCoinExchange: item.allowsCoinExchange !== undefined ? item.allowsCoinExchange : true,
                allowsBarterExchange: item.allowsBarterExchange || false,
                exchangeItemName: item.exchangeItemName || '',
                customExchangeItem: item.exchangeItemName && !exchangeCategoryGroups.flat().includes(item.exchangeItemName) ? item.exchangeItemName : '',
                exchangeQuantity: item.exchangeQuantity || ''
            }));

            setFormData({
                playerId: merchant.playerId || '',
                discount: merchant.discount || '',
                items: formattedItems
            });

            // Store original items for comparison
            setOriginalItems(merchant.items);

            // Check if this is a special merchant (contains 家園幣 items)
            const hasHomeToken = merchant.items.some(item => item.itemName === '家園幣');
            setIsSpecialMerchant(hasHomeToken || merchant.isSpecialMerchant);
        }
    }, [merchant]);

    // Handle scroll indicator for mobile
    useEffect(() => {
        const handleItemScroll = () => {
            const container = document.querySelector('.items-container');
            if (!container) return;

            // Determine which item is most visible
            const items = Array.from(container.querySelectorAll('.item-entry-container'));
            const containerLeft = container.scrollLeft;
            const containerWidth = container.clientWidth;

            // Find the item that is most in view
            let mostVisibleIndex = 0;
            let highestVisibility = 0;

            items.forEach((item, index) => {
                const itemLeft = item.offsetLeft;
                const itemWidth = item.clientWidth;

                // Calculate how much of the item is visible (0 to 1)
                const visibleLeft = Math.max(itemLeft, containerLeft);
                const visibleRight = Math.min(itemLeft + itemWidth, containerLeft + containerWidth);
                const visibleWidth = Math.max(0, visibleRight - visibleLeft);
                const visibilityRatio = visibleWidth / itemWidth;

                if (visibilityRatio > highestVisibility) {
                    highestVisibility = visibilityRatio;
                    mostVisibleIndex = index;
                }
            });

            setActiveItemIndex(mostVisibleIndex);
        };

        const container = document.querySelector('.items-container');
        if (container) {
            container.addEventListener('scroll', handleItemScroll);
            // Initialize correctly
            handleItemScroll();

            return () => {
                container.removeEventListener('scroll', handleItemScroll);
            };
        }
    }, [formData.items.length]);

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
            name: '礦產',
            items: [
                '燃火黏土', '幽藍黏土', '耐火黏土', '赤晶石', '赤鐵礦', '蒼天石', '夜鐵礦'
            ]
        },
        {
            name: '果品',
            items: [
                '黃金汁液', '緋紅汁液', '濃綢汁液', '百里香', '阿奇米果', '高嶺樹果', '飛雲菇'
            ]
        },
        {
            name: '海產',
            items: [
                '智慧香精', '暗紫香精', '海結晶', '胸棘鯛魚', '利齒蛤蜊', '魔龍鱒', '丁香龍蝦'
            ]
        },
        {
            name: '樹脂',
            items: [
                '赤紅樹脂', '黏性樹脂'
            ]
        },
        {
            name: '家園五商內容物',
            items: [
                '諾恩女神像', '塔樓風車', '貼紙'
            ]
        },
        {
            name: '底板',
            items: [
                '戲劇舞臺', '藍藍天空'
            ]
        },
        {
            name: '邊框',
            items: [
                '木質相框', '奇妙思想'
            ]
        },
        {
            name: '田園系列',
            items: [
                '田園圓桌', '田園竹椅', '田園陽傘'
            ]
        },
        {
            name: '貴族系列',
            items: [
                '貴族圓桌', '貴族椅子', '貴族陽傘'
            ]
        },
        {
            name: '水果凳',
            items: [
                '小小檸檬凳', '小小奇異果凳', '小小西瓜凳', '小小香橙凳'
            ]
        },
        {
            name: '湛藍系列',
            items: [
                '湛藍方門', '湛藍薰衣草花圃', '湛藍花壇', '湛藍盆栽'
            ]
        },
        {
            name: '嫣紅系列',
            items: [
                '嫣紅拱門', '嫣紅鬱金香花圃', '嫣紅花壇', '嫣紅盆栽', '紫紅薰衣草花圃'
            ]
        },
        {
            name: '明黃系列',
            items: [
                '明黃木門', '明黃鬱金香花圃', '明黃花壇', '明黃盆栽'
            ]
        },
        {
            name: '圍欄',
            items: [
                '白蠟木庭院圍欄', '紅橡木庭院圍欄', '淺灰尖頭圍欄', '淺藍尖頭圍欄', '淺色原木圍欄', '深色原木圍欄'
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
            name: '礦產',
            items: [
                '燃火黏土', '幽藍黏土', '耐火黏土', '赤晶石', '赤鐵礦', '蒼天石', '夜鐵礦'
            ]
        },
        {
            name: '果品',
            items: [
                '黃金汁液', '緋紅汁液', '濃綢汁液', '百里香', '阿奇米果', '高嶺樹果', '飛雲菇'
            ]
        },
        {
            name: '海產',
            items: [
                '智慧香精', '暗紫香精', '海結晶', '胸棘鯛魚', '利齒蛤蜊', '魔龍鱒', '丁香龍蝦'
            ]
        },
        {
            name: '樹脂',
            items: [
                '赤紅樹脂', '黏性樹脂'
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
                purchaseTimes: '',
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

    const scrollToItem = (index) => {
        const container = document.querySelector('.items-container');
        const item = container.querySelectorAll('.item-entry-container')[index];

        if (container && item) {
            container.scrollTo({
                left: item.offsetLeft,
                behavior: 'smooth'
            });

            setActiveItemIndex(index);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setSubmitResult(null);

        // Process the form data for submission
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
            // Call the updateMerchant function
            const result = await updateMerchant(merchantId, processedData);

            if (result.success) {
                setSubmitResult({
                    success: true,
                    message: '商人資訊已成功更新！'
                });

                setNotificationMessage('商人資訊已成功更新！');
                setShowNotification(true);

                // Call the onUpdateSuccess callback
                if (onUpdateSuccess) {
                    onUpdateSuccess('商人資訊已成功更新！');
                }
            } else {
                setSubmitResult({
                    success: false,
                    message: result.error || '更新時發生錯誤，請稍後再試。'
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

    return (
        <div className="merchant-form-container">
            {submitResult && (
                <div className={`submit-result ${submitResult.success ? 'success' : 'error'}`}>
                    {submitResult.message}
                </div>
            )}

            <form onSubmit={handleSubmit} className="merchant-form">
                <div className="form-group">
                    <label htmlFor="playerId">您的遊戲名稱</label>
                    <input
                        type="text"
                        id="playerId"
                        name="playerId"
                        value={formData.playerId}
                        disabled
                    />
                    <small>遊戲名稱無法修改</small>
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
                </div>

                <h3>商人販售的商品</h3>

                <div className="items-container">
                    {formData.items.map((item, index) => (
                        <div key={index} className="item-entry-container">
                            <div className="item-section">
                                <h4 className="item-section-title">物品資訊 {index + 1}</h4>
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
                                            showIcons={true}
                                            iconPath="/icons/"
                                        />
                                    </div>

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
                                            disabled={item.category === '家園幣'}
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

                                {!item.allowsCoinExchange && !item.allowsBarterExchange && (
                                    <div className="error-message">
                                        請選擇一種交易方式（家園幣或物品）
                                    </div>
                                )}

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
                                        </div>
                                    </div>
                                )}

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
                                                    showIcons={true}
                                                    iconPath="/icons/"
                                                />
                                            </div>

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
                </div>

                {/* Add scroll indicator dots for mobile */}
                <div className="scroll-indicator">
                    {formData.items.map((_, index) => (
                        <div
                            key={index}
                            className={`scroll-dot ${index === activeItemIndex ? 'active' : ''}`}
                            onClick={() => scrollToItem(index)}
                        ></div>
                    ))}
                </div>

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
                        className="edit-cancel-btn" // Changed from cancel-btn to edit-cancel-btn
                        onClick={() => window.history.back()}
                    >
                        取消
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
                        setTimeout(() => setNotificationMessage(''), 300);
                    }}
                />
            )}
        </div>
    );
}

export default MerchantEditForm;