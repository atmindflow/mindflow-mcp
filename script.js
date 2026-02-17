// WebGL Particle Background
class ParticleBackground {
    constructor() {
        this.canvas = document.getElementById('webgl-canvas');
        this.gl = this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl');
        
        if (!this.gl) {
            console.error('WebGL not supported');
            return;
        }
        
        this.particles = [];
        this.particleCount = 100;
        this.connections = [];
        this.mouse = { x: 0, y: 0 };
        
        this.init();
        this.setupEventListeners();
        this.animate();
    }
    
    init() {
        this.resize();
        this.createParticles();
        this.setupWebGL();
    }
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }
    
    createParticles() {
        this.particles = [];
        for (let i = 0; i < this.particleCount; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                radius: Math.random() * 2 + 1
            });
        }
    }
    
    setupWebGL() {
        // Vertex shader
        const vsSource = `
            attribute vec2 aPosition;
            attribute float aSize;
            void main() {
                gl_Position = vec4(aPosition, 0.0, 1.0);
                gl_PointSize = aSize;
            }
        `;
        
        // Fragment shader
        const fsSource = `
            precision mediump float;
            uniform vec4 uColor;
            void main() {
                float dist = length(gl_PointCoord - vec2(0.5, 0.5));
                if (dist > 0.5) discard;
                gl_FragColor = uColor * (1.0 - dist * 2.0);
            }
        `;
        
        this.program = this.createProgram(vsSource, fsSource);
        this.gl.useProgram(this.program);
        
        this.positionLocation = this.gl.getAttribLocation(this.program, 'aPosition');
        this.sizeLocation = this.gl.getAttribLocation(this.program, 'aSize');
        this.colorLocation = this.gl.getUniformLocation(this.program, 'uColor');
    }
    
    createShader(type, source) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);
        return shader;
    }
    
    createProgram(vsSource, fsSource) {
        const vertexShader = this.createShader(this.gl.VERTEX_SHADER, vsSource);
        const fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, fsSource);
        
        const program = this.gl.createProgram();
        this.gl.attachShader(program, vertexShader);
        this.gl.attachShader(program, fragmentShader);
        this.gl.linkProgram(program);
        
        return program;
    }
    
    updateParticles() {
        this.particles.forEach(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            
            // Wrap around screen
            if (particle.x < 0) particle.x = this.canvas.width;
            if (particle.x > this.canvas.width) particle.x = 0;
            if (particle.y < 0) particle.y = this.canvas.height;
            if (particle.y > this.canvas.height) particle.y = 0;
            
            // Mouse interaction
            const dx = this.mouse.x - particle.x;
            const dy = this.mouse.y - particle.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < 150) {
                const force = (150 - dist) / 150;
                particle.vx -= (dx / dist) * force * 0.1;
                particle.vy -= (dy / dist) * force * 0.1;
            }
            
            // Damping
            particle.vx *= 0.99;
            particle.vy *= 0.99;
        });
    }
    
    findConnections() {
        this.connections = [];
        const maxDistance = 150;
        
        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                const dx = this.particles[i].x - this.particles[j].x;
                const dy = this.particles[i].y - this.particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < maxDistance) {
                    this.connections.push({
                        from: this.particles[i],
                        to: this.particles[j],
                        alpha: 1 - (distance / maxDistance)
                    });
                }
            }
        }
    }
    
    draw() {
        // Clear canvas
        this.gl.clearColor(0.04, 0.04, 0.04, 1.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        
        // Enable blending
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
        
        // Draw connections as lines
        this.drawConnections();
        
        // Draw particles
        this.drawParticles();
    }
    
    drawParticles() {
        const positions = [];
        const sizes = [];
        
        this.particles.forEach(particle => {
            // Convert to WebGL coordinates (-1 to 1)
            const x = (particle.x / this.canvas.width) * 2 - 1;
            const y = -((particle.y / this.canvas.height) * 2 - 1);
            positions.push(x, y);
            sizes.push(particle.radius * 3);
        });
        
        // Create and bind position buffer
        const posBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, posBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(positions), this.gl.STATIC_DRAW);
        this.gl.enableVertexAttribArray(this.positionLocation);
        this.gl.vertexAttribPointer(this.positionLocation, 2, this.gl.FLOAT, false, 0, 0);
        
        // Create and bind size buffer
        const sizeBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, sizeBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(sizes), this.gl.STATIC_DRAW);
        this.gl.enableVertexAttribArray(this.sizeLocation);
        this.gl.vertexAttribPointer(this.sizeLocation, 1, this.gl.FLOAT, false, 0, 0);
        
        // Set color (purple)
        this.gl.uniform4f(this.colorLocation, 0.4, 0.49, 0.92, 0.8);
        
        // Draw
        this.gl.drawArrays(this.gl.POINTS, 0, this.particles.length);
    }
    
    drawConnections() {
        // Use simple line drawing with canvas 2D context overlay
        // (WebGL line drawing would require more complex shader setup)
        const ctx = document.createElement('canvas').getContext('2d');
        const tempCanvas = ctx.canvas;
        tempCanvas.width = this.canvas.width;
        tempCanvas.height = this.canvas.height;
        
        this.connections.forEach(conn => {
            ctx.strokeStyle = `rgba(102, 126, 234, ${conn.alpha * 0.3})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(conn.from.x, conn.from.y);
            ctx.lineTo(conn.to.x, conn.to.y);
            ctx.stroke();
        });
        
        // Draw 2D canvas onto WebGL canvas
        const texture = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, tempCanvas);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
    }
    
    setupEventListeners() {
        window.addEventListener('resize', () => this.resize());
        window.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });
    }
    
    animate() {
        this.updateParticles();
        this.findConnections();
        this.draw();
        requestAnimationFrame(() => this.animate());
    }
}

// Fallback Canvas 2D implementation if WebGL fails
class Canvas2DParticleBackground {
    constructor() {
        this.canvas = document.getElementById('webgl-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.particles = [];
        this.particleCount = 100;
        this.mouse = { x: 0, y: 0 };
        
        this.init();
        this.setupEventListeners();
        this.animate();
    }
    
    init() {
        this.resize();
        this.createParticles();
    }
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    createParticles() {
        this.particles = [];
        for (let i = 0; i < this.particleCount; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                radius: Math.random() * 2 + 1
            });
        }
    }
    
    updateParticles() {
        this.particles.forEach(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            
            if (particle.x < 0) particle.x = this.canvas.width;
            if (particle.x > this.canvas.width) particle.x = 0;
            if (particle.y < 0) particle.y = this.canvas.height;
            if (particle.y > this.canvas.height) particle.y = 0;
            
            const dx = this.mouse.x - particle.x;
            const dy = this.mouse.y - particle.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < 150) {
                const force = (150 - dist) / 150;
                particle.vx -= (dx / dist) * force * 0.1;
                particle.vy -= (dy / dist) * force * 0.1;
            }
            
            particle.vx *= 0.99;
            particle.vy *= 0.99;
        });
    }
    
    draw() {
        this.ctx.fillStyle = 'rgba(10, 10, 10, 0.1)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw connections
        this.particles.forEach((p1, i) => {
            this.particles.slice(i + 1).forEach(p2 => {
                const dx = p1.x - p2.x;
                const dy = p1.y - p2.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 150) {
                    this.ctx.strokeStyle = `rgba(102, 126, 234, ${(1 - distance / 150) * 0.3})`;
                    this.ctx.lineWidth = 1;
                    this.ctx.beginPath();
                    this.ctx.moveTo(p1.x, p1.y);
                    this.ctx.lineTo(p2.x, p2.y);
                    this.ctx.stroke();
                }
            });
        });
        
        // Draw particles
        this.particles.forEach(particle => {
            this.ctx.fillStyle = 'rgba(102, 126, 234, 0.8)';
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }
    
    setupEventListeners() {
        window.addEventListener('resize', () => this.resize());
        window.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });
    }
    
    animate() {
        this.updateParticles();
        this.draw();
        requestAnimationFrame(() => this.animate());
    }
}

// Initialize background
document.addEventListener('DOMContentLoaded', () => {
    try {
        new ParticleBackground();
    } catch (e) {
        console.log('WebGL failed, using Canvas 2D fallback');
        new Canvas2DParticleBackground();
    }
    
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
});