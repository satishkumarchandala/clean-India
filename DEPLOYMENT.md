# Urban Issue Reporter - Deployment Guide

## 🚀 Quick Deployment Guide

### Option 1: Deploy to Render (Recommended)

#### Backend (Render Web Service)

1. **Push your code to GitHub**
2. **Go to [Render Dashboard](https://dashboard.render.com/)**
3. **Click "New +" → "Web Service"**
4. **Connect your GitHub repository**
5. **Configure:**
   - Name: `urban-issue-reporter-backend`
   - Root Directory: `backend`
   - Environment: `Node`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Instance Type: `Free`

6. **Add Environment Variables:**
   ```
   NODE_ENV=production
   MONGODB_URI=<your-mongodb-atlas-connection-string>
   JWT_SECRET=<generate-a-strong-random-string>
   JWT_EXPIRE=7d
   PORT=5000
   FRONTEND_URL=<your-frontend-url-after-deployment>
   ```

7. **Click "Create Web Service"**

#### Frontend (Render Static Site or Vercel)

**Option A: Render Static Site**

1. **Go to Render Dashboard → "New +" → "Static Site"**
2. **Connect your GitHub repository**
3. **Configure:**
   - Name: `urban-issue-reporter`
   - Root Directory: `frontend`
   - Build Command: `npm install && npm run build`
   - Publish Directory: `dist`

4. **Add Environment Variable:**
   ```
   VITE_API_URL=<your-backend-url-from-step-1>
   ```

5. **Click "Create Static Site"**

**Option B: Vercel (Faster)**

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

3. **Deploy:**
   ```bash
   vercel --prod
   ```

4. **Set environment variable on Vercel dashboard:**
   ```
   VITE_API_URL=<your-backend-url>
   ```

---

### Option 2: Deploy to Railway

#### Backend

1. **Go to [Railway](https://railway.app/)**
2. **Click "New Project" → "Deploy from GitHub repo"**
3. **Select your repository**
4. **Configure:**
   - Root Directory: `/backend`
   - Build Command: `npm install`
   - Start Command: `npm start`

5. **Add Variables:**
   ```
   NODE_ENV=production
   MONGODB_URI=<your-mongodb-connection>
   JWT_SECRET=<random-secret>
   PORT=5000
   ```

6. **Deploy**

#### Frontend

Same as Vercel option above.

---

### Option 3: Traditional VPS (DigitalOcean, AWS, etc.)

#### Backend Setup

```bash
# SSH into server
ssh user@your-server-ip

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Clone repository
git clone <your-repo-url>
cd mernapp/backend

# Install dependencies
npm install

# Create .env file
nano .env
# Add all environment variables

# Start with PM2
pm2 start server.js --name urban-backend
pm2 save
pm2 startup
```

#### Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Build
npm run build

# Install nginx
sudo apt install nginx

# Copy build files
sudo cp -r dist/* /var/www/html/

# Configure nginx
sudo nano /etc/nginx/sites-available/default
```

**Nginx Configuration:**
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Restart nginx
sudo systemctl restart nginx
```

---

## 🗄️ MongoDB Atlas Setup

1. **Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)**
2. **Create a free cluster**
3. **Create Database User:**
   - Username: `your-username`
   - Password: `strong-password`
4. **Whitelist IP:**
   - Go to Network Access
   - Click "Add IP Address"
   - Select "Allow Access from Anywhere" (0.0.0.0/0)
5. **Get Connection String:**
   - Click "Connect" → "Connect your application"
   - Copy connection string
   - Replace `<password>` with your password

---

## 🔐 Generate Secure JWT Secret

```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Or online at: https://generate-secret.vercel.app/64
```

---

## 📋 Pre-Deployment Checklist

### Backend
- [ ] MongoDB Atlas cluster created and connection string obtained
- [ ] Strong JWT secret generated
- [ ] All environment variables configured
- [ ] CORS configured with frontend URL
- [ ] Uploads directory will be created automatically
- [ ] Port configured (5000 or from environment)

### Frontend
- [ ] API URL pointing to deployed backend
- [ ] Build tested locally (`npm run build`)
- [ ] Environment variables set on hosting platform
- [ ] Routes configured for SPA (redirect all to index.html)

---

## 🧪 Test Your Deployment

1. **Backend Health Check:**
   ```
   GET https://your-backend-url.com/health
   ```
   Should return: `{"status": "OK", "timestamp": "..."}`

2. **Frontend:**
   - Open browser to frontend URL
   - Try registering a new user
   - Create an issue
   - Test map functionality
   - Check admin dashboard (if super admin)

---

## 🔄 Continuous Deployment

### With GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Deploy to Render
        run: |
          curl -X POST ${{ secrets.RENDER_DEPLOY_HOOK }}
```

Add `RENDER_DEPLOY_HOOK` secret in GitHub repository settings.

---

## 📊 Monitoring

### Backend Logs (Render)
- Go to your service → Logs tab
- Real-time log streaming available

### PM2 Monitoring (VPS)
```bash
pm2 logs urban-backend
pm2 monit
```

---

## 🐛 Troubleshooting

### Issue: CORS Error
**Solution:** Ensure `FRONTEND_URL` is set correctly in backend `.env`

### Issue: MongoDB Connection Failed
**Solution:** 
- Check IP whitelist in MongoDB Atlas
- Verify connection string format
- Ensure password doesn't have special characters (URL encode if needed)

### Issue: 404 on Refresh (Frontend)
**Solution:** Configure your hosting to redirect all routes to index.html

### Issue: File Upload Not Working
**Solution:** 
- Ensure `uploads/` directory exists or is created on startup
- Check file size limits
- Verify disk space on server

---

## 💰 Cost Estimate

### Free Tier (Recommended for Testing)
- **Backend**: Render Free (Spins down after inactivity)
- **Frontend**: Vercel Free or Netlify Free
- **Database**: MongoDB Atlas Free (512MB)
- **Total**: $0/month

### Production (Recommended)
- **Backend**: Render Starter ($7/month)
- **Frontend**: Vercel Pro ($20/month) or Netlify Pro ($19/month)
- **Database**: MongoDB Atlas M10 ($57/month)
- **Total**: ~$84/month

---

## 📞 Support

For deployment issues, check:
- [Render Documentation](https://render.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)

---

## ✅ Post-Deployment

1. Update README.md with live URLs
2. Test all features in production
3. Set up monitoring and alerts
4. Configure custom domain (optional)
5. Enable HTTPS (usually automatic)
6. Set up database backups
