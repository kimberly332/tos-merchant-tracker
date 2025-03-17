import React, { useState, useRef } from 'react';

const ImageOCRMerchantInput = ({ onItemsDetected }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [ocrResults, setOcrResults] = useState(null);
  const [error, setError] = useState(null);
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
      // 在實際應用中，這部分會由您的OCR服務返回
      setTimeout(() => {
        const mockDetectedItems = [
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
        </p>
      </div>
    </div>
  );
};

export default ImageOCRMerchantInput;