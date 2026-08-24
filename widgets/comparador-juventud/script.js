const wrap      = document.getElementById('cmpWrap');
const clip      = document.getElementById('cmpClip');
const divider    = document.getElementById('cmpDivider');
const positivePanel = document.getElementById('cmpPositive');

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ── ANCHO FIJO DEL PANEL POSITIVO ───────────────────────────────────────
// Debe medir siempre el ancho completo de .cmp-wrap (no el de .cmp-clip,
// que se va angostando) para que el texto no se deforme al arrastrar.

function syncPositiveWidth() {
  positivePanel.style.width = `${wrap.getBoundingClientRect().width}px`;
}

window.addEventListener('resize', syncPositiveWidth);
syncPositiveWidth();

// ── POSICIÓN DEL DIVISOR ────────────────────────────────────────────────

function setPosition(pct) {
  const clamped = Math.max(0, Math.min(100, pct));
  clip.style.width = `${clamped}%`;
  divider.style.left = `${clamped}%`;
  divider.setAttribute('aria-valuenow', String(Math.round(clamped)));
}

function pctFromClientX(clientX) {
  const rect = wrap.getBoundingClientRect();
  return ((clientX - rect.left) / rect.width) * 100;
}

// ── ARRASTRE (mouse / touch / pen vía Pointer Events) ───────────────────

let dragging = false;

function startDrag(clientX) {
  dragging = true;
  wrap.classList.remove('is-demo');
  divider.classList.add('is-dragging');
  setPosition(pctFromClientX(clientX));
}

function moveDrag(clientX) {
  if (!dragging) return;
  setPosition(pctFromClientX(clientX));
}

function endDrag() {
  dragging = false;
  divider.classList.remove('is-dragging');
}

wrap.addEventListener('pointerdown', (e) => {
  wrap.setPointerCapture(e.pointerId);
  startDrag(e.clientX);
});
wrap.addEventListener('pointermove', (e) => moveDrag(e.clientX));
wrap.addEventListener('pointerup', endDrag);
wrap.addEventListener('pointercancel', endDrag);

// ── TECLADO (accesibilidad) ─────────────────────────────────────────────

divider.addEventListener('keydown', (e) => {
  const current = parseFloat(divider.style.left) || 50;
  const step = e.shiftKey ? 15 : 5;

  if (e.key === 'ArrowLeft')  { setPosition(current - step); e.preventDefault(); }
  if (e.key === 'ArrowRight') { setPosition(current + step); e.preventDefault(); }
  if (e.key === 'Home')       { setPosition(0); e.preventDefault(); }
  if (e.key === 'End')        { setPosition(100); e.preventDefault(); }
});

// ── DEMO DE ENTRADA ──────────────────────────────────────────────────────
// Sugiere la interacción moviendo el divisor solo una vez al cargar.

function playIntroDemo() {
  if (prefersReducedMotion) {
    setPosition(50);
    return;
  }

  wrap.classList.add('is-demo');
  setPosition(50);

  setTimeout(() => setPosition(28), 500);
  setTimeout(() => setPosition(72), 1250);
  setTimeout(() => setPosition(50), 2000);
  setTimeout(() => wrap.classList.remove('is-demo'), 2650);
}

setPosition(50);
requestAnimationFrame(playIntroDemo);
