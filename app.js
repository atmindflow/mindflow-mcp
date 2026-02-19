// Lightweight canvas animation to avoid heavy bundles
const c = document.getElementById('webgl');
const dpr = Math.min(2, window.devicePixelRatio || 1);
function resize(){
  c.width = c.clientWidth * dpr;
  c.height = c.clientHeight * dpr;
}
const ctx = c.getContext('2d');
resize();
window.addEventListener('resize', resize);
let t = 0;
const parts = new Array(140).fill(0).map((_,i)=>({a:Math.random()*Math.PI*2,r:Math.random()*1.1+0.2,s:Math.random()*0.7+0.3}));
function loop(){
  t += 0.008;
  ctx.clearRect(0,0,c.width,c.height);
  // glow bg
  const g = ctx.createRadialGradient(c.width*0.5,c.height*0.45,10,c.width*0.5,c.height*0.45,Math.max(c.width,c.height)*0.6);
  g.addColorStop(0,'rgba(110,231,255,0.08)');
  g.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0,0,c.width,c.height);
  // center knot-ish rings
  const cx = c.width*0.5, cy = c.height*0.52;
  for(let k=0;k<3;k++){
    const R = Math.min(c.width,c.height)*0.22*(1+0.06*k*Math.sin(t*1.2+k));
    ctx.lineWidth = 2*dpr;
    ctx.strokeStyle = 'rgba(128,255,209,0.8)';
    ctx.beginPath();
    for(let a=0;a<Math.PI*2;a+=0.02){
      const wob = Math.sin(a*3 + t*2 + k)*6*dpr;
      const x = cx + Math.cos(a)*R + Math.cos(a*5+t*2+k)*wob*0.15;
      const y = cy + Math.sin(a)*R + Math.sin(a*5+t*2+k)*wob*0.15;
      if(a===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    }
    ctx.closePath();
    ctx.stroke();
  }
  // particles
  for(const p of parts){
    const R = Math.min(c.width,c.height)*(0.18 + p.r*0.16);
    const x = cx + Math.cos(p.a + t*(0.6+p.s*0.8))*R;
    const y = cy + Math.sin(p.a + t*(0.6+p.s*0.8))*R;
    ctx.fillStyle = 'rgba(110,231,255,0.9)';
    ctx.beginPath();
    ctx.arc(x,y,1.2*dpr,0,Math.PI*2);
    ctx.fill();
  }
  requestAnimationFrame(loop);
}
loop();
