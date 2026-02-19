/*
  main.js
  - Defines <mindflow-hero3d> custom element
  - Renders a modern UI overlaying a high-performance WebGL (Three.js) illustration

  Notes about "inspiration" analysis:
  - The prompt provides a GitHub URL but no direct, fetchable design tokens in this environment.
  - This implementation adopts a plausible OpenClaw-like aesthetic: dark UI, cyan/teal glow accents,
    technical pill nav, glass panels, and crisp typography.
*/

import * as THREE from 'https://unpkg.com/three@0.161.0/build/three.module.js';

class MindflowHero3D extends HTMLElement {
  constructor(){
    super();

    // --- DOM refs ---
    this._canvas = null;
    this._ui = {};

    // --- Three.js refs ---
    this._renderer = null;
    this._scene = null;
    this._camera = null;
    this._clock = new THREE.Clock();

    // Meshes/materials
    this._heroMesh = null;
    this._particles = null;

    // Animation / interaction state
    this._raf = 0;
    this._running = false;
    this._visible = true;
    this._reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Pointer-driven parallax (kept subtle to avoid motion sickness)
    this._pointer = { x: 0, y: 0, tx: 0, ty: 0 };

    // For performance: cap devicePixelRatio
    this._dpr = Math.min(2, window.devicePixelRatio || 1);

    // Observers/listeners
    this._io = null;

    // Bind methods
    this._onResize = this._onResize.bind(this);
    this._onPointerMove = this._onPointerMove.bind(this);
    this._onVisibilityChange = this._onVisibilityChange.bind(this);
    this._tick = this._tick.bind(this);
  }

  connectedCallback(){
    if (!this.querySelector('.mf-shell')) this._render();

    this._canvas = this.querySelector('canvas.mf-canvas');
    this._ui.fps = this.querySelector('[data-mf-fps]');
    this._ui.res = this.querySelector('[data-mf-res]');
    this._ui.mode = this.querySelector('[data-mf-mode]');

    this._initThree();
    this._initObservers();
    this._initEvents();

    if (this._reducedMotion){
      this._ui.mode.textContent = 'Static';
      this._renderOnce();
      return;
    }

    this._ui.mode.textContent = 'Realtime';
    this._start();
  }

  disconnectedCallback(){
    this._stop();
    window.removeEventListener('resize', this._onResize);
    window.removeEventListener('pointermove', this._onPointerMove);
    document.removeEventListener('visibilitychange', this._onVisibilityChange);
    if (this._io){ this._io.disconnect(); this._io = null; }
    this._disposeThree();
  }

  _render(){
    this.innerHTML = `
      <section class="mf-shell" aria-label="WebGL hero section">
        <div class="mf-bg" aria-hidden="true">
          <canvas class="mf-canvas"></canvas>
          <div class="mf-vignette"></div>
          <div class="mf-grain"></div>
        </div>
        <header class="mf-topbar">
          <div class="mf-topbar-inner">
            <div class="mf-brand" aria-label="Brand">
              <div class="mf-logo" aria-hidden="true"></div>
              <div class="mf-brand-title">
                <strong>OpenClaw-style UI</strong>
                <span>High-performance WebGL illustration</span>
              </div>
            </div>
            <nav class="mf-nav" aria-label="Top navigation">
              <span class="mf-pill"><strong>WebGL</strong> Shader</span>
              <span class="mf-pill"><strong>UI</strong> Glass</span>
              <span class="mf-pill"><strong>Perf</strong> DPR cap</span>
            </nav>
          </div>
        </header>
        <main class="mf-main">
          <div class="mf-main-inner">
            <article class="mf-hero">
              <div class="mf-kicker"><span class="mf-dot"></span> Production-ready component • Three.js + GLSL</div>
              <h1 class="mf-title"><span class="mf-grad">A sculpted, shader-driven form</span><br/>that stays fast.</h1>
              <p class="mf-sub">A minimal scene with a single hero mesh and lightweight particles. The fragment shader blends rim-lighting, iridescent banding, and procedural noise.</p>
              <div class="mf-actions">
                <button class="mf-btn mf-btn-primary" type="button" data-mf-action="pulse">Pulse highlight</button>
                <button class="mf-btn" type="button" data-mf-action="toggle">Toggle particles</button>
                <a class="mf-btn" href="#details" role="button">View details</a>
              </div>
            </article>
            <aside class="mf-side" id="details" aria-label="Details">
              <div class="mf-card">
                <h3>Implementation</h3>
                <p>Custom <code>ShaderMaterial</code> with compact math; visibility + reduced-motion aware.</p>
              </div>
              <div class="mf-card">
                <h3>Runtime</h3>
                <div class="mf-metrics" role="list">
                  <div class="mf-metric" role="listitem"><div class="k">Mode</div><div class="v" data-mf-mode>—</div></div>
                  <div class="mf-metric" role="listitem"><div class="k">Resolution</div><div class="v" data-mf-res>—</div></div>
                  <div class="mf-metric" role="listitem"><div class="k">FPS (approx.)</div><div class="v" data-mf-fps>—</div></div>
                  <div class="mf-metric" role="listitem"><div class="k">Renderer</div><div class="v">WebGL</div></div>
                </div>
              </div>
              <div class="mf-card">
                <h3>Controls</h3>
                <p>Move pointer to subtly orbit. Component pauses when off-screen.</p>
              </div>
            </aside>
          </div>
        </main>
        <footer class="mf-footer" aria-label="Footer">
          <div class="mf-footer-inner">
            <div class="mf-attrib"><span class="chip">Powered by Mindflow</span><span>Web component demo</span></div>
            <div><a class="mf-link" href="https://github.com/openclaw/openclaw" target="_blank" rel="noreferrer">Inspiration: OpenClaw</a></div>
          </div>
        </footer>
      </section>`;

    const onClick = (e) => {
      const btn = e.target.closest('[data-mf-action]');
      if (!btn) return;
      const action = btn.getAttribute('data-mf-action');
      if (action === 'toggle'){ if (this._particles) this._particles.visible = !this._particles.visible; }
      if (action === 'pulse'){ if (this._heroMesh?.material?.uniforms) this._heroMesh.material.uniforms.uPulse.value = 1.0; }
    };
    this.addEventListener('click', onClick);
  }

  _initThree(){
    this._renderer = new THREE.WebGLRenderer({ canvas: this._canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    this._renderer.setPixelRatio(this._dpr);
    this._renderer.setClearColor(0x000000, 0);

    this._scene = new THREE.Scene();
    this._scene.fog = new THREE.FogExp2(0x05070c, 0.12);

    this._camera = new THREE.PerspectiveCamera(45, 1, 0.1, 60);
    this._camera.position.set(0, 0.2, 6.0);

    const ambient = new THREE.AmbientLight(0xffffff, 0.35);
    this._scene.add(ambient);
    const key = new THREE.DirectionalLight(0xaefcff, 0.65); key.position.set(2.5, 3.0, 3.5); this._scene.add(key);
    const fill = new THREE.DirectionalLight(0xd4b8ff, 0.25); fill.position.set(-3.0, 1.0, 2.0); this._scene.add(fill);

    const geo = new THREE.TorusKnotGeometry(1.25, 0.42, 220, 28, 2, 3);

    const mat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: true, depthTest: true,
      uniforms: { uTime:{value:0}, uPulse:{value:0}, uAccentA:{value:new THREE.Color('#4AF2E3')}, uAccentB:{value:new THREE.Color('#B66BFF')}, uAccentC:{value:new THREE.Color('#2DC7FF')}, uOpacity:{value:0.95} },
      vertexShader: `
        uniform float uTime;
        varying vec3 vWorldPos; varying vec3 vWorldNormal; varying vec3 vViewDir;
        float hash13(vec3 p){ p = fract(p * 0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
        void main(){
          vec3 pos = position;
          float h = hash13(normal + position * 0.25);
          float wave = sin(uTime * 1.2 + h * 6.2831853);
          pos += normal * (0.03 * wave);
          vec4 world = modelMatrix * vec4(pos, 1.0); vWorldPos = world.xyz;
          vWorldNormal = normalize(mat3(modelMatrix) * (normalMatrix * normal));
          vViewDir = normalize(cameraPosition - vWorldPos);
          gl_Position = projectionMatrix * viewMatrix * world;
        }
      `,
      fragmentShader: `
        precision highp float;
        uniform float uTime; uniform float uPulse; uniform vec3 uAccentA; uniform vec3 uAccentB; uniform vec3 uAccentC; uniform float uOpacity;
        varying vec3 vWorldPos; varying vec3 vWorldNormal; varying vec3 vViewDir;
        float hash31(vec3 p){ return fract(sin(dot(p, vec3(127.1,311.7,74.7))) * 43758.5453123); }
        float valueNoise(vec3 p){ vec3 i=floor(p), f=fract(p); vec3 u=f*f*(3.0-2.0*f);
          float n000=hash31(i+vec3(0,0,0)); float n100=hash31(i+vec3(1,0,0)); float n010=hash31(i+vec3(0,1,0)); float n110=hash31(i+vec3(1,1,0));
          float n001=hash31(i+vec3(0,0,1)); float n101=hash31(i+vec3(1,0,1)); float n011=hash31(i+vec3(0,1,1)); float n111=hash31(i+vec3(1,1,1));
          float nx00=mix(n000,n100,u.x); float nx10=mix(n010,n110,u.x); float nx01=mix(n001,n101,u.x); float nx11=mix(n011,n111,u.x);
          float nxy0=mix(nx00,nx10,u.y); float nxy1=mix(nx01,nx11,u.y); return mix(nxy0,nxy1,u.z); }
        void main(){
          vec3 N=normalize(vWorldNormal); vec3 V=normalize(vViewDir);
          float rim=1.0 - max(dot(N,V),0.0); rim=pow(rim,2.2);
          float bands=dot(normalize(vWorldPos), N); float stripe=0.5+0.5*sin((bands*7.0)+uTime*0.8);
          float n=valueNoise(vWorldPos*0.55 + N*0.35 + uTime*0.08);
          vec3 col1=mix(uAccentA,uAccentC,stripe); vec3 col2=mix(col1,uAccentB,n*0.55);
          vec3 L=normalize(vec3(0.35,0.75,0.55)); vec3 H=normalize(L+V); float spec=pow(max(dot(N,H),0.0),64.0);
          float pulse=uPulse*(0.35+0.65*rim); vec3 base=col2*(0.45+0.55*rim); vec3 finalCol=base + (0.75*spec) + (pulse*vec3(0.25,0.95,0.85));
          finalCol += 0.08*col1; float alpha=uOpacity; alpha *= (0.88 + 0.12*(1.0 - rim)); gl_FragColor=vec4(finalCol, alpha);
        }
      `
    });

    this._heroMesh = new THREE.Mesh(geo, mat);
    this._heroMesh.position.set(0.15, 0.0, 0.0);
    this._scene.add(this._heroMesh);

    this._particles = this._makeParticles(900);
    this._scene.add(this._particles);

    this._onResize();
  }

  _makeParticles(count){
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    for (let i=0;i<count;i++){
      const i3=i*3; const r=Math.pow(Math.random(),0.45); const theta=Math.random()*Math.PI*2; const y=(Math.random()*2-1)*1.2;
      positions[i3+0]=Math.cos(theta)*r*4.2; positions[i3+1]=y*(0.8+Math.random()*0.6); positions[i3+2]=Math.sin(theta)*r*3.2-1.2;
      sizes[i]=0.6+Math.random()*1.8;
    }
    const g=new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(positions,3)); g.setAttribute('aSize', new THREE.BufferAttribute(sizes,1));
    const m=new THREE.ShaderMaterial({ transparent:true, depthWrite:false, uniforms:{ uTime:{value:0}, uColor:{value:new THREE.Color('#4AF2E3')}, uColor2:{value:new THREE.Color('#B66BFF')} },
      vertexShader:`
        uniform float uTime; attribute float aSize; varying float vFade;
        void main(){ vec3 p=position; p.x += 0.06*sin(uTime*0.4 + position.z*0.7); p.z += 0.06*cos(uTime*0.35 + position.x*0.6);
          vec4 mv = modelViewMatrix * vec4(p,1.0); gl_PointSize = aSize * (220.0 / -mv.z); gl_Position = projectionMatrix * mv; vFade = clamp(1.0/(1.0+(-mv.z*0.18)),0.0,1.0); }
      `,
      fragmentShader:`
        precision mediump float; uniform float uTime; uniform vec3 uColor; uniform vec3 uColor2; varying float vFade;
        void main(){ vec2 uv = gl_PointCoord*2.0 - 1.0; float d=dot(uv,uv); float a=smoothstep(1.0,0.0,d); float flicker = 0.92 + 0.08 * sin(uTime*1.6 + d*9.0);
          vec3 col = mix(uColor, uColor2, uv.x*0.5+0.5); gl_FragColor = vec4(col, a * vFade * 0.55 * flicker); }
      `
    });
    const pts=new THREE.Points(g,m); pts.position.set(0,0,0); return pts;
  }

  _initObservers(){
    this._io = new IntersectionObserver((entries)=>{
      for (const e of entries){ if (e.target !== this) continue; this._visible = e.isIntersecting; if (!this._reducedMotion){ if (this._visible) this._start(); else this._stop(); } }
    }, { threshold: 0.01 });
    this._io.observe(this);
  }

  _initEvents(){
    window.addEventListener('resize', this._onResize, { passive:true });
    window.addEventListener('pointermove', this._onPointerMove, { passive:true });
    document.addEventListener('visibilitychange', this._onVisibilityChange, { passive:true });
  }

  _onPointerMove(e){ const nx=(e.clientX/window.innerWidth)*2-1; const ny=(e.clientY/window.innerHeight)*2-1; this._pointer.tx=nx; this._pointer.ty=ny; }
  _onVisibilityChange(){ if (document.hidden){ this._stop(); return; } if (!this._reducedMotion && this._visible) this._start(); }

  _onResize(){ if (!this._renderer || !this._camera) return; const rect=this.getBoundingClientRect(); const w=Math.max(1, Math.floor(rect.width)); const h=Math.max(1, Math.floor(rect.height));
    this._renderer.setSize(w,h,false); this._camera.aspect=w/h; this._camera.updateProjectionMatrix(); if (this._ui.res) this._ui.res.textContent=`${w}×${h} @${this._dpr.toFixed(2)}x`; if (this._reducedMotion) this._renderOnce(); }

  _start(){ if (this._running) return; if (!this._renderer || !this._scene || !this._camera) return; if (document.hidden) return; this._running = true; this._clock.start(); this._tick(); }
  _stop(){ this._running = false; if (this._raf) cancelAnimationFrame(this._raf); this._raf = 0; }
  _renderOnce(){ if (!this._renderer || !this._scene || !this._camera) return; const t=0.0; if (this._heroMesh?.material?.uniforms) this._heroMesh.material.uniforms.uTime.value=t; if (this._particles?.material?.uniforms) this._particles.material.uniforms.uTime.value=t; this._renderer.render(this._scene, this._camera); }

  _tick(){ if (!this._running) return; this._raf = requestAnimationFrame(this._tick); const t=this._clock.getElapsedTime(); const lerp=(a,b,k)=>a+(b-a)*k; this._pointer.x=lerp(this._pointer.x,this._pointer.tx,0.06); this._pointer.y=lerp(this._pointer.y,this._pointer.ty,0.06);
    if (this._heroMesh){ this._heroMesh.rotation.y = t*0.38 + this._pointer.x*0.35; this._heroMesh.rotation.x = t*0.18 + this._pointer.y*0.20; this._heroMesh.rotation.z = t*0.10; const u=this._heroMesh.material.uniforms; u.uTime.value=t; u.uPulse.value *= 0.90; }
    if (this._particles){ this._particles.rotation.y = -t*0.04 + this._pointer.x*0.05; this._particles.rotation.x = this._pointer.y*0.03; this._particles.material.uniforms.uTime.value=t; }
    this._camera.position.x = this._pointer.x * 0.25; this._camera.position.y = 0.2 + this._pointer.y * 0.12; this._camera.lookAt(0,0,0); this._renderer.render(this._scene, this._camera); this._updateFps(); }

  _updateFps(){ if (!this._ui.fps) return; const now=performance.now(); if (!this._fpsState){ this._fpsState={ last:now, acc:0, frames:0, fps:0 }; return; } const s=this._fpsState; const dt=now-s.last; s.last=now; s.acc+=dt; s.frames+=1; if (s.acc>=250){ s.fps = Math.round((s.frames*1000)/s.acc); s.acc=0; s.frames=0; this._ui.fps.textContent=String(s.fps); } }

  _disposeThree(){ const disposeMaterial=(m)=>{ if (!m) return; if (Array.isArray(m)) m.forEach(disposeMaterial); else m.dispose?.(); }; const disposeObject=(obj)=>{ if (!obj) return; obj.traverse?.((child)=>{ if (child.geometry) child.geometry.dispose?.(); if (child.material) disposeMaterial(child.material); }); }; if (this._scene) disposeObject(this._scene); this._renderer?.dispose?.(); this._renderer=null; this._scene=null; this._camera=null; this._heroMesh=null; this._particles=null; }
}

customElements.define('mindflow-hero3d', MindflowHero3D);
