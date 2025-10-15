/** @type {import('tailwindcss').Config} */
export default {
	content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
	theme: {
		extend: {
			colors: {
				primary: {
					DEFAULT: '#7C3AED',
					light: '#9F67FF',
					dark: '#5B21B6',
				},
				accent: '#06B6D4',
			},
			boxShadow: {
				glass: '0 8px 32px rgba(0,0,0,0.3)'
			}
		}
	},
	plugins: []
}


