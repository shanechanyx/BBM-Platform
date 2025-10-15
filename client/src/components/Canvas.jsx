import React, { useEffect, useRef } from 'react'
import { useSocket } from '../hooks/useSocket.jsx'
import { useKeyboard } from '../hooks/useKeyboard.jsx'
import { useWebRTC } from '../hooks/useWebRTC.jsx'

const WIDTH = 960
const HEIGHT = 640
const SPEED = 220 // px per second

export default function Canvas() {
	const canvasRef = useRef(null)
	const lastRef = useRef(performance.now())
	const sendThrottleRef = useRef(0)
	const lastSyncRef = useRef(0)
	
	// Direct position storage for real-time updates
	const positionsRef = useRef(new Map())
	const localPositionRef = useRef({ x: 400, y: 300 })
	const speechBubblesRef = useRef(new Map())

	const { socket, state, setState } = useSocket()
	const keys = useKeyboard()
	const { isSpeaking, isCameraOn } = useWebRTC()

	// Direct socket listener for immediate position updates
	useEffect(() => {
		if (!socket) return
		
		const handleMove = ({ userId, x, y }) => {
			positionsRef.current.set(userId, { x, y })
		}
		
		const handleChat = ({ message }) => {
			// Show speech bubble for 4 seconds
			speechBubblesRef.current.set(message.userId, {
				text: message.text,
				username: message.username,
				timestamp: Date.now()
			})
			setTimeout(() => {
				speechBubblesRef.current.delete(message.userId)
			}, 4000)
		}
		
		socket.on('user:moved', handleMove)
		socket.on('chat:broadcast', handleChat)
		return () => {
			socket.off('user:moved', handleMove)
			socket.off('chat:broadcast', handleChat)
		}
	}, [socket])

	useEffect(() => {
		const ctx = canvasRef.current.getContext('2d')
		let raf = 0

		function step(ts) {
			const dt = (ts - lastRef.current) / 1000
			lastRef.current = ts
			update(dt)
			render(ctx)
			raf = requestAnimationFrame(step)
		}

		function update(dt) {
			let { x, y } = localPositionRef.current
			let dx = 0, dy = 0
			if (keys.has('w') || keys.has('arrowup')) dy -= 1
			if (keys.has('s') || keys.has('arrowdown')) dy += 1
			if (keys.has('a') || keys.has('arrowleft')) dx -= 1
			if (keys.has('d') || keys.has('arrowright')) dx += 1
			if (dx !== 0 || dy !== 0) {
				const len = Math.hypot(dx, dy)
				dx /= len; dy /= len
				x += dx * SPEED * dt
				y += dy * SPEED * dt
				x = Math.max(24, Math.min(WIDTH - 24, x))
				y = Math.max(24, Math.min(HEIGHT - 24, y))
				localPositionRef.current = { x, y }
			}
			
			// Send position updates when moving
			if (dx !== 0 || dy !== 0) {
				sendThrottleRef.current += dt
				if (sendThrottleRef.current >= 0.016 && socket) { // ~60fps
					sendThrottleRef.current = 0
					socket.emit('user:move', { x, y })
				}
			}
			
			// Periodic sync every 100ms to ensure positions stay in sync
			lastSyncRef.current += dt
			if (lastSyncRef.current >= 0.1 && socket) {
				lastSyncRef.current = 0
				socket.emit('user:move', { x, y })
			}
		}

		function render(ctx) {
			ctx.clearRect(0, 0, WIDTH, HEIGHT)
			// background gradient grid
			const grad = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT)
			grad.addColorStop(0, '#1f1147')
			grad.addColorStop(1, '#0b2a5a')
			ctx.fillStyle = grad
			ctx.fillRect(0, 0, WIDTH, HEIGHT)
			ctx.save()
			ctx.globalAlpha = 0.2
			ctx.strokeStyle = '#ffffff'
			for (let gx = 0; gx < WIDTH; gx += 40) {
				ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, HEIGHT); ctx.stroke()
			}
			for (let gy = 0; gy < HEIGHT; gy += 40) {
				ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(WIDTH, gy); ctx.stroke()
			}
			ctx.restore()

			function drawAvatar(user, speaking = false, cameraOn = false) {
				const { x, y, name } = user
				// avatar body
				ctx.save()
				ctx.shadowColor = 'rgba(0,0,0,0.5)'
				ctx.shadowBlur = 12
				const r = 22
				const hue = Math.abs(hash(name)) % 360
				ctx.fillStyle = `hsl(${hue} 80% 60% / 1)`
				ctx.beginPath(); ctx.ellipse(x, y, r, r * 1.2, 0, 0, Math.PI * 2); ctx.fill()
				// face
				ctx.fillStyle = '#fff'
				ctx.beginPath(); ctx.arc(x - 7, y - 4, 3, 0, Math.PI * 2); ctx.fill()
				ctx.beginPath(); ctx.arc(x + 7, y - 4, 3, 0, Math.PI * 2); ctx.fill()
				ctx.strokeStyle = '#fff'; ctx.lineWidth = 2
				ctx.beginPath(); ctx.arc(x, y + 6, 8, 0, Math.PI); ctx.stroke()
				// status ring
				if (speaking) {
					ctx.strokeStyle = '#22d3ee'; ctx.lineWidth = 4
					ctx.beginPath(); ctx.arc(x, y, r + 6, 0, Math.PI * 2); ctx.stroke()
				}
				if (cameraOn) {
					ctx.strokeStyle = '#a78bfa'; ctx.lineWidth = 2
					ctx.beginPath(); ctx.arc(x, y, r + 10, 0, Math.PI * 2); ctx.stroke()
				}
				ctx.restore()
				// username badge
				ctx.save()
				ctx.font = '12px Inter, system-ui'
				ctx.textAlign = 'center'
				ctx.fillStyle = 'rgba(255,255,255,0.85)'
				ctx.fillText(name, x, y - 34)
				ctx.restore()
			}

			function drawSpeechBubble(x, y, text, username) {
				ctx.save()
				ctx.font = '14px Inter, system-ui'
				ctx.textAlign = 'center'
				
				// Measure text
				const maxWidth = 200
				const lines = []
				const words = text.split(' ')
				let currentLine = ''
				
				for (const word of words) {
					const testLine = currentLine + (currentLine ? ' ' : '') + word
					const metrics = ctx.measureText(testLine)
					if (metrics.width > maxWidth && currentLine) {
						lines.push(currentLine)
						currentLine = word
					} else {
						currentLine = testLine
					}
				}
				if (currentLine) lines.push(currentLine)
				
				const lineHeight = 18
				const padding = 12
				const bubbleWidth = Math.min(maxWidth + padding * 2, Math.max(...lines.map(l => ctx.measureText(l).width)) + padding * 2)
				const bubbleHeight = lines.length * lineHeight + padding * 2
				
				// Bubble position
				const bubbleX = x
				const bubbleY = y - 60 - bubbleHeight
				
				// Draw bubble background
				ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
				ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
				ctx.lineWidth = 2
				
				// Rounded rectangle
				const radius = 12
				ctx.beginPath()
				ctx.roundRect(bubbleX - bubbleWidth/2, bubbleY, bubbleWidth, bubbleHeight, radius)
				ctx.fill()
				ctx.stroke()
				
				// Speech bubble tail
				ctx.beginPath()
				ctx.moveTo(bubbleX, bubbleY + bubbleHeight)
				ctx.lineTo(bubbleX - 8, bubbleY + bubbleHeight + 12)
				ctx.lineTo(bubbleX + 8, bubbleY + bubbleHeight + 12)
				ctx.closePath()
				ctx.fill()
				ctx.stroke()
				
				// Draw text
				ctx.fillStyle = '#ffffff'
				lines.forEach((line, i) => {
					ctx.fillText(line, bubbleX, bubbleY + padding + (i + 1) * lineHeight)
				})
				
				ctx.restore()
			}

			// Draw local player
			drawAvatar({ ...localPositionRef.current, name: 'You' }, isSpeaking, isCameraOn)
			
			// Draw remote players from direct position storage
			for (const [userId, pos] of positionsRef.current.entries()) {
				const user = state.remoteUsers.get(userId)
				if (user) {
					drawAvatar({ ...pos, name: user.name }, user.speaking || false, user.video || false)
				}
			}
			
			// Draw speech bubbles
			for (const [userId, bubble] of speechBubblesRef.current.entries()) {
				const pos = positionsRef.current.get(userId)
				if (pos) {
					drawSpeechBubble(pos.x, pos.y, bubble.text, bubble.username)
				}
			}
		}

		raf = requestAnimationFrame(step)
		return () => cancelAnimationFrame(raf)
	}, [keys, socket])

	return (
		<div className="w-full h-full flex items-center justify-center p-6">
			<canvas ref={canvasRef} width={WIDTH} height={HEIGHT} className="rounded-2xl shadow-glass border border-white/20" />
		</div>
	)
}

function hash(str) {
	let h = 0
	for (let i = 0; i < str.length; i++) h = ((h << 5) - h) + str.charCodeAt(i) | 0
	return h
}


