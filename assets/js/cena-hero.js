// ============================================================
//  Estação de trabalho neon em 3D (topo da página)
//  Tudo gerado por código: mesa, monitor, teclado, gabinete
//  com LEDs. A tela do monitor exibe as capturas reais dos
//  projetos publicados, trocando de tempos em tempos.
// ============================================================
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { criarPalco, criarMouse, texturaBrilho, reduzirMovimento, toque, celular, suavizar } from "./three-util.js";
import { adicionarVida } from "./cena-hero-vida.js";

const caixa = (l, a, p, r = 0.03) => new RoundedBoxGeometry(l, a, p, 3, r);
const CIANO = new THREE.Color("#22d3ee");
const ROXO = new THREE.Color("#a855f7");
const BRANCO = new THREE.Color("#ffffff");
const corOnda = new THREE.Color();

export function iniciarHero(canvas, imagens = []) {
  const mouse = criarMouse();
  const pecas = []; // peças com animação de entrada
  const inicio = performance.now();
  let rolagem = 0;
  window.addEventListener("scroll", () => { rolagem = window.scrollY; }, { passive: true });

  const palco = criarPalco(canvas, { fov: 34, atualizar });
  const { cena, camera, renderer } = palco;
  camera.position.set(0.3, 2.5, 9.2);

  const raiz = new THREE.Group();
  raiz.position.y = -0.55;
  cena.add(raiz);

  // ---------- luzes ----------
  cena.add(new THREE.AmbientLight("#6d5bd0", 0.55));
  const chave = new THREE.DirectionalLight("#ffffff", 1.1);
  chave.position.set(3, 5, 4);
  cena.add(chave);
  const luzRoxa = new THREE.PointLight("#a855f7", 18, 9, 1.6);
  luzRoxa.position.set(-2.4, 1.6, 1.2);
  const luzCiano = new THREE.PointLight("#22d3ee", 14, 9, 1.6);
  luzCiano.position.set(2.6, 1.2, 1.6);
  cena.add(luzRoxa, luzCiano);

  // ---------- materiais ----------
  const metalEscuro = new THREE.MeshStandardMaterial({ color: "#151229", roughness: 0.45, metalness: 0.6 });
  const metalMedio = new THREE.MeshStandardMaterial({ color: "#232042", roughness: 0.35, metalness: 0.7 });
  const neon = (cor, forca = 2.2) => new THREE.MeshStandardMaterial({ color: cor, emissive: cor, emissiveIntensity: forca, roughness: 0.4 });
  const neonCiano = neon("#22d3ee");
  const neonRoxo = neon("#a855f7");

  // ---------- chão: disco com anéis neon ----------
  const chao = new THREE.Group();
  const disco = new THREE.Mesh(new THREE.CircleGeometry(3.0, 64), new THREE.MeshStandardMaterial({ color: "#0b0920", roughness: 0.9, metalness: 0.2 }));
  disco.rotation.x = -Math.PI / 2;
  const anel = (r, cor, op) => {
    const m = new THREE.Mesh(new THREE.RingGeometry(r, r + 0.025, 96), new THREE.MeshBasicMaterial({ color: cor, transparent: true, opacity: op, side: THREE.DoubleSide }));
    m.rotation.x = -Math.PI / 2;
    m.position.y = 0.002;
    return m;
  };
  const anel1 = anel(2.95, "#22d3ee", 0.9);
  const anel2 = anel(2.35, "#a855f7", 0.45);
  chao.add(disco, anel1, anel2);
  raiz.add(chao);
  pecas.push({ obj: chao, atraso: 0, tipo: "escala" });

  // ---------- mesa ----------
  const mesa = new THREE.Group();
  const tampo = new THREE.Mesh(caixa(4.2, 0.12, 1.9, 0.04), metalMedio);
  tampo.position.y = 1.15;
  const fitaMesa = new THREE.Mesh(caixa(4.22, 0.025, 0.02, 0.01), neonCiano);
  fitaMesa.position.set(0, 1.13, 0.955);
  mesa.add(tampo, fitaMesa);
  for (const x of [-1.95, 1.95]) {
    const perna = new THREE.Mesh(caixa(0.1, 1.1, 1.6, 0.03), metalEscuro);
    perna.position.set(x, 0.55, 0);
    mesa.add(perna);
  }
  raiz.add(mesa);
  pecas.push({ obj: mesa, atraso: 0.15 });

  // ---------- monitor com tela dinâmica ----------
  const monitor = new THREE.Group();
  monitor.position.set(-0.15, 1.21, -0.45);
  const base = new THREE.Mesh(caixa(0.7, 0.05, 0.4, 0.02), metalEscuro);
  const haste = new THREE.Mesh(caixa(0.1, 0.62, 0.08, 0.02), metalEscuro);
  haste.position.set(0, 0.33, -0.05);
  const moldura = new THREE.Mesh(caixa(2.7, 1.6, 0.09, 0.05), metalEscuro);
  moldura.position.set(0, 1.28, 0);
  const brilhoMoldura = new THREE.Mesh(caixa(2.76, 1.66, 0.04, 0.05), neonRoxo);
  brilhoMoldura.position.set(0, 1.28, -0.04);

  // canvas que vira a textura da tela
  const telaCanvas = document.createElement("canvas");
  telaCanvas.width = 1024;
  telaCanvas.height = 600;
  const g = telaCanvas.getContext("2d");
  const telaTextura = new THREE.CanvasTexture(telaCanvas);
  telaTextura.colorSpace = THREE.SRGBColorSpace;
  telaTextura.anisotropy = renderer.capabilities.getMaxAnisotropy();
  const tela = new THREE.Mesh(new THREE.PlaneGeometry(2.56, 1.47), new THREE.MeshBasicMaterial({ map: telaTextura, toneMapped: false }));
  tela.position.set(0, 1.28, 0.047);
  monitor.add(base, haste, brilhoMoldura, moldura, tela);
  raiz.add(monitor);
  pecas.push({ obj: monitor, atraso: 0.35 });

  // carrega as capturas e alterna entre elas
  const fotos = [];
  imagens.forEach((p) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => fotos.push({ img, nome: p.nome });
    img.src = p.imagem;
  });
  let ultimaTela = -1;

  function desenharTela(t) {
    const W = telaCanvas.width, H = telaCanvas.height;
    g.fillStyle = "#0a0820";
    g.fillRect(0, 0, W, H);

    // barra do navegador
    g.fillStyle = "#14112c";
    g.fillRect(0, 0, W, 44);
    ["#f43f5e", "#f59e0b", "#22c55e"].forEach((c, i) => {
      g.fillStyle = c;
      g.beginPath();
      g.arc(26 + i * 24, 22, 7, 0, Math.PI * 2);
      g.fill();
    });

    if (fotos.length) {
      const ciclo = 4.5;
      const idx = Math.floor(t / ciclo) % fotos.length;
      const prog = (t % ciclo) / ciclo;
      const { img, nome } = fotos[idx];
      // leve "rolagem" da página dentro da tela
      const escala = W / img.width;
      const altura = img.height * escala;
      const desloc = Math.max(0, altura - (H - 44)) * suavizar(prog);
      g.globalAlpha = Math.min(1, prog * 6, (1 - prog) * 8);
      g.drawImage(img, 0, 44 - desloc, W, altura);
      g.globalAlpha = 1;
      g.fillStyle = "#1e1b3a";
      g.fillRect(110, 11, 420, 22);
      g.fillStyle = "#a5b4fc";
      g.font = "500 15px Inter, sans-serif";
      g.fillText(`isacbuzelli.dev / ${nome.toLowerCase()}`, 122, 27);
    } else {
      g.fillStyle = "#22d3ee";
      g.font = "600 40px 'Space Grotesk', sans-serif";
      g.fillText("ISAC BUZELLI", 60, 320);
    }

    // linhas de varredura + reflexo
    g.fillStyle = "rgba(255,255,255,.035)";
    for (let y = 44; y < H; y += 4) g.fillRect(0, y, W, 1);
    const refl = g.createLinearGradient(0, 0, W, H);
    refl.addColorStop(0, "rgba(255,255,255,.07)");
    refl.addColorStop(0.4, "rgba(255,255,255,0)");
    g.fillStyle = refl;
    g.fillRect(0, 0, W, H);
    telaTextura.needsUpdate = true;
  }

  // ---------- teclado com teclas que acendem ----------
  const teclado = new THREE.Group();
  teclado.position.set(-0.2, 1.24, 0.42);
  teclado.rotation.x = 0.06;
  const baseTeclado = new THREE.Mesh(caixa(1.9, 0.06, 0.62, 0.02), metalEscuro);
  teclado.add(baseTeclado);
  const colunas = 15, linhas = 4;
  const teclaGeo = caixa(0.105, 0.04, 0.105, 0.015);
  const teclaMat = new THREE.MeshBasicMaterial({ toneMapped: false });
  const teclas = new THREE.InstancedMesh(teclaGeo, teclaMat, colunas * linhas);
  const corTecla = new THREE.Color();
  const brilhoTecla = new Float32Array(colunas * linhas);
  const m4 = new THREE.Matrix4();
  for (let l = 0; l < linhas; l++) {
    for (let c = 0; c < colunas; c++) {
      const i = l * colunas + c;
      m4.setPosition(-0.84 + c * 0.12, 0.05, -0.2 + l * 0.13);
      teclas.setMatrixAt(i, m4);
      teclas.setColorAt(i, corTecla.set("#2a2550"));
    }
  }
  teclado.add(teclas);
  const mouseMesa = new THREE.Mesh(caixa(0.16, 0.06, 0.26, 0.05), metalEscuro);
  mouseMesa.position.set(1.15, 0.0, 0.05);
  const ledMouse = new THREE.Mesh(caixa(0.02, 0.012, 0.12, 0.005), neonCiano);
  ledMouse.position.set(1.15, 0.035, 0.0);
  teclado.add(mouseMesa, ledMouse);
  raiz.add(teclado);
  pecas.push({ obj: teclado, atraso: 0.55 });

  // ---------- gabinete com vidro, ventoinhas e LEDs ----------
  const pc = new THREE.Group();
  pc.position.set(1.62, 1.21, -0.35);
  const corpo = new THREE.Mesh(caixa(0.62, 1.25, 1.05, 0.04), metalEscuro);
  corpo.position.y = 0.625;
  const vidro = new THREE.Mesh(
    new THREE.PlaneGeometry(0.98, 1.15),
    new THREE.MeshPhysicalMaterial({ color: "#8b5cf6", transparent: true, opacity: 0.18, roughness: 0.05, metalness: 0.1 })
  );
  vidro.rotation.y = Math.PI / 2;
  vidro.position.set(0.315, 0.625, 0);
  const fitaPc = new THREE.Mesh(caixa(0.02, 1.18, 0.02, 0.008), neonRoxo);
  fitaPc.position.set(0.3, 0.625, 0.5);
  const fitaPc2 = fitaPc.clone();
  fitaPc2.position.z = -0.5;
  pc.add(corpo, vidro, fitaPc, fitaPc2);
  const ventoinhas = [];
  for (const y of [0.32, 0.92]) {
    const v = new THREE.Group();
    v.position.set(0.2, y, 0);
    v.rotation.y = Math.PI / 2;
    const aro = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.025, 10, 40), neonCiano.clone());
    const pas = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.02, 6, 1), new THREE.MeshStandardMaterial({ color: "#3b3570", metalness: 0.5, roughness: 0.4, flatShading: true }));
    pas.rotation.x = Math.PI / 2;
    v.add(aro, pas);
    pc.add(v);
    ventoinhas.push({ v: pas, aro });
  }
  raiz.add(pc);
  pecas.push({ obj: pc, atraso: 0.45 });


  // ---------- partículas subindo ----------
  const nPart = celular ? 50 : 120;
  const partPos = new Float32Array(nPart * 3);
  const partVel = new Float32Array(nPart);
  for (let i = 0; i < nPart; i++) {
    const a = Math.random() * Math.PI * 2, r = Math.random() * 2.9;
    partPos.set([Math.cos(a) * r, Math.random() * 3.5, Math.sin(a) * r], i * 3);
    partVel[i] = 0.15 + Math.random() * 0.35;
  }
  const partGeo = new THREE.BufferGeometry();
  partGeo.setAttribute("position", new THREE.BufferAttribute(partPos, 3));
  const particulas = new THREE.Points(partGeo, new THREE.PointsMaterial({
    size: 0.07, map: texturaBrilho(), color: "#c4b5fd", transparent: true, opacity: 0.8,
    depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  raiz.add(particulas);

  // robô, painéis de código, monitor lateral, xícara e planta
  const vida = adicionarVida({ raiz, cena, camera, canvas, mouse, pecas });

  // ---------- controles: arrastar para girar (desktop) ----------
  let controles = null;
  if (!toque && !reduzirMovimento) {
    controles = new OrbitControls(camera, canvas);
    controles.enableZoom = false;
    controles.enablePan = false;
    controles.enableDamping = true;
    controles.dampingFactor = 0.06;
    controles.rotateSpeed = 0.5;
    controles.minPolarAngle = Math.PI / 3.2;
    controles.maxPolarAngle = Math.PI / 2.1;
    controles.minAzimuthAngle = -Math.PI / 3;
    controles.maxAzimuthAngle = Math.PI / 3;
    controles.target.set(0, 1.0, 0);
  }
  camera.lookAt(0, 1.0, 0);

  // posição inicial das peças (para a animação de entrada)
  pecas.forEach((p) => {
    p.y = p.obj.position.y;
    if (!reduzirMovimento) {
      if (p.tipo === "escala") p.obj.scale.setScalar(0.001);
      else p.obj.position.y = p.y + 3;
    }
  });

  // ---------- loop ----------
  function atualizar(t, dt) {
    // entrada: cada peça "cai" no lugar (pelo relógio real, para não travar em abas lentas)
    const te = (performance.now() - inicio) / 1000;
    for (const p of pecas) {
      const k = reduzirMovimento ? 1 : suavizar((te - 0.3 - p.atraso) / 1.1);
      if (p.tipo === "escala") p.obj.scale.setScalar(Math.max(k, 0.001));
      else p.obj.position.y = p.y + (1 - k) * 3;
    }

    mouse.suavizar(0.05);
    const saida = Math.min(rolagem / window.innerHeight, 1.2);
    raiz.rotation.y = -0.45 + mouse.x * 0.25 + Math.sin(t * 0.25) * 0.06 + saida * 0.6;
    raiz.rotation.x = mouse.y * 0.05;
    raiz.position.y = -0.55 - saida * 0.8;

    // tela: redesenha ~20x por segundo
    const quadroTela = Math.floor(t * 20);
    if (quadroTela !== ultimaTela || reduzirMovimento) {
      ultimaTela = quadroTela;
      desenharTela(t);
    }

    // teclado RGB: onda de cor passando + teclas "digitadas" que acendem forte
    if (!reduzirMovimento && Math.random() < 0.4) brilhoTecla[(Math.random() * brilhoTecla.length) | 0] = 1;
    for (let i = 0; i < brilhoTecla.length; i++) {
      brilhoTecla[i] = Math.max(0, brilhoTecla[i] - dt * 2.2);
      const col = i % colunas;
      corOnda.setHSL((((0.5 + (col / colunas) * 0.35 - t * 0.12) % 1) + 1) % 1, 0.9, 0.45);
      teclas.setColorAt(i, corTecla.set("#1c1838").lerp(corOnda, 0.55).lerp(BRANCO, brilhoTecla[i] * 0.8));
    }
    teclas.instanceColor.needsUpdate = true;

    vida(t, dt);

    // LEDs pulsando e ventoinhas
    const pulso = 0.5 + Math.sin(t * 2) * 0.5;
    neonRoxo.emissiveIntensity = 1.6 + pulso * 1.4;
    neonCiano.emissiveIntensity = 1.8 + (1 - pulso) * 1.2;
    ventoinhas.forEach(({ v, aro }, i) => {
      v.rotation.y += dt * (9 + i * 2);
      aro.material.emissive.setHSL(0.52 + Math.sin(t * 0.6 + i) * 0.13, 1, 0.55);
    });
    luzRoxa.intensity = 14 + pulso * 8;


    // anéis do chão
    anel1.scale.setScalar(1 + Math.sin(t * 1.2) * 0.01);
    anel2.rotation.z += dt * 0.2;

    // partículas sobem e reaparecem embaixo
    const pos = partGeo.attributes.position;
    for (let i = 0; i < nPart; i++) {
      let y = pos.getY(i) + partVel[i] * dt;
      if (y > 3.6) y = 0;
      pos.setY(i, y);
    }
    pos.needsUpdate = true;

    controles?.update();
  }


  // primeiro quadro já com a tela desenhada
  desenharTela(0);
  palco.renderizar();
  return palco;
}
