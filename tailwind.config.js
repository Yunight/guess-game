/** @type {import('tailwindcss').Config} */
module.exports = {
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
			borderRadius: {
				lg: "var(--radius)",
				md: "calc(var(--radius) - 2px)",
				sm: "calc(var(--radius) - 4px)",
			},
		},
	},
	plugins: [require("tailwindcss-animate")],
}