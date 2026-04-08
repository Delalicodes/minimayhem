import React, { useRef, useEffect } from 'react';
import { FONT_FAMILY } from '../game/constants.js';

const GAMES = [
  {
    id: 'hot_potato',
    icon: '🔥',
    title: 'HOT POTATO',
    tagline: 'Pass it fast or get blasted!',
    color: '#FF6B35',
    gradient: 'linear-gradient(135deg, #FF6B35, #FF4500)',
  },
  {
    id: 'target_shoot',
    icon: '🎯',
    title: 'TARGET SHOOT',
    tagline: 'Shoot targets, stun opponents!',
    color: '#00BFFF',
    gradient: 'linear-gradient(135deg, #00BFFF, #0066FF)',
  },
];

export default function GameSelectScreen({ onSelect }) {
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

      // Dark background
      ctx.fillStyle = '#0A0A1A';
      ctx.fillRect(0, 0, w, h);

      // Subtle animated gradient blob
      const grd = ctx.createRadialGradient(
        w / 2 + Math.sin(frame * 0.008) * 80,
        h / 2 + Math.cos(frame * 0.01) * 40,
        10, w / 2, h / 2, w * 0.8
      );
      grd.addColorStop(0, 'rgba(100, 50, 255, 0.07)');
      grd.addColorStop(0.5, 'rgba(50, 100, 255, 0.03)');
      grd.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, w, h);

      // Floating dots
      for (let i = 0; i < 20; i++) {
        const px = (Math.sin(frame * 0.004 + i * 2.3) * 0.5 + 0.5) * w;
        const py = (Math.cos(frame * 0.006 + i * 1.9) * 0.5 + 0.5) * h;
        const size = 1.2 + Math.sin(frame * 0.015 + i) * 0.8;
        ctx.beginPath();
        ctx.arc(px, py, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(150, 130, 255, ${0.08 + Math.sin(frame * 0.02 + i) * 0.05})`;
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

  return (
    <div style={styles.container}>
      <canvas ref={canvasRef} style={styles.bgCanvas} />

      <div style={styles.content}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.logoText}>MINI MAYHEM</div>
          <div style={styles.logoSub}>PARTY GAMES</div>
        </div>

        {/* Game Cards */}
        <div style={styles.cardGrid}>
          {GAMES.map(game => (
            <button
              key={game.id}
              onClick={() => onSelect(game.id)}
              style={styles.card}
              onMouseOver={e => {
                e.currentTarget.style.transform = 'scale(1.04)';
                e.currentTarget.style.boxShadow = `0 12px 40px ${game.color}40`;
              }}
              onMouseOut={e => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = `0 6px 24px rgba(0,0,0,0.5)`;
              }}
            >
              {/* Color accent bar */}
              <div style={{
                ...styles.cardAccent,
                background: game.gradient,
              }} />

              {/* Icon */}
              <div style={styles.cardIcon}>{game.icon}</div>

              {/* Title */}
              <div style={{
                ...styles.cardTitle,
                color: game.color,
              }}>{game.title}</div>

              {/* Tagline */}
              <div style={styles.cardTagline}>{game.tagline}</div>

              {/* Play badge */}
              <div style={{
                ...styles.playBadge,
                background: game.gradient,
              }}>
                PLAY ▸
              </div>
            </button>
          ))}
        </div>

        {/* Footer hint */}
        <div style={styles.footerHint}>
          More games coming soon...
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
    gap: 30,
    padding: '20px',
    width: '100%',
    maxWidth: 700,
  },
  header: {
    textAlign: 'center',
  },
  logoText: {
    fontFamily: FONT_FAMILY,
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 8,
    textShadow: '0 0 40px rgba(100, 50, 255, 0.4)',
  },
  logoSub: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    letterSpacing: 10,
    color: 'rgba(255,255,255,0.3)',
    marginTop: 6,
  },
  cardGrid: {
    display: 'flex',
    gap: 20,
    justifyContent: 'center',
    flexWrap: 'wrap',
    width: '100%',
  },
  card: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 10,
    width: 200,
    padding: '0 20px 20px 20px',
    borderRadius: 20,
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.04)',
    backdropFilter: 'blur(12px)',
    cursor: 'pointer',
    transition: 'all 0.25s ease',
    boxShadow: '0 6px 24px rgba(0,0,0,0.5)',
    outline: 'none',
    overflow: 'hidden',
    position: 'relative',
  },
  cardAccent: {
    width: '120%',
    height: 4,
    borderRadius: '0 0 4px 4px',
    marginBottom: 10,
  },
  cardIcon: {
    fontSize: 48,
    marginTop: 6,
  },
  cardTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  cardTagline: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
    lineHeight: '1.4',
  },
  playBadge: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
    padding: '6px 22px',
    borderRadius: 20,
    letterSpacing: 2,
    marginTop: 6,
  },
  footerHint: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    color: 'rgba(255,255,255,0.15)',
    letterSpacing: 2,
  },
};
