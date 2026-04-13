# Auth System

A simple authentication API built with Node.js, Express, and MongoDB.

## Tech Stack

- Node.js + Express
- MongoDB (Mongoose)
- JWT (access + refresh tokens)
- Bcrypt (password hashing)

## Setup

```bash
npm install
```

Create `.env` file:
```
MONGO_URI=mongodb://localhost:27017/authdb
ACCESS_TOKEN_SECRET=your_access_token_secret
REFRESH_TOKEN_SECRET=your_refresh_token_secret
```

Run:
```bash
npm start
```

## API Flow

```
┌────────────────────────────────────────────────────────────┐
│                      AUTHENTICATION FLOW                    │
└────────────────────────────────────────────────────────────┘

1. REGISTER
   POST /auth/register
   { username, password }
          │
          ▼
   Hash password with bcrypt
          │
          ▼
   Save user to MongoDB
          │
          ▼
   201 Created

2. LOGIN
   POST /auth/login
   { username, password }
          │
          ▼
   Find user, verify password
          │
          ▼
   Generate: Access Token (15min) + Refresh Token
          │
          ▼
   Store refresh token in MongoDB
          │
          ▼
   { accessToken, refreshToken }

3. ACCESS PROTECTED ROUTE
   GET /auth/dashboard
   Header: Authorization: Bearer <accessToken>
          │
          ▼
   Verify access token
          │
          ▼
   Return protected data

4. REFRESH TOKEN (when access expires)
   POST /auth/refresh-token
   { token: <refreshToken> }
          │
          ▼
   Verify refresh token in MongoDB
          │
          ▼
   Issue new access token

5. LOGOUT
   DELETE /auth/logout
   { token: <refreshToken> }
          │
          ▼
   Remove refresh token from MongoDB

─────────────────────────────────────────────────────────────
```

## Endpoints

| Method | Endpoint | Description |
|--------|----------|--------------|
| POST | `/auth/register` | Create new user |
| POST | `/auth/login` | Login, get tokens |
| GET | `/auth/dashboard` | Protected route |
| POST | `/auth/refresh-token` | Get new access token |
| DELETE | `/auth/logout` | Invalidate session |

## Project Structure

```
├── app.js              # Entry point
├── config/db.js        # MongoDB connection
├── model/User.js       # User schema
├── routes/authRoutes.js # Routes
├── controllers/authController.js # Logic
└── middleware/authMiddleware.js # JWT verification
```
