// server/authServer.js
const express = require('express');
const { GoogleAuth } = require('google-auth-library');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Google Cloud authentication endpoint
app.post('/api/get-google-auth-token', async (req, res) => {
  try {
    // Get credentials from environment variable
    const credentials = JSON.parse(process.env.GOOGLE_VISION_CREDENTIALS);
    
    // Create a GoogleAuth instance
    const auth = new GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/cloud-platform']
    });
    
    // Get client and token
    const client = await auth.getClient();
    const token = await client.getAccessToken();
    
    // Return the token to the client
    res.json({ token: token.token });
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ error: 'Failed to authenticate with Google Cloud' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Authentication server running on port ${port}`);
});