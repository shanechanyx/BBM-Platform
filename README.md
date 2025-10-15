# BBM Multiplayer Social Space Module

A production-ready real-time multiplayer social space with avatars, chat, voice, and video streaming.

## Features

### ✅ Core Features Implemented
- **Real-time Character Movement**: WASD controls with instant position synchronization
- **Dual Chat System**: Chat panel + speech bubbles above characters
- **Voice Communication**: WebRTC audio streaming with speaking indicators
- **Video Streaming**: Live video feeds with grid display
- **Modern UI**: Glassmorphic design with dark theme and gradients
- **Room Management**: Multi-user rooms with join/leave handling

### 🎮 Character System
- Smooth WASD movement with boundary collision
- Colorful avatar design with username display
- Real-time position sync across all users
- Speaking indicators (pulsing ring when talking)
- Camera indicators (purple ring when video is on)

### 💬 Chat Features
- **Chat Panel**: Scrollable message history with timestamps
- **Speech Bubbles**: Appear above characters for 4 seconds
- **Username Colors**: Unique colors for each user
- **Auto-scroll**: Chat panel automatically scrolls to latest messages

### 🎤 Voice & Video
- **Microphone Toggle**: Click to enable/disable audio
- **Camera Toggle**: Click to enable/disable video
- **Speaking Detection**: Visual indicators when someone is talking
- **Video Grid**: Live video feeds from all users
- **WebRTC**: Peer-to-peer audio/video streaming

## Tech Stack

### Frontend
- React 18+ with Hooks
- TypeScript support
- Tailwind CSS for styling
- Socket.IO Client for real-time communication
- WebRTC for peer-to-peer audio/video
- Canvas API for character rendering

### Backend
- Node.js with Express
- Socket.IO Server for WebSocket connections
- Room management system
- CORS configuration

## Quick Start

### Prerequisites
- Node.js 18+
- Modern browser with WebRTC support

### Installation

1. **Clone and setup server:**
```bash
cd server
npm install
```

2. **Setup client:**
```bash
cd ../client
npm install
```

3. **Create environment files:**

**Server (.env):**
```bash
PORT=4000
CORS_ORIGIN=http://localhost:5178
```

**Client (.env):**
```bash
VITE_SOCKET_URL=http://localhost:4000
```

### Running the Application

1. **Start the server:**
```bash
cd server
npm run dev
```

2. **Start the client:**
```bash
cd client
npm run dev
```

3. **Open your browser:**
   - Visit `http://localhost:5178`
   - Enter a username and join a room
   - Open multiple browser windows to test multiplayer

## Usage

### Movement
- **WASD** or **Arrow Keys**: Move your character
- **Real-time sync**: Other players see your movement instantly

### Chat
- **Type messages**: Use the chat panel at bottom-right
- **Speech bubbles**: Messages appear above your character
- **Enter key**: Send messages quickly

### Voice & Video
- **Mic button**: Toggle microphone on/off
- **Camera button**: Toggle video on/off
- **Speaking indicator**: Green pulsing dot when talking
- **Video grid**: See all active video streams

## Architecture

### Real-time Movement System
- Direct position updates using refs (bypasses React state)
- 60fps movement updates for smooth gameplay
- Immediate position synchronization
- Boundary collision detection

### WebRTC Implementation
- Peer-to-peer connections for audio/video
- Automatic speaking detection
- Visual indicators for media states
- STUN server configuration for NAT traversal

### Socket.IO Events
```javascript
// Client → Server
'user:join' - {username, roomId}
'user:move' - {x, y, userId}
'chat:message' - {text, userId, username}
'media:toggle' - {type, enabled}

// Server → Client
'room:users' - {users: [...]}
'user:moved' - {userId, x, y}
'chat:broadcast' - {message}
'webrtc:offer/answer/ice-candidate' - WebRTC signaling
```

## Deployment

### Server Deployment
1. Deploy to Node.js hosting (Render, Fly.io, Railway)
2. Set environment variables:
   - `PORT`: Server port
   - `CORS_ORIGIN`: Client URL

### Client Deployment
1. Build the client: `npm run build`
2. Deploy to static hosting (Vercel, Netlify)
3. Update `VITE_SOCKET_URL` to your server URL

### Production Considerations
- Use HTTPS for WebRTC
- Configure TURN servers for better connectivity
- Set up Redis for scaling multiple server instances
- Add authentication and rate limiting

## Development

### Project Structure
```
project-root/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── hooks/         # Custom hooks
│   │   └── styles.css     # Tailwind styles
│   └── package.json
├── server/                # Node.js backend
│   ├── src/
│   │   ├── index.js       # Express + Socket.IO server
│   │   ├── socketHandlers.js
│   │   └── roomManager.js
│   └── package.json
└── README.md
```

### Key Components
- **Canvas.jsx**: Main game canvas with character rendering
- **ChatBox.jsx**: Chat panel with message history
- **Controls.jsx**: Mic/camera toggle buttons
- **VideoGrid.jsx**: Video stream display
- **useSocket.jsx**: Socket.IO connection management
- **useWebRTC.jsx**: WebRTC audio/video handling

## Browser Support
- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support (iOS 14.3+)
- Mobile: Touch controls supported

## Performance
- 60fps canvas rendering
- Optimized WebRTC bandwidth usage
- Efficient position synchronization
- Memory leak prevention

## Security
- Input sanitization for chat messages
- CORS configuration
- WebRTC security best practices
- Environment variable protection

## License
MIT License - Feel free to use in your projects!

---

**Ready to build amazing multiplayer experiences!** 🚀
