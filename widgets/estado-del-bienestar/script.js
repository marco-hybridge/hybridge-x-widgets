// ── DATA ──────────────────────────────────────────────────────────────────
// Misma cadena causal del widget de Interacty original (3 hechos + conclusión).

const CHAIN = [
  {
    year: '1929',
    icon: '📉',
    title: 'Gran Depresión',
    text: 'Demuestra que el mercado no puede autorregularse sin afectar a millones de personas.',
  },
  {
    year: '1939 — 1945',
    icon: '⚔️',
    title: 'Segunda Guerra Mundial',
    text: 'Muestra la necesidad de construir una paz basada en justicia social.',
  },
  {
    year: '1948',
    icon: '📜',
    title: 'Declaración Universal de los Derechos Humanos',
    text: 'Reconoce la salud, la educación y el trabajo como derechos humanos.',
  },
  {
    year: 'Resultado',
    icon: '🏛️',
    title: 'Nace el Estado del Bienestar',
    text: 'Para que la crisis y la guerra no se repitan, los Estados empiezan a intervenir en la economía: nace la salud pública, la educación gratuita y la seguridad social.',
    isResult: true,
  },
];

// ── RENDER ────────────────────────────────────────────────────────────────

const chain = document.getElementById('eobChain');

CHAIN.forEach((step) => {
  const node = document.createElement('div');
  node.className = 'eob-node' + (step.isResult ? ' eob-node--result' : '');
  node.innerHTML = `
    <div class="eob-node-marker">${step.icon}</div>
    <div class="eob-node-body">
      <span class="eob-node-year">${step.year}</span>
      <h4 class="eob-node-title">${step.title}</h4>
      <p class="eob-node-text">${step.text}</p>
    </div>
  `;
  chain.appendChild(node);
});

// ── REVEAL DE NODOS AL HACER SCROLL ─────────────────────────────────────

const nodeObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in-view');
      nodeObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.4 });

document.querySelectorAll('.eob-node').forEach(el => nodeObserver.observe(el));

// Red de seguridad: si por algún motivo el observer no dispara (p. ej. iframe
// que arranca oculto en algunos embeds), el contenido no debe quedar invisible.
setTimeout(() => {
  document.querySelectorAll('.eob-node:not(.in-view)').forEach(el => el.classList.add('in-view'));
}, 1500);

// ── LÍNEA DE PROGRESO SEGÚN SCROLL ──────────────────────────────────────

const fill = document.getElementById('eobChainFill');

function updateChainFill() {
  const rect = chain.getBoundingClientRect();
  const viewportCenter = window.innerHeight * 0.65;

  // Progreso de 0 a 1 según cuánto del track ya cruzó el "centro de lectura"
  const progress = (viewportCenter - rect.top) / rect.height;
  const clamped = Math.max(0, Math.min(1, progress));

  fill.style.height = `${clamped * 100}%`;
}

window.addEventListener('scroll', updateChainFill, { passive: true });
window.addEventListener('resize', updateChainFill);
updateChainFill();
