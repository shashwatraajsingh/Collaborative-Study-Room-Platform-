# Collaborative Study Room Platform — Backend

A real-time collaborative study room backend built with NestJS, PostgreSQL, Redis, and Socket.io. Users can create study rooms, invite peers, chat in real-time, track study sessions, and view personal dashboard stats.

## Tech Stack

- **NestJS** (TypeScript) — framework
- **PostgreSQL** + **TypeORM** — relational database & ORM
- **Redis** (ioredis) — session state, presence tracking, refresh tokens
- **Socket.io** — real-time WebSockets
- **JWT** — authentication (access + refresh tokens)
- **bcrypt** — password hashing

## Getting Started

### Prerequisites

- Node.js ≥ 18
- PostgreSQL ≥ 14
- Redis ≥ 6

### Installation

```bash
cd Backend
npm install
```

### Environment Variables

Copy `.env.example` to `.env` and update the values:

```bash
cp .env.example .env
```

| Variable             | Description                 | Default                                         |
| -------------------- | --------------------------- | ----------------------------------------------- |
| `DATABASE_URL`       | PostgreSQL connection URL   | `postgres://postgres:postgres@localhost:5432/study_room` |
| `REDIS_URL`          | Redis connection URL        | `redis://localhost:6379`                         |
| `JWT_SECRET`         | Secret for access tokens    | *(change in production)*                        |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens   | *(change in production)*                        |
| `PORT`               | Server port                 | `3000`                                          |

### Create Database

```bash
createdb study_room
```

### Run the Server

```bash
# Development (hot-reload)
npm run start:dev

# Production
npm run build
npm run start:prod
```

### Seed the Database

```bash
npm run seed
```

Creates 2 users, 1 room, and sample messages:
- **alice** — `alice@studyroom.dev` / `password123`
- **bob** — `bob@studyroom.dev` / `password456`
- Room: "Algorithms Study Group" (invite code: `ALGO2025`)

### Migrations

```bash
# Run migrations
npm run typeorm:migrate
```

---

## API Reference

All success responses are wrapped as:

```json
{
  "success": true,
  "data": { ... }
}
```

All error responses:

```json
{
  "success": false,
  "message": "...",
  "statusCode": 400
}
```

---

### Auth

#### POST `/auth/register`

Create a new account.

**Request:**
```json
{
  "email": "user@example.com",
  "username": "johndoe",
  "password": "mypassword123"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbG...",
    "refreshToken": "eyJhbG...",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "username": "johndoe"
    }
  }
}
```

#### POST `/auth/login`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "mypassword123"
}
```

**Response (200):** Same shape as register.

#### POST `/auth/refresh`

**Request:**
```json
{
  "refreshToken": "eyJhbG..."
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbG..."
  }
}
```

#### POST `/auth/logout`

**Headers:** `Authorization: Bearer <accessToken>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Successfully logged out"
  }
}
```

---

### Rooms

All room endpoints require `Authorization: Bearer <accessToken>`.

#### POST `/rooms`

Create a new study room.

**Request:**
```json
{
  "name": "Data Structures Group",
  "description": "Optional description"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Data Structures Group",
    "description": "Optional description",
    "ownerId": "uuid",
    "inviteCode": "xK9mP2qR",
    "isActive": true,
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
}
```

#### GET `/rooms/my`

List rooms the authenticated user belongs to.

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Data Structures Group",
      "inviteCode": "xK9mP2qR",
      "isActive": true,
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

#### GET `/rooms/:id`

Get room details with member list.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Data Structures Group",
    "members": [
      { "id": "uuid", "userId": "uuid", "role": "owner", "joinedAt": "..." }
    ]
  }
}
```

#### POST `/rooms/join`

Join a room via invite code.

**Request:**
```json
{
  "inviteCode": "xK9mP2qR"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "roomId": "uuid",
    "userId": "uuid",
    "role": "member",
    "joinedAt": "..."
  }
}
```

#### DELETE `/rooms/:id`

Soft-delete a room (owner only).

**Response (200):**
```json
{
  "success": true,
  "data": { "message": "Room successfully deleted" }
}
```

---

### Sessions

All session endpoints require `Authorization: Bearer <accessToken>`.

#### POST `/rooms/:id/sessions/start`

Start a study session.

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "roomId": "uuid",
    "userId": "uuid",
    "startedAt": "2025-01-01T10:00:00.000Z",
    "endedAt": null,
    "durationSeconds": null
  }
}
```

#### POST `/rooms/:id/sessions/end`

End an active study session.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "roomId": "uuid",
    "userId": "uuid",
    "startedAt": "2025-01-01T10:00:00.000Z",
    "endedAt": "2025-01-01T11:30:00.000Z",
    "durationSeconds": 5400
  }
}
```

#### GET `/rooms/:id/sessions`

Get session history for a room.

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "userId": "uuid",
      "startedAt": "...",
      "endedAt": "...",
      "durationSeconds": 5400
    }
  ]
}
```

---

### Dashboard

#### GET `/dashboard/me`

**Headers:** `Authorization: Bearer <accessToken>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "totalStudyTimeSeconds": 36000,
    "totalSessionsCount": 12,
    "roomsJoined": 3,
    "dailyBreakdown": [
      { "date": "2025-05-23", "totalSeconds": 7200, "sessionCount": 2 },
      { "date": "2025-05-24", "totalSeconds": 3600, "sessionCount": 1 }
    ]
  }
}
```

---

### Messages

#### GET `/rooms/:id/messages?limit=50&before=<messageId>`

**Headers:** `Authorization: Bearer <accessToken>`

Cursor-based pagination. `before` is the ID of a message to fetch older messages from.

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "roomId": "uuid",
      "userId": "uuid",
      "content": "Hello everyone!",
      "createdAt": "2025-01-01T10:00:00.000Z",
      "user": {
        "id": "uuid",
        "username": "alice"
      }
    }
  ]
}
```

---

## WebSocket Events

Connect to the `/rooms` namespace with Socket.io:

```js
const socket = io('http://localhost:3000/rooms', {
  auth: { token: 'your-jwt-access-token' }
});
```

### Client → Server

| Event          | Payload                                  | Description                       |
| -------------- | ---------------------------------------- | --------------------------------- |
| `joinRoom`     | `{ roomId: string }`                     | Join a room for real-time events  |
| `leaveRoom`    | `{ roomId: string }`                     | Leave a room                      |
| `sendMessage`  | `{ roomId: string, content: string }`    | Send a chat message               |
| `startSession` | `{ roomId: string }`                     | Start a study session             |
| `endSession`   | `{ roomId: string }`                     | End an active study session       |

### Server → Client

| Event             | Payload                                                           | Description                     |
| ----------------- | ----------------------------------------------------------------- | ------------------------------- |
| `userJoined`      | `{ userId, username, roomId }`                                    | A user joined the room          |
| `userLeft`        | `{ userId, username, roomId }`                                    | A user left the room            |
| `newMessage`      | `{ id, roomId, userId, username, content, createdAt }`            | New chat message                |
| `sessionStarted`  | `{ userId, roomId, startedAt }`                                   | A user started studying         |
| `sessionEnded`    | `{ userId, roomId, durationSeconds }`                             | A user ended their session      |
| `presenceUpdate`  | `{ roomId, onlineUsers: [{ userId, username }] }`                 | Current online users in room    |

### Presence

Online users per room are stored in Redis as a Set with key `room:{roomId}:online`. On `joinRoom`, the user is added. On `leaveRoom` or disconnect, the user is removed. A `presenceUpdate` event is emitted to the room after every change.

---

## Project Structure

```
src/
├── main.ts                          # Bootstrap entry point
├── app.module.ts                    # Root module
├── common/                          # Shared infrastructure
│   ├── decorators/                  # Custom decorators
│   ├── filters/                     # Exception filters
│   ├── guards/                      # Auth guards (JWT, WS)
│   ├── interceptors/                # Response transform
│   └── pipes/                       # Validation pipe
├── infrastructure/                  # Database & Redis setup
│   ├── database/
│   └── redis/
├── auth/                            # Authentication module
├── users/                           # User management
├── rooms/                           # Study rooms
├── sessions/                        # Study sessions tracking
├── messages/                        # Chat messages
├── dashboard/                       # User stats & analytics
├── gateway/                         # WebSocket gateway
└── database/
    └── seed.ts                      # Database seeder
```

## NPM Scripts

| Script              | Description                              |
| ------------------- | ---------------------------------------- |
| `npm run start:dev` | Start development server with hot-reload |
| `npm run build`     | Build for production                     |
| `npm run start:prod`| Start production server                  |
| `npm run seed`      | Seed the database                        |
| `npm run typeorm:migrate` | Run TypeORM migrations              |

## License

MIT
