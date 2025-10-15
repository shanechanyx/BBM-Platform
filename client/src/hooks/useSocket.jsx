import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { io } from 'socket.io-client'

const SocketContext = createContext(null)

export function SocketProvider({ username, roomId, children }) {
	const socketRef = useRef(null)
	const [connected, setConnected] = useState(false)
	const [state, setState] = useState({
		localUser: null,
		remoteUsers: new Map(),
		messages: [],
	})

	useEffect(() => {
		const url = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000'
		const socket = io(url, { transports: ['websocket'] })
		socketRef.current = socket
		socket.on('connect', () => setConnected(true))
		socket.on('disconnect', () => setConnected(false))

		socket.emit('user:join', { username, roomId })

		socket.on('room:users', ({ users }) => {
			const remote = new Map()
			users.forEach(u => {
				if (u.id === socket.id) return
				remote.set(u.id, u)
			})
			setState(prev => ({ ...prev, localUser: users.find(u => u.id === socket.id) || null, remoteUsers: remote }))
		})

		socket.on('user:joined', (u) => {
			setState(prev => {
				const remote = new Map(prev.remoteUsers)
				remote.set(u.userId, { id: u.userId, name: u.username, x: u.x, y: u.y, audio: false, video: false })
				return { ...prev, remoteUsers: remote }
			})
		})

		socket.on('user:moved', ({ userId, x, y }) => {
			// Direct update without React state for immediate response
			setState(prev => {
				const remote = new Map(prev.remoteUsers)
				const ex = remote.get(userId)
				if (ex) {
					remote.set(userId, { ...ex, x, y })
				}
				return { ...prev, remoteUsers: remote }
			})
		})

		socket.on('chat:broadcast', ({ message }) => {
			setState(prev => ({ ...prev, messages: [...prev.messages, message] }))
		})

		socket.on('user:left', ({ userId }) => {
			setState(prev => {
				const remote = new Map(prev.remoteUsers)
				remote.delete(userId)
				return { ...prev, remoteUsers: remote }
			})
		})

		return () => {
			socket.disconnect()
		}
	}, [username, roomId])

	const value = useMemo(() => ({
		socket: socketRef.current,
		connected,
		state,
		setState,
	}), [connected, state])

	return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
}

export function useSocket() {
	const ctx = useContext(SocketContext)
	if (!ctx) throw new Error('useSocket must be used within SocketProvider')
	return ctx
}


