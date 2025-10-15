import React, { useRef, useEffect } from 'react'
import { useWebRTC } from '../hooks/useWebRTC.jsx'

export default function VideoGrid() {
	const { localStream, remoteStreams } = useWebRTC()
	const localVideoRef = useRef(null)

	// Setup local video
	useEffect(() => {
		if (localStream && localVideoRef.current) {
			localVideoRef.current.srcObject = localStream
		}
	}, [localStream])

	return (
		<div className="space-y-2">
			<h3 className="text-sm text-white/70 mb-2">Video Streams</h3>
			<div className="grid grid-cols-1 gap-2">
				{localStream && (
					<div className="relative">
						<video 
							ref={localVideoRef}
							autoPlay 
							muted 
							playsInline
							className="w-full aspect-video bg-black/40 rounded-lg border border-white/20 object-cover"
						/>
						<div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
							You
						</div>
					</div>
				)}
				{!localStream && (
					<div className="aspect-video bg-black/40 rounded-lg border border-white/20 flex items-center justify-center text-white/60">
						Click Mic/Camera to start
					</div>
				)}
			</div>
		</div>
	)
}


