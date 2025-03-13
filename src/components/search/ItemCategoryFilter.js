import React, { useState } from 'react';

function ItemCategoryFilter({ onCategorySelect, selectedCategories }) {
  // State to track if the full category list is expanded
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Categories organized by groups
  const categoryGroups = [
    {
      name: '常用類別',
      items: ['全部', '女神', '風車', '貼紙', '戲劇舞台', '藍藍天空', '木質邊框', '奇思妙想', '貴族', '田園']
    },
    {
      name: '花園系列',
      items: [
        '嫣紅拱門', '嫣紅花圃', '嫣紅花壇', '嫣紅盆栽', '紫紅花圃',
        '湛藍方門', '湛藍花圃', '湛藍花壇', '湛藍盆栽',
        '明黃木門', '明黃花圃', '明黃花壇', '明黃盆栽'
      ]
    },
    {
      name: '家具系列',
      items: ['奇異果凳', '檸檬凳', '西瓜凳', '香橙凳']
    },
    {
      name: '圍欄系列',
      items: ['淺原木圍欄', '深原木圍欄', '白蠟木圍欄', '紅橡木圍欄', '淺灰尖頭圍欄', '淺藍尖頭圍欄']
    },
    {
      name: '食品原料',
      items: ['小麥', '玉米', '胡蘿蔔', '番茄', '甘蔗', '草莓', '雞蛋', '牛奶', '蜂蜜']
    },
    {
      name: '調味品',
      items: ['鮮奶油', '奶油', '起司', '砂糖', '方糖', '糖漿', '番茄醬', '披薩醬', '草莓醬', '魚露']
    },
    {
      name: '飲料及食品',
      items: [
        '胡蘿蔔汁', '番茄汁', '草莓鮮奶汁', '混合果汁',
        '小麵包', '玉米麵包', '曲奇餅',
        '鮮奶油霜淇淋', '玉米霜淇淋', '草莓霜淇淋', '奶油霜淇淋', 
        '鮮奶油蛋糕', '起司蛋糕', '胡蘿蔔蛋糕', '蜂蜜蛋糕', '草莓蛋糕',
        '田園披薩', '起司披薩', '水果披薩'
      ]
    },
    {
      name: '其他',
      items: ['家園幣']
    }
  ];

  // Create flat list of all categories for internal use
  const allCategories = categoryGroups.flatMap(group => group.items);
  
  // Only show the initial group when not expanded
  const visibleGroups = isExpanded ? categoryGroups : [categoryGroups[0]];

  // 處理類別的選擇和取消選擇
  const handleCategoryToggle = (category) => {
    // 如果點擊的是「全部」類別
    if (category === '全部') {
      // 如果目前已選擇「全部」，則取消所有選擇
      if (selectedCategories.includes('全部')) {
        onCategorySelect([]);
      } else {
        // 否則選擇「全部」，並取消其他所有選擇
        onCategorySelect(['全部']);
      }
      return;
    }
    
    // 處理其他類別的選擇
    let newSelectedCategories = [...selectedCategories];
    
    // 如果已經選擇了「全部」，需要先取消它
    if (newSelectedCategories.includes('全部')) {
      newSelectedCategories = newSelectedCategories.filter(c => c !== '全部');
    }
    
    // 切換當前類別的選擇狀態
    if (newSelectedCategories.includes(category)) {
      // 取消選擇
      newSelectedCategories = newSelectedCategories.filter(c => c !== category);
    } else {
      // 增加選擇
      newSelectedCategories.push(category);
    }
    
    // 如果沒有選擇任何類別，自動選擇「全部」
    if (newSelectedCategories.length === 0) {
      newSelectedCategories = ['全部'];
    }
    
    onCategorySelect(newSelectedCategories);
  };
  
  // Toggle expanded state
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="category-filter">
      <div className="category-filter-header">
        <h3>物品類別（可多選）</h3>
        <button 
          className="expand-toggle-btn"
          onClick={toggleExpand}
        >
          {isExpanded ? '收起分類 ▲' : '展開更多分類 ▼'}
        </button>
      </div>
      
      <div className="category-groups">
        {visibleGroups.map((group, groupIndex) => (
          <div key={groupIndex} className="category-group">
            {isExpanded && (
              <h4 className="group-name">{group.name}</h4>
            )}
            <div className="category-buttons">
              {group.items.map(category => (
                <button
                  key={category}
                  className={`category-button ${selectedCategories.includes(category) ? 'active' : ''}`}
                  onClick={() => handleCategoryToggle(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
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