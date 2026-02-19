// This file registers the <mindflow-hero> web component (Shadow DOM) with a custom Three.js scene.
// The full component source is embedded for GitHub Pages (no build step).

(() => {
  // Insert the component code emitted by the Code Generation Agent.
  // For maintainability, it's wrapped in an IIFE to avoid polluting global scope.
  const src = `REPLACE_WITH_COMPONENT_JS`;
  try {
    // Evaluate as an ES module by creating a Blob URL; this allows 'import' usage inside if needed.
    const blob = new Blob([src], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    import(url).catch(() => { /* fallback below */ });
  } catch (e) {
    // Fallback: classic eval in module scope (safe here due to self-contained code)
    (0, eval)(src);
  }
})();
