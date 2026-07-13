import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getDatabase,
  ref,
  set,
  update,
  onValue,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// ── CONFIGURACIÓN FIREBASE ──────────────────────────────────────────────────

const firebaseConfig = {
  apiKey: "AIzaSyD19G4fsahqFxcVA4h9EvhIl6aSUeb_NL8",
  authDomain: "hybridge-summer-camp.firebaseapp.com",
  databaseURL: "https://hybridge-summer-camp-default-rtdb.firebaseio.com",
  projectId: "hybridge-summer-camp",
  storageBucket: "hybridge-summer-camp.firebasestorage.app",
  messagingSenderId: "84033130060",
  appId: "1:84033130060:web:bec2985f1a1fc225adaee9"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const BASE = "intercambio-musical";
const MIN_PARTICIPANTES = 3;
const STUDENT_ID_KEY = "intercambio-musical-student-id";

// ── VALIDACIÓN DE LINKS DE MÚSICA ───────────────────────────────────────────

const MUSIC_DOMAINS = [
  "spotify.com",
  "spotify.link",
  "tidal.com",
  "music.youtube.com",
  "youtube.com",
  "youtu.be",
  "music.apple.com",
  "soundcloud.com",
  "deezer.com",
  "deezer.page.link",
  "music.amazon.com",
  "music.amazon.com.mx",
  "music.yandex.com",
  "music.yandex.ru",
  "pandora.com",
  "napster.com",
  "audiomack.com",
  "bandcamp.com",
];

function isValidMusicLink(rawUrl) {
  let candidate = rawUrl.trim();
  if (!/^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(candidate)) {
    candidate = `https://${candidate}`;
  }

  let url;
  try {
    url = new URL(candidate);
  } catch {
    return false;
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") return false;

  const hostname = url.hostname.toLowerCase().replace(/^www\./, "");
  return MUSIC_DOMAINS.some(
    (domain) => hostname === domain || hostname.endsWith(`.${domain}`)
  );
}

// ── HELPERS DE VISTA ─────────────────────────────────────────────────────────

const views = {
  loading: document.getElementById("view-loading"),
  form: document.getElementById("view-form"),
  waiting: document.getElementById("view-waiting"),
  closedMissed: document.getElementById("view-closed-missed"),
  reveal: document.getElementById("view-reveal"),
  host: document.getElementById("view-host"),
};

function showView(name) {
  for (const key in views) {
    views[key].hidden = key !== name;
  }
}

// ── DERANGEMENT (shuffle sin coincidencias) ─────────────────────────────────

function fisherYatesShuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function derangement(ids) {
  let attempts = 0;
  while (attempts < 1000) {
    attempts++;
    const shuffled = fisherYatesShuffle(ids);

    // Corrige puntos fijos intercambiando con la siguiente posición
    for (let i = 0; i < shuffled.length; i++) {
      if (shuffled[i] === ids[i]) {
        const j = (i + 1) % shuffled.length;
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
    }

    const valid = shuffled.every((v, i) => v !== ids[i]);
    if (valid) return shuffled;
  }
  throw new Error("No se pudo generar un derangement válido");
}

// ── MODO HOST ────────────────────────────────────────────────────────────────
// Sin backend no hay autenticación real: esto es una barrera contra curiosos,
// no contra alguien que lea el código fuente. El token evita que un alumno
// entre por accidente o adivinando "?host=true"; el PIN es una segunda capa
// para que ver la URL en la pantalla del profe no baste. Cambia ambos valores
// libremente si se filtran.

const HOST_TOKEN = "YDD5xCBJ4SMq";
const HOST_PIN = "8332";
const HOST_UNLOCK_KEY = "intercambio-musical-host-unlocked";

const hostParam = new URLSearchParams(location.search).get("host");

if (hostParam === HOST_TOKEN) {
  const alreadyUnlocked = sessionStorage.getItem(HOST_UNLOCK_KEY) === "1";

  if (alreadyUnlocked) {
    initHostView();
  } else {
    const enteredPin = prompt("Modo profe — ingresa el PIN:");
    if (enteredPin === HOST_PIN) {
      sessionStorage.setItem(HOST_UNLOCK_KEY, "1");
      initHostView();
    } else {
      // PIN incorrecto o cancelado: cae a la vista de alumno sin confirmar
      // ni negar si el token era válido.
      initStudentView();
    }
  }
} else {
  initStudentView();
}

function initHostView() {
  showView("host");

  const countEl = document.getElementById("host-count");
  const statusTextEl = document.getElementById("host-status-text");
  const closeBtn = document.getElementById("host-close-btn");
  const resetBtn = document.getElementById("host-reset-btn");

  let submissionsCache = {};
  let currentStatus = "abierto";

  function refreshButtonState() {
    if (currentStatus === "cerrado") {
      closeBtn.disabled = true;
      closeBtn.textContent = "Ya se repartió";
      statusTextEl.textContent = "Las asignaciones ya están listas. Los alumnos verán su canción al volver a entrar.";
    } else {
      closeBtn.disabled = false;
      closeBtn.textContent = "Cerrar inscripciones y repartir";
      statusTextEl.textContent = "";
    }
  }

  onValue(ref(db, `${BASE}/submissions`), (snap) => {
    submissionsCache = snap.val() || {};
    countEl.textContent = Object.keys(submissionsCache).length;
  });

  onValue(ref(db, `${BASE}/status`), (snap) => {
    currentStatus = snap.val() || "abierto";
    refreshButtonState();
  });

  closeBtn.addEventListener("click", async () => {
    const ids = Object.keys(submissionsCache);

    if (ids.length < MIN_PARTICIPANTES) {
      alert(`Necesitas al menos ${MIN_PARTICIPANTES} canciones para repartir.`);
      return;
    }

    closeBtn.disabled = true;
    statusTextEl.textContent = "Repartiendo canciones...";

    try {
      const shuffled = derangement(ids);
      const updates = {};

      ids.forEach((studentId, i) => {
        const giverId = shuffled[i];
        const giver = submissionsCache[giverId];
        updates[`assignments/${studentId}`] = {
          cancionRecibida: giver.cancion,
          nombreRecomendador: giver.nombre,
        };
      });

      updates["status"] = "cerrado";

      await update(ref(db, BASE), updates);
    } catch (err) {
      console.error(err);
      alert("Hubo un error al repartir las canciones. Intenta de nuevo.");
      closeBtn.disabled = false;
      statusTextEl.textContent = "";
    }
  });

  resetBtn.addEventListener("click", async () => {
    const confirmed = confirm(
      "¿Seguro que quieres reiniciar la dinámica? Esto borrará todas las canciones enviadas y las asignaciones actuales. Los alumnos podrán volver a enviar su canción desde cero. Esta acción no se puede deshacer."
    );
    if (!confirmed) return;

    resetBtn.disabled = true;
    statusTextEl.textContent = "Reiniciando...";

    try {
      await update(ref(db, BASE), {
        submissions: null,
        assignments: null,
        status: "abierto",
      });
    } catch (err) {
      console.error(err);
      alert("Hubo un error al reiniciar. Intenta de nuevo.");
    } finally {
      resetBtn.disabled = false;
    }
  });
}

// ── MODO ALUMNO ──────────────────────────────────────────────────────────────

function getStudentId() {
  let id = localStorage.getItem(STUDENT_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(STUDENT_ID_KEY, id);
  }
  return id;
}

function initStudentView() {
  const studentId = getStudentId();

  let currentStatus;
  let mySubmission;
  let myAssignment;

  function render() {
    if (
      currentStatus === undefined ||
      mySubmission === undefined ||
      myAssignment === undefined
    ) {
      showView("loading");
      return;
    }

    if (currentStatus === "cerrado") {
      if (myAssignment) {
        document.getElementById("reveal-nombre").textContent = myAssignment.nombreRecomendador;
        const link = document.getElementById("reveal-link");
        link.href = myAssignment.cancionRecibida;
        showView("reveal");
      } else {
        showView("closedMissed");
      }
      return;
    }

    // status === "abierto"
    if (mySubmission) {
      showView("waiting");
    } else {
      showView("form");
    }
  }

  onValue(ref(db, `${BASE}/status`), (snap) => {
    currentStatus = snap.val() || "abierto";
    render();
  });

  onValue(ref(db, `${BASE}/submissions/${studentId}`), (snap) => {
    mySubmission = snap.val();
    render();
  });

  onValue(ref(db, `${BASE}/assignments/${studentId}`), (snap) => {
    myAssignment = snap.val();
    render();
  });

  // ── Formulario de envío ──────────────────────────────────────────────────

  const form = document.getElementById("submit-form");
  const nombreInput = document.getElementById("input-nombre");
  const cancionInput = document.getElementById("input-cancion");
  const submitBtn = document.getElementById("submit-btn");
  const errorEl = document.getElementById("form-error");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nombre = nombreInput.value.trim();
    const cancion = cancionInput.value.trim();

    if (!nombre || !cancion) {
      errorEl.textContent = "Completa tu nombre y el link de tu canción.";
      errorEl.hidden = false;
      return;
    }

    if (!isValidMusicLink(cancion)) {
      errorEl.textContent = "Ese link no parece ser de una app de música. Pega un link de Spotify, YouTube, YouTube Music, Tidal, Apple Music u otra app similar.";
      errorEl.hidden = false;
      return;
    }

    errorEl.hidden = true;
    submitBtn.disabled = true;
    submitBtn.textContent = "Enviando...";

    try {
      await set(ref(db, `${BASE}/submissions/${studentId}`), {
        nombre,
        cancion,
        timestamp: Date.now(),
      });
      // El listener de arriba detecta el cambio y muestra la vista de espera.
    } catch (err) {
      console.error(err);
      errorEl.textContent = "Hubo un error al enviar tu canción. Intenta de nuevo.";
      errorEl.hidden = false;
      submitBtn.disabled = false;
      submitBtn.textContent = "🎶 Enviar mi canción";
    }
  });
}
