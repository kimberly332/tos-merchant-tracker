import React, { useState } from 'react';
import { addSpecialMerchant } from '../../firebase/firestore';

function SpecialMerchantForm() {
  const [formData, setFormData] = useState({
    playerId: '',
    // serverName: '',
    location: '',
    exchangeRate: '',
    totalAmount: '',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitResult(null);

    // Convert numeric fields
    const processedData = {
      ...formData,
      exchangeRate: Number(formData.exchangeRate),
      totalAmount: formData.totalAmount ? Number(formData.totalAmount) : null
    };

    try {
      const result = await addSpecialMerchant(processedData);
      if (result.success) {
        setSubmitResult({ 
          success: true, 
          message: '五商資訊已成功提交！謝謝您的分享。' 
        });
        
        // Reset form
        setFormData({
          playerId: '',
          serverName: '',
          location: '',
          exchangeRate: '',
          totalAmount: '',
          notes: ''
        });
      } else {
        setSubmitResult({ 
          success: false, 
          message: '提交時發生錯誤，請稍後再試。' 
        });
      }
    } catch (error) {
      console.error('Error submitting special merchant data:', error);
      setSubmitResult({ 
        success: false, 
        message: '提交時發生錯誤，請稍後再試。' 
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="special-merchant-form-container">
      {submitResult && (
        <div className={`submit-result ${submitResult.success ? 'success' : 'error'}`}>
          {submitResult.message}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="special-merchant-form">
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
        
        {/* <div className="form-group">
          <label htmlFor="serverName">伺服器名稱</label>
          <input
            type="text"
            id="serverName"
            name="serverName"
            value={formData.serverName}
            onChange={handleChange}
            required
          />
        </div> */}
        
        <div className="form-group">
          <label htmlFor="location">五商位置</label>
          <input
            type="text"
            id="location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            required
            placeholder="例如：克雷亞城 東北區"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="exchangeRate">兌換比率</label>
          <input
            type="number"
            id="exchangeRate"
            name="exchangeRate"
            value={formData.exchangeRate}
            onChange={handleChange}
            required
            min="1"
            placeholder="例如：1.2"
          />
          <small>1 家園幣能兌換多少銀幣</small>
        </div>
        
        <div className="form-group">
          <label htmlFor="totalAmount">總交易額度</label>
          <input
            type="number"
            id="totalAmount"
            name="totalAmount"
            value={formData.totalAmount}
            onChange={handleChange}
            min="1"
            placeholder="可選填"
          />
          <small>此五商能兌換的家園幣總量</small>
        </div>
        
        <div className="form-group">
          <label htmlFor="notes">備註</label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows="3"
            placeholder="其他補充資訊"
          />
        </div>
        
        <button 
          type="submit" 
          className="submit-btn" 
          disabled={submitting}
        >
          {submitting ? '提交中...' : '提交五商資訊'}
        </button>
      </form>
    </div>
  );
}

export default SpecialMerchantForm;