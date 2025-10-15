import React, { useEffect, useRef, useState } from 'react'
import { useSocket } from '../hooks/useSocket.jsx'

export default function ChatBox() {
	const { socket, state } = useSocket()
	const [text, setText] = useState('')
	const listRef = useRef(null)

	useEffect(() => {
		if (!listRef.current) return
		listRef.current.scrollTop = listRef.current.scrollHeight
	}, [state.messages])

	function send() {
		if (!text.trim()) return
		socket.emit('chat:message', { text })
		setText('')
	}

	return (
		<div className="text-white">
			<div ref={listRef} className="h-64 overflow-y-auto pr-2 space-y-2">
				{state.messages.map(m => (
					<div key={m.id} className="flex gap-2 items-baseline">
						<span className="text-xs text-white/60">{new Date(m.timestamp).toLocaleTimeString()}</span>
						<span className="text-sm font-semibold" style={{ color: `hsl(${Math.abs(hash(m.username)) % 360} 80% 70%)` }}>{m.username}</span>
						<span className="text-sm text-white/90">{m.text}</span>
					</div>
				))}
			</div>
			<div className="mt-3 flex gap-2">
				<input
					value={text}
					onChange={e => setText(e.target.value)}
					onKeyDown={e => { if (e.key === 'Enter') send() }}
					placeholder="Type a message..."
					className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-accent/60"
				/>
				<button onClick={send} className="px-3 py-2 rounded-lg bg-primary hover:scale-105 transition-transform shadow-lg">Send</button>
			</div>
		</div>
	)
}

function hash(str) { let h = 0; for (let i = 0; i < str.length; i++) h = ((h << 5) - h) + str.charCodeAt(i) | 0; return h }


