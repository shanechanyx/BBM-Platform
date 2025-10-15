import { v4 as uuidv4 } from 'uuid';

export function createRoomManager() {
	/**
	 * rooms: Map<roomId, {
	 *   users: Map<socketId, { id, name, x, y, audio, video }>
	 * }>
	 */
	const rooms = new Map();

	function getOrCreateRoom(roomId) {
		if (!rooms.has(roomId)) {
			rooms.set(roomId, { users: new Map() });
		}
		return rooms.get(roomId);
	}

	function addUser(roomId, socketId, name) {
		const room = getOrCreateRoom(roomId);
		const user = {
			id: socketId,
			name,
			x: Math.floor(Math.random() * 700) + 50,
			y: Math.floor(Math.random() * 500) + 50,
			audio: false,
			video: false,
		};
		room.users.set(socketId, user);
		return user;
	}

	function removeUser(roomId, socketId) {
		const room = rooms.get(roomId);
		if (!room) return;
		room.users.delete(socketId);
		if (room.users.size === 0) rooms.delete(roomId);
	}

	function moveUser(roomId, socketId, x, y) {
		const room = rooms.get(roomId);
		if (!room) return;
		const user = room.users.get(socketId);
		if (!user) return;
		user.x = x;
		user.y = y;
	}

	function toggleMedia(roomId, socketId, type, enabled) {
		const room = rooms.get(roomId);
		if (!room) return;
		const user = room.users.get(socketId);
		if (!user) return;
		if (type === 'audio') user.audio = enabled;
		if (type === 'video') user.video = enabled;
	}

	function serializeUsers(roomId) {
		const room = rooms.get(roomId);
		if (!room) return [];
		return Array.from(room.users.values());
	}

	return {
		getOrCreateRoom,
		addUser,
		removeUser,
		moveUser,
		toggleMedia,
		serializeUsers,
	};
}


