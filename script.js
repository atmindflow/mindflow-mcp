// WebGL 3D Cube Animation
const canvas = document.getElementById('webgl-canvas');
const gl = canvas.getContext('webgl');

if (!gl) {
    console.error('WebGL not supported');
}

// Resize canvas
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Vertex shader
const vertexShaderSource = `
    attribute vec3 aPosition;
    attribute vec3 aColor;
    varying vec3 vColor;
    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;
    
    void main() {
        gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aPosition, 1.0);
        vColor = aColor;
    }
`;

// Fragment shader
const fragmentShaderSource = `
    precision mediump float;
    varying vec3 vColor;
    
    void main() {
        gl_FragColor = vec4(vColor, 0.8);
    }
`;

// Compile shader
function compileShader(source, type) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compile error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    
    return shader;
}

// Create program
const vertexShader = compileShader(vertexShaderSource, gl.VERTEX_SHADER);
const fragmentShader = compileShader(fragmentShaderSource, gl.FRAGMENT_SHADER);

const program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);

if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Program link error:', gl.getProgramInfoLog(program));
}

gl.useProgram(program);

// Cube vertices with colors
const vertices = new Float32Array([
    // Front face (purple)
    -0.5, -0.5,  0.5,  0.39, 0.40, 0.95,
     0.5, -0.5,  0.5,  0.39, 0.40, 0.95,
     0.5,  0.5,  0.5,  0.39, 0.40, 0.95,
    -0.5,  0.5,  0.5,  0.39, 0.40, 0.95,
    
    // Back face (violet)
    -0.5, -0.5, -0.5,  0.55, 0.36, 0.96,
     0.5, -0.5, -0.5,  0.55, 0.36, 0.96,
     0.5,  0.5, -0.5,  0.55, 0.36, 0.96,
    -0.5,  0.5, -0.5,  0.55, 0.36, 0.96,
    
    // Top face (pink)
    -0.5,  0.5, -0.5,  0.93, 0.28, 0.60,
     0.5,  0.5, -0.5,  0.93, 0.28, 0.60,
     0.5,  0.5,  0.5,  0.93, 0.28, 0.60,
    -0.5,  0.5,  0.5,  0.93, 0.28, 0.60,
    
    // Bottom face (darker purple)
    -0.5, -0.5, -0.5,  0.30, 0.30, 0.70,
     0.5, -0.5, -0.5,  0.30, 0.30, 0.70,
     0.5, -0.5,  0.5,  0.30, 0.30, 0.70,
    -0.5, -0.5,  0.5,  0.30, 0.30, 0.70,
    
    // Right face (light purple)
     0.5, -0.5, -0.5,  0.65, 0.50, 0.98,
     0.5,  0.5, -0.5,  0.65, 0.50, 0.98,
     0.5,  0.5,  0.5,  0.65, 0.50, 0.98,
     0.5, -0.5,  0.5,  0.65, 0.50, 0.98,
    
    // Left face (medium purple)
    -0.5, -0.5, -0.5,  0.50, 0.40, 0.85,
    -0.5,  0.5, -0.5,  0.50, 0.40, 0.85,
    -0.5,  0.5,  0.5,  0.50, 0.40, 0.85,
    -0.5, -0.5,  0.5,  0.50, 0.40, 0.85
]);

const indices = new Uint16Array([
    0, 1, 2,  0, 2, 3,    // Front
    4, 5, 6,  4, 6, 7,    // Back
    8, 9, 10, 8, 10, 11,  // Top
    12, 13, 14, 12, 14, 15, // Bottom
    16, 17, 18, 16, 18, 19, // Right
    20, 21, 22, 20, 22, 23  // Left
]);

const vertexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

const indexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

const aPosition = gl.getAttribLocation(program, 'aPosition');
const aColor = gl.getAttribLocation(program, 'aColor');

gl.enableVertexAttribArray(aPosition);
gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 24, 0);

gl.enableVertexAttribArray(aColor);
gl.vertexAttribPointer(aColor, 3, gl.FLOAT, false, 24, 12);

const uModelViewMatrix = gl.getUniformLocation(program, 'uModelViewMatrix');
const uProjectionMatrix = gl.getUniformLocation(program, 'uProjectionMatrix');

// Matrix operations
function createPerspective(fov, aspect, near, far) {
    const f = 1.0 / Math.tan(fov / 2);
    const nf = 1 / (near - far);
    return new Float32Array([
        f / aspect, 0, 0, 0,
        0, f, 0, 0,
        0, 0, (far + near) * nf, -1,
        0, 0, 2 * far * near * nf, 0
    ]);
}

function createRotation(angleX, angleY, angleZ) {
    const cx = Math.cos(angleX), sx = Math.sin(angleX);
    const cy = Math.cos(angleY), sy = Math.sin(angleY);
    const cz = Math.cos(angleZ), sz = Math.sin(angleZ);
    
    return new Float32Array([
        cy * cz, -cy * sz, sy, 0,
        cx * sz + sx * sy * cz, cx * cz - sx * sy * sz, -sx * cy, 0,
        sx * sz - cx * sy * cz, sx * cz + cx * sy * sz, cx * cy, 0,
        0, 0, -3, 1
    ]);
}

let rotation = 0;

// Animation loop
function render() {
    rotation += 0.01;
    
    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    
    const projectionMatrix = createPerspective(
        Math.PI / 4,
        canvas.width / canvas.height,
        0.1,
        100
    );
    
    const modelViewMatrix = createRotation(rotation * 0.7, rotation, rotation * 0.5);
    
    gl.uniformMatrix4fv(uProjectionMatrix, false, projectionMatrix);
    gl.uniformMatrix4fv(uModelViewMatrix, false, modelViewMatrix);
    
    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
    
    requestAnimationFrame(render);
}

render();

// Scroll animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

document.querySelectorAll('.feature-card, .download-card').forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(30px)';
    card.style.transition = 'all 0.6s ease';
    observer.observe(card);
});

// Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});