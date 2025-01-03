import { Provider } from 'react-redux';
import { store } from './store/store';
import PokemonGame from '@/components/pokemon-game/PokemonGame';
import { ResourcePreloader } from '@/components/pokemon-game/ResourcePreloader';
import { PWAInstallPrompt } from '@/components/ui/PWAInstallPrompt';
import './App.css';

function App() {
  return (
    <div className="App">
      <Provider store={store}>
        <ResourcePreloader>
          <PokemonGame />
        </ResourcePreloader>
      </Provider>
      <PWAInstallPrompt />
    </div>
  );
}

export default App;
