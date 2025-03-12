import React from 'react';

function ItemCategoryFilter({ onCategorySelect, selectedCategory }) {
  // Categories list from the image
  const categories = [
    '全部', // All categories
    '女神', 
    '風車', 
    '貼紙', 
    '戲劇舞台',
    '藍藍天空',
    '木質邊框',
    '奇思妙想', 
    '貴族',
    '田園',
    '嫣紅拱門',
    '嫣紅花圃',
    '嫣紅花壇',
    '嫣紅盆栽',
    '紫紅花圃',
    '湛藍方門',
    '湛藍花圃',
    '湛藍花壇',
    '湛藍盆栽',
    '明黃木門',
    '明黃花圃',
    '明黃花壇',
    '明黃盆栽',
    '奇異果凳',
    '檸檬凳',
    '西瓜凳',
    '香橙凳',
    '淺原木圍欄',
    '深原木圍欄',
    '白蠟木圍欄',
    '紅橡木圍欄',
    '淺灰尖頭圍欄',
    '淺藍尖頭圍欄',
    '家園幣 $1000', 
    '家園幣 $1200', 
    '家園幣 $1500', 
  ];

  return (
    <div className="category-filter">
      <h3>物品類別</h3>
      <div className="category-buttons">
        {categories.map(category => (
          <button
            key={category}
            className={`category-button ${selectedCategory === category ? 'active' : ''}`}
            onClick={() => onCategorySelect(category)}
          >
            {category}
          </button>
        ))}
      </div>
    </div>
  );
}

export default ItemCategoryFilter;