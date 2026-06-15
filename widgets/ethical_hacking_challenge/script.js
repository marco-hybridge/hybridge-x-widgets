const steps = [
  {
    phase: "Fase 1 de 4 — Reconocimiento",
    progress: 0,
    intro: [
      { t: "prompt", s: "$ nmap -sV 192.168.1.10" },
      { t: "output", s: "Starting Nmap scan..." },
      { t: "output", s: "PORT     STATE  SERVICE   VERSION" },
      { t: "output", s: "22/tcp   open   ssh       OpenSSH 7.4" },
      { t: "output", s: "80/tcp   open   http      Apache 2.4.29" },
      { t: "output", s: "443/tcp  closed https" },
      { t: "output", s: "3306/tcp open   mysql     MySQL 5.6.40" },
      { t: "warning", s: "Nmap done: 1 host up — 4 open ports found." },
    ],
    hint: "Encontraste 4 puertos abiertos. El puerto 3306 corre MySQL 5.6.40, una versión con vulnerabilidades conocidas. ¿Cuál es el siguiente paso lógico de un pentester?",
    options: [
      { text: "$ exploit --run mysql", correct: false, feedback: "Explotar directamente sin más info es arriesgado y ruidoso. Los buenos pentesters recopilan más datos primero." },
      { text: "$ searchsploit mysql 5.6", correct: true, feedback: "Exacto. Antes de atacar, buscas vulnerabilidades conocidas para esa versión exacta. Información primero." },
      { text: "$ shutdown -h target", correct: false, feedback: "Apagar el servidor no es el objetivo. El pentesting busca encontrar fallas, no interrumpir servicios." },
      { text: "$ sudo rm -rf /", correct: false, feedback: "Destruir datos no es hacking ético. Eso sería un ataque malicioso." },
    ]
  },
  {
    phase: "Fase 2 de 4 — Análisis de vulnerabilidades",
    progress: 25,
    intro: [
      { t: "prompt", s: "$ searchsploit mysql 5.6" },
      { t: "output", s: "----------------------------------------" },
      { t: "output", s: "MySQL 5.6.x — Remote Code Execution  | CVE-2016-6662" },
      { t: "output", s: "MySQL 5.6.x — Privilege Escalation   | CVE-2016-6663" },
      { t: "output", s: "----------------------------------------" },
      { t: "warning", s: "2 exploits encontrados para MySQL 5.6.40" },
    ],
    hint: "Encontraste dos vulnerabilidades conocidas (CVE). El CVE-2016-6663 permite escalar privilegios — pasar de usuario normal a administrador del sistema.",
    options: [
      { text: "Usar CVE-2016-6663 para escalar a root", correct: false, feedback: "No todavía. Antes de escalar privilegios necesitas documentar lo que encontraste y confirmar que tu contrato lo autoriza." },
      { text: "Documentar las CVEs y reportarlas al cliente", correct: true, feedback: "Correcto. En hacking ético, documentar y reportar es tan importante como encontrar la vulnerabilidad." },
      { text: "Borrar los logs para no dejar rastro", correct: false, feedback: "Eso sería encubrimiento. Un hacker ético deja todo documentado, incluyendo cada acción que realizó." },
      { text: "Publicar la vulnerabilidad en Twitter", correct: false, feedback: "Divulgar vulnerabilidades sin avisar primero al dueño del sistema se llama 'full disclosure irresponsable' y puede causar daño real." },
    ]
  },
  {
    phase: "Fase 3 de 4 — Análisis de contraseñas",
    progress: 50,
    intro: [
      { t: "prompt", s: "$ john --wordlist=rockyou.txt hashes.txt" },
      { t: "output", s: "Loaded 3 password hashes..." },
      { t: "output", s: "Cracking..." },
      { t: "success", s: "admin:password123   (cracked in 0.3s)" },
      { t: "success", s: "user1:qwerty        (cracked in 0.1s)" },
      { t: "output", s: "user2: [not cracked]" },
      { t: "warning", s: "2 of 3 passwords cracked." },
    ],
    hint: "John the Ripper descifró dos contraseñas en menos de 1 segundo usando un diccionario. 'password123' y 'qwerty' son contraseñas pésimas.",
    options: [
      { text: "Recomendar contraseñas de mín. 12 caracteres y 2FA", correct: true, feedback: "Correcto. La mitigación principal es usar gestores de contraseñas y autenticación de dos factores (2FA)." },
      { text: "Que usen 'admin123' porque es más difícil", correct: false, feedback: "Sigue siendo una contraseña débil basada en palabras comunes. Está en todos los diccionarios de ataque." },
      { text: "Que deshabiliten el acceso SSH para siempre", correct: false, feedback: "Deshabilitar SSH no es la solución — es necesario para administrar el servidor. La solución es asegurarlo correctamente." },
      { text: "No mencionarlo porque ya hay vulnerabilidades peores", correct: false, feedback: "Un buen reporte documenta todos los hallazgos. Las contraseñas débiles son un vector de ataque crítico por sí solas." },
    ]
  },
  {
    phase: "Fase 4 de 4 — Entrega del reporte",
    progress: 75,
    intro: [
      { t: "prompt", s: "$ cat reporte_final.txt" },
      { t: "output", s: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" },
      { t: "output", s: "REPORTE DE PENTESTING — HYBRIDGE CORP" },
      { t: "output", s: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" },
      { t: "error",  s: "[CRÍTICO] MySQL 5.6.40 — CVE-2016-6663" },
      { t: "error",  s: "[ALTO]    Contraseñas débiles (admin, user1)" },
      { t: "warning", s: "[MEDIO]   Puerto 3306 expuesto públicamente" },
      { t: "output", s: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" },
    ],
    hint: "Tienes 3 vulnerabilidades documentadas. Ahora debes decidir cómo presentarle este reporte a tu cliente de forma ética.",
    options: [
      { text: "Publicarlo en GitHub para que todos aprendan", correct: false, feedback: "Publicar vulnerabilidades activas sin que el cliente las haya resuelto pone en riesgo real a la empresa y a sus usuarios." },
      { text: "Envío privado con tiempo para parchear", correct: true, feedback: "Exacto. Esto se llama 'Responsible Disclosure'. Das tiempo al cliente para corregir antes de que sea público." },
      { text: "Venderlo en foros de la Dark Web", correct: false, feedback: "Eso convierte el hacking ético en crimen organizado. Sombrero Negro total." },
      { text: "Extorsionar al cliente si no paga un bono extra", correct: false, feedback: "Usar vulnerabilidades como presión es extorsión, un delito grave. Tu protección es el contrato firmado antes de empezar." },
    ]
  }
];

let current = 0;
let answered = false;

// Función que emula la escritura en consola
function typeLines(lines, cb) {
  const term = document.getElementById('term');
  term.innerHTML = '';
  let i = 0;
  
  function next() {
    if (i >= lines.length) { if (cb) cb(); return; }
    const l = lines[i++];
    const p = document.createElement('p');
    p.className = 'line ' + l.t;
    p.textContent = l.s;
    term.appendChild(p);
    term.scrollTop = term.scrollHeight;
    
    // Si es un comando (prompt) escribe más lento, si es output rápido
    setTimeout(next, l.t === 'prompt' ? 90 : 30);
  }
  next();
}

function renderStep(idx) {
  answered = false;
  const s = steps[idx];
  
  // UI Updates
  document.getElementById('step-label').textContent = s.phase;
  document.getElementById('prog').style.width = s.progress + '%';
  document.getElementById('hint-box').style.opacity = '0';
  document.getElementById('options').innerHTML = '';

  typeLines(s.intro, () => {
    // Al terminar de escribir en consola, revelamos la pista y las opciones
    document.getElementById('hint-text').textContent = s.hint;
    document.getElementById('hint-box').style.opacity = '1';
    renderOptions(s);
  });
}

function renderOptions(s) {
  const grid = document.getElementById('options');
  grid.innerHTML = '';
  
  s.options.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.textContent = opt.text;
    btn.onclick = () => selectOption(opt, i, s);
    grid.appendChild(btn);
  });
}

function selectOption(opt, idx, s) {
  if (answered) return;
  answered = true;
  
  const btns = document.querySelectorAll('.option-btn');
  btns.forEach((b, i) => {
    b.disabled = true;
    if (s.options[i].correct) b.classList.add('correct');
    else if (i === idx && !opt.correct) b.classList.add('wrong');
  });

  // Imprimir feedback en la terminal
  const term = document.getElementById('term');
  const fb = document.createElement('p');
  fb.className = 'line ' + (opt.correct ? 'success' : 'error');
  fb.textContent = (opt.correct ? '✔ ' : '✖ ') + opt.feedback;
  term.appendChild(fb);

  if (!opt.correct) {
    const retry = document.createElement('p');
    retry.className = 'line warning';
    retry.textContent = '↩ Inténtalo de nuevo...';
    term.appendChild(retry);
  }

  term.scrollTop = term.scrollHeight;

  // Esperar un momento antes de avanzar o resetear
  setTimeout(() => {
    if (opt.correct) {
      current++;
      if (current < steps.length) {
        renderStep(current);
      } else {
        showFinal();
      }
    } else {
      // Si falló, reseteamos el estado de las opciones para que lo intente de nuevo
      answered = false;
      btns.forEach(b => { b.disabled = false; b.classList.remove('wrong'); });
    }
  }, opt.correct ? 2500 : 2000);
}

function showFinal() {
  // Limpiamos UI
  document.getElementById('prog').style.width = '100%';
  document.getElementById('step-label').textContent = 'Misión completada — Sistema Asegurado';
  document.getElementById('hint-box').style.display = 'none';
  document.getElementById('options').innerHTML = '';

  // Imprimir certificado ASCII
  const term = document.getElementById('term');
  term.innerHTML = `
    <p class="line success">$ cat certificado_hybridge.txt</p>
    <p class="line output"></p>
    <p class="line success">  ██████╗ ██╗  ██╗███████╗</p>
    <p class="line success">  ██╔══██╗╚██╗██╔╝██╔════╝</p>
    <p class="line success">  ██████╔╝ ╚███╔╝ ███████╗</p>
    <p class="line success">  ██╔══██╗ ██╔██╗ ╚════██║</p>
    <p class="line success">  ██████╔╝██╔╝ ██╗███████║</p>
    <p class="line success">  ╚═════╝ ╚═╝  ╚═╝╚══════╝</p>
    <p class="line output"></p>
    <p class="line warning">  > Reporte entregado con éxito.</p>
    <p class="line warning">  > Vulnerabilidades parcheadas por el cliente.</p>
    <p class="line success">  > Bug bounty acreditado: $12,500 USD</p>
  `;

  // Crear la App Card de victoria
  const final = document.createElement('div');
  final.className = 'final-card';
  final.innerHTML = `
    <div class="final-icon">🏆</div>
    <p class="final-title">Ethical Hacker Certificado</p>
    <p class="final-sub">Completaste un pentesting completo: reconocimiento, análisis de vulnerabilidades, auditoría de contraseñas y entrega responsable. Así trabajan los verdaderos profesionales en la industria.</p>
    <div class="badges-row">
      <span class="hb-badge mint">🛡️ Sombrero Blanco</span>
      <span class="hb-badge mint">✅ Divulgación Responsable</span>
    </div>
    <button class="hb-btn-primary" style="margin-top: 2rem;" onclick="location.reload()">🔄 Repetir Laboratorio</button>
  `;
  
  document.getElementById('final-container').appendChild(final);
}

// Inicializar el widget
renderStep(0);