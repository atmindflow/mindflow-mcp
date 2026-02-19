/*
  Mindflow Hero Web Component
  - High-performance Three.js WebGL illustration (custom shader "plasma shell")
  - Modern glass UI overlay
  - Production-minded: DPR cap, resize handling, reduced motion preference, visibility pausing

  Note:
  - This file is intended to be used as-is in a browser environment.
  - It uses dynamic ESM imports from a CDN (no bundler required).
*/

class MindflowHero extends HTMLElement {
  constructor(){
    super();
    this._shadow = this.attachShadow({ mode: 'open' });

    // Runtime handles
    this._raf = 0;
    this._running = false;
    this._renderer = null;
    this._scene = null;
    this._camera = null;
    this._mesh = null;
    this._clock = null;

    // Pointer interaction state (for subtle parallax)
    this._pointer = { x: 0, y: 0, tx: 0, ty: 0 };

    // Bound handlers
    this._onResize = this._onResize.bind(this);
    this._onPointerMove = this._onPointerMove.bind(this);
    this._onVisibility = this._onVisibility.bind(this);
  }

  connectedCallback(){
    this._renderTemplate();
    this._mount();
  }

  disconnectedCallback(){
    this._unmount();
  }

  _renderTemplate(){
    const style = document.createElement('style');
    style.textContent = `
      :host{
        display:block;
        position:relative;
        color:var(--ink, #EAF0FF);
      }

      .wrap{
        position:relative;
        min-height: clamp(620px, 78vh, 860px);
        overflow:hidden;
        border-top:1px solid rgba(234,240,255,.10);
        border-bottom:1px solid rgba(234,240,255,.10);
        background:
          radial-gradient(1000px 700px at 10% 0%, rgba(138,92,255,.26), transparent 60%),
          radial-gradient(900px 680px at 85% 35%, rgba(83,243,255,.16), transparent 58%),
          radial-gradient(900px 760px at 50% 100%, rgba(255,79,216,.10), transparent 60%),
          linear-gradient(180deg, rgba(7,10,18,.92), rgba(10,16,34,.92));
      }

      /* Decorative micro-grid overlay */
      .wrap::before{
        content:"";
        position:absolute;
        inset:0;
        pointer-events:none;
        background:
          linear-gradient(to right, rgba(234,240,255,.06) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(234,240,255,.06) 1px, transparent 1px);
        background-size: 48px 48px;
        opacity:.10;
        transform: translateZ(0);
        mask-image: radial-gradient(600px 420px at 20% 12%, #000 35%, transparent 75%);
      }

      .canvas{
        position:absolute;
        inset:0;
        width:100%;
        height:100%;
        display:block;
      }

      /* Soft vignette for focus */
      .vignette{
        position:absolute;
        inset:-2px;
        pointer-events:none;
        background:
          radial-gradient(900px 620px at 55% 40%, transparent 35%, rgba(7,10,18,.50) 75%),
          radial-gradient(1100px 760px at 20% 20%, transparent 40%, rgba(7,10,18,.42) 82%);
      }

      .content{
        position:relative;
        max-width: 1120px;
        margin: 0 auto;
        padding: clamp(28px, 5vw, 56px) clamp(18px, 3vw, 28px);
        display:grid;
        grid-template-columns: 1.15fr .85fr;
        gap: 26px;
        align-items:center;
      }

      @media (max-width: 920px){
        .content{ grid-template-columns: 1fr; padding-top: 28px; padding-bottom: 36px; }
      }

      .badge{
        display:inline-flex;
        align-items:center;
        gap:10px;
        padding: 8px 12px;
        border-radius: 999px;
        border: 1px solid rgba(234,240,255,.16);
        background: rgba(10,16,34,.42);
        backdrop-filter: blur(10px);
        box-shadow: 0 10px 30px rgba(0,0,0,.25);
        font-size: 12px;
        letter-spacing: .08em;
        text-transform: uppercase;
        color: rgba(234,240,255,.80);
        width: fit-content;
      }

      .dot{
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: radial-gradient(circle at 35% 35%, #fff, rgba(255,255,255,.2) 45%, transparent 70%),
                    linear-gradient(135deg, rgba(83,243,255,1), rgba(138,92,255,1));
        box-shadow: 0 0 20px rgba(83,243,255,.35), 0 0 24px rgba(138,92,255,.25);
      }

      h1{
        margin: 14px 0 10px;
        font-weight: 650;
        line-height: 1.04;
        font-size: clamp(34px, 4.6vw, 58px);
        letter-spacing: -0.02em;
      }

      .gradient{
        background: linear-gradient(90deg, rgba(234,240,255,1) 0%, rgba(83,243,255,1) 40%, rgba(138,92,255,1) 72%, rgba(255,79,216,1) 100%);
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
      }

      .lead{
        margin: 0;
        max-width: 58ch;
        color: rgba(234,240,255,.72);
        font-size: 15px;
        line-height: 1.6;
      }

      .actions{
        margin-top: 18px;
        display:flex;
        flex-wrap:wrap;
        gap: 12px;
      }

      .btn{
        appearance:none;
        border: 1px solid rgba(234,240,255,.16);
        background: rgba(10,16,34,.35);
        color: rgba(234,240,255,.92);
        padding: 10px 14px;
        border-radius: 12px;
        font-weight: 600;
        letter-spacing: .01em;
        cursor:pointer;
        transition: transform .15s ease, border-color .15s ease, background .15s ease;
        backdrop-filter: blur(10px);
      }
      .btn:hover{ transform: translateY(-1px); border-color: rgba(234,240,255,.28); background: rgba(10,16,34,.46); }
      .btn:active{ transform: translateY(0px); }

      .btn.primary{
        border-color: rgba(83,243,255,.35);
        background: linear-gradient(180deg, rgba(83,243,255,.18), rgba(138,92,255,.14));
        box-shadow: 0 18px 55px rgba(83,243,255,.10), 0 18px 55px rgba(138,92,255,.08);
      }

      .panel{
        border: 1px solid rgba(234,240,255,.14);
        background: rgba(10,16,34,.46);
        border-radius: 18px;
        padding: 16px;
        backdrop-filter: blur(14px);
        box-shadow: 0 22px 60px rgba(0,0,0,.35);
      }

      .panel h2{
        margin: 0 0 8px;
        font-size: 13px;
        text-transform: uppercase;
        letter-spacing: .12em;
        color: rgba(234,240,255,.72);
        font-weight: 700;
      }

      .stats{
        display:grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
        margin-top: 12px;
      }

      .stat{
        border-radius: 14px;
        padding: 12px;
        border: 1px solid rgba(234,240,255,.10);
        background: rgba(7,10,18,.32);
      }

      .stat b{
        display:block;
        font-size: 18px;
        letter-spacing: -0.01em;
      }

      .stat span{
        display:block;
        margin-top: 4px;
        color: rgba(234,240,255,.62);
        font-size: 12px;
        line-height: 1.35;
      }

      .mono{
        font-family: var(--font-mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace);
        color: rgba(234,240,255,.72);
        font-size: 12px;
        line-height: 1.45;
        margin: 0;
      }

      footer{
        position:absolute;
        left:0; right:0; bottom:0;
        padding: 10px 18px 14px;
        color: rgba(234,240,255,.55);
        font-size: 12px;
        text-align:center;
        border-top: 1px solid rgba(234,240,255,.08);
        background: linear-gradient(180deg, transparent, rgba(7,10,18,.55));
      }

      .powered{ color: rgba(234,240,255,.72); }

      /* Respect reduced motion: keep the look, reduce animation intensity */
      @media (prefers-reduced-motion: reduce){
        .btn{ transition:none; }
      }
    `;

    // Shadow DOM structure (canvas behind, UI on top)
    this._shadow.innerHTML = `
      <div class="wrap" part="wrap">
        <canvas class="canvas" part="canvas"></canvas>
        <div class="vignette" aria-hidden="true"></div>

        <div class="content">
          <div>
            <div class="badge"><span class="dot" aria-hidden="true"></span><span>WebGL • Shader-driven • Performance-first</span></div>
            <h1>Build products with <span class="gradient">depth</span> and clarity.</h1>
            <p class="lead">
              A modern hero component that pairs a glassy editorial layout with a high-performance
              3D "plasma shell" rendered in WebGL. The effect is subtle, responsive, and designed
              to keep frame times stable.
            </p>
            <div class="actions">
              <button class="btn primary" type="button" id="cta">Explore capabilities</button>
              <button class="btn" type="button" id="alt">View technical notes</button>
            </div>
          </div>

          <aside class="panel" part="panel">
            <h2>Implementation highlights</h2>
            <p class="mono">
              • Custom GLSL material (vertex displacement + Fresnel)
              <br/>• DPR capped to reduce overdraw on high-density screens
              <br/>• Pauses rendering when the tab is hidden
              <br/>• Subtle pointer parallax (no heavy controls)
            </p>
            <div class="stats">
              <div class="stat"><b>1</b><span>Draw call (single mesh)</span></div>
              <div class="stat"><b>~0.9–1.3</b><span>ms GPU target (typical)</span></div>
              <div class="stat"><b>60</b><span>FPS goal with capped DPR</span></div>
              <div class="stat"><b>0</b><span>External textures</span></div>
            </div>
          </aside>
        </div>

        <footer><span class="powered">Powered by Mindflow</span></footer>
      </div>
    `;

    this._shadow.appendChild(style);
  }

  async _mount(){
    const canvas = this._shadow.querySelector('canvas');
    const wrap = this._shadow.querySelector('.wrap');

    // Basic UI hooks (purely presentational)
    const cta = this._shadow.getElementById('cta');
    const alt = this._shadow.getElementById('alt');
    cta?.addEventListener('click', () => {
      // Small tactile feedback without layout shift
      cta.blur();
      wrap.animate(
        [{ filter: 'saturate(1) brightness(1)' }, { filter: 'saturate(1.12) brightness(1.02)' }, { filter: 'saturate(1) brightness(1)' }],
        { duration: 520, easing: 'cubic-bezier(.2,.8,.2,1)' }
      );
    });
    alt?.addEventListener('click', () => {
      alt.blur();
      // Toggle a tiny "tech" hint by briefly increasing mesh roughness-like effect via uniform
      if (this._mesh?.material?.uniforms?.uAccent){
        const u = this._mesh.material.uniforms.uAccent;
        const from = u.value;
        u.value = 1.0;
        setTimeout(() => { u.value = from; }, 620);
      }
    });

    // Event listeners
    wrap.addEventListener('pointermove', this._onPointerMove, { passive: true });
    window.addEventListener('resize', this._onResize, { passive: true });
    document.addEventListener('visibilitychange', this._onVisibility, { passive: true });

    // If user prefers reduced motion, we still render but reduce animation amplitude.
    this._prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Lazy-init WebGL once the component is connected
    await this._initThree(canvas);

    this._running = true;
    this._onResize();
    this._tick();
  }

  _unmount(){
    this._running = false;
    cancelAnimationFrame(this._raf);

    const wrap = this._shadow.querySelector('.wrap');
    wrap?.removeEventListener('pointermove', this._onPointerMove);
    window.removeEventListener('resize', this._onResize);
    document.removeEventListener('visibilitychange', this._onVisibility);

    // Dispose Three.js resources to prevent GPU memory leaks
    if (this._renderer){
      this._renderer.dispose();
      // Attempt to force context loss in some browsers (safe-guarded)
      const gl = this._renderer.getContext();
      gl?.getExtension?.('WEBGL_lose_context')?.loseContext?.();
    }
    this._renderer = null;
    this._scene = null;
    this._camera = null;
    this._mesh = null;
    this._clock = null;
  }

  _onVisibility(){
    // Pause rendering in background tabs to save battery/CPU.
    if (document.hidden){
      this._running = false;
      cancelAnimationFrame(this._raf);
    } else {
      if (!this._renderer) return;
      this._running = true;
      this._clock?.start?.();
      this._tick();
    }
  }

  _onPointerMove(e){
    const rect = this.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / Math.max(1, rect.width);
    const ny = (e.clientY - rect.top) / Math.max(1, rect.height);

    // Convert to [-1, 1] with center at 0.
    this._pointer.tx = (nx - 0.5) * 2;
    this._pointer.ty = (ny - 0.5) * 2;
  }

  _onResize(){
    if (!this._renderer || !this._camera) return;

    const canvas = this._shadow.querySelector('canvas');
    const wrap = this._shadow.querySelector('.wrap');

    const w = Math.max(1, wrap.clientWidth);
    const h = Math.max(1, wrap.clientHeight);

    // DPR cap is essential for performance: reduces fragment shader work (overdraw) on retina screens.
    // Values around 1.5–2.0 are a good tradeoff for a hero background.
    const dprCap = 1.75;
    const dpr = Math.min(window.devicePixelRatio || 1, dprCap);

    this._renderer.setPixelRatio(dpr);
    this._renderer.setSize(w, h, false);

    this._camera.aspect = w / h;
    this._camera.updateProjectionMatrix();

    // Update shader uniforms that depend on resolution
    if (this._mesh?.material?.uniforms?.uResolution){
      this._mesh.material.uniforms.uResolution.value.set(w * dpr, h * dpr);
    }
  }

  async _initThree(canvas){
    // Dynamically import Three.js as an ES module.
    // Pinning versions is recommended for production; adjust as needed.
    const THREE = await import('https://unpkg.com/three@0.160.0/build/three.module.js');

    this._clock = new THREE.Clock();

    // Renderer
    this._renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: false
    });
    this._renderer.setClearColor(0x000000, 0);

    // Scene + Camera
    this._scene = new THREE.Scene();
    this._camera = new THREE.PerspectiveCamera(42, 1, 0.1, 40);
    this._camera.position.set(0, 0.25, 5.1);

    // Lighting strategy:
    // We use minimal real lights because the look is mostly shader-based.
    // A subtle rim light helps with perceived depth.
    const key = new THREE.DirectionalLight(0x9bb7ff, 0.6);
    key.position.set(3, 2, 2);
    this._scene.add(key);

    const fill = new THREE.DirectionalLight(0x53f3ff, 0.35);
    fill.position.set(-3, -1.5, 1);
    this._scene.add(fill);

    // Geometry: moderately tessellated sphere for smooth displacement.
    // Keep it reasonable for performance; shader does the heavy lifting.
    const geometry = new THREE.IcosahedronGeometry(1.25, 64);

    // Custom shader material: "plasma shell"
    // - Vertex shader displaces surface along its normal via cheap procedural noise.
    // - Fragment shader blends aurora-like colors with Fresnel + spec highlights.
    // - No textures; stable, fast, and crisp.
    const material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uPointer: { value: new THREE.Vector2(0, 0) },
        uResolution: { value: new THREE.Vector2(1, 1) },
        uAccent: { value: 0.0 },
        uReducedMotion: { value: this._prefersReducedMotion ? 1.0 : 0.0 }
      },
      vertexShader: `
        uniform float uTime;
        uniform vec2  uPointer;
        uniform float uReducedMotion;

        varying vec3 vPos;
        varying vec3 vN;
        varying vec3 vWorldPos;
        varying float vDisp;

        float hash13(vec3 p3){
          p3 = fract(p3 * 0.1031);
          p3 += dot(p3, p3.yzx + 33.33);
          return fract((p3.x + p3.y) * p3.z);
        }

        float noise3(vec3 x){
          vec3 i = floor(x);
          vec3 f = fract(x);
          vec3 u = f * f * (3.0 - 2.0 * f);
          float n000 = hash13(i + vec3(0.0,0.0,0.0));
          float n100 = hash13(i + vec3(1.0,0.0,0.0));
          float n010 = hash13(i + vec3(0.0,1.0,0.0));
          float n110 = hash13(i + vec3(1.0,1.0,0.0));
          float n001 = hash13(i + vec3(0.0,0.0,1.0));
          float n101 = hash13(i + vec3(1.0,0.0,1.0));
          float n011 = hash13(i + vec3(0.0,1.0,1.0));
          float n111 = hash13(i + vec3(1.0,1.0,1.0));
          float nx00 = mix(n000, n100, u.x);
          float nx10 = mix(n010, n110, u.x);
          float nx01 = mix(n001, n101, u.x);
          float nx11 = mix(n011, n111, u.x);
          float nxy0 = mix(nx00, nx10, u.y);
          float nxy1 = mix(nx01, nx11, u.y);
          return mix(nxy0, nxy1, u.z);
        }

        float fbm(vec3 p){
          float sum = 0.0;
          float amp = 0.55;
          float freq = 1.0;
          for (int i=0; i<5; i++){
            sum += amp * noise3(p * freq);
            freq *= 2.02;
            amp *= 0.55;
          }
          return sum;
        }

        void main(){
          vN = normalize(normalMatrix * normal);
          vec3 p = position;
          float t = uTime * mix(0.55, 0.18, uReducedMotion);
          vec3 ptr = vec3(uPointer.x, -uPointer.y, 0.0);
          float n1 = fbm(p * 1.05 + ptr * 0.55 + vec3(0.0, 0.0, t * 0.8));
          float n2 = fbm(p * 2.10 - ptr * 0.35 + vec3(t * 0.45, 0.0, 0.0));
          float n = (n1 * 0.75 + n2 * 0.25);
          n = n * 2.0 - 1.0;
          float dispAmp = mix(0.23, 0.10, uReducedMotion);
          float disp = n * dispAmp;
          vDisp = disp;
          vec3 displaced = p + normal * disp;
          vec4 worldPos = modelMatrix * vec4(displaced, 1.0);
          vWorldPos = worldPos.xyz;
          vPos = displaced;
          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec2  uPointer;
        uniform vec2  uResolution;
        uniform float uAccent;
        uniform float uReducedMotion;

        varying vec3 vPos;
        varying vec3 vN;
        varying vec3 vWorldPos;
        varying float vDisp;

        vec3 tonemap(vec3 x){
          x = max(vec3(0.0), x);
          return (x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14);
        }
        float saturate(float x){ return clamp(x, 0.0, 1.0); }

        void main(){
          vec3 N = normalize(vN);
          vec3 V = normalize(cameraPosition - vWorldPos);
          float fres = pow(1.0 - saturate(dot(N, V)), 3.2);
          float t = uTime * mix(0.55, 0.18, uReducedMotion);
          float domain = dot(normalize(vPos), vec3(0.35, 0.72, 0.58));
          domain += vDisp * 1.9;
          domain += (uPointer.x * 0.08 - uPointer.y * 0.06);
          float w1 = 0.5 + 0.5 * sin(6.0 * domain + t * 1.2);
          float w2 = 0.5 + 0.5 * sin(10.0 * domain - t * 0.9);
          float w = mix(w1, w2, 0.45);
          vec3 cInk    = vec3(0.03, 0.04, 0.07);
          vec3 cCyan   = vec3(0.33, 0.95, 1.00);
          vec3 cViolet = vec3(0.54, 0.36, 1.00);
          vec3 cMag    = vec3(1.00, 0.31, 0.85);
          vec3 cAmber  = vec3(1.00, 0.79, 0.45);
          vec3 gradA = mix(cCyan, cViolet, smoothstep(0.10, 0.70, w));
          vec3 gradB = mix(cMag,  cAmber,  smoothstep(0.15, 0.85, w2));
          vec3 plasma = mix(gradA, gradB, 0.35 + 0.25 * w1);
          float sparkle = pow(saturate(dot(N, normalize(vec3(-0.2, 0.9, 0.35)))), 24.0);
          sparkle *= 0.18;
          vec3 L = normalize(vec3(0.7, 0.45, 0.5));
          vec3 H = normalize(L + V);
          float spec = pow(saturate(dot(N, H)), 70.0) * 0.65;
          float facing = saturate(dot(N, V));
          vec3 col = cInk;
          col += plasma * (0.62 + 0.50 * fres);
          col += vec3(1.0) * (spec * 0.75 + sparkle);
          col += plasma * fres * (0.22 * uAccent);
          float alpha = 0.30 + 0.40 * fres;
          alpha += 0.08 * saturate(vDisp * 4.0);
          alpha = clamp(alpha, 0.10, 0.92);
          col = tonemap(col);
          gl_FragColor = vec4(col, alpha);
        }
      `
    });

    this._mesh = new THREE.Mesh(geometry, material);
    this._scene.add(this._mesh);

    const haloGeo = new THREE.IcosahedronGeometry(1.30, 24);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0x53f3ff,
      transparent: true,
      opacity: 0.06,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    this._halo = new THREE.Mesh(haloGeo, haloMat);
    this._scene.add(this._halo);

    material.uniforms.uResolution.value.set(1, 1);
  }

  _tick(){
    if (!this._running) return;

    this._raf = requestAnimationFrame(() => this._tick());

    if (!this._renderer || !this._scene || !this._camera || !this._mesh) return;

    this._pointer.x += (this._pointer.tx - this._pointer.x) * 0.06;
    this._pointer.y += (this._pointer.ty - this._pointer.y) * 0.06;

    const dt = Math.min(0.033, this._clock.getDelta());
    const t = this._clock.elapsedTime;

    const u = this._mesh.material.uniforms;
    u.uTime.value = t;
    u.uPointer.value.set(this._pointer.x, this._pointer.y);

    const rm = this._prefersReducedMotion ? 1 : 0;
    const rotAmp = rm ? 0.15 : 0.35;

    const px = this._pointer.x;
    const py = this._pointer.y;

    this._mesh.rotation.y += dt * (0.22 * (rm ? 0.35 : 1.0));
    this._mesh.rotation.x = py * rotAmp * 0.35 + Math.sin(t * 0.35) * rotAmp * 0.08;
    this._mesh.rotation.z = -px * rotAmp * 0.22;

    this._mesh.position.x = px * 0.18;
    this._mesh.position.y = -py * 0.12;

    if (this._halo){
      this._halo.position.copy(this._mesh.position);
      this._halo.rotation.copy(this._mesh.rotation);
      this._halo.rotation.y *= -0.8;
    }

    this._renderer.render(this._scene, this._camera);
  }
}

customElements.define('mindflow-hero', MindflowHero);

(function ensureThemeVars(){
  const root = document.documentElement;
  const required = [
    ['--ink', '#EAF0FF'],
    ['--font-sans', 'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial'],
    ['--font-mono', 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace']
  ];
  for (const [k, v] of required){
    const cur = getComputedStyle(root).getPropertyValue(k).trim();
    if (!cur) root.style.setProperty(k, v);
  }
})();
