import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PLAYER_COLORS, PLAYER_NAMES, FONT_FAMILY } from '../game/constants.js';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const GAME_INFO = {
  hot_potato: { icon: '🔥', title: 'HOT POTATO', color: '#FF6B35' },
  target_shoot: { icon: '🎯', title: 'TARGET SHOOT', color: '#00BFFF' }
};

export default function MenuScreen({ gameMode, onStart, onBack }) {
  const [humanCount, setHumanCount] = useState(1);
  const [powerUps, setPowerUps] = useState(true);

  const info = GAME_INFO[gameMode] || GAME_INFO.hot_potato;

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0F0F23', '#1A1A3A']} style={StyleSheet.absoluteFill} />
      
      <SafeAreaView style={styles.safeArea}>
        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={onBack}>
            <Text style={styles.backBtnText}>← BACK</Text>
          </TouchableOpacity>
          <Text style={styles.logoLabel}>MINI MAYHEM</Text>
        </View>

        {/* Title View - Very Compact */}
        <View style={styles.heroArea}>
            <Text style={[styles.title, { color: info.color }]}>
                {info.icon} {info.title}
            </Text>
        </View>

        {/* Selection Area - Flexible */}
        <View style={styles.configArea}>
            <View style={styles.section}>
                <Text style={styles.sectionLabel}>HUMAN PLAYERS</Text>
                <View style={styles.countControls}>
                    {[1, 2, 3, 4].map(count => (
                    <TouchableOpacity
                        key={count}
                        onPress={() => setHumanCount(count)}
                        style={[
                        styles.countBtn,
                        humanCount === count && { borderColor: '#fff', backgroundColor: 'rgba(255,255,255,0.1)' }
                        ]}
                    >
                        <Text style={[
                        styles.countBtnText,
                        humanCount === count && { color: '#fff' }
                        ]}>
                        {count}
                        </Text>
                    </TouchableOpacity>
                    ))}
                </View>
                <View style={styles.playerPreview}>
                    {Array.from({ length: 4 }).map((_, i) => (
                    <View 
                        key={i} 
                        style={[
                        styles.playerIndicator,
                        { backgroundColor: PLAYER_COLORS[i], opacity: i < humanCount ? 1 : 0.2 }
                        ]} 
                    />
                    ))}
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionLabel}>GAME MODIFIERS</Text>
                <TouchableOpacity 
                    style={styles.toggleRow}
                    onPress={() => setPowerUps(!powerUps)}
                >
                    <Text style={styles.toggleLabel}>POWER-UPS</Text>
                    <View style={[styles.toggle, powerUps ? styles.toggleOn : styles.toggleOff]}>
                        <View style={[styles.toggleKnob, powerUps ? { alignSelf: 'flex-end' } : { alignSelf: 'flex-start' }]} />
                    </View>
                </TouchableOpacity>
            </View>
        </View>

        {/* Bottom Pin Button */}
        <View style={styles.footer}>
            <TouchableOpacity 
                onPress={() => onStart(gameMode, humanCount, powerUps)}
                style={styles.startBtnWrapper}
                activeOpacity={0.8}
            >
                <LinearGradient
                    colors={['#FF4757', '#FF6B81']}
                    style={styles.startBtn}
                >
                    <Text style={styles.startBtnText}>START BATTLE</Text>
                </LinearGradient>
            </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F23',
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'space-between', // This keeps the start button at the bottom
  },
  header: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  backBtnText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  logoLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.2)',
    letterSpacing: 3,
    fontWeight: 'bold',
  },
  heroArea: {
    alignItems: 'center',
    marginVertical: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1,
  },
  configArea: {
    flex: 1,
    justifyContent: 'center',
    gap: 20,
    maxHeight: 300,
  },
  section: {
    gap: 12,
  },
  sectionLabel: {
    fontSize: 10,
    letterSpacing: 2,
    color: 'rgba(255,255,255,0.3)',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  countControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  countBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  countBtnText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 16,
    fontWeight: 'bold',
  },
  playerPreview: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
  },
  playerIndicator: {
    width: 30,
    height: 8,
    borderRadius: 4,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    maxWidth: 280,
    alignSelf: 'center',
    width: '100%',
  },
  toggleLabel: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    padding: 3,
    justifyContent: 'center',
  },
  toggleOn: { backgroundColor: '#2ED573' },
  toggleOff: { backgroundColor: 'rgba(255,255,255,0.1)' },
  toggleKnob: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#fff',
  },
  footer: {
    paddingBottom: 20,
    alignItems: 'center',
  },
  startBtnWrapper: {
    width: '100%',
    maxWidth: 280,
  },
  startBtn: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  startBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
});
