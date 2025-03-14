import React from 'react';
import UserGuide from '../components/guide/UserGuide';

function UserGuidePage() {
  return (
    <div className="page user-guide-page">
      <h1>使用說明</h1>
      <p className="description">
        歡迎使用救世者之樹M商人追蹤系統，以下是詳細的使用指南。
      </p>
      <UserGuide />
    </div>
  );
}

export default UserGuidePage;