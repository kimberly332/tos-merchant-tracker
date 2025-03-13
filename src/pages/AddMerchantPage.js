// src/pages/AddMerchantPage.js 新增功能
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MerchantInputForm from '../components/merchants/MerchantInputForm';
import { checkUserAuth } from '../firebase/userAuth';
import { checkUserHasSubmittedToday } from '../firebase/firestore';

function AddMerchantPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [merchantId, setMerchantId] = useState(null);

  useEffect(() => {
    const checkPreviousSubmission = async () => {
      setLoading(true);
      
      // 檢查用戶是否已登入
      const currentUser = checkUserAuth();
      if (!currentUser) {
        navigate('/login');
        return;
      }
      
      try {
        // 檢查當前用戶今天是否已提交過商人資訊
        const result = await checkUserHasSubmittedToday(currentUser.playerId);
        
        if (result.hasSubmitted && result.merchantId) {
          setHasSubmitted(true);
          setMerchantId(result.merchantId);
          
          // 延遲一下，讓用戶知道正在重定向
          setTimeout(() => {
            navigate(`/edit-merchant/${result.merchantId}`);
          }, 2000);
        }
      } catch (error) {
        console.error('檢查提交記錄時發生錯誤:', error);
      } finally {
        setLoading(false);
      }
    };
    
    checkPreviousSubmission();
  }, [navigate]);

  if (loading) {
    return (
      <div className="page add-merchant-page">
        <h1>新增商人資訊</h1>
        <div className="loading-indicator">檢查先前提交記錄中...</div>
      </div>
    );
  }

  if (hasSubmitted && merchantId) {
    return (
      <div className="page add-merchant-page">
        <h1>新增商人資訊</h1>
        <div className="redirect-message">
          <p>您今天已經提交過商人資訊，正在為您導向編輯頁面...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page add-merchant-page">
      <h1>新增商人資訊</h1>
      <p className="description">
        分享你今天所遇到的商人資訊，幫助其他玩家。
        販售家園幣的商人會自動識別為「五商」。
        所有商人資訊會在每日台灣時間午夜 (00:00) 自動重置。
      </p>
      <MerchantInputForm />
    </div>
  );
}

export default AddMerchantPage;