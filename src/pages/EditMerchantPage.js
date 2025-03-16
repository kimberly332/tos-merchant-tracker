// src/pages/EditMerchantPage.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMerchantById, updateMerchant } from '../firebase/firestore';
import MerchantEditForm from '../components/merchants/MerchantEditForm';
import { checkUserAuth } from '../firebase/userAuth';
import SuccessNotification from '../components/common/SuccessNotification';

function EditMerchantPage() {
  const { merchantId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [merchant, setMerchant] = useState(null);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');

  useEffect(() => {
    const currentUser = checkUserAuth();
    if (!currentUser) {
      navigate('/login');
      return;
    }
    setUser(currentUser);

    const fetchMerchantData = async () => {
      if (!merchantId) {
        setError('找不到商人資訊');
        setLoading(false);
        return;
      }

      try {
        const merchantData = await getMerchantById(merchantId);
        
        if (!merchantData) {
          setError('找不到商人資訊');
          setLoading(false);
          return;
        }

        // Verify that the current user is the owner of this merchant
        if (merchantData.playerId !== currentUser.playerId) {
          setError('您只能編輯自己提交的商人資訊');
          setLoading(false);
          return;
        }

        setMerchant(merchantData);
      } catch (err) {
        console.error('獲取商人資訊時發生錯誤:', err);
        setError('獲取商人資訊時發生錯誤，請稍後再試');
      } finally {
        setLoading(false);
      }
    };

    fetchMerchantData();
  }, [merchantId, navigate]);

  const handleUpdateSuccess = (message) => {
    setNotificationMessage(message || '商人資訊已成功更新！');
    setShowNotification(true);

    // Notify other users who might have items from this merchant in their cart
    const merchantUpdatedEvent = new CustomEvent('merchantUpdated', {
      detail: { merchantId }
    });
    window.dispatchEvent(merchantUpdatedEvent);

    // Redirect back to home page after a short delay
    setTimeout(() => {
      navigate('/');
    }, 2000);
  };

  if (loading) {
    return (
      <div className="page edit-merchant-page">
        <h1>編輯商人資訊</h1>
        <div className="loading-container">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page edit-merchant-page">
        <h1>編輯商人資訊</h1>
        <div className="error-message">{error}</div>
        <button 
          className="back-btn"
          onClick={() => navigate('/')}
        >
          返回首頁
        </button>
      </div>
    );
  }

  if (!merchant) {
    return (
      <div className="page edit-merchant-page">
        <h1>編輯商人資訊</h1>
        <div className="error-message">找不到商人資訊</div>
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
    <div className="page edit-merchant-page">
      <h1>編輯商人資訊</h1>
      <p className="description">
        您可以編輯您提交的商人資訊。請注意，已在購物車中的商品將會自動更新。
      </p>
      
      <MerchantEditForm 
        merchant={merchant} 
        merchantId={merchantId} 
        onUpdateSuccess={handleUpdateSuccess} 
      />
      
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

export default EditMerchantPage;