// src/data/ItemDatabase.js
// 系統中所有可能的物品資料庫

const itemDatabase = {
  // 所有物品類別和物品
  categories: [
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
  ],
  
  // 伺服器名稱清單
  servers: [
    { id: 'morning_harbor', name: '晨曦海港' },
    { id: 'endless_seas', name: '無盡海域' },
    { id: 'harbor_lights', name: '港灣燈火' },
    { id: 'whisper_beach', name: '輕語海灘' },
    { id: 'narrow_coast', name: '狹長海岸' },
    { id: 'sea_breeze_pier', name: '海風碼頭' },
    { id: 'summer_shallows', name: '盛夏淺灘' },
    { id: 'winter_warmth_snow_route', name: '冬日暖屋&覆雪之路' },
    { id: 'snow_traveler_winter_lake', name: '雪夜旅人&冬湖冰泉' },
    { id: 'cargo_bay_sunshine_orchard', name: '貨運海灣&陽光果叢' },
    { id: 'forest_hill_sunlit_path_dense_canyon', name: '林中山丘&沐光小徑&密林峽谷' },
    { id: 'valley_sunset_mountain_trail_canyon_spring', name: '谷間餘暉&山嶺古道&峽谷清泉' },
    { id: 'ancient_exploration_dark_cave_trial_path', name: '尋覓古跡&幽暗地洞&試煉之路' }
  ],
  
  // 交換物品分類 - 這是用於以物易物交換的選項
  exchangeCategories: [
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
      name: '其他物品',
      items: [
        '家園幣',
        '其他'
      ]
    }
  ],
  
  // 獲取所有物品的扁平清單
  getAllItems: function() {
    const allItems = [];
    
    // 添加所有物品
    this.categories.forEach(category => {
      if (category.name !== '常用類別') {  // 跳過常用類別，因為它們不是實際物品
        category.items.forEach(item => {
          allItems.push(item);
        });
      }
    });
    
    // 移除重複項並排序
    return [...new Set(allItems)].sort();
  },
  
  // 獲取所有交換物品的扁平清單
  getAllExchangeItems: function() {
    const allItems = [];
    
    // 從交換物品類別中添加所有物品
    this.exchangeCategories.forEach(category => {
      category.items.forEach(item => {
        allItems.push(item);
      });
    });
    
    // 移除重複項並排序
    return [...new Set(allItems)].sort();
  },
  
  // 獲取伺服器名稱的映射表
  getServerMap: function() {
    const serverMap = {};
    this.servers.forEach(server => {
      serverMap[server.id] = server.name;
    });
    return serverMap;
  }
};

export default itemDatabase;