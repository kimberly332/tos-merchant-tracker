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
  required = false
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
              {item}
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
        {option}
      </div>
    ));
  };

  return (
    <div className="searchable-select-container" ref={dropdownRef}>
      <div 
        className={`select-display ${isOpen ? 'open' : ''}`}
        onClick={toggleDropdown}
      >
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