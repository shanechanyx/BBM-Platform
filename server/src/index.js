import 'dotenv/config';
import express from 'express';
import http from 'http';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { Server } from 'socket.io';
import { createRoomManager } from './roomManager.js';
import { registerSocketHandlers } from './socketHandlers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 4000;
// In production, allow all origins since client is served from same server
const CORS_ORIGIN = process.env.NODE_ENV === 'production' 
	? '*' 
	: (process.env.CORS_ORIGIN || process.env.RAILWAY_STATIC_URL || 'http://localhost:5178');

const app = express();
app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
app.get('/health', (_req, res) => res.json({ ok: true }));

// Serve static files from client build (absolute path for production)
const clientDistPath = path.join(__dirname, '../../client/dist');
app.use(express.static(clientDistPath));

// Serve the React app for all non-API routes
app.get('*', (_req, res) => {
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

const server = http.createServer(app);
const io = new Server(server, {
	cors: { 
		origin: CORS_ORIGIN,
		credentials: true 
	},
});

const roomManager = createRoomManager();
io.on('connection', (socket) => registerSocketHandlers(io, socket, roomManager));

server.listen(PORT, () => {
	console.log(`[server] listening on :${PORT}`);
});


