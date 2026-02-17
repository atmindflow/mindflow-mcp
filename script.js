// Three.js WebGL Scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 0);
document.getElementById('webgl-container').appendChild(renderer.domElement);

// Create lobster-inspired 3D object
const lobsterGroup = new THREE.Group();

// Main body (ellipsoid)
const bodyGeometry = new THREE.SphereGeometry(1, 32, 32);
bodyGeometry.scale(1.5, 0.8, 1);
const bodyMaterial = new THREE.MeshPhongMaterial({
    color: 0xff6b6b,
    emissive: 0xff3333,
    emissiveIntensity: 0.3,
    shininess: 100,
    transparent: true,
    opacity: 0.9
});
const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
lobsterGroup.add(body);

// Tail segments
for (let i = 0; i < 5; i++) {
    const segmentGeometry = new THREE.SphereGeometry(0.6 - i * 0.08, 16, 16);
    segmentGeometry.scale(1, 0.7, 0.8);
    const segment = new THREE.Mesh(segmentGeometry, bodyMaterial);
    segment.position.x = -1.8 - i * 0.8;
    segment.rotation.z = Math.sin(i * 0.5) * 0.2;
    lobsterGroup.add(segment);
}

// Claws
const clawMaterial = new THREE.MeshPhongMaterial({
    color: 0xff4757,
    emissive: 0xff1744,
    emissiveIntensity: 0.4,
    shininess: 120
});

for (let side of [-1, 1]) {
    // Upper claw
    const clawGeometry = new THREE.BoxGeometry(1.2, 0.4, 0.4);
    const claw = new THREE.Mesh(clawGeometry, clawMaterial);
    claw.position.set(1.5, side * 0.8, 0.3);
    claw.rotation.z = side * 0.3;
    lobsterGroup.add(claw);
    
    // Pincer
    const pincerGeometry = new THREE.ConeGeometry(0.3, 0.8, 8);
    const pincer = new THREE.Mesh(pincerGeometry, clawMaterial);
    pincer.position.set(2.3, side * 0.8, 0.3);
    pincer.rotation.z = Math.PI / 2 + side * 0.2;
    lobsterGroup.add(pincer);
}

// Antennae
for (let side of [-1, 1]) {
    const antennaGeometry = new THREE.CylinderGeometry(0.05, 0.02, 2.5, 8);
    const antenna = new THREE.Mesh(antennaGeometry, clawMaterial);
    antenna.position.set(1.2, side * 0.4, 0.5);
    antenna.rotation.z = side * 0.6;
    antenna.rotation.y = 0.3;
    lobsterGroup.add(antenna);
}

// Eyes
const eyeMaterial = new THREE.MeshPhongMaterial({
    color: 0xffffff,
    emissive: 0x00ffff,
    emissiveIntensity: 0.8,
    shininess: 200
});

for (let side of [-1, 1]) {
    const eyeGeometry = new THREE.SphereGeometry(0.15, 16, 16);
    const eye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    eye.position.set(1, side * 0.35, 0.6);
    lobsterGroup.add(eye);
}

scene.add(lobsterGroup);

// Particle system
const particlesGeometry = new THREE.BufferGeometry();
const particlesCount = 1500;
const posArray = new Float32Array(particlesCount * 3);

for (let i = 0; i < particlesCount * 3; i++) {
    posArray[i] = (Math.random() - 0.5) * 50;
}

particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

const particlesMaterial = new THREE.PointsMaterial({
    size: 0.08,
    color: 0xffffff,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending
});

const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particlesMesh);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const pointLight1 = new THREE.PointLight(0x667eea, 2, 100);
pointLight1.position.set(10, 10, 10);
scene.add(pointLight1);

const pointLight2 = new THREE.PointLight(0x764ba2, 2, 100);
pointLight2.position.set(-10, -10, 10);
scene.add(pointLight2);

const spotLight = new THREE.SpotLight(0xff6b6b, 1.5);
spotLight.position.set(0, 20, 20);
spotLight.angle = Math.PI / 6;
scene.add(spotLight);

camera.position.z = 8;
camera.position.y = 2;

// Mouse interaction
let mouseX = 0;
let mouseY = 0;
let targetX = 0;
let targetY = 0;

document.addEventListener('mousemove', (event) => {
    mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
});

// Scroll animations
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, { threshold: 0.1 });

document.querySelectorAll('.feature-card, .channels-section, .installation').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
    observer.observe(el);
});

// Animation loop
let time = 0;
function animate() {
    requestAnimationFrame(animate);
    time += 0.01;
    
    // Smooth mouse following
    targetX = mouseX * 0.5;
    targetY = mouseY * 0.5;
    
    // Lobster rotation and animation
    lobsterGroup.rotation.y = time * 0.3 + targetX * 0.5;
    lobsterGroup.rotation.x = targetY * 0.3;
    lobsterGroup.position.y = Math.sin(time) * 0.3;
    
    // Animate claws
    lobsterGroup.children.forEach((child, index) => {
        if (index > 5 && index < 10) {
            child.rotation.x = Math.sin(time * 2 + index) * 0.2;
        }
    });
    
    // Rotate particles
    particlesMesh.rotation.y = time * 0.05;
    particlesMesh.rotation.x = time * 0.03;
    
    // Animate particle positions
    const positions = particlesMesh.geometry.attributes.position.array;
    for (let i = 0; i < positions.length; i += 3) {
        positions[i + 1] += Math.sin(time + i) * 0.01;
        if (positions[i + 1] > 25) positions[i + 1] = -25;
    }
    particlesMesh.geometry.attributes.position.needsUpdate = true;
    
    // Pulsing lights
    pointLight1.intensity = 2 + Math.sin(time * 2) * 0.5;
    pointLight2.intensity = 2 + Math.cos(time * 2) * 0.5;
    pointLight1.position.x = Math.cos(time) * 10;
    pointLight1.position.z = Math.sin(time) * 10;
    pointLight2.position.x = Math.sin(time) * 10;
    pointLight2.position.z = Math.cos(time) * 10;
    
    renderer.render(scene, camera);
}

animate();

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});