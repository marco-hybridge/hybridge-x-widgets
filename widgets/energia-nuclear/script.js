// ════════════════════════════════════════════════════════════════════════
//  ENERGÍA NUCLEAR — versión interactiva del flipbook "Fisión y Fusión"
// ════════════════════════════════════════════════════════════════════════

const NS = 'http://www.w3.org/2000/svg';
const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const SPEED = REDUCED ? 0.25 : 1;   // multiplica todas las duraciones

// ── UTILIDADES SVG / ANIMACIÓN ──────────────────────────────────────────

function svgEl(tag, attrs = {}, parent) {
  const node = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  if (parent) parent.appendChild(node);
  return node;
}

// Generador pseudoaleatorio con semilla: el mismo núcleo siempre se ve igual.
function seeded(seed) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

/** Dibuja un núcleo (protones + neutrones) empaquetado en espiral de girasol. */
function drawNucleus(parent, protons, neutrons, radius, seed = 7) {
  const g = svgEl('g', {}, parent);
  const total = protons + neutrons;
  if (total === 1) {
    svgEl('circle', { r: radius, fill: protons ? 'url(#gProton)' : 'url(#gNeutron)' }, g);
    return g;
  }
  const rand = seeded(seed);
  const types = [...Array(protons).fill('P'), ...Array(neutrons).fill('N')];
  for (let i = types.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [types[i], types[j]] = [types[j], types[i]];
  }
  const ball = radius * 0.98 / Math.sqrt(total) * (total < 5 ? 1.25 : 1.12);
  const spread = Math.max(radius - ball * 0.75, ball * 0.55);
  // De afuera hacia adentro: las del centro quedan "encima".
  for (let i = total - 1; i >= 0; i--) {
    const rr = spread * Math.sqrt((i + 0.5) / total);
    const th = i * 2.39996;
    svgEl('circle', {
      cx: (rr * Math.cos(th)).toFixed(2),
      cy: (rr * Math.sin(th)).toFixed(2),
      r: ball.toFixed(2),
      fill: types[i] === 'P' ? 'url(#gProton)' : 'url(#gNeutron)',
      stroke: 'rgba(0,0,0,0.25)',
      'stroke-width': 0.6,
    }, g);
  }
  return g;
}

/** Grupo animable posicionado por CSS transform (x, y en unidades del viewBox). */
function obj(parent, x, y, opacity = 1) {
  const g = svgEl('g', { class: 'obj' }, parent);
  g.style.transform = `translate(${x}px, ${y}px)`;
  g.style.opacity = opacity;
  return g;
}

/** Etiqueta isotópica: número de masa (arriba) y atómico (abajo) a la izquierda del símbolo. */
function isoLabel(parent, sym, A, Z, x, y, size = 20) {
  const g = svgEl('g', {}, parent);
  const t = svgEl('text', { x, y, 'text-anchor': 'start', 'font-weight': 800, 'font-size': size }, g);
  t.textContent = sym;
  if (A !== undefined) {
    const a = svgEl('text', { x: x - 3, y: y - size * 0.45, 'text-anchor': 'end', 'font-size': size * 0.55, 'font-weight': 700 }, g);
    a.textContent = A;
  }
  if (Z !== undefined) {
    const z = svgEl('text', { x: x - 3, y: y + size * 0.15, 'text-anchor': 'end', 'font-size': size * 0.55, 'font-weight': 700, fill: 'rgba(255,255,255,0.7)' }, g);
    z.textContent = Z;
  }
  return g;
}

function caption(parent, text, x, y, cls = 'cap') {
  const t = svgEl('text', { x, y, 'text-anchor': 'middle', class: cls }, parent);
  t.textContent = text;
  return t;
}

/** Anima con Web Animations y deja fijo el último cuadro como estilo. */
function anim(el, frames, duration, easing = 'ease-in-out', delay = 0) {
  const a = el.animate(frames, { duration: duration * SPEED, easing, delay: delay * SPEED, fill: 'forwards' });
  return a.finished.then(() => {
    const last = frames[frames.length - 1];
    for (const k of Object.keys(last)) {
      if (k !== 'offset' && k !== 'easing') el.style[k] = last[k];
    }
    a.cancel();
  }).catch(() => {});
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms * SPEED));
const T = (x, y, s = 1, s2) => `translate(${x}px, ${y}px) scale(${s}${s2 !== undefined ? ', ' + s2 : ''})`;

// ════════════════════════════════════════════════════════════════════════
//  NAVEGACIÓN ENTRE DIAPOSITIVAS
// ════════════════════════════════════════════════════════════════════════

const slides = [...document.querySelectorAll('.nx-slide')];
const dotsEl = document.getElementById('nxDots');
const navFill = document.getElementById('nxNavFill');
const prevBtn = document.getElementById('nxPrev');
const nextBtn = document.getElementById('nxNext');
const countEl = document.getElementById('nxCount');
let current = 0;
const visited = new Set([0]);

slides.forEach((s, i) => {
  const li = document.createElement('li');
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'nx-dot';
  b.textContent = s.dataset.title;
  b.addEventListener('click', () => go(i));
  li.appendChild(b);
  dotsEl.appendChild(li);
});
const dots = [...dotsEl.querySelectorAll('.nx-dot')];

function go(i) {
  if (i < 0 || i >= slides.length || i === current) return;
  const dir = i > current ? 'enter-next' : 'enter-prev';
  slides[current].classList.remove('is-active', 'enter-next', 'enter-prev');
  onLeave(current);
  current = i;
  visited.add(i);
  const s = slides[i];
  s.classList.remove('enter-next', 'enter-prev');
  s.classList.add('is-active');
  void s.offsetWidth;
  s.classList.add(dir);
  updateNav();
  onEnter(i);
  const top = document.querySelector('.nx-nav').getBoundingClientRect().top;
  if (top < 0) window.scrollBy({ top: top - 12, behavior: REDUCED ? 'auto' : 'smooth' });
}

function updateNav() {
  dots.forEach((d, i) => {
    d.classList.toggle('is-active', i === current);
    d.classList.toggle('is-done', visited.has(i) && i !== current);
  });
  dots[current].scrollIntoView({ block: 'nearest', inline: 'nearest' });
  navFill.style.width = `${(current / (slides.length - 1)) * 100}%`;
  prevBtn.disabled = current === 0;
  nextBtn.disabled = current === slides.length - 1;
  countEl.textContent = `${current + 1} / ${slides.length}`;
}

prevBtn.addEventListener('click', () => go(current - 1));
nextBtn.addEventListener('click', () => go(current + 1));
document.querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', () => go(+b.dataset.go)));

document.addEventListener('keydown', (e) => {
  if (e.target.closest('input, textarea, select')) return;
  if (e.key === 'ArrowRight') go(current + 1);
  if (e.key === 'ArrowLeft') go(current - 1);
});

// Deslizar con el dedo (no se activa sobre simuladores ni controles)
let swipeStart = null;
const deck = document.getElementById('nxDeck');
deck.addEventListener('pointerdown', (e) => {
  if (e.pointerType !== 'touch' || e.target.closest('input, canvas, .nx-stage, button')) return;
  swipeStart = { x: e.clientX, y: e.clientY };
});
deck.addEventListener('pointerup', (e) => {
  if (!swipeStart) return;
  const dx = e.clientX - swipeStart.x;
  const dy = e.clientY - swipeStart.y;
  swipeStart = null;
  if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.5) go(current + (dx < 0 ? 1 : -1));
});

function onEnter(i) {
  const s = slides[i];
  if (s.classList.contains('nx-cover')) cover.start();
  if (s.querySelector('#fisionSvg')) buildFission();
  if (s.querySelector('#fusionSvg')) buildFusion();
  if (s.querySelector('#decaySvg')) playDecay(decayType);
  if (s.querySelector('#balanceEq')) renderBalance(balanceKey);
}
function onLeave(i) {
  if (slides[i].classList.contains('nx-cover')) cover.stop();
}

// ════════════════════════════════════════════════════════════════════════
//  PORTADA — partículas y dos núcleos a punto de chocar
// ════════════════════════════════════════════════════════════════════════

const cover = (() => {
  const canvas = document.getElementById('nxCoverCanvas');
  const ctx = canvas.getContext('2d');
  let w = 0, h = 0, raf = 0, t = 0;
  let sparks = [];

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    sparks = Array.from({ length: Math.round(Math.min(w, 900) / 6) }, spawn);
  }

  function center() {
    return w < 640 ? { x: w * 0.62, y: h * 0.26 } : { x: w * 0.72, y: h * 0.42 };
  }

  function spawn() {
    return {
      a: Math.random() * Math.PI * 2,
      r: 20 + Math.random() * 60,
      v: 0.006 + Math.random() * 0.018,
      grow: 0.25 + Math.random() * 1.1,
      tilt: (Math.random() - 0.5) * 1.6,
      hot: Math.random() < 0.65,
      size: 0.6 + Math.random() * 1.8,
    };
  }

  function sphere(x, y, r) {
    const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
    g.addColorStop(0, 'rgba(180,210,240,0.95)');
    g.addColorStop(0.45, 'rgba(40,60,90,0.95)');
    g.addColorStop(0.85, 'rgba(10,12,22,1)');
    g.addColorStop(1, 'rgba(150,200,255,0.6)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  function frame() {
    t += 1;
    const c = center();
    const R = Math.min(w, h) * (w < 640 ? 0.13 : 0.15);
    ctx.fillStyle = 'rgba(5,5,8,0.28)';
    ctx.fillRect(0, 0, w, h);

    ctx.globalCompositeOperation = 'lighter';
    for (const s of sparks) {
      s.a += s.v;
      s.r += s.grow;
      if (s.r > Math.max(w, h) * 0.7) Object.assign(s, spawn());
      const x = c.x + Math.cos(s.a) * s.r * 1.6;
      const y = c.y + Math.sin(s.a) * s.r * 0.55 + Math.cos(s.a) * s.r * s.tilt * 0.4;
      const fade = Math.max(0, 1 - s.r / (Math.max(w, h) * 0.7));
      ctx.fillStyle = s.hot ? `rgba(255,${140 + Math.random() * 60},60,${fade})` : `rgba(110,170,255,${fade})`;
      ctx.beginPath();
      ctx.arc(x, y, s.size, 0, Math.PI * 2);
      ctx.fill();
    }

    const glow = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, R * 2.2);
    const pulse = 0.55 + Math.sin(t * 0.05) * 0.2;
    glow.addColorStop(0, `rgba(255,200,120,${pulse})`);
    glow.addColorStop(1, 'rgba(255,120,40,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(c.x - R * 2.5, c.y - R * 2.5, R * 5, R * 5);
    ctx.globalCompositeOperation = 'source-over';

    const off = R * (0.62 + Math.sin(t * 0.03) * 0.06);
    sphere(c.x - off * 0.8, c.y + off * 0.45, R);
    sphere(c.x + off * 0.8, c.y - off * 0.45, R);

    if (!REDUCED) raf = requestAnimationFrame(frame);
  }

  return {
    start() {
      cancelAnimationFrame(raf);
      resize();
      ctx.fillStyle = '#050508';
      ctx.fillRect(0, 0, w, h);
      if (REDUCED) { for (let i = 0; i < 60; i++) frame(); } else frame();
    },
    stop() { cancelAnimationFrame(raf); },
    resize,
  };
})();

window.addEventListener('resize', () => {
  if (slides[current].classList.contains('nx-cover')) cover.start();
});

// ════════════════════════════════════════════════════════════════════════
//  FISIÓN
// ════════════════════════════════════════════════════════════════════════

const fisionSvg = document.getElementById('fisionSvg');
const fisionBtn = document.getElementById('fisionFire');
const fisionMsg = document.getElementById('fisionMsg');
let F = {};
// Cada reconstrucción invalida la animación en curso: si el alumno sale y
// vuelve a la diapositiva a media animación, la vieja no debe seguir
// moviendo los elementos del escenario nuevo.
let fisionRun = 0;

function buildFission() {
  fisionRun++;
  fisionSvg.innerHTML = '';
  F = {};
  F.uranium = obj(fisionSvg, 300, 175);
  drawNucleus(F.uranium, 24, 36, 64, 11);
  F.uLabel = obj(fisionSvg, 300, 175);
  isoLabel(F.uLabel, 'U', 235, 92, -8, 96, 22);
  caption(F.uLabel, 'Uranio-235', 0, 118);

  F.flash = obj(fisionSvg, 300, 175, 0);
  svgEl('circle', { r: 60, fill: 'url(#gFlash)' }, F.flash);

  F.ba = obj(fisionSvg, 300, 175, 0);
  drawNucleus(F.ba, 13, 19, 46, 3);
  F.kr = obj(fisionSvg, 300, 175, 0);
  drawNucleus(F.kr, 10, 13, 37, 5);

  // Etiquetas a la izquierda de cada fragmento para que no se encimen.
  F.baLabel = obj(fisionSvg, 480, 92, 0);
  isoLabel(F.baLabel, 'Ba', 141, 56, -110, 2, 20);
  caption(F.baLabel, 'Bario-141', -86, 22);
  F.krLabel = obj(fisionSvg, 470, 272, 0);
  isoLabel(F.krLabel, 'Kr', 92, 36, -100, 2, 20);
  caption(F.krLabel, 'Kriptón-92', -80, 22);

  F.outN = [0, 1, 2].map(() => {
    const n = obj(fisionSvg, 300, 175, 0);
    svgEl('circle', { r: 10, fill: 'url(#gNeutron)' }, n);
    return n;
  });

  F.energy = obj(fisionSvg, 300, 175, 0);
  svgEl('text', { x: -110, y: 8, 'text-anchor': 'middle', class: 'energy' }, F.energy).textContent = '¡≈ 200 MeV!';

  F.neutron = obj(fisionSvg, -24, 175);
  svgEl('circle', { r: 11, fill: 'url(#gNeutron)' }, F.neutron);
  caption(F.neutron, 'n', 0, -18);

  fisionBtn.disabled = false;
  fisionBtn.textContent = '🎯 Disparar neutrón';
  fisionMsg.className = 'nx-stage-msg';
  fisionMsg.textContent = 'Lanza un neutrón contra el núcleo de uranio.';
}

async function runFission() {
  if (fisionBtn.textContent.includes('Repetir')) { buildFission(); await wait(150); }
  const run = fisionRun;
  const alive = () => run === fisionRun;
  fisionBtn.disabled = true;
  fisionMsg.textContent = 'El neutrón viaja hacia el núcleo…';

  await anim(F.neutron, [{ transform: T(-24, 175) }, { transform: T(236, 175) }], 900, 'cubic-bezier(.5,0,1,1)');
  if (!alive()) return;
  F.neutron.style.opacity = 0;
  fisionMsg.textContent = 'El núcleo absorbe el neutrón y se vuelve inestable…';
  await anim(F.uranium, [
    { transform: T(300, 175) },
    { transform: T(300, 175, 1.1, 0.9) },
    { transform: T(300, 175, 0.92, 1.1) },
    { transform: T(300, 175, 1.15, 0.88) },
    { transform: T(300, 175, 1.32, 0.8) },
  ], 850);
  if (!alive()) return;

  F.uranium.style.opacity = 0;
  F.uLabel.style.opacity = 0;
  fisionMsg.className = 'nx-stage-msg is-good';
  fisionMsg.textContent = '💥 ¡Fisión! Se forman bario y kriptón, salen 3 neutrones y mucha energía.';

  const ease = 'cubic-bezier(.16,1,.3,1)';
  await Promise.all([
    anim(F.flash, [{ transform: T(300, 175, 0.3), opacity: 1 }, { transform: T(300, 175, 4.2), opacity: 0 }], 900, 'ease-out'),
    anim(F.ba, [{ transform: T(300, 175, 0.6), opacity: 0.4 }, { transform: T(480, 92), opacity: 1 }], 1100, ease),
    anim(F.kr, [{ transform: T(300, 175, 0.6), opacity: 0.4 }, { transform: T(470, 272), opacity: 1 }], 1100, ease),
    anim(F.outN[0], [{ transform: T(300, 175), opacity: 1 }, { transform: T(625, 175), opacity: 1 }], 1000, 'ease-out'),
    anim(F.outN[1], [{ transform: T(300, 175), opacity: 1 }, { transform: T(600, 30), opacity: 1 }], 1000, 'ease-out', 60),
    anim(F.outN[2], [{ transform: T(300, 175), opacity: 1 }, { transform: T(330, 345), opacity: 1 }], 1000, 'ease-out', 120),
    anim(F.energy, [{ transform: T(300, 175, 0.4), opacity: 0 }, { transform: T(300, 175, 1.15), opacity: 1 }, { transform: T(300, 175, 1), opacity: 1 }], 700, 'ease-out', 150),
  ]);
  if (!alive()) return;
  await Promise.all([
    anim(F.baLabel, [{ opacity: 0 }, { opacity: 1 }], 400),
    anim(F.krLabel, [{ opacity: 0 }, { opacity: 1 }], 400),
  ]);
  if (!alive()) return;

  fisionBtn.disabled = false;
  fisionBtn.textContent = '↻ Repetir';
}
fisionBtn.addEventListener('click', runFission);

// ════════════════════════════════════════════════════════════════════════
//  FUSIÓN
// ════════════════════════════════════════════════════════════════════════

const fusionSvg = document.getElementById('fusionSvg');
const fusionBtn = document.getElementById('fusionGo');
const fusionMsg = document.getElementById('fusionMsg');
let U = {};
let fusionRun = 0;   // mismo mecanismo que en fisión

function buildFusion() {
  fusionRun++;
  fusionSvg.innerHTML = '';
  U = {};
  U.glow = obj(fusionSvg, 300, 180, 0);
  svgEl('circle', { r: 90, fill: 'url(#gGlow)' }, U.glow);

  U.d = obj(fusionSvg, 70, 85);
  drawNucleus(U.d, 1, 1, 22, 2);
  isoLabel(U.d, 'H', 2, 1, -6, 50, 18);
  caption(U.d, 'Deuterio', 0, 70);

  U.t = obj(fusionSvg, 70, 275);
  drawNucleus(U.t, 1, 2, 26, 9);
  isoLabel(U.t, 'H', 3, 1, -6, -40, 18);
  caption(U.t, 'Tritio', 0, -62);

  U.flash = obj(fusionSvg, 300, 180, 0);
  svgEl('circle', { r: 50, fill: 'url(#gFlash)' }, U.flash);

  U.he = obj(fusionSvg, 300, 180, 0);
  drawNucleus(U.he, 2, 2, 28, 4);
  U.heLabel = obj(fusionSvg, 520, 85, 0);
  isoLabel(U.heLabel, 'He', 4, 2, -4, -38, 18);
  caption(U.heLabel, 'Helio', 8, 52);

  U.n = obj(fusionSvg, 300, 180, 0);
  svgEl('circle', { r: 13, fill: 'url(#gNeutron)' }, U.n);
  U.nLabel = obj(fusionSvg, 545, 290, 0);
  caption(U.nLabel, 'n · Neutrón', 0, 36);

  U.energy = obj(fusionSvg, 560, 182, 0);
  const star = svgEl('g', {}, U.energy);
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    const r1 = 12, r2 = i % 2 ? 26 : 38;
    svgEl('line', { x1: Math.cos(a) * r1, y1: Math.sin(a) * r1, x2: Math.cos(a) * r2, y2: Math.sin(a) * r2, stroke: '#FFD43B', 'stroke-width': 4, 'stroke-linecap': 'round' }, star);
  }
  svgEl('circle', { r: 14, fill: '#FFE873' }, U.energy);
  svgEl('text', { x: 0, y: 64, 'text-anchor': 'middle', class: 'energy' }, U.energy).textContent = '17.6 MeV';

  fusionBtn.disabled = false;
  fusionMsg.className = 'nx-stage-msg';
  fusionMsg.textContent = 'Lanza el deuterio y el tritio uno contra otro.';
}

async function runFusion() {
  buildFusion();
  const run = fusionRun;
  const alive = () => run === fusionRun;
  fusionBtn.disabled = true;
  fusionMsg.className = 'nx-stage-msg';
  fusionMsg.textContent = 'Los núcleos se lanzan uno contra otro…';
  const dur = 1100;

  await Promise.all([
    anim(U.d, [{ transform: T(70, 85) }, { transform: T(288, 172) }], dur, 'cubic-bezier(.5,0,1,1)'),
    anim(U.t, [{ transform: T(70, 275) }, { transform: T(310, 190) }], dur, 'cubic-bezier(.5,0,1,1)'),
    anim(U.glow, [{ transform: T(300, 180, 0.3), opacity: 0 }, { transform: T(300, 180, 1), opacity: 1 }], dur),
  ]);
  if (!alive()) return;
  U.d.style.opacity = 0;
  U.t.style.opacity = 0;
  fusionMsg.className = 'nx-stage-msg is-good';
  fusionMsg.textContent = '🌞 ¡Fusión! Se forma helio, sale un neutrón y se liberan 17.6 MeV.';

  const ease = 'cubic-bezier(.16,1,.3,1)';
  await Promise.all([
    anim(U.flash, [{ transform: T(300, 180, 0.3), opacity: 1 }, { transform: T(300, 180, 4), opacity: 0 }], 900, 'ease-out'),
    anim(U.glow, [{ opacity: 1 }, { opacity: 0 }], 1200),
    anim(U.he, [{ transform: T(300, 180, 0.5), opacity: 1 }, { transform: T(520, 85), opacity: 1 }], 1100, ease, 100),
    anim(U.n, [{ transform: T(300, 180, 0.5), opacity: 1 }, { transform: T(545, 290), opacity: 1 }], 1100, ease, 100),
    anim(U.energy, [{ transform: T(560, 182, 0.2) + ' rotate(-40deg)', opacity: 0 }, { transform: T(560, 182, 1) + ' rotate(0deg)', opacity: 1 }], 900, ease, 250),
  ]);
  if (!alive()) return;
  await Promise.all([
    anim(U.heLabel, [{ opacity: 0 }, { opacity: 1 }], 400),
    anim(U.nLabel, [{ opacity: 0 }, { opacity: 1 }], 400),
  ]);
  if (!alive()) return;
  fusionBtn.disabled = false;
}
fusionBtn.addEventListener('click', runFusion);

// ════════════════════════════════════════════════════════════════════════
//  DESINTEGRACIÓN RADIACTIVA
// ════════════════════════════════════════════════════════════════════════

const decaySvg = document.getElementById('decaySvg');
const decayInfo = document.getElementById('decayInfo');
let decayType = 'alpha';
let decayRun = 0;

const DECAY_INFO = {
  alpha: `<strong>Desintegración alfa (α):</strong> el núcleo expulsa un "paquete" de <strong>2 protones y 2 neutrones</strong> (un núcleo de helio). Pierde 4 nucleones y 2 protones, así que se convierte en otro elemento.
    <br><span class="nx-eq"><sup>240</sup>Pu → <sup>236</sup>U + <sup>4</sup>He (partícula alfa)</span>`,
  beta: `<strong>Desintegración beta (β⁺):</strong> dentro del núcleo un <strong>protón se convierte en neutrón</strong> y se emiten un <strong>positrón (e⁺)</strong> y un <strong>neutrino electrónico</strong>. Los nucleones no cambian (22), pero hay un protón menos.
    <br><span class="nx-eq"><sup>22</sup>Na → <sup>22</sup>Ne + e⁺ + neutrino</span><br>También existe la beta⁻: un neutrón se vuelve protón y sale un electrón.<br>🧠 ¿Recuerdas el <strong>diagnóstico por imágenes</strong> del inicio? La tomografía <strong>PET</strong> usa núcleos que emiten positrones (β⁺) para ver cómo funcionan órganos como el cerebro.`,
  gamma: `<strong>Desintegración gamma (γ):</strong> el núcleo queda "excitado" (con energía de sobra) y la libera como <strong>radiación electromagnética</strong> muy energética. <strong>No cambia</strong> su número de protones ni de neutrones: solo pierde energía. Suele acompañar a las desintegraciones alfa y beta.`,
};

async function playDecay(type) {
  const run = ++decayRun;
  decayType = type;
  decayInfo.innerHTML = DECAY_INFO[type];
  document.querySelectorAll('#decayTabs .nx-tab').forEach((t) => t.classList.toggle('is-active', t.dataset.decay === type));
  decaySvg.innerHTML = '';
  const alive = () => run === decayRun;
  const shake = (g, x, y) => anim(g, [
    { transform: T(x, y) }, { transform: T(x - 5, y + 2) }, { transform: T(x + 5, y - 2) },
    { transform: T(x - 4, y) }, { transform: T(x + 3, y + 1) }, { transform: T(x, y) },
  ], 600);

  if (type === 'alpha') {
    const parent = obj(decaySvg, 190, 135);
    drawNucleus(parent, 22, 34, 62, 21);
    const lab = obj(decaySvg, 190, 135);
    const l1 = isoLabel(lab, 'Pu', 240, 94, -10, -78, 20);
    const l2 = isoLabel(lab, 'U', 236, 92, -6, -78, 20);
    l2.style.opacity = 0;
    const alpha = obj(decaySvg, 190, 135, 0);
    drawNucleus(alpha, 2, 2, 20, 4);
    const aLab = obj(decaySvg, 470, 225, 0);
    isoLabel(aLab, 'He', 4, 2, 34, 6, 18);
    caption(aLab, 'Partícula alfa', 10, 48);
    await wait(400); if (!alive()) return;
    await shake(parent, 190, 135); if (!alive()) return;
    await Promise.all([
      anim(alpha, [{ transform: T(205, 145, 0.6), opacity: 1 }, { transform: T(470, 225), opacity: 1 }], 1000, 'cubic-bezier(.16,1,.3,1)'),
      anim(l1, [{ opacity: 1 }, { opacity: 0 }], 400, 'ease', 300),
      anim(l2, [{ opacity: 0 }, { opacity: 1 }], 400, 'ease', 500),
      anim(parent, [{ transform: T(190, 135, 1) }, { transform: T(190, 135, 0.94) }], 600, 'ease', 200),
    ]);
    if (alive()) anim(aLab, [{ opacity: 0 }, { opacity: 1 }], 400);
  }

  if (type === 'beta') {
    const parent = obj(decaySvg, 190, 130);
    drawNucleus(parent, 11, 11, 52, 31);
    const lab = obj(decaySvg, 190, 130);
    const l1 = isoLabel(lab, 'Na', 22, 11, -14, -66, 20);
    const l2 = isoLabel(lab, 'Ne', 22, 10, -14, -66, 20);
    l2.style.opacity = 0;
    const pos = obj(decaySvg, 190, 130, 0);
    svgEl('circle', { r: 9, fill: 'url(#gPositron)' }, pos);
    caption(pos, 'e⁺ positrón', 0, 30);
    const nu = obj(decaySvg, 190, 130, 0);
    svgEl('circle', { r: 13, fill: 'url(#gNeutrino)' }, nu);
    caption(nu, 'neutrino electrónico', 0, 34);
    await wait(400); if (!alive()) return;
    await shake(parent, 190, 130); if (!alive()) return;
    await Promise.all([
      anim(pos, [{ transform: T(190, 140), opacity: 1 }, { transform: T(215, 248), opacity: 1 }], 900, 'cubic-bezier(.16,1,.3,1)'),
      anim(nu, [{ transform: T(200, 140), opacity: 1 }, { transform: T(500, 225), opacity: 1 }], 1100, 'cubic-bezier(.16,1,.3,1)', 120),
      anim(l1, [{ opacity: 1 }, { opacity: 0 }], 400, 'ease', 300),
      anim(l2, [{ opacity: 0 }, { opacity: 1 }], 400, 'ease', 500),
    ]);
  }

  if (type === 'gamma') {
    const glow = obj(decaySvg, 190, 150);
    svgEl('circle', { r: 110, fill: 'url(#gGlow)' }, glow);
    const parent = obj(decaySvg, 190, 150);
    drawNucleus(parent, 20, 24, 58, 17);
    caption(obj(decaySvg, 190, 150), 'Núcleo excitado', 0, 88);
    let d = 'M 250 150';
    for (let x = 0; x <= 360; x += 4) {
      const amp = 28 * Math.max(0.25, 1 - x / 460);
      d += ` L ${250 + x} ${150 + Math.sin(x / 11) * amp}`;
    }
    const wave = svgEl('path', { d, fill: 'none', stroke: '#FFE873', 'stroke-width': 4, 'stroke-linecap': 'round' }, decaySvg);
    const len = wave.getTotalLength();
    wave.style.strokeDasharray = len;
    wave.style.strokeDashoffset = len;
    wave.style.filter = 'drop-shadow(0 0 6px #FFE873)';
    const gl = obj(decaySvg, 560, 100, 0);
    svgEl('text', { x: 0, y: 0, 'text-anchor': 'middle', 'font-size': 30, 'font-weight': 900, fill: '#FFE873' }, gl).textContent = 'γ';
    await anim(glow, [{ opacity: 0.4 }, { opacity: 1 }, { opacity: 0.6 }, { opacity: 1 }], 1000); if (!alive()) return;
    await shake(parent, 190, 150); if (!alive()) return;
    await Promise.all([
      anim(wave, [{ strokeDashoffset: len }, { strokeDashoffset: 0 }], 1100, 'ease-out'),
      anim(glow, [{ opacity: 1 }, { opacity: 0.1 }], 1200),
      anim(gl, [{ opacity: 0 }, { opacity: 1 }], 400, 'ease', 800),
    ]);
  }
}

document.querySelectorAll('#decayTabs .nx-tab').forEach((t) => t.addEventListener('click', () => playDecay(t.dataset.decay)));
document.getElementById('decayReplay').addEventListener('click', () => playDecay(decayType));

// ── Poder de penetración ────────────────────────────────────────────────

const shieldGrid = document.getElementById('shieldGrid');
const shieldMsg = document.createElement('p');
shieldMsg.className = 'nx-shield-msg';
shieldGrid.after(shieldMsg);
const STOPS = { alpha: 'paper', beta: 'al', gamma: 'pb' };
const STOP_TEXT = {
  alpha: 'α: la detiene una <strong>hoja de papel</strong> (o la piel).',
  beta: 'β: atraviesa el papel, pero la frena una <strong>lámina de aluminio</strong>.',
  gamma: 'γ: atraviesa papel y aluminio; se necesita <strong>plomo o concreto grueso</strong> para reducirla.',
};

document.getElementById('shieldFire').addEventListener('click', async () => {
  shieldMsg.innerHTML = '';
  const rows = [...shieldGrid.querySelectorAll('.nx-shield-row')];
  await Promise.all(rows.map(async (row, i) => {
    const type = row.dataset.type;
    const shot = row.querySelector('.nx-shot');
    const wall = row.querySelector(`.nx-wall--${STOPS[type]}`);
    row.classList.remove('is-hit');
    row.querySelectorAll('.nx-wall').forEach((wl) => wl.classList.toggle('is-stopper', wl === wall));
    const stop = wall.offsetLeft - shot.offsetWidth;
    await anim(shot, [{ left: '4px', opacity: 1 }, { left: `${stop}px`, opacity: 1 }], 600 + i * 350, 'linear', i * 150);
    row.classList.add('is-hit');
    shieldMsg.innerHTML += (shieldMsg.innerHTML ? '<br>' : '') + STOP_TEXT[type];
  }));
});

// ════════════════════════════════════════════════════════════════════════
//  CONSERVACIÓN DE NUCLEONES — balanza
// ════════════════════════════════════════════════════════════════════════

const BALANCE = {
  fision: {
    html: '<sup>235</sup>U + n → <sup>141</sup>Ba + <sup>92</sup>Kr + 3n',
    left:  { A: [235, 1], Z: [92, 0] },
    right: { A: [141, 92, 3], Z: [56, 36, 0] },
  },
  fusion: {
    html: '<sup>2</sup>H + <sup>3</sup>H → <sup>4</sup>He + n',
    left:  { A: [2, 3], Z: [1, 1] },
    right: { A: [4, 1], Z: [2, 0] },
  },
  alpha: {
    html: '<sup>238</sup>U → <sup>234</sup>Th + α (<sup>4</sup>He)',
    left:  { A: [238], Z: [92] },
    right: { A: [234, 4], Z: [90, 2] },
  },
};
let balanceKey = 'fision';
let balanceRun = 0;
const beam = document.getElementById('scaleBeam');
const panL = document.getElementById('panLeftNum');
const panR = document.getElementById('panRightNum');
const tallyA = document.getElementById('tallyA');
const tallyZ = document.getElementById('tallyZ');
const balanceBtn = document.getElementById('balanceGo');
const sum = (a) => a.reduce((x, y) => x + y, 0);

function renderBalance(key) {
  balanceRun++;
  balanceKey = key;
  document.querySelectorAll('#balanceTabs .nx-tab').forEach((t) => t.classList.toggle('is-active', t.dataset.eq === key));
  document.getElementById('balanceEq').innerHTML = BALANCE[key].html;
  beam.style.transform = 'rotate(0deg)';
  panL.textContent = '?';
  panR.textContent = '?';
  tallyA.textContent = '—';
  tallyZ.textContent = '—';
  tallyA.classList.remove('is-ok');
  tallyZ.classList.remove('is-ok');
  balanceBtn.disabled = false;
}

function countUp(node, to, ms, run) {
  return new Promise((resolve) => {
    const t0 = performance.now();
    const tick = (now) => {
      if (run !== balanceRun) return resolve();
      const p = Math.min(1, (now - t0) / (ms * SPEED));
      node.textContent = Math.round(to * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(tick); else resolve();
    };
    requestAnimationFrame(tick);
  });
}

balanceBtn.addEventListener('click', async () => {
  const run = ++balanceRun;
  const d = BALANCE[balanceKey];
  balanceBtn.disabled = true;
  panR.textContent = '0';
  const la = sum(d.left.A), ra = sum(d.right.A), lz = sum(d.left.Z), rz = sum(d.right.Z);
  beam.style.transform = 'rotate(0deg)';
  await countUp(panL, la, 900, run);
  if (run !== balanceRun) return;
  beam.style.transform = 'rotate(-12deg)';
  tallyA.textContent = `${d.left.A.join(' + ')} = ${la}  →  …`;
  await wait(700);
  await countUp(panR, ra, 1100, run);
  if (run !== balanceRun) return;
  beam.style.transform = 'rotate(0deg)';
  tallyA.textContent = `${la} = ${ra} ✅`;
  tallyZ.textContent = `${lz} = ${rz} ✅`;
  tallyA.classList.add('is-ok');
  tallyZ.classList.add('is-ok');
  balanceBtn.disabled = false;
});

document.querySelectorAll('#balanceTabs .nx-tab').forEach((t) => t.addEventListener('click', () => renderBalance(t.dataset.eq)));

// ════════════════════════════════════════════════════════════════════════
//  RETO
// ════════════════════════════════════════════════════════════════════════

const FILL = [
  { html: '<sup>235</sup>U + n → <sup>141</sup>Ba + <sup>[?]</sup>Kr + 3n', ans: 92, why: '235 + 1 = 236 nucleones → 236 − 141 − 3 = 92' },
  { html: '<sup>2</sup>H + <sup>3</sup>H → <sup>[?]</sup>He + n', ans: 4, why: '2 + 3 = 5 nucleones → 5 − 1 = 4' },
  { html: '<sup>238</sup>U → <sup>[?]</sup>Th + α', ans: 234, why: 'La partícula α tiene 4 nucleones → 238 − 4 = 234' },
];

const SORT = [
  { text: 'Divide núcleos pesados como el uranio-235.', ans: 'Fisión' },
  { text: 'Une núcleos ligeros como el hidrógeno.', ans: 'Fusión' },
  { text: 'Es el proceso que alimenta al Sol.', ans: 'Fusión' },
  { text: 'Se usa en los reactores nucleares y en las armas atómicas.', ans: 'Fisión' },
  { text: 'Un núcleo inestable emite α, β o γ por sí solo.', ans: 'Desintegración' },
  { text: '²³⁸U → ²³⁴Th + α', ans: 'Desintegración' },
  { text: 'Una de las fuentes más prometedoras de energía limpia.', ans: 'Fusión' },
  { text: 'Un neutrón parte un núcleo y libera 3 neutrones más.', ans: 'Fisión' },
];

const fillState = FILL.map(() => false);
const sortState = SORT.map(() => null);
const scoreEl = document.getElementById('quizScore');
const fillList = document.getElementById('fillList');
const sortList = document.getElementById('sortList');

FILL.forEach((item, i) => {
  const row = document.createElement('div');
  row.className = 'nx-fill-row';
  row.innerHTML = `<span class="nx-eq">${item.html.replace('[?]', `<input type="text" inputmode="numeric" maxlength="3" aria-label="Número de masa faltante">`)}</span><span class="nx-feedback"></span>`;
  const input = row.querySelector('input');
  const fb = row.querySelector('.nx-feedback');
  const check = () => {
    const v = input.value.trim();
    if (!v) return;
    row.classList.remove('is-ok', 'is-bad');
    void row.offsetWidth;
    if (+v === item.ans) {
      row.classList.add('is-ok');
      fb.textContent = `✅ ¡Correcto! ${item.why}`;
      input.disabled = true;
      fillState[i] = true;
      updateScore();
    } else {
      row.classList.add('is-bad');
      fb.textContent = '❌ Revisa la suma de nucleones.';
    }
  };
  input.addEventListener('input', () => {
    input.value = input.value.replace(/\D/g, '');
    if (input.value.length >= String(item.ans).length) check();
  });
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') check(); });
  fillList.appendChild(row);
});

const OPTIONS = ['Fisión', 'Fusión', 'Desintegración'];
SORT.forEach((item, i) => {
  const card = document.createElement('div');
  card.className = 'nx-card';
  card.innerHTML = `<p>${item.text}</p><div class="nx-card-opts">${OPTIONS.map((o) => `<button type="button" data-opt="${o}">${o}</button>`).join('')}</div>`;
  card.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
    if (sortState[i] !== null) return;
    const ok = b.dataset.opt === item.ans;
    sortState[i] = ok;
    card.classList.add(ok ? 'is-ok' : 'is-bad');
    card.querySelectorAll('button').forEach((x) => {
      x.disabled = true;
      if (x.dataset.opt === item.ans) x.classList.add('is-picked-ok');
      else if (x === b) x.classList.add('is-picked-bad');
    });
    updateScore();
  }));
  sortList.appendChild(card);
});

function updateScore() {
  const fillDone = fillState.filter(Boolean).length;
  const sortDone = sortState.filter((s) => s !== null).length;
  const sortOk = sortState.filter((s) => s === true).length;
  const total = FILL.length + SORT.length;
  const got = fillDone + sortOk;
  if (fillDone === FILL.length && sortDone === SORT.length) {
    scoreEl.innerHTML = got === total
      ? `🏆 <strong>${got} / ${total}</strong> — ¡Perfecto! Dominas la energía nuclear.`
      : `⭐ <strong>${got} / ${total}</strong> — ¡Bien hecho! Repasa las diapositivas para lo que falló.`;
    confetti();
  } else {
    scoreEl.innerHTML = `Progreso: <strong>${fillDone + sortDone} / ${total}</strong> respondidas`;
  }
}
updateScore();

function confetti() {
  if (REDUCED) return;
  const box = document.getElementById('nxConfetti');
  const colors = ['#E2F897', '#C07CFF', '#2EE6A0', '#FFB1D2', '#A9F8FB', '#FF8A3D'];
  for (let i = 0; i < 90; i++) {
    const p = document.createElement('i');
    p.style.left = `${Math.random() * 100}%`;
    p.style.background = colors[i % colors.length];
    p.style.animationDuration = `${1.8 + Math.random() * 1.8}s`;
    p.style.animationDelay = `${Math.random() * 0.4}s`;
    p.style.transform = `rotate(${Math.random() * 360}deg)`;
    box.appendChild(p);
    setTimeout(() => p.remove(), 4500);
  }
}

// ── INIT ─────────────────────────────────────────────────────────────────

slides[0].classList.add('is-active');
updateNav();
cover.start();
buildFission();
buildFusion();
