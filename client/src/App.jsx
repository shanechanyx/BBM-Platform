import React, { useMemo, useState } from 'react'
import JoinScreen from './components/JoinScreen.jsx'
import Canvas from './components/Canvas.jsx'
import ChatBox from './components/ChatBox.jsx'
import Controls from './components/Controls.jsx'
import UserList from './components/UserList.jsx'
import VideoGrid from './components/VideoGrid.jsx'
import { SocketProvider } from './hooks/useSocket.jsx'

export default function App() {
	const [joined, setJoined] = useState(false)
	const [username, setUsername] = useState('')
	const [roomId, setRoomId] = useState('lobby')

	if (!joined) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-purple-900 to-blue-900 text-white">
				<JoinScreen onJoin={(name, room) => { setUsername(name); setRoomId(room || 'lobby'); setJoined(true) }} />
			</div>
		)
	}

	return (
		<SocketProvider username={username} roomId={roomId}>
			<div className="min-h-screen bg-gradient-to-br from-purple-900 to-blue-900 text-white overflow-hidden">
				<div className="relative h-screen">
					<Canvas />
					<div className="absolute right-4 bottom-4 w-96 max-w-[95vw] glass-panel rounded-xl p-3 border border-white/20">
						<ChatBox />
					</div>
					<div className="absolute left-4 top-4 glass-panel rounded-xl p-3 border border-white/20">
						<UserList />
					</div>
					<div className="absolute left-1/2 -translate-x-1/2 bottom-4 flex gap-3 glass-panel rounded-full px-4 py-2 items-center border border-white/20">
						<Controls />
					</div>
					<div className="absolute right-4 top-4 glass-panel rounded-xl p-3 border border-white/20 max-w-[40vw]">
						<VideoGrid />
					</div>
				</div>
			</div>
		</SocketProvider>
	)
}


