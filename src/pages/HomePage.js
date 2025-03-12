import React from 'react';
import ItemSearch from '../components/search/ItemSearch';

function HomePage() {
  return (
    <div className="page home-page">
      <h1>救世者之樹M 商人追蹤系統</h1>
      <p className="description">
        搜尋你需要的物品，查看哪些商人正在販售它們。
      </p>
      <ItemSearch />
    </div>
  );
}

export default HomePage;