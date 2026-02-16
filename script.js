// Copy to clipboard for clone repo button
const cloneBtn = document.getElementById('clone-btn');
const cloneTooltip = document.getElementById('clone-tooltip');
const GIT_URL = 'https://github.com/atmindflow/mindflow-mcp.git';

cloneBtn.addEventListener('click', () => {
  navigator.clipboard.writeText(`git clone ${GIT_URL}`).then(() => {
    showTooltip();
  });
});

function showTooltip() {
  cloneTooltip.hidden = false;
  setTimeout(() => { cloneTooltip.hidden = true; }, 1700);
}

// Animate steps only if allowed
if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  document.querySelectorAll('.step').forEach((el, i) => {
    el.style.animationDelay = `${0.07 + i * 0.18}s`;
  });
}
