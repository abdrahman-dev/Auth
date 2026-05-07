# Smart Auth System

A production-ready REST API for authentication built with Node.js, Express 5, and MongoDB — featuring a secure dual-token strategy with httpOnly cookies, token revocation, and request validation.

## Features

- JWT access tokens (15min) + refresh tokens (7 days)
- Secure httpOnly cookie storage — no token exposure to JavaScript
- Refresh token revocation on logout with `isRevoked` flag tracked in MongoDB
- Centralized error handling with custom `AppError` class — Zod, JWT, and Mongoose errors all handled in one place
- Zod schema validation on all inputs before hitting the database
- Three-tier rate limiting — global, per-route on login, register, and refresh separately
- Password hashing with bcryptjs (10 rounds)
- TTL index on refresh tokens — expired tokens auto-deleted by MongoDB

## Tech Stack

| Layer      | Technology                                  |
| ---------- | ------------------------------------------- |
| Runtime    | Node.js + Express 5                         |
| Database   | MongoDB + Mongoose                          |
| Auth       | JWT (jsonwebtoken)                          |
| Validation | Zod                                         |
| Security   | bcryptjs, express-rate-limit, cookie-parser |

## Getting Started

**1. Install dependencies**

```bash
npm install
```

**2. Create `.env` file**

```env
MONGO_URI=mongodb://localhost:27017/authdb
ACCESS_TOKEN_SECRET=your_access_token_secret
REFRESH_TOKEN_SECRET=your_refresh_token_secret
NODE_ENV=development
PORT=5000
```

**3. Run the server**

```bash
npm run dev     # development (nodemon)
npm start       # production
```

## API Endpoints

| Method | Endpoint             | Auth Required | Description              |
| ------ | -------------------- | :-----------: | ------------------------ |
| GET    | `/api/auth/`         |      ❌       | Health check             |
| POST   | `/api/auth/register` |      ❌       | Create new account       |
| POST   | `/api/auth/login`    |      ❌       | Login and receive tokens |
| POST   | `/api/auth/logout`   |      ❌       | Revoke session           |
| POST   | `/api/auth/refresh`  |      ❌       | Issue new access token   |
| GET    | `/api/auth/me`       |      ✅       | Get current user profile |

## Authentication Flow

```
REGISTER / LOGIN
─────────────────────────────────────────────────
Client sends { email, password }
        │
        ▼
Server validates input (Zod) → hashes password (bcryptjs)
        │
        ▼
Generates:
  ┌─ Access Token  (JWT, 15min)  ─→ httpOnly cookie
  └─ Refresh Token (JWT, 7 days) ─→ httpOnly cookie + stored in MongoDB
        │
        ▼
{ success: true } ← No tokens in response body


ACCESSING PROTECTED ROUTES
─────────────────────────────────────────────────
Client request (cookie sent automatically)
        │
        ▼
authMiddleware verifies accessToken from cookie
        │
        ▼
req.user = { userId } → handler executes


TOKEN REFRESH (access token expired)
─────────────────────────────────────────────────
Client hits POST /api/auth/refresh
        │
        ▼
Server verifies refreshToken cookie (JWT + DB check)
        │
        ├─ isRevoked: false ✅
        └─ expiresAt > now  ✅
        │
        ▼
New accessToken issued → set as httpOnly cookie


LOGOUT
─────────────────────────────────────────────────
Server marks refresh token as isRevoked: true in DB
Clears both cookies
```

## Project Structure

```
├── app.js                          # Entry point, middleware setup
├── model/
│   ├── mongodb.js                  # Database connection
│   ├── userModel.js                # User schema
│   └── refreshToken.js             # Refresh token schema (with revocation + TTL index)
├── routes/
│   └── authRoutes.js               # Auth route definitions
├── controllers/
│   ├── authController.js           # Business logic
│   └── authValidation.js           # Zod validation schemas
└── middleware/
    ├── authMiddleware.js            # JWT verification
    ├── errorHandler.js             # Centralized error handler + AppError class
    ├── validate.js                  # Zod middleware wrapper
    └── rateLimiter.js               # Global + auth-specific rate limits
```

## Security Highlights

- Tokens stored in **httpOnly cookies** — inaccessible to XSS attacks
- Refresh tokens **stored and tracked in MongoDB** — enabling true server-side revocation, unlike stateless JWT
- Logout actually invalidates the session — `isRevoked: true` blocks reuse even if token is stolen
- Three separate rate limiters — global traffic cap, strict login protection (5 attempts / 15min), and dedicated limits on register and refresh endpoints
- Passwords never stored in plaintext or returned in any response
- TTL index on `refreshToken.expiresAt` — database auto-purges expired documents, no manual cleanup needed

## Error Handling

All errors flow through a single centralized handler that distinguishes between:

- **Zod validation errors** — returns 422 with per-field breakdown of what failed and why
- **JWT errors** — `JsonWebTokenError` and `TokenExpiredError` both caught and returned as clean 401 responses
- **Mongoose errors** — duplicate key (409), validation errors (400), and invalid ObjectId (400) all handled explicitly
- **Operational errors** — thrown via `AppError(message, statusCode)` from any controller, caught and formatted consistently
- **Unexpected errors** — stack trace exposed only in development, never in production
