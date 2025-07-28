import { PWAInstallPrompt } from "@/components/ui/PWAInstallPrompt";
import { SpeedInsights } from "@vercel/speed-insights/react";
import React, { Suspense, lazy } from "react";
import { Provider } from "react-redux";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { store } from "./store/store";
import "./App.css";
import "./styles/PokemonGame.css";
import ErrorBoundary from "@/components/ErrorBoundary";
import { ResourcePreloader } from "@/components/pokemon-game/ResourcePreloader";
import { Analytics } from "@vercel/analytics/react";

const PokemonGame = lazy(() => import("./components/pokemon-game/PokemonGame"));
const ResultsPage = lazy(() => import("./components/pokemon-game/ResultsPage"));

function App() {
	return (
		<div className="App">
			<Provider store={store}>
				<ErrorBoundary>
					<Router>
						<Routes>
							<Route
								path="/"
								element={
									/* <ResourcePreloader> */
									<Suspense
										fallback={
											<div className="fixed inset-0 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
												<div className="pokeball-loading">
													<div className="outer-circle" />
													<div className="middle-line" />
													<div className="center-circle" />
												</div>
											</div>
										}
									>
										<PokemonGame />
									</Suspense>
									/* </ResourcePreloader> */
								}
							/>
							<Route
								path="/results/:resultId"
								element={
									<Suspense fallback={<div>Loading result...</div>}>
										<ResultsPage />
									</Suspense>
								}
							/>
						</Routes>
					</Router>
				</ErrorBoundary>
				<SpeedInsights />
				<Analytics />
			</Provider>
		</div>
	);
}

export default App;
