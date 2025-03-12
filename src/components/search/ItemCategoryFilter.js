import React from 'react';

function ItemCategoryFilter({ onCategorySelect, selectedCategories }) {
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
    '家園幣', 
  ];

  const handleCategoryToggle = (category) => {
    if (category === '全部') {
      if (selectedCategories.includes('全部')) {
        onCategorySelect([]);
      } else {
        onCategorySelect(['全部']);
      }
      return;
    }
    
    let newSelectedCategories = [...selectedCategories];
    
    if (newSelectedCategories.includes('全部')) {
      newSelectedCategories = newSelectedCategories.filter(c => c !== '全部');
    }
    
    if (newSelectedCategories.includes(category)) {
      newSelectedCategories = newSelectedCategories.filter(c => c !== category);
    } else {
      newSelectedCategories.push(category);
    }
    
    if (newSelectedCategories.length === 0) {
      newSelectedCategories = ['全部'];
    }
    
    onCategorySelect(newSelectedCategories);
  };

  return (
    <div className="category-filter">
      <h3>物品類別（可多選）</h3>
      <div className="category-buttons">
        {categories.map(category => (
          <button
            key={category}
            className={`category-button ${selectedCategories.includes(category) ? 'active' : ''}`}
            onClick={() => handleCategoryToggle(category)}
          >
            {category}
          </button>
        ))}
      </div>
      <div className="selected-categories">
        {selectedCategories.length > 0 && selectedCategories[0] !== '全部' && (
          <p>已選擇: {selectedCategories.join(', ')}</p>
        )}
      </div>
    </div>
  );
}

export default ItemCategoryFilter;