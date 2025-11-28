# 🔌 API Documentation - Urban Issue Reporter (MERN Stack)

## Base URL
```
Development: http://localhost:5000
Production: https://your-domain.com
```

## Authentication
Most endpoints require authentication via JWT Bearer token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Response Format
All API responses follow this structure:
```json
{
  "success": true|false,
  "data": {...},
  "message": "Optional message",
  "error": "Error details (if failed)"
}
```

---

## 🔐 Authentication Routes

### POST /api/auth/register
Register a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Validation:**
- Name: Min 2 characters
- Email: Valid email format
- Password: Min 6 characters

**Success Response (201):**
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### POST /api/auth/login
Authenticate a user and get JWT token.

**Rate Limit:** 5 requests per 15 minutes

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "organization": {
      "_id": "...",
      "name": "Water Department",
      "category": "water"
    },
    "profileComplete": true,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Response (401):**
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

---

### GET /api/auth/me
Get current authenticated user details.

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "phone": "+1234567890",
    "location": "New York",
    "organization": {...}
  }
}
```

---

## 📋 Issue Routes

### GET /api/issues
Get all issues with optional filtering.

**Query Parameters:**
- `category` (optional): Filter by category (road, electricity, water, etc.)
- `status` (optional): Filter by status (pending, in-progress, resolved, rejected)
- `search` (optional): Search in title and description
- `userId` (optional): Filter by user ID
- `orgCategory` (optional): Filter by organization category

**Example:**
```
GET /api/issues?category=road&status=pending&search=pothole
```

**Success Response (200):**
```json
{
  "success": true,
  "count": 25,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "title": "Broken Street Light",
      "description": "Street light not working for 3 days",
      "category": "electricity",
      "priority": "high",
      "status": "pending",
      "location": {
        "type": "Point",
        "coordinates": [-73.9851, 40.7589]
      },
      "address": "123 Main St, New York",
      "image": "image-123456.jpg",
      "reportedBy": {
        "_id": "...",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "createdAt": "2025-11-28T10:00:00.000Z",
      "updatedAt": "2025-11-28T10:00:00.000Z"
    }
  ]
}
```

---

### GET /api/issues/stats
Get issue statistics.

**Query Parameters:**
- `orgCategory` (optional): Filter stats by organization category

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "totalIssues": 150,
    "totalUsers": 45,
    "statusCounts": [
      { "_id": "pending", "count": 50 },
      { "_id": "in-progress", "count": 30 },
      { "_id": "resolved", "count": 60 },
      { "_id": "rejected", "count": 10 }
    ],
    "categoryCounts": [
      { "_id": "road", "count": 40 },
      { "_id": "electricity", "count": 30 },
      { "_id": "water", "count": 25 }
    ],
    "priorityCounts": [
      { "_id": "low", "count": 20 },
      { "_id": "medium", "count": 60 },
      { "_id": "high", "count": 50 },
      { "_id": "critical", "count": 20 }
    ]
  }
}
```

---

### GET /api/issues/:id
Get single issue by ID with comments.

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Broken Street Light",
    "description": "...",
    "category": "electricity",
    "status": "in-progress",
    "reportedBy": {
      "_id": "...",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "location": "New York"
    },
    "assignedTo": {
      "_id": "...",
      "name": "Admin User",
      "email": "admin@example.com"
    },
    "comments": [
      {
        "_id": "...",
        "comment": "Working on it",
        "user": {
          "name": "Admin",
          "email": "admin@example.com"
        },
        "isOfficial": true,
        "createdAt": "2025-11-28T12:00:00.000Z"
      }
    ],
    "createdAt": "2025-11-28T10:00:00.000Z"
  }
}
```

---

### POST /api/issues
Create a new issue (requires authentication).

**Rate Limit:** 20 uploads per hour

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request Body (form-data):**
```
title: "Broken Street Light" (5-200 chars)
description: "Detailed description..." (10-5000 chars)
category: "electricity" (road|electricity|water|sanitation|transport|infrastructure|environment|others)
priority: "high" (low|medium|high|critical) [optional, default: medium]
latitude: 40.7589 (-90 to 90)
longitude: -73.9851 (-180 to 180)
address: "123 Main St, New York" (max 500 chars)
image: <file> [optional, max 16MB, png|jpg|jpeg|gif]
```

**Validation:**
- User profile must be complete (phone and location required)
- Coordinates cannot be 0,0
- Image file size max 16MB
- Allowed image types: PNG, JPG, JPEG, GIF

**Success Response (201):**
```json
{
  "success": true,
  "message": "Issue reported successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Broken Street Light",
    "description": "...",
    "category": "electricity",
    "priority": "high",
    "status": "pending",
    "location": {
      "type": "Point",
      "coordinates": [-73.9851, 40.7589]
    },
    "address": "123 Main St, New York",
    "image": "image-1638096000000.jpg",
    "reportedBy": {
      "_id": "...",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "createdAt": "2025-11-28T10:00:00.000Z"
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Please complete your profile before reporting issues",
  "profileComplete": false
}
```

---

### POST /api/issues/:id/comments
Add a comment to an issue (requires authentication).

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "comment": "I'm working on this issue now."
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Comment added successfully",
  "data": {
    "_id": "...",
    "issue": "507f1f77bcf86cd799439011",
    "user": {
      "_id": "...",
      "name": "Admin User",
      "email": "admin@example.com"
    },
    "comment": "I'm working on this issue now.",
    "isOfficial": true,
    "createdAt": "2025-11-28T12:00:00.000Z"
  }
}
```

---

## 👨‍💼 Admin Routes

All admin routes require authentication and admin role (super_admin, org_admin, or org_staff).

### GET /api/admin/dashboard
Get admin dashboard statistics.

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "stats": {
      "totalIssues": 150,
      "pendingIssues": 50,
      "inProgressIssues": 30,
      "resolvedIssues": 60,
      "totalUsers": 45
    },
    "recentIssues": [...]
  }
}
```

---

### PUT /api/admin/issues/:id/status
Update issue status (requires admin role).

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "status": "in-progress",
  "comment": "We are working on this issue."
}
```

**Validation:**
- Status must be: pending | in-progress | resolved | rejected
- Admin can only manage issues in their organization's category (unless super_admin)

**Success Response (200):**
```json
{
  "success": true,
  "message": "Status updated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Broken Street Light",
    "status": "in-progress",
    ...
  }
}
```

**Error Response (403):**
```json
{
  "success": false,
  "message": "You do not have permission to manage this issue category"
}
```

---

### PUT /api/admin/issues/:id/assign
Assign issue to a staff member (requires admin role).

**Request Body:**
```json
{
  "assignedTo": "507f1f77bcf86cd799439012"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Issue assigned successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "assignedTo": {
      "_id": "...",
      "name": "Staff Member",
      "email": "staff@example.com"
    }
  }
}
```

---

### DELETE /api/admin/issues/:id
Delete an issue (requires super_admin role).

**Success Response (200):**
```json
{
  "success": true,
  "message": "Issue deleted successfully"
}
```

---

### GET /api/admin/users
Get all users (admin role required).

**Success Response (200):**
```json
{
  "success": true,
  "count": 45,
  "data": [
    {
      "_id": "...",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user",
      "organization": {
        "name": "Water Department",
        "category": "water"
      },
      "createdAt": "2025-11-01T10:00:00.000Z"
    }
  ]
}
```

---

### GET /api/admin/organizations
Get all organizations (super_admin only).

**Success Response (200):**
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "_id": "...",
      "name": "Water Supply Department",
      "category": "water",
      "description": "Water supply and sewage management",
      "createdAt": "2025-11-01T10:00:00.000Z"
    }
  ]
}
```

---

### POST /api/admin/organizations
Create a new organization (super_admin only).

**Request Body:**
```json
{
  "name": "Environmental Department",
  "category": "environment",
  "description": "Environmental protection and monitoring"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Organization created successfully",
  "data": {
    "_id": "...",
    "name": "Environmental Department",
    "category": "environment",
    "description": "Environmental protection and monitoring"
  }
}
```

---

## 👤 Profile Routes

### GET /api/profile
Get current user's profile (requires authentication).

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "phone": "+1234567890",
    "bio": "Active community member",
    "location": "New York",
    "profilePicture": "profile-123456.jpg",
    "organization": {
      "name": "Water Department",
      "category": "water"
    }
  }
}
```

---

### PUT /api/profile
Update user profile (requires authentication).

**Content-Type:** multipart/form-data

**Request Body:**
```
name: "John Doe" (optional, min 2 chars)
phone: "+1234567890" (optional)
bio: "Active community member" (optional)
location: "New York" (optional)
profilePicture: <file> (optional)
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {...}
}
```

---

### GET /api/profile/issues
Get all issues reported by current user (requires authentication).

**Success Response (200):**
```json
{
  "success": true,
  "count": 5,
  "data": [...]
}
```

---

### PUT /api/profile/password
Update user password (requires authentication).

**Request Body:**
```json
{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password updated successfully"
}
```

---

## ⚠️ Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (authentication required) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 429 | Too Many Requests (rate limit exceeded) |
| 500 | Internal Server Error |

---

## 📝 Notes

- All timestamps are in ISO 8601 format (UTC)
- File uploads are limited to 16MB
- Rate limiting applies to sensitive endpoints
- JWT tokens expire after 7 days (configurable)
- Email notifications are sent asynchronously

---

**API Version:** 1.0.0  
**Last Updated:** November 28, 2025
