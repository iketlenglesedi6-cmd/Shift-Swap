# Shift Swap Exchange API

A professional, human-centered REST API for employees to offer, request, negotiate, and track workplace shift swaps. It is the CSE 341 Weeks 03–04 project.

## Features

- Two MongoDB collections: `shifts` and `swapRequests`.
- Full CRUD for both resources.
- Input validation, consistent error responses, and helpful business-rule messages.
- Shift-trade integrity: a request requires two existing, swappable shifts owned by different people.
- Interactive Swagger/OpenAPI documentation at `/api-docs`.

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
| Shifts | `GET`, `POST` `/api/shifts`; `GET`, `PUT`, `DELETE` `/api/shifts/:id` |
| Swap requests | `GET`, `POST` `/api/swaps`; `GET`, `PUT`, `DELETE` `/api/swaps/:id` |

Create two shifts before creating a swap request. Use the returned shift ids as `offeredShiftId` and `requestedShiftId`.

## MongoDB and Render

Create a separate MongoDB database, such as `shift_swap_exchange`. On Render use `npm install` as the build command and `npm start` as the start command. Add `MONGODB_URI` and `MONGODB_DATABASE` as Render environment variables. Do not add `PORT` unless Render specifically requires it.

OAuth user management will be added in Week 04.
