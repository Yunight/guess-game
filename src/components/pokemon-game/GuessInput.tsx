import { FC } from 'react';
import { Input } from '@/components/ui/input';

interface GuessInputProps {
  guess: string;
  handleGuessChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  suggestions: string[];
  handleSuggestionClick: (suggestion: string) => void;
  highlightedIndex: number;
  isCorrect: boolean | null;
  inputRef: React.RefObject<HTMLInputElement>;
  suggestionsRef: React.RefObject<HTMLDivElement>;
}

export const GuessInput: FC<GuessInputProps> = ({
  guess,
  handleGuessChange,
  handleKeyDown,
  suggestions,
  handleSuggestionClick,
  highlightedIndex,
  isCorrect,
  inputRef,
  suggestionsRef,
}) => {
  return (
    <div className="mx-2 mt-2">
      <div className="relative">
        {/* Input field with Pokédex styling */}
        <div className="relative">
          <Input
            type="text"
            value={guess}
            onChange={handleGuessChange}
            onKeyDown={handleKeyDown}
            placeholder="Qui est ce Pokémon?"
            className="w-full text-center text-base h-12
              bg-gray-100 border-2 border-gray-300 rounded-xl
              placeholder:text-gray-500 placeholder:opacity-70
              focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50
              transition-all duration-300 font-oswald
              disabled:bg-gray-100 disabled:border-gray-300
              shadow-inner"
            style={{
              lineHeight: '48px',
              paddingTop: '0px',
              paddingBottom: '0px'
            }}
            ref={inputRef}
            disabled={isCorrect === true}
          />
          {/* Decorative dots */}
          <div className="absolute left-3 top-1/2 -translate-y-1/2 flex gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-500"></div>
            <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
          </div>
        </div>

        {/* Suggestions Popup with matching style */}
        {suggestions.length > 0 && !isCorrect && (
          <div 
            ref={suggestionsRef}
            className="absolute bottom-full left-0 right-0 mb-1 
              bg-gray-100 rounded-xl shadow-lg border-2 border-gray-300
              max-h-[30vh] overflow-y-auto z-50"
          >
            {suggestions.map((suggestion, index) => (
              <div
                key={suggestion}
                className={`px-4 py-2 cursor-pointer flex items-center gap-3
                  ${index === highlightedIndex 
                    ? 'bg-blue-500 text-white shadow-inner' 
                    : 'hover:bg-gray-50'}
                  ${index !== suggestions.length - 1 ? 'border-b border-gray-200' : ''}
                  transition-colors duration-150`}
                onClick={() => handleSuggestionClick(suggestion)}
              >
                <div className={`w-5 h-5 relative flex-shrink-0 ${index === highlightedIndex ? 'opacity-90' : ''}`}>
                  <div className={`absolute inset-0 rounded-full overflow-hidden ${index === highlightedIndex ? 'bg-white' : 'bg-red-500'}`}>
                    <div className="absolute bottom-1/2 inset-x-0 h-[1px] bg-black"></div>
                  </div>
                  <div className="absolute top-1/2 inset-x-0 bottom-0 bg-white rounded-b-full border-t border-black"></div>
                  <div className="absolute inset-[30%] bg-white rounded-full border-2 border-black"></div>
                </div>
                <span className={`flex-grow text-left font-medium ${index === highlightedIndex ? 'text-white' : 'text-gray-700'}`}>
                  {suggestion}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}; 