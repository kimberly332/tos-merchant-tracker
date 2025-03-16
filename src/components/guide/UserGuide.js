import React, { useState } from 'react';

const UserGuide = () => {
  const [activeSection, setActiveSection] = useState('introduction');
  
  // 切換當前顯示的部分
  const toggleSection = (section) => {
    setActiveSection(section === activeSection ? null : section);
  };
  
  return (
    <div className="merchant-form-container">
      <div className="guide-container">
        <div className="guide-menu">
          {[
            { id: 'introduction', title: '系統介紹', icon: '📋' },
            { id: 'login', title: '登入與開始', icon: '🔑' },
            { id: 'search', title: '搜尋商品', icon: '🔍' },
            { id: 'merchant', title: '添加商人資訊', icon: '👤' },
            { id: 'edit', title: '編輯商人資訊', icon: '✏️' },
            { id: 'cart', title: '使用購物車', icon: '🛒' },
            { id: 'delete', title: '刪除商人資訊', icon: '🗑️' }
          ].map(section => (
            <button 
              key={section.id}
              onClick={() => toggleSection(section.id)}
              className={`guide-menu-item ${activeSection === section.id ? 'active' : ''}`}
            >
              <span className="guide-menu-icon">{section.icon}</span>
              <span>{section.title}</span>
            </button>
          ))}
        </div>
        
        {/* 內容部分 */}
        <div className="guide-content">
          {/* 系統介紹 */}
          {activeSection === 'introduction' && (
            <div className="guide-section">
              <h2 className="guide-section-title">系統介紹</h2>
              <div className="guide-section-content">
                <p>雨果商人追蹤系統是針對救世者之樹M遊戲中的商人系統所設計的工具，主要功能包括：</p>
                <ul className="guide-list">
                  <li>搜尋其他玩家提交的商人販售物品</li>
                  <li>添加您所遇到的商人資訊，分享給其他玩家</li>
                  <li>編輯您提交的商人資訊，無需刪除後重新添加</li>
                  <li>使用購物車功能，規劃您的購物清單及所需材料</li>
                  <li>刪除您提交的商人資訊</li>
                  <li>查看特殊商人（五商）資訊</li>
                </ul>
                <p>所有商人資訊會在每日台灣時間午夜 (00:00) 自動重置，與遊戲內商人機制同步。</p>
              </div>
            </div>
          )}
          
          {/* 登入與開始 */}
          {activeSection === 'login' && (
            <div className="guide-section">
              <h2 className="guide-section-title">登入與開始</h2>
              <div className="guide-section-content">
                <ol className="guide-list numbered">
                  <li>
                    <strong>選擇伺服器</strong>
                    <p>從下拉選單中選擇您遊玩的伺服器，每個伺服器的商人資訊是獨立的。</p>
                  </li>
                  <li>
                    <strong>輸入遊戲名稱</strong>
                    <p>請輸入您在遊戲中的角色ID，這將用於標識您提交的商人資訊。</p>
                  </li>
                  <li>
                    <strong>登入系統</strong>
                    <p>點擊「登入」按鈕完成登入程序。首次登入的用戶將自動創建帳號。</p>
                  </li>
                </ol>
                <div className="guide-tip">
                  <p>提示：登入後，您的購物車資訊會被保存，下次登入時仍可使用。</p>
                </div>
              </div>
            </div>
          )}
          
          {/* 搜尋商品 */}
          {activeSection === 'search' && (
            <div className="guide-section">
              <h2 className="guide-section-title">搜尋商品</h2>
              <div className="guide-section-content">
                <p>首頁主要用於搜尋其他玩家提交的商人資訊：</p>
                <ol className="guide-list numbered">
                  <li>
                    <strong>使用搜尋欄</strong>
                    <p>在搜尋欄中輸入物品名稱、商人ID或其他關鍵詞進行搜尋。</p>
                  </li>
                  <li>
                    <strong>類別篩選</strong>
                    <p>使用「物品類別」篩選功能，可以按類別查看特定類型的物品。可以點擊「展開更多分類」查看所有類別。</p>
                  </li>
                  <li>
                    <strong>商人類型篩選</strong>
                    <p>使用「顯示五商」和「顯示普通商人」選項來篩選不同類型的商人。</p>
                  </li>
                  <li>
                    <strong>排序選項</strong>
                    <p>使用「排序方式」下拉選單選擇不同的排序方式，如「五商優先」、「最新發布」等。</p>
                  </li>
                </ol>
                <div className="guide-tip">
                  <p>提示：點擊商人的ID可以複製到剪貼板，方便在遊戲中查找。</p>
                </div>
              </div>
            </div>
          )}
          
          {/* 添加商人資訊 */}
          {activeSection === 'merchant' && (
            <div className="guide-section">
              <h2 className="guide-section-title">添加商人資訊</h2>
              <div className="guide-section-content">
                <p>您可以添加您在遊戲中遇到的商人資訊，分享給其他玩家：</p>
                <ol className="guide-list numbered">
                  <li>
                    <strong>點擊「新增商人」</strong>
                    <p>點擊導航欄中的「新增商人」按鈕進入添加頁面。</p>
                  </li>
                  <li>
                    <strong>填寫商人資訊</strong>
                    <p>您的遊戲名稱會自動填入，可以選擇性填寫商人提供的折扣信息。</p>
                  </li>
                  <li>
                    <strong>添加物品</strong>
                    <p>在「物品名稱」欄位選擇物品，填寫物品數量和可購入次數。</p>
                  </li>
                  <li>
                    <strong>選擇交易方式</strong>
                    <ul className="guide-list">
                      <li>選擇「支持家園幣交易」需填寫物品單價。</li>
                      <li>選擇「支持以物易物」需選擇交換物品及數量。</li>
                      <li>販售家園幣的商人會自動識別為「五商」。</li>
                    </ul>
                  </li>
                  <li>
                    <strong>添加多個物品</strong>
                    <p>點擊「添加更多商品」按鈕可以添加更多販售物品。</p>
                  </li>
                  <li>
                    <strong>提交資訊</strong>
                    <p>填寫完畢後點擊「提交商人資訊」按鈕完成提交。</p>
                  </li>
                </ol>
                <div className="guide-tip">
                  <p>提示：每位玩家每天只能提交一個商人資訊。如需提交新資訊，需先刪除當日已提交的資訊。</p>
                </div>
              </div>
            </div>
          )}
          
          {/* 編輯商人資訊 */}
          {activeSection === 'edit' && (
            <div className="guide-section">
              <h2 className="guide-section-title">編輯商人資訊</h2>
              <div className="guide-section-content">
                <p>您可以編輯已提交的商人資訊，而無需刪除後重新添加：</p>
                <ol className="guide-list numbered">
                  <li>
                    <strong>找到您的商人資訊</strong>
                    <p>在首頁商人列表中找到您提交的商人資訊。只有您自己提交的商人才會顯示編輯按鈕。</p>
                  </li>
                  <li>
                    <strong>點擊編輯按鈕</strong>
                    <p>在商人資訊卡片底部找到「編輯」按鈕，點擊進入編輯頁面。</p>
                  </li>
                  <li>
                    <strong>修改商人資訊</strong>
                    <p>您可以修改折扣、物品數量、可購入次數、價格或交換要求等資訊。</p>
                  </li>
                  <li>
                    <strong>添加或移除物品</strong>
                    <p>使用「添加更多商品」或「移除」按鈕來調整物品清單。</p>
                  </li>
                  <li>
                    <strong>保存更改</strong>
                    <p>完成編輯後，點擊「更新商人資訊」按鈕保存您的修改。</p>
                  </li>
                </ol>
                <div className="guide-tip">
                  <p>提示：當您更新商人資訊時，已將此商人物品加入購物車的用戶會收到通知，他們的購物車會自動更新以反映您的變更。</p>
                </div>
              </div>
            </div>
          )}
          
          {/* 使用購物車 */}
          {activeSection === 'cart' && (
            <div className="guide-section">
              <h2 className="guide-section-title">使用購物車</h2>
              <div className="guide-section-content">
                <p>購物車功能幫助您規劃購物並計算所需資源：</p>
                <ol className="guide-list numbered">
                  <li>
                    <strong>添加物品到購物車</strong>
                    <p>點擊商人物品卡片可將物品添加到購物車，再次點擊可以移除。</p>
                  </li>
                  <li>
                    <strong>查看購物車</strong>
                    <p>點擊畫面右下角的購物車圖標打開購物車。請注意，購物車圖標在登入頁面不會顯示。</p>
                  </li>
                  <li>
                    <strong>調整數量</strong>
                    <p>在購物車中可以使用「+」和「-」按鈕調整每個物品的購買數量，數量不能超過商人提供的可購入次數。</p>
                  </li>
                  <li>
                    <strong>查看總計</strong>
                    <p>購物車底部會顯示所需總計家園幣數量和所需交換材料及數量。</p>
                  </li>
                  <li>
                    <strong>清空購物車</strong>
                    <p>點擊「清空購物車」按鈕可以清空所有已添加的物品。</p>
                  </li>
                </ol>
                <div className="guide-tip">
                  <p>提示：如果商人資訊被更新或刪除，您的購物車會自動調整並顯示通知。購物車內容會在您登出後保存，下次登入時仍然可以看到。</p>
                </div>
              </div>
            </div>
          )}
          
          {/* 刪除商人資訊 */}
          {activeSection === 'delete' && (
            <div className="guide-section">
              <h2 className="guide-section-title">刪除商人資訊</h2>
              <div className="guide-section-content">
                <p>您可以刪除自己提交的商人資訊：</p>
                <ol className="guide-list numbered">
                  <li>
                    <strong>找到您的商人資訊</strong>
                    <p>在商人列表中找到您提交的商人（必須使用您提交時的相同遊戲名稱登入）。</p>
                  </li>
                  <li>
                    <strong>點擊刪除按鈕</strong>
                    <p>您提交的商人資訊卡片底部會顯示「刪除」按鈕，點擊後會彈出確認提示。</p>
                  </li>
                  <li>
                    <strong>確認刪除</strong>
                    <p>在確認提示中點擊「確認刪除」按鈕完成刪除操作。</p>
                  </li>
                </ol>
                <div className="guide-tip">
                  <p>提示：刪除商人資訊後，您可以在當天提交新的商人資訊。已將此商人物品加入購物車的用戶會收到通知，相關物品會自動從他們的購物車中移除。請注意，刪除操作無法撤銷。</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="guide-footer">
        系統將於每日台灣時間午夜 (00:00) 自動重置所有商人資訊，請及時查看和提交。
      </div>
    </div>
  );
};

export default UserGuide;