// Three.js WebGL Background - Nested Node Network
let scene, camera, renderer, nodes = [], connections = [];
let mouseX = 0, mouseY = 0;

function init() {
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0f0c29, 0.0008);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 50;

    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.getElementById('webgl-container').appendChild(renderer.domElement);

    // Create hierarchical node network representing nested components
    createNodeNetwork();
    createConnections();

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);

    // Add point lights
    const light1 = new THREE.PointLight(0x667eea, 1, 100);
    light1.position.set(20, 20, 20);
    scene.add(light1);

    const light2 = new THREE.PointLight(0x764ba2, 1, 100);
    light2.position.set(-20, -20, 20);
    scene.add(light2);

    // Mouse move interaction
    document.addEventListener('mousemove', onMouseMove, false);
    window.addEventListener('resize', onWindowResize, false);

    animate();
}

function createNodeNetwork() {
    const nodeGeometry = new THREE.SphereGeometry(0.3, 16, 16);
    const materials = [
        new THREE.MeshPhongMaterial({ color: 0x667eea, emissive: 0x667eea, emissiveIntensity: 0.5 }),
        new THREE.MeshPhongMaterial({ color: 0x764ba2, emissive: 0x764ba2, emissiveIntensity: 0.5 }),
        new THREE.MeshPhongMaterial({ color: 0xf093fb, emissive: 0xf093fb, emissiveIntensity: 0.5 })
    ];

    // Create hierarchical structure - parent nodes with children
    for (let i = 0; i < 8; i++) {
        const parentNode = new THREE.Mesh(nodeGeometry, materials[0]);
        const angle = (i / 8) * Math.PI * 2;
        const radius = 25;
        parentNode.position.set(
            Math.cos(angle) * radius,
            Math.sin(angle * 0.5) * 10,
            Math.sin(angle) * radius
        );
        parentNode.userData = { 
            baseX: parentNode.position.x,
            baseY: parentNode.position.y,
            baseZ: parentNode.position.z,
            speed: Math.random() * 0.02 + 0.01,
            children: []
        };
        scene.add(parentNode);
        nodes.push(parentNode);

        // Add child nodes (nested components)
        for (let j = 0; j < 3; j++) {
            const childNode = new THREE.Mesh(nodeGeometry.clone(), materials[1]);
            const childAngle = (j / 3) * Math.PI * 2;
            const childRadius = 5;
            childNode.position.set(
                parentNode.position.x + Math.cos(childAngle) * childRadius,
                parentNode.position.y + Math.sin(childAngle) * childRadius,
                parentNode.position.z
            );
            childNode.userData = {
                parent: parentNode,
                baseX: childNode.position.x,
                baseY: childNode.position.y,
                baseZ: childNode.position.z,
                speed: Math.random() * 0.03 + 0.02,
                offset: j
            };
            scene.add(childNode);
            nodes.push(childNode);
            parentNode.userData.children.push(childNode);

            // Add grandchild nodes (deeply nested)
            if (j === 0) {
                const grandchildNode = new THREE.Mesh(nodeGeometry.clone(), materials[2]);
                grandchildNode.position.set(
                    childNode.position.x + 3,
                    childNode.position.y,
                    childNode.position.z + 3
                );
                grandchildNode.userData = {
                    parent: childNode,
                    baseX: grandchildNode.position.x,
                    baseY: grandchildNode.position.y,
                    baseZ: grandchildNode.position.z,
                    speed: Math.random() * 0.04 + 0.03
                };
                scene.add(grandchildNode);
                nodes.push(grandchildNode);
            }
        }
    }
}

function createConnections() {
    const lineMaterial = new THREE.LineBasicMaterial({ 
        color: 0x667eea, 
        transparent: true, 
        opacity: 0.2 
    });

    nodes.forEach(node => {
        if (node.userData.children) {
            node.userData.children.forEach(child => {
                const points = [node.position, child.position];
                const geometry = new THREE.BufferGeometry().setFromPoints(points);
                const line = new THREE.Line(geometry, lineMaterial);
                scene.add(line);
                connections.push({ line, from: node, to: child });
            });
        }
        if (node.userData.parent) {
            const points = [node.userData.parent.position, node.position];
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const line = new THREE.Line(geometry, lineMaterial.clone());
            scene.add(line);
            connections.push({ line, from: node.userData.parent, to: node });
        }
    });
}

function onMouseMove(event) {
    mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);

    const time = Date.now() * 0.001;

    // Animate nodes
    nodes.forEach((node, i) => {
        node.position.x = node.userData.baseX + Math.sin(time * node.userData.speed + i) * 2;
        node.position.y = node.userData.baseY + Math.cos(time * node.userData.speed + i) * 2;
        node.rotation.x += 0.01;
        node.rotation.y += 0.01;
    });

    // Update connections
    connections.forEach(conn => {
        const points = [conn.from.position, conn.to.position];
        conn.line.geometry.setFromPoints(points);
    });

    // Camera movement based on mouse
    camera.position.x += (mouseX * 10 - camera.position.x) * 0.05;
    camera.position.y += (mouseY * 10 - camera.position.y) * 0.05;
    camera.lookAt(scene.position);

    renderer.render(scene, camera);
}

init();