// Céu de estrelas fixo atrás da página: gira devagar, reage ao mouse e à rolagem.
import * as THREE from "three";
import { criarPalco, criarMouse, texturaBrilho, celular } from "./three-util.js";

export function iniciarEstrelas(canvas) {
  const mouse = criarMouse();
  const total = celular ? 1400 : 3200;

  const posicoes = new Float32Array(total * 3);
  const cores = new Float32Array(total * 3);
  const paleta = [new THREE.Color("#ffffff"), new THREE.Color("#a5f3fc"), new THREE.Color("#d8b4fe"), new THREE.Color("#f0abfc")];

  for (let i = 0; i < total; i++) {
    // distribuição dentro de uma esfera oca (mais estrelas longe)
    const r = 6 + Math.pow(Math.random(), 0.6) * 40;
    const th = Math.random() * Math.PI * 2;
    const ph = Math.acos(2 * Math.random() - 1);
    posicoes.set([r * Math.sin(ph) * Math.cos(th), r * Math.sin(ph) * Math.sin(th), r * Math.cos(ph)], i * 3);
    const c = paleta[Math.random() < 0.6 ? 0 : 1 + Math.floor(Math.random() * 3)];
    cores.set([c.r, c.g, c.b], i * 3);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(posicoes, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(cores, 3));

  const mat = new THREE.PointsMaterial({
    size: 0.16,
    map: texturaBrilho(),
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  });
  const estrelas = new THREE.Points(geo, mat);

  // estrelas cadentes: linhas com a cauda escura (some com a mistura aditiva)
  const cadentes = Array.from({ length: 3 }, () => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(6), 3));
    geo.setAttribute("color", new THREE.BufferAttribute(new Float32Array([1, 1, 1, 0, 0, 0]), 3));
    const linha = new THREE.Line(geo, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    linha.visible = false;
    linha.frustumCulled = false;
    return { linha, vida: 0, espera: 1 + Math.random() * 6, pos: new THREE.Vector3(), dir: new THREE.Vector3() };
  });

  let rolagem = 0;
  window.addEventListener("scroll", () => { rolagem = window.scrollY; }, { passive: true });

  const palco = criarPalco(canvas, {
    fov: 60,
    longe: 120,
    atualizar(t, dt) {
      mouse.suavizar(0.03);
      estrelas.rotation.y += dt * 0.012;
      // a rolagem gira o céu (sem atravessar estrelas, que ficariam enormes)
      estrelas.rotation.x = -0.15 + mouse.y * 0.05 + rolagem * 0.00022;
      estrelas.rotation.z = mouse.x * 0.04;

      for (const c of cadentes) {
        if (c.vida <= 0) {
          c.linha.visible = false;
          c.espera -= dt;
          if (c.espera <= 0) {
            const cam = palco.camera.position;
            c.pos.set(cam.x + (Math.random() - 0.3) * 14, cam.y + 3 + Math.random() * 4, cam.z - 8 - Math.random() * 6);
            c.dir.set(-1 - Math.random(), -0.45 - Math.random() * 0.3, 0).normalize();
            c.vida = 1;
            c.espera = 3 + Math.random() * 7;
          }
          continue;
        }
        c.vida -= dt * 0.9;
        c.pos.addScaledVector(c.dir, dt * 14);
        const p = c.linha.geometry.attributes.position;
        const cauda = 2.2 * Math.min(1, (1 - c.vida) * 4);
        p.setXYZ(0, c.pos.x, c.pos.y, c.pos.z);
        p.setXYZ(1, c.pos.x - c.dir.x * cauda, c.pos.y - c.dir.y * cauda, c.pos.z);
        p.needsUpdate = true;
        c.linha.material.opacity = Math.min(1, c.vida * 2);
        c.linha.visible = true;
      }
    },
  });
  palco.camera.position.set(0, 0, 2);
  palco.cena.add(estrelas, ...cadentes.map((c) => c.linha));
  return palco;
}
