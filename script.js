(() => {
  const year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());

  const copyBtn = document.getElementById('copyBtn');
  const copyHint = document.getElementById('copyHint');
  const text = 'git clone https://github.com/atmindflow/mindflow-mcp';

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      if (copyHint) copyHint.textContent = 'Copied!';
      copyBtn?.classList.add('copied');
      window.setTimeout(() => {
        if (copyHint) copyHint.textContent = '';
        copyBtn?.classList.remove('copied');
      }, 1200);
    } catch (e) {
      if (copyHint) copyHint.textContent = 'Copy failed — please copy manually.';
    }
  }

  copyBtn?.addEventListener('click', copy);

  // Subtle parallax blobs (respects reduced motion)
  const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  if (prefersReduced) return;

  const blobs = Array.from(document.querySelectorAll('.blob'));
  if (!blobs.length) return;

  let raf = 0;
  let tx = 0, ty = 0;
  window.addEventListener('pointermove', (e) => {
    const x = (e.clientX / window.innerWidth) - 0.5;
    const y = (e.clientY / window.innerHeight) - 0.5;
    tx = x;
    ty = y;
    if (raf) return;
    raf = window.requestAnimationFrame(() => {
      raf = 0;
      blobs.forEach((b, i) => {
        const depth = (i + 1) * 10;
        b.style.setProperty('--x', `${tx * depth}px`);
        b.style.setProperty('--y', `${ty * depth}px`);
      });
    });
  }, { passive: true });
})();
