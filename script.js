// Minimal particles + UI hooks
const c = document.getElementById('bg');
const dpr = Math.min(2, window.devicePixelRatio || 1);
const ctx = c.getContext('2d');
let w, h, pts=[];
function resize(){w = c.width = innerWidth*dpr; h = c.height = innerHeight*dpr; c.style.width=innerWidth+'px'; c.style.height=innerHeight+'px'; pts = Array.from({length: Math.max(60, Math.min(120, Math.round(innerWidth/12)))}).map(()=>({x:Math.random()*w,y:Math.random()*h,vx:(Math.random()-.5)*.2*dpr,vy:(Math.random()-.5)*.2*dpr,r:Math.random()*1.8+0.6}));}
function step(){ctx.clearRect(0,0,w,h); ctx.fillStyle='rgba(255,255,255,0.6)'; const link='rgba(140,160,255,0.08)'; for(const p of pts){p.x+=p.vx; p.y+=p.vy; if(p.x<0||p.x>w) p.vx*=-1; if(p.y<0||p.y>h) p.vy*=-1; ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill();}
  ctx.strokeStyle=link; for(let i=0;i<pts.length;i++){for(let j=i+1;j<pts.length;j++){const a=pts[i],b=pts[j]; const dx=a.x-b.x, dy=a.y-b.y; const dist=Math.hypot(dx,dy); if(dist<90*dpr){ctx.globalAlpha = 1 - dist/(90*dpr); ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke();}}} ctx.globalAlpha=1; requestAnimationFrame(step);}
if(!matchMedia('(prefers-reduced-motion: reduce)').matches){addEventListener('resize', resize); resize(); step();}
// Copy checksum buttons
document.addEventListener('click', (e)=>{const id = e.target.getAttribute('data-copy'); if(!id) return; const t = document.getElementById(id)?.textContent?.trim(); if(!t) return; navigator.clipboard.writeText(t).then(()=>{e.target.textContent='Copied'; setTimeout(()=>e.target.textContent='Copy',1200);});});