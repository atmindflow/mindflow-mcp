import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.160.0/examples/jsm/controls/OrbitControls.js';

const canvas = document.getElementById('webgl');
const fallback = document.getElementById('webglFallback');

const dots = document.querySelectorAll('.dot');
let sparkIdx = 0;
setInterval(() => {
  dots.forEach((d, idx) => {
    d.style.boxShadow = idx === sparkIdx
      ? '0 0 18px var(--accent), 0 0 36px rgba(45,212,191,.5)'
      : '0 0 12px var(--accent)';
  });
  sparkIdx = (sparkIdx + 1) % Math.max(1, dots.length);
}, 900);

function hasWebGL() {
  try {
    const test = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (test.getContext('webgl') || test.getContext('experimental-webgl')));
  } catch {
    return false;
  }
}

if (!hasWebGL()) {
  fallback.hidden = false;
} else {
  init3D();
}

function init3D() {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance'
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.01, 100);
  camera.position.set(0.0, 0.15, 3.1);
  scene.add(camera);

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.enablePan = false;
  controls.minDistance = 1.6;
  controls.maxDistance = 6.0;
  controls.target.set(0, 0.05, 0);

  canvas.addEventListener('dblclick', () => {
    camera.position.set(0.0, 0.15, 3.1);
    controls.target.set(0, 0.05, 0);
    controls.update();
  });

  const key = new THREE.DirectionalLight(0x60a5fa, 1.25);
  key.position.set(2.5, 2.0, 2.0);
  scene.add(key);

  const fill = new THREE.DirectionalLight(0x2dd4bf, 0.85);
  fill.position.set(-2.0, 1.2, 1.8);
  scene.add(fill);

  const ambient = new THREE.AmbientLight(0x9fb0c2, 0.22);
  scene.add(ambient);

  const rim = new THREE.PointLight(0x2dd4bf, 1.1, 12);
  rim.position.set(0.0, -0.6, -2.0);
  scene.add(rim);

  scene.fog = new THREE.FogExp2(0x0b0e12, 0.22);

  const knotGeo = new THREE.TorusKnotGeometry(0.55, 0.18, 280, 18, 2, 5);
  const knotMat = new THREE.MeshPhysicalMaterial({
    color: 0x0ea5a8,
    roughness: 0.26,
    metalness: 0.55,
    clearcoat: 0.75,
    clearcoatRoughness: 0.18,
    emissive: new THREE.Color(0x0b2233),
    emissiveIntensity: 0.9,
  });
  const knot = new THREE.Mesh(knotGeo, knotMat);
  knot.position.set(0, 0.05, 0);
  scene.add(knot);

  const ringGeo = new THREE.TorusGeometry(1.05, 0.02, 18, 220);
  const ringMat = new THREE.MeshStandardMaterial({
    color: 0x60a5fa,
    emissive: 0x1b3a4e,
    emissiveIntensity: 1.2,
    roughness: 0.4,
    metalness: 0.2
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = Math.PI * 0.5;
  ring.rotation.y = Math.PI * 0.15;
  ring.position.y = 0.02;
  scene.add(ring);

  const particleCount = 900;
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);
  const colorA = new THREE.Color(0x2dd4bf);
  const colorB = new THREE.Color(0x60a5fa);

  for (let i = 0; i < particleCount; i++) {
    const i3 = i * 3;
    const r = 1.9 + Math.random() * 1.8;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);

    positions[i3 + 0] = r * Math.sin(phi) * Math.cos(theta);
    positions[i3 + 1] = r * Math.cos(phi) * 0.55;
    positions[i3 + 2] = r * Math.sin(phi) * Math.sin(theta);

    const t = Math.random();
    const c = colorA.clone().lerp(colorB, t);
    colors[i3 + 0] = c.r;
    colors[i3 + 1] = c.g;
    colors[i3 + 2] = c.b;
  }

  const particlesGeo = new THREE.BufferGeometry();
  particlesGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  particlesGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const particlesMat = new THREE.PointsMaterial({
    size: 0.02,
    vertexColors: true,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  const particles = new THREE.Points(particlesGeo, particlesMat);
  scene.add(particles);

  const backdropGeo = new THREE.PlaneGeometry(12, 8);
  const backdropMat = new THREE.MeshBasicMaterial({
    color: 0x070a0f,
    transparent: true,
    opacity: 0.35
  });
  const backdrop = new THREE.Mesh(backdropGeo, backdropMat);
  backdrop.position.z = -6;
  scene.add(backdrop);

  const resize = () => {
    const { width, height } = canvas.getBoundingClientRect();
    if (width === 0 || height === 0) return;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setSize(width, height, false);
  };
  window.addEventListener('resize', resize, { passive: true });
  resize();

  const clock = new THREE.Clock();
  const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const speed = reduced ? 0.18 : 0.55;

  function tick() {
    const t = clock.getElapsedTime();

    knot.rotation.x = t * 0.22 * speed;
    knot.rotation.y = t * 0.35 * speed;

    ring.rotation.z = t * 0.25 * speed;

    particles.rotation.y = t * 0.08 * speed;
    particles.rotation.x = Math.sin(t * 0.25) * 0.06;

    rim.intensity = 0.9 + Math.sin(t * 1.6) * 0.15;

    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }

  tick();
}
