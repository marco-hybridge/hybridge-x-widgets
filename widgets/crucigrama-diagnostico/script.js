// ── DATA ──────────────────────────────────────────────────────────────────
// Mismas 10 palabras, posiciones y pistas del crucigrama original de Interacty.

const WORDS = [
  { num: 1,  dir: 'across', row: 0,  col: 4,  answer: 'PERFIL',
    clue: 'Representación de un usuario en una red social o plataforma digital; incluye datos, fotos, intereses y otra información personal.' },
  { num: 2,  dir: 'down',   row: 0,  col: 5,  answer: 'ECOMMERCE',
    clue: 'Forma de comercio que se realiza a través de internet, donde se pueden comprar y vender productos o servicios sin salir de casa.' },
  { num: 3,  dir: 'across', row: 3,  col: 4,  answer: 'AMAZON',
    clue: 'Sitio web muy conocido para comprar y vender productos en línea a nivel internacional.' },
  { num: 4,  dir: 'down',   row: 4,  col: 1,  answer: 'TIKTOK',
    clue: 'Red social que permite a los usuarios crear, ver y compartir videos cortos, con música, efectos y filtros.' },
  { num: 5,  dir: 'down',   row: 5,  col: 10, answer: 'FORO',
    clue: 'Grupo de personas que interactúan en un espacio digital con intereses comunes, compartiendo ideas, contenidos o actividades.' },
  { num: 6,  dir: 'down',   row: 6,  col: 12, answer: 'YOUTUBE',
    clue: 'Plataforma que permite subir, ver y compartir videos; es muy utilizada para aprender, entretenerse y crear contenido.' },
  { num: 7,  dir: 'across', row: 7,  col: 5,  answer: 'CLASSROOM',
    clue: 'Herramienta educativa de Google que permite organizar clases, asignar tareas y comunicarse con los estudiantes de forma virtual.' },
  { num: 8,  dir: 'across', row: 8,  col: 0,  answer: 'MOODLE',
    clue: 'Plataforma educativa en línea que permite a los profesores crear cursos, actividades y recursos para el aprendizaje a distancia.' },
  { num: 9,  dir: 'across', row: 10, col: 8,  answer: 'INFLUENCER',
    clue: 'Persona con gran presencia y credibilidad en redes sociales, capaz de influir en la opinión o decisiones de sus seguidores.' },
  { num: 10, dir: 'down',   row: 10, col: 17, answer: 'RRSS',
    clue: 'Siglas que se usan para referirse a las Redes Sociales.' },
];

// ── CONSTRUIR EL MAPA DE CELDAS A PARTIR DE LAS PALABRAS ────────────────

const cellMap = new Map(); // "r,c" -> { row, col, letter, number, across, down }
let maxRow = 0, maxCol = 0, minRow = Infinity, minCol = Infinity;

WORDS.forEach((word, wIndex) => {
  for (let i = 0; i < word.answer.length; i++) {
    const r = word.dir === 'down' ? word.row + i : word.row;
    const c = word.dir === 'across' ? word.col + i : word.col;
    const key = `${r},${c}`;
    let cell = cellMap.get(key);
    if (!cell) {
      cell = { row: r, col: c, letter: word.answer[i], across: null, down: null, number: null };
      cellMap.set(key, cell);
    }
    cell[word.dir] = wIndex;
    if (i === 0) cell.number = word.num;
    maxRow = Math.max(maxRow, r); minRow = Math.min(minRow, r);
    maxCol = Math.max(maxCol, c); minCol = Math.min(minCol, c);
  }
});

const nRows = maxRow - minRow + 1;
const nCols = maxCol - minCol + 1;

// ── ESTADO ────────────────────────────────────────────────────────────────

let selected = null;     // "r,c"
let direction = 'across';
const solved = new Set(); // word.num de palabras ya resueltas

const grid       = document.getElementById('cwGrid');
const counter    = document.getElementById('cwCounter');
const acrossList = document.getElementById('cwAcrossList');
const downList   = document.getElementById('cwDownList');
const checkBtn   = document.getElementById('cwCheck');
const resetBtn   = document.getElementById('cwReset');
const winOverlay = document.getElementById('cwWinOverlay');
const winClose   = document.getElementById('cwWinClose');
const winAgainBtn = document.getElementById('cwWinAgain');
const tooltip    = document.getElementById('cwTooltip');

// ── RENDER DEL TABLERO ───────────────────────────────────────────────────

function renderGrid() {
  grid.innerHTML = '';
  grid.style.gridTemplateColumns = `repeat(${nCols}, var(--cw-cell))`;
  grid.style.gridTemplateRows = `repeat(${nRows}, var(--cw-cell))`;

  let delayIndex = 0;
  for (let r = minRow; r <= maxRow; r++) {
    for (let c = minCol; c <= maxCol; c++) {
      const cell = cellMap.get(`${r},${c}`);
      if (!cell) {
        const blank = document.createElement('div');
        blank.className = 'cw-blank';
        grid.appendChild(blank);
        continue;
      }
      const box = document.createElement('div');
      box.className = 'cw-cell';
      box.dataset.key = `${r},${c}`;
      box.style.animationDelay = `${delayIndex * 0.012}s`;
      delayIndex++;

      if (cell.number) {
        const badge = document.createElement('span');
        badge.className = 'cw-cell-num';
        badge.textContent = cell.number;
        box.appendChild(badge);
      }

      const input = document.createElement('input');
      input.type = 'text';
      input.maxLength = 1;
      input.autocomplete = 'off';
      input.spellcheck = false;
      input.inputMode = 'text';
      input.setAttribute('aria-label', `Casilla fila ${r + 1}, columna ${c + 1}`);
      box.appendChild(input);

      box.addEventListener('click', () => {
        // Clic real sobre la celda ya seleccionada → alterna dirección.
        // (El .focus() disparado por selectCell() abajo NO pasa por aquí,
        // así que esto nunca se activa como efecto secundario del código.)
        if (selected === `${r},${c}`) toggleDirectionAt(r, c);
        else selectCell(r, c);
      });
      input.addEventListener('focus', () => selectCell(r, c));
      input.addEventListener('input', () => onInput(r, c));
      input.addEventListener('keydown', (e) => onKeyDown(e, r, c));

      box.addEventListener('mouseenter', () => showTooltip(box, cell));
      box.addEventListener('mouseleave', hideTooltip);

      grid.appendChild(box);
    }
  }
}

// ── TOOLTIP DE PISTA AL PASAR EL MOUSE ───────────────────────────────────

function showTooltip(cellEl, cell) {
  const parts = [];
  if (cell.across !== null) {
    const w = WORDS[cell.across];
    parts.push(`<div class="cw-tooltip-part"><span class="cw-tooltip-dir cw-tooltip-dir--across">➡️ Horizontal ${w.num}</span><span class="cw-tooltip-text">${w.clue}</span></div>`);
  }
  if (cell.down !== null) {
    const w = WORDS[cell.down];
    parts.push(`<div class="cw-tooltip-part"><span class="cw-tooltip-dir cw-tooltip-dir--down">⬇️ Vertical ${w.num}</span><span class="cw-tooltip-text">${w.clue}</span></div>`);
  }
  if (!parts.length) return;

  tooltip.innerHTML = parts.join('');
  tooltip.classList.add('is-visible');

  const cellRect = cellEl.getBoundingClientRect();
  const tipRect = tooltip.getBoundingClientRect();
  const margin = 8;

  let left = cellRect.left + cellRect.width / 2 - tipRect.width / 2;
  left = Math.max(margin, Math.min(left, window.innerWidth - tipRect.width - margin));

  let top = cellRect.top - tipRect.height - margin;
  if (top < margin) top = cellRect.bottom + margin; // no cabe arriba → abajo

  tooltip.style.left = `${left}px`;
  tooltip.style.top = `${top}px`;
}

function hideTooltip() {
  tooltip.classList.remove('is-visible');
}

// ── RENDER DE PISTAS ──────────────────────────────────────────────────────

function renderClues() {
  const across = WORDS.filter(w => w.dir === 'across').sort((a, b) => a.num - b.num);
  const down = WORDS.filter(w => w.dir === 'down').sort((a, b) => a.num - b.num);

  const li = (w) => `<li data-num="${w.num}"><strong>${w.num}.</strong> ${w.clue}</li>`;

  acrossList.innerHTML = across.map(li).join('');
  downList.innerHTML = down.map(li).join('');

  [...acrossList.children, ...downList.children].forEach(el => {
    el.addEventListener('click', () => {
      const word = WORDS.find(w => w.num === parseInt(el.dataset.num, 10));
      selectCell(word.row, word.col, word.dir);
    });
  });
}

// ── SELECCIÓN Y RESALTADO ────────────────────────────────────────────────

function wordAt(cell, dir) {
  const idx = cell[dir];
  return idx === null ? null : WORDS[idx];
}

function selectCell(r, c, preferDir) {
  const key = `${r},${c}`;
  const cell = cellMap.get(key);
  if (!cell) return;

  selected = key;
  if (preferDir && cell[preferDir] !== null) {
    // Dirección pedida explícitamente (p. ej. al tocar una pista).
    direction = preferDir;
  } else if (cell[direction] === null) {
    // La dirección actual no aplica a esta celda — elegir la que sí tenga.
    direction = cell.across !== null ? 'across' : 'down';
  }
  // Si la celda admite la dirección actual, se conserva tal cual: esto es
  // lo que evita que el auto-avance cambie de sentido al pasar por una
  // celda de cruce (que pertenece a una palabra horizontal Y vertical).

  const box = grid.querySelector(`.cw-cell[data-key="${key}"]`);
  if (box) box.querySelector('input').focus({ preventScroll: true });

  paintHighlights();
}

function toggleDirectionAt(r, c) {
  // Alternar dirección solo debe ocurrir por un clic real del usuario sobre
  // la celda ya seleccionada — nunca como efecto secundario de .focus().
  const cell = cellMap.get(`${r},${c}`);
  if (cell && cell.across !== null && cell.down !== null) {
    direction = direction === 'across' ? 'down' : 'across';
    paintHighlights();
  }
}

function paintHighlights() {
  grid.querySelectorAll('.cw-cell').forEach(el => el.classList.remove('is-selected', 'is-active-word'));
  [...acrossList.children, ...downList.children].forEach(el => el.classList.remove('is-active'));

  if (!selected) return;
  const cell = cellMap.get(selected);
  const word = wordAt(cell, direction) || wordAt(cell, 'across') || wordAt(cell, 'down');
  if (!word) return;

  for (let i = 0; i < word.answer.length; i++) {
    const r = word.dir === 'down' ? word.row + i : word.row;
    const c = word.dir === 'across' ? word.col + i : word.col;
    const el = grid.querySelector(`.cw-cell[data-key="${r},${c}"]`);
    if (el) el.classList.add('is-active-word');
  }
  const selEl = grid.querySelector(`.cw-cell[data-key="${selected}"]`);
  if (selEl) selEl.classList.add('is-selected');

  const clueEl = [...acrossList.children, ...downList.children]
    .find(el => parseInt(el.dataset.num, 10) === word.num && word.dir === (el.parentElement === acrossList ? 'across' : 'down'));
  if (clueEl) clueEl.classList.add('is-active');
}

// ── ESCRITURA ─────────────────────────────────────────────────────────────

function inputAt(key) {
  const box = grid.querySelector(`.cw-cell[data-key="${key}"]`);
  return box ? box.querySelector('input') : null;
}

function stepKey(r, c, dir, delta) {
  return dir === 'across' ? `${r},${c + delta}` : `${r + delta},${c}`;
}

function onInput(r, c) {
  const key = `${r},${c}`;
  const input = inputAt(key);
  const clean = (input.value || '').toUpperCase().replace(/[^A-ZÑ]/g, '').slice(-1);
  input.value = clean;

  // Editar esta celda le quita su marca de "mal" — se re-evaluará abajo.
  // Se limpia solo esta celda (no toda la palabra) para no pisar el rojo
  // de una palabra cruzada que comparte una celda con esta pero sigue
  // incompleta y por lo tanto no se está re-chequeando ahora mismo.
  grid.querySelector(`.cw-cell[data-key="${key}"]`).classList.remove('is-wrong');

  if (clean) {
    const nextKey = stepKey(r, c, direction, 1);
    if (cellMap.has(nextKey)) selectCell(...nextKey.split(',').map(Number));
  }

  checkCrossingWords(cellMap.get(key));
}

function onKeyDown(e, r, c) {
  const key = `${r},${c}`;
  const input = inputAt(key);

  if (e.key === 'Backspace') {
    if (!input.value) {
      const prevKey = stepKey(r, c, direction, -1);
      if (cellMap.has(prevKey)) {
        selectCell(...prevKey.split(',').map(Number));
        const prevInput = inputAt(prevKey);
        prevInput.value = '';
        grid.querySelector(`.cw-cell[data-key="${prevKey}"]`).classList.remove('is-wrong');
      }
    }
    return;
  }

  const moves = {
    ArrowLeft:  { r: 0, c: -1, dir: 'across' },
    ArrowRight: { r: 0, c: 1,  dir: 'across' },
    ArrowUp:    { r: -1, c: 0, dir: 'down' },
    ArrowDown:  { r: 1,  c: 0, dir: 'down' },
  };
  const move = moves[e.key];
  if (move) {
    e.preventDefault();
    const targetKey = `${r + move.r},${c + move.c}`;
    if (cellMap.has(targetKey)) selectCell(r + move.r, c + move.c, move.dir);
  }
}

// ── VALIDACIÓN ────────────────────────────────────────────────────────────

function wordCells(word) {
  const cells = [];
  for (let i = 0; i < word.answer.length; i++) {
    const r = word.dir === 'down' ? word.row + i : word.row;
    const c = word.dir === 'across' ? word.col + i : word.col;
    cells.push({ r, c, key: `${r},${c}` });
  }
  return cells;
}

function checkWord(word) {
  if (solved.has(word.num)) return;
  const cells = wordCells(word);
  const values = cells.map(({ key }) => (inputAt(key).value || ''));
  if (values.some(v => !v)) return; // aún incompleta — no tocar el rojo:
  // podría pertenecer a una palabra cruzada que sí sigue completa y mal.

  const guess = values.join('');
  if (guess === word.answer) {
    solved.add(word.num);
    // Barrido en cascada: cada casilla se pone verde con un pequeño retraso
    // respecto a la anterior, en vez de cambiar todas de golpe — así se ve
    // claramente la palabra completa "encendiéndose" en lugar de solo
    // desaparecer el resaltado de selección.
    cells.forEach(({ key }, i) => {
      const box = grid.querySelector(`.cw-cell[data-key="${key}"]`);
      const input = inputAt(key);
      input.readOnly = true;
      box.classList.remove('is-wrong');
      setTimeout(() => box.classList.add('is-correct'), i * 55);
    });
    const clueEl = [...acrossList.children, ...downList.children]
      .find(el => parseInt(el.dataset.num, 10) === word.num && word.dir === (el.parentElement === acrossList ? 'across' : 'down'));
    if (clueEl) clueEl.classList.add('is-solved');
    updateCounter();
  } else {
    // "is-wrong" se queda fijo (color rojo) hasta que se corrija la
    // palabra; "is-shake" es solo el golpe de vibración y se retira solo.
    cells.forEach(({ key }) => {
      const box = grid.querySelector(`.cw-cell[data-key="${key}"]`);
      if (!box.classList.contains('is-correct')) {
        box.classList.add('is-wrong', 'is-shake');
        setTimeout(() => box.classList.remove('is-shake'), 500);
      }
    });
  }
}

function checkCrossingWords(cell) {
  // Sin "silent": en cuanto se completa una palabra (aunque sea al escribir
  // la letra de un cruce) se comprueba sola, sin esperar al botón manual.
  if (cell.across !== null) checkWord(WORDS[cell.across]);
  if (cell.down !== null) checkWord(WORDS[cell.down]);
}

function checkAll() {
  WORDS.forEach(w => checkWord(w));
}

function updateCounter() {
  counter.textContent = `${solved.size} de ${WORDS.length} correctas`;
  if (solved.size === WORDS.length) {
    // Un poco más de margen para que alcance a verse el barrido verde
    // de la última palabra antes de que aparezca el popup.
    setTimeout(() => winOverlay.classList.add('is-visible'), 600);
  }
}

// ── REINICIAR ─────────────────────────────────────────────────────────────

function resetGame() {
  selected = null;
  direction = 'across';
  solved.clear();
  winOverlay.classList.remove('is-visible');
  renderGrid();
  renderClues();
  updateCounter();
}

function closeWinOverlay() {
  winOverlay.classList.remove('is-visible');
}

checkBtn.addEventListener('click', checkAll);
resetBtn.addEventListener('click', resetGame);
winClose.addEventListener('click', closeWinOverlay);
winAgainBtn.addEventListener('click', resetGame);
winOverlay.addEventListener('click', (e) => { if (e.target === winOverlay) closeWinOverlay(); });
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && winOverlay.classList.contains('is-visible')) closeWinOverlay();
});

// ── INIT ───────────────────────────────────────────────────────────────────

renderGrid();
renderClues();
updateCounter();
