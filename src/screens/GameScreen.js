import React, { useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const getGameHTML = (gameMode, humanCount, powerUps) => {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
    <style>
        body, html { margin: 0; padding: 0; width: 100vw; height: 100vh; overflow: hidden; background: #0F0F23; }
        canvas { display: block; width: 100vw; height: 100vh; touch-action: none; background: #0F0F23; position: fixed; top: 0; left: 0; }
    </style>
</head>
<body>
    <canvas id="gameCanvas"></canvas>
    <script>
        // --- CORE STATE ---
        const CONFIG = {
          gameMode: "${gameMode}",
          humanCount: ${humanCount},
          w: window.innerWidth,
          h: window.innerHeight,
          pad: 20,
          dpr: window.devicePixelRatio || 1
        };

        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d', { alpha: false });
        
        function resizeCanvas() {
            CONFIG.w = window.innerWidth;
            CONFIG.h = window.innerHeight;
            canvas.width = CONFIG.w * CONFIG.dpr;
            canvas.height = CONFIG.h * CONFIG.dpr;
            ctx.scale(CONFIG.dpr, CONFIG.dpr);
            // Recalculate joystick base positions
            if(window.joysticks) initJoysticks();
        }
        window.addEventListener('resize', resizeCanvas);

        const COLORS = ['#FF4757', '#2ED573', '#1E90FF', '#FFA502'];
        const NAMES = ['RED', 'GREEN', 'BLUE', 'ORANGE'];
        const STATE = { PLAYING: 1, ROUND_OVER: 2, GAME_OVER: 3 };

        class Player {
            constructor(i, x, y, isHuman) {
                this.index = i; this.x = x; this.y = y; this.vx = 0; this.vy = 0;
                this.color = COLORS[i]; this.name = NAMES[i]; this.isHuman = isHuman;
                this.radius = 18; this.isAlive = true; this.angle = 0; this.animFrame = 0;
                this.isHolding = false; this.passImmunity = 0; this.squash = 1; this.stretch = 1;
            }
            update(dt) {
                if (this.isAlive) {
                  const s = 3.6; 
                  this.x += this.vx * s; this.y += this.vy * s;
                }
                const margin = CONFIG.pad + this.radius + 6;
                if (this.x < margin) this.x = margin;
                if (this.x > CONFIG.w - margin) this.x = CONFIG.w - margin;
                if (this.y < margin) this.y = margin;
                if (this.y > CONFIG.h - margin) this.y = CONFIG.h - margin;

                const speed = Math.sqrt(this.vx*this.vx + this.vy*this.vy);
                if (speed > 0.1) {
                  this.angle = Math.atan2(this.vy, this.vx); this.animFrame += speed * 0.1;
                  this.stretch = 1 + speed * 0.05; this.squash = 1 - speed * 0.05;
                }
                if(this.passImmunity > 0) this.passImmunity -= dt;
            }
        }

        class Potato {
            constructor() { this.holderIdx = -1; this.timer = 0; this.maxTimer = 0; this.urgency = 0; }
            start(i) { this.holderIdx = i; this.timer = 7 + Math.random()*8; this.maxTimer = this.timer; }
            update(dt) { this.timer -= dt; this.urgency = 1 - (this.timer / this.maxTimer); return this.timer <= 0; }
        }

        class Renderer {
            constructor() {
                this.particles = []; this.shake = 0;
                this.bgGrd = ctx.createLinearGradient(0, 0, 0, CONFIG.h);
                this.bgGrd.addColorStop(0, '#121232'); this.bgGrd.addColorStop(1, '#1A1A4A');
            }
            draw(players, potato, holder, joysticks, round, gameState) {
                ctx.save();
                if(this.shake > 0) { ctx.translate((Math.random()-0.5)*this.shake, (Math.random()-0.5)*this.shake); this.shake *= 0.85; }
                ctx.fillStyle = this.bgGrd; ctx.fillRect(0,0,CONFIG.w,CONFIG.h);
                
                const aw = CONFIG.w-CONFIG.pad*2, ah = CONFIG.h-CONFIG.pad*2;
                ctx.save(); this._roundRect(ctx, CONFIG.pad, CONFIG.pad, aw, ah, 24); ctx.clip();
                ctx.fillStyle='#FFF'; ctx.fillRect(CONFIG.pad, CONFIG.pad, aw, ah);
                ctx.fillStyle='#f0f2f5';
                for(let x=CONFIG.pad;x<CONFIG.w-CONFIG.pad;x+=60) for(let y=CONFIG.pad;y<CONFIG.h-CONFIG.pad;y+=60) if((Math.floor((x-CONFIG.pad)/60)+Math.floor((y-CONFIG.pad)/60))%2===0) ctx.fillRect(x,y,60,60);
                
                players.forEach(p => {
                    ctx.save(); ctx.translate(p.x, p.y);
                    if (!p.isAlive) ctx.globalAlpha = 0.4;
                    ctx.fillStyle='rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(2,8,20,12,0,0,Math.PI*2); ctx.fill();
                    if(p.isAlive && p.isHolding) {
                      const pSize = 45 + Math.sin(Date.now()*0.015)*10;
                      ctx.fillStyle='rgba(255,71,87,0.2)'; ctx.beginPath(); ctx.arc(0,0,pSize,0,Math.PI*2); ctx.fill();
                    }
                    ctx.rotate(p.angle); ctx.scale(p.stretch, p.squash);
                    ctx.fillStyle = p.isAlive ? p.color : '#999';
                    const leg = Math.sin(p.animFrame)*9;
                    ctx.beginPath();ctx.arc(-7+leg,-14,7,0,Math.PI*2);ctx.fill(); ctx.beginPath();ctx.arc(-7-leg,14,7,0,Math.PI*2);ctx.fill();
                    ctx.beginPath();ctx.arc(0,0,20,0,Math.PI*2);ctx.fill();
                    ctx.fillStyle='white';ctx.beginPath();ctx.arc(12,-7,5.5,0,Math.PI*2);ctx.arc(12,7,5.5,0,Math.PI*2);ctx.fill();
                    if (p.isAlive) { ctx.fillStyle='#111';ctx.beginPath();ctx.arc(14,-6,2.5,0,Math.PI*2);ctx.arc(14,6,2.5,0,Math.PI*2);ctx.fill(); }
                    else { ctx.strokeStyle='#333'; ctx.lineWidth=2; ctx.beginPath();ctx.moveTo(10,-9);ctx.lineTo(14,-5);ctx.moveTo(14,-9);ctx.lineTo(10,-5);ctx.stroke(); ctx.beginPath();ctx.moveTo(10,5);ctx.lineTo(14,9);ctx.moveTo(14,5);ctx.lineTo(10,9);ctx.stroke(); }
                    ctx.restore();
                });

                if(holder && holder.isAlive) {
                  const px = holder.x+Math.cos(holder.angle)*28, py = holder.y+Math.sin(holder.angle)*28;
                  const glow = 13 + Math.sin(Date.now()*0.02)*(2 + potato.urgency*10);
                  ctx.save(); ctx.translate(px,py); ctx.shadowBlur=15; ctx.shadowColor='#FFA502';
                  ctx.fillStyle='#CD853F'; ctx.beginPath(); ctx.arc(0,0,glow,0,Math.PI*2); ctx.fill(); ctx.restore();
                }

                this.particles.forEach((p,i)=>{
                  p.x+=p.vx; p.y+=p.vy; p.life-=0.02; ctx.globalAlpha=p.life; ctx.fillStyle=p.color;
                  ctx.beginPath(); ctx.arc(p.x,p.y,4,0,Math.PI*2); ctx.fill();
                  if(p.life<=0) this.particles.splice(i,1);
                });
                ctx.restore();

                ctx.strokeStyle='#FFF'; ctx.lineWidth=10; this._roundRect(ctx, CONFIG.pad, CONFIG.pad, aw, ah, 24); ctx.stroke();

                // UI - MULTIPLE JOYSTICKS
                joysticks.forEach((j, i) => {
                  if(i >= CONFIG.humanCount) return;
                  ctx.save(); ctx.globalAlpha = 0.4;
                  ctx.beginPath(); ctx.arc(j.baseX, j.baseY, 50, 0, Math.PI*2); ctx.strokeStyle = j.color; ctx.lineWidth = 4; ctx.stroke();
                  if(j.active) {
                    ctx.globalAlpha = 0.7;
                    ctx.beginPath(); ctx.arc(j.baseX + j.vx*35, j.baseY + j.vy*35, 25, 0, Math.PI*2); ctx.fillStyle = j.color; ctx.fill();
                  } else {
                    ctx.globalAlpha = 0.2;
                    ctx.beginPath(); ctx.arc(j.baseX, j.baseY, 25, 0, Math.PI*2); ctx.fillStyle = j.color; ctx.fill();
                  }
                  ctx.restore();
                });

                ctx.fillStyle='white'; ctx.font='bold 18px sans-serif'; ctx.textAlign='center'; ctx.globalAlpha=0.8;
                ctx.fillText('ROUND ' + round, CONFIG.w/2, 35);
                if(gameState === STATE.ROUND_OVER) { ctx.globalAlpha=1; ctx.font='bold 60px sans-serif'; ctx.fillText("BOOM!", CONFIG.w/2, CONFIG.h/2); }
                ctx.restore();
            }
            _roundRect(ctx, x, y, w, h, r) {
              ctx.beginPath(); ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r); ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h); ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-r); ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y); ctx.closePath();
            }
        }

        const players = []; const startOff = 120;
        const pos = [{x:startOff,y:startOff},{x:CONFIG.w-startOff,y:startOff},{x:startOff,y:CONFIG.h-startOff},{x:CONFIG.w-startOff,y:CONFIG.h-startOff}];
        for(let i=0;i<4;i++) players.push(new Player(i,pos[i].x,pos[i].y,i<CONFIG.humanCount));
        
        const potato = new Potato(); let holderIdx = Math.floor(Math.random()*4);
        players[holderIdx].isHolding=true; potato.start(holderIdx);

        let gameState=STATE.PLAYING, round=1;
        const renderer = new Renderer();

        // JOYSTICKS STATE
        window.joysticks = [];
        function initJoysticks() {
            const m = 80;
            window.joysticks = [
              { active: false, baseX: m, baseY: CONFIG.h-m, vx: 0, vy: 0, touchId: null, color: COLORS[0] }, // P1: Bottom-Left
              { active: false, baseX: CONFIG.w-m, baseY: CONFIG.h-m, vx: 0, vy: 0, touchId: null, color: COLORS[1] }, // P2: Bottom-Right
              { active: false, baseX: m, baseY: m+20, vx: 0, vy: 0, touchId: null, color: COLORS[2] }, // P3: Top-Left
              { active: false, baseX: CONFIG.w-m, baseY: m+20, vx: 0, vy: 0, touchId: null, color: COLORS[3] }  // P4: Top-Right
            ];
        }
        initJoysticks();
        resizeCanvas();

        canvas.addEventListener('touchstart', e => {
            for(let t of e.changedTouches) {
                // Determine which joystick by quadrant or distance
                for(let i=0; i<CONFIG.humanCount; i++) {
                    const j = joysticks[i];
                    const dist = Math.sqrt((t.clientX-j.baseX)**2 + (t.clientY-j.baseY)**2);
                    if(!j.active && dist < 120) {
                        j.active = true; j.touchId = t.identifier; break;
                    }
                }
            }
        });

        canvas.addEventListener('touchmove', e => {
            e.preventDefault();
            for(let t of e.changedTouches) {
                for(let i=0; i<CONFIG.humanCount; i++){
                    const j = joysticks[i];
                    if(j.active && j.touchId === t.identifier) {
                        const dx = t.clientX - j.baseX, dy = t.clientY - j.baseY;
                        const dist = Math.sqrt(dx*dx + dy*dy) || 1;
                        j.vx = dx/dist; j.vy = dy/dist;
                        players[i].vx = j.vx; players[i].vy = j.vy;
                    }
                }
            }
        });

        canvas.addEventListener('touchend', e => {
            for(let t of e.changedTouches) {
                for(let i=0; i<CONFIG.humanCount; i++){
                    const j = joysticks[i];
                    if(j.active && j.touchId === t.identifier) {
                        j.active = false; j.touchId = null; j.vx = 0; j.vy = 0;
                        players[i].vx = 0; players[i].vy = 0;
                    }
                }
            }
        });

        function loop() {
          const dt = 0.016;
          if(gameState === STATE.PLAYING) {
            players.forEach(p=>{
              if(!p.isHuman && p.isAlive) {
                const h = players[holderIdx];
                if(p.index === holderIdx) {
                  const t = players.find(op=>op.isAlive && op.index!==p.index);
                  if(t){ const dx=t.x-p.x, dy=t.y-p.y, m=Math.sqrt(dx*dx+dy*dy); p.vx=dx/m; p.vy=dy/m; }
                } else {
                  const dx=p.x-h.x, dy=p.y-h.y, m=Math.sqrt(dx*dx+dy*dy);
                  const fearRange = 220;
                  if(m < fearRange){ p.vx=dx/m; p.vy=dy/m; } else if(Math.random()<0.01){ const a=Math.random()*6.28; p.vx=Math.cos(a); p.vy=Math.sin(a); }
                }
              }
              p.update(dt);
            });
            
            const h = players[holderIdx];
            players.forEach(p => {
              if(p.index !== h.index && p.isAlive && p.passImmunity <= 0) {
                const dx=p.x-h.x, dy=p.y-h.y, d=Math.sqrt(dx*dx+dy*dy);
                if(d < 75) {
                  const giver = h; const receiver = p;
                  giver.isHolding=false; receiver.isHolding=true; 
                  // AI BALANCE: Higher immunity (1.8s) so it doesn't pass back immediately
                  giver.passImmunity = 1.8; 
                  holderIdx = receiver.index;
                  renderer.shake=15; for(let i=0;i<12;i++){ const a=Math.random()*6.28; const s=3+Math.random()*3; renderer.particles.push({x:receiver.x,y:receiver.y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:0.8,color:receiver.color}); }
                }
              }
            });
            if(potato.update(dt)) {
              players[holderIdx].isAlive=false; gameState=STATE.ROUND_OVER;
              renderer.shake=30; for(let i=0;i<40;i++){ const a=Math.random()*6.28; const s=4+Math.random()*8; renderer.particles.push({x:players[holderIdx].x,y:players[holderIdx].y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:1.2,color:'#FF4757'}); }
              setTimeout(()=>{
                const s = players.filter(p=>p.isAlive);
                if(s.length <= 1) { 
                  gameState = STATE.GAME_OVER; const winner = s[0] || players[0];
                  const res = { winner: { name: winner.name, color: winner.color }, rounds: round, scores: players.map(p => ({ name: p.name, color: p.color, score: p.isAlive ? 100 : 50 })) };
                  window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'GAME_OVER', data: res }));
                }
                else { round++; holderIdx=s[0].index; players.forEach(p=>p.isHolding=false); s[0].isHolding=true; potato.start(holderIdx); gameState=STATE.PLAYING; }
              }, 2000);
            }
          } else {
            players.forEach(p => p.update(dt));
          }
          renderer.draw(players, potato, players[holderIdx], joysticks, round, gameState);
          requestAnimationFrame(loop);
        }
        loop();
    </script>
</body>
</html>
  `;
};

export default function GameScreen({ gameMode, humanCount, powerUps, onGameOver }) {
  const html = useMemo(() => getGameHTML(gameMode, humanCount, powerUps), [gameMode, humanCount, powerUps]);

  const handleMessage = (event) => {
    try {
      const { type, data } = JSON.parse(event.nativeEvent.data);
      if (type === 'GAME_OVER') {
        onGameOver && onGameOver(data);
      }
    } catch (e) {
      console.warn("WebView Bridge Error:", e);
    }
  };

  return (
    <View style={styles.container}>
      <WebView 
        originWhitelist={['*']} 
        source={{ html }} 
        style={styles.webview} 
        scrollEnabled={false} 
        javaScriptEnabled={true} 
        onMessage={handleMessage}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F23' },
  webview: { flex: 1, backgroundColor: 'transparent' },
});
