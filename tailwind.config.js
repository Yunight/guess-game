/** @type {import('tailwindcss').Config} */
export default {
	darkMode: ["class"],
	content: [
		'./pages/**/*.{ts,tsx}',
		'./components/**/*.{ts,tsx}',
		'./app/**/*.{ts,tsx}',
		'./src/**/*.{ts,tsx}',
	],
	theme: {
		extend: {
			fontFamily: {
				oswald: ['Oswald', 'sans-serif'],
			},
			animation: {
				'grid-shine': 'grid-shine 2s linear infinite',
				'screen-glare': 'screen-glare 3s ease-in-out infinite',
				'corner-pulse': 'corner-pulse 2s ease-in-out infinite',
				'corner-pulse-delay-1': 'corner-pulse 2s ease-in-out 0.5s infinite',
				'corner-pulse-delay-2': 'corner-pulse 2s ease-in-out 1s infinite',
				'corner-pulse-delay-3': 'corner-pulse 2s ease-in-out 1.5s infinite',
				'float': 'float 3s ease-in-out infinite',
				'blink': 'blink 1s ease-in-out infinite',
				'blink-delay': 'blink 1s ease-in-out 0.5s infinite',
				'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
				'spin-slow': 'spin 3s linear infinite',
				'shine': 'shine 2s linear infinite',
			},
			keyframes: {
				'grid-shine': {
					'0%, 100%': { opacity: '0.4' },
					'50%': { opacity: '0.8' },
				},
				'screen-glare': {
					'0%, 100%': { opacity: '0.4' },
					'50%': { opacity: '0.8' },
				},
				'corner-pulse': {
					'0%, 100%': { opacity: '0.4' },
					'50%': { opacity: '1' },
				},
				'float': {
					'0%, 100%': { transform: 'translateY(0)' },
					'50%': { transform: 'translateY(-10px)' },
				},
				'blink': {
					'0%, 100%': { opacity: '1' },
					'50%': { opacity: '0.5' },
				},
				'shine': {
					'100%': { transform: 'translateX(100%)' },
				},
			},
		},
	},
	plugins: [],
}