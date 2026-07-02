import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite-plus";

const manualChunkGroups = {
	"firebase-auth-vendor": ["firebase/auth"],
	"firebase-core-vendor": ["firebase/app", "firebase/firestore"],
	"react-vendor": ["react", "react-dom"],
	"redux-vendor": ["react-redux", "@reduxjs/toolkit"],
	"i18n-vendor": ["i18next", "react-i18next", "i18next-browser-languagedetector"],
	"ui-components": [
		"@radix-ui/react-dialog",
		"@radix-ui/react-slot",
		"class-variance-authority",
		"clsx",
		"tailwind-merge",
	],
	"analytics-vendor": ["@vercel/analytics", "@vercel/speed-insights"],
	"lucide-vendor": ["lucide-react"],
} as const satisfies Record<string, readonly string[]>;

const resolveManualChunk = (moduleId: string): string | undefined => {
	const normalizedId = moduleId.replace(/\\/g, "/");
	for (const [chunkName, packages] of Object.entries(manualChunkGroups)) {
		if (packages.some((pkg) => normalizedId.includes(`node_modules/${pkg}/`))) {
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
			exclude: ["node_modules/", "src/test/", "**/*.d.ts", "**/*.config.*", "**/types.ts"],
		},
	},
	lint: {
		ignorePatterns: ["dist/**", "coverage/**", "dev-dist/**"],
		overrides: [
			{
				files: ["**/*.{ts,tsx}"],
				rules: {
					"constructor-super": "off",
					"for-direction": "error",
					"getter-return": "off",
					"no-async-promise-executor": "error",
					"no-case-declarations": "error",
					"no-class-assign": "off",
					"no-compare-neg-zero": "error",
					"no-cond-assign": "error",
					"no-const-assign": "off",
					"no-constant-binary-expression": "error",
					"no-constant-condition": "error",
					"no-control-regex": "error",
					"no-debugger": "error",
					"no-delete-var": "error",
					"no-dupe-class-members": "off",
					"no-dupe-else-if": "error",
					"no-dupe-keys": "off",
					"no-duplicate-case": "error",
					"no-empty": "error",
					"no-empty-character-class": "error",
					"no-empty-pattern": "error",
					"no-empty-static-block": "error",
					"no-ex-assign": "error",
					"no-extra-boolean-cast": "error",
					"no-fallthrough": "error",
					"no-func-assign": "off",
					"no-global-assign": "error",
					"no-import-assign": "off",
					"no-invalid-regexp": "error",
					"no-irregular-whitespace": "error",
					"no-loss-of-precision": "error",
					"no-misleading-character-class": "error",
					"no-new-native-nonconstructor": "off",
					"no-nonoctal-decimal-escape": "error",
					"no-obj-calls": "off",
					"no-prototype-builtins": "error",
					"no-redeclare": "off",
					"no-regex-spaces": "error",
					"no-self-assign": "error",
					"no-setter-return": "off",
					"no-shadow-restricted-names": "error",
					"no-sparse-arrays": "error",
					"no-this-before-super": "off",
					"no-unassigned-vars": "error",
					"no-unexpected-multiline": "error",
					"no-unreachable": "off",
					"no-unsafe-finally": "error",
					"no-unsafe-negation": "off",
					"no-unsafe-optional-chaining": "error",
					"no-unused-labels": "error",
					"no-unused-private-class-members": "error",
					"no-unused-vars": "warn",
					"no-useless-backreference": "error",
					"no-useless-catch": "error",
					"no-useless-escape": "error",
					"no-with": "off",
					"preserve-caught-error": "off",
					"require-yield": "error",
					"use-isnan": "error",
					"valid-typeof": "error",
					"no-var": "error",
					"prefer-const": "error",
					"prefer-rest-params": "error",
					"prefer-spread": "error",
					"no-array-constructor": "error",
					"no-unused-expressions": "error",
					"typescript/ban-ts-comment": "error",
					"typescript/no-duplicate-enum-values": "error",
					"typescript/no-empty-object-type": "error",
					"typescript/no-explicit-any": "warn",
					"typescript/no-extra-non-null-assertion": "error",
					"typescript/no-misused-new": "error",
					"typescript/no-namespace": "error",
					"typescript/no-non-null-asserted-optional-chain": "error",
					"typescript/no-require-imports": "error",
					"typescript/no-this-alias": "error",
					"typescript/no-unnecessary-type-constraint": "error",
					"typescript/no-unsafe-declaration-merging": "error",
					"typescript/no-unsafe-function-type": "error",
					"typescript/no-wrapper-object-types": "error",
					"typescript/prefer-as-const": "error",
					"typescript/prefer-namespace-keyword": "error",
					"typescript/triple-slash-reference": "error",
					"react/rules-of-hooks": "error",
					"react/exhaustive-deps": "warn",
					"react/only-export-components": ["warn", { allowConstantExport: true }],
				},
				plugins: ["typescript", "react"],
				env: {
					es2020: true,
					browser: true,
				},
			},
		],
		jsPlugins: [
			{
				name: "vite-plus",
				specifier: "vite-plus/oxlint-plugin",
			},
		],
		rules: {
			"vite-plus/prefer-vite-plus-imports": "error",
		},
	},
	fmt: {
		useTabs: true,
		semi: true,
		singleQuote: false,
		trailingComma: "all",
	},
});
