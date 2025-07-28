import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
	plugins: [
		react(),
		// PWA disabled temporarily to fix routing issues with shareable URLs
	],
	build: {
		sourcemap: false,
		minify: "terser",
		terserOptions: {
			compress: {
				drop_console: true,
				drop_debugger: true,
			},
		},
		rollupOptions: {
			output: {
				manualChunks: {
					"react-vendor": ["react", "react-dom"],
					"redux-vendor": ["react-redux", "@reduxjs/toolkit"],
					"i18n-vendor": [
						"i18next",
						"react-i18next",
						"i18next-browser-languagedetector",
					],
					"ui-components": [
						"@radix-ui/react-dialog",
						"@radix-ui/react-select",
						"@radix-ui/react-slot",
						"class-variance-authority",
						"clsx",
						"tailwind-merge",
						"tailwindcss-animate",
					],
					"analytics-vendor": ["@vercel/analytics", "@vercel/speed-insights"],
					"lucide-vendor": ["lucide-react"],
				},
				chunkFileNames: () => {
					return "assets/[name]-[hash].js";
				},
			},
		},
		chunkSizeWarningLimit: 600,
		target: "esnext",
	},
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
	server: {
		fs: {
			strict: false,
		},
	},
	esbuild: {
		drop: ["console", "debugger"],
		treeShaking: true,
	},
});
