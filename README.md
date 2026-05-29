# Collaborative Study Room Platform

This is a full-stack web application designed for students to create and join virtual study rooms via invite codes. It tracks study sessions using live timers, provides real-time chat within rooms, and includes a personal dashboard to view total study time, session counts, and a 7-day activity breakdown. The goal is to provide a focused, distraction-free environment for group study sessions.

## Tech Stack

Backend: NestJS, TypeScript, PostgreSQL (TypeORM), Redis, Socket.io, JWT
Frontend: React, Vite, TypeScript, Zustand, CSS Modules

## Getting Started

### Prerequisites
- Node.js (v18+)
- PostgreSQL
- Redis

### Backend Setup
1. Navigate to the backend directory: `cd Backend`
2. Install dependencies: `npm install`
3. Copy the example environment file: `cp .env.example .env`
4. Set the environment variables in `.env`
5. Start the development server: `npm run start:dev`

### Frontend Setup
1. Navigate to the frontend directory: `cd Frontend`
2. Install dependencies: `npm install`
3. Copy the example environment file: `cp .env.example .env`
4. Set the environment variables in `.env`
5. Start the development server: `npm run dev`

## Environment Variables

| Variable | Description |
|---|---|
| **Backend** | |
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `JWT_ACCESS_SECRET` | Secret for signing access tokens |
| `JWT_REFRESH_SECRET` | Secret for signing refresh tokens |
| `PORT` | Port for the backend server to listen on |
| `FRONTEND_URL` | Allowed origin for CORS |
| **Frontend** | |
| `VITE_API_URL` | URL of the backend REST API |
| `VITE_SOCKET_URL` | URL of the backend WebSocket server |

## API Overview

### Authentication
Handles user registration, login, and token refreshing. Issues short-lived access tokens and long-lived refresh tokens.

### Users
Retrieves the authenticated user's profile and dashboard statistics. The dashboard endpoint aggregates total study time, session counts, and daily activity for the last 7 days.

### Rooms
Manages the creation of study rooms and joining existing ones via invite codes. Also handles retrieving room details and listing the current members.

### Sessions
Starts and ends study sessions within a room. Records the start time and calculates the duration when ended to update user statistics.

### Messages
Fetches chat history for a specific room.

## WebSocket Events

| Event Name | Description |
|---|---|
| `joinRoom` | Client requests to join a room's WebSocket channel |
| `leaveRoom` | Client disconnects or leaves a room's WebSocket channel |
| `userJoined` | Server broadcasts when a new user enters the room |
| `userLeft` | Server broadcasts when a user leaves the room |
| `sendMessage` | Client sends a new chat message to the room |
| `newMessage` | Server broadcasts a new chat message to all clients in the room |
| `presenceUpdate` | Server broadcasts updates to the list of online users in the room |

## Folder Structure

This repository is structured as a monorepo containing two main directories at the root: `/Backend` and `/Frontend`. The backend is a NestJS application using domain-driven modules, while the frontend is a React application built with Vite, utilizing Zustand for global state and CSS Modules for component styling.
