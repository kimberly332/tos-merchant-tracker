import React from 'react';
import MerchantInputForm from '../components/merchants/MerchantInputForm';

function AddMerchantPage() {
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