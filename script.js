// Initialize Three.js scene
if (typeof THREE !== 'undefined') {
  const container = document.getElementById('webgl-container');
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(renderer.domElement);

  camera.position.z = 50;

  // Particle system
  const particlesGeometry = new THREE.BufferGeometry();
  const particlesCount = 800;
  const posArray = new Float32Array(particlesCount * 3);
  for (let i = 0; i < particlesCount * 3; i++) {
    posArray[i] = (Math.random() - 0.5) * 100;
  }
  particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

  const particlesMaterial = new THREE.PointsMaterial({
    size: 0.15,
    color: 0xffffff,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending
  });
  const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
  scene.add(particlesMesh);

  // Floating wireframe shapes
  const shapes = [];
  const geometries = [
    new THREE.OctahedronGeometry(0.8),
    new THREE.TetrahedronGeometry(0.8),
    new THREE.IcosahedronGeometry(0.8)
  ];

  for (let i = 0; i < 15; i++) {
    const geometry = geometries[Math.floor(Math.random() * geometries.length)];
    const material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      wireframe: true,
      transparent: true,
      opacity: 0.15
    });
    const mesh = new THREE.Mesh(geometry, material);

    mesh.position.x = (Math.random() - 0.5) * 80;
    mesh.position.y = (Math.random() - 0.5) * 80;
    mesh.position.z = (Math.random() - 0.5) * 80;

    mesh.rotation.x = Math.random() * Math.PI;
    mesh.rotation.y = Math.random() * Math.PI;

    mesh.userData = {
      speedX: (Math.random() - 0.5) * 0.002,
      speedY: (Math.random() - 0.5) * 0.002,
      rotationSpeed: (Math.random() - 0.5) * 0.01
    };

    shapes.push(mesh);
    scene.add(mesh);
  }

  // Mouse interaction
  let mouseX = 0;
  let mouseY = 0;
  document.addEventListener('mousemove', (event) => {
    mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
  });

  // Animate
  let time = 0;
  function animate() {
    requestAnimationFrame(animate);
    time += 0.001;

    particlesMesh.rotation.y = time * 0.3;
    particlesMesh.rotation.x = time * 0.2;

    shapes.forEach((shape) => {
      shape.position.x += shape.userData.speedX;
      shape.position.y += shape.userData.speedY;
      if (Math.abs(shape.position.x) > 40) shape.position.x *= -0.9;
      if (Math.abs(shape.position.y) > 40) shape.position.y *= -0.9;
      shape.rotation.x += shape.userData.rotationSpeed;
      shape.rotation.y += shape.userData.rotationSpeed;
    });

    camera.position.x += (mouseX * 5 - camera.position.x) * 0.05;
    camera.position.y += (mouseY * 5 - camera.position.y) * 0.05;
    camera.lookAt(scene.position);

    renderer.render(scene, camera);
  }

  animate();

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}
