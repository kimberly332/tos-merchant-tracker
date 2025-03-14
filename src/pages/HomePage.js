import React from 'react';
import MerchantList from '../components/merchants/MerchantList';

function HomePage() {
  return (
    <div className="page home-page">
      <h1>搜尋商品</h1>
      <p className="description">
        系統會在每日台灣時間午夜 (00:00) 自動重置所有商人資訊。
      </p>
      <MerchantList />
    </div>
  );
}

export default HomePage;