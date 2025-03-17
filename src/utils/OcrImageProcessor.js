// OCR image preprocessing utilities
// This module provides functions to enhance images for better OCR recognition

/**
 * Preprocesses an image for better OCR text recognition
 * @param {string} imageDataUrl - Base64 data URL of the image
 * @returns {Promise<string>} - Processed image as data URL
 */
export const preprocessImageForOcr = async (imageDataUrl) => {
    return new Promise((resolve, reject) => {
      try {
        const img = new Image();
        img.onload = () => {
          // Create canvas for image manipulation
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Set canvas dimensions to match image
          canvas.width = img.width;
          canvas.height = img.height;
          
          // Draw original image to canvas
          ctx.drawImage(img, 0, 0);
          
          // Get image data for processing
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          
          // Apply image enhancements
          applyImageEnhancements(data, canvas.width, canvas.height);
          
          // Put enhanced image data back to canvas
          ctx.putImageData(imageData, 0, 0);
          
          // Convert canvas to data URL
          const processedImageUrl = canvas.toDataURL('image/jpeg', 0.9);
          resolve(processedImageUrl);
        };
        
        img.onerror = (error) => {
          reject(new Error('Failed to load image for preprocessing'));
        };
        
        img.src = imageDataUrl;
      } catch (error) {
        reject(error);
      }
    });
  };
  
  /**
   * Apply various image enhancements to improve OCR text recognition
   * @param {Uint8ClampedArray} data - Image data array
   * @param {number} width - Image width
   * @param {number} height - Image height
   */
  const applyImageEnhancements = (data, width, height) => {
    // 1. Increase contrast
    increaseContrast(data, 30);
    
    // 2. Convert to grayscale
    convertToGrayscale(data);
    
    // 3. Apply thresholding for cleaner text
    applyThreshold(data, 140);
    
    // 4. Denoise
    denoise(data, width, height);
  };
  
  /**
   * Increases contrast of the image
   * @param {Uint8ClampedArray} data - Image data array
   * @param {number} factor - Contrast factor
   */
  const increaseContrast = (data, factor) => {
    const factor_ = (259 * (factor + 255)) / (255 * (259 - factor));
    
    for (let i = 0; i < data.length; i += 4) {
      data[i] = truncate(factor_ * (data[i] - 128) + 128);      // R
      data[i + 1] = truncate(factor_ * (data[i + 1] - 128) + 128); // G
      data[i + 2] = truncate(factor_ * (data[i + 2] - 128) + 128); // B
      // Alpha channel remains unchanged
    }
  };
  
  /**
   * Truncates color value to valid range (0-255)
   * @param {number} value - Color value
   * @returns {number} - Truncated color value
   */
  const truncate = (value) => {
    return value < 0 ? 0 : value > 255 ? 255 : value;
  };
  
  /**
   * Converts image to grayscale
   * @param {Uint8ClampedArray} data - Image data array
   */
  const convertToGrayscale = (data) => {
    for (let i = 0; i < data.length; i += 4) {
      const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
      data[i] = avg;     // R
      data[i + 1] = avg; // G
      data[i + 2] = avg; // B
      // Alpha channel remains unchanged
    }
  };
  
  /**
   * Applies threshold to convert grayscale image to binary
   * @param {Uint8ClampedArray} data - Image data array
   * @param {number} threshold - Threshold value (0-255)
   */
  const applyThreshold = (data, threshold) => {
    for (let i = 0; i < data.length; i += 4) {
      const value = data[i] < threshold ? 0 : 255;
      data[i] = value;     // R
      data[i + 1] = value; // G
      data[i + 2] = value; // B
      // Alpha channel remains unchanged
    }
  };
  
  /**
   * Simple 3x3 median filter to reduce noise
   * @param {Uint8ClampedArray} data - Image data array
   * @param {number} width - Image width
   * @param {number} height - Image height
   */
  const denoise = (data, width, height) => {
    // Create a copy of the image data for reference
    const tempData = new Uint8ClampedArray(data.length);
    for (let i = 0; i < data.length; i++) {
      tempData[i] = data[i];
    }
    
    // Apply 3x3 median filter
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        for (let c = 0; c < 3; c++) { // Process each color channel
          const idx = (y * width + x) * 4 + c;
          
          // Get 3x3 neighborhood values
          const neighbors = [];
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              const neighborIdx = ((y + dy) * width + (x + dx)) * 4 + c;
              neighbors.push(tempData[neighborIdx]);
            }
          }
          
          // Sort and get median value
          neighbors.sort((a, b) => a - b);
          data[idx] = neighbors[4]; // Median of 9 values is at index 4
        }
        // Alpha channel remains unchanged
      }
    }
  };