import React, { useState, useRef } from 'react';

const ImageOCRMerchantInput = ({ onItemsDetected, scanIndex = 1 }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [ocrResults, setOcrResults] = useState(null);
  const [error, setError] = useState(null);
  const [showExampleModal, setShowExampleModal] = useState(false);
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

  // 處理圖片識別
  const processImage = async (imageData) => {
    setIsProcessing(true);
    setError(null);
    
    try {
      // 這裡是調用OCR API的地方
      // 實際實現中，您需要整合適合的OCR服務，例如:
      // - 自己的後端API (推薦，可以受控和優化針對遊戲UI的識別)
      // - 第三方OCR服務 (需API金鑰配置)
      
      // 示意：使用fetch調用您的OCR API
      /*
      const response = await fetch('/api/ocr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageData }),
      });
      
      if (!response.ok) {
        throw new Error('OCR服務請求失敗');
      }
      
      const data = await response.json();
      setOcrResults(data);
      
      // 提取並傳遞檢測到的商品資訊
      if (data.items && data.items.length > 0) {
        onItemsDetected(data.items);
      }
      */
      
      // 演示用：模擬從圖片中提取的數據
      // 根據當前掃描索引生成不同的模擬數據
      setTimeout(() => {
        // 第一次掃描的模擬數據 (普通商人全部或五商前6個)
        const firstScanItems = [
          {
            category: '明黃木門碎片',
            quantity: '2',
            purchaseTimes: '2',
            price: '4750',
            allowsCoinExchange: true,
            allowsBarterExchange: false
          },
          {
            category: '小小西瓜羹',
            quantity: '1',
            purchaseTimes: '1',
            price: '8550',
            allowsCoinExchange: true,
            allowsBarterExchange: false
          },
          {
            category: '小小奇異果羹',
            quantity: '1',
            purchaseTimes: '1',
            price: '8550',
            allowsCoinExchange: true,
            allowsBarterExchange: false
          },
          {
            category: '飛雲菇',
            quantity: '30',
            purchaseTimes: '2',
            price: '',
            allowsCoinExchange: false,
            allowsBarterExchange: true,
            exchangeItemName: '藍色漿果',
            exchangeQuantity: '39'
          },
          {
            category: '番茄汁',
            quantity: '2',
            purchaseTimes: '3',
            price: '',
            allowsCoinExchange: false,
            allowsBarterExchange: true,
            exchangeItemName: '番茄',
            exchangeQuantity: '8'
          },
          {
            category: '披薩醬',
            quantity: '2',
            purchaseTimes: '3',
            price: '',
            allowsCoinExchange: false,
            allowsBarterExchange: true,
            exchangeItemName: '草莓',
            exchangeQuantity: '8'
          }
        ];
        
        // 第二次掃描的模擬數據 (五商後3個)
        const secondScanItems = [
          {
            category: '家園幣',
            quantity: '1200',
            purchaseTimes: '1',
            price: '',
            allowsCoinExchange: false,
            allowsBarterExchange: true,
            exchangeItemName: '蜂蜜',
            exchangeQuantity: '19'
          },
          {
            category: '家園幣',
            quantity: '1500',
            purchaseTimes: '1',
            price: '',
            allowsCoinExchange: false,
            allowsBarterExchange: true,
            exchangeItemName: '牛奶',
            exchangeQuantity: '8'
          },
          {
            category: '家園幣',
            quantity: '1000',
            purchaseTimes: '1',
            price: '',
            allowsCoinExchange: false,
            allowsBarterExchange: true,
            exchangeItemName: '草莓',
            exchangeQuantity: '13'
          }
        ];
        
        // 根據掃描索引決定要使用哪組數據
        const mockDetectedItems = scanIndex === 2 ? secondScanItems : firstScanItems;
        
        setOcrResults({
          merchantName: 'How耳包U和花生',
          discount: '-5%',
          items: mockDetectedItems
        });
        
        // 傳遞檢測到的商品資訊給父元件
        onItemsDetected(mockDetectedItems);
        
        setIsProcessing(false);
      }, 1500);
    } catch (err) {
      console.error('OCR處理錯誤:', err);
      setError('圖片處理失敗: ' + err.message);
      setIsProcessing(false);
    }
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
    return scanIndex === 2 
      ? '/examples/special-merchant-2.jpg' 
      : '/examples/merchant-screenshot.jpg';
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
            <span>正在識別商品資訊...</span>
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
              <h3>{scanIndex === 2 ? '五商第二張截圖範例' : '商人截圖範例'}</h3>
              <button className="example-modal-close" onClick={closeExampleModal}>×</button>
            </div>
            <div className="example-modal-body">
              <img src={getExampleImagePath()} alt="範例截圖" className="example-screenshot" />
              <p className="example-description">
                {scanIndex === 2 ? (
                  '上傳五商的第二部分截圖，應該包含家園幣交易的內容（通常是底部的3個項目）。'
                ) : (
                  '商人截圖應該清晰顯示所有販售物品，包括物品名稱、數量、價格或交換材料。'
                )}
              </p>
              
              <div className="example-tips">
                <h4>截圖要點：</h4>
                <ul>
                  <li>確保商人視窗完全展開</li>
                  <li>所有物品信息清晰可見</li>
                  <li>避免遊戲界面上其他干擾元素</li>
                  <li>截圖包含商人名稱和折扣（如果有的話）</li>
                  {scanIndex === 2 && (
                    <li><strong>五商第二張截圖應包含剩餘的3個家園幣交易項目</strong></li>
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

export default ImageOCRMerchantInput;