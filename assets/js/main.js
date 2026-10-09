(function () {
  const STATUS = {
    concluido: "Concluído",
    prototipo: "Protótipo",
    desenvolvimento: "Em desenvolvimento",
  };
  const TIPO = {
    fullstack: "Sistema",
    web: "Site",
    automacao: "Automação",
    games: "Game",
  };

  const reduzir = window.matchMedia("(prefers-reduced-motion: reduce)");
  const toque = window.matchMedia("(pointer: coarse)");
  const projetos = (window.PROJETOS || []).filter((p) => p.publico);
  const grade = document.getElementById("grade");
  const dialogo = document.getElementById("detalhe");
  const conteudo = dialogo.querySelector(".detalhe-conteudo");

  const esc = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

  const externo = (url) => /^https?:\/\//.test(url);
  const link = (url, texto, classe) =>
    `<a class="btn ${classe}" href="${esc(url)}"${externo(url) ? ' target="_blank" rel="noopener"' : ""}>${texto}</a>`;

  const capa = (p, classe, extra = "") =>
    `<div class="${classe}">${extra}${
      p.imagem
        ? `<img src="${esc(p.imagem)}" alt="Tela do projeto ${esc(p.nome)}" loading="lazy" decoding="async" width="960" height="600">`
        : `<div class="capa-vazia" aria-hidden="true">${esc(p.nome.slice(0, 2).toUpperCase())}</div>`
    }</div>`;

  const selo = (p) => `<span class="status status-${p.status}">${STATUS[p.status]}</span>`;

  // ---------- cards de projeto ----------
  function card(p, i) {
    return `
      <article class="card${p.destaque ? " destaque" : ""}" style="--i:${i}">
        <div class="card-in">
          ${capa(p, "card-capa", `<span class="card-tipo">${TIPO[p.categoria] || ""}</span>`)}
          <div class="card-corpo">
            <div class="card-topo"><h3>${esc(p.nome)}</h3>${selo(p)}</div>
            <p class="card-sub">${esc(p.subtitulo)}</p>
            <p class="card-resumo">${esc(p.resumo)}</p>
            <ul class="tags" aria-label="Tecnologias">${p.tecnologias.slice(0, 6).map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
            <div class="card-acoes">
              <button class="btn btn-brilho" data-abrir="${p.id}">Ver detalhes</button>
              ${p.demo ? link(p.demo, "Ver online", "btn-vidro") : ""}
              ${p.repo ? link(p.repo, "Código", "btn-vidro") : ""}
            </div>
          </div>
        </div>
      </article>`;
  }

  function renderizar(filtro) {
    const lista = filtro === "todos" ? projetos : projetos.filter((p) => p.categoria === filtro);
    grade.innerHTML = lista.length
      ? lista.map(card).join("")
      : `<p class="vazio">Nenhum projeto publicado nesta categoria ainda.</p>`;
    ativarInclinacao();
  }

  // ---------- inclinação 3D dos cards ----------
  function ativarInclinacao() {
    if (reduzir.matches || toque.matches) return;
    grade.querySelectorAll(".card").forEach((el) => {
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width;
        const y = (e.clientY - r.top) / r.height;
        el.classList.add("inclinando");
        el.style.setProperty("--ry", `${(x - 0.5) * 10}deg`);
        el.style.setProperty("--rx", `${(0.5 - y) * 8}deg`);
        el.style.setProperty("--gx", `${x * 100}%`);
        el.style.setProperty("--gy", `${y * 100}%`);
      });
      el.addEventListener("pointerleave", () => {
        el.classList.remove("inclinando");
        el.style.setProperty("--rx", "0deg");
        el.style.setProperty("--ry", "0deg");
      });
    });
  }

  // ---------- detalhes (modal) ----------
  function abrir(id) {
    const p = projetos.find((x) => x.id === id);
    if (!p) return;
    conteudo.innerHTML = `
      <button class="fechar" aria-label="Fechar">×</button>
      ${p.imagem ? capa(p, "detalhe-capa") : ""}
      <div class="detalhe-corpo">
        <div>
          <p class="sobretitulo">${TIPO[p.categoria] || "Projeto"}</p>
          <div class="card-topo"><h2 id="detalhe-titulo">${esc(p.nome)}</h2>${selo(p)}</div>
          <p class="card-sub" style="margin-top:10px">${esc(p.subtitulo)}</p>
        </div>
        <section><h3>O problema</h3><p>${esc(p.problema)}</p></section>
        <section><h3>O que foi entregue</h3><ul class="entregas">${p.funcionalidades.map((f) => `<li>${esc(f)}</li>`).join("")}</ul></section>
        <section><h3>Tecnologias</h3><ul class="tags">${p.tecnologias.map((t) => `<li>${esc(t)}</li>`).join("")}</ul></section>
        ${p.observacoes.length ? `<section class="obs"><ul>${p.observacoes.map((o) => `<li>${esc(o)}</li>`).join("")}</ul></section>` : ""}
        <div class="card-acoes">
          ${p.demo ? link(p.demo, "Ver online", "btn-brilho") : ""}
          ${p.repo ? link(p.repo, "Ver código no GitHub", "btn-vidro") : ""}
        </div>
      </div>`;
    if (!dialogo.open) dialogo.showModal();
    conteudo.querySelector(".fechar").focus();
    history.replaceState(null, "", `#${p.id}`);
  }

  dialogo.addEventListener("close", () => history.replaceState(null, "", location.pathname + location.search));
  dialogo.addEventListener("click", (e) => {
    if (e.target === dialogo || e.target.closest(".fechar")) dialogo.close();
  });

  grade.addEventListener("click", (e) => {
    const botao = e.target.closest("[data-abrir]");
    if (botao) abrir(botao.dataset.abrir);
  });

  // ---------- filtros ----------
  const filtros = document.querySelectorAll(".filtro");
  filtros.forEach((botao) => {
    const f = botao.dataset.filtro;
    if (f !== "todos" && !projetos.some((p) => p.categoria === f)) botao.hidden = true;
    botao.addEventListener("click", () => {
      filtros.forEach((b) => {
        b.classList.toggle("ativo", b === botao);
        b.setAttribute("aria-pressed", b === botao);
      });
      renderizar(f);
    });
  });

  // ---------- menu mobile ----------
  const menuBotao = document.querySelector(".menu-botao");
  const menu = document.getElementById("menu");
  function alternarMenu(abrirMenu) {
    menu.classList.toggle("aberto", abrirMenu);
    document.documentElement.classList.toggle("menu-aberto", abrirMenu);
    menuBotao.setAttribute("aria-expanded", abrirMenu);
    menuBotao.setAttribute("aria-label", abrirMenu ? "Fechar menu" : "Abrir menu");
  }
  menuBotao.addEventListener("click", () => alternarMenu(!menu.classList.contains("aberto")));
  menu.addEventListener("click", (e) => { if (e.target.closest("a")) alternarMenu(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && menu.classList.contains("aberto")) alternarMenu(false); });

  // ---------- seção ativa no menu + revelar ao rolar ----------
  const linksMenu = document.querySelectorAll(".menu a[data-secao]");
  if ("IntersectionObserver" in window) {
    const obsSecao = new IntersectionObserver((entradas) => {
      entradas.forEach((en) => {
        if (en.isIntersecting) linksMenu.forEach((a) => a.classList.toggle("ativo", a.dataset.secao === en.target.id));
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    document.querySelectorAll("main section[id]").forEach((s) => obsSecao.observe(s));

    const obsRevelar = new IntersectionObserver((entradas) => {
      entradas.forEach((en) => {
        if (en.isIntersecting) {
          en.target.classList.add("visivel");
          obsRevelar.unobserve(en.target);
        }
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -40px 0px" });
    document.querySelectorAll(".revelar").forEach((el) => {
      // escalona elementos irmãos (cards de serviço, itens da linha do tempo)
      const irmaos = [...el.parentElement.children].filter((c) => c.classList.contains("revelar"));
      el.style.transitionDelay = `${irmaos.indexOf(el) * 90}ms`;
      obsRevelar.observe(el);
    });
  } else {
    document.querySelectorAll(".revelar").forEach((el) => el.classList.add("visivel"));
  }

  // ---------- fundo do topo aparece ao rolar ----------
  const marcarRolagem = () => document.documentElement.classList.toggle("rolou", window.scrollY > 20);
  window.addEventListener("scroll", marcarRolagem, { passive: true });
  marcarRolagem();

  // ---------- texto digitando no topo ----------
  const papeis = ["Desenvolvedor Full Stack", "Sistemas web e SaaS", "Aplicativos mobile", "Automação e IA"];
  const alvoTexto = document.getElementById("digitando");
  if (alvoTexto && !reduzir.matches) {
    let p = 0, letra = papeis[0].length, apagando = true;
    const passo = () => {
      const palavra = papeis[p];
      letra += apagando ? -1 : 1;
      alvoTexto.textContent = palavra.slice(0, letra);
      let espera = apagando ? 35 : 70;
      if (!apagando && letra === palavra.length) { apagando = true; espera = 2200; }
      else if (apagando && letra === 0) { apagando = false; p = (p + 1) % papeis.length; espera = 300; }
      setTimeout(passo, espera);
    };
    setTimeout(passo, 2600);
  }

  // ---------- início ----------
  renderizar("todos");

  // link direto para um projeto: /#nutricare
  const abrirPeloHash = () => {
    const alvo = location.hash.slice(1);
    if (projetos.some((p) => p.id === alvo)) abrir(alvo);
  };
  window.addEventListener("hashchange", abrirPeloHash);
  abrirPeloHash();
})();
