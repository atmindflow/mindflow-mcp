/**
 * WebGL Background Animation
 * Lightweight WebGL1 implementation with procedural gradient shader
 */

(function () {
  'use strict';

  // Check for reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    return; // Exit early if user prefers reduced motion
  }

  const canvas = document.getElementById('webgl-canvas');
  if (!canvas) return;

  const gl = canvas.getContext('webgl', { alpha: true, antialias: false });
  if (!gl) {
    console.warn('WebGL not supported, background animation disabled');
    return;
  }

  // Vertex shader: pass-through for full-screen quad
  const vertexShaderSource = `
    attribute vec2 a_position;
    varying vec2 v_uv;
    void main() {
      v_uv = a_position * 0.5 + 0.5;
      gl_Position = vec4(a_position, 0.0, 1.0);
    }
  `;

  // Fragment shader: procedural animated gradient
  const fragmentShaderSource = `
    precision mediump float;
    uniform float u_time;
    uniform vec2 u_resolution;
    varying vec2 v_uv;

    void main() {
      vec2 uv = v_uv;
      vec2 aspect = vec2(u_resolution.x / u_resolution.y, 1.0);
      vec2 pos = (uv - 0.5) * aspect;

      // Multi-layered wave animation
      float wave1 = sin(pos.x * 3.0 + u_time * 0.5);
      float wave2 = cos(pos.y * 4.0 + u_time * 0.3);
      float wave3 = sin(length(pos) * 5.0 - u_time * 0.4);
      float combined = (wave1 + wave2 + wave3) / 3.0;

      // Color gradient with blue-to-purple theme
      vec3 color1 = vec3(0.231, 0.510, 0.965); // Blue (#3b82f6)
      vec3 color2 = vec3(0.545, 0.361, 0.965); // Purple (#8b5cf6)
      vec3 color3 = vec3(0.039, 0.055, 0.078); // Dark bg (#0a0e14)

      vec3 color = mix(color3, mix(color1, color2, uv.x), combined * 0.5 + 0.5);

      // Low alpha for subtle background effect
      gl_FragColor = vec4(color, 0.12);
    }
  `;

  // Compile shader helper
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

  // Create shader program
  const vertexShader = compileShader(vertexShaderSource, gl.VERTEX_SHADER);
  const fragmentShader = compileShader(fragmentShaderSource, gl.FRAGMENT_SHADER);

  if (!vertexShader || !fragmentShader) {
    console.error('Failed to compile shaders');
    return;
  }

  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Program link error:', gl.getProgramInfoLog(program));
    return;
  }

  gl.useProgram(program);

  // Create full-screen quad geometry (two triangles)
  const positions = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

  const positionLocation = gl.getAttribLocation(program, 'a_position');
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

  // Get uniform locations
  const timeLocation = gl.getUniformLocation(program, 'u_time');
  const resolutionLocation = gl.getUniformLocation(program, 'u_resolution');

  // Resize handler with device pixel ratio
  function resize() {
    const dpr = window.devicePixelRatio || 1;
    const width = window.innerWidth;
    const height = window.innerHeight;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
  }

  window.addEventListener('resize', resize);
  resize();

  // Animation loop
  const startTime = Date.now();
  let animationFrameId;

  function render() {
    if (!document.hidden) {
      const currentTime = (Date.now() - startTime) / 1000;
      gl.uniform1f(timeLocation, currentTime);

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    animationFrameId = requestAnimationFrame(render);
  }

  render();

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
  });
})();
