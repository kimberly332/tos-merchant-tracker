import React from 'react';
import MerchantInputForm from '../components/merchants/MerchantInputForm';

function AddMerchantPage() {
  return (
    <div className="page add-merchant-page">
      <h1>新增普通商人資訊</h1>
      <p className="description">
        分享你今天所遇到的普通商人資訊，幫助其他玩家。
      </p>
      <MerchantInputForm />
    </div>
  );
}

export default AddMerchantPage;