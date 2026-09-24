# Shift Swap Exchange API

A professional, human-centered REST API for employees to offer, request, negotiate, and track workplace shift swaps. It is the CSE 341 Weeks 03–04 project.

## Features

- Two MongoDB collections: `shifts` and `swapRequests`.
- Full CRUD for both resources.
- Input validation, consistent error responses, and helpful business-rule messages.
- Shift-trade integrity: a request requires two existing, swappable shifts owned by different people.
- Interactive Swagger/OpenAPI documentation at `/api-docs`.
- GitHub OAuth, account registration, password login, revocable bearer tokens, and protected resource routes.
- Passwords are stored as salted scrypt hashes; token hashes are stored in MongoDB with seven-day expiration.

## Setup

1. Install Node.js 20 or later.
2. Run `npm install`.
3. Copy `.env.example` to `.env` and enter your MongoDB connection string and database name.
4. Run `npm run dev` (or `npm start`).
5. Open `http://localhost:3000/api-docs`.

Never commit `.env`; it contains database credentials.

## API routes

| Resource | Routes |
| --- | --- |
| Authentication | `GET /api/auth/github` (OAuth), `GET /api/auth/github/callback`, `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me` |
| Shifts (bearer token required) | `GET`, `POST` `/api/shifts`; `GET`, `PUT`, `DELETE` `/api/shifts/:id` |
| Swap requests (bearer token required) | `GET`, `POST` `/api/swaps`; `GET`, `PUT`, `DELETE` `/api/swaps/:id` |

Create two shifts before creating a swap request. Use the returned shift ids as `offeredShiftId` and `requestedShiftId`.

For GitHub OAuth, create a GitHub OAuth App with homepage URL set to your API root and callback URL set to `GITHUB_CALLBACK_URL`. Configure `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GITHUB_CALLBACK_URL`, and a long random `AUTH_STATE_SECRET` in `.env` and as Render environment variables. To log in, open `/api/auth/github`; after consent the callback returns a bearer token. Copy it into Swagger's **Authorize** control to call the protected routes. The `/api/auth/logout` route revokes the token. Password registration and login are also available as an alternative.

## MongoDB and Render

Create a separate MongoDB database, such as `shift_swap_exchange`. On Render use `npm install` as the build command and `npm start` as the start command. Add `MONGODB_URI` and `MONGODB_DATABASE` as Render environment variables. Do not add `PORT` unless Render specifically requires it.
