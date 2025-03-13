import React from 'react';
import MerchantList from '../components/merchants/MerchantList';

function HomePage() {
  return (
    <div className="page home-page">
      <h1>救世者之樹M 商人追蹤系統</h1>
      <p className="description">
        搜尋你需要的物品，查看哪些商人正在販售它們。
        系統會在每日台灣時間午夜 (00:00) 自動重置所有商人資訊。
      </p>
      <MerchantList />
    </div>
  );
}

export default HomePage;