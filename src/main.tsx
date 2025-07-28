import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./i18n/i18n";
import { registerSW } from "virtual:pwa-register";

// Mobile detection
const isMobile = () => {
	return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
		navigator.userAgent,
	);
};

// Auto update registration with mobile-friendly configuration
const updateSW = registerSW({
	onNeedRefresh() {
		// On mobile, be less aggressive with updates to prevent loading issues
		if (isMobile()) {
			console.log("New content available, will update on next app restart");
			// Don't auto-update on mobile to prevent disruption
		} else {
			// On desktop, auto-update as before
			updateSW(true);
		}
	},
	onOfflineReady() {
		console.log("App ready to work offline");
	},
	immediate: !isMobile(), // Don't register immediately on mobile
	onRegisterError(error) {
		console.warn("SW registration error", error);
		// Don't block app loading if SW registration fails
	},
});

const rootElement = document.getElementById("root");
if (!rootElement) {
	throw new Error("Failed to find the root element");
}

// Add a loading timeout for mobile devices
const renderApp = () => {
	ReactDOM.createRoot(rootElement).render(
		<React.StrictMode>
			<App />
		</React.StrictMode>,
	);

	// Show the body once React has rendered
	document.body.classList.add("loaded");
};

// On mobile, add a small delay to ensure everything is ready
if (isMobile()) {
	// Small delay to ensure DOM is fully ready on mobile
	setTimeout(renderApp, 100);
} else {
	renderApp();
}
