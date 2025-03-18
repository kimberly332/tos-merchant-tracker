// src/components/merchants/GoogleVisionMerchantInput.js
import React, { useState, useRef } from 'react';
import { processImageForMerchantData } from '../../utils/GoogleVisionProcessor';
import { parseMerchantOcrText } from '../../utils/MerchantOcrParser';

const GoogleVisionMerchantInput = ({ 
  onItemsDetected, 
  scanIndex = 1, 
  merchantType = 'regular' 
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [ocrResults, setOcrResults] = useState(null);
  const [error, setError] = useState(null);
  const [showExampleModal, setShowExampleModal] = useState(false);
  const fileInputRef = useRef(null);

  // Handle image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file type
    if (!file.type.match('image.*')) {
      setError('請上傳圖片檔案');
      return;
    }

    // Display image preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target.result);
      processImage(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  // Process image with Google Cloud Vision
  const processImage = async (imageData) => {
    setIsProcessing(true);
    setError(null);
    
    try {
      // Process the image using Google Cloud Vision
      const parsedData = await processImageForMerchantData(imageData, scanIndex, merchantType);
      
      setOcrResults(parsedData);
      
      // Pass detected items to parent component
      onItemsDetected(parsedData.items);
      
    } catch (err) {
      console.error('Vision API processing error:', err);
      setError(`圖片處理失敗: ${err.message || '未知錯誤'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Trigger file input
  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  // Capture from camera
  const captureFromCamera = () => {
    fileInputRef.current.accept = 'image/*';
    fileInputRef.current.capture = 'camera';
    fileInputRef.current.click();
  };

  // Show example screenshot
  const showExampleScreenshot = () => {
    setShowExampleModal(true);
  };

  // Close example screenshot modal
  const closeExampleModal = () => {
    setShowExampleModal(false);
  };

  // Get appropriate example image path
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
            <i className="fas fa-image"></i> {isProcessing ? '處理中...' : '上傳截圖'}
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
                {ocrResults.merchantName && (
                  <p><strong>商人名稱:</strong> {ocrResults.merchantName}</p>
                )}
                {ocrResults.discount && (
                  <p><strong>折扣:</strong> {ocrResults.discount}</p>
                )}
              </div>
              
              <div className="ocr-detected-items">
                <h5>檢測到 {ocrResults.items.filter(item => item.category).length} 個商品:</h5>
                <ul>
                  {ocrResults.items.filter(item => item.category).map((item, index) => (
                    <li key={index}>
                      <span className="item-name">{item.category}</span>
                      {item.allowsCoinExchange && item.price ? (
                        <span className="item-price">💰 {item.price}</span>
                      ) : item.allowsBarterExchange && item.exchangeItemName ? (
                        <span className="item-exchange">
                          🔄 {item.exchangeQuantity} {item.exchangeItemName}
                        </span>
                      ) : null}
                      <span className="item-quantity">x{item.quantity}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Manual edit hint */}
              <div className="ocr-edit-hint">
                <p>
                  <i className="fas fa-info-circle"></i> 
                  識別完成後請檢查結果是否正確，您可以在下一步手動修正任何不準確的資訊。
                </p>
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

export default GoogleVisionMerchantInput;