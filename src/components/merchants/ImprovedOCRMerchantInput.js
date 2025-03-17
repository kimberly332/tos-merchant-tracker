// src/components/merchants/ImprovedOCRMerchantInput.js
import React, { useState, useRef } from 'react';
import { createWorker } from 'tesseract.js';

const ImprovedOCRMerchantInput = ({ 
  onItemsDetected, 
  scanIndex = 1, 
  merchantType = 'regular' 
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [ocrResults, setOcrResults] = useState(null);
  const [rawOcrText, setRawOcrText] = useState('');
  const [error, setError] = useState(null);
  const [showExampleModal, setShowExampleModal] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef(null);

  // 處理圖片上傳
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 檢查檔案類型
    if (!file.type.match('image.*')) {
      setError('請上傳圖片檔案');
      return;
    }

    // 顯示圖片預覽
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target.result);
      processImage(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  // 處理圖片識別 - 使用 Tesseract.js 進行OCR處理
  const processImage = async (imageData) => {
    setIsProcessing(true);
    setError(null);
    setProgress(0);
    
    try {
      // 創建OCR worker，選擇中文繁體語言
      const worker = await createWorker({
        logger: m => {
          console.log(m);
          if (m.status === 'recognizing text') {
            setProgress(parseInt(m.progress * 100));
          }
        }
      });
      
      // 加載中文繁體語言
      await worker.loadLanguage('chi_tra+eng');
      await worker.initialize('chi_tra+eng');
      
      // 設置辨識參數
      await worker.setParameters({
        tessedit_char_whitelist: '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_%+,.() 家園幣商人物品數量交換折扣可購入次數一二三四五六七八九十百',
        preserve_interword_spaces: '1',
      });
      
      // 識別圖片
      const { data } = await worker.recognize(imageData);
      setRawOcrText(data.text);
      
      // 解析OCR結果
      const extractedData = extractMerchantData(data.text, scanIndex, merchantType);
      
      setOcrResults({
        merchantName: extractedData.merchantName || '未識別到商人名稱',
        discount: extractedData.discount || '',
        items: extractedData.items
      });
      
      // 傳遞檢測到的商品資訊給父元件
      onItemsDetected(extractedData.items);
      
      // 釋放worker資源
      await worker.terminate();
      setIsProcessing(false);
    } catch (err) {
      console.error('OCR處理錯誤:', err);
      setError('圖片處理失敗: ' + err.message);
      setIsProcessing(false);
    }
  };

  // 從OCR文本提取商人數據
  const extractMerchantData = (text, scanIndex, merchantType) => {
    console.log('Raw OCR text:', text);
    
    const lines = text.split('\n').filter(line => line.trim());
    
    // 提取商人名稱（假設在第一行）
    let merchantName = lines[0]?.trim() || '';
    
    // 提取折扣信息
    let discount = null;
    const discountMatch = text.match(/折扣[:：]?\s*(-?\d+%|.+折)/i);
    if (discountMatch) {
      discount = discountMatch[1];
    }
    
    // 提取商品信息
    const items = [];
    
    // 根據不同的掃描類型使用不同的解析策略
    if (merchantType === 'special' && scanIndex === 2) {
      // 五商第二次掃描 - 主要是家園幣交換
      parseSpecialMerchantSecondScan(text, items);
    } else {
      // 普通商人或五商第一次掃描
      parseRegularMerchantItems(text, items);
    }
    
    return {
      merchantName,
      discount,
      items
    };
  };
  
  // 解析普通商人或五商第一次掃描的商品
  const parseRegularMerchantItems = (text, items) => {
    // 分析游戲商人界面的特徵，尋找商品名稱、數量、價格或交換信息
    
    // 使用正則表達式匹配商品信息的模式
    // 這裡的正則表達式需要根據實際游戲界面調整
    
    // 尋找商品行，形如：
    // 商品名稱  數量  價格/交換
    const itemPattern = /([^\d\n]+)\s+(\d+)(?:\s+(\d+)|[\s×*]\s*(\d+)\s+([^\d\n]+))/g;
    
    let match;
    while ((match = itemPattern.exec(text)) !== null) {
      const itemName = match[1].trim();
      const quantity = match[2];
      
      if (match[3]) {
        // 家園幣交易
        items.push({
          category: itemName,
          quantity: quantity,
          purchaseTimes: quantity,
          price: match[3],
          allowsCoinExchange: true,
          allowsBarterExchange: false
        });
      } else if (match[4] && match[5]) {
        // 物品交換
        items.push({
          category: itemName,
          quantity: quantity,
          purchaseTimes: quantity,
          price: '',
          allowsCoinExchange: false,
          allowsBarterExchange: true,
          exchangeItemName: match[5].trim(),
          exchangeQuantity: match[4]
        });
      }
    }
    
    // 補充解析：尋找額外的模式
    // 有些商品可能是多行顯示的
    const lines = text.split('\n').filter(line => line.trim());
    for (let i = 0; i < lines.length; i++) {
      // 檢查是否是一個商品名稱行
      if (lines[i].match(/^[^\d]+$/) && i + 1 < lines.length) {
        const itemName = lines[i].trim();
        const nextLine = lines[i+1];
        
        // 检查下一行是否包含數量和價格信息
        const quantityPriceMatch = nextLine.match(/(\d+)\s+(\d+)$/);
        const quantityExchangeMatch = nextLine.match(/(\d+)\s+(\d+)\s+([^\d]+)$/);
        
        if (quantityPriceMatch) {
          // 家園幣交易
          items.push({
            category: itemName,
            quantity: quantityPriceMatch[1],
            purchaseTimes: quantityPriceMatch[1],
            price: quantityPriceMatch[2],
            allowsCoinExchange: true,
            allowsBarterExchange: false
          });
          i++; // 跳過已處理的下一行
        } else if (quantityExchangeMatch) {
          // 物品交換
          items.push({
            category: itemName,
            quantity: quantityExchangeMatch[1],
            purchaseTimes: quantityExchangeMatch[1],
            price: '',
            allowsCoinExchange: false,
            allowsBarterExchange: true,
            exchangeItemName: quantityExchangeMatch[3].trim(),
            exchangeQuantity: quantityExchangeMatch[2]
          });
          i++; // 跳過已處理的下一行
        }
      }
    }
    
    // 知名商品名稱的修正
    for (let item of items) {
      // 根據項目清單自動糾正常見誤識別
      item.category = correctItemName(item.category);
      if (item.exchangeItemName) {
        item.exchangeItemName = correctItemName(item.exchangeItemName);
      }
    }
    
    // 如果識別到的商品少於6個，嘗試使用更寬鬆的匹配
    if (items.length < 4) {
      fallbackItemDetection(text, items);
    }
    
    return items;
  };
  
  // 解析五商第二次掃描的商品（家園幣交換）
  const parseSpecialMerchantSecondScan = (text, items) => {
    // 在五商第二次掃描中，主要尋找家園幣交換的模式
    // 通常形如：家園幣 數量 交換數量 交換物品
    
    const homeTokenPattern = /家園幣\s+(\d+)[\s×*]*(\d+)\s+([^\d\n]+)/g;
    
    let match;
    while ((match = homeTokenPattern.exec(text)) !== null) {
      items.push({
        category: '家園幣',
        quantity: match[1],
        purchaseTimes: match[1],
        price: '',
        allowsCoinExchange: false,
        allowsBarterExchange: true,
        exchangeItemName: match[3].trim(),
        exchangeQuantity: match[2]
      });
    }
    
    // 如果沒有找到明確的家園幣模式，嘗試其他解析方法
    if (items.length === 0) {
      // 先檢查文本中是否包含"家園幣"
      if (text.includes('家園幣')) {
        // 尋找數字+物品名稱的模式
        const exchangePattern = /(\d+)\s+([^\d\n]+)/g;
        
        let exchangeMatches = [];
        while ((match = exchangePattern.exec(text)) !== null) {
          exchangeMatches.push({
            quantity: match[1],
            item: match[2].trim()
          });
        }
        
        // 按照匹配順序，第一個數字可能是家園幣數量，然後是交換數量和物品
        if (exchangeMatches.length >= 2) {
          for (let i = 0; i < exchangeMatches.length - 1; i += 2) {
            items.push({
              category: '家園幣',
              quantity: exchangeMatches[i].quantity,
              purchaseTimes: exchangeMatches[i].quantity,
              price: '',
              allowsCoinExchange: false,
              allowsBarterExchange: true,
              exchangeItemName: exchangeMatches[i+1].item,
              exchangeQuantity: exchangeMatches[i+1].quantity
            });
          }
        }
      }
    }
    
    // 確保交換物品名稱的正確性
    for (let item of items) {
      if (item.exchangeItemName) {
        item.exchangeItemName = correctItemName(item.exchangeItemName);
      }
    }
    
    return items;
  };
  
  // 備用商品檢測方法（當主要方法沒有識別出足夠的商品時使用）
  const fallbackItemDetection = (text, items) => {
    // 尋找可能的商品名稱
    const commonItems = [
      '小麥', '玉米', '胡蘿蔔', '番茄', '甘蔗', '草莓', '雞蛋', '牛奶', '蜂蜜',
      '小麵包', '玉米麵包', '曲奇餅', '鮮奶油', '奶油', '起司', '砂糖', '方糖',
      '戲劇舞臺', '藍藍天空', '田園圓桌', '田園竹椅', '田園陽傘',
      '貴族圓桌', '貴族椅子', '貴族陽傘',
      '飛雲菇', '黃金汁液', '緋紅汁液', '濃綢汁液',
      '明黃木門', '明黃鬱金香花圃', '明黃花壇', '明黃盆栽',
      '小小檸檬凳', '小小奇異果凳', '小小西瓜凳', '小小香橙凳',
      '家園幣'
    ];
    
    for (const itemName of commonItems) {
      // 如果文本中包含此商品名稱
      if (text.includes(itemName)) {
        // 在商品名稱附近尋找數字
        const itemIndex = text.indexOf(itemName);
        const nearbyText = text.substring(Math.max(0, itemIndex - 20), Math.min(text.length, itemIndex + 40));
        
        // 尋找附近的數字
        const numbersMatch = nearbyText.match(/\d+/g);
        if (numbersMatch && numbersMatch.length >= 1) {
          // 第一個數字可能是數量
          const quantity = numbersMatch[0];
          
          // 如果有第二個數字，可能是價格或交換數量
          if (numbersMatch.length >= 2) {
            const secondNumber = numbersMatch[1];
            
            // 檢查附近是否有交換物品名稱
            let hasExchangeItem = false;
            for (const exchangeItem of commonItems) {
              if (exchangeItem !== itemName && nearbyText.includes(exchangeItem)) {
                // 可能是物品交換
                items.push({
                  category: itemName,
                  quantity,
                  purchaseTimes: quantity,
                  price: '',
                  allowsCoinExchange: false,
                  allowsBarterExchange: true,
                  exchangeItemName: exchangeItem,
                  exchangeQuantity: secondNumber
                });
                hasExchangeItem = true;
                break;
              }
            }
            
            if (!hasExchangeItem) {
              // 可能是家園幣交易
              items.push({
                category: itemName,
                quantity,
                purchaseTimes: quantity,
                price: secondNumber,
                allowsCoinExchange: true,
                allowsBarterExchange: false
              });
            }
          } else {
            // 只有數量，默認為家園幣交易
            items.push({
              category: itemName,
              quantity,
              purchaseTimes: quantity,
              price: '0', // 默認價格
              allowsCoinExchange: true,
              allowsBarterExchange: false
            });
          }
        }
      }
    }
  };
  
  // 修正常見的物品名稱誤識別
  const correctItemName = (name) => {
    if (!name) return name;
    
    const corrections = {
      '冥黃木門': '明黃木門',
      '閞黃木門': '明黃木門',
      '胡藘蔔': '胡蘿蔔',
      '蒐藟': '草莓',
      '肳莓': '草莓',
      '土莓': '草莓',
      '繭蜜': '蜂蜜',
      '蜂蛿': '蜂蜜',
      '蜂密': '蜂蜜',
      '飛裏菇': '飛雲菇',
      '黃念汗液': '黃金汁液',
      '小小果奇果凳': '小小奇異果凳',
      '小小祟瓜凳': '小小西瓜凳',
      '小小西爪凳': '小小西瓜凳',
      '小小李捐凳': '小小檸檬凳',
      '小小榴檬凳': '小小檸檬凳',
      '家固幣': '家園幣',
      '家陣幣': '家園幣',
      '家薗幣': '家園幣',
    };
    
    // 檢查精確匹配
    if (corrections[name]) {
      return corrections[name];
    }
    
    // 檢查部分匹配
    for (const [incorrect, correct] of Object.entries(corrections)) {
      if (name.includes(incorrect)) {
        return name.replace(incorrect, correct);
      }
    }
    
    return name;
  };

  // 手動觸發檔案選擇
  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  // 從相機捕獲圖像
  const captureFromCamera = () => {
    fileInputRef.current.accept = 'image/*';
    fileInputRef.current.capture = 'camera';
    fileInputRef.current.click();
  };

  // 顯示範例截圖
  const showExampleScreenshot = () => {
    setShowExampleModal(true);
  };

  // 關閉範例截圖模態視窗
  const closeExampleModal = () => {
    setShowExampleModal(false);
  };

  // 獲取對應的範例截圖路徑
  const getExampleImagePath = () => {
    if (merchantType === 'regular') {
        // Single screenshot for regular merchant
        return '/examples/merchant-screenshot.jpg';
    } else {
        // Two screenshots for special merchant
        return scanIndex === 2 
            ? '/examples/special-merchant-second-scan.jpg' 
            : '/examples/special-merchant-first-scan.jpg';
    }
  };

  return (
    <div className="ocr-merchant-input">
      <div className="ocr-controls">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageUpload}
          accept="image/*"
          style={{ display: 'none' }}
        />
        
        <div className="ocr-buttons">
          <button
            type="button"
            className="ocr-upload-btn"
            onClick={triggerFileInput}
            disabled={isProcessing}
          >
            <i className="fas fa-image"></i> 上傳截圖
          </button>
          
          <button
            type="button" 
            className="ocr-camera-btn"
            onClick={captureFromCamera}
            disabled={isProcessing}
          >
            <i className="fas fa-camera"></i> 拍照識別
          </button>
          
          <button
            type="button"
            className="ocr-example-btn"
            onClick={showExampleScreenshot}
          >
            <i className="fas fa-question-circle"></i> 查看範例截圖
          </button>
        </div>
        
        {isProcessing && (
          <div className="ocr-processing">
            <div className="ocr-spinner"></div>
            <span>正在識別商品資訊... {progress}%</span>
          </div>
        )}
        
        {error && (
          <div className="ocr-error">
            {typeof error === 'object' ? error.message : error}
          </div>
        )}
      </div>
      
      {previewUrl && (
        <div className="ocr-preview-container">
          <img src={previewUrl} alt="商人截圖預覽" className="ocr-preview-image" />
          
          {ocrResults && (
            <div className="ocr-results">
              <h4>識別結果:</h4>
              <div className="ocr-merchant-info">
                <p><strong>商人名稱:</strong> {ocrResults.merchantName}</p>
                {ocrResults.discount && (
                  <p><strong>折扣:</strong> {ocrResults.discount}</p>
                )}
              </div>
              
              <div className="ocr-detected-items">
                <h5>檢測到 {ocrResults.items.length} 個商品:</h5>
                <ul>
                  {ocrResults.items.map((item, index) => (
                    <li key={index}>
                      <span className="item-name">{item.category}</span>
                      {item.allowsCoinExchange ? (
                        <span className="item-price">💰 {item.price}</span>
                      ) : (
                        <span className="item-exchange">
                          🔄 {item.exchangeQuantity} {item.exchangeItemName}
                        </span>
                      )}
                      <span className="item-quantity">x{item.quantity}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              {rawOcrText && (
                <div className="ocr-raw-text">
                  <details>
                    <summary>原始OCR文本 (用於偵錯)</summary>
                    <pre>{rawOcrText}</pre>
                  </details>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      
      <div className="ocr-tips">
        <p>
          <i className="fas fa-info-circle"></i> 
          提示：請確保截圖清晰可見，包含完整的商人物品資訊。
          {scanIndex === 2 ? (
            <span className="special-tip"> 這是五商的第二張截圖，請上傳包含家園幣交易的部分。</span>
          ) : (
            <span className="special-tip"> 點擊「查看範例截圖」可以看到正確的截圖方式。</span>
          )}
        </p>
      </div>
      
      {/* 範例截圖模態視窗 */}
      {showExampleModal && (
        <div className="example-modal-overlay" onClick={closeExampleModal}>
            <div className="example-modal-content" onClick={e => e.stopPropagation()}>
                <div className="example-modal-header">
                    <h3>
                        {merchantType === 'regular' 
                            ? '商人截圖範例'
                            : (scanIndex === 2 
                                ? '五商第二張截圖範例' 
                                : '五商第一張截圖範例')
                        }
                    </h3>
                    <button className="example-modal-close" onClick={closeExampleModal}>×</button>
                </div>
                <div className="example-modal-body">
                    <img src={getExampleImagePath()} alt="範例截圖" className="example-screenshot" />
                    <p className="example-description">
                        {merchantType === 'regular' ? (
                            '商人截圖應該清晰顯示所有販售物品，包括物品名稱、數量、價格或交換材料。'
                        ) : (scanIndex === 2 ? (
                            '上傳五商的第二部分截圖，應該包含家園幣交易的內容（通常是底部的3個項目）。'
                        ) : (
                            '上傳五商的第一部分截圖，包含前6種商品的資訊。'
                        ))}
                    </p>
                    
                    <div className="example-tips">
                        <h4>截圖要點：</h4>
                        <ul>
                            <li>確保商人視窗完全展開</li>
                            <li>所有物品信息清晰可見</li>
                            <li>避免遊戲界面上其他干擾元素</li>
                            <li>截圖包含商人名稱和折扣（如果有的話）</li>
                            {merchantType === 'special' && scanIndex === 1 && (
                                <li><strong>第一張截圖包含前6種商品</strong></li>
                            )}
                            {merchantType === 'special' && scanIndex === 2 && (
                                <li><strong>第二張截圖應包含剩餘的3個家園幣交易項目</strong></li>
                            )}
                        </ul>
                    </div>
                </div>
                <div className="example-modal-footer">
                    <button className="example-modal-btn" onClick={closeExampleModal}>
                        我明白了
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default ImprovedOCRMerchantInput;