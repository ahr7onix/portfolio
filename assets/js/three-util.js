// ============================================================
//  Utilidades compartilhadas pelas cenas 3D
//  - cria o renderer com pixelRatio limitado
//  - ajusta o tamanho ao elemento (ResizeObserver)
//  - só anima quando o canvas está na tela e a aba está visível
//  - com "movimento reduzido" renderiza um único quadro
// ============================================================
import * as THREE from "three";

export const reduzirMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
export const toque = window.matchMedia("(pointer: coarse)").matches;
export const celular = window.matchMedia("(max-width: 700px)").matches;

export const CORES = {
  ciano: new THREE.Color("#22d3ee"),
  roxo: new THREE.Color("#a855f7"),
  rosa: new THREE.Color("#ec4899"),
  fundo: new THREE.Color("#050816"),
};

/**
 * Prepara um canvas: renderer, câmera, cena e loop controlado.
 * `atualizar(t, dt)` roda a cada quadro enquanto o canvas está visível.
 */
export function criarPalco(canvas, { fov = 40, perto = 0.1, longe = 100, transparente = true, atualizar, aoAjustar } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !celular, alpha: transparente, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, celular ? 1.25 : 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping; // mantém o neon saturado

  const cena = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(fov, 1, perto, longe);

  let visivel = false;
  let quadro = 0;
  let anterior = performance.now();
  const relogio = { t: 0 };

  function ajustar() {
    const { clientWidth: w, clientHeight: h } = canvas;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    aoAjustar?.(w, h);
    if (reduzirMovimento || !visivel) renderizar();
  }

  function renderizar() {
    renderer.render(cena, camera);
  }

  function loop(agora) {
    const dt = Math.min((agora - anterior) / 1000, 0.05);
    anterior = agora;
    relogio.t += dt;
    atualizar?.(relogio.t, dt);
    renderizar();
    quadro = requestAnimationFrame(loop);
  }

  function retomar() {
    cancelAnimationFrame(quadro);
    if (reduzirMovimento) {
      atualizar?.(relogio.t, 0);
      renderizar();
      return;
    }
    if (visivel && !document.hidden) {
      anterior = performance.now();
      quadro = requestAnimationFrame(loop);
    }
  }

  new ResizeObserver(ajustar).observe(canvas);
  new IntersectionObserver(([en]) => {
    visivel = en.isIntersecting;
    retomar();
  }, { rootMargin: "100px" }).observe(canvas);
  document.addEventListener("visibilitychange", retomar);

  ajustar();
  return { renderer, cena, camera, renderizar, relogio };
}

/** Acompanha o mouse em coordenadas normalizadas (-1 a 1), com suavização. */
export function criarMouse() {
  const m = { x: 0, y: 0, alvoX: 0, alvoY: 0 };
  if (!toque) {
    window.addEventListener("pointermove", (e) => {
      m.alvoX = (e.clientX / window.innerWidth) * 2 - 1;
      m.alvoY = (e.clientY / window.innerHeight) * 2 - 1;
    }, { passive: true });
  }
  m.suavizar = (k = 0.05) => {
    m.x += (m.alvoX - m.x) * k;
    m.y += (m.alvoY - m.y) * k;
  };
  return m;
}

/** Textura circular suave para pontos e brilhos. */
export function texturaBrilho() {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d");
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.25, "rgba(255,255,255,.6)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export const suavizar = (x) => 1 - Math.pow(1 - Math.min(Math.max(x, 0), 1), 3);

// ---------- visual de desenho (modelos cartoon feitos no Blender) ----------
let tonsToon = null;
const materiaisToon = new Map();

/**
 * Troca os materiais por sombreamento toon em 3 tons e põe um contorno escuro em
 * volta das peças (casca de trás empurrada para fora pela normal).
 * `contorno(malha)` decide quais peças ganham contorno.
 */
export function estiloDesenho(raiz, { espessura = 0.022, cor = "#0b0820", contorno = () => true } = {}) {
  if (!tonsToon) {
    tonsToon = new THREE.DataTexture(new Uint8Array([110, 190, 255]), 3, 1, THREE.RedFormat);
    tonsToon.minFilter = tonsToon.magFilter = THREE.NearestFilter;
    tonsToon.needsUpdate = true;
  }
  const casca = new THREE.MeshBasicMaterial({ color: cor, side: THREE.BackSide });
  casca.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader.replace("#include <begin_vertex>", `#include <begin_vertex>\n  transformed += normal * ${espessura.toFixed(4)};`);
  };
  const malhas = [];
  raiz.traverse((o) => { if (o.isMesh) malhas.push(o); });
  for (const o of malhas) {
    const m = o.material;
    if (!materiaisToon.has(m)) {
      materiaisToon.set(m, new THREE.MeshToonMaterial({
        name: m.name, color: m.color, emissive: m.emissive, emissiveIntensity: m.emissiveIntensity, gradientMap: tonsToon,
      }));
    }
    o.material = materiaisToon.get(m);
    if (contorno(o)) o.add(new THREE.Mesh(o.geometry, casca));
  }
}
