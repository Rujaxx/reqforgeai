const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { uploadScreenshot } = require('../controllers/upload.controller');
const router = express.Router();
const uploadToCloudinary = require('../middlewares/cloudinary.middleware');


// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../uploads');
    // Ensure uploads directory exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

// File filter for image validation
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPG and PNG images are allowed'), false);
  }
};

const upload = multer({
  // storage,
  fileFilter, limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// POST /upload - handle file upload
router.post('/', upload.single('screenshot'), uploadToCloudinary, uploadScreenshot);

module.exports = router;