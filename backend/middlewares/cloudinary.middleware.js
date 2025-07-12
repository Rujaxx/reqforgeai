const { uploadImage } = require('../services/cloudinary');
// Middleware to upload to Cloudinary
const uploadToCloudinary = async (req, res, next) => {
  if (!req.file) {
    return next();
  }
  try {
    // Upload buffer to Cloudinary
    const result = await uploadImage(req.file.buffer);
    // Add Cloudinary result to request object
    req.cloudinaryResult = {
      public_id: result.public_id,
      secure_url: result.secure_url,
      url: result.url,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
      created_at: result.created_at
    };

    next();
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    res.status(500).json({ 
      error: 'Failed to upload image to Cloudinary',
      details: error.message 
    });
  }
};

module.exports = uploadToCloudinary;