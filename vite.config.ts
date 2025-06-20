import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
	plugins: [
		react(),
		VitePWA({
			registerType: "autoUpdate",
			includeAssets: [
				"favicon.ico",
				"apple-touch-icon.png",
				"masked-icon.svg",
				"sounds/pkm_level_up.mp3",
				"sounds/bump_wall.mp3",
				"sounds/battle_win.mp3",
				"sounds/train_horn_bell.mp3",
				"sounds/low_life.mp3",
				"sounds/shiny_effect.mp3",
			],
			workbox: {
				cleanupOutdatedCaches: true,
				skipWaiting: true,
				clientsClaim: true,
				globPatterns: ["**/*.{js,css,html,ico,png,svg,mp3,ogg,gif}"],
				navigateFallback: "/offline.html",
				runtimeCaching: [
					{
						urlPattern:
							/^https:\/\/raw\.githubusercontent\.com\/PokeAPI\/sprites\/master\/sprites\/pokemon\/versions\/generation-v\/black-white\/animated\/.*/i,
						handler: "CacheFirst",
						options: {
							cacheName: "pokemon-animated-sprites",
							expiration: {
								maxEntries: 1000,
								maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
							},
							cacheableResponse: {
								statuses: [0, 200],
							},
							matchOptions: {
								ignoreSearch: true,
							},
						},
					},
					{
						urlPattern:
							/^https:\/\/raw\.githubusercontent\.com\/PokeAPI\/sprites\/master\/sprites\/pokemon\/.*/i,
						handler: "CacheFirst",
						options: {
							cacheName: "pokemon-sprites",
							expiration: {
								maxEntries: 1000,
								maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
							},
							cacheableResponse: {
								statuses: [0, 200],
							},
							matchOptions: {
								ignoreSearch: true,
							},
						},
					},
					{
						urlPattern:
							/^https:\/\/raw\.githubusercontent\.com\/PokeAPI\/cries\/main\/cries\/pokemon\/latest\/.*/i,
						handler: "CacheFirst",
						options: {
							cacheName: "pokemon-cries",
							expiration: {
								maxEntries: 1000,
								maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
							},
							cacheableResponse: {
								statuses: [0, 200],
							},
							matchOptions: {
								ignoreSearch: true,
							},
						},
					},
					{
						urlPattern: /^\/sounds\/.*/i,
						handler: "CacheFirst",
						options: {
							cacheName: "game-sounds",
							expiration: {
								maxEntries: 10,
								maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
							},
							cacheableResponse: {
								statuses: [0, 200],
							},
						},
					},
					{
						urlPattern: /^https:\/\/pokeapi\.co\/api\/v2\/pokemon\/.*/i,
						handler: "CacheFirst",
						options: {
							cacheName: "pokemon-data",
							expiration: {
								maxEntries: 1000,
								maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
							},
							cacheableResponse: {
								statuses: [0, 200],
							},
							matchOptions: {
								ignoreSearch: true,
							},
						},
					},
					{
						urlPattern: /^https:\/\/pokeapi\.co\/api\/v2\/pokemon-species\/.*/i,
						handler: "CacheFirst",
						options: {
							cacheName: "pokemon-species-data",
							expiration: {
								maxEntries: 1000,
								maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
							},
							cacheableResponse: {
								statuses: [0, 200],
							},
							matchOptions: {
								ignoreSearch: true,
							},
						},
					},
				],
			},
			manifest: {
				name: "Pokemon Guesser",
				short_name: "PokemonGuesser",
				description: "A fun Pokemon guessing game",
				theme_color: "#ffffff",
				background_color: "#ffffff",
				display: "standalone",
				icons: [
					{
						src: "pwa-192x192.png",
						sizes: "192x192",
						type: "image/png",
					},
					{
						src: "pwa-512x512.png",
						sizes: "512x512",
						type: "image/png",
						purpose: "any maskable",
					},
				],
			},
		}),
	],
	build: {
		rollupOptions: {
			output: {
				manualChunks: {
					"react-vendor": ["react", "react-dom", "react-redux"],
					"game-core": [
						"@reduxjs/toolkit",
						"i18next",
						"react-i18next",
					],
					"ui-components": [
						"@radix-ui/react-dialog",
						"@radix-ui/react-select",
						"@radix-ui/react-slot",
						"class-variance-authority",
						"clsx",
						"tailwind-merge",
					],
				},
			},
		},
		chunkSizeWarningLimit: 1000,
	},
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
});
