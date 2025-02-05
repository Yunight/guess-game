import { fontFamily } from "tailwindcss/defaultTheme";

/** @type {import('tailwindcss').Config} */
export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	theme: {
		container: {
			center: true,
			padding: "2rem",
			screens: {
				"2xl": "1400px",
			},
		},
		extend: {
			fontFamily: {
				sans: ["var(--font-sans)", ...fontFamily.sans],
				oswald: ["Oswald", "sans-serif"],
			},
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
			borderRadius: {
				lg: "var(--radius)",
				md: "calc(var(--radius) - 2px)",
				sm: "calc(var(--radius) - 4px)",
			},
			keyframes: {
				"accordion-down": {
					from: { height: "0" },
					to: { height: "var(--radix-accordion-content-height)" },
				},
				"accordion-up": {
					from: { height: "var(--radix-accordion-content-height)" },
					to: { height: "0" },
				},
				"spin-slow": {
					"0%": { transform: "rotate(0deg)" },
					"100%": { transform: "rotate(360deg)" },
				},
				"spin-slow-reverse": {
					"0%": { transform: "rotate(360deg)" },
					"100%": { transform: "rotate(0deg)" },
				},
				firework: {
					"0%": { transform: "scale(1)", opacity: "1" },
					"50%": { transform: "scale(1.2)", opacity: "0.8" },
					"100%": { transform: "scale(1)", opacity: "1" },
				},
				"firework-1": {
					"0%": { transform: "translateY(0) scale(1)", opacity: 1 },
					"50%": { transform: "translateY(-80px) scale(0.4)", opacity: 0.8 },
					"100%": { transform: "translateY(-120px) scale(0)", opacity: 0 },
				},
				"firework-2": {
					"0%": { transform: "translateY(0) scale(1)", opacity: 1 },
					"50%": { transform: "translateY(-100px) scale(0.4)", opacity: 0.8 },
					"100%": { transform: "translateY(-140px) scale(0)", opacity: 0 },
				},
				"firework-3": {
					"0%": { transform: "translateY(0) scale(1)", opacity: 1 },
					"50%": { transform: "translateY(-60px) scale(0.4)", opacity: 0.8 },
					"100%": { transform: "translateY(-100px) scale(0)", opacity: 0 },
				},
				explode: {
					"0%": { transform: "scale(1)", opacity: 1 },
					"50%": { transform: "scale(8)", opacity: 0.8 },
					"100%": { transform: "scale(16)", opacity: 0 },
				},
				"grid-shine": {
					"0%, 100%": { transform: "translateX(-100%)" },
					"50%": { transform: "translateX(100%)" },
				},
				"screen-glare": {
					"0%, 100%": { opacity: "0.5" },
					"50%": { opacity: "0.2" },
				},
				"corner-pulse": {
					"0%, 100%": { opacity: "0.3" },
					"50%": { opacity: "1" },
				},
				"corner-pulse-delay-1": {
					"0%, 100%": { opacity: "0.3" },
					"50%": { opacity: "1" },
					"0.5s": { opacity: "0.3" },
				},
				"corner-pulse-delay-2": {
					"0%, 100%": { opacity: "0.3" },
					"50%": { opacity: "1" },
					"1s": { opacity: "0.3" },
				},
				"corner-pulse-delay-3": {
					"0%, 100%": { opacity: "0.3" },
					"50%": { opacity: "1" },
					"1.5s": { opacity: "0.3" },
				},
				"bounce-gentle": {
					"0%, 100%": { transform: "translateY(-5%)" },
					"50%": { transform: "translateY(5%)" },
				},
				"fade-in-up": {
					"0%": { opacity: "0", transform: "translateY(10px)" },
					"100%": { opacity: "1", transform: "translateY(0)" },
				},
				"spin-slow": "spin 3s linear infinite",
				"spin-slow-reverse": "spin 3s linear infinite reverse",
				"bounce-gentle": "bounce-gentle 2s ease-in-out infinite",
				"fade-in": "fade-in 0.5s ease-out forwards",
				"fade-in-up": "fade-in-up 0.5s ease-out forwards",
				"grid-shine": "grid-shine 3s linear infinite",
				"screen-glare": "screen-glare 3s ease-in-out infinite",
				"corner-pulse": "corner-pulse 2s ease-in-out infinite",
				"corner-pulse-delay-1": "corner-pulse 2s ease-in-out infinite 0.5s",
				"corner-pulse-delay-2": "corner-pulse 2s ease-in-out infinite 1s",
				"corner-pulse-delay-3": "corner-pulse 2s ease-in-out infinite 1.5s",
				"sparkle-1": "sparkle 1.5s ease-in-out infinite",
				"sparkle-2": "sparkle 1.5s ease-in-out infinite 0.5s",
				"sparkle-3": "sparkle 1.5s ease-in-out infinite 1s",
				"slot-machine": "slot-machine 0.1s linear infinite",
				"reward-appear": "reward-appear 0.5s ease-out forwards",
			},
			animation: {
				"accordion-down": "accordion-down 0.2s ease-out",
				"accordion-up": "accordion-up 0.2s ease-out",
				"spin-slow": "spin-slow 8s linear infinite",
				"spin-slow-reverse": "spin-slow-reverse 10s linear infinite",
				firework: "firework 2s ease-in-out infinite",
				"firework-1": "firework-1 1.5s ease-out infinite",
				"firework-2": "firework-2 1.8s ease-out infinite",
				"firework-3": "firework-3 1.3s ease-out infinite",
				explode: "explode 1.5s ease-out infinite",
				"bounce-gentle": "bounce-gentle 1s infinite",
				"fade-in-up": "fade-in-up 0.6s ease-out forwards",
				"spin-slow": "spin 3s linear infinite",
				"spin-slow-reverse": "spin 3s linear infinite reverse",
				"bounce-gentle": "bounce-gentle 2s ease-in-out infinite",
				"fade-in": "fade-in 0.5s ease-out forwards",
				"fade-in-up": "fade-in-up 0.5s ease-out forwards",
				"grid-shine": "grid-shine 3s linear infinite",
				"screen-glare": "screen-glare 3s ease-in-out infinite",
				"corner-pulse": "corner-pulse 2s ease-in-out infinite",
				"corner-pulse-delay-1": "corner-pulse 2s ease-in-out infinite 0.5s",
				"corner-pulse-delay-2": "corner-pulse 2s ease-in-out infinite 1s",
				"corner-pulse-delay-3": "corner-pulse 2s ease-in-out infinite 1.5s",
				"sparkle-1": "sparkle 1.5s ease-in-out infinite",
				"sparkle-2": "sparkle 1.5s ease-in-out infinite 0.5s",
				"sparkle-3": "sparkle 1.5s ease-in-out infinite 1s",
				"slot-machine": "slot-machine 0.1s linear infinite",
				"reward-appear": "reward-appear 0.5s ease-out forwards",
			},
		},
	},
	plugins: [
		// Add your plugins here
	],
};
