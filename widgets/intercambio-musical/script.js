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

const isHost = new URLSearchParams(location.search).get("host") === "true";

if (isHost) {
  initHostView();
} else {
  initStudentView();
}

function initHostView() {
  showView("host");

  const countEl = document.getElementById("host-count");
  const statusTextEl = document.getElementById("host-status-text");
  const closeBtn = document.getElementById("host-close-btn");

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
