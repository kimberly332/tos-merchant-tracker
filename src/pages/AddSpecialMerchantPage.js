import React from 'react';
import SpecialMerchantForm from '../components/merchants/SpecialMerchantForm';

function AddSpecialMerchantPage() {
  return (
    <div className="page add-special-merchant-page">
      <h1>新增五商資訊 (家園幣商人)</h1>
      <p className="description">
        分享你今天所遇到的五商資訊，讓其他玩家知道家園幣兌換資訊。
        所有商人資訊會在每日台灣時間午夜 (00:00) 自動重置。
      </p>
      <SpecialMerchantForm />
    </div>
  );
}

export default AddSpecialMerchantPage;