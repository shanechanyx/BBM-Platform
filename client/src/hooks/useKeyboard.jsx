import { useEffect, useRef, useState } from 'react'

export function useKeyboard() {
	const keysRef = useRef(new Set())
	const [keys, setKeys] = useState(new Set())

	useEffect(() => {
		function down(e) {
			keysRef.current.add(e.key.toLowerCase())
			setKeys(new Set(keysRef.current))
		}
		function up(e) {
			keysRef.current.delete(e.key.toLowerCase())
			setKeys(new Set(keysRef.current))
		}
		window.addEventListener('keydown', down)
		window.addEventListener('keyup', up)
		return () => {
			window.removeEventListener('keydown', down)
			window.removeEventListener('keyup', up)
		}
	}, [])

	return keys
}


