// src/utils/GoogleVisionProcessor.js
import { parseMerchantOcrText } from './MerchantOcrParser';

// Function to process an image with Google Cloud Vision API
export const processImageWithVision = async (imageData) => {
  try {
    // Your deployed function URL
    const apiUrl = 'https://console.firebase.google.com/project/tos-merchant-tracker/overview';

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ imageData })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OCR service error: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    return result.text;
  } catch (error) {
    console.error('Error processing image with OCR service:', error);
    throw error;
  }
};

// Alternative direct approach using a proxy server or Cloud Function
async function tryDirectVisionAPI(base64Image) {
  // Here we'll use a simpler approach by making a request to a proxy server
  // This could be a Cloud Function, Express server, or another backend service
  console.log('Trying direct API approach...');
  
  try {
    // Get API key from environment variable
    const apiKey = process.env.REACT_APP_GOOGLE_VISION_API_KEY;
    
    // Make a direct request to the Vision API
    const requestBody = {
      requests: [
        {
          image: {
            content: base64Image
          },
          features: [
            {
              type: 'TEXT_DETECTION'
            }
          ],
          imageContext: {
            languageHints: ['zh-Hant', 'en']
          }
        }
      ]
    };
    
    // Create URL with API key from environment variable
    const apiKeyUrl = `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`;
    
    const response = await fetch(apiKeyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Direct Vision API error: ${response.status} ${errorText}`);
    }
    
    const result = await response.json();
    
    // Extract text from the response
    const textAnnotations = result.responses[0]?.textAnnotations;
    if (!textAnnotations || textAnnotations.length === 0) {
      throw new Error('No text detected in the image (direct API)');
    }
    
    // The first textAnnotation contains the entire text
    return textAnnotations[0].description;
    
  } catch (error) {
    console.error('Direct API approach failed:', error);
    throw new Error('All OCR methods failed. Please try again later.');
  }
}

// Function to process image and extract merchant data
export const processImageForMerchantData = async (imageData, scanIndex, merchantType) => {
  try {
    // Process the image with Google Cloud Vision
    const detectedText = await processImageWithVision(imageData);
    
    // Parse the OCR text to extract structured merchant data
    const parsedData = parseMerchantOcrText(detectedText, scanIndex, merchantType);
    console.log('Parsed Merchant Data:', parsedData);
    
    return parsedData;
  } catch (error) {
    console.error('Error processing merchant image:', error);
    
    // Return a minimal valid result to avoid breaking the UI
    return {
      items: [
        {
          category: 'OCR失敗',
          quantity: 1,
          allowsCoinExchange: true,
          price: 0,
          purchaseTimes: 1
        }
      ],
      discount: null
    };
  }
};