// Planeta holográfico da seção de contato: núcleo escuro, malha neon,
// pontos de "conexão" pulsando, anel orbital e uma lua. Arrastar gira.
import * as THREE from "three";
import { criarPalco, criarMouse, texturaBrilho, toque, reduzirMovimento } from "./three-util.js";

export function iniciarPlaneta(canvas) {
  const mouse = criarMouse();
  const giro = { x: 0, y: 0, vx: 0, vy: 0.25 };

  const palco = criarPalco(canvas, { fov: 38, atualizar });
  const { cena, camera } = palco;
  camera.position.set(0, 0.4, 7);
  camera.lookAt(0, 0, 0);

  const planeta = new THREE.Group();
  planeta.rotation.z = 0.35;
  cena.add(planeta);

  cena.add(new THREE.AmbientLight("#6d28d9", 0.8));
  const luz = new THREE.PointLight("#22d3ee", 40, 20);
  luz.position.set(4, 3, 5);
  cena.add(luz);

  const nucleo = new THREE.Mesh(
    new THREE.SphereGeometry(1.55, 48, 32),
    new THREE.MeshStandardMaterial({ color: "#120c2e", roughness: 0.6, metalness: 0.3, emissive: "#2e1065", emissiveIntensity: 0.6 })
  );
  const malha = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.6, 3),
    new THREE.MeshBasicMaterial({ color: "#a855f7", wireframe: true, transparent: true, opacity: 0.35 })
  );
  const atmosfera = new THREE.Mesh(
    new THREE.SphereGeometry(1.85, 48, 32),
    new THREE.MeshBasicMaterial({ color: "#22d3ee", transparent: true, opacity: 0.06, side: THREE.BackSide, blending: THREE.AdditiveBlending, depthWrite: false })
  );

  // pontos espalhados na superfície (cidades / conexões)
  const n = 160;
  const pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const v = new THREE.Vector3().randomDirection().multiplyScalar(1.62);
    pos.set([v.x, v.y, v.z], i * 3);
  }
  const pontosGeo = new THREE.BufferGeometry();
  pontosGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const pontos = new THREE.Points(pontosGeo, new THREE.PointsMaterial({
    size: 0.12, map: texturaBrilho(), color: "#67e8f9", transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  }));

  // arcos ligando pontos aleatórios
  const arcos = new THREE.Group();
  const curvas = [];
  for (let i = 0; i < 9; i++) {
    const a = new THREE.Vector3().randomDirection().multiplyScalar(1.62);
    const b = new THREE.Vector3().randomDirection().multiplyScalar(1.62);
    const meio = a.clone().add(b).normalize().multiplyScalar(2.3);
    const curva = new THREE.QuadraticBezierCurve3(a, meio, b);
    curvas.push(curva);
    const linha = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(curva.getPoints(40)),
      new THREE.LineBasicMaterial({ color: i % 2 ? "#22d3ee" : "#e879f9", transparent: true, opacity: 0.55 })
    );
    arcos.add(linha);
  }
  planeta.add(nucleo, malha, atmosfera, pontos, arcos);

  const anel = new THREE.Mesh(
    new THREE.RingGeometry(2.3, 2.34, 128),
    new THREE.MeshBasicMaterial({ color: "#22d3ee", transparent: true, opacity: 0.6, side: THREE.DoubleSide })
  );
  const anel2 = new THREE.Mesh(
    new THREE.RingGeometry(2.55, 2.57, 128),
    new THREE.MeshBasicMaterial({ color: "#a855f7", transparent: true, opacity: 0.35, side: THREE.DoubleSide })
  );
  const orbita = new THREE.Group();
  orbita.rotation.x = Math.PI / 2.35;
  orbita.rotation.y = 0.25;
  orbita.add(anel, anel2);
  const lua = new THREE.Mesh(
    new THREE.SphereGeometry(0.13, 24, 16),
    new THREE.MeshStandardMaterial({ color: "#22d3ee", emissive: "#22d3ee", emissiveIntensity: 1.5 })
  );
  orbita.add(lua);
  cena.add(orbita);

  // pulsos de dados viajando pelos arcos
  const pulsosGeo = new THREE.BufferGeometry();
  pulsosGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(curvas.length * 3), 3));
  const pulsos = new THREE.Points(pulsosGeo, new THREE.PointsMaterial({
    size: 0.28, map: texturaBrilho(), color: "#ffffff", transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  pulsos.frustumCulled = false;
  planeta.add(pulsos);
  const tmpPonto = new THREE.Vector3();

  // satélites em órbitas inclinadas
  const satelites = [0, 1].map((i) => {
    const orbitaSat = new THREE.Group();
    orbitaSat.rotation.set(i ? 1.1 : -0.5, 0, i ? 0.4 : -0.9);
    const sat = new THREE.Group();
    const corpoSat = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.18), new THREE.MeshStandardMaterial({ color: "#e5e7eb", metalness: 0.6, roughness: 0.3 }));
    const painel = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.01, 0.12), new THREE.MeshStandardMaterial({ color: "#1d4ed8", emissive: "#2563eb", emissiveIntensity: 0.6, metalness: 0.4, roughness: 0.3 }));
    const luzSat = new THREE.Sprite(new THREE.SpriteMaterial({ map: texturaBrilho(), color: i ? "#f0abfc" : "#67e8f9", transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    luzSat.scale.setScalar(0.25);
    sat.add(corpoSat, painel, luzSat);
    orbitaSat.add(sat);
    cena.add(orbitaSat);
    return { sat, luzSat, raio: i ? 2.05 : 2.75, vel: i ? 0.9 : 0.5, fase: i * 2 };
  });

  // arrastar para girar (desktop)
  if (!toque && !reduzirMovimento) {
    let arrastando = false, ux = 0, uy = 0;
    canvas.style.cursor = "grab";
    canvas.addEventListener("pointerdown", (e) => { arrastando = true; ux = e.clientX; uy = e.clientY; canvas.style.cursor = "grabbing"; canvas.setPointerCapture(e.pointerId); });
    canvas.addEventListener("pointerup", () => { arrastando = false; canvas.style.cursor = "grab"; });
    canvas.addEventListener("pointermove", (e) => {
      if (!arrastando) return;
      giro.vy = (e.clientX - ux) * 0.02;
      giro.vx = (e.clientY - uy) * 0.02;
      ux = e.clientX;
      uy = e.clientY;
    });
  }

  function atualizar(t, dt) {
    mouse.suavizar(0.04);
    giro.y += giro.vy * dt * 4 + dt * 0.18;
    giro.x += giro.vx * dt * 4;
    giro.vy *= 0.94;
    giro.vx *= 0.94;
    giro.x *= 0.98;
    planeta.rotation.y = giro.y;
    planeta.rotation.x = giro.x + mouse.y * 0.1;
    pontos.material.size = 0.1 + Math.sin(t * 3) * 0.03;
    arcos.children.forEach((l, i) => { l.material.opacity = 0.25 + Math.max(0, Math.sin(t * 1.5 + i)) * 0.5; });
    const ang = t * 0.6;
    lua.position.set(Math.cos(ang) * 2.32, Math.sin(ang) * 2.32, 0);
    orbita.rotation.z = mouse.x * 0.15;
    anel2.rotation.z -= dt * 0.1;

    const pp = pulsosGeo.attributes.position;
    curvas.forEach((c, i) => {
      c.getPoint((t * 0.4 + i * 0.37) % 1, tmpPonto);
      pp.setXYZ(i, tmpPonto.x, tmpPonto.y, tmpPonto.z);
    });
    pp.needsUpdate = true;

    satelites.forEach((s) => {
      const a = t * s.vel + s.fase;
      s.sat.position.set(Math.cos(a) * s.raio, 0, Math.sin(a) * s.raio);
      s.sat.rotation.y = -a;
      s.luzSat.material.opacity = 0.4 + (Math.sin(t * 6 + s.fase) > 0.6 ? 0.6 : 0);
    });
  }
  return palco;
}
