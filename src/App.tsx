import { PWAInstallPrompt } from "@/components/ui/PWAInstallPrompt";
import { SpeedInsights } from "@vercel/speed-insights/react";
import React, { Suspense, lazy } from "react";
import { Provider } from "react-redux";
import { store } from "./store/store";
import "./App.css";
import ErrorBoundary from "@/components/ErrorBoundary";
import { ResourcePreloader } from "@/components/pokemon-game/ResourcePreloader";
import { Analytics } from "@vercel/analytics/react";

const PokemonGame = lazy(() => import("./components/pokemon-game/PokemonGame"));

function App() {
	return (
		<div className="App">
			<Provider store={store}>
				<ErrorBoundary>
					<ResourcePreloader>
						<Suspense fallback={<div>Loading game...</div>}>
							<PokemonGame />
						</Suspense>
					</ResourcePreloader>
				</ErrorBoundary>
				<SpeedInsights />
				<Analytics />
			</Provider>
		</div>
	);
}

export default App;
