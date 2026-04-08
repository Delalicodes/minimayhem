import React, { useEffect, useRef } from 'react';
import { FONT_FAMILY } from '../game/constants.js';

export default function ResultScreen({ result, onPlayAgain, onMenu }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let frame = 0;
    const confetti = [];

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Generate confetti particles
    for (let i = 0; i < 60; i++) {
      confetti.push({
        x: Math.random() * canvas.width,
        y: -20 - Math.random() * 300,
        vx: (Math.random() - 0.5) * 3,
        vy: 1 + Math.random() * 3,
        size: 4 + Math.random() * 6,
        color: ['#FF4757', '#2ED573', '#1E90FF', '#FFA502', '#FFD700', '#FF6B35'][Math.floor(Math.random() * 6)],
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.2,
      });
    }

    const draw = () => {
      frame++;
      ctx.fillStyle = '#0F0F23';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Animated radial glow
      const grd = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 3, 20,
        canvas.width / 2, canvas.height / 3, 200
      );
      grd.addColorStop(0, result.winner ? result.winner.color + '20' : 'rgba(255,215,0,0.1)');
      grd.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Confetti
      for (const c of confetti) {
        c.x += c.vx;
        c.y += c.vy;
        c.rotation += c.rotSpeed;

        if (c.y > canvas.height + 20) {
          c.y = -20;
          c.x = Math.random() * canvas.width;
        }

        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.rotate(c.rotation);
        ctx.fillStyle = c.color;
        ctx.fillRect(-c.size / 2, -c.size / 4, c.size, c.size / 2);
        ctx.restore();
      }

      animRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [result]);

  if (!result) return null;

  return (
    <div style={styles.container}>
      <canvas ref={canvasRef} style={styles.bgCanvas} />

      <div style={styles.content}>
        <div style={styles.trophy}>🏆</div>
        <div style={{
          ...styles.winnerName,
          color: result.winner.color,
          textShadow: `0 0 30px ${result.winner.color}60`,
        }}>
          {result.winner.name} Wins!
        </div>
        <div style={styles.roundsText}>
          in {result.rounds} round{result.rounds > 1 ? 's' : ''}
        </div>

        {/* Scoreboard */}
        <div style={styles.scoreboard}>
          <div style={styles.scoreTitle}>FINAL SCORES</div>
          {result.scores
            .sort((a, b) => b.score - a.score)
            .map((s, i) => (
              <div key={i} style={styles.scoreRow}>
                <div style={styles.scoreRank}>
                  {i === 0 ? '👑' : `${i + 1}.`}
                </div>
                <div style={{
                  ...styles.scoreName,
                  color: s.color,
                }}>
                  {s.name}
                </div>
                <div style={styles.scoreValue}>{s.score}</div>
              </div>
            ))
          }
        </div>

        {/* Buttons */}
        <div style={styles.buttons}>
          <button onClick={onPlayAgain} style={styles.playAgainBtn}>
            <span style={styles.btnText}>PLAY AGAIN</span>
          </button>
          <button onClick={onMenu} style={styles.menuBtn}>
            <span style={styles.menuBtnText}>MAIN MENU</span>
          </button>
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
    gap: 12,
    padding: '20px',
    maxWidth: 360,
    width: '100%',
  },
  trophy: {
    fontSize: 64,
    marginBottom: 4,
    filter: 'drop-shadow(0 0 20px rgba(255, 215, 0, 0.5))',
  },
  winnerName: {
    fontFamily: FONT_FAMILY,
    fontSize: 36,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  roundsText: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    color: 'rgba(255,255,255,0.4)',
    marginBottom: 12,
  },
  scoreboard: {
    width: '100%',
    background: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    padding: '16px 20px',
    border: '1px solid rgba(255,255,255,0.08)',
    backdropFilter: 'blur(10px)',
  },
  scoreTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    letterSpacing: 3,
    color: 'rgba(255,255,255,0.3)',
    textAlign: 'center',
    marginBottom: 12,
  },
  scoreRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '6px 0',
  },
  scoreRank: {
    width: 28,
    textAlign: 'center',
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    color: 'rgba(255,255,255,0.4)',
  },
  scoreName: {
    flex: 1,
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    fontWeight: 'bold',
  },
  scoreValue: {
    fontFamily: FONT_FAMILY,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  buttons: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    width: '100%',
    marginTop: 12,
  },
  playAgainBtn: {
    width: '100%',
    padding: '14px 24px',
    borderRadius: 12,
    border: 'none',
    background: 'linear-gradient(135deg, #FF6B35, #FF4500)',
    cursor: 'pointer',
    boxShadow: '0 4px 20px rgba(255, 69, 0, 0.3)',
    outline: 'none',
    transition: 'all 0.2s ease',
  },
  btnText: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 2,
  },
  menuBtn: {
    width: '100%',
    padding: '12px 24px',
    borderRadius: 12,
    border: '2px solid rgba(255,255,255,0.15)',
    background: 'rgba(255,255,255,0.05)',
    cursor: 'pointer',
    outline: 'none',
    transition: 'all 0.2s ease',
  },
  menuBtnText: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: 'bold',
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 2,
  },
};
