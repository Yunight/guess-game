import { Provider } from 'react-redux';
import { store } from './store/store';
import PokemonGame from './components/PokemonGame'
import './App.css'

function App() {

  return (
    <div className="App">
      <Provider store={store}>
        <PokemonGame />
      </Provider>
    </div>
  )
}

export default App
