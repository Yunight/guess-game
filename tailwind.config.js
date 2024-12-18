/** @type {import('tailwindcss').Config} */
export default {
	darkMode: ["class"],
	content: [
		"./index.html",
		"./src/**/*.{js,ts,jsx,tsx}",
	],
	theme: {
		extend: {
			colors: {
				border: "hsl(var(--border))",
				input: "hsl(var(--input))",
				ring: "hsl(var(--ring))",
				background: "hsl(var(--background))",
				foreground: "hsl(var(--foreground))",
				primary: {
					DEFAULT: "hsl(var(--primary))",
					foreground: "hsl(var(--primary-foreground))",
				},
				secondary: {
					DEFAULT: "hsl(var(--secondary))",
					foreground: "hsl(var(--secondary-foreground))",
				},
				destructive: {
					DEFAULT: "hsl(var(--destructive))",
					foreground: "hsl(var(--destructive-foreground))",
				},
				muted: {
					DEFAULT: "hsl(var(--muted))",
					foreground: "hsl(var(--muted-foreground))",
				},
				accent: {
					DEFAULT: "hsl(var(--accent))",
					foreground: "hsl(var(--accent-foreground))",
				},
				popover: {
					DEFAULT: "hsl(var(--popover))",
					foreground: "hsl(var(--popover-foreground))",
				},
				card: {
					DEFAULT: "hsl(var(--card))",
					foreground: "hsl(var(--card-foreground))",
				},
			},
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
				'shine-slow': 'shine 4s ease-in-out infinite',
				'fade-out': 'fade-out 0.5s ease-out forwards',
				'fade-in': 'fade-in 0.5s ease-in forwards',
				'scale-up': 'scale-up 0.5s ease-out forwards',
				'float-gentle': 'float-gentle 6s ease-in-out infinite',
				'bounce-in': 'bounce-in 0.6s cubic-bezier(0.36, 0, 0.66, 1.3) forwards',
				'flash-out': 'flash-out 0.8s ease-out forwards',
				'reveal-pokemon': 'reveal-pokemon 0.8s ease-out forwards',
				'ring-expand': 'ring-expand 1s ease-out forwards',
				'ring-expand-delayed': 'ring-expand 1s ease-out 0.2s forwards',
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
				'float-gentle': {
					'0%, 100%': { transform: 'translateY(0)' },
					'50%': { transform: 'translateY(-5px)' },
				},
				'blink': {
					'0%, 100%': { opacity: '1' },
					'50%': { opacity: '0.5' },
				},
				'shine': {
					'100%': { transform: 'translateX(100%)' },
				},
				'fade-out': {
					'0%': { opacity: '1' },
					'100%': { opacity: '0' },
				},
				'fade-in': {
					'0%': { opacity: '0' },
					'100%': { opacity: '1' },
				},
				'scale-up': {
					'0%': { transform: 'scale(0.8)' },
					'100%': { transform: 'scale(1)' },
				},
				'bounce-in': {
					'0%': { transform: 'scale(0.3)', opacity: '0' },
					'60%': { transform: 'scale(1.05)', opacity: '0.8' },
					'80%': { transform: 'scale(0.98)', opacity: '0.9' },
					'100%': { transform: 'scale(1)', opacity: '1' },
				},
				'flash-out': {
					'0%': { opacity: '1' },
					'100%': { opacity: '0' },
				},
				'reveal-pokemon': {
					'0%': { filter: 'brightness(0)', transform: 'scale(0.85)' },
					'50%': { filter: 'brightness(0.5)', transform: 'scale(0.9)' },
					'100%': { filter: 'brightness(1)', transform: 'scale(1)' },
				},
				'ring-expand': {
					'0%': { transform: 'scale(0.5)', opacity: '1' },
					'100%': { transform: 'scale(2)', opacity: '0' },
				},
			},
			borderRadius: {
				lg: "var(--radius)",
				md: "calc(var(--radius) - 2px)",
				sm: "calc(var(--radius) - 4px)",
			},
		},
	},
	plugins: [],
}