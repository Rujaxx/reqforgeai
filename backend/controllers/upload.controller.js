const { analyzeScreenshot } = require('../services/gemini');

exports.uploadScreenshot = async(req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const projectId = req.body.projectId; // Get projectId from request body

  // Call the analyzeScreenshot function with the uploaded file path
  const  response = await analyzeScreenshot(req.file.path,projectId);
  return res.status(200).json({
    message: 'File uploaded successfully',
    data:response
  });
};