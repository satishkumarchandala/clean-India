# 🏙 Urban Issue Reporter - MERN Stack

A full-stack web application for reporting and managing urban infrastructure issues. Built with React + Vite, Node.js + Express, and MongoDB.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)

## ✨ Features

### 🔧 Core Functionality
- **User Authentication**: JWT-based registration and login system
- **Issue Reporting**: Create issues with image uploads and geolocation
- **Interactive Map**: View all issues on an interactive map (Leaflet.js)
- **Issue Tracking**: Filter, search, and manage urban issues
- **Real-time Updates**: View issue status changes and comments
- **Priority System**: Automated issue prioritization
- **Email Notifications**: Automated email alerts for issue updates

### 👥 User Roles
- **Regular Users**: Report issues, add comments, track submissions
- **Organization Staff**: Manage category-specific issues
- **Organization Admin**: Full access to organization's issues
- **Super Admin**: Complete system access and control

### 📂 Issue Categories
- Road & Infrastructure
- Electricity
- Water Supply
- Sanitation
- Transport
- Environment
- Others

## 🛠 Tech Stack

### Frontend
- **React 18**: UI library
- **Vite**: Build tool and dev server
- **React Router**: Client-side routing
- **Zustand**: State management
- **Axios**: HTTP client
- **React Leaflet**: Interactive maps
- **React Toastify**: Toast notifications
- **Date-fns**: Date formatting

### Backend
- **Node.js**: Runtime environment
- **Express**: Web framework
- **MongoDB**: Database
- **Mongoose**: ODM
- **JWT**: Authentication
- **Bcrypt**: Password hashing
- **Multer**: File uploads
- **Nodemailer**: Email service
- **Express Validator**: Input validation
- **Helmet**: Security headers
- **Morgan**: HTTP logging

## 📁 Project Structure

```
urban-issue-reporter/
├── backend/
│   ├── config/
│   │   ├── config.js          # App configuration
│   │   └── db.js              # MongoDB connection
│   ├── middleware/
│   │   ├── auth.js            # Authentication middleware
│   │   ├── upload.js          # File upload configuration
│   │   ├── rateLimiter.js     # Rate limiting
│   │   └── errorHandler.js    # Error handling
│   ├── models/
│   │   ├── User.js            # User model
│   │   ├── Issue.js           # Issue model
│   │   ├── Comment.js         # Comment model
│   │   ├── Organization.js    # Organization model
│   │   └── IssueGroup.js      # Issue group model
│   ├── routes/
│   │   ├── auth.js            # Authentication routes
│   │   ├── issues.js          # Issue management routes
│   │   ├── admin.js           # Admin routes
│   │   └── profile.js         # User profile routes
│   ├── utils/
│   │   └── email.js           # Email utilities
│   ├── uploads/               # Uploaded files
│   ├── .env.example           # Environment variables template
│   ├── .gitignore
│   ├── package.json
│   ├── seed.js                # Database seeding script
│   └── server.js              # Express app entry point
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── api/
│   │   │   └── axios.js       # API configuration
│   │   ├── components/
│   │   │   ├── Layout.jsx     # Main layout
│   │   │   ├── Navbar.jsx     # Navigation bar
│   │   │   └── Footer.jsx     # Footer
│   │   ├── pages/
│   │   │   ├── Home.jsx       # Home page
│   │   │   ├── Login.jsx      # Login page
│   │   │   ├── Register.jsx   # Registration page
│   │   │   ├── ReportIssue.jsx
│   │   │   ├── IssueDetail.jsx
│   │   │   ├── IssuesMap.jsx
│   │   │   ├── Profile.jsx
│   │   │   ├── AdminDashboard.jsx
│   │   │   └── NotFound.jsx
│   │   ├── store/
│   │   │   └── authStore.js   # Authentication state
│   │   ├── App.jsx            # Main app component
│   │   ├── main.jsx           # Entry point
│   │   └── index.css          # Global styles
│   ├── .env.example
│   ├── .gitignore
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
└── README.md
```

## 📋 Prerequisites

- **Node.js** (v18 or higher)
- **MongoDB** (v6 or higher) - Local installation or MongoDB Atlas
- **npm** or **yarn**
- **Git**

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd urban-issue-reporter
```

### 2. Backend Setup

```bash
cd backend
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your configuration
```

### 3. Frontend Setup

```bash
cd frontend
npm install

# Copy environment variables
cp .env.example .env
```

## ⚙️ Configuration

### Backend Environment Variables

Edit `backend/.env`:

```env
PORT=5000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/urban-issue-reporter

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRE=7d

# Email (Gmail SMTP)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your-email@gmail.com
MAIL_PASS=your-app-password

# Admin Credentials
DEFAULT_ADMIN_NAME=Admin User
DEFAULT_ADMIN_EMAIL=admin@example.com
DEFAULT_ADMIN_PASSWORD=admin123

# File Upload
MAX_FILE_SIZE=16777216
UPLOAD_PATH=./uploads
```

### Frontend Environment Variables

Edit `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000
VITE_MAP_DEFAULT_CENTER=[40.7589,-73.9851]
VITE_MAP_DEFAULT_ZOOM=13
```

## 🏃 Running the Application

### Start MongoDB

```bash
# If using local MongoDB
mongod
```

### Seed the Database (Optional)

```bash
cd backend
npm run seed
```

This creates:
- Super admin account
- Organization admin account
- Regular user accounts
- Sample organizations
- Sample issues

### Start Backend Server

```bash
cd backend
npm run dev
```

Backend runs on: `http://localhost:5000`

### Start Frontend Development Server

```bash
cd frontend
npm run dev
```

Frontend runs on: `http://localhost:3000`

## 👤 Default Login Credentials

After seeding:

**Super Admin:**
- Email: `admin@example.com`
- Password: `admin123`

**Organization Admin:**
- Email: `electric.admin@example.com`
- Password: `password123`

**Regular Users:**
- Email: `john@example.com` / Password: `password123`
- Email: `jane@example.com` / Password: `password123`

## 📚 API Documentation

### Base URL
```
Development: http://localhost:5000
```

### Authentication Endpoints

#### POST /api/auth/register
Register a new user

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

#### POST /api/auth/login
Login user

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "token": "eyJhbGc..."
  }
}
```

#### GET /api/auth/me
Get current user (requires authentication)

### Issue Endpoints

#### GET /api/issues
Get all issues with optional filters

**Query Parameters:**
- `category`: Filter by category
- `status`: Filter by status
- `search`: Search term
- `orgCategory`: Organization category filter

#### GET /api/issues/:id
Get single issue by ID

#### POST /api/issues
Create a new issue (requires authentication)

**Request Body (multipart/form-data):**
```
title: string (5-200 chars)
description: string (10-5000 chars)
category: string (road|electricity|water|...)
priority: string (low|medium|high|critical)
latitude: number
longitude: number
address: string
image: file (optional)
```

#### POST /api/issues/:id/comments
Add comment to issue (requires authentication)

**Request Body:**
```json
{
  "comment": "Comment text"
}
```

### Admin Endpoints

#### GET /api/admin/dashboard
Get admin dashboard stats (requires admin role)

#### PUT /api/admin/issues/:id/status
Update issue status (requires admin role)

**Request Body:**
```json
{
  "status": "in-progress",
  "comment": "Working on it"
}
```

#### PUT /api/admin/issues/:id/assign
Assign issue to staff (requires admin role)

#### GET /api/admin/users
Get all users (requires admin role)

#### GET /api/admin/organizations
Get all organizations (requires super admin role)

#### POST /api/admin/organizations
Create organization (requires super admin role)

### Profile Endpoints

#### GET /api/profile
Get current user profile (requires authentication)

#### PUT /api/profile
Update user profile (requires authentication)

#### GET /api/profile/issues
Get user's reported issues (requires authentication)

#### PUT /api/profile/password
Update password (requires authentication)

## 📦 Building for Production

### Backend

```bash
cd backend
npm start
```

### Frontend

```bash
cd frontend
npm run build
```

The built files will be in `frontend/dist/`

## 🚢 Deployment

### Backend Deployment (e.g., Heroku, Railway)

1. Set environment variables in your hosting platform
2. Ensure MongoDB Atlas or remote MongoDB is configured
3. Deploy backend code

### Frontend Deployment (e.g., Vercel, Netlify)

1. Build the frontend: `npm run build`
2. Deploy the `dist` folder
3. Set environment variables (VITE_API_URL)

## 🔒 Security Features

- JWT token-based authentication
- Password hashing with bcrypt
- Rate limiting on API endpoints
- CORS protection
- Helmet security headers
- Input validation and sanitization
- File upload restrictions
- Protected routes

## 🛣️ Roadmap

- [ ] Complete implementation of ReportIssue page with geolocation
- [ ] Implement IssueDetail page with comments system
- [ ] Add interactive map with clustering
- [ ] Complete Profile page with update functionality
- [ ] Build full Admin Dashboard with charts
- [ ] Add ML-based issue classification
- [ ] Implement issue proximity detection
- [ ] Add real-time notifications with WebSockets
- [ ] Mobile responsive design improvements
- [ ] Progressive Web App (PWA) features

## 📝 License

MIT License

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Contact

For questions or support, please contact: support@urbanissues.com

---

**Made with ❤️ for better cities**
