import React from 'react';
import EditMerchantForm from '../components/merchants/EditMerchantForm';

function EditMerchantPage() {
  return (
    <div className="page edit-merchant-page">
      <h1>編輯商人資訊</h1>
      <p className="description">
        您可以在這裡修改您提交的商人資訊。
        請注意，無論是否編輯，商人資訊仍會在每日台灣時間午夜 (00:00) 自動重置。
      </p>
      <EditMerchantForm />
    </div>
  );
}

export default EditMerchantPage;