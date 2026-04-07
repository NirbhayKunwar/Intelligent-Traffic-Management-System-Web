# ITMS Backend

Express + LowDB backend for authentication, profiles, and Google OAuth.

## Requirements

- Node.js 18+ (ESM support)
- npm

## Tooling Versions

- Node.js: 18+
- Express: 5.2.1
- Passport: 0.7.0
- Passport Google OAuth: 2.0.0
- LowDB: 7.0.1
- JSON Web Token: 9.0.3
- bcryptjs: 3.0.3
- nanoid: 5.1.7
- CORS: 2.8.6
- cookie-parser: 1.4.7
- express-session: 1.19.0
- mongoose: 9.3.3

## Quick Start

1. Install dependencies: `npm install`
2. Configure environment: edit `itms-backend/data/.env`
3. Start the server: `node server.js`

The server runs on `http://localhost:4000` by default.

## Environment Variables

Location: `itms-backend/data/.env`

Required:

- `PORT`
- `JWT_SECRET`
- `CLIENT_ORIGIN`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

Recommended:

- `SERVER_URL` (example: `http://localhost:4000`)
- `GOOGLE_CALLBACK_URL` (example: `http://localhost:4000/auth/google/callback`)

## Google OAuth Setup

In Google Cloud Console, add the following Authorized Redirect URI:

- `http://localhost:4000/auth/google/callback`

If you change ports, update both the `.env` values and the Google Console URI.

## Data Storage

Local data is stored in:

- `itms-backend/data/db.json`

## API Overview

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `PUT /api/user`
- `DELETE /api/user`
- `POST /api/user/update-profile-pic`
- `GET /auth/google`
- `GET /auth/google/callback`
