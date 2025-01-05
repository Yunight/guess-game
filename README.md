# Pokemon Guessing Game 🎮

A modern web-based Pokemon guessing game where you test your Pokemon knowledge by identifying Pokemon from their silhouettes. Built with React, TypeScript, and Tailwind CSS.

## 🌟 Features

### Game Modes
- **Chill Mode**: Relaxed gameplay with unlimited time and hints
- **Hard Mode**: Competitive mode with time limits and special mechanics

### Core Features
- Pokemon silhouette identification
- Support for all 9 generations of Pokemon
- Bilingual support (French/English)
- Real Pokemon cries and sound effects
- Responsive design for all devices
- Local and global leaderboards
- Shiny Pokemon encounters

### Special Mechanics (Hard Mode)
- **Time Limit**: 15 seconds per Pokemon (10 seconds for Shiny)
- **Hype Train**: Chain 3+ fast answers (≥10s remaining) for bonus points
- **Critical Hit**: 20% chance for bonus points
- **Critical Success**: Special bonus for last-second correct answers
- **Points System**:
  - Regular Pokemon: 1-3 points based on speed
  - Shiny Pokemon: Always 5 points
  - Hype Train: Additional points based on chain length

### Gameplay Features
- Auto-complete suggestions
- Type-to-search functionality
- Hint system (Chill Mode)
- Progress tracking
- Generation selection
- Sound controls
- Player statistics

## 🎯 How to Play

1. **Start**:
   - Enter your player name
   - Select a Pokemon generation
   - Choose game mode (Chill/Hard)

2. **Gameplay**:
   - Identify Pokemon from their silhouettes
   - Type your guess or use auto-complete
   - Use hints in Chill Mode (press right arrow)
   - Answer quickly in Hard Mode for better scores

3. **Controls**:
   - Enter: Submit guess
   - Arrow Up/Down: Navigate suggestions
   - Arrow Right: Use hint (Chill Mode)
   - Click "Quitter" to end game early

## 🏆 Scoring System

### Hard Mode
- Fast Answer (10-15s): 3 points
- Medium Answer (5-10s): 2 points
- Slow Answer (0-5s): 1 point
- Shiny Pokemon: 5 points
- Critical Hit: +1 bonus point
- Hype Train: Additional points per chain

### Chill Mode
- Regular Pokemon: 1 point
- Shiny Pokemon: 5 points

## 🎨 Special Effects

- Shiny Pokemon have special visual and sound effects
- Hype Train activates flame effects and sound
- Critical hits and successes have unique animations
- Points earned animations
- Pokemon reveal animations

## 🔧 Technical Features

- Real-time Pokemon cry playback
- Automatic language detection
- Persistent high scores
- Responsive UI design
- Progressive Web App support
- Cross-platform compatibility

## 🌐 Languages

The game supports:
- French (Default)
- English

Language is automatically detected based on browser settings.

## 💾 Local Storage

The game saves:
- Player name
- Best scores per generation
- Sound preferences
- Last played settings

## 🎵 Sound Effects

- Pokemon cries
- Shiny Pokemon effect
- Correct/wrong answers
- Victory fanfare
- Hype train effects
- Critical hit sounds

## 🔄 Updates

The game is regularly updated with:
- New Pokemon generations
- Feature improvements
- Bug fixes
- Performance optimizations

## 🎮 Tips

1. Learn Pokemon silhouettes to improve speed
2. In Hard Mode, aim for fast answers to trigger Hype Train
3. Use hints strategically in Chill Mode
4. Watch for shiny Pokemon for bonus points
5. Practice with different generations

## 🛠️ Development

Built with:
- React
- TypeScript
- Tailwind CSS
- Vite
- Firebase (Leaderboards)

## 🔗 Credits

- Pokemon data and sprites from official sources
- Sound effects from Pokemon games
- Community contributions and feedback

Enjoy the game and catch 'em all! 🌟
