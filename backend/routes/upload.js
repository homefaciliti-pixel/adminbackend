const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Multer storage
let storage;
const isCloudinaryConfigured = process.env.CLOUDINARY_CLOUD_NAME && 
                               process.env.CLOUDINARY_API_KEY && 
                               process.env.CLOUDINARY_API_SECRET;

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });

  storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'home_faciliti_uploads',
      allowed_formats: ['jpg', 'png', 'jpeg'],
      public_id: (req, file) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const nameWithoutExt = path.parse(file.originalname).name;
        const cleanName = nameWithoutExt.replace(/[^a-zA-Z0-9]/g, '_');
        return `${cleanName}-${uniqueSuffix}`;
      }
    }
  });
} else {
  storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, path.join(__dirname, '../uploads'));
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    }
  });
}

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExtensions = ['.png', '.jpg', '.jpeg'];
  
  if (ext === '.svg' || (file.mimetype && file.mimetype.toLowerCase().includes('svg'))) {
    return cb(new Error('SVG files are not allowed! Only PNG, JPG, and JPEG images are allowed.'), false);
  }

  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only PNG, JPG, and JPEG images are allowed!'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// POST /api/upload - upload a single image file (multipart form field name: 'image')
router.post('/', (req, res) => {
  upload.single('image')(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      // A Multer error occurred when uploading.
      return res.status(400).json({ success: false, message: `Multer upload error: ${err.message}` });
    } else if (err) {
      // An unknown error occurred when uploading.
      return res.status(400).json({ success: false, message: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please select an image file to upload (field name: image)' });
    }

    // Dynamic absolute URL based on storage type
    let imageUrl;
    if (req.file.path && req.file.path.startsWith('http')) {
      imageUrl = req.file.path;
    } else {
      imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    }

    res.status(201).json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        url: imageUrl
      }
    });
  });
});

module.exports = router;
