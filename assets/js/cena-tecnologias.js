// Tecnologias como logos 3D flutuantes (feitos no Blender: assets/models/tecnologias.glb),
// todos num único canvas, com o nome em cima de cada um.
// Passar o mouse faz o logo girar e crescer. A lista acessível fica no HTML.
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { criarPalco, criarMouse, texturaBrilho, toque, reduzirMovimento, estiloDesenho } from "./three-util.js";

// "logo" é o nome do grupo no .glb (gerado pelo script tecnologias.py)
const TECNOLOGIAS = [
  { nome: "React", cor: "#61dafb", logo: "Logo_React" },
  { nome: "Next.js", cor: "#e5e7eb", logo: "Logo_NextJS" },
  { nome: "React Native", cor: "#22d3ee", logo: "Logo_ReactNative" },
  { nome: "Three.js", cor: "#c4b5fd", logo: "Logo_ThreeJS" },
  { nome: "Node.js", cor: "#4ade80", logo: "Logo_NodeJS" },
  { nome: "NestJS", cor: "#f43f5e", logo: "Logo_NestJS" },
  { nome: "TypeScript", cor: "#60a5fa", logo: "Logo_TypeScript" },
  { nome: "PostgreSQL", cor: "#7dd3fc", logo: "Logo_PostgreSQL" },
  { nome: "Prisma", cor: "#a5b4fc", logo: "Logo_Prisma" },
  { nome: "Python", cor: "#facc15", logo: "Logo_Python" },
  { nome: "Docker", cor: "#38bdf8", logo: "Logo_Docker" },
  { nome: "Git", cor: "#fb923c", logo: "Logo_Git" },
];

// etiqueta com o nome que fica em cima do logo (sprite, sempre de frente para a câmera)
const ROTULO = { w: 3.1, h: 0.62 };
function rotulo(nome, cor) {
  const c = document.createElement("canvas");
  c.width = 640;
  c.height = 128;
  const g = c.getContext("2d");
  g.font = `700 64px "Space Grotesk", sans-serif`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.shadowColor = cor;
  g.shadowBlur = 22;
  g.fillStyle = cor;
  g.fillText(nome, c.width / 2, c.height / 2);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false }));
  s.scale.set(ROTULO.w, ROTULO.h, 1);
  s.position.y = 1.28;
  return s;
}

export function iniciarTecnologias(canvas) {
  const mouse = criarMouse();
  const bolas = [];
  const grupo = new THREE.Group();
  const raycaster = new THREE.Raycaster();
  const ponteiro = new THREE.Vector2(9, 9);

  const palco = criarPalco(canvas, { fov: 35, atualizar, aoAjustar: organizar });
  const { cena, camera } = palco;
  camera.position.set(0, 0, 14);
  cena.add(grupo);
  // luz neutra para as cores das marcas aparecerem certas no sombreamento toon:
  // céu claro + chão roxo suave, luz principal branca de frente/cima e um recorte por trás
  cena.add(new THREE.HemisphereLight("#ffffff", "#4c3d8f", 1.4));
  const luz = new THREE.DirectionalLight("#ffffff", 2.6);
  luz.position.set(3, 6, 10);
  const recorte = new THREE.DirectionalLight("#a5b4fc", 1.2);
  recorte.position.set(-4, 3, -6);
  cena.add(luz, recorte);

  // esfera invisível só para detectar o mouse (o logo tem buracos, como o do Three.js)
  const geoAlvo = new THREE.SphereGeometry(1, 16, 12);
  const matAlvo = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
  TECNOLOGIAS.forEach((tec, i) => {
    const bola = new THREE.Group(); // recebe o logo quando o .glb carregar
    const alvoMouse = new THREE.Mesh(geoAlvo, matAlvo);
    const aura = new THREE.Mesh(
      new THREE.RingGeometry(1.04, 1.07, 64),
      new THREE.MeshBasicMaterial({ color: tec.cor, transparent: true, opacity: 0.35, side: THREE.DoubleSide })
    );
    aura.position.z = -0.4;
    const item = new THREE.Group();
    item.add(bola, alvoMouse, aura, rotulo(tec.nome, tec.cor));
    item.userData = { bola, alvoMouse, aura, fase: i * 0.7, giro: 0, hover: 0 };
    grupo.add(item);
    bolas.push(item);
  });

  new GLTFLoader().load(
    new URL("../models/tecnologias.glb", import.meta.url).href,
    (gltf) => {
      gltf.scene.updateMatrixWorld(true);
      TECNOLOGIAS.forEach((tec, i) => {
        const logo = gltf.scene.getObjectByName(tec.logo);
        if (!logo) return;
        // centraliza pelo tamanho real do modelo (cauda da baleia, tromba do elefante etc.
        // tiravam o logo do meio) e deixa todos do mesmo tamanho dentro do anel
        const medida = new THREE.Box3().setFromObject(logo, true);
        const centro = medida.getCenter(new THREE.Vector3());
        const tam = medida.getSize(new THREE.Vector3());
        logo.position.sub(centro);
        const pivo = new THREE.Group();
        pivo.scale.setScalar(1.6 / Math.max(tam.x, tam.y));
        pivo.add(logo);
        estiloDesenho(logo);
        bolas[i].userData.bola.add(pivo);
      });
    },
    undefined,
    (erro) => console.error("Não consegui carregar os logos:", erro)
  );

  // ---------- rede: linhas entre esferas vizinhas com pulsos de luz ----------
  let pares = [];
  const linhasGeo = new THREE.BufferGeometry();
  const linhas = new THREE.LineSegments(linhasGeo, new THREE.LineBasicMaterial({ color: "#7c6cf0", transparent: true, opacity: 0.28 }));
  linhas.frustumCulled = false;
  grupo.add(linhas);
  const pulsosGeo = new THREE.BufferGeometry();
  const pulsos = new THREE.Points(pulsosGeo, new THREE.PointsMaterial({
    map: texturaBrilho(), color: "#67e8f9", size: 0.55, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  pulsos.frustumCulled = false;
  grupo.add(pulsos);

  // faíscas quando o mouse entra numa esfera
  const nFaiscas = 40;
  const faiscasGeo = new THREE.BufferGeometry();
  faiscasGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(nFaiscas * 3), 3));
  const faiscas = new THREE.Points(faiscasGeo, new THREE.PointsMaterial({
    map: texturaBrilho(), color: "#f0abfc", size: 0.35, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  faiscas.frustumCulled = false;
  grupo.add(faiscas);
  const faiscaVel = Array.from({ length: nFaiscas }, () => new THREE.Vector3());
  let faiscaVida = 0;
  function explodir(centro, raio) {
    const pos = faiscasGeo.attributes.position;
    for (let i = 0; i < nFaiscas; i++) {
      const d = new THREE.Vector3().randomDirection();
      pos.setXYZ(i, centro.x + d.x * raio, centro.y + d.y * raio, centro.z + d.z * raio);
      faiscaVel[i].copy(d).multiplyScalar(2 + Math.random() * 3);
    }
    pos.needsUpdate = true;
    faiscaVida = 1;
  }

  // distribui as esferas em grade conforme a largura visível
  function organizar(w, h) {
    if (!bolas.length || !w || !h) return;
    const aspecto = w / h;
    const altVisivel = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
    const largVisivel = altVisivel * aspecto;
    const colunas = aspecto > 2.4 ? 6 : aspecto > 1.4 ? 4 : 3;
    const nLinhas = Math.ceil(bolas.length / colunas);
    const passoX = largVisivel / colunas;
    const passoY = altVisivel / nLinhas;
    const raio = Math.min(passoX, passoY) * 0.32;
    pares = [];
    bolas.forEach((b, i) => {
      const col = i % colunas, lin = Math.floor(i / colunas);
      const u = b.userData;
      u.base = new THREE.Vector3((col - (colunas - 1) / 2) * passoX, ((nLinhas - 1) / 2 - lin) * passoY, 0);
      u.desvio = u.desvio || new THREE.Vector3();
      u.vel = u.vel || new THREE.Vector3();
      b.position.copy(u.base);
      b.scale.setScalar(raio);
      u.raio = raio;
      // vira a esfera para a câmera (corrige a perspectiva nas bordas)
      u.yaw = Math.atan2(-u.base.x, camera.position.z);
      u.pitch = Math.atan2(u.base.y, camera.position.z);
      // conecta com a da direita e a de baixo
      if (col < colunas - 1 && i + 1 < bolas.length) pares.push([i, i + 1, Math.random()]);
      if (i + colunas < bolas.length) pares.push([i, i + colunas, Math.random()]);
    });
    linhasGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(pares.length * 6), 3));
    pulsosGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(pares.length * 3), 3));
    pulsos.material.size = raio * 0.5;
  }
  organizar(canvas.clientWidth, canvas.clientHeight);

  if (!toque) {
    canvas.addEventListener("pointermove", (e) => {
      const r = canvas.getBoundingClientRect();
      ponteiro.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    });
    canvas.addEventListener("pointerleave", () => ponteiro.set(9, 9));
  }

  const plano = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const mouse3d = new THREE.Vector3();
  const empurrao = new THREE.Vector3();
  let alvoAnterior = null;

  function atualizar(t, dt) {
    mouse.suavizar(0.05);
    let alvo = null;
    const mouseAtivo = !reduzirMovimento && ponteiro.x < 2;
    if (mouseAtivo) {
      raycaster.setFromCamera(ponteiro, camera);
      const hit = raycaster.intersectObjects(bolas.map((b) => b.userData.alvoMouse))[0];
      alvo = hit && hit.object.parent;
      raycaster.ray.intersectPlane(plano, mouse3d);
    }
    canvas.style.cursor = alvo ? "pointer" : "";
    if (alvo && alvo !== alvoAnterior) explodir(alvo.position, alvo.userData.raio);
    alvoAnterior = alvo;

    for (const b of bolas) {
      const u = b.userData;
      if (!u.base) continue;
      u.hover += ((b === alvo ? 1 : 0) - u.hover) * 0.12;

      // mola: as esferas vizinhas fogem um pouco do mouse e voltam
      if (mouseAtivo && b !== alvo) {
        empurrao.copy(u.base).add(u.desvio).sub(mouse3d);
        const d = empurrao.length();
        const alcance = u.raio * 3.2;
        if (d < alcance && d > 0.001) u.vel.addScaledVector(empurrao.normalize(), (1 - d / alcance) * 9 * dt * u.raio);
      }
      u.vel.addScaledVector(u.desvio, -14 * dt); // volta para o lugar
      u.vel.multiplyScalar(Math.pow(0.04, dt)); // amortecimento
      u.desvio.addScaledVector(u.vel, dt * 6);

      const flutua = reduzirMovimento ? 0 : Math.sin(t * 1.2 + u.fase) * u.raio * 0.12;
      b.position.set(u.base.x + u.desvio.x, u.base.y + u.desvio.y + flutua, u.desvio.z);
      b.scale.setScalar(u.raio * (1 + u.hover * 0.18));

      // olha levemente para o mouse; gira inteira quando o mouse passa por cima
      u.giro += dt * u.hover * 7;
      u.bola.rotation.y = u.yaw + mouse.x * 0.3 + u.giro + Math.sin(t * 0.6 + u.fase) * 0.12;
      u.bola.rotation.x = u.pitch + mouse.y * 0.2;
      u.aura.rotation.z += dt * 0.4;
      u.aura.scale.setScalar(1 + u.hover * 0.12 + Math.sin(t * 2 + u.fase) * 0.02);
      u.aura.material.opacity = 0.25 + u.hover * 0.6;
      // o logo volta a ficar de frente depois do giro
      if (u.hover < 0.05) u.giro += (Math.round(u.giro / (Math.PI * 2)) * Math.PI * 2 - u.giro) * 0.08;
    }

    // linhas e pulsos acompanham as esferas
    const lp = linhasGeo.attributes.position, pp = pulsosGeo.attributes.position;
    if (!lp) return;
    pares.forEach(([a, b, fase], k) => {
      const A = bolas[a].position, B = bolas[b].position;
      lp.setXYZ(k * 2, A.x, A.y, -0.5);
      lp.setXYZ(k * 2 + 1, B.x, B.y, -0.5);
      const s = (t * 0.35 + fase) % 1;
      pp.setXYZ(k, A.x + (B.x - A.x) * s, A.y + (B.y - A.y) * s, -0.4);
    });
    lp.needsUpdate = true;
    pp.needsUpdate = true;
    linhas.material.opacity = 0.22 + Math.sin(t * 1.5) * 0.06;

    // faíscas
    if (faiscaVida > 0) {
      faiscaVida = Math.max(0, faiscaVida - dt * 1.6);
      const pos = faiscasGeo.attributes.position;
      for (let i = 0; i < nFaiscas; i++) {
        pos.setXYZ(i, pos.getX(i) + faiscaVel[i].x * dt, pos.getY(i) + faiscaVel[i].y * dt, pos.getZ(i) + faiscaVel[i].z * dt);
        faiscaVel[i].multiplyScalar(0.94);
      }
      pos.needsUpdate = true;
      faiscas.material.opacity = faiscaVida;
    }
  }
  return palco;
}
