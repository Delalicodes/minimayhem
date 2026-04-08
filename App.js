import React, { useState, useCallback } from 'react';
import MenuScreen from './src/screens/MenuScreen';
import GameScreen from './src/screens/GameScreen';
import ResultScreen from './src/screens/ResultScreen';

const SCREENS = {
  MENU: 'menu',
  GAME: 'game',
  RESULT: 'result',
};

export default function App() {
  const [screen, setScreen] = useState(SCREENS.MENU);
  const [gameConfig, setGameConfig] = useState({ humanCount: 1, powerUps: true });
  const [gameResult, setGameResult] = useState(null);

  const handleStart = useCallback((humanCount, powerUps) => {
    setGameConfig({ humanCount, powerUps });
    setScreen(SCREENS.GAME);
  }, []);

  const handleGameOver = useCallback((result) => {
    setGameResult(result);
    setScreen(SCREENS.RESULT);
  }, []);

  const handlePlayAgain = useCallback(() => {
    setScreen(SCREENS.GAME);
  }, []);

  const handleMenu = useCallback(() => {
    setScreen(SCREENS.MENU);
    setGameResult(null);
  }, []);

  return (
    <div style={styles.root}>
      {screen === SCREENS.MENU && (
        <MenuScreen onStart={handleStart} />
      )}
      {screen === SCREENS.GAME && (
        <GameScreen
          key={Date.now()}
          humanCount={gameConfig.humanCount}
          powerUps={gameConfig.powerUps}
          onGameOver={handleGameOver}
        />
      )}
      {screen === SCREENS.RESULT && gameResult && (
        <ResultScreen
          result={gameResult}
          onPlayAgain={handlePlayAgain}
          onMenu={handleMenu}
        />
      )}
    </div>
  );
}

const styles = {
  root: {
    width: '100vw',
    height: '100vh',
    overflow: 'hidden',
    backgroundColor: '#0F0F23',
    margin: 0,
    padding: 0,
    display: 'flex',
    fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
  },
};
