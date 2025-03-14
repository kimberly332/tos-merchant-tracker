// src/components/common/DeleteConfirmationDialog.js
import React from 'react';

const DeleteConfirmationDialog = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;

  // Prevent clicks inside the dialog from closing it
  const handleDialogClick = (e) => {
    e.stopPropagation();
  };

  return (
    <div className="delete-confirmation-overlay" onClick={onClose}>
      <div className="delete-confirmation-dialog" onClick={handleDialogClick}>
        <h3>{title || '確認刪除'}</h3>
        <p>{message || '確定要刪除這個商人資訊嗎？此操作無法撤銷。'}</p>
        <div className="delete-confirmation-actions">
          <button 
            className="delete-cancel-btn"
            onClick={onClose}
          >
            取消
          </button>
          <button 
            className="delete-confirm-btn"
            onClick={onConfirm}
          >
            確認刪除
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationDialog;