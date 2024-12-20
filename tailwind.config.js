/** @type {import('tailwindcss').Config} */
export default {
	darkMode: ['class'],
	content: [
		'./index.html',
		'./src/**/*.{js,ts,jsx,tsx}',
	],
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px',
			},
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))',
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))',
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))',
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))',
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))',
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))',
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))',
				},
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)',
			},
			keyframes: {
				'accordion-down': {
					from: { height: 0 },
					to: { height: 'var(--radix-accordion-content-height)' },
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: 0 },
				},
				'float-up-fade-out': {
					'0%': {
						opacity: '1',
						transform: 'translateY(0)',
					},
					'100%': {
						opacity: '0',
						transform: 'translateY(-30px)',
					},
				},
				'fire-pulse': {
					'0%, 100%': {
						transform: 'scale(1)',
						filter: 'brightness(1.1)',
					},
					'50%': {
						transform: 'scale(1.02)',
						filter: 'brightness(1.2)',
					},
				},
				'flame-dance': {
					'0%': {
						transform: 'scaleY(1) translateX(0) rotate(-1deg)',
					},
					'25%': {
						transform: 'scaleY(1.2) translateX(7px) rotate(2deg)',
					},
					'50%': {
						transform: 'scaleY(0.95) translateX(-5px) rotate(-2deg)',
					},
					'75%': {
						transform: 'scaleY(1.1) translateX(3px) rotate(1deg)',
					},
					'100%': {
						transform: 'scaleY(1) translateX(0) rotate(-1deg)',
					},
				},
				'flame-flicker': {
					'0%': {
						opacity: '1',
						transform: 'rotate(-2deg) scaleY(1)',
						filter: 'brightness(1)',
					},
					'25%': {
						opacity: '0.8',
						transform: 'rotate(3deg) scaleY(0.98)',
						filter: 'brightness(1.15)',
					},
					'50%': {
						opacity: '0.9',
						transform: 'rotate(-1deg) scaleY(1.02)',
						filter: 'brightness(1.05)',
					},
					'75%': {
						opacity: '0.85',
						transform: 'rotate(2deg) scaleY(0.99)',
						filter: 'brightness(1.1)',
					},
					'100%': {
						opacity: '1',
						transform: 'rotate(-2deg) scaleY(1)',
						filter: 'brightness(1)',
					},
				},
				'ember-rise': {
					'0%': {
						transform: 'translateY(0) rotate(0deg) scale(1)',
						opacity: '1',
						filter: 'brightness(1)',
					},
					'50%': {
						transform: 'translateY(-30px) rotate(120deg) scale(0.8)',
						opacity: '0.7',
						filter: 'brightness(1.5)',
					},
					'100%': {
						transform: 'translateY(-60px) rotate(240deg) scale(0)',
						opacity: '0',
						filter: 'brightness(1)',
					},
				},
				'heat-distort': {
					'0%, 100%': {
						transform: 'scaleY(1)',
					},
					'50%': {
						transform: 'scaleY(1.02)',
					},
				},
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'float-up-fade-out': 'float-up-fade-out 1s ease-out forwards',
				'fire-pulse': 'fire-pulse 3s ease-in-out infinite',
				'flame-dance': 'flame-dance 2.5s ease-in-out infinite',
				'flame-flicker': 'flame-flicker 3s ease-in-out infinite',
				'ember-rise': 'ember-rise 1.5s ease-out infinite',
				'heat-distort': 'heat-distort 2s ease-in-out infinite',
			},
		},
	},
	plugins: [
		// @ts-ignore
		function ({ addBase, addUtilities }) {
			addUtilities({
				'.animate-accordion-down': { animation: 'accordion-down 0.2s ease-out' },
				'.animate-accordion-up': { animation: 'accordion-up 0.2s ease-out' },
				// ... other animations from tailwindcss-animate
			});
		}
	],
};