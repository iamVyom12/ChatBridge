# ChatBridge - Next.js Migration

A real-time communication platform with video chat, text chat, and room-based conversations.

## Project Structure

```
ChatBridge/
├── app/                    # Next.js app directory (Frontend)
│   ├── page.js            # Home page
│   ├── chat/              # Chat-only page
│   ├── chat-random/       # Random video chat page
│   ├── chat-room/         # Room-based chat page
│   ├── lobby/             # Lobby page
│   └── layout.js          # Root layout
├── server/                # Backend server (Express + Socket.IO + PeerJS)
│   └── index.js           # Main server file
├── public/                # Static assets
│   ├── css/              # Stylesheets
│   ├── js/               # Legacy JavaScript (being migrated)
│   ├── images/           # Images
│   └── fonts/            # Fonts
├── src/                   # Legacy Express routes/controllers
├── Queue.js              # Queue implementation
├── States.js             # Shared state management
└── package.json          # Dependencies

```

## Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

3. Update `.env` with your configuration:
```
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
PORT=3001
FRONTEND_URL=http://localhost:3000
```

### Running the Application

You need to run both the frontend (Next.js) and backend (Express) servers:

**Terminal 1 - Backend Server:**
```bash
npm run server:dev
```

**Terminal 2 - Frontend (Next.js):**
```bash
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

## Features

- **Chat Random**: Random video chat matching with strangers
- **Chat Only**: Text-only chat matching
- **Chat Room**: Create or join video chat rooms
- **Real-time Communication**: Powered by Socket.IO and PeerJS

## Migration Status

✅ Next.js setup and configuration
✅ Backend server separation
✅ Home page migration
✅ Chat-only page migration
✅ Lobby page migration
✅ Chat-random page migration
✅ Chat-room page migration
🔄 CSS imports optimization (in progress)
🔄 Environment configuration

## Development

- `npm run dev` - Start Next.js development server
- `npm run build` - Build Next.js for production
- `npm run start` - Start Next.js production server
- `npm run server` - Start backend server
- `npm run server:dev` - Start backend server with nodemon

## Architecture

### Frontend (Next.js)
- React components with hooks
- Client-side routing
- Server-side rendering support

### Backend (Express)
- Socket.IO for real-time communication
- PeerJS server for WebRTC
- RESTful API endpoints
- Queue management for user matching

## License

ISC
