import React, { useState } from 'react'

export default function JoinScreen({ onJoin }) {
	const [name, setName] = useState('')
	const [room, setRoom] = useState('lobby')

	function submit(e) {
		e?.preventDefault()
		if (!name.trim()) return
		onJoin(name.trim(), room.trim() || 'lobby')
	}

	return (
		<div className="min-h-screen flex items-center justify-center p-6">
			<div className="glass-panel rounded-2xl p-8 w-full max-w-md border border-white/20">
				<h1 className="text-3xl font-bold mb-6">Join the Space</h1>
				<form onSubmit={submit} className="space-y-4">
					<div>
						<label className="text-sm text-white/70">Username</label>
						<input value={name} onChange={e => setName(e.target.value)} className="mt-1 w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-accent/60" />
					</div>
					<div>
						<label className="text-sm text-white/70">Room</label>
						<input value={room} onChange={e => setRoom(e.target.value)} className="mt-1 w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-accent/60" />
					</div>
					<button className="w-full py-2 rounded-lg bg-primary hover:scale-105 transition-transform shadow-lg">Join Room</button>
				</form>
			</div>
		</div>
	)
}


