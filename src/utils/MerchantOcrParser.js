/**
 * Utilities for parsing OCR text output specifically for Tree of Savior merchant data
 */

/**
 * Main parser function for OCR text from merchant screenshots
 * @param {string} ocrText - Raw text from OCR
 * @param {number} scanIndex - Current scan index (1 or 2)
 * @param {string} merchantType - Type of merchant ('regular' or 'special')
 * @returns {Object} - Structured merchant data
 */
export const parseMerchantOcrText = (ocrText, scanIndex, merchantType) => {
    console.log('Parsing merchant OCR text:', ocrText);
    
    // Split text into lines and clean it
    const lines = cleanAndSplitText(ocrText);
    
    // Initialize result structure
    const result = {
      merchantName: extractMerchantName(lines),
      discount: extractDiscount(lines),
      items: extractItems(lines, scanIndex, merchantType)
    };
    
    return result;
  };
  
  /**
   * Clean OCR text and split into useful lines
   * @param {string} text - Raw OCR text
   * @returns {Array<string>} - Array of cleaned text lines
   */
  const cleanAndSplitText = (text) => {
    // Split by newlines
    const rawLines = text.split('\n');
    
    // Clean and filter lines
    return rawLines
      .map(line => line.trim())
      .filter(line => line.length > 0);
  };
  
  /**
   * Extract merchant name from OCR text lines
   * @param {Array<string>} lines - OCR text lines
   * @returns {string} - Extracted merchant name
   */
  const extractMerchantName = (lines) => {
    // Merchant name is usually at the top of the interface
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      const line = lines[i];
      
      // Look for lines that might be merchant names
      if (
        (line.includes('商人') || line.includes('商店')) || 
        (line.match(/[A-Za-z0-9_]+/) && !line.includes('家園幣') && !line.includes('x') && !line.includes('×'))
      ) {
        return line.trim();
      }
    }
    
    return '未知商人'; // Default if no name found
  };
  
  /**
   * Extract discount information from OCR text lines
   * @param {Array<string>} lines - OCR text lines
   * @returns {string} - Extracted discount
   */
  const extractDiscount = (lines) => {
    // Look for discount information in all lines
    for (const line of lines) {
      if (line.includes('折扣') || line.includes('減免') || line.includes('%')) {
        // Extract numeric discount value with % sign
        const discountMatch = line.match(/([0-9%-]+%)/);
        if (discountMatch) {
          return discountMatch[1];
        }
        
        // Try extracting just numbers near discount text
        const numericMatch = line.match(/折扣[：:]\s*([0-9-]+)/);
        if (numericMatch) {
          return numericMatch[1] + '%';
        }
      }
    }
    
    return ''; // No discount found
  };
  
  /**
   * Extract items from OCR text lines
   * @param {Array<string>} lines - OCR text lines
   * @param {number} scanIndex - Current scan index
   * @param {string} merchantType - Type of merchant
   * @returns {Array<Object>} - Extracted item objects
   */
  const extractItems = (lines, scanIndex, merchantType) => {
    const items = [];
    const maxItems = (merchantType === 'special' && scanIndex === 2) ? 3 : 6;
    
    // Track the current item as we parse through lines
    let currentItem = null;
    
    // Common item name patterns
    const itemNameRegex = /([\u4e00-\u9fa5A-Za-z0-9_]+)\s*[xX×]?\s*(\d+)/;
    const priceRegex = /(\d+)\s*(家園幣|園幣|家園|金幣)/i;
    const exchangeRegex = /(\d+)\s*([\u4e00-\u9fa5A-Za-z0-9_]+)/;
    
    // Process each line to look for items and related info
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip very short lines
      if (line.length < 2) continue;
      
      // Skip UI elements commonly found in screenshots
      if (isUiElement(line)) continue;
      
      // Check if line contains an item name with quantity
      const itemMatch = line.match(itemNameRegex);
      if (itemMatch) {
        // If we were tracking a previous item, add it to our list before starting a new one
        if (currentItem && currentItem.category) {
          items.push(currentItem);
          
          // Check if we've reached our item limit
          if (items.length >= maxItems) break;
        }
        
        // Extract item name and quantity
        const itemName = cleanItemName(itemMatch[1]);
        const quantity = itemMatch[2];
        
        // Skip if item name looks like a UI element
        if (isUiElement(itemName)) continue;
        
        // Create a new item object
        currentItem = {
          category: itemName,
          quantity: quantity,
          purchaseTimes: quantity, // Default to quantity
          price: '',
          allowsCoinExchange: false,
          allowsBarterExchange: false,
          exchangeItemName: '',
          exchangeQuantity: ''
        };
        
        // For second scan of special merchants, ensure items are 家園幣
        if (merchantType === 'special' && scanIndex === 2) {
          currentItem.category = '家園幣';
          currentItem.allowsBarterExchange = true;
        }
      } 
      // Check if line contains price information
      else if (currentItem && !currentItem.allowsCoinExchange && !currentItem.allowsBarterExchange) {
        const priceMatch = line.match(priceRegex);
        if (priceMatch) {
          currentItem.price = priceMatch[1];
          currentItem.allowsCoinExchange = true;
          continue;
        }
        
        // Check if line contains exchange item information
        const exchangeMatch = line.match(exchangeRegex);
        if (exchangeMatch && !line.includes('家園幣') && !line.includes('金幣')) {
          const exchangeItemName = cleanItemName(exchangeMatch[2]);
          
          // Only use if it looks like a valid item name
          if (exchangeItemName.length >= 2 && !isUiElement(exchangeItemName)) {
            currentItem.allowsBarterExchange = true;
            currentItem.exchangeQuantity = exchangeMatch[1];
            currentItem.exchangeItemName = exchangeItemName;
          }
        }
      }
    }
    
    // Add the last item if we have one pending
    if (currentItem && currentItem.category && items.length < maxItems) {
      items.push(currentItem);
    }
    
    // Make sure we have the right exchange methods set
    items.forEach(item => {
      // If no exchange method was found, default to coin exchange for regular items
      if (!item.allowsCoinExchange && !item.allowsBarterExchange) {
        if (item.category === '家園幣') {
          item.allowsBarterExchange = true;
        } else {
          item.allowsCoinExchange = true;
          // Provide a default price if none detected
          if (!item.price) item.price = '1000';
        }
      }
      
      // Special merchants with 家園幣 items in second scan
      if ((merchantType === 'special' && scanIndex === 2) || item.category === '家園幣') {
        item.category = '家園幣';
        item.allowsCoinExchange = false;
        item.allowsBarterExchange = true;
        
        // Add default exchange values if none detected
        if (!item.exchangeItemName) {
          item.exchangeItemName = '蜂蜜';
          item.exchangeQuantity = '10';
        }
      }
    });
    
    // Ensure we have the expected number of items
    while (items.length < maxItems) {
      // Add template items based on merchant type and scan
      if (merchantType === 'special' && scanIndex === 2) {
        items.push({
          category: '家園幣',
          quantity: '1000',
          purchaseTimes: '1',
          price: '',
          allowsCoinExchange: false,
          allowsBarterExchange: true,
          exchangeItemName: '蜂蜜',
          exchangeQuantity: '10'
        });
      } else {
        items.push({
          category: '',
          quantity: '',
          purchaseTimes: '',
          price: '',
          allowsCoinExchange: true,
          allowsBarterExchange: false,
          exchangeItemName: '',
          exchangeQuantity: ''
        });
      }
    }
    
    return items.slice(0, maxItems);
  };
  
  /**
   * Check if a string appears to be a UI element rather than an item
   * @param {string} text - Text to check
   * @returns {boolean} - True if it appears to be a UI element
   */
  const isUiElement = (text) => {
    const uiElements = [
      '確認', '取消', '關閉', '返回', '選擇', '購買', '販售', '信息', '信息',
      '貨品', '商店', '家園', '確定', '按鈕', '確認', '頁', '頁碼'
    ];
    
    return uiElements.some(el => text.includes(el)) || 
           text.length <= 1 ||
           text.match(/^\d+$/) !== null; // Just a number
  };
  
  /**
   * Clean item name from OCR artifacts
   * @param {string} name - Raw item name from OCR
   * @returns {string} - Cleaned item name
   */
  const cleanItemName = (name) => {
    // Remove any numeric prefix or suffix that might have been incorrectly parsed
    let cleaned = name.replace(/^\d+\s*/, '').replace(/\s*\d+$/, '');
    
    // Remove common OCR artifacts
    cleaned = cleaned.replace(/[,.;:'"!?\/\\|_-]+$/, '');
    
    // Handle special cases
    if (cleaned.includes('家園') && cleaned.includes('幣')) {
      return '家園幣';
    }
    
    return cleaned.trim();
  }