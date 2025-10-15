import { randomUUID } from 'crypto';

export function registerSocketHandlers(io, socket, roomManager) {
	let roomId = null;
	let username = null;

	function safeEmit(event, payload) {
		try {
			io.to(roomId).emit(event, payload);
		} catch (err) {
			console.error('[socket] emit error', event, err);
		}
	}

	socket.on('user:join', ({ username: name, roomId: rid }) => {
		if (!name || !rid) return;
		roomId = String(rid);
		username = String(name).slice(0, 32);
		socket.join(roomId);
		const user = roomManager.addUser(roomId, socket.id, username);
		// Notify the new user with full state
		socket.emit('room:users', { users: roomManager.serializeUsers(roomId) });
		// Notify others
		socket.to(roomId).emit('user:joined', {
			userId: user.id,
			username: user.name,
			x: user.x,
			y: user.y,
		});
	});

	socket.on('user:move', ({ x, y }) => {
		if (roomId == null) return;
		const nx = Math.max(0, Math.min(960, Number(x)));
		const ny = Math.max(0, Math.min(640, Number(y)));
		roomManager.moveUser(roomId, socket.id, nx, ny);
		socket.to(roomId).emit('user:moved', { userId: socket.id, x: nx, y: ny });
	});

	socket.on('chat:message', ({ text }) => {
		if (roomId == null || !text) return;
		const msg = String(text).slice(0, 400);
		const payload = {
			id: randomUUID(),
			userId: socket.id,
			username,
			text: msg,
			timestamp: Date.now(),
		};
		safeEmit('chat:broadcast', { message: payload });
	});

	// WebRTC signaling relay
	socket.on('webrtc:offer', (data) => {
		if (!data?.to) return;
		io.to(data.to).emit('webrtc:offer', { ...data, from: socket.id });
	});
	socket.on('webrtc:answer', (data) => {
		if (!data?.to) return;
		io.to(data.to).emit('webrtc:answer', { ...data, from: socket.id });
	});
	socket.on('webrtc:ice-candidate', (data) => {
		if (!data?.to) return;
		io.to(data.to).emit('webrtc:ice-candidate', { ...data, from: socket.id });
	});

	socket.on('media:toggle', ({ type, enabled }) => {
		if (roomId == null) return;
		roomManager.toggleMedia(roomId, socket.id, type, !!enabled);
		socket.to(roomId).emit('media:toggle', { userId: socket.id, type, enabled: !!enabled });
	});

	socket.on('disconnect', () => {
		if (roomId == null) return;
		roomManager.removeUser(roomId, socket.id);
		socket.to(roomId).emit('user:left', { userId: socket.id });
	});
}


