// Minimal floating particles via three.js to add depth without heavy GPU load
const canvas = document.getElementById('stage');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
function resize(){
  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', resize);
resize();

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 8;

const group = new THREE.Group();
scene.add(group);

const geo = new THREE.SphereGeometry(0.04, 8, 8);
const mats = [0x7c3aed, 0x06b6d4, 0xffffff].map(c => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.55 }));
for (let i = 0; i < 220; i++){
  const m = new THREE.Mesh(geo, mats[i % mats.length]);
  m.position.set((Math.random()-0.5)*16, (Math.random()-0.5)*10, (Math.random()-0.5)*10);
  m.userData.vx = (Math.random()-0.5)*0.002;
  m.userData.vy = (Math.random()-0.5)*0.002;
  m.userData.vz = (Math.random()-0.5)*0.002;
  group.add(m);
}

const amb = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(amb);

let t = 0;
function animate(){
  requestAnimationFrame(animate);
  t += 0.003;
  group.rotation.y += 0.0008;
  group.children.forEach(s => {
    s.position.x += s.userData.vx;
    s.position.y += s.userData.vy;
    s.position.z += s.userData.vz;
    if (s.position.x > 9 || s.position.x < -9) s.userData.vx *= -1;
    if (s.position.y > 6 || s.position.y < -6) s.userData.vy *= -1;
    if (s.position.z > 6 || s.position.z < -6) s.userData.vz *= -1;
  });
  renderer.render(scene, camera);
}
animate();
