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
})();
