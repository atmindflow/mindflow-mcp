import * as THREE from 'https://unpkg.com/three@0.161.0/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.161.0/examples/jsm/controls/OrbitControls.js';

const $ = (sel, root=document) => root.querySelector(sel);

const canvas = $('#gl');
const hudHint = $('#hudHint');
const btnPulse = $('#pulse');
const btnMotion = $('#toggleMotion');
const btnQuality = $('#toggleQuality');

// ---------- Utilities ----------
function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }
function now(){ return performance.now(); }

async function copyBullets(listId){
  const el = document.getElementById(listId);
  if(!el) return;
  const text = [...el.querySelectorAll('li')].map(li => `• ${li.innerText.replace(/\s+/g,' ').trim()}`).join('\n');
  try{
    await navigator.clipboard.writeText(text);
  }catch{
    // Fallback
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
  }
}

for (const btn of document.querySelectorAll('[data-copy]')){
  btn.addEventListener('click', async () => {
    const id = btn.getAttribute('data-copy');
    const old = btn.textContent;
    await copyBullets(id);
    btn.textContent = 'Copied';
    setTimeout(() => (btn.textContent = old), 900);
  });
}

// ---------- WebGL Scene ----------
const state = {
  motion: true,
  quality: 'high',
  pinned: null,
  pulseT: 0,
  pulseAmp: 0,
  dpr: Math.min(devicePixelRatio || 1, 2),
};

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(state.dpr);
renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
renderer.setClearColor(0x000000, 0);

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 200);
camera.position.set(0.8, 0.55, 2.6);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.minDistance = 1.25;
controls.maxDistance = 5.0;
controls.maxPolarAngle = Math.PI * 0.52;
controls.target.set(0, 0, 0);

// Lights
const key = new THREE.DirectionalLight(0xbfe9ff, 1.1);
key.position.set(3, 4, 2);
scene.add(key);

const fill = new THREE.DirectionalLight(0xc7ffd8, 0.65);
fill.position.set(-3, 1.5, 3);
scene.add(fill);

const rim = new THREE.PointLight(0x6ac1ff, 1.0, 10, 2);
rim.position.set(0, 1.8, -2.2);
scene.add(rim);

scene.add(new THREE.AmbientLight(0x223044, 0.85));

// Subtle fog for depth
scene.fog = new THREE.FogExp2(0x0b0f14, 0.22);

// Backplate glow (fake volumetric)
const glowGeo = new THREE.PlaneGeometry(8, 6, 1, 1);
const glowMat = new THREE.ShaderMaterial({
  transparent: true,
  depthWrite: false,
  uniforms: {
    uA: { value: new THREE.Color('#6ac1ff') },
    uB: { value: new THREE.Color('#9bffb9') },
    uTime: { value: 0 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main(){
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    varying vec2 vUv;
    uniform vec3 uA;
    uniform vec3 uB;
    uniform float uTime;

    float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }

    void main(){
      vec2 p = vUv * 2.0 - 1.0;
      float r = length(p);
      float v = smoothstep(1.2, 0.1, r);

      float sweep = 0.15 * sin(uTime * 0.7 + p.x * 3.0) * sin(uTime * 0.45 + p.y * 2.0);
      float grain = (hash(vUv * 120.0 + uTime * 0.01) - 0.5) * 0.05;

      vec3 col = mix(uA, uB, smoothstep(-0.7, 0.7, p.x + 0.15*sin(uTime*0.25)));
      float a = (v + sweep) * 0.35 + grain;
      a *= smoothstep(1.15, 0.0, r);

      gl_FragColor = vec4(col, clamp(a, 0.0, 0.38));
    }
  `
});
const glow = new THREE.Mesh(glowGeo, glowMat);
glow.position.set(0, 0.05, -1.4);
scene.add(glow);

// Agent Mesh group
const group = new THREE.Group();
scene.add(group);

// Central "core" (represents orchestrator)
const coreGeo = new THREE.IcosahedronGeometry(0.32, 3);
const coreMat = new THREE.MeshPhysicalMaterial({
  color: new THREE.Color('#0f1620'),
  emissive: new THREE.Color('#0b2a3a'),
  emissiveIntensity: 1.0,
  metalness: 0.55,
  roughness: 0.18,
  clearcoat: 1.0,
  clearcoatRoughness: 0.18,
});
const core = new THREE.Mesh(coreGeo, coreMat);
core.castShadow = false;
core.position.set(0, 0, 0);
group.add(core);

// Orbits: nodes connected by arcs
const nodeCount = 18;
const nodes = [];

const nodeGeo = new THREE.SphereGeometry(0.06, 24, 18);

function nodeMaterial(hex){
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color(hex),
    emissive: new THREE.Color(hex),
    emissiveIntensity: 0.55,
    metalness: 0.2,
    roughness: 0.25,
  });
}

const palette = ['#6ac1ff', '#9bffb9', '#ffd166', '#7bd88f'];

for (let i=0; i<nodeCount; i++){
  const t = i / nodeCount;
  const r = 0.65 + 0.22 * Math.sin(i * 1.7);
  const angle = t * Math.PI * 2;
  const y = (Math.sin(i * 2.1) * 0.18);

  const mat = nodeMaterial(palette[i % palette.length]);
  const mesh = new THREE.Mesh(nodeGeo, mat);
  mesh.position.set(Math.cos(angle) * r, y, Math.sin(angle) * r);
  mesh.userData = { index: i, base: mesh.position.clone(), phase: angle, r };
  group.add(mesh);
  nodes.push(mesh);
}

// Connections
const lineMat = new THREE.LineBasicMaterial({ color: 0x6ac1ff, transparent: true, opacity: 0.22 });
const lineGeom = new THREE.BufferGeometry();

const pairs = [];
for (let i=0; i<nodes.length; i++){
  // connect each node to the core and to a neighbor
  pairs.push([i, -1]);
  pairs.push([i, (i+1) % nodes.length]);
  if(i % 3 === 0) pairs.push([i, (i+5) % nodes.length]);
}

const positions = new Float32Array(pairs.length * 2 * 3);
lineGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
const lines = new THREE.LineSegments(lineGeom, lineMat);
group.add(lines);

// A "security ring" torus
const ring = new THREE.Mesh(
  new THREE.TorusGeometry(0.88, 0.015, 10, 280),
  new THREE.MeshStandardMaterial({ color: 0x9bffb9, emissive: 0x1a3a26, emissiveIntensity: 0.85, metalness: 0.3, roughness: 0.3 })
);
ring.rotation.x = Math.PI * 0.5;
ring.position.y = -0.02;
group.add(ring);

// Raycaster for clicks
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function setPinned(index){
  state.pinned = index;
  if(index == null){
    hudHint.textContent = 'Tip: click a glowing node to pin focus';
    return;
  }
  const label = ['Discord CV2', 'Sub‑agents', 'Plugin hooks', 'Hardening'][index % 4];
  hudHint.textContent = `Pinned: ${label} (node ${index+1}/${nodeCount}) — click empty space to unpin`;
}

function onPointerDown(ev){
  const rect = canvas.getBoundingClientRect();
  const x = ( (ev.clientX - rect.left) / rect.width ) * 2 - 1;
  const y = - ( (ev.clientY - rect.top) / rect.height ) * 2 + 1;
  mouse.set(x,y);

  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects(nodes, false);
  if(hits.length){
    setPinned(hits[0].object.userData.index);
    // small pulse on selection
    state.pulseAmp = Math.max(state.pulseAmp, 0.8);
    state.pulseT = 0;
  } else {
    setPinned(null);
  }
}
canvas.addEventListener('pointerdown', onPointerDown, { passive: true });

// Pulse button
btnPulse?.addEventListener('click', () => {
  state.pulseAmp = 1.25;
  state.pulseT = 0;
});

// Motion toggle
function setMotion(on){
  state.motion = !!on;
  const el = btnMotion?.querySelector('[data-state]');
  if(el) el.textContent = state.motion ? 'On' : 'Off';
  controls.enableDamping = state.motion;
  if(!state.motion){
    // settle immediately
    controls.update();
  }
}
btnMotion?.addEventListener('click', () => setMotion(!state.motion));

// Quality toggle
function setQuality(q){
  state.quality = q;
  const el = btnQuality?.querySelector('[data-quality]');
  if(el) el.textContent = (q === 'high') ? 'High' : 'Low';
  state.dpr = (q === 'high') ? Math.min(devicePixelRatio || 1, 2) : 1;
  renderer.setPixelRatio(state.dpr);
  resize();
}
btnQuality?.addEventListener('click', () => setQuality(state.quality === 'high' ? 'low' : 'high'));

// Respect reduced motion preference by default
const mediaReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)');
if(mediaReduced?.matches) setMotion(false);

function resize(){
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if(w === 0 || h === 0) return;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}

const ro = new ResizeObserver(resize);
ro.observe(canvas);
resize();

// Animate
let t0 = now();
function tick(){
  const t = now();
  const dt = (t - t0) / 1000;
  t0 = t;

  glowMat.uniforms.uTime.value = t * 0.001;

  // Pulse envelope
  state.pulseT += dt;
  const pulse = state.pulseAmp * Math.exp(-state.pulseT * 1.7) * (0.5 + 0.5*Math.sin(state.pulseT * 10.0));
  state.pulseAmp = Math.max(0, state.pulseAmp - dt * 0.45);

  // Core shimmer
  core.rotation.y += (state.motion ? dt * 0.55 : 0);
  core.rotation.x += (state.motion ? dt * 0.25 : 0);
  core.material.emissiveIntensity = 0.9 + 0.5 * pulse;

  // Ring “security sweep”
  ring.rotation.z += (state.motion ? dt * (0.35 + 0.35*pulse) : 0);
  ring.material.emissiveIntensity = 0.75 + 0.55 * pulse;

  // Node motion + pin highlight
  for (const n of nodes){
    const { base, phase, r, index } = n.userData;
    const wob = state.motion ? (0.06 * Math.sin(t*0.0012 + phase*2.0) + 0.03 * Math.sin(t*0.0019 + phase*5.0)) : 0;
    const lift = state.motion ? (0.055 * Math.sin(t*0.0015 + phase*3.0)) : 0;

    const pin = (state.pinned === index) ? 1 : 0;
    const focus = (state.pinned == null) ? 0 : pin;

    n.position.set(
      base.x + wob * (0.9 + pulse),
      base.y + lift * (0.9 + pulse) + pin * 0.07,
      base.z + wob * (0.9 + pulse)
    );

    const targetEm = 0.45 + 0.55*pulse + focus * 0.85;
    n.material.emissiveIntensity = clamp(targetEm, 0.25, 1.65);
    n.scale.setScalar(1 + pin * 0.35 + pulse * 0.18);
  }

  // Update lines
  const pos = lineGeom.attributes.position.array;
  let o = 0;
  for (const [a,b] of pairs){
    const A = nodes[a].position;
    const B = (b === -1) ? core.position : nodes[b].position;
    pos[o++] = A.x; pos[o++] = A.y; pos[o++] = A.z;
    pos[o++] = B.x; pos[o++] = B.y; pos[o++] = B.z;
  }
  lineGeom.attributes.position.needsUpdate = true;
  lineMat.opacity = 0.16 + 0.25 * pulse + (state.pinned == null ? 0 : 0.10);

  // Subtle group float
  if(state.motion){
    group.rotation.y += dt * 0.15;
    group.position.y = 0.02 * Math.sin(t * 0.0008);
  }

  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

// Safety: if context lost, show hint
canvas.addEventListener('webglcontextlost', (e) => {
  e.preventDefault();
  hudHint.textContent = 'WebGL context lost. Reload to restore the 3D illustration.';
});

// Initial hint
setPinned(null);

// Keyboard convenience
window.addEventListener('keydown', (e) => {
  if(e.key.toLowerCase() === 'p') btnPulse?.click();
  if(e.key.toLowerCase() === 'm') btnMotion?.click();
  if(e.key.toLowerCase() === 'q') btnQuality?.click();
});
