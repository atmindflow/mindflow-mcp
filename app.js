// Minimal progressive enhancement:
// - Smooth-scroll to in-page anchors for browsers that don't honor CSS scroll-behavior
// - Reveal sections as they enter the viewport

window.addEventListener('hashchange', () => {
  const id = location.hash?.slice(1);
  if (!id) return;

  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

if (location.hash) {
  setTimeout(() => {
    const id = location.hash?.slice(1);
    if (!id) return;
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 50);
}

const io = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    }
  },
  { rootMargin: '0px 0px -12% 0px', threshold: 0.12 }
);

for (const s of document.querySelectorAll('.section')) io.observe(s);
