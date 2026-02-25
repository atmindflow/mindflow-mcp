document.addEventListener('DOMContentLoaded', () => {
  const app = document.getElementById('app');

  app.innerHTML = `
    <div class="page">
      <section class="left">
        <header class="header-row">
          <div class="logo-lockup">
            <div class="logo-mark"></div>
            <div class="logo-text">
              <div class="logo-text-main">OpenClaw</div>
              <div class="logo-text-sub">Release Channel</div>
            </div>
          </div>
          <div class="badge">
            <span class="badge-dot"></span>
            <span>Release Notes</span>
            <span class="badge-pill">v2026.2.24</span>
          </div>
        </header>

        <div class="hero">
          <div class="hero-eyebrow">February 24, 2026 · Stable</div>
          <h1 class="hero-title">
            Claw into <span>production-safe autonomy</span>.
          </h1>
          <p class="hero-subtitle">
            OpenClaw v2026.2.24 centers on safer rollout of autonomous workflows, faster incident
            triage, and a first-class GitHub Pages experience for your OpenClaw-powered docs.
          </p>

          <div class="actions">
            <button class="button-primary" data-scroll-target="highlights">
              <span>Browse key changes</span>
              <span class="button-label-sub">Security · Platform · UX</span>
            </button>
            <button class="button-secondary" data-scroll-target="upgrade">
              <span>Upgrade &amp; rollout guidance</span>
            </button>
          </div>

          <div class="chip-row">
            <div class="chip"><strong>Zero-downtime</strong> schema migration path</div>
            <div class="chip">Backwards compatible with <strong>v2025.x</strong></div>
            <div class="chip">Minimum runtime: <strong>OpenClaw Runtime 3.4</strong></div>
          </div>
        </div>

        <div class="main-layout">
          <article class="section-card" id="highlights">
            <div class="section-header">
              <h2 class="section-title">Highlights</h2>
              <span class="section-tag">What ships in v2026.2.24</span>
            </div>
            <div class="section-body">
              <p>
                This release keeps production safety front and center while giving teams sharper tools for
                autonomous execution and observability.
              </p>
              <ul class="list">
                <li class="list-item">
                  <span class="badge-small badge-small--accent">1</span>
                  <div>
                    <div class="item-title">Guarded Launch Templates</div>
                    <div class="item-meta">
                      <span>Pre-flight safety checks for high-risk workflows</span>
                      <span>Environment-aware rollout policies</span>
                    </div>
                    <div class="item-pill-row">
                      <span class="item-pill">Block on missing approvals or secrets</span>
                      <span class="item-pill">Per-tenant risk scoring</span>
                    </div>
                  </div>
                </li>
                <li class="list-item">
                  <span class="badge-small badge-small--success">2</span>
                  <div>
                    <div class="item-title">Incident Capsule View</div>
                    <div class="item-meta">
                      <span>One-click timeline + context capture</span>
                      <span>Exports directly into your runbooks</span>
                    </div>
                    <div class="item-pill-row">
                      <span class="item-pill">Designed for on-call rotations</span>
                      <span class="item-pill">Optimized for OpenClaw + GitHub flows</span>
                    </div>
                  </div>
                </li>
                <li class="list-item">
                  <span class="badge-small badge-small--blue">3</span>
                  <div>
                    <div class="item-title">GitHub Pages-Ready Landing Kits</div>
                    <div class="item-meta">
                      <span>Opinionated index+CSS+JS for release microsites</span>
                      <span>First-party support for OpenClaw docs</span>
                    </div>
                    <div class="item-pill-row">
                      <span class="item-pill">Accessible dark theme baseline</span>
                      <span class="item-pill">Drop-in for <code>main</code> / root Pages</span>
                    </div>
                  </div>
                </li>
              </ul>
              <div class="timeline">
                <span class="dot"></span>
                <span><strong>GA:</strong> Feb 24, 2026</span>
                <span>Rollout window: 10–21 days across managed tenants</span>
                <span>Recommended: enable guarded templates before new automations</span>
              </div>
            </div>
          </article>

          <article class="section-card" id="upgrade">
            <div class="section-header">
              <h2 class="section-title">Upgrade notes</h2>
              <span class="section-tag">From v2025.x &amp; v2026.1.x</span>
            </div>
            <div class="section-body">
              <p>
                Upgrades are designed to be <strong>in-place</strong> with no action required for most
                deployments. For clusters running customized policy engines or non-default schema, review
                the following before rollout:
              </p>
              <ul class="list">
                <li class="list-item">
                  <span class="badge-small">Schema</span>
                  <div>
                    <div class="item-title">Non-breaking migration path</div>
                    <p class="item-meta">
                      <span>New audit_entities table is additive</span>
                      <span>Legacy audit columns remain readable for 2 releases</span>
                    </p>
                  </div>
                </li>
                <li class="list-item">
                  <span class="badge-small">Policy</span>
                  <div>
                    <div class="item-title">Guarded Launch defaults</div>
                    <p class="item-meta">
                      <span>Existing workflows remain permissive</span>
                      <span>New templates default to "review required" for destructive ops</span>
                    </p>
                  </div>
                </li>
                <li class="list-item">
                  <span class="badge-small">Runtime</span>
                  <div>
                    <div class="item-title">Runtime 3.4+</div>
                    <p class="item-meta">
                      <span>Earlier runtimes continue to accept tasks but miss new safeguards</span>
                      <span>Plan upgrade during a low-traffic window</span>
                    </p>
                  </div>
                </li>
              </ul>
              <p style="margin-top: 6px; font-size: 11px; color: var(--muted);">
                For detailed migration manifests and rollback strategy, refer to your internal OpenClaw
                operator playbook or the <code>v2026.2.24</code> upgrade checklist.
              </p>
            </div>
          </article>
        </div>
      </section>

      <aside class="right">
        <section class="summary-card">
          <div class="summary-badge-row">
            <span class="summary-label">Release Summary</span>
            <div class="summary-pills">
              <span class="badge-small badge-small--success">Stable</span>
              <span class="badge-small">Safe to roll out</span>
            </div>
          </div>
          <h2 class="summary-title">What v2026.2.24 means for your teams</h2>
          <p class="summary-body">
            You can push more autonomy into production while keeping your risk posture explicit and
            reviewable. This release is especially recommended for teams that:
          </p>
          <ul class="list">
            <li class="list-item">
              <span class="badge-small">Ops</span>
              <div>
                <div class="item-title">Run 24/7 on-call rotations</div>
                <p class="item-meta">
                  <span>Faster incident context capture</span>
                  <span>Better handoff between human + autonomous responders</span>
                </p>
              </div>
            </li>
            <li class="list-item">
              <span class="badge-small">Platform</span>
              <div>
                <div class="item-title">Operate shared OpenClaw clusters</div>
                <p class="item-meta">
                  <span>Per-tenant guardrails without per-tenant sprawl</span>
                </p>
              </div>
            </li>
          </ul>
          <div class="summary-metrics">
            <div class="metric">
              <div class="metric-label">Breaking changes</div>
              <div class="metric-value">0<span>API / schema</span></div>
              <div class="metric-tag">Backwards compatible</div>
            </div>
            <div class="metric">
              <div class="metric-label">Upgrade time</div>
              <div class="metric-value">&lt;15<span>minutes typical</span></div>
              <div class="metric-tag">With pre-pulled images</div>
            </div>
            <div class="metric">
              <div class="metric-label">Target tenants</div>
              <div class="metric-value">100%<span>managed</span></div>
              <div class="metric-tag">Rolling by default</div>
            </div>
          </div>
        </section>

        <section class="summary-card">
          <div class="summary-badge-row">
            <span class="summary-label">GitHub Pages</span>
            <div class="summary-pills">
              <span class="badge-small badge-small--blue">main / root</span>
            </div>
          </div>
          <h2 class="summary-title">Serving these notes via GitHub Pages</h2>
          <p class="summary-body">
            This landing page is optimized for the "GitHub Pages → main branch → / (root)" configuration.
            Once Pages is enabled in your repository settings, this release page will be served as your
            project root.
          </p>
          <ul class="list">
            <li class="list-item">
              <span class="badge-small">1</span>
              <div>
                <div class="item-title">Branch</div>
                <p class="item-meta">
                  <span>Source: <code>main</code></span>
                  <span>Folder: <code>/</code> (root)</span>
                </p>
              </div>
            </li>
            <li class="list-item">
              <span class="badge-small">2</span>
              <div>
                <div class="item-title">Files</div>
                <p class="item-meta">
                  <span><code>index.html</code></span>
                  <span><code>styles.css</code></span>
                  <span><code>main.js</code></span>
                </p>
              </div>
            </li>
            <li class="list-item">
              <span class="badge-small">3</span>
              <div>
                <div class="item-title">Caching</div>
                <p class="item-meta">
                  <span>Static assets only</span>
                  <span>No client-side routing required</span>
                </p>
              </div>
            </li>
          </ul>
        </section>

        <footer class="footer">
          <span><strong>OpenClaw v2026.2.24</strong></span>
          <span>·</span>
          <span>Shipped from the Mindflow team</span>
          <div class="footer-pill-row">
            <span class="footer-pill">Next up: v2026.3.x safety &amp; latency improvements</span>
          </div>
        </footer>
      </aside>
    </div>
  `;

  // Smooth scrolling for hero buttons
  const buttons = document.querySelectorAll('[data-scroll-target]');
  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-scroll-target');
      const target = document.getElementById(id);
      if (!target) return;

      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
});
