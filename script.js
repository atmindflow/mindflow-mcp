/*
  WebGL "agent mesh" vibe using Three.js — morphing wireframe knot + particle halo.
  Includes Motion and Quality controls.
*/
(function(){
  const canvas = document.getElementById('stage');
  const scene = new THREE.Scene();
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setClearColor(0x000000, 0);

  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 200);
  camera.position.set(0, 0.6, 3.4);

  const resize = () => {
    const w = window.innerWidth, h = window.innerHeight;
    camera.aspect = w / h; camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
    const q = parseFloat(document.getElementById('qualityRange').value || '1');
    renderer.setPixelRatio(Math.min(window.devicePixelRatio * q, 2.5));
  };
  window.addEventListener('resize', resize);

  // Lights
  const light1 = new THREE.PointLight(0x7c9cff, 1.1, 8);
  light1.position.set(2, 2.5, 2.5);
  const light2 = new THREE.PointLight(0x3cead6, 1.0, 8);
  light2.position.set(-2.5, -1.5, -2.2);
  const amb = new THREE.AmbientLight(0x6677aa, 0.35);
  scene.add(light1, light2, amb);

  // Core agent mesh: torus knot wireframe + glow shell
  const geo = new THREE.TorusKnotGeometry(0.9, 0.28, 220, 28, 2, 5);
  const wire = new THREE.MeshPhongMaterial({ color: 0xbfd3ff, emissive: 0x0a1733, wireframe: true, transparent: true, opacity: 0.9 });
  const core = new THREE.Mesh(geo, wire);
  scene.add(core);

  // Glow shell
  const shellGeo = new THREE.IcosahedronGeometry(1.35, 3);
  const shellMat = new THREE.MeshBasicMaterial({ color: 0x7c9cff, transparent: true, opacity: 0.06, wireframe: true });
  const shell = new THREE.Mesh(shellGeo, shellMat);
  scene.add(shell);

  // Particles halo
  const pGeo = new THREE.BufferGeometry();
  const COUNT = 1600;
  const pos = new Float32Array(COUNT * 3);
  for (let i=0;i<COUNT;i++){
    const r = 1.8 + Math.random()*1.5;
    const theta = Math.random()*Math.PI*2;
    const phi = Math.acos(2*Math.random()-1);
    pos[i*3+0] = r * Math.sin(phi)*Math.cos(theta);
    pos[i*3+1] = r * Math.sin(phi)*Math.sin(theta);
    pos[i*3+2] = r * Math.cos(phi);
  }
  pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const pMat = new THREE.PointsMaterial({ color: 0x8e6cff, size: 0.01, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending });
  const points = new THREE.Points(pGeo, pMat);
  scene.add(points);

  // Subtle line ring
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(1.1, 1.1+0.001, 120),
    new THREE.MeshBasicMaterial({ color: 0x3cead6, transparent:true, opacity:0.5, side: THREE.DoubleSide })
  );
  ring.rotation.x = Math.PI/2;
  scene.add(ring);

  // Time uniform simulation
  const clock = new THREE.Clock();
  let motionEnabled = true;

  // Toggles
  const motionToggle = document.getElementById('motionToggle');
  motionEnabled = motionToggle.checked;
  motionToggle.addEventListener('change', ()=>{ motionEnabled = motionToggle.checked; });
  const qualityRange = document.getElementById('qualityRange');
  qualityRange.addEventListener('input', resize);

  // Animate morph by perturbing vertices on the fly
  const basePos = geo.attributes.position.array.slice();

  function animate(){
    const t = clock.getElapsedTime();
    const dt = Math.min(clock.getDelta(), 0.033);
    const speed = motionEnabled ? 1 : 0;

    core.rotation.x += 0.15 * dt * (1 + 0.3*Math.sin(t*0.7));
    core.rotation.y += 0.22 * dt;
    shell.rotation.y -= 0.06 * dt;
    points.rotation.y += 0.02 * dt;

    if (speed>0){
      const arr = geo.attributes.position.array;
      for(let i=0;i<arr.length;i+=3){
        const x0 = basePos[i], y0 = basePos[i+1], z0 = basePos[i+2];
        const n = Math.sin(0.7*t + x0*1.4) + Math.cos(0.6*t + y0*1.2) + Math.sin(0.5*t + z0*1.1);
        const f = 1.0 + 0.03*n;
        arr[i]   = x0 * f;
        arr[i+1] = y0 * f;
        arr[i+2] = z0 * f;
      }
      geo.attributes.position.needsUpdate = true;
      geo.computeVertexNormals();
    }

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  resize();
  animate();
})();
