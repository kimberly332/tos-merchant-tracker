import React, { useState } from 'react';
import { addSpecialMerchant } from '../../firebase/firestore';

function SpecialMerchantForm() {
  const [formData, setFormData] = useState({
    playerId: '',
    // serverName: '',
    notes: ''
    // Removed: location, exchangeRate, totalAmount
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

    try {
      const result = await addSpecialMerchant(formData);
      if (result.success) {
        localStorage.setItem('submitterPlayerId', formData.playerId);
        setSubmitResult({ 
          success: true, 
          message: '五商資訊已成功提交！謝謝您的分享。' 
        });
        
        // Reset form
        setFormData({
          playerId: '',
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
        
        {/* Removed location, exchangeRate, and totalAmount fields */}
        
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