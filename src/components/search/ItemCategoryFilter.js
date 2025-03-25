import React, { useState } from 'react';

function ItemCategoryFilter({ onCategorySelect, selectedCategories }) {
  // State to track if the full category list is expanded
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Categories organized by groups
  const categoryGroups = [
    {
      name: '常用類別',
      items: ['全部', '家園幣', '原料', '加工品', '礦產', '果品', '海產', '樹脂']
    },
    {
      name: '原料',
      items: [
        '小麥', '玉米', '胡蘿蔔', '番茄', '甘蔗', '草莓', '雞蛋', '牛奶', '蜂蜜'
      ]
    },
    {
      name: '加工品',
      items: [
        '小麵包', '玉米麵包', '曲奇餅', '鮮奶油', '奶油', '起司',
        '胡蘿蔔汁', '番茄汁', '草莓鮮奶汁', '混合果汁',
        '番茄醬', '披薩醬', '草莓醬', '魚露',
        '砂糖', '方糖', '糖漿',
        '玉米霜淇淋', '奶油霜淇淋', '草莓霜淇淋', '鮮奶油霜淇淋',
        '鮮奶油蛋糕', '胡蘿蔔蛋糕', '起司蛋糕', '蜂蜜蛋糕', '草莓蛋糕',
        '田園披薩', '起司披薩', '水果披薩', '海鮮披薩'
      ]
    },
    {
      name: '礦產',
      items: [
        '燃火黏土', '幽藍黏土', '耐火黏土', '赤晶石', '赤鐵礦', '蒼天石', '夜鐵礦'
      ]
    },
    {
      name: '果品',
      items: [
        '黃金汁液', '緋紅汁液', '濃綢汁液', '百里香', '阿奇米果', '高嶺樹果', '飛雲菇'
      ]
    },
    {
      name: '海產',
      items: [
        '智慧香精', '暗紫香精', '海結晶', '胸棘鯛魚', '利齒蛤蜊', '魔龍鱒', '丁香龍蝦'
      ]
    },
    {
      name: '樹脂',
      items: [
        '赤紅樹脂', '黏性樹脂'
      ]
    },
    {
      name: '家園五商內容物',
      items: [
        '諾恩女神像', '塔樓風車', '貼紙'
      ]
    },
    {
      name: '底板',
      items: [
        '戲劇舞臺', '藍藍天空'
      ]
    },
    {
      name: '邊框',
      items: [
        '木質相框', '奇妙思想'
      ]
    },
    {
      name: '田園系列',
      items: [
        '田園圓桌', '田園竹椅', '田園陽傘'
      ]
    },
    {
      name: '貴族系列',
      items: [
        '貴族圓桌', '貴族椅子', '貴族陽傘'
      ]
    },
    {
      name: '水果凳',
      items: [
        '小小檸檬凳', '小小奇異果凳', '小小西瓜凳', '小小香橙凳'
      ]
    },
    {
      name: '湛藍系列',
      items: [
        '湛藍方門', '湛藍薰衣草花圃', '湛藍花壇', '湛藍盆栽'
      ]
    },
    {
      name: '嫣紅系列',
      items: [
        '嫣紅拱門', '嫣紅鬱金香花圃', '嫣紅花壇', '嫣紅盆栽', '紫紅薰衣草花圃'
      ]
    },
    {
      name: '明黃系列',
      items: [
        '明黃木門', '明黃鬱金香花圃', '明黃花壇', '明黃盆栽'
      ]
    },
    {
      name: '圍欄',
      items: [
        '白蠟木庭院圍欄', '紅橡木庭院圍欄', '淺灰尖頭圍欄', '淺藍尖頭圍欄', '淺色原木圍欄', '深色原木圍欄'
      ]
    },
    {
      name: '其他物品',
      items: [
        '家園幣',
        '其他'
      ]
    }
  ];
  
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