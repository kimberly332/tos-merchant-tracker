// src/components/search/SearchWithSuggestions.js
import React, { useState, useEffect, useRef } from 'react';
import itemDatabase from '../../data/ItemDatabase';

// 搜尋提示組件
const SearchWithSuggestions = ({ 
  onSearch, 
  placeholder = "搜尋物品...",
  maxSuggestions = 8,
  initialValue = '',
  useRealTimeItems = false, // 新增參數，用來決定是否使用實時物品 
  allItems = [] // 實時物品清單 (如果啟用)
}) => {
  const [searchTerm, setSearchTerm] = useState(initialValue);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const [databaseItems] = useState(itemDatabase.getAllItems()); // 從資料庫中獲取所有物品
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  // 選擇使用哪個資料來源
  const itemsToUse = useRealTimeItems ? allItems : databaseItems;

  // 當搜尋詞變化時，更新建議列表
  useEffect(() => {
    if (searchTerm.trim().length === 0) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // 過濾匹配的關鍵詞
    const filteredItems = itemsToUse
      .filter(item => 
        item.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .slice(0, maxSuggestions); // 限制建議數量

    setSuggestions(filteredItems);
    setShowSuggestions(true);
    setActiveSuggestion(-1); // 重置選中的建議
  }, [searchTerm, itemsToUse, maxSuggestions]);

  // 關閉建議列表的點擊外部處理
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target) &&
        !inputRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 處理搜尋輸入變化
  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
  };

  // 處理提交搜尋
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // 如果當前有選中的建議並按下Enter
    if (activeSuggestion >= 0 && activeSuggestion < suggestions.length) {
      const selectedTerm = suggestions[activeSuggestion];
      setSearchTerm(selectedTerm);
      onSearch(selectedTerm);
    } else {
      onSearch(searchTerm);
    }
    
    setShowSuggestions(false);
  };

  // 處理選擇建議項
  const handleSuggestionClick = (suggestion) => {
    setSearchTerm(suggestion);
    onSearch(suggestion);
    setShowSuggestions(false);
    inputRef.current.focus();
  };

  // 處理鍵盤導航
  const handleKeyDown = (e) => {
    // 向下箭頭
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSuggestion(prev => 
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    }
    // 向上箭頭
    else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSuggestion(prev => prev > 0 ? prev - 1 : 0);
    }
    // Escape 鍵
    else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
    // Enter 鍵在 handleSubmit 中處理
  };

  // 聚焦輸入框時顯示建議
  const handleFocus = () => {
    if (searchTerm.trim().length > 0 && suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  return (
    <div className="search-with-suggestions">
      <form onSubmit={handleSubmit} className="search-form">
        <div className="search-input-container">
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            placeholder={placeholder}
            className="search-input"
            autoComplete="off"
          />
          <button type="submit" className="search-button">
            搜尋
          </button>
        </div>
      </form>

      {showSuggestions && suggestions.length > 0 && (
        <ul ref={suggestionsRef} className="suggestions-list">
          {suggestions.map((suggestion, index) => (
            <li
              key={index}
              className={`suggestion-item ${index === activeSuggestion ? 'active' : ''}`}
              onClick={() => handleSuggestionClick(suggestion)}
              onMouseEnter={() => setActiveSuggestion(index)}
            >
              <span 
                dangerouslySetInnerHTML={{ 
                  __html: highlightMatch(suggestion, searchTerm) 
                }} 
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// 高亮顯示匹配的文字
const highlightMatch = (text, query) => {
  if (!query.trim()) return text;
  
  const regex = new RegExp(`(${query.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi');
  return text.replace(regex, '<strong>$1</strong>');
};

export default SearchWithSuggestions;