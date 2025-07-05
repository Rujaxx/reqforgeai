const { analyzeScreenshot } = require('../services/gemini');
exports.uploadScreenshot = async(req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const  response = await analyzeScreenshot(req.file.path);
  return res.status(200).json({
    message: 'File uploaded successfully',
    data:response
  });
};