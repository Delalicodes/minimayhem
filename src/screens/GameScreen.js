import React, { useRef, useEffect, useCallback } from 'react';
import Engine from '../game/Engine.js';
import { initAudio } from '../utils/sounds.js';

export default function GameScreen({ humanCount, powerUps, onGameOver }) {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const containerRef = useRef(null);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    // Use container dimensions
    const w = container.clientWidth;
    const h = container.clientHeight;

    // Set canvas resolution
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    canvas.width = w;
    canvas.height = h;
  }, []);

  useEffect(() => {
    initAudio();
    resizeCanvas();

    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new Engine(canvas, humanCount, onGameOver, powerUps);
    engineRef.current = engine;
    engine.start();

    const handleResize = () => {
      resizeCanvas();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      engine.stop();
      window.removeEventListener('resize', handleResize);
    };
  }, [humanCount, powerUps, onGameOver, resizeCanvas]);

  return (
    <div ref={containerRef} style={styles.container}>
      <canvas
        ref={canvasRef}
        style={styles.canvas}
      />
    </div>
  );
}

const styles = {
  container: {
    width: '100%',
    height: '100%',
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#0F0F23',
    touchAction: 'none',
  },
  canvas: {
    display: 'block',
    width: '100%',
    height: '100%',
    touchAction: 'none',
  },
};
