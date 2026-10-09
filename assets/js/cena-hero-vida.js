// ============================================================
//  "Vida" da estação de trabalho: robô assistente que segue o
//  mouse com os olhos e acena ao ser clicado, painéis de código
//  flutuando, segundo monitor com código rolando, xícara com
//  vapor e planta balançando.
// ============================================================
import * as THREE from "three";
import { texturaBrilho, reduzirMovimento, suavizar } from "./three-util.js";

const brilho = texturaBrilho();

// ---------- utilidades de textura ----------
function texturaCanvas(w, h, desenhar) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d");
  desenhar(g, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return { textura: t, canvas: c, g };
}

// pinta código com cores simples de sintaxe
const CORES_CODIGO = { kw: "#c084fc", fn: "#22d3ee", str: "#86efac", num: "#fbbf24", com: "#6b7280", txt: "#e5e7eb" };
function linhaColorida(g, texto, x, y) {
  const partes = texto.split(/(\s+|[(){}\[\],.;:=]|"[^"]*")/).filter(Boolean);
  for (const p of partes) {
    let cor = CORES_CODIGO.txt;
    if (/^(const|let|await|async|return|export|class|import|from|SELECT|FROM|WHERE|true|false|new|if)$/.test(p)) cor = CORES_CODIGO.kw;
    else if (/^"/.test(p)) cor = CORES_CODIGO.str;
    else if (/^\d+$/.test(p)) cor = CORES_CODIGO.num;
    else if (/^@?[A-Za-z_]+$/.test(p) && /^[a-z@]/.test(p)) cor = p.startsWith("@") ? CORES_CODIGO.fn : CORES_CODIGO.txt;
    if (/^[A-Z][a-z]/.test(p)) cor = CORES_CODIGO.fn;
    g.fillStyle = cor;
    g.fillText(p, x, y);
    x += g.measureText(p).width;
  }
}

const TRECHOS = [
  ["const projeto = await criar({", "  cliente,", "  prazo: \"combinado\",", "  testes: true,", "});"],
  ["@Controller(\"pacientes\")", "export class Pacientes {", "  @Get() listar() {", "    return this.db.todos();", "  }", "}"],
  ["SELECT nome, status", "FROM projetos", "WHERE publico = true;", "", "-- projetos reais"],
];

function painelCodigo(linhas) {
  return texturaCanvas(512, 300, (g, w, h) => {
    g.fillStyle = "rgba(12, 10, 32, 0.88)";
    g.beginPath();
    g.roundRect(4, 4, w - 8, h - 8, 22);
    g.fill();
    g.strokeStyle = "rgba(34, 211, 238, .7)";
    g.lineWidth = 3;
    g.stroke();
    ["#f43f5e", "#f59e0b", "#22c55e"].forEach((c, i) => {
      g.fillStyle = c;
      g.beginPath();
      g.arc(32 + i * 22, 30, 7, 0, Math.PI * 2);
      g.fill();
    });
    g.font = "500 24px 'JetBrains Mono', Consolas, monospace";
    linhas.forEach((l, i) => linhaColorida(g, l, 28, 82 + i * 38));
  });
}

export function adicionarVida({ raiz, cena, camera, canvas, mouse, pecas }) {
  const atualizacoes = [];

  // ======================================================
  // Robô assistente
  // ======================================================
  const robo = new THREE.Group();
  robo.position.set(-1.8, 2.55, 0.45);
  const corpoRobo = new THREE.Group(); // gira/pula sem mexer na posição base
  robo.add(corpoRobo);

  const branco = new THREE.MeshStandardMaterial({ color: "#eef2ff", roughness: 0.25, metalness: 0.1 });
  const cabeca = new THREE.Mesh(new THREE.SphereGeometry(0.34, 48, 32), branco);
  const visor = new THREE.Mesh(
    new THREE.SphereGeometry(0.345, 48, 32, -Math.PI * 0.32, Math.PI * 0.64, Math.PI * 0.3, Math.PI * 0.32),
    new THREE.MeshStandardMaterial({ color: "#0b0a1f", roughness: 0.15, metalness: 0.6 })
  );
  visor.rotation.y = Math.PI / 2; // virado para a frente (+z)
  const olhoMat = new THREE.MeshBasicMaterial({ color: "#22d3ee" });
  const olhoGeo = new THREE.CapsuleGeometry(0.035, 0.07, 4, 12);
  const olhoE = new THREE.Mesh(olhoGeo, olhoMat);
  const olhoD = new THREE.Mesh(olhoGeo, olhoMat);
  const olhos = new THREE.Group();
  olhos.add(olhoE, olhoD);
  olhoE.position.x = -0.09;
  olhoD.position.x = 0.09;
  olhos.position.set(0, 0.02, 0.33);
  const antena = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.16), branco);
  antena.position.y = 0.4;
  const bolinha = new THREE.Mesh(new THREE.SphereGeometry(0.04, 16, 12), new THREE.MeshBasicMaterial({ color: "#a855f7" }));
  bolinha.position.y = 0.5;
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: brilho, color: "#a855f7", transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  halo.position.y = 0.5;
  halo.scale.setScalar(0.3);
  const orelhaE = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.05, 24), new THREE.MeshStandardMaterial({ color: "#a855f7", emissive: "#a855f7", emissiveIntensity: 1.2 }));
  orelhaE.rotation.z = Math.PI / 2;
  orelhaE.position.x = -0.34;
  const orelhaD = orelhaE.clone();
  orelhaD.position.x = 0.34;

  // mãos flutuantes
  const maoGeo = new THREE.SphereGeometry(0.075, 20, 14);
  const maoE = new THREE.Mesh(maoGeo, branco);
  const maoD = new THREE.Mesh(maoGeo, branco);
  maoE.position.set(-0.45, -0.32, 0.05);
  maoD.position.set(0.45, -0.32, 0.05);

  // propulsor
  const propulsor = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.025, 10, 40), new THREE.MeshBasicMaterial({ color: "#22d3ee" }));
  propulsor.rotation.x = Math.PI / 2;
  propulsor.position.y = -0.4;
  const chama = new THREE.Mesh(
    new THREE.ConeGeometry(0.14, 0.5, 24, 1, true),
    new THREE.MeshBasicMaterial({ color: "#22d3ee", transparent: true, opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })
  );
  chama.rotation.x = Math.PI;
  chama.position.y = -0.68;
  const sombra = new THREE.Sprite(new THREE.SpriteMaterial({ map: brilho, color: "#22d3ee", transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending }));
  sombra.position.y = -0.55;
  sombra.scale.set(0.6, 0.6, 1);

  // balão de fala
  // o texto muda conforme a conversa com o chat (eventos "robo:falar")
  const balaoTex = texturaCanvas(640, 220, () => {});
  const balao = new THREE.Sprite(new THREE.SpriteMaterial({ map: balaoTex.textura, transparent: true, depthWrite: false }));
  balao.position.set(0.75, 0.85, 0);
  balao.material.opacity = 0;
  const balaoTam = { w: 0.9, h: 0.39 };

  function escreverBalao(texto) {
    const { g, canvas: c, textura } = balaoTex;
    g.clearRect(0, 0, c.width, c.height);
    g.font = "700 46px 'Space Grotesk', sans-serif";
    // quebra em até 2 linhas
    const palavras = texto.split(" ");
    const linhas = [""];
    for (const p of palavras) {
      const teste = (linhas[linhas.length - 1] + " " + p).trim();
      if (g.measureText(teste).width > 540 && linhas[linhas.length - 1] && linhas.length < 2) linhas.push(p);
      else linhas[linhas.length - 1] = teste;
    }
    const largura = Math.min(620, Math.max(...linhas.map((l) => g.measureText(l).width)) + 64);
    const altura = linhas.length * 54 + 34;
    const x0 = (c.width - largura) / 2;
    g.fillStyle = "#ffffff";
    g.beginPath();
    g.roundRect(x0, 4, largura, altura, 30);
    g.fill();
    g.beginPath(); // "rabinho" do balão apontando para o robô
    g.moveTo(x0 + 40, altura);
    g.lineTo(x0 + 22, altura + 30);
    g.lineTo(x0 + 82, altura);
    g.fill();
    g.fillStyle = "#1e1b4b";
    g.textAlign = "center";
    g.textBaseline = "middle";
    linhas.forEach((l, i) => g.fillText(l, c.width / 2, 4 + 17 + 27 + i * 54));
    textura.needsUpdate = true;
    // o sprite usa a textura inteira; o balão desenhado ocupa a parte de cima
    balaoTam.w = 1.25;
    balaoTam.h = 1.25 * (c.height / c.width);
  }
  escreverBalao("Olá! 👋");

  corpoRobo.add(cabeca, visor, olhos, antena, bolinha, halo, orelhaE, orelhaD, maoE, maoD, propulsor, chama, sombra);
  robo.add(balao);
  corpoRobo.scale.setScalar(1.35);
  raiz.add(robo);
  pecas.push({ obj: robo, atraso: 0.9, tipo: "escala" });

  // estado do robô
  const estado = { piscar: 2 + Math.random() * 2, piscando: 0, aceno: 0, giro: 0, falar: 0 };
  const alvoOlhar = new THREE.Vector3();
  const tmp = new THREE.Vector3();

  // clique no robô: acena, dá uma pirueta e fala
  const raycaster = new THREE.Raycaster();
  const ponteiro = new THREE.Vector2();
  let inicioClique = null;
  canvas.addEventListener("pointerdown", (e) => { inicioClique = { x: e.clientX, y: e.clientY }; });
  canvas.addEventListener("pointerup", (e) => {
    if (!inicioClique || Math.hypot(e.clientX - inicioClique.x, e.clientY - inicioClique.y) > 6) return;
    const r = canvas.getBoundingClientRect();
    ponteiro.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    raycaster.setFromCamera(ponteiro, camera);
    if (raycaster.intersectObject(corpoRobo, true).length) {
      cutucar();
      window.dispatchEvent(new CustomEvent("robo:clicado")); // abre o chat
    }
  });
  canvas.addEventListener("pointermove", (e) => {
    const r = canvas.getBoundingClientRect();
    ponteiro.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    raycaster.setFromCamera(ponteiro, camera);
    canvas.style.cursor = raycaster.intersectObject(cabeca).length ? "pointer" : "";
  });
  function cutucar() {
    estado.aceno = 1.6;
    estado.giro = 1;
  }
  function falar(texto, duracao = 3.2) {
    escreverBalao(texto);
    estado.falar = duracao;
  }

  // conversa com o chat (assets/js/bot.js)
  let humor = "normal"; // normal | pensando | ouvindo | feliz
  let humorAte = 0;
  let conversou = false;
  window.addEventListener("robo:falar", (e) => { conversou = true; falar(e.detail.texto); });
  window.addEventListener("robo:pirueta", cutucar);
  window.addEventListener("robo:estado", (e) => {
    humor = e.detail.estado;
    humorAte = performance.now() + (humor === "feliz" ? 2200 : 60000);
    if (humor === "feliz") estado.aceno = Math.max(estado.aceno, 0.8);
  });

  // ele cumprimenta sozinho logo depois de aparecer e, se ninguém conversar, chama de novo
  setTimeout(() => { cutucar(); falar("Olá! 👋 Eu sou o Bit"); }, 2600);
  const convites = ["Clica em mim! 💬", "Quer ver os projetos? 👀", "Posso ajudar? 🤖", "Bora conversar? 💜"];
  let convite = 0;
  setInterval(() => {
    if (!conversou && !document.hidden && estado.falar <= 0) falar(convites[convite++ % convites.length], 3);
  }, 11000);

  atualizacoes.push((t, dt) => {
    // flutua
    robo.position.y = 2.55 + Math.sin(t * 1.6) * 0.09;
    robo.position.x = -1.8 + Math.sin(t * 0.7) * 0.05;

    if (humor !== "normal" && performance.now() > humorAte) humor = "normal";

    // para onde ele olha: o mouse, o chat (ouvindo) ou para cima (pensando)
    let olharX = mouse.x, olharY = mouse.y;
    if (humor === "ouvindo") { olharX = 1; olharY = 0.8; }
    if (humor === "pensando") { olharX = 0.6 + Math.sin(t * 3) * 0.3; olharY = -0.9; }

    // corpo inclina na direção do olhar
    corpoRobo.rotation.y = THREE.MathUtils.lerp(corpoRobo.rotation.y, 0.35 + olharX * 0.6, 0.08);
    corpoRobo.rotation.x = THREE.MathUtils.lerp(corpoRobo.rotation.x, olharY * 0.25, 0.08);
    corpoRobo.rotation.z = humor === "pensando" ? Math.sin(t * 2) * 0.15 : Math.sin(t * 1.2) * 0.05;

    // olhos acompanham
    alvoOlhar.set(olharX * 0.06, -olharY * 0.04 + 0.02, 0.33);
    olhos.position.lerp(alvoOlhar, 0.15);

    // feliz: dá pulinhos
    if (humor === "feliz") robo.position.y += Math.abs(Math.sin(t * 7)) * 0.08;

    // piscar
    estado.piscar -= dt;
    if (estado.piscar <= 0) {
      estado.piscando = 0.14;
      estado.piscar = 2.5 + Math.random() * 3;
    }
    estado.piscando = Math.max(0, estado.piscando - dt);
    // olhos "sorrindo" (apertados) quando está feliz
    const fechado = estado.piscando > 0 ? 0.12 : humor === "feliz" ? 0.45 : 1;
    olhos.scale.y = THREE.MathUtils.lerp(olhos.scale.y, fechado, 0.5);

    // pirueta
    if (estado.giro > 0) {
      estado.giro = Math.max(0, estado.giro - dt * 1.1);
      const k = suavizar(1 - estado.giro);
      corpoRobo.rotation.y += k * Math.PI * 2;
      robo.position.y += Math.sin(k * Math.PI) * 0.35;
    }

    // acenar com a mão direita
    if (estado.aceno > 0) {
      estado.aceno = Math.max(0, estado.aceno - dt);
      maoD.position.set(0.5, 0.05 + Math.sin(t * 14) * 0.03, 0.12);
      maoD.position.x = 0.48 + Math.sin(t * 14) * 0.08;
    } else {
      maoD.position.lerp(tmp.set(0.45, -0.32 + Math.sin(t * 2 + 1) * 0.04, 0.05), 0.1);
    }
    maoE.position.y = -0.32 + Math.sin(t * 2) * 0.04;

    // balão de fala
    estado.falar = Math.max(0, estado.falar - dt);
    const alvoBalao = estado.falar > 0 ? 1 : 0;
    balao.material.opacity += (alvoBalao - balao.material.opacity) * 0.15;
    const s = 0.6 + balao.material.opacity * 0.4;
    balao.scale.set(balaoTam.w * s, balaoTam.h * s, 1);
    balao.visible = balao.material.opacity > 0.01;

    // propulsor e antena (a antena pisca rápido quando está pensando)
    chama.scale.y = 0.8 + Math.sin(t * 30) * 0.15 + Math.random() * 0.1;
    chama.material.opacity = 0.25 + Math.random() * 0.12;
    halo.material.opacity = humor === "pensando" ? (Math.sin(t * 20) > 0 ? 1 : 0.2) : 0.6 + Math.sin(t * 4) * 0.4;
    bolinha.material.color.set(humor === "pensando" ? "#fbbf24" : humor === "ouvindo" ? "#22d3ee" : "#a855f7");
    halo.material.color.copy(bolinha.material.color);
    olhoMat.color.setHSL(humor === "feliz" ? 0.85 : 0.52 + Math.sin(t * 0.5) * 0.04, 1, 0.6);
  });

  // ======================================================
  // Painéis de código flutuando ao redor da estação
  // ======================================================
  const paineis = TRECHOS.map((linhas, i) => {
    const { textura } = painelCodigo(linhas);
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(1.0, 0.585),
      new THREE.MeshBasicMaterial({ map: textura, transparent: true, depthWrite: false, side: THREE.DoubleSide })
    );
    m.userData = { fase: (i / TRECHOS.length) * Math.PI * 2 + 0.6, altura: 2.95 + i * 0.32 };
    cena.add(m);
    return m;
  });
  const inicio = performance.now();
  atualizacoes.push((t) => {
    const aparecer = reduzirMovimento ? 1 : suavizar(((performance.now() - inicio) / 1000 - 1.6) / 1.2);
    paineis.forEach((p) => {
      const a = p.userData.fase + t * 0.16;
      p.position.set(Math.cos(a) * 2.35, p.userData.altura - 0.55 + Math.sin(t * 0.9 + p.userData.fase) * 0.12, Math.sin(a) * 2.3 - 0.4);
      p.quaternion.copy(camera.quaternion);
      // some quando passa por trás da mesa
      const frente = Math.sin(a) > -0.2 ? 1 : Math.max(0, 1 + (Math.sin(a) + 0.2) * 4);
      p.material.opacity = 0.92 * frente * aparecer;
      p.visible = p.material.opacity > 0.02;
    });
  });

  // ======================================================
  // Segundo monitor (vertical) com código rolando
  // ======================================================
  const lateral = new THREE.Group();
  lateral.position.set(-1.62, 1.21, -0.25);
  lateral.rotation.y = 0.55;
  const metal = new THREE.MeshStandardMaterial({ color: "#151229", roughness: 0.45, metalness: 0.6 });
  const pe = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.04, 0.26), metal);
  const hasteL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.4, 0.05), metal);
  hasteL.position.y = 0.22;
  const molduraL = new THREE.Mesh(new THREE.BoxGeometry(0.66, 1.06, 0.05), metal);
  molduraL.position.y = 0.88;
  const codigo = texturaCanvas(320, 520, () => {});
  const telaL = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.98), new THREE.MeshBasicMaterial({ map: codigo.textura, toneMapped: false }));
  telaL.position.set(0, 0.88, 0.027);
  lateral.add(pe, hasteL, molduraL, telaL);
  raiz.add(lateral);
  pecas.push({ obj: lateral, atraso: 0.4 });

  const linhasCodigo = [
    ...TRECHOS.flat(),
    "async function deploy() {", "  await testes.rodar();", "  await build();", "  return publicar();", "}",
    "", "// bem-vindo ao meu portfólio", "const isac = new Dev({", "  stack: \"full\",", "});",
  ];
  let ultimoCodigo = -1;
  atualizacoes.push((t) => {
    const q = Math.floor(t * 15);
    if (q === ultimoCodigo) return;
    ultimoCodigo = q;
    const { g, canvas: c } = codigo;
    g.fillStyle = "#07061a";
    g.fillRect(0, 0, c.width, c.height);
    g.font = "500 15px 'JetBrains Mono', Consolas, monospace";
    const altura = 22;
    const desloc = (t * 26) % (linhasCodigo.length * altura);
    for (let i = 0; i < linhasCodigo.length * 2; i++) {
      const y = 24 + i * altura - desloc;
      if (y < -10 || y > c.height + 10) continue;
      g.fillStyle = "#4b5563";
      g.fillText(String((i % linhasCodigo.length) + 1).padStart(2, " "), 8, y);
      linhaColorida(g, linhasCodigo[i % linhasCodigo.length], 40, y);
    }
    // cursor piscando
    if (Math.floor(t * 2) % 2) {
      g.fillStyle = "#22d3ee";
      g.fillRect(40, c.height - 34, 9, 18);
    }
    codigo.textura.needsUpdate = true;
  });

  // ======================================================
  // Xícara com vapor
  // ======================================================
  const xicara = new THREE.Group();
  xicara.position.set(-1.45, 1.21, 0.6);
  const copo = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.085, 0.2, 28),
    new THREE.MeshStandardMaterial({ color: "#a855f7", emissive: "#6d28d9", emissiveIntensity: 0.4, roughness: 0.3 })
  );
  copo.position.y = 0.1;
  const alca = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.015, 8, 20, Math.PI), copo.material);
  alca.position.set(0.11, 0.1, 0);
  alca.rotation.z = -Math.PI / 2;
  const cafe = new THREE.Mesh(new THREE.CircleGeometry(0.088, 24), new THREE.MeshStandardMaterial({ color: "#3b2416", roughness: 0.2 }));
  cafe.rotation.x = -Math.PI / 2;
  cafe.position.y = 0.19;
  xicara.add(copo, alca, cafe);
  const vapores = Array.from({ length: 6 }, (_, i) => {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: brilho, color: "#e0e7ff", transparent: true, opacity: 0, depthWrite: false }));
    s.userData.fase = i / 6;
    xicara.add(s);
    return s;
  });
  raiz.add(xicara);
  pecas.push({ obj: xicara, atraso: 0.65 });
  atualizacoes.push((t) => {
    vapores.forEach((s) => {
      const k = (t * 0.35 + s.userData.fase) % 1;
      s.position.set(Math.sin(k * 6 + s.userData.fase * 9) * 0.05, 0.22 + k * 0.55, 0);
      s.scale.setScalar(0.08 + k * 0.18);
      s.material.opacity = Math.sin(k * Math.PI) * 0.35;
    });
  });

  // ======================================================
  // Planta balançando
  // ======================================================
  const planta = new THREE.Group();
  planta.position.set(1.62, 1.21, 0.55);
  const vaso = new THREE.Mesh(
    new THREE.CylinderGeometry(0.11, 0.08, 0.18, 24),
    new THREE.MeshStandardMaterial({ color: "#1e1b3a", roughness: 0.5, metalness: 0.3 })
  );
  vaso.position.y = 0.09;
  const faixa = new THREE.Mesh(new THREE.TorusGeometry(0.105, 0.008, 6, 32), new THREE.MeshBasicMaterial({ color: "#22d3ee" }));
  faixa.rotation.x = Math.PI / 2;
  faixa.position.y = 0.15;
  planta.add(vaso, faixa);
  const folhaMat = new THREE.MeshStandardMaterial({ color: "#34d399", emissive: "#059669", emissiveIntensity: 0.35, roughness: 0.5, side: THREE.DoubleSide });
  const folhas = [];
  for (let i = 0; i < 7; i++) {
    const haste = new THREE.Group();
    haste.position.y = 0.17;
    haste.rotation.y = (i / 7) * Math.PI * 2;
    const folha = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 8), folhaMat);
    folha.scale.set(0.35, 1, 0.12);
    folha.position.set(0, 0.1, 0.06);
    folha.rotation.x = 0.5;
    haste.add(folha);
    haste.userData = { base: 0.35 + (i % 3) * 0.12, fase: i * 0.9 };
    planta.add(haste);
    folhas.push(haste);
  }
  raiz.add(planta);
  pecas.push({ obj: planta, atraso: 0.7, tipo: "escala" });
  atualizacoes.push((t) => {
    folhas.forEach((h) => {
      h.rotation.x = h.userData.base + Math.sin(t * 1.4 + h.userData.fase) * 0.12;
      h.rotation.z = Math.sin(t * 1.1 + h.userData.fase) * 0.06;
    });
  });

  return (t, dt) => atualizacoes.forEach((f) => f(t, dt));
}
