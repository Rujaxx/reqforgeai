const { analyzeScreenshot } = require('../services/gemini');

exports.uploadScreenshot = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    // Call the analyzeScreenshot function with the uploaded file path
    const response = await analyzeScreenshot(req);
    return res.status(200).json({
      message: 'File uploaded successfully',
      data: response
    });
  } catch (error) {
    console.error('Error in uploadScreenshot:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }

};