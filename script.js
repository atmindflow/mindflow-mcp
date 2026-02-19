/**
 * WebGL background (raw WebGL1)
 *
 * Design goals:
 * - Subtle GPU-accelerated motion (animated gradient)
 * - Zero external dependencies
 * - Clean, readable code with explicit pipeline steps
 * - Accessibility: disables animation for prefers-reduced-motion
 */

(() => {
  'use strict';

  const canvas = document.getElementById('webgl-canvas');
  if (!canvas) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /** @type {WebGLRenderingContext | null} */
  const gl = canvas.getContext('webgl', {
    alpha: true,
    antialias: true,
    premultipliedAlpha: false,
  });

  if (!gl) {
    // If WebGL isn't available, the page still works (background just won't animate).
    return;
  }

  // ------------------------------
  // Shader sources
  // ------------------------------

  const vertexSource = `
    attribute vec2 a_position;

    void main() {
      // Full-screen quad in clip space
      gl_Position = vec4(a_position, 0.0, 1.0);
    }
  `;

  const fragmentSource = `
    precision mediump float;

    uniform float u_time;
    uniform vec2 u_resolution;

    void main() {
      // Normalized pixel coordinate (0..1)
      vec2 uv = gl_FragCoord.xy / u_resolution;

      // Animated waves (low-frequency for subtle motion)
      float r = 0.50 + 0.50 * sin(uv.x * 3.0 + u_time * 0.55);
      float g = 0.50 + 0.50 * cos(uv.y * 2.0 + u_time * 0.75);
      float b = 0.50 + 0.50 * sin((uv.x + uv.y) * 2.5 + u_time * 0.35);

      // Soft radial falloff to keep the center brighter
      vec2 c = vec2(0.5, 0.5);
      float d = length(uv - c);
      float intensity = 1.0 - d * 0.28;

      vec3 color = vec3(r, g, b) * intensity;

      // Low alpha so content stays crisp above the canvas
      gl_FragColor = vec4(color * 0.72, 0.16);
    }
  `;

  // ------------------------------
  // Compile + link helpers
  // ------------------------------

  function compile(type, source) {
    const shader = gl.createShader(type);
    if (!shader) return null;

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      // Provide shader compiler errors to make debugging easy.
      // eslint-disable-next-line no-console
      console.error(gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }

    return shader;
  }

  function linkProgram(vs, fs) {
    const program = gl.createProgram();
    if (!program) return null;

    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      // eslint-disable-next-line no-console
      console.error(gl.getProgramInfoLog(program));
      gl.deleteProgram(program);
      return null;
    }

    return program;
  }

  const vs = compile(gl.VERTEX_SHADER, vertexSource);
  const fs = compile(gl.FRAGMENT_SHADER, fragmentSource);
  if (!vs || !fs) return;

  const program = linkProgram(vs, fs);
  if (!program) return;

  gl.useProgram(program);

  // ------------------------------
  // Geometry: a full-screen quad (2 triangles, 6 vertices)
  // ------------------------------

  const positions = new Float32Array([
    -1, -1,
    1, -1,
    -1, 1,
    -1, 1,
    1, -1,
    1, 1,
  ]);

  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

  const positionLoc = gl.getAttribLocation(program, 'a_position');
  gl.enableVertexAttribArray(positionLoc);
  gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

  // ------------------------------
  // Uniforms
  // ------------------------------

  const timeLoc = gl.getUniformLocation(program, 'u_time');
  const resLoc = gl.getUniformLocation(program, 'u_resolution');

  // Enable alpha blending so the canvas can be layered behind content.
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  // ------------------------------
  // Resize + DPR handling
  // ------------------------------

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    const w = Math.floor(canvas.clientWidth * dpr);
    const h = Math.floor(canvas.clientHeight * dpr);

    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
      gl.uniform2f(resLoc, w, h);
    }
  }

  // Initial sizing
  resize();

  // Debounced resizing to avoid excessive reflow during window drags
  let resizeTimer = 0;
  window.addEventListener('resize', () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(resize, 120);
  });

  // ------------------------------
  // Render loop (requestAnimationFrame)
  // ------------------------------

  let rafId = 0;
  const t0 = performance.now();

  function draw(now) {
    // Clear to transparent
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Update time uniform (seconds)
    gl.uniform1f(timeLoc, (now - t0) / 1000);

    // Draw the two triangles
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    rafId = window.requestAnimationFrame(draw);
  }

  function renderOneStaticFrame() {
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform1f(timeLoc, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  // Pause animation when tab is hidden. (Also saves battery.)
  document.addEventListener('visibilitychange', () => {
    if (prefersReducedMotion) return;

    if (document.hidden) {
      if (rafId) window.cancelAnimationFrame(rafId);
      rafId = 0;
    } else if (!rafId) {
      rafId = window.requestAnimationFrame(draw);
    }
  });

  if (prefersReducedMotion) {
    renderOneStaticFrame();
  } else {
    rafId = window.requestAnimationFrame(draw);
  }

  // Cleanup on unload
  window.addEventListener('beforeunload', () => {
    if (rafId) window.cancelAnimationFrame(rafId);
    gl.deleteBuffer(positionBuffer);
    gl.deleteProgram(program);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
  });
})();
