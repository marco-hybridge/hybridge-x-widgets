// ── CONFIGURACIÓN ────────────────────────────────────────────────────────────

const MAX_USER_MESSAGES = 6;
const TYPING_DELAY_MIN = 500;
const TYPING_DELAY_MAX = 950;

// ── NORMALIZACIÓN Y TOLERANCIA A ERRORES ────────────────────────────────────
// El objetivo: "Mamá", "mama", "MAMÁ" y "mma" (typo) deben detectar la misma
// palabra clave. Quitamos acentos/mayúsculas para comparar, y usamos distancia
// de Levenshtein para tolerar errores de dedo comunes.

const DIACRITICS_PATTERN = new RegExp("[\\u0300-\\u036f]", "g");

function stripAccents(text) {
  return text.normalize("NFD").replace(DIACRITICS_PATTERN, "");
}

function tokenize(text) {
  return stripAccents(text.toLowerCase())
    .split(/[^\p{L}]+/u)
    .filter(Boolean);
}

function levenshtein(a, b) {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);

      // Transposición de dos letras adyacentes (ej. "tirste" / "triste") cuenta
      // como 1 solo error, no 2 — es el typo más común y sin esto el umbral
      // de distancia 1 lo rechazaba.
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        dp[i][j] = Math.min(dp[i][j], dp[i - 2][j - 2] + 1);
      }
    }
  }
  return dp[m][n];
}

// Saludos comunes que quedan a distancia 1 de alguna palabra clave real
// ("hola" ~ "sola") y por eso nunca deben evaluarse por tipeo, solo por
// coincidencia exacta (que nunca van a tener, ya que no son keywords).
const FUZZY_EXEMPT_TOKENS = new Set(["hola", "holaa", "holi", "ola"]);

// Compara un token del mensaje contra una palabra clave, permitiendo 1-2
// errores de tipeo según el largo de la palabra (palabras cortas toleran
// menos, para no generar falsos positivos como "casa" ~ "clase").
function fuzzyMatch(token, keyword) {
  if (token === keyword) return true;
  if (FUZZY_EXEMPT_TOKENS.has(token)) return false;
  if (token.length < 3 || keyword.length < 3) return false;

  // Distancia 2 en palabras de 7 letras deja pasar demasiado ("verano" ~
  // "hermano"): solo se relaja a 2 en palabras largas (10+), donde 2 errores
  // siguen siendo una fracción chica de la palabra.
  const maxDistance = keyword.length >= 10 ? 2 : 1;
  if (Math.abs(token.length - keyword.length) > maxDistance) return false;

  return levenshtein(token, keyword) <= maxDistance;
}

function tokensMatchAnyKeyword(tokens, keywords) {
  return keywords.some((keyword) => tokens.some((token) => fuzzyMatch(token, keyword)));
}

// ── REFLEXIÓN DE PRONOMBRES ─────────────────────────────────────────────────
// "estoy triste" -> "estás triste", "mi mamá" -> "tu mamá". Un solo pase con
// una regex combinada evita el problema clásico de "me"->"te"->"me" en cadena.

const REFLECTIONS = {
  yo: "tú", tú: "yo", tu: "su", tus: "sus",
  mi: "tu", mis: "tus", "mí": "ti",
  me: "te", te: "me",
  soy: "eres", eres: "soy",
  estoy: "estás", "estás": "estoy",
  tengo: "tienes", tienes: "tengo",
  quiero: "quieres", quieres: "quiero",
  necesito: "necesitas", necesitas: "necesito",
  siento: "sientes", sientes: "siento",
  puedo: "puedes", puedes: "puedo",
  creo: "crees", crees: "creo",
  pienso: "piensas", piensas: "pienso",
  "mío": "tuyo", "mía": "tuya", tuyo: "mío", tuya: "mía",
};

const REFLECTION_PATTERN = new RegExp(
  `(^|[^\\p{L}])(${Object.keys(REFLECTIONS)
    .sort((a, b) => b.length - a.length)
    .join("|")})(?=[^\\p{L}]|$)`,
  "giu"
);

function reflect(text) {
  return text.replace(REFLECTION_PATTERN, (match, prefix, word) => {
    const replacement = REFLECTIONS[word.toLowerCase()];
    return prefix + (replacement || word);
  });
}

// ── REGLAS (estilo ELIZA: palabra clave -> pregunta) ────────────────────────

const RULES = [
  {
    id: "no_se",
    test: (tokens, normalized) => /\bno\s*se\b/.test(normalized) || tokensMatchAnyKeyword(tokens, ["nose"]),
    responses: [
      "Está bien no saberlo. ¿Qué es lo primero que se te viene a la mente?",
      "¿Por qué crees que no lo sabes?",
      "A veces \"no sé\" es la respuesta más honesta. ¿Qué se siente decir eso?",
    ],
  },
  {
    id: "mama",
    keywords: ["mama", "madre"],
    responses: [
      "Cuéntame más sobre tu mamá.",
      "¿Qué tan seguido piensas en tu mamá?",
      "¿Cómo describirías tu relación con tu mamá?",
    ],
  },
  {
    id: "papa",
    keywords: ["papa", "padre"],
    responses: [
      "Cuéntame más sobre tu papá.",
      "¿Qué tan seguido piensas en tu papá?",
      "¿Cómo describirías tu relación con tu papá?",
    ],
  },
  {
    id: "triste",
    keywords: ["triste", "tristeza", "deprimido", "deprimida"],
    responses: [
      "¿Por qué crees que ${reflected}?",
      "Lamento escuchar eso. ¿Desde cuándo te sientes así?",
      "¿Qué crees que ayudaría en este momento?",
    ],
  },
  {
    id: "feliz",
    keywords: ["feliz", "felicidad", "contento", "contenta", "alegre"],
    responses: [
      "Qué bueno escuchar eso. ¿Qué hizo que ${reflected}?",
      "¿Qué tan seguido te sientes así?",
      "Cuéntame más sobre eso.",
    ],
  },
  {
    id: "amigo",
    keywords: ["amigo", "amiga", "amigos", "amistad"],
    responses: [
      "Cuéntame más sobre esa amistad.",
      "¿Qué es lo que más valoras de tus amigos?",
      "¿Hace cuánto se conocen?",
    ],
  },
  {
    id: "amor",
    keywords: ["amor", "enamorado", "enamorada", "novio", "novia", "pareja"],
    responses: [
      "Cuéntame más sobre eso.",
      "¿Cómo te hace sentir esa persona?",
      "¿Desde cuándo sientes eso?",
    ],
  },
  {
    id: "familia",
    keywords: ["familia", "hermano", "hermana"],
    responses: [
      "Cuéntame más sobre tu familia.",
      "¿Cómo es la relación con tu familia?",
    ],
  },
  {
    id: "escuela",
    keywords: ["escuela", "clase", "tarea", "examen", "universidad"],
    responses: [
      "¿Qué es lo que más te cuesta de eso?",
      "Cuéntame más sobre eso.",
      "¿Cómo te sientes al respecto?",
    ],
  },
  {
    id: "solo",
    keywords: ["solo", "sola", "soledad"],
    responses: [
      "¿Desde cuándo sientes que ${reflected}?",
      "¿Qué crees que ayudaría a sentirte menos así?",
      "Cuéntame más sobre eso.",
    ],
  },
  {
    id: "miedo",
    keywords: ["miedo", "asustado", "asustada", "temor"],
    responses: [
      "¿A qué le tienes miedo exactamente?",
      "¿Desde cuándo sientes eso?",
      "Cuéntame más sobre eso.",
    ],
  },
  {
    id: "enojado",
    keywords: ["enojado", "enojada", "enojo", "molesto", "molesta", "furioso", "furiosa"],
    responses: [
      "¿Qué fue lo que hizo que ${reflected}?",
      "¿Con quién estás molesto?",
      "Cuéntame más sobre eso.",
    ],
  },
  {
    id: "cansado",
    keywords: ["cansado", "cansada", "cansancio", "agotado", "agotada"],
    responses: [
      "¿Desde cuándo sientes que ${reflected}?",
      "¿Qué crees que te está agotando?",
      "Cuéntame más sobre eso.",
    ],
  },
  {
    id: "estres",
    keywords: ["estres", "estresado", "estresada", "ansiedad", "ansioso", "ansiosa", "nervios", "nervioso", "nerviosa"],
    responses: [
      "¿Qué es lo que más te está estresando?",
      "¿Desde cuándo sientes eso?",
      "Cuéntame más sobre eso.",
    ],
  },
];

const FALLBACKS = [
  "Cuéntame más sobre eso.",
  "¿Por qué dices eso?",
  "Interesante. Sigue contándome.",
  "¿Cómo te hace sentir eso?",
  "Entiendo. ¿Qué más?",
  "¿Puedes contarme un poco más?",
];

// ── SELECCIÓN DE RESPUESTA ───────────────────────────────────────────────────

let lastResponse = null;

function pickResponse(pool) {
  if (pool.length === 1) return pool[0];
  let choice;
  do {
    choice = pool[Math.floor(Math.random() * pool.length)];
  } while (choice === lastResponse);
  lastResponse = choice;
  return choice;
}

function generateReply(userText) {
  const tokens = tokenize(userText);
  const normalized = stripAccents(userText.toLowerCase());
  const reflected = reflect(userText.trim().replace(/[.!?¿¡]+$/, ""));

  const matchedRule = RULES.find((rule) =>
    rule.test ? rule.test(tokens, normalized) : tokensMatchAnyKeyword(tokens, rule.keywords)
  );

  const template = matchedRule
    ? pickResponse(matchedRule.responses)
    : pickResponse(FALLBACKS);

  return template.replace("${reflected}", reflected);
}

// ── CONTROLADOR DEL CHAT ─────────────────────────────────────────────────────

const messagesEl = document.getElementById("me-messages");
const revealEl = document.getElementById("me-reveal");
const formEl = document.getElementById("me-form");
const inputEl = document.getElementById("me-input");
const sendBtn = document.getElementById("me-send-btn");
const counterEl = document.getElementById("me-counter");
const statusEl = document.getElementById("me-status");
const restartBtn = document.getElementById("me-restart-btn");

let userMessageCount = 0;

function scrollToBottom() {
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function addMessage(text, sender) {
  const msg = document.createElement("div");
  msg.className = `me-msg me-msg--${sender}`;

  if (sender === "bot") {
    const avatar = document.createElement("span");
    avatar.className = "me-msg-avatar";
    avatar.textContent = "🤖";
    msg.appendChild(avatar);
  }

  const bubble = document.createElement("div");
  bubble.className = "me-msg-bubble";
  bubble.textContent = text;
  msg.appendChild(bubble);

  messagesEl.appendChild(msg);
  scrollToBottom();
}

function showTyping() {
  const msg = document.createElement("div");
  msg.className = "me-msg me-msg--bot me-typing";
  msg.id = "me-typing-indicator";

  const avatar = document.createElement("span");
  avatar.className = "me-msg-avatar";
  avatar.textContent = "🤖";
  msg.appendChild(avatar);

  const bubble = document.createElement("div");
  bubble.className = "me-msg-bubble me-typing-bubble";
  bubble.innerHTML = "<span></span><span></span><span></span>";
  msg.appendChild(bubble);

  messagesEl.appendChild(msg);
  scrollToBottom();
}

function hideTyping() {
  const indicator = document.getElementById("me-typing-indicator");
  if (indicator) indicator.remove();
}

function botReply(text, onDone) {
  statusEl.textContent = "escribiendo...";
  showTyping();

  const delay = TYPING_DELAY_MIN + Math.random() * (TYPING_DELAY_MAX - TYPING_DELAY_MIN);
  setTimeout(() => {
    hideTyping();
    addMessage(text, "bot");
    statusEl.textContent = "en línea";
    if (onDone) onDone();
  }, delay);
}

function endConversation() {
  inputEl.disabled = true;
  sendBtn.disabled = true;
  setTimeout(() => {
    formEl.hidden = true;
    revealEl.hidden = false;
  }, 900);
}

formEl.addEventListener("submit", (e) => {
  e.preventDefault();

  const text = inputEl.value.trim();
  if (!text || inputEl.disabled) return;

  addMessage(text, "user");
  inputEl.value = "";
  userMessageCount++;
  counterEl.textContent = `${userMessageCount} / ${MAX_USER_MESSAGES}`;

  inputEl.disabled = true;
  sendBtn.disabled = true;

  const reply = generateReply(text);
  botReply(reply, () => {
    if (userMessageCount >= MAX_USER_MESSAGES) {
      endConversation();
    } else {
      inputEl.disabled = false;
      sendBtn.disabled = false;
      inputEl.focus();
    }
  });
});

function resetChat() {
  messagesEl.innerHTML = "";
  userMessageCount = 0;
  counterEl.textContent = `0 / ${MAX_USER_MESSAGES}`;
  revealEl.hidden = true;
  formEl.hidden = false;
  inputEl.disabled = false;
  sendBtn.disabled = false;
  lastResponse = null;

  botReply("Hola, soy Mini-ELIZA. Cuéntame, ¿qué tienes en mente hoy?");
}

restartBtn.addEventListener("click", resetChat);

resetChat();
