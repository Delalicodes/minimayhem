import React, { useState, useRef, useEffect } from 'react';
import { PLAYER_COLORS, PLAYER_NAMES, FONT_FAMILY } from '../game/constants.js';

export default function MenuScreen({ gameMode, onStart, onBack }) {
  const [humanCount, setHumanCount] = useState(1);
  const [powerUps, setPowerUps] = useState(true);
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let frame = 0;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const draw = () => {
      frame++;
      const w = canvas.width;
      const h = canvas.height;

      // Background
      ctx.fillStyle = '#0F0F23';
      ctx.fillRect(0, 0, w, h);

      // Animated gradient
      const grd = ctx.createRadialGradient(
        w / 2 + Math.sin(frame * 0.01) * 50,
        h / 3 + Math.cos(frame * 0.012) * 30,
        20, w / 2, h / 2, w * 0.7
      );
      grd.addColorStop(0, 'rgba(255, 100, 0, 0.08)');
      grd.addColorStop(0.5, 'rgba(255, 50, 0, 0.03)');
      grd.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, w, h);

      // Floating particles
      for (let i = 0; i < 15; i++) {
        const px = (Math.sin(frame * 0.005 + i * 2.1) * 0.5 + 0.5) * w;
        const py = (Math.cos(frame * 0.007 + i * 1.7) * 0.5 + 0.5) * h;
        const size = 1.5 + Math.sin(frame * 0.02 + i) * 1;
        ctx.beginPath();
        ctx.arc(px, py, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 150, 50, ${0.1 + Math.sin(frame * 0.03 + i) * 0.08})`;
        ctx.fill();
      }

      animRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  const GAME_INFO = {
    hot_potato: { icon: '🔥', title: 'HOT POTATO', tagline: 'Pass it fast or get blasted!', color: '#FF6B35' },
    target_shoot: { icon: '🎯', title: 'TARGET SHOOT', tagline: 'Shoot targets, stun opponents!', color: '#00BFFF' }
  };
  const info = GAME_INFO[gameMode] || GAME_INFO.hot_potato;

  return (
    <div style={styles.container}>
      <canvas ref={canvasRef} style={styles.bgCanvas} />

      <div style={styles.content}>
        {/* Back button */}
        <button onClick={onBack} style={styles.backBtn}>← Games</button>

        {/* Title */}
        <div style={styles.titleBlock}>
          <div style={styles.subtitle}>MINI MAYHEM</div>
          <div style={{ ...styles.title, color: info.color }}>{info.icon} {info.title} {info.icon}</div>
          <div style={styles.tagline}>{info.tagline}</div>
        </div>

        {/* Player Selection */}
        <div style={styles.section}>
          <div style={styles.sectionLabel}>HUMAN PLAYERS</div>
          <div style={styles.playerGrid}>
            {[1, 2, 3, 4].map(n => (
              <button
                key={n}
                onClick={() => setHumanCount(n)}
                style={{
                  ...styles.playerBtn,
                  borderColor: humanCount >= n ? PLAYER_COLORS[n - 1] : 'rgba(255,255,255,0.1)',
                  backgroundColor: humanCount >= n ? PLAYER_COLORS[n - 1] + '20' : 'rgba(255,255,255,0.03)',
                  transform: humanCount >= n ? 'scale(1.05)' : 'scale(1)',
                }}
              >
                <div style={{ ...styles.stickmanIcon, color: PLAYER_COLORS[n - 1] }}>🏃</div>
                <div style={{ ...styles.playerLabel, color: humanCount >= n ? '#fff' : 'rgba(255,255,255,0.3)' }}>
                  {PLAYER_NAMES[n - 1]}
                </div>
                <div style={{ ...styles.playerType, color: humanCount >= n ? PLAYER_COLORS[n - 1] : 'rgba(255,255,255,0.2)' }}>
                  {humanCount >= n ? 'HUMAN' : 'AI'}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Power-ups Toggle */}
        <div style={styles.section}>
          <button
            onClick={() => setPowerUps(!powerUps)}
            style={{
              ...styles.toggleBtn,
              borderColor: powerUps ? '#FFD700' : 'rgba(255,255,255,0.1)',
              backgroundColor: powerUps ? 'rgba(255, 215, 0, 0.1)' : 'rgba(255,255,255,0.03)',
            }}
          >
            <span style={{ fontSize: 20 }}>{powerUps ? '⚡' : '○'}</span>
            <span style={{ color: powerUps ? '#FFD700' : 'rgba(255,255,255,0.3)' }}>
              Power-ups {powerUps ? 'ON' : 'OFF'}
            </span>
          </button>
        </div>

        {/* Start Button */}
        <button
          onClick={() => onStart(gameMode, humanCount, powerUps)}
          style={styles.startBtn}
        >
          <span style={styles.startText}>START GAME</span>
          <span style={styles.startArrow}>▶</span>
        </button>

        {/* Instructions */}
        <div style={styles.instructions}>
          <div style={styles.instructionItem}>📱 Touch & drag joystick to move</div>
          {gameMode === 'hot_potato' ? (
            <>
              <div style={styles.instructionItem}>💥 Bump into others to pass the potato</div>
              <div style={styles.instructionItem}>⏱ Don't hold it when it explodes!</div>
            </>
          ) : (
            <>
              <div style={styles.instructionItem}>🏹 Stop moving to shoot automatically!</div>
              <div style={styles.instructionItem}>⏱ Hit moving targets for triple points!</div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    position: 'relative',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bgCanvas: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 0,
  },
  content: {
    position: 'relative',
    zIndex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 20,
    padding: '20px',
    maxWidth: 380,
    width: '100%',
  },
  titleBlock: {
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    letterSpacing: 6,
    color: 'rgba(255,255,255,0.4)',
    marginBottom: 4,
  },
  backBtn: {
    alignSelf: 'flex-start',
    background: 'none',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 8,
    color: 'rgba(255,255,255,0.5)',
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    padding: '6px 14px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    outline: 'none',
  },
  title: {
    fontFamily: FONT_FAMILY,
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FF6B35',
    textShadow: '0 0 30px rgba(255, 100, 0, 0.5), 0 0 60px rgba(255, 50, 0, 0.2)',
    letterSpacing: 2,
  },
  tagline: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 6,
  },
  section: {
    width: '100%',
  },
  sectionLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    letterSpacing: 3,
    color: 'rgba(255,255,255,0.3)',
    marginBottom: 10,
    textAlign: 'center',
  },
  playerGrid: {
    display: 'flex',
    gap: 8,
    justifyContent: 'center',
  },
  playerBtn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    padding: '12px 10px',
    borderRadius: 12,
    border: '2px solid',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    width: 76,
    background: 'none',
    outline: 'none',
  },
  stickmanIcon: {
    fontSize: 22,
  },
  playerLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: 'bold',
  },
  playerType: {
    fontFamily: FONT_FAMILY,
    fontSize: 9,
    letterSpacing: 1,
  },
  toggleBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 20px',
    borderRadius: 10,
    border: '2px solid',
    cursor: 'pointer',
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: 'bold',
    width: '100%',
    justifyContent: 'center',
    background: 'none',
    outline: 'none',
    transition: 'all 0.2s ease',
  },
  startBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    width: '100%',
    padding: '16px 24px',
    borderRadius: 14,
    border: 'none',
    background: 'linear-gradient(135deg, #FF6B35, #FF4500)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 25px rgba(255, 69, 0, 0.4), 0 0 60px rgba(255, 69, 0, 0.15)',
    outline: 'none',
    marginTop: 8,
  },
  startText: {
    fontFamily: FONT_FAMILY,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 3,
  },
  startArrow: {
    fontSize: 16,
    color: '#fff',
  },
  instructions: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    marginTop: 8,
  },
  instructionItem: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    color: 'rgba(255,255,255,0.35)',
    textAlign: 'center',
  },
};
