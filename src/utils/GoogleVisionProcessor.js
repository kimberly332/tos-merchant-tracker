// src/utils/GoogleVisionProcessor.js
import { parseMerchantOcrText } from './MerchantOcrParser';

// Function to process an image with Google Cloud Vision API
export const processImageWithVision = async (imageData) => {
  try {
    // Remove data:image/jpeg;base64, prefix if present
    const base64Image = imageData.includes('base64,') 
      ? imageData.split('base64,')[1] 
      : imageData;

    // Prepare request body for Google Cloud Vision API
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
            languageHints: ['zh-Hant', 'en'] // Chinese Traditional + English
          }
        }
      ]
    };

    // Get the API key from environment variables
    const credentials = process.env.REACT_APP_GOOGLE_VISION_CREDENTIALS;
    if (!credentials) {
      throw new Error('Google Cloud Vision credentials not found in environment variables');
    }

    // Parse the credentials JSON if needed
    const parsedCredentials = typeof credentials === 'string' 
      ? JSON.parse(credentials) 
      : credentials;

    // Create authentication header
    const authHeader = await getAuthHeader(parsedCredentials);

    // Call the Vision API
    const response = await fetch(
      'https://vision.googleapis.com/v1/images:annotate',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authHeader}`
        },
        body: JSON.stringify(requestBody)
      }
    );

    // Process the response
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Google Vision API error: ${errorText}`);
    }

    const result = await response.json();
    console.log('Vision API response:', result);

    // Extract text from the response
    const textAnnotations = result.responses[0]?.textAnnotations;
    if (!textAnnotations || textAnnotations.length === 0) {
      throw new Error('No text detected in the image');
    }

    // The first textAnnotation contains the entire text
    const detectedText = textAnnotations[0].description;
    console.log('Detected text:', detectedText);

    return detectedText;
  } catch (error) {
    console.error('Error processing image with Google Vision:', error);
    throw error;
  }
};

// Helper function to get authentication token
// Note: In a real application, you would use a proper auth library
async function getAuthHeader(credentials) {
  // This is a simplified approach - in a production environment,
  // you would use the Google Auth Library to handle authentication
  
  // For demonstration purposes only - in production, use proper authentication
  try {
    const response = await fetch(
      `https://oauth2.googleapis.com/token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
          assertion: generateJWT(credentials)
        })
      }
    );

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('Authentication error:', error);
    throw new Error('Failed to authenticate with Google Cloud');
  }
}

// Helper function to generate JWT for authentication
// Note: This is a simplified version for demonstration
function generateJWT(credentials) {
  // In a real application, you would use a JWT library
  // This is a placeholder for demonstration purposes
  
  // For production, use the Google Auth Library:
  // const {GoogleAuth} = require('google-auth-library');
  // const auth = new GoogleAuth({credentials});
  // const client = await auth.getClient();
  // const token = await client.getAccessToken();
  
  console.error('JWT generation not implemented in this demo');
  throw new Error('JWT generation not implemented - use proper authentication');
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
    throw error;
  }
};