// ── DATA ──────────────────────────────────────────────────────────────────
// Mismos 5 pares del widget de Interacty original.

const PAIRS = [
  {
    id: 'ausencia',
    icon: '🏚️',
    situacion: 'Ausencia del Estado en comunidades',
    consecuencia: 'Aumento del crimen y el narcotráfico',
  },
  {
    id: 'desigualdad',
    icon: '💰',
    situacion: 'Desigualdad económica',
    consecuencia: 'Concentración de la riqueza en pocos grupos',
  },
  {
    id: 'gasto',
    icon: '✂️',
    situacion: 'Reducción del gasto público',
    consecuencia: 'Escuelas sin infraestructura, hospitales saturados',
  },
  {
    id: 'privatizacion',
    icon: '🔒',
    situacion: 'Privatización de servicios',
    consecuencia: 'Aumento de costos, exclusión social',
  },
  {
    id: 'ambiente',
    icon: '🌳',
    situacion: 'Falta de políticas medioambientales',
    consecuencia: 'Contaminación, pérdida de recursos naturales',
  },
];

// ── ESTADO ────────────────────────────────────────────────────────────────

let flipped = [];
let locked = false;
let matchedCount = 0;

const grid    = document.getElementById('memGrid');
const counter = document.getElementById('memCounter');
const winBox  = document.getElementById('memWin');
const resetBtn = document.getElementById('memReset');

// ── HELPERS ───────────────────────────────────────────────────────────────

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildDeck() {
  const deck = [];
  PAIRS.forEach(p => {
    deck.push({ pairId: p.id, type: 'situacion', text: p.situacion, icon: p.icon });
    deck.push({ pairId: p.id, type: 'consecuencia', text: p.consecuencia, icon: p.icon });
  });
  return shuffle(deck);
}

// ── RENDER ────────────────────────────────────────────────────────────────

function renderBoard() {
  grid.innerHTML = '';
  const deck = buildDeck();

  deck.forEach((card, i) => {
    const el = document.createElement('div');
    el.className = 'mem-card';
    el.dataset.pair = card.pairId;
    el.dataset.type = card.type;
    el.style.animationDelay = `${i * 0.04}s`;

    const label = card.type === 'situacion' ? 'Situación' : 'Consecuencia';

    el.innerHTML = `
      <div class="mem-card-inner">
        <div class="mem-card-face mem-card-back">❓</div>
        <div class="mem-card-face mem-card-front">
          <span class="mem-card-tag">${label}</span>
          <span class="mem-card-icon">${card.icon}</span>
          <span class="mem-card-text">${card.text}</span>
        </div>
      </div>
    `;

    el.addEventListener('click', () => onCardClick(el));
    grid.appendChild(el);
  });
}

function updateCounter() {
  counter.textContent = `${matchedCount} de ${PAIRS.length} pares encontrados`;
}

// ── LÓGICA DEL JUEGO ─────────────────────────────────────────────────────

function onCardClick(el) {
  if (locked) return;
  if (el.classList.contains('is-flipped') || el.classList.contains('is-matched')) return;
  if (flipped.length === 2) return;

  el.classList.add('is-flipped');
  flipped.push(el);

  if (flipped.length === 2) {
    locked = true;
    const [a, b] = flipped;
    const isMatch = a.dataset.pair === b.dataset.pair && a.dataset.type !== b.dataset.type;

    if (isMatch) {
      setTimeout(() => {
        a.classList.remove('is-flipped');
        b.classList.remove('is-flipped');
        a.classList.add('is-matched');
        b.classList.add('is-matched');
        matchedCount++;
        updateCounter();
        flipped = [];
        locked = false;

        if (matchedCount === PAIRS.length) {
          setTimeout(() => winBox.classList.add('is-visible'), 400);
        }
      }, 350);
    } else {
      a.classList.add('is-wrong');
      b.classList.add('is-wrong');
      setTimeout(() => {
        a.classList.remove('is-flipped', 'is-wrong');
        b.classList.remove('is-flipped', 'is-wrong');
        flipped = [];
        locked = false;
      }, 750);
    }
  }
}

// ── INIT / RESET ─────────────────────────────────────────────────────────

function startGame() {
  flipped = [];
  locked = false;
  matchedCount = 0;
  winBox.classList.remove('is-visible');
  updateCounter();
  renderBoard();
}

resetBtn.addEventListener('click', startGame);

startGame();
