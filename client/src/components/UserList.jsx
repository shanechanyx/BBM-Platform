import React from 'react'
import { useSocket } from '../hooks/useSocket.jsx'

export default function UserList() {
	const { state } = useSocket()
	const count = 1 + state.remoteUsers.size
	return (
		<div>
			<div className="text-sm text-white/70">Online: {count}</div>
			<ul className="mt-2 space-y-1">
				<li className="text-white/90">You</li>
				{Array.from(state.remoteUsers.values()).map(u => (
					<li key={u.id} className="text-white/90">{u.name}</li>
				))}
			</ul>
		</div>
	)
}


