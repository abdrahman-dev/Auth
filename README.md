# JWT Authentication & Session Management System

A production-grade backend authentication system built with **Node.js**, **Express**, **MongoDB**, and **JSON Web Tokens (JWT)**. Implements secure user registration, login, token refresh, and protected routes using a clean MVC architecture.

---

## Overview

| Feature           | Description                                                |
| ----------------- | ---------------------------------------------------------- |
| User Registration | Secure password hashing with bcrypt (salt rounds: 10)      |
| User Login        | Credential validation + dual-token generation              |
| Access Tokens     | Short-lived JWTs (15 min) for API authorization            |
| Refresh Tokens    | Long-lived tokens stored in MongoDB for session continuity |
| Token Refresh     | Obtain new access tokens without re-login                  |
| Logout            | Invalidates refresh token from database immediately        |
| Protected Routes  | Middleware-based JWT validation on sensitive endpoints     |

---

## Architecture Overview

The project follows a **layered MVC pattern** — each layer has a single, clear responsibility.

```
┌─────────────────────────────────────────────────────────┐
│                        app.js                           │
│   Express init · Middleware registration · Route mount  │
└───────────────────────┬─────────────────────────────────┘
                        │
              ┌─────────▼─────────┐
              │   authRoutes.js   │  ← Maps URLs to controllers
              │  /auth/*          │    Applies authMiddleware
              └─────────┬─────────┘
                        │
              ┌─────────▼──────────┐
              │ authController.js  │  ← Business logic
              │ register/login/    │    JWT generation
              │ refresh/logout     │    bcrypt ops
              └─────────┬──────────┘
                        │
              ┌─────────▼──────────┐
              │     user.js        │  ← Mongoose schema
              │  (Model layer)     │    MongoDB interface
              └────────────────────┘
```

### Layer Responsibilities

| Layer           | File                            | Responsibility                                     |
| --------------- | ------------------------------- | -------------------------------------------------- |
| **Entry Point** | `app.js`                        | Server bootstrap, middleware setup, route mounting |
| **Config**      | `config/db.js`                  | MongoDB connection via Mongoose                    |
| **Routes**      | `routes/authRoutes.js`          | Endpoint definitions, middleware binding           |
| **Controllers** | `controllers/authController.js` | Business logic, token ops, responses               |
| **Models**      | `models/user.js`                | Mongoose schema — User document structure          |
| **Middleware**  | `middleware/authMiddleware.js`  | JWT extraction and validation per request          |

---

## Request Lifecycle

```
  CLIENT
    │
    │  HTTP Request (e.g., POST /auth/login)
    ▼
┌─────────────────────────────────────────┐
│              app.js                     │
│  express.json() parses body             │
│  Routes mounted at /auth                │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│          authRoutes.js                  │
│  Matches URL + HTTP method              │
│  [optional] authMiddleware runs here    │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│        authController.js               │
│  Reads req.body / req.user             │
│  Validates, hashes, generates tokens   │
│  Calls User model                      │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│           MongoDB (via Mongoose)        │
│  find / save / update documents        │
└─────────────────┬───────────────────────┘
                  │
                  │  res.json({ ... })
                  ▼
              CLIENT
```

---

## Authentication Flows

### Registration

```
POST /auth/register { username, password }
        │
        ▼
  username exists? ──YES──► 409 Conflict
        │ NO
        ▼
  bcrypt.hash(password, 10)
        │
        ▼
  new User({ username, hashedPassword }).save()
        │
        ▼
  201 Created
```

### Login

```
POST /auth/login { username, password }
        │
        ▼
  User.findOne({ username })
        │
  not found ──► 404 Not Found
        │ found
        ▼
  bcrypt.compare(password, user.password)
        │
  mismatch ──► 400 Bad Request
        │ match
        ▼
  jwt.sign({ id, username }, ACCESS_SECRET,  { expiresIn: '15m' })
  jwt.sign({ id, username }, REFRESH_SECRET)
        │
        ▼
  user.refreshTokens.push(refreshToken)
  user.save()
        │
        ▼
  200 OK { accessToken, refreshToken }
```

### Accessing Protected Routes

```
GET /auth/dashboard
Authorization: Bearer <accessToken>
        │
        ▼
  authMiddleware extracts token
        │
  no token ──► 401 Unauthorized
        │ present
        ▼
  jwt.verify(token, ACCESS_SECRET)
        │
  invalid/expired ──► 403 Forbidden
        │ valid
        ▼
  req.user = decoded payload
  next() → controller
        │
        ▼
  200 OK { message, user }
```

### Token Refresh

```
POST /auth/refresh-token { token: <refreshToken> }
        │
        ▼
  no token ──► 401 Unauthorized
        │
        ▼
  User has token in refreshTokens[]?
        │
  not found ──► 403 Forbidden
        │ found
        ▼
  jwt.verify(token, REFRESH_SECRET)
        │
  invalid ──► 403 Forbidden
        │ valid
        ▼
  jwt.sign(payload, ACCESS_SECRET, { expiresIn: '15m' })
        │
        ▼
  200 OK { accessToken }
```

### Logout

```
DELETE /auth/logout { token: <refreshToken> }
        │
        ▼
  Find user where refreshTokens includes token
        │
  not found ──► 204 No Content (idempotent)
        │ found
        ▼
  Pull token from refreshTokens[]
  user.save()
        │
        ▼
  204 No Content
```

---

## Security Design

### Password Hashing (bcrypt)

- Passwords **never stored in plain text**
- Salt rounds of 10 — computationally expensive for brute-force
- Random salt per hash — defeats rainbow table attacks
- `bcrypt.compare()` handles salt extraction automatically

### JWT Structure

```
Header.Payload.Signature
  │        │        │
  │        │        └─ HMAC-SHA256 of (header + payload) with secret
  │        └── { id, username, iat, exp }
  └── { alg: "HS256", typ: "JWT" }
```

### Access Token vs Refresh Token

| Property   | Access Token      | Refresh Token               |
| ---------- | ----------------- | --------------------------- |
| Lifetime   | 15 minutes        | Long-lived                  |
| Storage    | Client memory     | MongoDB + client            |
| Used for   | Every API request | Only on access token expiry |
| Revocable? | No (stateless)    | Yes (remove from DB)        |

### Why Store Refresh Tokens in DB?

- **Immediate revocation** — logout invalidates session instantly
- **Multi-device management** — each device gets its own token entry
- **Audit trail** — track all active sessions per user

---

## Project Structure

```
project/
├── app.js                    # Entry point: Express setup + routes
├── package.json
├── .env                      # Secrets and DB URI (never commit this)
│
├── config/
│   └── db.js                 # Mongoose.connect() wrapper
│
├── controllers/
│   └── authController.js     # register, login, refresh, logout, dashboard
│
├── middleware/
│   └── authMiddleware.js     # JWT extraction + verification
│
├── models/
│   └── user.js               # User schema: username, password, refreshTokens[]
│
└── routes/
    └── authRoutes.js         # Route → middleware → controller mapping
```

---

## API Reference

| Method | Endpoint              | Auth Required           | Description             |
| ------ | --------------------- | ----------------------- | ----------------------- |
| POST   | `/auth/register`      | No                      | Register new user       |
| POST   | `/auth/login`         | No                      | Login, receive tokens   |
| POST   | `/auth/refresh-token` | No (uses refresh token) | Get new access token    |
| DELETE | `/auth/logout`        | No (uses refresh token) | Invalidate session      |
| GET    | `/auth/dashboard`     | Yes (Bearer token)      | Protected route example |

### Status Codes Used

| Code | Meaning      | When                                |
| ---- | ------------ | ----------------------------------- |
| 200  | OK           | Login, refresh success              |
| 201  | Created      | Registration success                |
| 204  | No Content   | Logout (success or token not found) |
| 400  | Bad Request  | Wrong password                      |
| 401  | Unauthorized | Missing token                       |
| 403  | Forbidden    | Invalid/expired/revoked token       |
| 404  | Not Found    | User doesn't exist                  |
| 409  | Conflict     | Username already taken              |

---

## Environment Variables

Create `.env` in project root:

```env
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname
ACCESS_TOKEN_SECRET=<min 64 chars — use: openssl rand -hex 64>
REFRESH_TOKEN_SECRET=<min 64 chars — use: openssl rand -hex 64>
```

---

## Running Locally

```bash
# 1. Install dependencies
npm install

# 2. Create and configure .env (see above)

# 3. Start in development mode (with nodemon)
npm run dev

# 4. Start in production mode
npm start
```

Server runs at: `http://localhost:3000`

**Prerequisites:** Node.js v14+, MongoDB (local or Atlas)

---

## Extending the Project

### Add Role-Based Authorization (RBAC)

Add `role` field to user schema, then build an `authorize` middleware:

```javascript
const authorize =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role))
      return res.status(403).send("Access denied");
    next();
  };

// Usage in routes:
router.get("/admin", authenticate, authorize("admin"), adminController);
```

### Token Rotation (Security Upgrade)

On each `/refresh-token` call, issue a **new** refresh token and invalidate the old one. This prevents refresh token reuse attacks.

### HTTP-Only Cookies

Replace `Authorization: Bearer` header with HTTP-only cookies:

```javascript
res.cookie("refreshToken", token, {
  httpOnly: true,
  secure: true,
  sameSite: "Strict",
  maxAge: 7 * 24 * 60 * 60 * 1000,
});
```

This mitigates XSS token theft.

### Rate Limiting

```bash
npm install express-rate-limit
```

```javascript
const rateLimit = require("express-rate-limit");
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10 });
router.post("/login", loginLimiter, authController.login);
```

### Helmet (Security Headers)

```bash
npm install helmet
```

```javascript
const helmet = require("helmet");
app.use(helmet()); // Sets HSTS, CSP, X-Frame-Options, etc.
```

---

## Tech Stack

| Technology   | Role                              |
| ------------ | --------------------------------- |
| Node.js      | JavaScript runtime                |
| Express.js   | HTTP framework + routing          |
| MongoDB      | Document database                 |
| Mongoose     | ODM — schema validation + queries |
| jsonwebtoken | JWT signing and verification      |
| bcrypt       | Password hashing                  |
| dotenv       | Environment variable loading      |

---

## License

ISC License — free to fork, modify, and use for learning or production starters.
