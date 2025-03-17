// src/pages/AddMerchantPage.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MerchantInputForm from '../components/merchants/MerchantInputForm';
import { checkUserAuth } from '../firebase/userAuth';
import { checkUserHasSubmittedToday, deleteMerchant } from '../firebase/firestore';
import SuccessNotification from '../components/common/SuccessNotification';
import DeleteConfirmationDialog from '../components/common/DeleteConfirmationDialog';

function AddMerchantPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [merchantId, setMerchantId] = useState(null);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  
  // 確認對話框狀態
  const [dialogOpen, setDialogOpen] = useState(false);

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
        }
      } catch (error) {
        console.error('檢查提交記錄時發生錯誤:', error);
        setError('檢查提交記錄時發生錯誤，請稍後再試。');
      } finally {
        setLoading(false);
      }
    };
    
    checkPreviousSubmission();
  }, [navigate]);

  // 開啟確認對話框
  const openDeleteDialog = () => {
    setDialogOpen(true);
  };

  // 關閉確認對話框
  const closeDeleteDialog = () => {
    setDialogOpen(false);
  };

  // 處理刪除當前商人資訊
  const confirmDeleteMerchant = async () => {
    if (!merchantId) {
      closeDeleteDialog();
      return;
    }
    
    setDeleting(true);
    closeDeleteDialog(); // 提前關閉對話框
    
    try {
      const result = await deleteMerchant(merchantId);
      
      if (result.success) {
        setNotificationMessage('商人資訊已成功刪除！您現在可以提交新的資訊。');
        setShowNotification(true);
        
        // 清除購物車中與此商人相關的商品
        try {
          const savedCart = localStorage.getItem('shoppingCart');
          if (savedCart) {
            const cartItems = JSON.parse(savedCart);
            const updatedCart = cartItems.filter(item => 
              !item.merchantId || item.merchantId !== merchantId
            );
            
            localStorage.setItem('shoppingCart', JSON.stringify(updatedCart));
            
            // 通知購物車組件更新
            const cartUpdatedEvent = new CustomEvent('cartUpdated', {
              detail: { cart: updatedCart }
            });
            window.dispatchEvent(cartUpdatedEvent);
          }
        } catch (error) {
          console.error('刪除商人後更新購物車時發生錯誤:', error);
        }
        
        // 重置頁面狀態，允許用戶提交新的商人資訊
        setHasSubmitted(false);
        setMerchantId(null);
      } else {
        setError(`刪除商人資訊時發生錯誤: ${result.error}`);
      }
    } catch (err) {
      console.error('刪除商人資訊時發生錯誤:', err);
      setError(`刪除商人資訊時發生錯誤: ${err.message || '未知錯誤'}`);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="page add-merchant-page">
        <h1>新增商人資訊</h1>
        <div className="loading-indicator">檢查先前提交記錄中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page add-merchant-page">
        <h1>新增商人資訊</h1>
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

  if (hasSubmitted && merchantId) {
    return (
      <div className="page add-merchant-page">
        <h1>新增商人資訊</h1>
        <div className="already-submitted-message">
          <p>您今天已經提交過商人資訊。</p>
          <p>根據系統規定，每位用戶每天只能提交一個商人資訊。</p>
          <p>若要提交新的資訊，請先刪除已有的商人資訊。</p>
          
          <div className="form-buttons">
            <button 
              className="cancel-btn"
              onClick={() => navigate('/')}
            >
              返回首頁
            </button>
            
            <button 
              className="delete-btn"
              onClick={openDeleteDialog}
              disabled={deleting}
            >
              {deleting ? '刪除中...' : '刪除現有商人資訊'}
            </button>
          </div>
        </div>
        
        {/* 刪除確認對話框 */}
        <DeleteConfirmationDialog
          isOpen={dialogOpen}
          onClose={closeDeleteDialog}
          onConfirm={confirmDeleteMerchant}
          title="確認刪除商人資訊"
          message="確定要刪除這個商人資訊嗎？此操作無法撤銷，刪除後您可以提交新的商人資訊。"
        />
      </div>
    );
  }

  return (
    <div className="page add-merchant-page">
      <h1>新增商人資訊</h1>
      <p className="description">
        分享你今天所遇到的商人資訊，幫助其他玩家。
      </p>
      <MerchantInputForm />
      
      {/* 成功提示訊息 */}
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

export default AddMerchantPage;