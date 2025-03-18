import itemDatabase from '../data/ItemDatabase';

/**
 * Enhanced Utilities for parsing OCR text output specifically for Tree of Savior merchant data
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
  
  // Get all possible item names from the database
  const allItemNames = new Set(
    itemDatabase.categories
      .flatMap(category => category.items)
      .filter(item => item !== '其他' && item !== '家園幣')
  );
  
  // Split text into lines and clean it
  const lines = cleanAndSplitText(ocrText);
  
  // Initialize result structure
  const result = {
    merchantName: extractMerchantName(lines),
    discount: extractDiscount(lines),
    items: extractItems(lines, scanIndex, merchantType, allItemNames)
  };
  
  return result;
};

/**
 * Clean OCR text and split into useful lines
 * @param {string} text - Raw OCR text
 * @returns {Array<string>} - Array of cleaned text lines
 */
const cleanAndSplitText = (text) => {
  // Split by newlines and remove empty lines
  const rawLines = text.split(/\n/);
  
  // Clean, trim, and filter lines
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
  return '未知商人'; // Default merchant name
};

/**
 * Extract discount information from OCR text lines
 * @param {Array<string>} lines - OCR text lines
 * @returns {string} - Extracted discount
 */
const extractDiscount = (lines) => {
  // Look for lines with percentage symbols
  const discountLines = lines.filter(line => line.includes('%'));
  
  // Extract the first discount value
  const discountMatch = discountLines.map(line => {
    const percentMatch = line.match(/(-\d+%)/);
    return percentMatch ? percentMatch[1] : null;
  }).find(match => match);
  
  return discountMatch || '';
};

/**
 * Extract quantity from a line about purchase limits
 * @param {string} line - Line containing purchase limit
 * @returns {number} - Extracted quantity
 */
const extractQuantity = (line) => {
  const match = line.match(/本攤位可購[:：]?(\d+)/);
  return match ? parseInt(match[1]) : 1;
};

/**
 * Extract price from a line
 * @param {string} line - Line containing price
 * @returns {number} - Extracted price
 */
const extractPrice = (line) => {
  // Look for price with 家園幣
  const coinMatch = line.match(/(\d+)\s*家園幣/);
  return coinMatch ? parseInt(coinMatch[1]) : '';
};

/**
 * Extract quantity from an item line
 * @param {string} line - Line containing item and potential quantity
 * @returns {number} - Extracted quantity or 1 as default
 */
const extractItemQuantity = (line) => {
  // Look for standalone numeric values that could represent quantity
  const quantityMatch = line.match(/^(\d+)$/);
  return quantityMatch ? parseInt(quantityMatch[1]) : 1;
};

/**
 * Extract items from OCR text lines
 * @param {Array<string>} lines - OCR text lines
 * @param {number} scanIndex - Current scan index
 * @param {string} merchantType - Type of merchant
 * @param {Set} allItemNames - Set of all valid item names
 * @returns {Array<Object>} - Extracted item objects
 */
const extractItems = (lines, scanIndex, merchantType, allItemNames) => {
  const items = [];
  const maxItems = (merchantType === 'special' && scanIndex === 2) ? 3 : 6;
  
  // Prepare context for parsing
  const context = {
    itemLines: [],
    quantityLines: [],
    priceLines: [],
    homeTokenLines: []
  };

  // First pass: categorize lines
  lines.forEach(line => {
    if (line.includes('家園幣')) {
      context.homeTokenLines.push(line);
    } else if ([...allItemNames].some(itemName => line.includes(itemName))) {
      context.itemLines.push(line);
    } else if (line.match(/^(\d+)$/)) {
      context.quantityLines.push(line);
    } else if (line.match(/\d+\s*家園幣/)) {
      context.priceLines.push(line);
    }
  });

  // Find items by matching with database names
  const extractedItems = context.itemLines.map((itemLine, index) => {
    // Find the exact item name
    const matchedItem = [...allItemNames].find(itemName => 
      itemLine.includes(itemName)
    );

    // Try to find corresponding quantity and price
    const quantityMatch = context.quantityLines[index] || 
      lines.find(l => l.includes('本攤位可購') && l.includes(matchedItem));
    const priceMatch = context.priceLines[index];

    const quantity = quantityMatch ? 
      extractItemQuantity(quantityMatch.toString()) : 1;
    
    const purchaseTimes = lines.find(l => l.includes('本攤位可購')) ? 
      extractQuantity(lines.find(l => l.includes('本攤位可購'))) : quantity;

    const price = priceMatch ? 
      extractPrice(priceMatch) : '';
    
    return {
      category: matchedItem,
      quantity: 1,
      purchaseTimes: purchaseTimes,
      price: price,
      allowsCoinExchange: !!price,
      allowsBarterExchange: false,
      exchangeItemName: '',
      exchangeQuantity: ''
    };
  });

  // Handle home tokens separately
  const homeTokenItems = context.homeTokenLines.map(line => {
    const priceMatch = line.match(/(\d+)\s*家園幣/);
    const quantityMatch = line.match(/本攤位可購[:：]?(\d+)/);
    
    return {
      category: '家園幣',
      quantity: 1,
      purchaseTimes: quantityMatch ? parseInt(quantityMatch[1]) : 1,
      price: '',
      allowsCoinExchange: false,
      allowsBarterExchange: true,
      exchangeItemName: '蜂蜜',
      exchangeQuantity: 10
    };
  });
  
  // Combine and ensure correct number of items
  const combinedItems = [...extractedItems, ...homeTokenItems];
  
  // Pad with empty items if needed
  while (combinedItems.length < maxItems) {
    combinedItems.push({
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
  
  return combinedItems.slice(0, maxItems);
};