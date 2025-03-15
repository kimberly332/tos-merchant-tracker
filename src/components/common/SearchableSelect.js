// src/components/common/SearchableSelect.js
import React, { useState, useRef, useEffect } from 'react';

const SearchableSelect = ({ 
  options, 
  groups,
  value, 
  onChange, 
  placeholder = '請選擇...',
  id,
  name,
  required = false,
  showIcons = false, // New prop to toggle icon display
  iconPath = '/icons/' // Default path to icons
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredOptions, setFilteredOptions] = useState([]);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);
  const hiddenInputRef = useRef(null);

  // Initialize filtered options
  useEffect(() => {
    if (groups) {
      // If groups are provided, flatten all options
      const allOptions = [];
      groups.forEach(group => {
        if (group.items && Array.isArray(group.items)) {
          allOptions.push(...group.items);
        }
      });
      setFilteredOptions(allOptions);
    } else {
      setFilteredOptions(options || []);
    }
  }, [options, groups]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle search input
  const handleSearchChange = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    
    if (groups) {
      // Search through all groups
      const results = [];
      groups.forEach(group => {
        if (group.items && Array.isArray(group.items)) {
          const matchingItems = group.items.filter(
            item => item.toLowerCase().includes(term.toLowerCase())
          );
          results.push(...matchingItems);
        }
      });
      setFilteredOptions(results);
    } else {
      // Search directly in options list
      setFilteredOptions(
        options.filter(option => 
          option.toLowerCase().includes(term.toLowerCase())
        )
      );
    }
  };

  // Handle option selection
  const handleOptionSelect = (option) => {
    onChange(option);
    setIsOpen(false);
    setSearchTerm('');
    
    // Reset filtered results
    if (groups) {
      const allOptions = [];
      groups.forEach(group => {
        if (group.items && Array.isArray(group.items)) {
          allOptions.push(...group.items);
        }
      });
      setFilteredOptions(allOptions);
    } else {
      setFilteredOptions(options);
    }
    
    // Trigger validation if needed
    if (hiddenInputRef.current) {
      hiddenInputRef.current.dispatchEvent(new Event('change', { bubbles: true }));
    }
  };

  // Toggle dropdown
  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      // Focus search input when opening
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    }
  };

  // Get the icon path for an option
  const getIconPath = (option) => {
    // Check if the option is a valid item that should have an icon
    const itemCategories = [
      // Categories
      '原料', '加工品', '礦產', '礦產與素材', '果品', '果品與海產', '海產',
      
      // 原料
      '小麥', '玉米', '胡蘿蔔', '番茄', '甘蔗', '草莓', '雞蛋', '牛奶', '蜂蜜',
      
      // 加工品 - complete list from your reference
      '小麵包', '玉米麵包', '曲奇餅', '鮮奶油', '奶油', '起司',
      '胡蘿蔔汁', '蕃茄汁', '番茄汁', '草莓鮮奶汁', '混合果汁',
      '番茄醬', '披薩醬', '草莓醬', '魚露',
      '砂糖', '方糖', '糖漿',
      '玉米霜淇淋', '奶油霜淇淋', '草莓霜淇淋', '鮮奶油霜淇淋',
      '鮮奶油蛋糕', '胡蘿蔔蛋糕', '起司蛋糕', '蜂蜜蛋糕', '草莓蛋糕',
      '田園披薩', '起司披薩', '水果披薩', '海鮮披薩',
      
      // 礦產
      '燃火黏土', '幽藍黏土', '耐火黏土', '赤晶石', '赤鐵礦', '蒼天石', '夜鐵礦',
      '赤紅樹脂', '黏性樹脂',
      
      // 果品與海產
      '黃金汁液', '緋紅汁液', '濃綢汁液', '百里香', '阿奇米果', '高嶺樹果', '飛雲菇',
      '智慧香精', '暗紫香精', '海結晶', '胸棘鯛魚', '利齒蛤蜊', '魔龍鱒', '丁香龍蝦'
    ];
    
    // Only return an icon path if this option should have an icon
    if (itemCategories.includes(option)) {
      return `${iconPath}${option}.png`;
    }
    
    return null;
  };

  // Render grouped options
  const renderGroupedOptions = () => {
    if (!groups || !Array.isArray(groups)) return null;

    return groups.map((group, groupIndex) => {
      // Only show groups with matching options
      const matchingItems = group.items.filter(item => 
        filteredOptions.includes(item)
      );
      
      if (matchingItems.length === 0) return null;
      
      return (
        <div key={groupIndex} className="option-group">
          <div className="group-header">{group.name}</div>
          {matchingItems.map((item, itemIndex) => (
            <div 
              key={`${groupIndex}-${itemIndex}`}
              className={`option ${value === item ? 'selected' : ''}`}
              onClick={() => handleOptionSelect(item)}
            >
              {showIcons && (
                <div className="option-icon-container">
                  {getIconPath(item) ? (
                    <img 
                      src={getIconPath(item)} 
                      alt="" 
                      className="option-icon"
                      onError={(e) => {
                        e.target.style.display = 'none'; // Hide broken images
                      }}
                    />
                  ) : (
                    <div className="option-icon-placeholder"></div>
                  )}
                </div>
              )}
              <span className="option-text">{item}</span>
            </div>
          ))}
        </div>
      );
    });
  };

  // Render options list
  const renderOptions = () => {
    if (groups && Array.isArray(groups)) {
      return renderGroupedOptions();
    }
    
    return filteredOptions.map((option, index) => (
      <div 
        key={index}
        className={`option ${value === option ? 'selected' : ''}`}
        onClick={() => handleOptionSelect(option)}
      >
        {showIcons && (
          <div className="option-icon-container">
            {getIconPath(option) ? (
              <img 
                src={getIconPath(option)} 
                alt="" 
                className="option-icon"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            ) : (
              <div className="option-icon-placeholder"></div>
            )}
          </div>
        )}
        <span className="option-text">{option}</span>
      </div>
    ));
  };

  return (
    <div className="searchable-select-container" ref={dropdownRef}>
      <div 
        className={`select-display ${isOpen ? 'open' : ''} ${showIcons ? 'with-icon' : ''}`}
        onClick={toggleDropdown}
      >
        {showIcons && value && getIconPath(value) && (
          <img 
            src={getIconPath(value)} 
            alt="" 
            className="selected-icon"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        )}
        <span className={value ? 'has-value' : 'placeholder'}>
          {value || placeholder}
        </span>
        <span className="select-arrow">▼</span>
      </div>
      
      {isOpen && (
        <div className="dropdown">
          <div className="search-container">
            <input
              ref={inputRef}
              type="text"
              placeholder="搜尋..."
              value={searchTerm}
              onChange={handleSearchChange}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="options-container">
            {filteredOptions.length > 0 ? (
              renderOptions()
            ) : (
              <div className="no-results">沒有符合的選項</div>
            )}
          </div>
        </div>
      )}
      
      {/* Hidden but accessible input for validation */}
      <input
        ref={hiddenInputRef}
        type="text"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        style={{ 
          width: '1px',
          height: '1px',
          opacity: 0,
          position: 'absolute',
          left: '-9999px',
          // Don't use display: none, which would make it not focusable
        }}
        id={id}
        name={name}
        required={required}
        aria-hidden="true"
        tabIndex={-1} // Make it focusable for form validation
      />
    </div>
  );
};

export default SearchableSelect;