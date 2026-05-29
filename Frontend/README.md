# Collaborative Study Room Platform - Frontend

This is the React + Vite + TypeScript frontend client for the Collaborative Study Room Platform.

## Tech Stack

- **React 18** (Vite + TypeScript)
- **React Router v6** (Router navigation & guards)
- **Zustand** (Local store state management)
- **Socket.io Client** (Real-time events synchronization)
- **Axios** (API requests with automatic token refreshing)
- **CSS Modules** (Manual component styling)

## Setup & Running

### 1. Prerequisites

Ensure you have [Node.js](https://nodejs.org) (v18+ recommended) installed.

### 2. Environment Variables

Create a `.env` file in the frontend root directory (copying from `.env.example`):

```bash
cp .env.example .env
```

Ensure the configuration keys point to your NestJS backend (by default `http://localhost:3000`):

```env
VITE_API_URL=http://localhost:3000
VITE_SOCKET_URL=http://localhost:3000
```

### 3. Installation

Install all node dependencies:

```bash
npm install
```

### 4. Running the Development Server

Launch the Vite local dev server:

```bash
npm run dev
```

The app will start on standard localhost ports (typically `http://localhost:5173`).

### 5. Building for Production

Compile and bundle the frontend for production deployment:

```bash
npm run build
```

The output bundle will be written to the `dist/` folder. You can preview it locally using:

```bash
npm run preview
```
