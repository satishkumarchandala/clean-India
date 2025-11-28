import dotenv from 'dotenv';

dotenv.config();

const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/urban-issue-reporter',
  
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    expire: process.env.JWT_EXPIRE || '7d',
  },
  
  email: {
    host: process.env.MAIL_HOST || 'smtp.gmail.com',
    port: process.env.MAIL_PORT || 587,
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
  
  admin: {
    name: process.env.DEFAULT_ADMIN_NAME || 'Admin User',
    email: process.env.DEFAULT_ADMIN_EMAIL || 'admin@example.com',
    password: process.env.DEFAULT_ADMIN_PASSWORD || 'admin123',
  },
  
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 16 * 1024 * 1024, // 16MB
    allowedTypes: ['image/png', 'image/jpg', 'image/jpeg', 'image/gif'],
    path: process.env.UPLOAD_PATH || './uploads',
  },
};

export default config;
