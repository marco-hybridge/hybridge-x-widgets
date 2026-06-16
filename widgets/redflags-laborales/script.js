// ── DATOS — OFERTAS DE TRABAJO ─────────────────────────────────────────────
//
// Cada oferta tiene:
//   logo, empresa, puesto, tags, cláusulas[]
//
// Cada cláusula:
//   text     — texto de la cláusula tal como aparecería en la oferta
//   isFlag   — true si viola la LFT o es abusiva
//   explanation — por qué es (o no) una red flag

const OFERTAS = [
  {
    logo:    "🚀",
    empresa: "StartupMX",
    puesto:  "Asistente Administrativo Jr.",
    tags:    ["Ciudad de México", "Presencial", "Tiempo completo"],
    clausulas: [
      {
        text:        "Horario de trabajo: lunes a viernes de 9:00 a.m. a 7:00 p.m. + disponibilidad los fines de semana.",
        isFlag:      true,
        explanation: "🚩 La jornada diurna máxima es 8 horas (LFT Art. 61). De 9 a 19 h son 10 horas — 2 horas extra diarias. Exigir disponibilidad de fin de semana sin mencionar compensación también viola la ley."
      },
      {
        text:        "Sueldo: a convenir, basado en experiencia.",
        isFlag:      true,
        explanation: "🚩 Ocultar el rango salarial es una táctica para bajar tu oferta en la negociación. Tienes derecho a saber el sueldo antes de entrevistarte. Siempre pregunta el rango."
      },
      {
        text:        "Prestaciones superiores a las de ley (detalles se informan al momento de la contratación).",
        isFlag:      true,
        explanation: "🚩 'Superiores a las de ley' sin especificar no significa nada legalmente. Si no está escrito en tu contrato, no existe. Siempre exige que las prestaciones estén detalladas por escrito."
      },
      {
        text:        "Al momento de la contratación deberás dejar en resguardo tu INE y RFC originales.",
        isFlag:      true,
        explanation: "🚩 Retener documentos oficiales originales es completamente ilegal. Ningún empleador puede quedarse con tu INE, RFC, CURP ni ningún otro documento. Es una práctica de control abusivo."
      },
      {
        text:        "Se requiere experiencia mínima de 1 año en puesto similar.",
        isFlag:      false,
        explanation: "✅ Pedir experiencia previa es completamente legal y normal. Los requisitos de perfil son facultad del empleador, siempre que no sean discriminatorios."
      }
    ]
  },
  {
    logo:    "🏢",
    empresa: "Distribuidora del Norte S.A.",
    puesto:  "Auxiliar de Almacén",
    tags:    ["Monterrey", "Presencial", "Por contrato"],
    clausulas: [
      {
        text:        "Los primeros tres meses serán de 'periodo de adaptación', durante los cuales no se realizará alta en el IMSS.",
        isFlag:      true,
        explanation: "🚩 La ley obliga al empleador a darte de alta en el IMSS desde el primer día que pisas la empresa, sin excepción (LFT Art. 12). No existe ningún periodo de gracia legal para esto."
      },
      {
        text:        "El contrato se firmará una vez concluido el periodo de prueba.",
        isFlag:      true,
        explanation: "🚩 Tienes derecho a recibir un contrato por escrito desde el inicio de la relación laboral (LFT Art. 25). Trabajar sin contrato te deja desprotegido ante cualquier conflicto."
      },
      {
        text:        "Salario: $315.04 diarios, pagaderos de forma quincenal.",
        isFlag:      false,
        explanation: "✅ Este salario equivale al mínimo general vigente en 2026. Pagarlo de forma quincenal es legal (LFT Art. 88 permite pagos semanales o quincenales). Todo en orden."
      },
      {
        text:        "Vacaciones de acuerdo a la Ley Federal del Trabajo vigente.",
        isFlag:      false,
        explanation: "✅ Remitirse a la LFT es correcto. La ley garantiza mínimo 12 días al año tras el primer año trabajado, con prima vacacional del 25%. Es una cláusula estándar y válida."
      }
    ]
  },
  {
    logo:    "💻",
    empresa: "AgenciaDigi",
    puesto:  "Community Manager",
    tags:    ["Home office", "Tiempo completo", "CDMX"],
    clausulas: [
      {
        text:        "El empleado deberá estar disponible en WhatsApp para atender solicitudes del cliente todos los días, incluyendo sábados, domingos y días festivos.",
        isFlag:      true,
        explanation: "🚩 El descanso semanal obligatorio es un derecho (LFT Art. 69 y 74). Exigir disponibilidad los 7 días sin compensación viola la ley. Los días festivos también tienen pago especial."
      },
      {
        text:        "El trabajo en modalidad home office se realizará bajo las condiciones establecidas en la NOM-037-STPS-2023.",
        isFlag:      false,
        explanation: "✅ Mencionar la NOM-037 es correcto y positivo — significa que la empresa conoce y aplica la norma oficial del teletrabajo, que protege tus derechos como trabajador remoto."
      },
      {
        text:        "El empleador cubrirá una parte proporcional de los gastos de internet y electricidad del empleado.",
        isFlag:      false,
        explanation: "✅ Esto es exactamente lo que exige la ley para el home office (LFT Art. 330-E). Que lo mencionen en la oferta es buena señal de que la empresa opera de forma correcta."
      },
      {
        text:        "En caso de renuncia voluntaria antes de los 6 meses, el empleado deberá reembolsar el costo del equipo proporcionado.",
        isFlag:      true,
        explanation: "🚩 Cobrar por el equipo de trabajo al renunciar es ilegal. Las herramientas de trabajo son responsabilidad del empleador (LFT Art. 132). Si el equipo es un préstamo, debe constar en un contrato de comodato separado, no como condición punitiva de renuncia."
      }
    ]
  },
  {
    logo:    "🏥",
    empresa: "Clínica Salud Total",
    puesto:  "Recepcionista",
    tags:    ["Guadalajara", "Presencial", "Turno nocturno"],
    clausulas: [
      {
        text:        "Jornada nocturna: 8:00 p.m. a 3:00 a.m., de lunes a viernes.",
        isFlag:      false,
        explanation: "✅ La jornada nocturna tiene un máximo de 7 horas (LFT Art. 61). De 20:00 a 03:00 son exactamente 7 horas. Está dentro del límite legal."
      },
      {
        text:        "Salario mensual de $4,200 pesos, pagadero el último día hábil del mes.",
        isFlag:      true,
        explanation: "🚩 Si la jornada es de lunes a viernes (5 días), eso son ~22 días al mes × $315.04 (salario mínimo 2026) = $6,930.88 mínimos. $4,200 está muy por debajo del salario mínimo vigente, lo cual es ilegal (LFT Art. 85)."
      },
      {
        text:        "El candidato seleccionado deberá someterse a prueba de embarazo como requisito de contratación.",
        isFlag:      true,
        explanation: "🚩 Exigir una prueba de embarazo es discriminación de género y está explícitamente prohibido por la LFT (Art. 133 fracción XVII) y la Ley Federal para Prevenir y Eliminar la Discriminación. Es motivo de denuncia ante la STPS."
      },
      {
        text:        "Se otorgará aguinaldo equivalente a 15 días de salario, pagadero antes del 20 de diciembre.",
        isFlag:      false,
        explanation: "✅ Esto es exactamente lo que establece la LFT (Art. 87). Quince días de salario antes del 20 de diciembre es el mínimo legal. Esta cláusula es correcta."
      }
    ]
  },
  {
    logo:    "📦",
    empresa: "LogiRápido Express",
    puesto:  "Repartidor / Mensajero",
    tags:    ["Nacional", "Freelance", "Por viaje"],
    clausulas: [
      {
        text:        "El repartidor prestará sus servicios como trabajador independiente, por lo que no existirá relación laboral con la empresa.",
        isFlag:      true,
        explanation: "🚩 Si trabajas de forma subordinada, con horarios y bajo las instrucciones de la empresa, existe una relación laboral independientemente de cómo la llamen. Disfrazar un empleo como 'freelance' para evitar prestaciones es una práctica ilegal conocida como 'outsourcing simulado'."
      },
      {
        text:        "Al no existir relación laboral, no aplican IMSS, INFONAVIT ni prestaciones de ley.",
        isFlag:      true,
        explanation: "🚩 Si en la práctica hay subordinación y dependencia económica, la empresa está obligada a darte de alta en el IMSS e INFONAVIT. Negarlas bajo el argumento de ser 'freelance' cuando no lo eres es evasión de obligaciones patronales."
      },
      {
        text:        "El repartidor deberá contar con su propio vehículo y absorber los costos de gasolina, mantenimiento y seguro.",
        isFlag:      true,
        explanation: "🚩 Si hay una relación laboral real, las herramientas y gastos de trabajo son responsabilidad del empleador (LFT Art. 132). Que el trabajador ponga su propio vehículo puede ser legal solo si hay un contrato de compensación explícito y justo por ese uso."
      },
      {
        text:        "Pago por viaje completado: tarifa según zona de entrega, transferida semanalmente.",
        isFlag:      false,
        explanation: "✅ El pago por destajo o por pieza es una modalidad legal reconocida por la LFT (Art. 83), siempre que el resultado no sea inferior al salario mínimo. El pago semanal también es legal."
      }
    ]
  }
];

// ── CLASIFICACIONES FINALES ────────────────────────────────────────────────

const RANKINGS = [
  {
    min:   0,
    max:   30,
    emoji: "🐣",
    rank:  "Recién llegad@ al mercado laboral",
    sub:   "Todavía hay cosas que se te escaparon. Repasa la LFT y vuelve a intentarlo — cada red flag que detectes en la vida real vale más que cualquier punto aquí."
  },
  {
    min:   31,
    max:   55,
    emoji: "👀",
    rank:  "Empezando a abrir los ojos",
    sub:   "Detectaste bastantes, pero algunos abusos se te colaron. Con práctica, tu radar laboral va a mejorar mucho."
  },
  {
    min:   56,
    max:   79,
    emoji: "🛡️",
    rank:  "Trabajador/a con criterio",
    sub:   "Buen ojo. Sabes distinguir entre cláusulas normales y abusivas. Estás en buena posición para negociar y defenderte."
  },
  {
    min:   80,
    max:   100,
    emoji: "🦅",
    rank:  "Nadie te va a ver la cara",
    sub:   "Detectaste casi todas las irregularidades. Conoces tus derechos y sabes leer la letra chica. Ese conocimiento vale más que cualquier oferta con futbolito y café ilimitado."
  }
];

// ── ESTADO ─────────────────────────────────────────────────────────────────

let currentOffer  = 0;
let totalFlags    = 0;   // flags reales en todas las ofertas
let detectedFlags = 0;   // flags que el alumno detectó correctamente
let falsePositives = 0;  // cláusulas OK que marcó como flag

// ── HELPERS ────────────────────────────────────────────────────────────────

function countFlags(oferta) {
  return oferta.clausulas.filter(c => c.isFlag).length;
}

// ── RENDER: OFERTA ─────────────────────────────────────────────────────────

function renderOferta(idx) {
  const oferta = OFERTAS[idx];
  const flagsEnEstaOferta = countFlags(oferta);
  totalFlags += flagsEnEstaOferta;

  // Actualizar topbar
  document.getElementById('offer-counter').textContent =
    `Oferta ${idx + 1} de ${OFERTAS.length}`;

  const area = document.getElementById('game-area');
  area.innerHTML = '';

  // Construir tarjeta
  const card = document.createElement('div');
  card.className = 'hb-app-card';
  card.style.padding = '0';
  card.style.overflow = 'hidden';

  card.innerHTML = `
    <!-- Logo de marca de agua -->
    <hybridge-logo fill="#FFFFFF" width="90px" class="card-watermark"></hybridge-logo>

    <!-- Header estilo job board -->
    <div class="job-header">
      <div class="company-logo">${oferta.logo}</div>
      <div class="job-meta">
        <div class="job-title">${oferta.puesto}</div>
        <div class="job-company">${oferta.empresa}</div>
        <div class="job-tags">
          ${oferta.tags.map(t => `<span class="job-tag">${t}</span>`).join('')}
        </div>
      </div>
    </div>

    <!-- Cuerpo con cláusulas -->
    <div class="job-body">
      <span class="clauses-label">📋 Condiciones de la oferta — Haz clic en las que te parezcan sospechosas</span>
      <div class="clauses-list" id="clauses-list">
        ${oferta.clausulas.map((c, i) => `
          <button class="clause-pill" data-idx="${i}" onclick="toggleClause(this, ${i}, ${idx})">
            <span class="clause-icon">🔍</span>
            <span class="clause-text">
              ${c.text}
              <span class="clause-explanation" id="exp-${i}"></span>
            </span>
          </button>
        `).join('')}
      </div>
    </div>

    <!-- Feedback de revisión -->
    <div class="card-feedback" id="card-feedback"></div>

    <!-- Footer con botón -->
    <div class="job-footer">
      <span class="flags-counter">
        Marcadas: <strong id="marked-count">0</strong> posibles red flags
      </span>
      <button class="hb-btn hb-btn-primary" id="review-btn" onclick="reviewOffer(${idx})">
        Revisar oferta →
      </button>
    </div>
  `;

  area.appendChild(card);
}

// ── LÓGICA: TOGGLE CLÁUSULA ────────────────────────────────────────────────

const selectedClauses = new Set();

function toggleClause(btn, clauseIdx, ofertaIdx) {
  if (btn.disabled) return;

  if (selectedClauses.has(clauseIdx)) {
    selectedClauses.delete(clauseIdx);
    btn.classList.remove('selected');
    btn.querySelector('.clause-icon').textContent = '🔍';
  } else {
    selectedClauses.add(clauseIdx);
    btn.classList.add('selected');
    btn.querySelector('.clause-icon').textContent = '🚩';
  }

  document.getElementById('marked-count').textContent = selectedClauses.size;
}

// ── LÓGICA: REVISAR OFERTA ─────────────────────────────────────────────────

function reviewOffer(ofertaIdx) {
  const oferta     = OFERTAS[ofertaIdx];
  const btns       = document.querySelectorAll('.clause-pill');
  let correctHits  = 0;
  let missedFlags  = 0;
  let falseHits    = 0;

  btns.forEach((btn, i) => {
    btn.disabled = true;
    const clausula = oferta.clausulas[i];
    const wasSelected = selectedClauses.has(i);
    const expEl = btn.querySelector('.clause-explanation');
    expEl.textContent = clausula.explanation;

    if (clausula.isFlag && wasSelected) {
      // Acertó una red flag
      btn.classList.remove('selected');
      btn.classList.add('revealed-flag');
      btn.querySelector('.clause-icon').textContent = '🚩';
      correctHits++;
    } else if (!clausula.isFlag && wasSelected) {
      // Falso positivo — marcó algo legal como flag
      btn.classList.remove('selected');
      btn.classList.add('revealed-ok');
      btn.querySelector('.clause-icon').textContent = '✅';
      falseHits++;
    } else if (clausula.isFlag && !wasSelected) {
      // Red flag que no detectó
      btn.classList.add('revealed-missed');
      btn.querySelector('.clause-icon').textContent = '👁️';
      missedFlags++;
    } else {
      // Cláusula legal que no marcó — correcto
      btn.classList.add('revealed-ok');
      btn.querySelector('.clause-icon').textContent = '✅';
    }
  });

  // Actualizar score global
  detectedFlags  += correctHits;
  falsePositives += falseHits;

  // Feedback de la tarjeta
  const flagsEnOferta = countFlags(oferta);
  const fb = document.getElementById('card-feedback');
  fb.classList.add('visible');

  if (correctHits === flagsEnOferta && falseHits === 0) {
    fb.className = 'card-feedback visible great';
    fb.innerHTML = `🎯 <strong>¡Perfecto!</strong> Detectaste todas las ${flagsEnOferta} red flags sin falsos positivos.`;
  } else if (correctHits >= Math.ceil(flagsEnOferta / 2) && falseHits <= 1) {
    fb.className = 'card-feedback visible ok';
    fb.innerHTML = `👍 <strong>Bien.</strong> Detectaste ${correctHits} de ${flagsEnOferta} red flags.${missedFlags > 0 ? ` Te faltaron ${missedFlags} — están marcadas arriba en rojo.` : ''}`;
  } else {
    fb.className = 'card-feedback visible miss';
    fb.innerHTML = `📚 <strong>A repasar.</strong> Solo detectaste ${correctHits} de ${flagsEnOferta} red flags.${falseHits > 0 ? ` Además marcaste ${falseHits} cláusula(s) legal(es) como sospechosa(s).` : ''} Revisa las explicaciones arriba.`;
  }

  // Cambiar botón a "Siguiente"
  document.getElementById('review-btn').outerHTML = `
    <button class="hb-btn hb-btn-primary" onclick="nextOffer()">
      ${ofertaIdx < OFERTAS.length - 1 ? 'Siguiente oferta →' : 'Ver resultado final →'}
    </button>
  `;

  // Limpiar selecciones para la siguiente oferta
  selectedClauses.clear();
}

// ── LÓGICA: SIGUIENTE OFERTA ───────────────────────────────────────────────

function nextOffer() {
  currentOffer++;
  if (currentOffer < OFERTAS.length) {
    renderOferta(currentOffer);
  } else {
    showResults();
  }
}

// ── RENDER: RESULTADOS FINALES ─────────────────────────────────────────────

function showResults() {
  // Calcular porcentaje (penalizar falsos positivos levemente)
  const maxScore  = totalFlags * 10;
  const earned    = (detectedFlags * 10) - (falsePositives * 3);
  const pct       = Math.max(0, Math.round((earned / maxScore) * 100));

  const ranking   = RANKINGS.find(r => pct >= r.min && pct <= r.max) || RANKINGS[0];

  document.getElementById('offer-counter').textContent = '¡Análisis completo!';

  const area = document.getElementById('game-area');
  area.innerHTML = `
    <div class="hb-app-card">
      <hybridge-logo fill="#FFFFFF" width="90px" class="card-watermark"></hybridge-logo>
      <div style="padding: var(--space-8) var(--space-6);">
        <div class="results-view">
          <span class="results-emoji">${ranking.emoji}</span>
          <div class="results-score">${pct}%</div>
          <span class="results-score-label">de red flags detectadas</span>
          <div class="results-rank">${ranking.rank}</div>
          <p class="results-sub">${ranking.sub}</p>

          <div style="display:flex; justify-content:center; gap: var(--space-3); flex-wrap:wrap; margin-bottom: var(--space-8);">
            <span class="hb-badge mint">✅ ${detectedFlags} red flags detectadas</span>
            <span class="hb-badge" style="border-color:var(--color-error); color:var(--color-error); background:rgba(255,107,122,0.08)">
              👁️ ${totalFlags - detectedFlags} no detectadas
            </span>
            ${falsePositives > 0 ? `<span class="hb-badge pink">⚠️ ${falsePositives} falsos positivos</span>` : ''}
          </div>

          <button class="hb-btn hb-btn-primary" onclick="restartGame()">
            🔄 Revisar otras ofertas
          </button>
        </div>
      </div>
    </div>
  `;
}

// ── LÓGICA: REINICIAR ──────────────────────────────────────────────────────

function restartGame() {
  currentOffer   = 0;
  totalFlags     = 0;
  detectedFlags  = 0;
  falsePositives = 0;
  selectedClauses.clear();
  renderOferta(0);
}

// ── INIT ───────────────────────────────────────────────────────────────────

renderOferta(0);
