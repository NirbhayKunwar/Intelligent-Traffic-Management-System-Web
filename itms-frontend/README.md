# ITMS Frontend

Vite + React frontend for the Intelligent Traffic Management System (ITMS).

## Requirements

- Node.js 18+
- npm

## Tooling Versions

- Node.js: 18+
- Vite: 8.0.1
- React: 19.2.4
- React DOM: 19.2.4
- React Router DOM: 7.13.2
- Tailwind CSS: 4.2.2
- Leaflet: 1.9.4
- React Leaflet: 5.0.0
- Framer Motion: 12.38.0
- Lucide React: 1.7.0

## Quick Start

1. Install dependencies: `npm install`
2. Start the dev server: `npm run dev`

The app runs on `http://localhost:5173` by default.

## API Configuration

By default, Vite proxies `/api` requests to the backend:

- `http://localhost:4000` (see `itms-frontend/vite.config.js`)

If you want to hit a different backend URL, set:

- `VITE_API_BASE_URL` in a local env file (for example `itms-frontend/.env.local`)

Example: `VITE_API_BASE_URL=http://localhost:4000`

## Notes

- The frontend expects the backend to set auth cookies (JWT).
- Google OAuth redirects back to the frontend `CLIENT_ORIGIN` defined in the backend `.env`.
