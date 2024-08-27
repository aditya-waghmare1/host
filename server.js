const express = require('express');
const fs = require('fs');
const multer = require('multer');
const path = require('path');
const dotenv = require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize the Express app
const app = express();
const port = process.env.PORT || 5000;

// Initialize Google Generative AI
const genAI = new GoogleGenerativeAI(process.env.API_KEY);

// Set up Multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Converts local file information to a GoogleGenerativeAI.Part object
function fileToGenerativePart(filePath, mimeType) {
  return {
    inlineData: {
      data: Buffer.from(fs.readFileSync(filePath)).toString('base64'),
      mimeType,
    },
  };
}

// API endpoint to handle image detection
app.post('/detect-image', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    // For text-and-image input (multimodal), use the gemini-pro-vision model
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = 'describe the provided image';
    const imagePart = fileToGenerativePart(req.file.path, req.file.mimetype);

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = await response.text();

    // Delete the uploaded file after processing
    fs.unlinkSync(req.file.path);

    res.json({ description: text });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve a simple HTML upload form
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html')); // Replace 'index.html' with your actual HTML file
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
