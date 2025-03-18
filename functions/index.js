const functions = require("firebase-functions");
const cors = require("cors")({origin: true});
const {ImageAnnotatorClient} = require("@google-cloud/vision");

// Create client with automatic authentication
// No credentials needed - Firebase handles this automatically
const client = new ImageAnnotatorClient();

exports.analyzeImage = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    if (req.method !== "POST") {
      return res.status(405).send("Method Not Allowed");
    }

    try {
      const {imageData} = req.body;

      if (!imageData) {
        return res.status(400).send("Image data is required");
      }

      // Remove data URL prefix if present
      const base64Image = imageData.includes("base64,") ?
        imageData.split("base64,")[1] :
        imageData;

      // Call Vision API
      const [result] = await client.textDetection({
        image: {content: Buffer.from(base64Image, "base64")},
        imageContext: {
          languageHints: ["zh-Hant", "en"],
        },
      });

      // Return the results
      return res.status(200).json({
        text: result.fullTextAnnotation ? result.fullTextAnnotation.text : "",
        textAnnotations: result.textAnnotations || [],
      });
    } catch (error) {
      console.error("Vision API error:", error);
      return res.status(500).send(`Error processing image: ${error.message}`);
    }
  });
});
