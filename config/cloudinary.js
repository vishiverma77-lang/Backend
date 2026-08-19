import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import dotenv from 'dotenv';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '..', 'uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const cleanExt = path.extname(file.originalname) || '.pdf';
    cb(null, 'catalog-' + uniqueSuffix + cleanExt);
  }
});

const cloudinaryStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    if (file.mimetype.startsWith('video/')) {
      return {
        folder: 'ceragres_products',
        resource_type: 'video',
        allowed_formats: ['mp4', 'mov', 'webm', 'ogg', 'avi', 'mkv'],
      };
    }
    
    return {
      folder: 'ceragres_products',
      allowed_formats: ['jpg', 'png', 'jpeg', 'webp', 'gif', 'avif'],
      transformation: [{ width: 1200, height: 1200, crop: 'limit' }],
    };
  },
});

const combinedStorage = {
  _handleFile: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.originalname?.toLowerCase().endsWith('.pdf')) {
      diskStorage._handleFile(req, file, (err, info) => {
        if (err) return cb(err);
        const relativePath = 'uploads/' + info.filename;
        cb(null, { ...info, path: relativePath });
      });
    } else {
      cloudinaryStorage._handleFile(req, file, cb);
    }
  },
  _removeFile: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.originalname?.toLowerCase().endsWith('.pdf')) {
      diskStorage._removeFile(req, file, cb);
    } else {
      cloudinaryStorage._removeFile(req, file, cb);
    }
  }
};

const upload = multer({ storage: combinedStorage });

export { cloudinary, upload };
