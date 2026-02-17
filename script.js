// Three.js WebGL Scene
let scene, camera, renderer, particles, geometry, animatedMesh;
let mouseX = 0, mouseY = 0;
let windowHalfX = window.innerWidth / 2;
let windowHalfY = window.innerHeight / 2;

function init() {
    const container = document.getElementById('webgl-container');
    
    // Scene setup
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x667eea, 0.0008);
    
    // Camera
    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        1,
        3000
    );
    camera.position.z = 1000;
    
    // Particle system
    const particleCount = 2000;
    geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount * 3; i += 3) {
        positions[i] = (Math.random() - 0.5) * 2000;
        positions[i + 1] = (Math.random() - 0.5) * 2000;
        positions[i + 2] = (Math.random() - 0.5) * 2000;
        
        // Color variation (purples, blues, pinks)
        const colorChoice = Math.random();
        if (colorChoice < 0.33) {
            colors[i] = 0.4 + Math.random() * 0.2;     // R
            colors[i + 1] = 0.5 + Math.random() * 0.2; // G
            colors[i + 2] = 0.9 + Math.random() * 0.1; // B
        } else if (colorChoice < 0.66) {
            colors[i] = 0.46 + Math.random() * 0.2;    // R
            colors[i + 1] = 0.29 + Math.random() * 0.2; // G
            colors[i + 2] = 0.64 + Math.random() * 0.2; // B
        } else {
            colors[i] = 0.94 + Math.random() * 0.06;   // R
            colors[i + 1] = 0.58 + Math.random() * 0.2; // G
            colors[i + 2] = 0.98 + Math.random() * 0.02; // B
        }
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    const material = new THREE.PointsMaterial({
        size: 3,
        vertexColors: true,
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending
    });
    
    particles = new THREE.Points(geometry, material);
    scene.add(particles);
    
    // Animated geometric shape
    const torusGeometry = new THREE.TorusKnotGeometry(150, 30, 100, 16);
    const torusMaterial = new THREE.MeshBasicMaterial({
        color: 0x764ba2,
        wireframe: true,
        transparent: true,
        opacity: 0.15
    });
    animatedMesh = new THREE.Mesh(torusGeometry, torusMaterial);
    animatedMesh.position.set(0, 0, -200);
    scene.add(animatedMesh);
    
    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);
    
    // Event listeners
    document.addEventListener('mousemove', onDocumentMouseMove, false);
    window.addEventListener('resize', onWindowResize, false);
    
    animate();
}

function onDocumentMouseMove(event) {
    mouseX = (event.clientX - windowHalfX) * 0.5;
    mouseY = (event.clientY - windowHalfY) * 0.5;
}

function onWindowResize() {
    windowHalfX = window.innerWidth / 2;
    windowHalfY = window.innerHeight / 2;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    render();
}

function render() {
    const time = Date.now() * 0.00005;
    
    // Rotate particles
    particles.rotation.x = time * 0.5;
    particles.rotation.y = time * 0.75;
    
    // Animate geometric shape
    if (animatedMesh) {
        animatedMesh.rotation.x = time * 2;
        animatedMesh.rotation.y = time * 3;
        animatedMesh.position.y = Math.sin(time * 2) * 50;
    }
    
    // Camera movement based on mouse
    camera.position.x += (mouseX - camera.position.x) * 0.02;
    camera.position.y += (-mouseY - camera.position.y) * 0.02;
    camera.lookAt(scene.position);
    
    // Particle wave effect
    const positions = particles.geometry.attributes.position.array;
    for (let i = 0; i < positions.length; i += 3) {
        positions[i + 1] += Math.sin(time * 5 + positions[i] * 0.01) * 0.5;
    }
    particles.geometry.attributes.position.needsUpdate = true;
    
    renderer.render(scene, camera);
}

// Initialize on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}