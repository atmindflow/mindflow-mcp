const canvas = document.getElementById('gl');
const pulseBtn = document.getElementById('pulse');
const toggleMotion = document.getElementById('toggleMotion');
const toggleQuality = document.getElementById('toggleQuality');
const motionStateEl = toggleMotion.querySelector('[data-state]');
const qualityStateEl = toggleQuality.querySelector('[data-quality]');

let gl, dpr, width, height;
let rafId = null;
let motionEnabled = true;
let highQuality = true;

// Scene state
let nodes = [];
let links = [];
let focusIndex = -1;
let time = 0;
let cam = { r: 48, theta: 0.9, phi: 0.8, target: [0,0,0] };
let mouse = { x:0, y:0, down:false, lastX:0, lastY:0 };

// Utility
const TAU = Math.PI * 2;
function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }

function resize(){
  dpr = Math.min(2, window.devicePixelRatio || 1);
  width = canvas.clientWidth; height = canvas.clientHeight;
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  gl.viewport(0,0,canvas.width,canvas.height);
}

function initGL(){
  gl = canvas.getContext('webgl', { antialias: true, alpha: true, preserveDrawingBuffer:false });
  if(!gl){ return alert('WebGL not supported'); }
  gl.clearColor(0,0,0,0);
  gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
}

// Simple shader helpers
function createShader(type, src){
  const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
  if(!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
  return s;
}
function createProgram(vsSrc, fsSrc){
  const p = gl.createProgram();
  gl.attachShader(p, createShader(gl.VERTEX_SHADER, vsSrc));
  gl.attachShader(p, createShader(gl.FRAGMENT_SHADER, fsSrc));
  gl.linkProgram(p);
  if(!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
  return p;
}

// Shaders: billboards for nodes, lines for links
const vsPoints = `
attribute vec3 position; // world pos
attribute float size;
attribute float hue;
uniform mat4 proj, view;
uniform float time;
varying float vHue; varying float vPulse;
void main(){
  vHue = hue;
  float pulse = 0.5 + 0.5 * sin(time*2.0 + hue*6.283);
  vPulse = pulse;
  vec4 wp = vec4(position,1.0);
  gl_Position = proj * view * wp;
  gl_PointSize = size * (300.0 / length(gl_Position.xyz));
}
`;
const fsPoints = `
precision mediump float;
varying float vHue; varying float vPulse;
void main(){
  vec2 uv = gl_PointCoord*2.0-1.0; float r = length(uv);
  float alpha = smoothstep(1.0, 0.0, r) * 0.9;
  float h = vHue; float s = 0.7; float v = mix(0.6, 1.0, vPulse);
  float c = v*s; float x = c*(1.0-abs(mod(h*6.0,2.0)-1.0)); float m = v-c;
  vec3 rgb;
  if(h<1.0/6.0) rgb=vec3(c,x,0.0);
  else if(h<2.0/6.0) rgb=vec3(x,c,0.0);
  else if(h<3.0/6.0) rgb=vec3(0.0,c,x);
  else if(h<4.0/6.0) rgb=vec3(0.0,x,c);
  else if(h<5.0/6.0) rgb=vec3(x,0.0,c);
  else rgb=vec3(c,0.0,x);
  rgb += m;
  // soft core + bloom ring
  float ring = smoothstep(0.9,0.3,r) * 0.6;
  vec3 col = rgb*(1.0-ring) + vec3(0.5,0.9,1.0)*ring;
  gl_FragColor = vec4(col, alpha);
}
`;

const vsLines = `
attribute vec3 position; // packed as pairs
attribute float hue;
uniform mat4 proj, view;
uniform float time;
varying float vHue; varying float vGlow;
void main(){
  vHue = hue;
  vGlow = 0.5 + 0.5*sin(time*1.4 + hue*10.0);
  gl_Position = proj * view * vec4(position,1.0);
}
`;
const fsLines = `
precision mediump float;
varying float vHue; varying float vGlow;
void main(){
  float h=vHue; float s=0.6; float v=0.7+0.3*vGlow;
  float c=v*s; float x=c*(1.0-abs(mod(h*6.0,2.0)-1.0)); float m=v-c; vec3 rgb;
  if(h<1.0/6.0) rgb=vec3(c,x,0.0);
  else if(h<2.0/6.0) rgb=vec3(x,c,0.0);
  else if(h<3.0/6.0) rgb=vec3(0.0,c,x);
  else if(h<4.0/6.0) rgb=vec3(0.0,x,c);
  else if(h<5.0/6.0) rgb=vec3(x,0.0,c);
  else rgb=vec3(c,0.0,x);
  gl_FragColor = vec4(rgb, 0.25);
}
`;

let progPoints, progLines, bufPoints, bufSizes, bufHues, bufLinePos, bufLineHue;
let aPosP, aSize, aHueP, uProjP, uViewP, uTimeP;
let aPosL, aHueL, uProjL, uViewL, uTimeL;

function perspective(fov, aspect, near, far){
  const f = 1/Math.tan(fov/2), nf = 1/(near-far);
  return new Float32Array([
    f/aspect,0,0,0,
    0,f,0,0,
    0,0,(far+near)*nf,-1,
    0,0,(2*far*near)*nf,0
  ]);
}
function lookAt(eye, target, up){
  const z0=eye[0]-target[0], z1=eye[1]-target[1], z2=eye[2]-target[2];
  let zl = Math.hypot(z0,z1,z2); const zx=z0/zl, zy=z1/zl, zz=z2/zl;
  let xx = up[1]*zz - up[2]*zy;
  let xy = up[2]*zx - up[0]*zz;
  let xz = up[0]*zy - up[1]*zx;
  let xl = Math.hypot(xx,xy,xz); xx/=xl; xy/=xl; xz/=xl;
  const yx = zy*xz - zz*xy; const yy = zz*xx - zx*xz; const yz = zx*xy - zy*xx;
  return new Float32Array([
    xx, yx, zx, 0,
    xy, yy, zy, 0,
    xz, yz, zz, 0,
    -(xx*eye[0] + xy*eye[1] + xz*eye[2]),
    -(yx*eye[0] + yy*eye[1] + yz*eye[2]),
    -(zx*eye[0] + zy*eye[1] + zz*eye[2]),
    1
  ]);
}

function generateGraph(count=120){
  nodes = new Array(count).fill(0).map((_,i)=>{
    const r = (Math.random()*0.6+0.4)*18;
    const a = Math.random()*TAU; const h = (i/count)*0.9 + 0.05;
    return {
      x: Math.cos(a)*r + (Math.random()-0.5)*2.0,
      y: (Math.random()-0.5)*10,
      z: Math.sin(a)*r + (Math.random()-0.5)*2.0,
      size: Math.random()*3+2,
      hue: h,
      vx:0, vy:0, vz:0
    };
  });
  links = [];
  for(let i=0;i<count;i++){
    for(let k=0;k< (highQuality? 3:2); k++){
      const j = Math.floor(Math.random()*count);
      if(i!==j) links.push([i,j, (nodes[i].hue+nodes[j].hue)*0.5]);
    }
  }
}

function initBuffers(){
  // Points
  bufPoints = gl.createBuffer();
  bufSizes = gl.createBuffer();
  bufHues = gl.createBuffer();
  // Lines
  bufLinePos = gl.createBuffer();
  bufLineHue = gl.createBuffer();
}

function buildPrograms(){
  progPoints = createProgram(vsPoints, fsPoints);
  aPosP = gl.getAttribLocation(progPoints, 'position');
  aSize = gl.getAttribLocation(progPoints, 'size');
  aHueP = gl.getAttribLocation(progPoints, 'hue');
  uProjP = gl.getUniformLocation(progPoints, 'proj');
  uViewP = gl.getUniformLocation(progPoints, 'view');
  uTimeP = gl.getUniformLocation(progPoints, 'time');

  progLines = createProgram(vsLines, fsLines);
  aPosL = gl.getAttribLocation(progLines, 'position');
  aHueL = gl.getAttribLocation(progLines, 'hue');
  uProjL = gl.getUniformLocation(progLines, 'proj');
  uViewL = gl.getUniformLocation(progLines, 'view');
  uTimeL = gl.getUniformLocation(progLines, 'time');
}

function uploadData(){
  const pos = new Float32Array(nodes.length*3);
  const sizes = new Float32Array(nodes.length);
  const hues = new Float32Array(nodes.length);
  for(let i=0;i<nodes.length;i++){
    const n = nodes[i];
    pos[i*3+0]=n.x; pos[i*3+1]=n.y; pos[i*3+2]=n.z;
    sizes[i]= n.size * (i===focusIndex? 2.2 : 1.0);
    hues[i]= n.hue;
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, bufPoints); gl.bufferData(gl.ARRAY_BUFFER, pos, gl.DYNAMIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, bufSizes); gl.bufferData(gl.ARRAY_BUFFER, sizes, gl.DYNAMIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, bufHues); gl.bufferData(gl.ARRAY_BUFFER, hues, gl.DYNAMIC_DRAW);

  const linePos = new Float32Array(links.length*2*3);
  const lineHue = new Float32Array(links.length*2);
  for(let i=0;i<links.length;i++){
    const [a,b,h] = links[i];
    const A = nodes[a], B = nodes[b];
    linePos[i*6+0]=A.x; linePos[i*6+1]=A.y; linePos[i*6+2]=A.z;
    linePos[i*6+3]=B.x; linePos[i*6+4]=B.y; linePos[i*6+5]=B.z;
    lineHue[i*2+0]=h; lineHue[i*2+1]=h;
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, bufLinePos); gl.bufferData(gl.ARRAY_BUFFER, linePos, gl.DYNAMIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, bufLineHue); gl.bufferData(gl.ARRAY_BUFFER, lineHue, gl.DYNAMIC_DRAW);
}

function draw(){
  const aspect = canvas.width/canvas.height;
  const proj = perspective(0.9, aspect, 0.1, 1000);
  const eye = [
    cam.r*Math.sin(cam.theta)*Math.cos(cam.phi),
    cam.r*Math.cos(cam.theta),
    cam.r*Math.sin(cam.theta)*Math.sin(cam.phi)
  ];
  const view = lookAt(eye, cam.target, [0,1,0]);

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Lines
  gl.useProgram(progLines);
  gl.uniformMatrix4fv(uProjL, false, proj);
  gl.uniformMatrix4fv(uViewL, false, view);
  gl.uniform1f(uTimeL, time);
  gl.bindBuffer(gl.ARRAY_BUFFER, bufLinePos);
  gl.enableVertexAttribArray(aPosL);
  gl.vertexAttribPointer(aPosL, 3, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, bufLineHue);
  gl.enableVertexAttribArray(aHueL);
  gl.vertexAttribPointer(aHueL, 1, gl.FLOAT, false, 0, 0);
  gl.drawArrays(gl.LINES, 0, links.length*2);

  // Points
  gl.useProgram(progPoints);
  gl.uniformMatrix4fv(uProjP, false, proj);
  gl.uniformMatrix4fv(uViewP, false, view);
  gl.uniform1f(uTimeP, time);
  gl.bindBuffer(gl.ARRAY_BUFFER, bufPoints);
  gl.enableVertexAttribArray(aPosP);
  gl.vertexAttribPointer(aPosP, 3, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, bufSizes);
  gl.enableVertexAttribArray(aSize);
  gl.vertexAttribPointer(aSize, 1, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, bufHues);
  gl.enableVertexAttribArray(aHueP);
  gl.vertexAttribPointer(aHueP, 1, gl.FLOAT, false, 0, 0);
  gl.drawArrays(gl.POINTS, 0, nodes.length);
}

function step(t){
  if(!motionEnabled){ draw(); return; }
  time = t*0.001;
  // gentle float
  for(let i=0;i<nodes.length;i++){
    const n=nodes[i];
    n.vx += (Math.sin(time*0.3 + i)*0.001);
    n.vy += (Math.cos(time*0.25 + i*0.7)*0.001);
    n.vz += (Math.sin(time*0.2 + i*1.3)*0.001);
    n.x += n.vx; n.y += n.vy; n.z += n.vz;
    n.vx *= 0.96; n.vy *= 0.96; n.vz *= 0.96;
  }
  uploadData();
  draw();
  rafId = requestAnimationFrame(step);
}

function start(){
  cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(step);
}

function stop(){
  cancelAnimationFrame(rafId); rafId = null; draw();
}

// Interactions
canvas.addEventListener('mousedown', (e)=>{ mouse.down=true; mouse.lastX=e.clientX; mouse.lastY=e.clientY;});
window.addEventListener('mouseup', ()=>{ mouse.down=false; });
window.addEventListener('mousemove', (e)=>{
  if(!mouse.down) return;
  const dx=(e.clientX-mouse.lastX)/200; const dy=(e.clientY-mouse.lastY)/200;
  cam.phi += dx; cam.theta = clamp(cam.theta+dy, 0.1, Math.PI-0.1);
  mouse.lastX=e.clientX; mouse.lastY=e.clientY; draw();
});
canvas.addEventListener('wheel', ()=>{
  // keep simple: zoom handled in CSS layout; leaving wheel zoom disabled to avoid page scroll traps
});

pulseBtn.addEventListener('click', ()=>{
  const startNode = focusIndex>=0 ? focusIndex : Math.floor(Math.random()*nodes.length);
  for(let i=0;i<nodes.length;i++){
    const dx=nodes[i].x-nodes[startNode].x;
    const dy=nodes[i].y-nodes[startNode].y;
    const dz=nodes[i].z-nodes[startNode].z;
    const d = Math.max(0.001, Math.hypot(dx,dy,dz));
    const f = 0.4/d; // inverse falloff
    nodes[i].vx += dx/d * f; nodes[i].vy += dy/d * f; nodes[i].vz += dz/d * f;
  }
  uploadData(); draw();
});

toggleMotion.addEventListener('click', ()=>{
  motionEnabled = !motionEnabled; motionStateEl.textContent = motionEnabled? 'On':'Off';
  if(motionEnabled) start(); else stop();
});

toggleQuality.addEventListener('click', ()=>{
  highQuality = !highQuality; qualityStateEl.textContent = highQuality? 'High':'Low';
  generateGraph(highQuality? 140:90); uploadData(); draw();
});

// Boot
initGL();
resize();
window.addEventListener('resize', ()=>{ resize(); draw(); });
buildPrograms();
initBuffers();
generateGraph(140);
uploadData();
start();
