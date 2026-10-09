// Ponto de entrada das cenas 3D. Se o navegador não tiver WebGL
// (ou o CDN do Three.js falhar), a página continua completa sem o 3D.
const raiz = document.documentElement;

function temWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(window.WebGLRenderingContext && (c.getContext("webgl2") || c.getContext("webgl")));
  } catch {
    return false;
  }
}

async function iniciar() {
  if (!temWebGL()) throw new Error("WebGL indisponível");

  const [{ iniciarEstrelas }, { iniciarHero }, { iniciarTecnologias }, { iniciarPlaneta }] = await Promise.all([
    import("./cena-estrelas.js"),
    import("./cena-hero.js"),
    import("./cena-tecnologias.js"),
    import("./cena-planeta.js"),
  ]);

  // as texturas com texto usam as fontes do site
  const fontes = document.fonts
    ? Promise.all([
        document.fonts.load("500 24px 'JetBrains Mono'"),
        document.fonts.load("700 40px 'Space Grotesk'"),
        document.fonts.ready,
      ])
    : Promise.resolve();
  await Promise.race([fontes, new Promise((r) => setTimeout(r, 1500))]);

  const projetos = (window.PROJETOS || []).filter((p) => p.publico && p.imagem);
  iniciarEstrelas(document.getElementById("cena-estrelas"));
  iniciarHero(document.getElementById("cena-hero"), projetos);
  iniciarTecnologias(document.getElementById("cena-tecnologias"));
  iniciarPlaneta(document.getElementById("cena-planeta"));
  raiz.classList.add("com-3d");
}

iniciar().catch((erro) => {
  console.warn("3D desativado:", erro.message);
  raiz.classList.add("sem-3d");
});
