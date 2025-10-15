import React from 'react'
import { useWebRTC } from '../hooks/useWebRTC.jsx'

export default function Controls() {
	const { isMicOn, isCameraOn, isSpeaking, mediaError, toggleMic, toggleCamera, initMedia } = useWebRTC()

	return (
		<div className="flex flex-col gap-3">
			<div className="flex gap-3">
				<button 
					onClick={toggleMic} 
					className={`px-4 py-2 rounded-full transition-transform hover:scale-105 ${isMicOn ? 'bg-accent' : 'bg-white/10'} border border-white/20 flex items-center gap-2`}
				>
					<div className={`w-2 h-2 rounded-full ${isSpeaking ? 'bg-green-400 animate-pulse' : isMicOn ? 'bg-accent' : 'bg-gray-400'}`} />
					{isMicOn ? 'Mic On' : 'Mic Off'}
				</button>
				<button 
					onClick={toggleCamera} 
					className={`px-4 py-2 rounded-full transition-transform hover:scale-105 ${isCameraOn ? 'bg-primary' : 'bg-white/10'} border border-white/20 flex items-center gap-2`}
				>
					<div className={`w-2 h-2 rounded-full ${isCameraOn ? 'bg-primary' : 'bg-gray-400'}`} />
					{isCameraOn ? 'Cam On' : 'Cam Off'}
				</button>
			</div>
			{mediaError && (
				<div className="text-xs text-red-400 bg-red-900/20 px-3 py-2 rounded-lg border border-red-500/30">
					Media Error: {mediaError}
					<button 
						onClick={initMedia}
						className="ml-2 text-blue-400 hover:text-blue-300 underline"
					>
						Retry
					</button>
				</div>
			)}
		</div>
	)
}


