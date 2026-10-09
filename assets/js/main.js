(function () {
  const STATUS = {
    concluido: "Concluído",
    prototipo: "Protótipo",
    desenvolvimento: "Em desenvolvimento",
  };

  const projetos = (window.PROJETOS || []).filter((p) => p.publico);
  const grade = document.getElementById("grade");
  const dialogo = document.getElementById("detalhe");
  const conteudo = dialogo.querySelector(".detalhe-conteudo");

  const esc = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

  const externo = (url) => /^https?:\/\//.test(url);
  const link = (url, texto, classe) =>
    `<a class="btn ${classe}" href="${esc(url)}"${externo(url) ? ' target="_blank" rel="noopener"' : ""}>${texto}</a>`;

  const capa = (p, classe) =>
    p.imagem
      ? `<div class="${classe}"><img src="${esc(p.imagem)}" alt="Tela do projeto ${esc(p.nome)}" loading="lazy" width="960" height="600"></div>`
      : `<div class="${classe}"><div class="capa-vazia" aria-hidden="true">${esc(p.nome.slice(0, 2).toUpperCase())}</div></div>`;

  const selo = (p) => `<span class="status status-${p.status}">${STATUS[p.status]}</span>`;

  function card(p) {
    return `
      <article class="card${p.destaque ? " destaque" : ""}" data-categoria="${p.categoria}">
        ${capa(p, "card-capa")}
        <div class="card-corpo">
          <div class="card-topo"><h3>${esc(p.nome)}</h3>${selo(p)}</div>
          <p class="card-sub">${esc(p.subtitulo)}</p>
          <p class="card-resumo">${esc(p.resumo)}</p>
          <ul class="tags">${p.tecnologias.slice(0, 6).map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
          <div class="card-acoes">
            <button class="btn" data-abrir="${p.id}">Ver detalhes</button>
            ${p.demo ? link(p.demo, "Ver online", "btn-ghost") : ""}
            ${p.repo ? link(p.repo, "Código", "btn-ghost") : ""}
          </div>
        </div>
      </article>`;
  }

  function renderizar(filtro) {
    const lista = filtro === "todos" ? projetos : projetos.filter((p) => p.categoria === filtro);
    grade.innerHTML = lista.length
      ? lista.map(card).join("")
      : `<p class="vazio">Nenhum projeto publicado nesta categoria ainda.</p>`;
  }

  function abrir(id) {
    const p = projetos.find((x) => x.id === id);
    if (!p) return;
    conteudo.innerHTML = `
      <button class="fechar" aria-label="Fechar">×</button>
      ${p.imagem ? capa(p, "detalhe-capa") : ""}
      <div class="detalhe-corpo">
        <div>
          <div class="card-topo"><h2 id="detalhe-titulo">${esc(p.nome)}</h2>${selo(p)}</div>
          <p class="card-sub">${esc(p.subtitulo)}</p>
        </div>
        <section><h3>O problema</h3><p>${esc(p.problema)}</p></section>
        <section><h3>Funcionalidades</h3><ul class="lista">${p.funcionalidades.map((f) => `<li>${esc(f)}</li>`).join("")}</ul></section>
        <section><h3>Tecnologias</h3><ul class="tags">${p.tecnologias.map((t) => `<li>${esc(t)}</li>`).join("")}</ul></section>
        ${p.observacoes.length ? `<section class="obs"><ul>${p.observacoes.map((o) => `<li>${esc(o)}</li>`).join("")}</ul></section>` : ""}
        <div class="card-acoes">
          ${p.demo ? link(p.demo, "Ver online", "") : ""}
          ${p.repo ? link(p.repo, "Ver código no GitHub", "btn-ghost") : ""}
        </div>
      </div>`;
    if (!dialogo.open) dialogo.showModal();
    conteudo.querySelector(".fechar").focus();
    history.replaceState(null, "", `#${p.id}`);
  }

  function fechar() {
    if (dialogo.open) dialogo.close();
  }

  dialogo.addEventListener("close", () => history.replaceState(null, "", location.pathname + location.search));
  dialogo.addEventListener("click", (e) => {
    if (e.target === dialogo || e.target.closest(".fechar")) fechar();
  });

  grade.addEventListener("click", (e) => {
    const botao = e.target.closest("[data-abrir]");
    if (botao) abrir(botao.dataset.abrir);
  });

  document.querySelectorAll(".filtro").forEach((botao) => {
    botao.addEventListener("click", () => {
      document.querySelectorAll(".filtro").forEach((b) => {
        b.classList.toggle("ativo", b === botao);
        b.setAttribute("aria-selected", b === botao);
      });
      renderizar(botao.dataset.filtro);
    });
  });

  // Esconde filtros sem nenhum projeto publicado
  document.querySelectorAll(".filtro[data-filtro]").forEach((b) => {
    const f = b.dataset.filtro;
    if (f !== "todos" && !projetos.some((p) => p.categoria === f)) b.hidden = true;
  });

  renderizar("todos");

  // Link direto para um projeto: index.html#nutricare
  const alvo = location.hash.slice(1);
  if (projetos.some((p) => p.id === alvo)) abrir(alvo);
})();
