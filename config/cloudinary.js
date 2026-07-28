import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import dotenv from 'dotenv';
import multer from 'multer';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    if (file.mimetype.startsWith('video/')) {
      return {
        folder: 'ceragres_products',
        resource_type: 'video',
        allowed_formats: ['mp4', 'mov', 'webm', 'ogg', 'avi', 'mkv'],
      };
    }
    
    if (file.mimetype === 'application/pdf' || file.originalname?.toLowerCase().endsWith('.pdf')) {
      return {
        folder: 'ceragres_products',
        resource_type: 'raw',
      };
    }
    
    return {
      folder: 'ceragres_products',
      allowed_formats: ['jpg', 'png', 'jpeg', 'webp', 'pdf'],
      transformation: [{ width: 800, height: 800, crop: 'limit' }],
    };
  },
});

const upload = multer({ storage: storage });

export { cloudinary, upload };
