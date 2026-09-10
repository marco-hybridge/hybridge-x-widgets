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
const printBtn   = document.getElementById('cwPrint');
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

// ── HOJA IMPRIMIBLE (siempre en blanco, para resolver a mano) ───────────

function renderPrintSheet() {
  const printGrid = document.getElementById('cwPrintGrid');
  printGrid.style.gridTemplateColumns = `repeat(${nCols}, var(--cw-print-cell))`;
  printGrid.style.gridTemplateRows = `repeat(${nRows}, var(--cw-print-cell))`;

  for (let r = minRow; r <= maxRow; r++) {
    for (let c = minCol; c <= maxCol; c++) {
      const cell = cellMap.get(`${r},${c}`);
      if (!cell) {
        const blank = document.createElement('div');
        blank.className = 'cw-print-blank';
        printGrid.appendChild(blank);
        continue;
      }
      const box = document.createElement('div');
      box.className = 'cw-print-cell';
      if (cell.number) {
        const badge = document.createElement('span');
        badge.className = 'cw-print-num';
        badge.textContent = cell.number;
        box.appendChild(badge);
      }
      printGrid.appendChild(box);
    }
  }

  const across = WORDS.filter(w => w.dir === 'across').sort((a, b) => a.num - b.num);
  const down = WORDS.filter(w => w.dir === 'down').sort((a, b) => a.num - b.num);
  const li = (w) => `<li><strong>${w.num}.</strong> ${w.clue}</li>`;

  document.getElementById('cwPrintAcross').innerHTML = across.map(li).join('');
  document.getElementById('cwPrintDown').innerHTML = down.map(li).join('');
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

  // Celda ya resuelta por la palabra cruzada (readOnly): no se puede
  // reescribir, pero si tecleas la MISMA letra que ya tiene ahí, se deja
  // avanzar igual — así no se corta el flujo de escribir la palabra actual
  // solo por toparte con un cruce que ya quedó correcto.
  if (input.readOnly) {
    if (/^[a-zñ]$/i.test(e.key)) {
      e.preventDefault();
      if (e.key.toUpperCase() === input.value) {
        const nextKey = stepKey(r, c, direction, 1);
        if (cellMap.has(nextKey)) selectCell(...nextKey.split(',').map(Number));
      } else {
        // No coincide con la letra correcta — avisa sin dejar sobrescribir.
        const box = grid.querySelector(`.cw-cell[data-key="${key}"]`);
        box.classList.add('is-shake');
        setTimeout(() => box.classList.remove('is-shake'), 400);
      }
      return;
    }
    if (e.key === 'Backspace') {
      // No hay nada que borrar aquí — retrocede a la anterior, como si
      // "pasara de largo" por la celda ya resuelta.
      const prevKey = stepKey(r, c, direction, -1);
      if (cellMap.has(prevKey)) selectCell(...prevKey.split(',').map(Number));
      return;
    }
  }

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

// ── COMPROBANTE DESCARGABLE + CÓDIGO DE VERIFICACIÓN ────────────────────
//
// Sitio estático, sin backend: nada de esto se guarda en ningún lado. El
// código es un hash SHA-256 determinístico (nombre + fecha + las 10
// respuestas correctas + una "sal" fija de este crucigrama) — mismos
// datos, mismo código, siempre, en cualquier dispositivo. Eso es lo que
// lo hace "verificable" sin base de datos: el profesor puede recalcular
// el código esperado él mismo con el panel de abajo y compararlo contra
// el comprobante entregado.
//
// Ojo: como todo el algoritmo corre en el navegador del alumno (no hay
// forma de esconder una llave secreta en un sitio estático), esto no es
// a prueba de alguien con conocimientos técnicos decidido a hacer trampa.
// Sí delata el caso real más común: reenviar el archivo de un compañero
// tal cual, porque el nombre que trae no va a coincidir con quien lo
// entregue.

const CERT_SALT = 'HYBRIDGE-CRUCIGRAMA-DIAGNOSTICO-V1';

// Respuestas correctas en un orden fijo (por número de pista) — mismo
// insumo tanto al generar el comprobante como al recalcular el código.
const ANSWER_STRING = WORDS.slice().sort((a, b) => a.num - b.num).map(w => w.answer).join('');

function todayStr() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

async function computeVerificationCode(name, dateStr) {
  const normalized = name.trim().toLowerCase().replace(/\s+/g, ' ');
  const payload = `${normalized}|${dateStr}|${ANSWER_STRING}|${CERT_SALT}`;
  const bytes = new TextEncoder().encode(payload);
  const hashBuffer = await crypto.subtle.digest('SHA-256', bytes);
  const hex = [...new Uint8Array(hashBuffer)].map(b => b.toString(16).padStart(2, '0')).join('');
  return hex.slice(0, 16).toUpperCase().match(/.{1,4}/g).join('-'); // XXXX-XXXX-XXXX-XXXX
}

// Mismo logo que <hybridge-logo>, pero rasterizado a negro para dibujarlo
// sobre el canvas del comprobante (un <canvas> no puede pintar un
// web component directamente).
function loadLogoImage() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 6441.594 1196.174">
    <g transform="translate(9 6)">
      <g transform="translate(-56.64 6)">
        <path fill="#0D0D0D" d="M1116.776,502.909Q999.742,500,881.94,498.373V12.605q117.746,10.233,234.836,28.771Zm-407.452-6.182q-118.132-.659-236.226,0V2.071q118.076-4.142,236.226,0ZM300.5,12.605V498.373q-117.775,1.618-234.855,4.536V41.377Q182.652,22.83,300.5,12.605M76.054,675.524Q187.9,678.24,300.5,679.786V1051C185.79,954.509,103.688,820.082,76.054,675.522M473.1,1162.9V681.432q118.076.659,236.226,0V1162.9a464.378,464.378,0,0,1-236.226,0M881.94,1051.006V679.784q112.534-1.566,224.447-4.262C1078.661,820.081,996.687,954.509,881.94,1051"/>
      </g>
      <g transform="translate(1656.453 45.833)">
        <path fill="#0D0D0D" d="M354.6,84.4V538.586H150.9V84.4H0V1140.687H150.9V674.406H354.6v466.281H505.524V84.4Z" transform="translate(0 -69.304)"/>
        <path fill="#0D0D0D" d="M396.893,695.532v445.157H246V691L24.154,84.4H190.132L321.447,503.9h9.028L458.734,84.4H618.689Z" transform="translate(586.994 -69.297)"/>
        <g transform="translate(1278.187 0)">
          <path fill="#0D0D0D" d="M254.221,84.4c45.29,0,132.782,4.529,199.2,51.282C548.477,203.594,550,316.794,550,378.655c0,69.4-6.022,117.678-45.291,164.485-19.608,24.138-42.253,39.218-57.307,48.277,40.762,18.116,58.826,43.771,72.439,66.391,30.156,52.805,30.156,81.5,30.156,132.782v80c0,43.746,0,152.417-90.529,220.3-33.195,25.656-89.011,49.794-179.59,49.794H50.518V84.4Zm-52.8,437.588H273.88c51.282,0,81.445-21.126,96.575-39.217,18.091-21.126,28.641-57.358,28.641-90.556V327.343c0-27.176-12.1-54.323-28.641-72.438-18.141-18.091-48.326-34.716-98.094-34.716H201.415Zm0,482.881h67.909c22.646,0,70.92-2.986,102.6-46.757C397.578,923.4,399.1,869.076,399.1,850.961V801.166c0-51.282-7.515-87.518-40.736-116.184-24.163-19.635-46.783-27.176-79.979-27.176H201.416Z" transform="translate(-50.518 -69.317)"/>
          <path fill="#0D0D0D" d="M274.5,84.438c76.967,0,188.623-4.53,259.543,82.988,34.714,42.228,55.816,105.635,55.816,184.092V431.5c0,67.884-24.113,131.29-55.816,167.5-22.618,25.632-52.779,43.773-79.953,54.323l165.978,487.409H463.122L316.753,685.02H227.717v455.707H76.819V84.438ZM227.717,549.2h86.026c33.195,0,64.873-7.564,93.565-34.689,30.185-28.692,31.7-54.352,31.7-95.083V343.98c0-40.761-15.13-76.967-34.739-96.6-30.155-30.155-66.391-27.149-98.094-27.149H227.72Z" transform="translate(588.636 -69.33)"/>
          <rect fill="#0D0D0D" width="150.898" height="1056.29" transform="translate(1337.034 15.081)"/>
          <path fill="#0D0D0D" d="M320.182,84.4c63.38,0,153.91,2.986,220.326,63.355,76.969,70.92,81.5,182.575,81.5,227.839V841.9c0,72.412-7.566,149.38-67.884,215.771-66.415,72.464-153.959,83.015-212.812,83.015H116.482V84.4Zm-52.8,908.4H335.29c31.677,0,70.92-4.53,101.13-36.233,31.677-34.687,34.689-89.011,34.689-123.7V365.044c0-30.185-4.529-67.909-28.693-98.069-28.64-34.739-60.343-34.739-98.069-34.739H267.381Z" transform="translate(1552.508 -69.293)"/>
          <path fill="#0D0D0D" d="M555.1,1073.7a177.854,177.854,0,0,1-72.413,70.946c-43.772,24.137-92.047,25.63-117.7,25.63-54.351,0-117.7-13.561-167.52-75.449-48.274-60.343-54.322-135.793-54.322-184.069V376.541c0-63.38,3.036-128.254,49.819-193.152C253.3,98.907,348.386,83.8,405.72,83.8c78.485,0,144.851,25.655,187.1,67.909,40.762,40.736,76.968,108.645,76.968,206.714v42.253h-150.9v-52.8c0-25.655-3.013-58.851-30.186-86.024-15.079-15.105-40.761-30.156-81.47-30.156-39.269,0-66.417,16.6-84.508,37.725-28.691,34.689-28.691,73.931-28.691,111.656v494.97c0,31.652,1.518,76.941,25.654,108.619,18.117,22.646,48.276,37.75,84.534,37.75,31.675,0,67.882-16.624,87.491-42.253,27.176-34.714,27.176-86.025,27.176-123.749V714.569H390.64V578.751H669.792V1155.2h-75.45Z" transform="translate(2200.363 -83.8)"/>
          <path fill="#0D0D0D" d="M170.876,84.4H619.068V227.732H321.774V538.584H584.353V674.406H321.774v322.95H623.6v143.333H170.876Z" transform="translate(2874.356 -69.304)"/>
        </g>
      </g>
    </g>
  </svg>`;
  const url = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

async function generateCertificate(name) {
  const dateStr = todayStr();
  const code = await computeVerificationCode(name, dateStr);

  const W = 1000, H = 640;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, W, H);

  try {
    const logo = await loadLogoImage();
    const logoW = 170;
    const logoH = logoW * (logo.height / logo.width);
    ctx.drawImage(logo, 60, 46, logoW, logoH);
  } catch (e) {
    // Si el logo no carga (p. ej. sin conexión a fuentes), seguimos sin él.
  }

  ctx.fillStyle = '#0D0D0D';
  ctx.font = '700 30px Arial, sans-serif';
  ctx.fillText('Comprobante de Finalización', 60, 165);

  ctx.fillStyle = '#555555';
  ctx.font = '400 16px Arial, sans-serif';
  ctx.fillText('Crucigrama Digital — Evaluación Diagnóstica', 60, 192);

  ctx.strokeStyle = '#0D0D0D';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(60, 214);
  ctx.lineTo(W - 60, 214);
  ctx.stroke();

  ctx.fillStyle = '#0D0D0D';
  ctx.font = '400 18px Arial, sans-serif';
  ctx.fillText(`Alumno: ${name}`, 60, 262);
  ctx.fillText(`Fecha: ${dateStr}`, 60, 294);
  ctx.fillText('Resultado: 10 de 10 correctas ✅', 60, 326);

  ctx.strokeStyle = '#0D0D0D';
  ctx.lineWidth = 2;
  ctx.strokeRect(60, 368, W - 120, 132);

  ctx.fillStyle = '#555555';
  ctx.font = '600 14px Arial, sans-serif';
  ctx.fillText('CÓDIGO DE VERIFICACIÓN', 84, 402);

  ctx.fillStyle = '#0D0D0D';
  ctx.font = '700 42px "Courier New", monospace';
  ctx.fillText(code, 84, 460);

  ctx.fillStyle = '#777777';
  ctx.font = '400 13px Arial, sans-serif';
  ctx.fillText('Tu profesor puede verificar este código con tu nombre y la fecha de arriba.', 84, 484);

  ctx.fillStyle = '#999999';
  ctx.font = '400 12px Arial, sans-serif';
  ctx.fillText('Generado automáticamente por Hybridge X · hybridge.education', 60, H - 40);

  return { canvas, code, dateStr };
}

function slugify(str) {
  // Quita acentos: NFD separa la letra de su marca diacrítica, y el
  // rango U+0300-U+036F cubre esas marcas combinantes.
  const combiningMarks = /[̀-ͯ]/g;
  return str.toLowerCase().normalize('NFD').replace(combiningMarks, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

async function downloadCertificate() {
  const nameInput = document.getElementById('cwStudentName');
  const hint = document.getElementById('cwCertHint');
  const name = nameInput.value.trim();

  if (!name) {
    hint.textContent = '⚠️ Escribe tu nombre para generar el comprobante.';
    hint.classList.add('is-error');
    nameInput.focus();
    return;
  }
  hint.classList.remove('is-error');
  hint.textContent = 'Generando…';

  try {
    const { canvas, code, dateStr } = await generateCertificate(name);
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `comprobante-crucigrama-${slugify(name) || 'alumno'}-${dateStr}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      hint.classList.remove('is-error');
      hint.textContent = `✅ Descargado — código ${code}`;
    }, 'image/png');
  } catch (e) {
    hint.classList.add('is-error');
    hint.textContent = '⚠️ No se pudo generar el comprobante en este navegador.';
  }
}

async function verifyCertificate() {
  const name = document.getElementById('cwVerifyName').value.trim();
  const dateVal = document.getElementById('cwVerifyDate').value;
  const resultEl = document.getElementById('cwVerifyResult');

  if (!name || !dateVal) {
    resultEl.classList.add('is-error');
    resultEl.textContent = '⚠️ Completa el nombre y la fecha del comprobante.';
    return;
  }
  resultEl.classList.remove('is-error');
  const code = await computeVerificationCode(name, dateVal);
  resultEl.innerHTML = `Código esperado: <strong>${code}</strong>`;
}

printBtn.addEventListener('click', () => window.print());
resetBtn.addEventListener('click', resetGame);
winClose.addEventListener('click', closeWinOverlay);
winAgainBtn.addEventListener('click', resetGame);
winOverlay.addEventListener('click', (e) => { if (e.target === winOverlay) closeWinOverlay(); });
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && winOverlay.classList.contains('is-visible')) closeWinOverlay();
});

document.getElementById('cwDownloadCert').addEventListener('click', downloadCertificate);
document.getElementById('cwVerifyBtn').addEventListener('click', verifyCertificate);

// ── INIT ───────────────────────────────────────────────────────────────────

renderGrid();
renderClues();
renderPrintSheet();
document.getElementById('cwVerifyDate').value = todayStr();
updateCounter();
