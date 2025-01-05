import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./i18n/i18n";
import { registerSW } from "virtual:pwa-register";

// Auto update registration
const updateSW = registerSW({
	onNeedRefresh() {
		// When new content is available, automatically update
		updateSW(true);
	},
	onOfflineReady() {
		// Optional: Handle offline ready state
		console.log("App ready to work offline");
	},
	immediate: true,
});

const rootElement = document.getElementById("root");
if (!rootElement) {
	throw new Error("Failed to find the root element");
}

ReactDOM.createRoot(rootElement).render(
	<React.StrictMode>
		<App />
	</React.StrictMode>,
);
