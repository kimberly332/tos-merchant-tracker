// src/pages/EditMerchantPage.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMerchantById } from '../firebase/firestore';
import MerchantEditForm from '../components/merchants/MerchantEditForm';
import { checkUserAuth } from '../firebase/userAuth';

function EditMerchantPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [merchant, setMerchant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchMerchant = async () => {
      setLoading(true);
      setError(null);
      
      // Check if user is logged in
      const currentUser = checkUserAuth();
      if (!currentUser) {
        navigate('/login');
        return;
      }
      
      try {
        const merchantData = await getMerchantById(id);
        
        // Check if the current user is the owner of this merchant
        if (merchantData.playerId !== currentUser.playerId) {
          setError('您只能編輯自己提交的商人資訊。');
          setLoading(false);
          return;
        }
        
        setMerchant(merchantData);
      } catch (err) {
        console.error('Error fetching merchant:', err);
        setError('獲取商人資訊時發生錯誤，請稍後再試。');
      } finally {
        setLoading(false);
      }
    };
    
    fetchMerchant();
  }, [id, navigate]);
  
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
        <div className="error-message">找不到商人資訊。</div>
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
        更新您提交的商人資訊。
      </p>
      <MerchantEditForm merchant={merchant} merchantId={id} />
    </div>
  );
}

export default EditMerchantPage;