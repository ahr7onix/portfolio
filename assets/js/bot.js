// ============================================================
//  Bit, o assistente do portfólio
//  Conversa por regras (sem IA externa e sem chave de API):
//  entende palavras-chave em português, responde só com dados
//  reais de projetos.js e monta a mensagem para o WhatsApp.
//  Conversa com o robô 3D por eventos:
//    robo:falar   {texto}            -> balão em cima do robô
//    robo:estado  {estado}           -> "pensando" | "feliz" | "ouvindo" | "normal"
//    robo:clicado                    <- o robô 3D foi clicado
// ============================================================
(function () {
  const WHATS = "5517992514495";
  const EMAIL = "isacbuzelli@gmail.com";
  const LINKEDIN = "https://www.linkedin.com/in/isac-buzelli-dos-santos-b84499392/";
  const GITHUB = "https://github.com/ahr7onix";
  const projetos = (window.PROJETOS || []).filter((p) => p.publico);
  const reduzir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const painel = document.getElementById("bot");
  const lista = document.getElementById("bot-mensagens");
  const form = document.getElementById("bot-form");
  const campo = document.getElementById("bot-campo");
  const sugestoes = document.getElementById("bot-sugestoes");
  const abrirBotao = document.getElementById("bot-abrir");
  const fecharBotao = document.getElementById("bot-fechar");
  if (!painel) return;

  const robo = (nome, detalhe) => window.dispatchEvent(new CustomEvent(nome, { detail: detalhe }));
  const falarNoRobo = (texto) => robo("robo:falar", { texto });
  const estadoRobo = (estado) => robo("robo:estado", { estado });

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const normalizar = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9\s.+#-]/g, " ");
  const tem = (texto, ...palavras) => palavras.some((p) => new RegExp(`(^|\\s)${p}`).test(texto));
  const whatsLink = (texto) => `https://wa.me/${WHATS}?text=${encodeURIComponent(texto)}`;

  let modo = null; // "orcamento" quando o Bit está esperando a descrição do projeto
  let ocupado = false;
  let piadaAtual = 0;

  const SUGESTOES_INICIAIS = ["Quais projetos o Isac fez?", "Quero um orçamento", "Que serviços ele faz?", "Quem é o Isac?", "Conta uma piada"];

  const PIADAS = [
    "Por que o programador foi ao médico? Porque estava com muitos <i>bugs</i>... e nenhum teste. 🐛",
    "Eu tentei contar uma piada sobre UDP, mas não sei se você recebeu. 📡",
    "Existem 10 tipos de pessoas: as que entendem binário e as que não entendem. 🤓",
    "Meu código não tem bugs. Ele só desenvolve <i>funcionalidades aleatórias</i>. ✨",
    "O Isac me programou para contar piadas. Pelo visto ele também precisa de testes nessa parte. 😅",
  ];

  // ---------------- respostas ----------------
  function responder(entrada) {
    const t = normalizar(entrada);

    // fluxo de orçamento: a mensagem seguinte vira a descrição do projeto
    if (modo === "orcamento") {
      modo = null;
      if (t.trim().length < 3 || tem(t, "cancelar", "deixa", "nada")) {
        return { texto: "Sem problemas! Quando quiser, é só pedir um orçamento de novo. 😉", balao: "Tudo bem!" };
      }
      const mensagem = `Olá Isac, vim pelo seu portfólio e quero um orçamento. Preciso de: ${entrada.trim()}`;
      return {
        texto: `Perfeito! Preparei a mensagem para o Isac:<blockquote>${esc(mensagem)}</blockquote>É só tocar no botão para enviar pelo WhatsApp. Ele responde com uma proposta. 🚀`,
        acoes: [{ rotulo: "Enviar no WhatsApp", link: whatsLink(mensagem), destaque: true }],
        balao: "Mensagem pronta! 🚀",
        estado: "feliz",
      };
    }

    // projeto específico pelo nome
    const projeto = projetos.find((p) => {
      const nomes = [p.id, normalizar(p.nome)].concat(p.id === "nx" ? ["nx web"] : []);
      return nomes.some((n) => t.includes(n.replace(/-/g, " ")) || t.includes(n));
    });
    if (projeto && !tem(t, "todos", "quais", "lista")) return sobreProjeto(projeto);

    if (t.trim().split(/\s+/).length <= 4 && tem(t, "oi", "ola", "eai", "e ai", "salve", "bom dia", "boa tarde", "boa noite", "hey", "hello")) {
      return {
        texto: "Oi! 👋 Eu sou o <b>Bit</b>, o assistente do Isac. Posso te mostrar os projetos, explicar os serviços ou te colocar em contato com ele. Por onde começamos?",
        sugestoes: SUGESTOES_INICIAIS,
        balao: "Oi! 👋",
        estado: "feliz",
      };
    }

    if (tem(t, "orcamento", "preco", "valor", "quanto custa", "cobra", "contratar", "proposta", "fazer um", "fazer uma", "preciso de", "quero um", "quero uma")) {
      modo = "orcamento";
      return {
        texto: "Bora! 💜 O valor depende do que você precisa, então o Isac monta uma proposta sob medida.<br><br><b>Me conta em uma frase:</b> o que você quer criar? (ex.: <i>site para minha loja</i>, <i>sistema de agendamento</i>, <i>app</i>, <i>automação</i>)",
        sugestoes: ["Um site para minha empresa", "Um sistema web", "Um aplicativo", "Uma automação ou bot"],
        balao: "Me conta a ideia! 💡",
        estado: "ouvindo",
      };
    }

    if (tem(t, "disponivel", "disponibilidade", "agenda", "aceita", "freela")) {
      return { texto: "Sim! ✅ O Isac está disponível para novos projetos.", sugestoes: ["Quero um orçamento", "Como falo com ele?"], balao: "Disponível! ✅", estado: "feliz" };
    }

    if (tem(t, "piada", "engracad", "rir", "zoeira", "humor")) {
      const piada = PIADAS[piadaAtual++ % PIADAS.length];
      return { texto: piada, sugestoes: ["Outra piada", "Quais projetos o Isac fez?"], balao: "Hahaha 😂", estado: "feliz" };
    }
    if (tem(t, "outra")) return responder("piada");

    if (t.includes("feito") || t.includes("fez esse") || t.includes("fez este") || (tem(t, "como") && tem(t, "site", "portfolio", "pagina"))) {
      return {
        texto: "Este portfólio usa <b>Three.js</b> com WebGL: a estação de trabalho, as esferas, o planeta e eu fomos gerados por código. É HTML, CSS e JavaScript puros, publicados na Vercel, e funciona até sem 3D se o navegador não suportar.",
        sugestoes: ["Quero um site assim", "Quais projetos o Isac fez?"],
      };
    }

    if (tem(t, "quem e voce", "quem e vc", "seu nome", "bit", "robo", "voce e um", "vc e um")) {
      return {
        texto: "Eu sou o <b>Bit</b> 🤖, um robozinho 3D feito pelo Isac com Three.js. Fui montado peça por peça em código, sem nenhum modelo baixado. Clica em mim lá em cima que eu dou uma pirueta!",
        sugestoes: ["Como esse site foi feito?", "Quais projetos o Isac fez?"],
        balao: "Prazer, Bit! 🤖",
        estado: "feliz",
        pirueta: true,
      };
    }

    if (tem(t, "projeto", "portfolio", "trabalho", "fez", "case", "exemplo")) {
      return {
        texto: `O Isac tem ${projetos.length} projetos publicados aqui. Escolha um para eu te contar mais:`,
        lista: projetos.map((p) => `<b>${esc(p.nome)}</b>: ${esc(p.subtitulo)}`),
        sugestoes: projetos.map((p) => p.nome),
        balao: "Olha esses projetos! 👇",
      };
    }

    if (tem(t, "servico", "faz", "oferece", "trabalha com", "site", "landing", "sistema", "app", "aplicativo", "mobile", "automac", "bot", "ia", "inteligencia")) {
      return {
        texto: "O Isac desenvolve:",
        lista: [
          "<b>Sistemas web sob medida</b>: painéis, plataformas SaaS e APIs com login e banco de dados",
          "<b>Aplicativos mobile</b>: Android e iOS com React Native",
          "<b>Sites e landing pages</b>: rápidos, responsivos e com formulário funcionando",
          "<b>Automação e IA</b>: bots, integrações e uso de IA em tarefas do dia a dia",
        ],
        sugestoes: ["Quero um orçamento", "Quais projetos o Isac fez?", "Quais tecnologias ele usa?"],
        balao: "Dá pra fazer muita coisa!",
      };
    }

    if (tem(t, "tecnologia", "stack", "linguagem", "ferramenta", "react", "node", "nest", "python", "typescript", "javascript", "three", "postgres", "docker")) {
      return {
        texto: "As principais ferramentas do Isac: <b>TypeScript, React, Next.js, React Native, Node.js, NestJS, PostgreSQL, Prisma, Python, Three.js e Docker</b>. Tem a lista completa na seção de tecnologias, com as esferas 3D. 🔮",
        acoes: [{ rotulo: "Ver tecnologias", rolar: "tecnologias" }],
        balao: "TypeScript ❤️",
      };
    }

    if (tem(t, "quem", "sobre", "isac", "estuda", "faculdade", "formacao", "experiencia", "onde mora", "cidade")) {
      return {
        texto: "O Isac é desenvolvedor full stack em Araçatuba (SP) e estuda Tecnologia em Desenvolvimento de Sistemas no Centro Universitário Católico Salesiano Auxilium. O TCC dele, o <b>NutriCare</b>, tem API, painel web e app mobile, e foi feito em equipe para acompanhar pacientes com diabetes.",
        sugestoes: ["Me fala do NutriCare", "Quero um orçamento", "Como falo com ele?"],
        balao: "Esse é o meu criador! 😄",
      };
    }

    if (tem(t, "contato", "whats", "zap", "telefone", "numero", "email", "e-mail", "linkedin", "github", "falar", "falo", "conversar com ele", "chamar")) {
      return {
        texto: "Você pode falar com o Isac por aqui:",
        acoes: [
          { rotulo: "WhatsApp (17) 99251-4495", link: whatsLink("Olá Isac, vi seu portfólio e quero conversar sobre um projeto."), destaque: true },
          { rotulo: EMAIL, link: `mailto:${EMAIL}` },
          { rotulo: "LinkedIn", link: LINKEDIN },
          { rotulo: "GitHub", link: GITHUB },
        ],
        balao: "Chama ele! 📲",
      };
    }

    if (tem(t, "prazo", "demora", "tempo", "quando fica", "entrega")) {
      return {
        texto: "O prazo depende do tamanho do projeto. Um site é mais rápido que um sistema completo. Conta para o Isac o que você precisa que ele te passa o prazo junto com a proposta.",
        sugestoes: ["Quero um orçamento"],
      };
    }

    if (tem(t, "obrigad", "valeu", "vlw", "tmj", "show", "top", "legal", "massa")) {
      return { texto: "Por nada! 💜 Se precisar, é só chamar.", sugestoes: ["Quero um orçamento", "Conta uma piada"], balao: "💜", estado: "feliz" };
    }

    if (tem(t, "tchau", "ate mais", "flw", "falou")) {
      return { texto: "Até mais! 👋 Foi bom conversar com você.", balao: "Tchau! 👋", estado: "feliz", pirueta: true };
    }

    // não entendeu
    return {
      texto: "Hmm, essa eu não sei responder. 🤔 Mas posso te ajudar com estes assuntos, ou você pode perguntar direto para o Isac:",
      sugestoes: SUGESTOES_INICIAIS,
      acoes: [{ rotulo: "Perguntar no WhatsApp", link: whatsLink(`Olá Isac, vim pelo portfólio. ${entrada.trim()}`) }],
      balao: "Hmm... 🤔",
    };
  }

  function sobreProjeto(p) {
    const status = { concluido: "concluído ✅", prototipo: "protótipo 🧪", desenvolvimento: "em desenvolvimento 🛠️" }[p.status];
    const acoes = [{ rotulo: "Ver detalhes", projeto: p.id, destaque: true }];
    if (p.demo) acoes.push({ rotulo: "Ver online", link: p.demo });
    if (p.repo) acoes.push({ rotulo: "Código", link: p.repo });
    return {
      texto: `<b>${esc(p.nome)}</b> (${status})<br>${esc(p.resumo)}<br><br><small>Feito com ${esc(p.tecnologias.slice(0, 5).join(", "))}.</small>`,
      acoes,
      sugestoes: projetos.filter((x) => x !== p).map((x) => x.nome).slice(0, 3).concat("Quero um orçamento"),
      balao: `${p.nome}! 😎`,
      estado: "feliz",
    };
  }

  // ---------------- interface ----------------
  function adicionar(quem, html, extra = {}) {
    const li = document.createElement("li");
    li.className = `msg msg-${quem}`;
    li.innerHTML = `<div class="msg-balao">${html}${
      extra.lista ? `<ul>${extra.lista.map((i) => `<li>${i}</li>`).join("")}</ul>` : ""
    }</div>`;
    if (extra.acoes?.length) {
      const div = document.createElement("div");
      div.className = "msg-acoes";
      extra.acoes.forEach((a) => {
        const el = document.createElement(a.link ? "a" : "button");
        el.className = `chip${a.destaque ? " chip-destaque" : ""}`;
        el.textContent = a.rotulo;
        if (a.link) {
          el.href = a.link;
          if (/^https?:/.test(a.link)) { el.target = "_blank"; el.rel = "noopener"; }
        } else {
          el.type = "button";
          el.addEventListener("click", () => {
            if (a.projeto) location.hash = a.projeto;
            if (a.rolar) { fechar(); document.getElementById(a.rolar)?.scrollIntoView({ behavior: reduzir ? "auto" : "smooth" }); }
          });
        }
        div.appendChild(el);
      });
      li.appendChild(div);
    }
    lista.appendChild(li);
    lista.scrollTop = lista.scrollHeight;
    return li;
  }

  function mostrarSugestoes(itens = []) {
    sugestoes.innerHTML = "";
    itens.forEach((s) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "chip";
      b.textContent = s;
      b.addEventListener("click", () => enviar(s));
      sugestoes.appendChild(b);
    });
  }

  // ---------------- IA (Gemini via /api/bit) ----------------
  // No site da Vercel usa o mesmo domínio; no GitHub Pages chama a Vercel.
  const API = location.hostname === "isacbuzelli.vercel.app" ? "/api/bit" : "https://isacbuzelli.vercel.app/api/bit";
  const historico = []; // { quem: "eu" | "bit", texto }
  let iaPausadaAte = 0;  // depois de uma falha, usa as regras por um tempo
  const statusTexto = document.querySelector("#bot-status span:last-child");

  const NOMES_SECAO = { projetos: "Projetos", servicos: "Serviços", tecnologias: "Tecnologias", sobre: "Sobre", contato: "Contato" };

  // texto do modelo -> HTML seguro (só negrito e quebras de linha)
  const formatar = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/\n/g, "<br>");
  const semTags = (html) => { const d = document.createElement("div"); d.innerHTML = html; return d.textContent; };

  function contatoAcoes() {
    return [
      { rotulo: "WhatsApp (17) 99251-4495", link: whatsLink("Olá Isac, vi seu portfólio e quero conversar sobre um projeto."), destaque: true },
      { rotulo: EMAIL, link: `mailto:${EMAIL}` },
      { rotulo: "LinkedIn", link: LINKEDIN },
      { rotulo: "GitHub", link: GITHUB },
    ];
  }

  async function perguntarIA() {
    if (Date.now() < iaPausadaAte) return null;
    const controle = new AbortController();
    const relogio = setTimeout(() => controle.abort(), 28000);
    try {
      const r = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mensagens: historico.slice(-12) }),
        signal: controle.signal,
      });
      const dados = await r.json().catch(() => ({}));
      if (!r.ok) {
        // sem chave configurada: não adianta tentar de novo nesta visita
        iaPausadaAte = Date.now() + (dados.erro === "sem-chave" ? 864e5 : r.status === 429 ? 30e3 : 120e3);
        return null;
      }
      if (statusTexto) statusTexto.textContent = "assistente do Isac com IA · online";
      return dados;
    } catch {
      iaPausadaAte = Date.now() + 120e3;
      return null;
    } finally {
      clearTimeout(relogio);
    }
  }

  function converterIA(d) {
    let texto = formatar(d.resposta);
    const acoes = [];
    for (const a of d.acoes || []) {
      if (a.tipo === "projeto") {
        const p = projetos.find((x) => x.id === a.alvo);
        if (!p) continue;
        acoes.push({ rotulo: `Ver ${p.nome}`, projeto: p.id, destaque: !acoes.length });
        if (p.demo) acoes.push({ rotulo: `${p.nome} online`, link: p.demo });
      } else if (a.tipo === "secao") {
        acoes.push({ rotulo: `Ir para ${NOMES_SECAO[a.alvo] || a.alvo}`, rolar: a.alvo });
      } else if (a.tipo === "whatsapp") {
        texto += `<blockquote>${esc(a.alvo)}</blockquote>`;
        acoes.unshift({ rotulo: "Enviar no WhatsApp", link: whatsLink(a.alvo), destaque: true });
      } else if (a.tipo === "contato") {
        acoes.push(...contatoAcoes());
      }
    }
    return { texto, acoes: acoes.slice(0, 5), sugestoes: d.sugestoes, balao: d.balao, estado: d.humor };
  }

  async function enviar(texto) {
    texto = texto.trim();
    if (!texto || ocupado) return;
    adicionar("eu", esc(texto));
    historico.push({ quem: "eu", texto });
    campo.value = "";
    mostrarSugestoes([]);
    ocupado = true;
    estadoRobo("pensando");

    const digitando = adicionar("bit", '<span class="digitando"><i></i><i></i><i></i></span>');
    const inicio = performance.now();

    const ia = await perguntarIA();
    const r = ia ? converterIA(ia) : responder(texto);

    // um mínimo de "digitando" deixa a conversa mais natural
    const minimo = reduzir ? 150 : ia ? 500 : Math.min(450 + r.texto.length * 4, 1500);
    await new Promise((ok) => setTimeout(ok, Math.max(0, minimo - (performance.now() - inicio))));

    digitando.remove();
    adicionar("bit", r.texto, r);
    historico.push({ quem: "bit", texto: semTags(r.texto).slice(0, 500) });
    mostrarSugestoes(r.sugestoes);
    if (r.balao) falarNoRobo(r.balao);
    estadoRobo(r.estado || "normal");
    if (r.pirueta) robo("robo:pirueta");
    ocupado = false;
  }

  let iniciou = false;
  function abrir() {
    painel.hidden = false;
    requestAnimationFrame(() => painel.classList.add("aberto"));
    abrirBotao.setAttribute("aria-expanded", "true");
    abrirBotao.classList.add("escondido");
    if (!iniciou) {
      iniciou = true;
      adicionar("bit", "Oi! 👋 Eu sou o <b>Bit</b>, o assistente do Isac. Posso te mostrar os projetos, explicar os serviços ou já preparar um pedido de orçamento. O que você quer saber?");
      mostrarSugestoes(SUGESTOES_INICIAIS);
      falarNoRobo("Oi! Bora conversar? 💬");
      estadoRobo("feliz");
    }
    setTimeout(() => campo.focus({ preventScroll: true }), 50);
  }

  function fechar() {
    painel.classList.remove("aberto");
    abrirBotao.setAttribute("aria-expanded", "false");
    abrirBotao.classList.remove("escondido");
    setTimeout(() => { if (!painel.classList.contains("aberto")) painel.hidden = true; }, 300);
    estadoRobo("normal");
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    enviar(campo.value);
  });
  campo.addEventListener("input", () => estadoRobo(campo.value ? "ouvindo" : "normal"));
  abrirBotao.addEventListener("click", () => (painel.classList.contains("aberto") ? fechar() : abrir()));
  fecharBotao.addEventListener("click", fechar);
  painel.addEventListener("keydown", (e) => { if (e.key === "Escape") { fechar(); abrirBotao.focus(); } });
  window.addEventListener("robo:clicado", () => { if (!painel.classList.contains("aberto")) abrir(); });

  // o Bit puxa assunto de vez em quando, conforme a seção que a pessoa está vendo
  const FALAS_SECAO = {
    projetos: "Esses são os projetos do Isac! 👀",
    servicos: "Precisa de algum desses? 😉",
    tecnologias: "Passa o mouse nas esferas!",
    sobre: "Esse é o meu criador 😄",
    contato: "Bora tirar a ideia do papel? 🚀",
  };
  const ditas = new Set();
  if ("IntersectionObserver" in window) {
    const obs = new IntersectionObserver((entradas) => {
      entradas.forEach((en) => {
        const fala = FALAS_SECAO[en.target.id];
        if (en.isIntersecting && fala && !ditas.has(en.target.id)) {
          ditas.add(en.target.id);
          falarNoRobo(fala);
          abrirBotao.classList.add("pulando");
          setTimeout(() => abrirBotao.classList.remove("pulando"), 1200);
        }
      });
    }, { threshold: 0.35 });
    Object.keys(FALAS_SECAO).forEach((id) => { const s = document.getElementById(id); if (s) obs.observe(s); });
  }
})();
