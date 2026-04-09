import React, { useState, useCallback } from 'react';
import { View, StyleSheet, SafeAreaView, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import GameSelectScreen from './src/screens/GameSelectScreen';
import MenuScreen from './src/screens/MenuScreen';
import GameScreen from './src/screens/GameScreen';
import ResultScreen from './src/screens/ResultScreen';

const SCREENS = {
  GAME_SELECT: 'game_select',
  LOBBY: 'lobby',
  GAME: 'game',
  RESULT: 'result',
};

export default function App() {
  const [screen, setScreen] = useState(SCREENS.GAME_SELECT);
  const [gameConfig, setGameConfig] = useState({ gameMode: 'hot_potato', humanCount: 1, powerUps: true });
  const [gameResult, setGameResult] = useState(null);

  const handleGameSelect = useCallback((gameMode) => {
    setGameConfig(prev => ({ ...prev, gameMode }));
    setScreen(SCREENS.LOBBY);
  }, []);

  const handleStart = useCallback((gameMode, humanCount, powerUps) => {
    setGameConfig({ gameMode, humanCount, powerUps });
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
    setScreen(SCREENS.GAME_SELECT);
    setGameResult(null);
  }, []);

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safeArea}>
          {screen === SCREENS.GAME_SELECT && (
            <GameSelectScreen onSelect={handleGameSelect} />
          )}
          {screen === SCREENS.LOBBY && (
            <MenuScreen
              gameMode={gameConfig.gameMode}
              onStart={handleStart}
              onBack={() => setScreen(SCREENS.GAME_SELECT)}
            />
          )}
          {screen === SCREENS.GAME && (
            <GameScreen
              key={gameConfig.gameMode}
              gameMode={gameConfig.gameMode}
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
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0F0F23',
  },
  safeArea: {
    flex: 1,
  },
});
