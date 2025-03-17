import React, { useState, useEffect } from 'react';
import { addMerchant } from '../../firebase/firestore';
import SuccessNotification from '../common/SuccessNotification';
import SearchableSelect from '../common/SearchableSelect';
import ImprovedOCRMerchantInput from './ImprovedOCRMerchantInput';
import { checkUserAuth } from '../../firebase/userAuth';
import '../common/SearchableSelect.css';

const EnhancedOcrMerchantForm = () => {
    const [activeTab, setActiveTab] = useState(0);
    const [merchantType, setmerchantType] = useState('regular'); // 'regular' or 'special'
    const [formData, setFormData] = useState({
        playerId: '',
        discount: '',
        items: Array(9).fill().map(() => ({  // Initialize with 9 items (max possible)
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
    const [firstScanComplete, setFirstScanComplete] = useState(false);

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
            name: '明黃系列',
            items: [
                '明黃木門', '明黃鬱金香花圃', '明黃花壇', '明黃盆栽'
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

    // 處理OCR檢測到的商品資訊 - 第一次截圖
    const handleFirstScanItems = (detectedItems) => {
        // 更新表單數據，保留前 6 個物品位置的數據
        const updatedItems = [...formData.items];

        detectedItems.forEach((item, index) => {
            if (index < 6) { // 只處理前6個位置
                updatedItems[index] = item;
            }
        });

        // 如果檢測到的物品數量超過 6 個，提示用戶
        if (detectedItems.length > 6 && merchantType === 'regular') {
            setNotificationMessage('檢測到超過6種商品，若為五商請選擇"五商(9種商品)"類型');
            setShowNotification(true);
        }

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

        // 檢查是否有家園幣商品，若有則標記為特殊商人
        const hasHomeToken = updatedItems.some(item => item.category === '家園幣');
        setIsSpecialMerchant(hasHomeToken);

        // 如果是五商，標記第一次掃描完成，等待第二次掃描
        if (merchantType === 'special') {
            setFirstScanComplete(true);
        } else {
            // 普通商人只需要一次掃描，直接進入表單編輯
            setShowOcrInterface(false);
        }
    };

    // 處理OCR檢測到的商品資訊 - 第二次截圖 (僅五商適用)
    const handleSecondScanItems = (detectedItems) => {
        // 合併第二次掃描的結果，從第7個位置開始
        const updatedItems = [...formData.items];

        // 確保最後三項都是家園幣
        detectedItems.forEach((item, index) => {
            if (index < 3) { // 最多只取3個，因為總共就9個位置
                // 強制設定為家園幣，但保留交換物品信息
                updatedItems[index + 6] = {
                    ...item,
                    category: '家園幣',
                    allowsCoinExchange: false,
                    allowsBarterExchange: true
                };
            }
        });

        setFormData(prev => ({
            ...prev,
            items: updatedItems
        }));

        // 特殊商人一定是五商
        setIsSpecialMerchant(true);

        // 兩次掃描都完成，進入表單編輯
        setShowOcrInterface(false);
    };

    // 確保五商最後三項都是家園幣
    const ensureSpecialMerchantFormat = (items) => {
        if (merchantType === 'special') {
            const updatedItems = [...items];

            // 確保後三項都是家園幣
            for (let i = 6; i < 9; i++) {
                if (i < updatedItems.length) {
                    updatedItems[i] = {
                        ...updatedItems[i],
                        category: '家園幣',
                        allowsCoinExchange: false,
                        allowsBarterExchange: true
                    };
                }
            }

            return updatedItems;
        }

        return items;
    };

    // 處理取消第一次掃描，直接進入第二次掃描
    const handleSkipToSecondScan = () => {
        setFirstScanComplete(true);
    };

    // 處理取消掃描，直接進入表單
    const handleSkipOcr = () => {
        setShowOcrInterface(false);
    };

    // 處理表單提交
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setSubmitResult(null);

        try {
            // 根據商人類型選擇要處理的物品數量
            const maxItems = merchantType === 'special' ? 9 : 6;

            // 確保五商的格式正確
            let processedItems = ensureSpecialMerchantFormat(formData.items);

            // 過濾有效的商品項 (有商品名稱的)
            const filledItems = processedItems.slice(0, maxItems) // 只取需要的物品數量
                .filter(item => item.category && item.quantity);

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
                isSpecialMerchant: isSpecialMerchant || merchantType === 'special',
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
            items: Array(9).fill().map(() => ({
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
        setmerchantType('regular');
        setIsSpecialMerchant(false);
        setActiveTab(0);
        setFirstScanComplete(false);
        setShowOcrInterface(true);
    };

    // 處理商人類型變更
    const handlemerchantTypeChange = (type) => {
        setmerchantType(type);

        // 如果從五商變成普通商人，重置第一次掃描完成狀態
        if (type === 'regular') {
            setFirstScanComplete(false);
        }
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
        // 根據商人類型確定要顯示的標籤數量
        const maxTabs = merchantType === 'special' ? 9 : 6;

        return (
            <div className="form-tabs">
                {formData.items.slice(0, maxTabs).map((_, index) => (
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
                    <div className="merchant-type-selector">
                        <h3>選擇商人類型</h3>
                        <div className="merchant-type-options">
                            <label className={`merchant-type-option ${merchantType === 'regular' ? 'active' : ''}`}>
                                <input
                                    type="radio"
                                    name="merchantType"
                                    value="regular"
                                    checked={merchantType === 'regular'}
                                    onChange={() => handlemerchantTypeChange('regular')}
                                />
                                普通商人 (6種商品)
                            </label>
                            <label className={`merchant-type-option ${merchantType === 'special' ? 'active' : ''}`}>
                                <input
                                    type="radio"
                                    name="merchantType"
                                    value="special"
                                    checked={merchantType === 'special'}
                                    onChange={() => handlemerchantTypeChange('special')}
                                />
                                五商 (9種商品)
                            </label>
                        </div>
                    </div>

                    {!firstScanComplete ? (
                        // 第一次掃描界面
                        <div className="ocr-section">
                            <h3>{merchantType === 'special' ? '第一次截圖 (前6種商品)' : '截圖掃描'}</h3>
                            <p className="ocr-description">
                                {merchantType === 'special'
                                    ? '請上傳第一張截圖，含前6種商品'
                                    : '上傳遊戲商人截圖，自動識別商品資訊'}
                            </p>

                            <ImprovedOCRMerchantInput onItemsDetected={handleFirstScanItems} scanIndex={1} merchantType={merchantType} />

                            <div className="ocr-skip-container">
                                {merchantType === 'special' && (
                                    <button
                                        type="button"
                                        className="ocr-skip-btn"
                                        onClick={handleSkipToSecondScan}
                                    >
                                        跳過，前往第二次掃描 <i className="fas fa-arrow-right"></i>
                                    </button>
                                )}

                                <button
                                    type="button"
                                    className="ocr-skip-btn"
                                    onClick={handleSkipOcr}
                                >
                                    跳過掃描，手動錄入商品 <i className="fas fa-edit"></i>
                                </button>
                            </div>
                        </div>
                    ) : (
                        // 第二次掃描界面 (只有五商需要)
                        <div className="ocr-section">
                            <h3>第二次截圖 (後3種商品)</h3>
                            <p className="ocr-description">
                                請上傳第二張截圖，含後3種商品（家園幣交易）
                            </p>

                            <ImprovedOCRMerchantInput onItemsDetected={handleSecondScanItems} scanIndex={2} merchantType={merchantType} />

                            <div className="ocr-skip-container">
                                <button
                                    type="button"
                                    className="ocr-skip-btn"
                                    onClick={handleSkipOcr}
                                >
                                    跳過掃描，手動錄入商品 <i className="fas fa-edit"></i>
                                </button>
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <form onSubmit={handleSubmit} className="merchant-form">
                    <div className="form-header">
                        <h3>{merchantType === 'special' ? '五商資訊錄入' : '商人資訊錄入'}</h3>
                        <button
                            type="button"
                            className="back-to-ocr-btn"
                            onClick={() => {
                                setShowOcrInterface(true);
                                setFirstScanComplete(false);
                            }}
                        >
                            <i className="fas fa-camera"></i> 返回拍照識別
                        </button>
                    </div>

                    <div className="merchant-type-display">
                        <span className={`merchant-type-badge ${merchantType === 'special' ? 'special' : 'regular'}`}>
                            {merchantType === 'special' ? '五商 (9種商品)' : '普通商人 (6種商品)'}
                        </span>
                        <button
                            type="button"
                            className="change-type-btn"
                            onClick={() => setShowOcrInterface(true)}
                        >
                            變更
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

export default EnhancedOcrMerchantForm;