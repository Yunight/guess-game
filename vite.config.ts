import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const manualChunkGroups = {
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
	],
	"analytics-vendor": ["@vercel/analytics", "@vercel/speed-insights"],
	"lucide-vendor": ["lucide-react"],
} as const satisfies Record<string, readonly string[]>;

const resolveManualChunk = (moduleId: string): string | undefined => {
	for (const [chunkName, packages] of Object.entries(manualChunkGroups)) {
		if (packages.some((pkg) => moduleId.includes(`node_modules/${pkg}/`))) {
			return chunkName;
		}
	}
	return undefined;
};

export default defineConfig({
	plugins: [react(), tailwindcss()],
	build: {
		sourcemap: false,
		chunkSizeWarningLimit: 600,
		target: "esnext",
		rolldownOptions: {
			output: {
				manualChunks: resolveManualChunk,
				chunkFileNames: "assets/[name]-[hash].js",
				minify: {
					compress: {
						dropConsole: true,
						dropDebugger: true,
					},
				},
			},
		},
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
	test: {
		environment: "jsdom",
		globals: true,
		setupFiles: ["./src/test/setup.ts"],
		coverage: {
			provider: "v8",
			reporter: ["text", "html", "json"],
			exclude: [
				"node_modules/",
				"src/test/",
				"**/*.d.ts",
				"**/*.config.*",
				"**/types.ts",
			],
		},
	},
});
