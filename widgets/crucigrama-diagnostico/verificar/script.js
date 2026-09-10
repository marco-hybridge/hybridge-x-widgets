// ── PUERTA DE ACCESO (PBKDF2, sin backend) ───────────────────────────────
//
// No hay servidor: la contraseña se verifica derivando una clave con
// PBKDF2-SHA256 (muchas iteraciones, cara de fuerza bruta offline) y
// comparándola contra un hash precalculado — la contraseña en texto
// plano nunca queda escrita en este archivo. Aun así, hay que ser
// honesto sobre el límite real de un sitio estático: quien abra las
// herramientas de desarrollador puede ver este algoritmo. Esto no es
// infalible contra alguien con conocimientos técnicos decidido a
// atacarlo — es una barrera real contra el tanteo casual, y como el
// enlace no se comparte desde ningún lado del crucigrama, primero hay
// que encontrarlo.

const GATE_SALT_HEX = 'de0aaf6cf2b476466770e965db3b4446';
const GATE_TARGET_HEX = '5281719ad31d6c25390b00f097e7cc7da26fcec629e4f47e6fae8dc3c57284dc';
const GATE_ITERATIONS = 250000;
const SESSION_KEY = 'cw_verificar_authed_v1';

function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  return bytes;
}
function bytesToHex(bytes) {
  return [...bytes].map(b => b.toString(16).padStart(2, '0')).join('');
}

async function checkPassword(password) {
  const salt = hexToBytes(GATE_SALT_HEX);
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: GATE_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    256
  );
  return bytesToHex(new Uint8Array(bits)) === GATE_TARGET_HEX;
}

// ── VERIFICACIÓN DE COMPROBANTES ─────────────────────────────────────────
// Mismo cálculo que usa el crucigrama para generar el comprobante del
// alumno: SHA-256 de nombre + fecha + las 10 respuestas correctas + una
// sal fija. Determinístico — por eso se puede recalcular aquí sin haber
// guardado nada en ningún lado.

const CERT_SALT = 'HYBRIDGE-CRUCIGRAMA-DIAGNOSTICO-V1';

const ANSWERS = [
  { num: 1,  answer: 'PERFIL' },
  { num: 2,  answer: 'ECOMMERCE' },
  { num: 3,  answer: 'AMAZON' },
  { num: 4,  answer: 'TIKTOK' },
  { num: 5,  answer: 'FORO' },
  { num: 6,  answer: 'YOUTUBE' },
  { num: 7,  answer: 'CLASSROOM' },
  { num: 8,  answer: 'MOODLE' },
  { num: 9,  answer: 'INFLUENCER' },
  { num: 10, answer: 'RRSS' },
];
const ANSWER_STRING = ANSWERS.slice().sort((a, b) => a.num - b.num).map(w => w.answer).join('');

async function computeVerificationCode(name, dateStr) {
  const normalized = name.trim().toLowerCase().replace(/\s+/g, ' ');
  const payload = `${normalized}|${dateStr}|${ANSWER_STRING}|${CERT_SALT}`;
  const bytes = new TextEncoder().encode(payload);
  const hashBuffer = await crypto.subtle.digest('SHA-256', bytes);
  const hex = [...new Uint8Array(hashBuffer)].map(b => b.toString(16).padStart(2, '0')).join('');
  return hex.slice(0, 16).toUpperCase().match(/.{1,4}/g).join('-');
}

function todayStr() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// ── UI ────────────────────────────────────────────────────────────────────

const gate = document.getElementById('vfGate');
const tool = document.getElementById('vfTool');
const form = document.getElementById('vfForm');
const passwordInput = document.getElementById('vfPassword');
const submitBtn = document.getElementById('vfSubmit');
const errorEl = document.getElementById('vfError');

let failCount = 0;

function showTool() {
  gate.classList.add('is-hidden');
  tool.classList.add('is-visible');
  document.getElementById('vfDate').value = todayStr();
  document.getElementById('vfName').focus();
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const pw = passwordInput.value;
  if (!pw) return;

  submitBtn.disabled = true;
  submitBtn.textContent = 'Verificando…';
  errorEl.textContent = '';

  try {
    const ok = await checkPassword(pw);
    if (ok) {
      sessionStorage.setItem(SESSION_KEY, '1');
      showTool();
    } else {
      failCount++;
      errorEl.textContent = '❌ Contraseña incorrecta.';
      passwordInput.value = '';
      passwordInput.focus();
      // Pequeña demora creciente tras cada intento fallido — no detiene
      // un ataque con script, pero sí un tanteo manual repetido.
      const delay = Math.min(failCount * 800, 4000);
      submitBtn.disabled = true;
      await new Promise((r) => setTimeout(r, delay));
    }
  } catch (err) {
    errorEl.textContent = '⚠️ No se pudo verificar en este navegador.';
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Entrar';
  }
});

document.getElementById('vfCalc').addEventListener('click', async () => {
  const name = document.getElementById('vfName').value.trim();
  const dateVal = document.getElementById('vfDate').value;
  const resultEl = document.getElementById('vfResult');

  if (!name || !dateVal) {
    resultEl.classList.add('is-error');
    resultEl.textContent = '⚠️ Completa el nombre y la fecha del comprobante.';
    return;
  }
  resultEl.classList.remove('is-error');
  const code = await computeVerificationCode(name, dateVal);
  resultEl.innerHTML = `Código esperado: <strong>${code}</strong>`;
});

document.getElementById('vfSignOut').addEventListener('click', () => {
  sessionStorage.removeItem(SESSION_KEY);
  tool.classList.remove('is-visible');
  gate.classList.remove('is-hidden');
  passwordInput.value = '';
  document.getElementById('vfResult').textContent = '';
  document.getElementById('vfName').value = '';
  passwordInput.focus();
});

// Recordar sesión mientras la pestaña siga abierta (sessionStorage: se
// borra al cerrarla — nada persiste más allá de eso).
if (sessionStorage.getItem(SESSION_KEY) === '1') {
  showTool();
} else {
  passwordInput.focus();
}
