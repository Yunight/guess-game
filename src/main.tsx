import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./i18n/i18n";
import { registerSW } from "virtual:pwa-register";

const rootElement = document.getElementById("root");
if (!rootElement) {
	throw new Error("Failed to find the root element");
}

ReactDOM.createRoot(rootElement).render(
	<React.StrictMode>
		<App />
	</React.StrictMode>,
);

// Register service worker with custom reload prompt
registerSW({
	onNeedRefresh() {
		// Don't show reload prompt in development
		if (import.meta.env.DEV) {
			return;
		}
		if (confirm("New content available. Reload to update?")) {
			window.location.reload();
		}
	},
	onOfflineReady() {
		console.log("App ready to work offline");
	},
	immediate: true,
});
