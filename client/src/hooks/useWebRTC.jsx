import { useEffect, useRef, useState } from 'react'
import { useSocket } from './useSocket.jsx'

export function useWebRTC() {
	const [localStream, setLocalStream] = useState(null)
	const [remoteStreams, setRemoteStreams] = useState(new Map())
	const [isMicOn, setIsMicOn] = useState(false)
	const [isCameraOn, setIsCameraOn] = useState(false)
	const [isSpeaking, setIsSpeaking] = useState(false)
	const [mediaError, setMediaError] = useState(null)
	
	const peerConnectionsRef = useRef(new Map())
	const localStreamRef = useRef(null)
	const audioContextRef = useRef(null)
	const analyserRef = useRef(null)
	const dataArrayRef = useRef(null)
	const speakingDetectionRef = useRef(null)
	
	const { socket } = useSocket()

	// Initialize media devices only when needed
	const initMedia = async () => {
		try {
			setMediaError(null)
			console.log('Requesting media access...')
			console.log('Browser info:', navigator.userAgent)
			console.log('MediaDevices available:', !!navigator.mediaDevices)
			
			// Check if getUserMedia is supported
			if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
				throw new Error('getUserMedia is not supported in this browser')
			}
			
			// Try to get both audio and video first
			let stream
			try {
				console.log('Attempting to get audio + video stream...')
				stream = await navigator.mediaDevices.getUserMedia({
					audio: true,
					video: {
						width: { ideal: 320, max: 640 },
						height: { ideal: 240, max: 480 },
						frameRate: { ideal: 15, max: 30 }
					}
				})
				console.log('Successfully got audio + video stream')
			} catch (videoErr) {
				console.warn('Video failed, trying audio only:', videoErr)
				try {
					stream = await navigator.mediaDevices.getUserMedia({
						audio: true
					})
					console.log('Successfully got audio-only stream')
				} catch (audioErr) {
					console.error('Both audio and video failed:', audioErr)
					throw audioErr
				}
			}
			
			console.log('Media stream obtained:', stream)
			localStreamRef.current = stream
			setLocalStream(stream)
			setIsMicOn(true)
			setIsCameraOn(stream.getVideoTracks().length > 0)
			
			// Setup audio analysis for speaking detection
			try {
				if (audioContextRef.current) {
					audioContextRef.current.close()
				}
				
				// Check if AudioContext is supported
				if (window.AudioContext || window.webkitAudioContext) {
					audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)()
					const source = audioContextRef.current.createMediaStreamSource(stream)
					analyserRef.current = audioContextRef.current.createAnalyser()
					analyserRef.current.fftSize = 256
					source.connect(analyserRef.current)
					
					dataArrayRef.current = new Uint8Array(analyserRef.current.frequencyBinCount)
					
					// Start speaking detection
					startSpeakingDetection()
				} else {
					console.warn('AudioContext not supported, skipping speaking detection')
				}
			} catch (audioErr) {
				console.warn('Audio analysis setup failed:', audioErr)
			}
		} catch (err) {
			console.error('Error accessing media devices:', err)
			setMediaError(`Media access failed: ${err.message}. Please check your browser permissions.`)
		}
	}

	// Speaking detection with proper cleanup
	const startSpeakingDetection = () => {
		if (speakingDetectionRef.current) {
			cancelAnimationFrame(speakingDetectionRef.current)
		}
		
		const detectSpeaking = () => {
			if (!analyserRef.current || !dataArrayRef.current) {
				speakingDetectionRef.current = requestAnimationFrame(detectSpeaking)
				return
			}
			
			try {
				analyserRef.current.getByteFrequencyData(dataArrayRef.current)
				const average = dataArrayRef.current.reduce((a, b) => a + b) / dataArrayRef.current.length
				
				const speaking = average > 30 // Threshold for speaking detection
				if (speaking !== isSpeaking) {
					setIsSpeaking(speaking)
					if (socket) {
						socket.emit('media:toggle', { type: 'speaking', enabled: speaking })
					}
				}
			} catch (err) {
				console.warn('Speaking detection error:', err)
			}
			
			speakingDetectionRef.current = requestAnimationFrame(detectSpeaking)
		}
		
		detectSpeaking()
	}

	// Toggle microphone
	const toggleMic = async () => {
		if (!localStreamRef.current) {
			await initMedia()
			return
		}
		
		const audioTrack = localStreamRef.current.getAudioTracks()[0]
		if (audioTrack) {
			audioTrack.enabled = !audioTrack.enabled
			setIsMicOn(audioTrack.enabled)
			if (socket) {
				socket.emit('media:toggle', { type: 'audio', enabled: audioTrack.enabled })
			}
		}
	}

	// Toggle camera
	const toggleCamera = async () => {
		if (!localStreamRef.current) {
			await initMedia()
			return
		}
		
		const videoTrack = localStreamRef.current.getVideoTracks()[0]
		if (videoTrack) {
			videoTrack.enabled = !videoTrack.enabled
			setIsCameraOn(videoTrack.enabled)
			if (socket) {
				socket.emit('media:toggle', { type: 'video', enabled: videoTrack.enabled })
			}
		} else {
			// If no video track exists, try to get a new stream with video
			try {
				console.log('No video track found, requesting new stream with video...')
				
				// Check available devices first
				const devices = await navigator.mediaDevices.enumerateDevices()
				const videoDevices = devices.filter(device => device.kind === 'videoinput')
				console.log('Available video devices:', videoDevices.length)
				
				if (videoDevices.length === 0) {
					throw new Error('No camera devices found')
				}
				
				const newStream = await navigator.mediaDevices.getUserMedia({
					audio: true,
					video: {
						width: { ideal: 320, max: 640 },
						height: { ideal: 240, max: 480 },
						frameRate: { ideal: 15, max: 30 },
						facingMode: 'user'
					}
				})
				
				// Stop old tracks
				if (localStreamRef.current) {
					localStreamRef.current.getTracks().forEach(track => track.stop())
				}
				
				localStreamRef.current = newStream
				setLocalStream(newStream)
				setIsCameraOn(true)
				
				if (socket) {
					socket.emit('media:toggle', { type: 'video', enabled: true })
				}
			} catch (err) {
				console.error('Failed to get video stream:', err)
				setMediaError(`Camera access failed: ${err.message}. Please check if your camera is being used by another application.`)
			}
		}
	}

	// Create peer connection and send offer
	const createPeerConnection = async (userId) => {
		try {
			const peerConnection = new RTCPeerConnection({
				iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
			})

			// Add local stream
			if (localStreamRef.current) {
				localStreamRef.current.getTracks().forEach(track => {
					peerConnection.addTrack(track, localStreamRef.current)
				})
			}

			// Handle remote stream
			peerConnection.ontrack = (event) => {
				const [remoteStream] = event.streams
				setRemoteStreams(prev => new Map(prev).set(userId, remoteStream))
			}

			// Handle ICE candidates
			peerConnection.onicecandidate = (event) => {
				if (event.candidate) {
					socket.emit('webrtc:ice-candidate', {
						to: userId,
						candidate: event.candidate
					})
				}
			}

			// Create and send offer
			const offer = await peerConnection.createOffer()
			await peerConnection.setLocalDescription(offer)

			socket.emit('webrtc:offer', {
				to: userId,
				offer: offer
			})

			peerConnectionsRef.current.set(userId, peerConnection)
		} catch (err) {
			console.error('Error creating peer connection:', err)
		}
	}

	// Simplified WebRTC setup - just handle media toggle for now
	useEffect(() => {
		if (!socket) return

		// Handle media toggle events from other users
		socket.on('media:toggle', ({ userId, type, enabled }) => {
			console.log(`User ${userId} ${type}: ${enabled}`)
			// For now, just log the events
			// In a full implementation, this would update remote user states
		})

		return () => {
			socket.off('media:toggle')
		}
	}, [socket])

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			if (localStreamRef.current) {
				localStreamRef.current.getTracks().forEach(track => track.stop())
			}
			if (audioContextRef.current) {
				audioContextRef.current.close()
			}
			if (speakingDetectionRef.current) {
				cancelAnimationFrame(speakingDetectionRef.current)
			}
		}
	}, [])

	return {
		localStream,
		remoteStreams,
		isMicOn,
		isCameraOn,
		isSpeaking,
		mediaError,
		toggleMic,
		toggleCamera,
		initMedia,
		createPeerConnection
	}
}
