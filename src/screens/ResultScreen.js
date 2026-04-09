import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FONT_FAMILY } from '../game/constants.js';

export default function ResultScreen({ result, onPlayAgain, onMenu }) {
  if (!result) return null;

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0F0F23', '#1A1A3A']} style={StyleSheet.absoluteFill} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
            <Text style={styles.trophy}>🏆</Text>
            <Text style={[styles.winnerName, { color: result.winner.color }]}>
                {result.winner.name.toUpperCase()} WINS!
            </Text>
            <Text style={styles.roundsText}>
                in {result.rounds} round{result.rounds > 1 ? 's' : ''}
            </Text>
        </View>

        {/* Scoreboard */}
        <View style={styles.scoreboardWrapper}>
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255,255,255,0.05)' }]} />
          <View style={styles.scoreboard}>
            <Text style={styles.scoreTitle}>FINAL STANDINGS</Text>
            {result.scores
                .sort((a, b) => b.score - a.score)
                .map((s, i) => (
                <View key={i} style={styles.scoreRow}>
                    <Text style={styles.scoreRank}>
                    {i === 0 ? '👑' : `${i + 1}.`}
                    </Text>
                    <Text style={[styles.scoreName, { color: s.color }]}>
                    {s.name}
                    </Text>
                    <Text style={styles.scoreValue}>{s.score}</Text>
                </View>
                ))
            }
          </View>
        </View>

        {/* Buttons */}
        <View style={styles.buttons}>
            <TouchableOpacity onPress={onPlayAgain} style={styles.playAgainBtnWrapper}>
                <LinearGradient
                    colors={['#FF6B35', '#FF4500']}
                    style={styles.playAgainBtn}
                >
                    <Text style={styles.playAgainText}>PLAY AGAIN</Text>
                </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={onMenu} style={styles.menuBtn}>
                <Text style={styles.menuBtnText}>MAIN MENU</Text>
            </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F23',
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 32,
  },
  header: {
    alignItems: 'center',
    gap: 8,
  },
  trophy: {
    fontSize: 80,
    marginBottom: 10,
  },
  winnerName: {
    fontSize: 32,
    fontWeight: 'bold',
    letterSpacing: 2,
    textAlign: 'center',
  },
  roundsText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '600',
  },
  scoreboardWrapper: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  scoreboard: {
    padding: 24,
    gap: 16,
  },
  scoreTitle: {
    fontSize: 11,
    letterSpacing: 4,
    color: 'rgba(255,255,255,0.3)',
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: 'bold',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  scoreRank: {
    width: 30,
    fontSize: 16,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: 'bold',
  },
  scoreName: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  scoreValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  buttons: {
    width: '100%',
    maxWidth: 300,
    gap: 12,
  },
  playAgainBtnWrapper: {
    width: '100%',
  },
  playAgainBtn: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playAgainText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  menuBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  menuBtnText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
});
