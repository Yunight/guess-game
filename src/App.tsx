import { PWAInstallPrompt } from "@/components/ui/PWAInstallPrompt";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Provider } from "react-redux";
import { store } from "./store/store";
import "./App.css";
import { Analytics } from "@vercel/analytics/react";
import PokemonGame from "./components/pokemon-game/PokemonGame";
import { ResourcePreloader } from "./components/pokemon-game/ResourcePreloader";

function App() {
	return (
		<div className="App">
			<Provider store={store}>
				<ResourcePreloader>
					<PokemonGame />
				</ResourcePreloader>
				<SpeedInsights />
				<Analytics />
			</Provider>
			<PWAInstallPrompt />
		</div>
	);
}

export default App;
