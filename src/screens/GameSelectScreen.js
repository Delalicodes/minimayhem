import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FONT_FAMILY } from '../game/constants.js';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const GAMES = [
  {
    id: 'hot_potato',
    icon: '🔥',
    title: 'HOT POTATO',
    tagline: 'Pass it fast or get blasted!',
    color: '#FF6B35',
    gradient: ['#FF6B35', '#FF4500'],
  },
  {
    id: 'target_shoot',
    icon: '🎯',
    title: 'TARGET SHOOT',
    tagline: 'Shoot targets, stun opponents!',
    color: '#00BFFF',
    gradient: ['#00BFFF', '#0066FF'],
  },
];

export default function GameSelectScreen({ onSelect }) {
  return (
    <View style={styles.container}>
      {/* Background Gradient */}
      <LinearGradient
        colors={['#0A0A1A', '#1A1A3A']}
        style={StyleSheet.absoluteFill}
      />

      {/* Hero Blobs (Simulation of the canvas backdrop) */}
      <View style={[styles.blob, { top: -50, left: -50, backgroundColor: 'rgba(100, 50, 255, 0.1)' }]} />
      <View style={[styles.blob, { bottom: -100, right: -50, backgroundColor: 'rgba(50, 100, 255, 0.08)' }]} />

      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logoText}>MINI MAYHEM</Text>
          <Text style={styles.logoSub}>PARTY GAMES</Text>
        </View>

        {/* Game Cards */}
        <View style={styles.cardGrid}>
          {GAMES.map(game => (
            <TouchableOpacity
              key={game.id}
              activeOpacity={0.85}
              onPress={() => onSelect(game.id)}
              style={styles.card}
            >
              <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255,255,255,0.05)' }]} />
              
              {/* Color accent bar */}
              <LinearGradient
                colors={game.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.cardAccent}
              />

              {/* Icon */}
              <Text style={styles.cardIcon}>{game.icon}</Text>

              {/* Title */}
              <Text style={[styles.cardTitle, { color: game.color }]}>
                {game.title}
              </Text>

              {/* Tagline */}
              <Text style={styles.cardTagline}>{game.tagline}</Text>

              {/* Play badge */}
              <LinearGradient
                colors={game.gradient}
                style={styles.playBadge}
              >
                <Text style={styles.playBadgeText}>PLAY ▸</Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>

        {/* Footer hint */}
        <Text style={styles.footerHint}>
          More games coming soon...
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0A0A1A',
  },
  blob: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
  },
  content: {
    alignItems: 'center',
    gap: 40,
    padding: 20,
    width: '100%',
    maxWidth: 700,
  },
  header: {
    alignItems: 'center',
  },
  logoText: {
    fontFamily: Platform.OS === 'web' ? FONT_FAMILY : undefined,
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 4,
    textAlign: 'center',
  },
  logoSub: {
    fontFamily: Platform.OS === 'web' ? FONT_FAMILY : undefined,
    fontSize: 12,
    letterSpacing: 8,
    color: 'rgba(255,255,255,0.3)',
    marginTop: 8,
    textAlign: 'center',
  },
  cardGrid: {
    flexDirection: 'row',
    gap: 20,
    justifyContent: 'center',
    flexWrap: 'wrap',
    width: '100%',
  },
  card: {
    alignItems: 'center',
    gap: 12,
    width: 200,
    paddingBottom: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
      android: { elevation: 8 },
    }),
  },
  cardAccent: {
    width: '100%',
    height: 4,
    marginBottom: 10,
  },
  cardIcon: {
    fontSize: 48,
    marginTop: 10,
  },
  cardTitle: {
    fontFamily: Platform.OS === 'web' ? FONT_FAMILY : undefined,
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
  cardTagline: {
    fontFamily: Platform.OS === 'web' ? FONT_FAMILY : undefined,
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 15,
  },
  playBadge: {
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 20,
    marginTop: 10,
  },
  playBadgeText: {
    fontFamily: Platform.OS === 'web' ? FONT_FAMILY : undefined,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 1.5,
  },
  footerContainer: {
    alignItems: 'center',
    gap: 12,
    marginTop: 20,
  },
  tapHint: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2ED573',
    letterSpacing: 2,
  },
  footerHint: {
    fontFamily: Platform.OS === 'web' ? FONT_FAMILY : undefined,
    fontSize: 11,
    color: 'rgba(255,255,255,0.15)',
    letterSpacing: 2,
  },
});
