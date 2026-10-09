// Planeta cartoon da seção de contato (feito no Blender: assets/models/planeta.glb):
// continentes, montanhas, nuvens que giram sozinhas, arcos de conexão com pulsos,
// anel orbital com uma lua sonolenta e dois satélites. Arrastar gira.
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { criarPalco, criarMouse, texturaBrilho, toque, reduzirMovimento, estiloDesenho } from "./three-util.js";

const R = 1.55; // raio do planeta no modelo

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

  // luz neutra para o toon (céu claro, chão roxo) + chave branca e um toque ciano lateral
  cena.add(new THREE.HemisphereLight("#ffffff", "#4c3d8f", 1.3));
  const luz = new THREE.DirectionalLight("#ffffff", 2.4);
  luz.position.set(4, 4, 6);
  const luzCiano = new THREE.PointLight("#22d3ee", 12, 20);
  luzCiano.position.set(-5, -2, 4);
  cena.add(luz, luzCiano);

  const atmosfera = new THREE.Mesh(
    new THREE.SphereGeometry(2.05, 48, 32),
    new THREE.MeshBasicMaterial({ color: "#22d3ee", transparent: true, opacity: 0.07, side: THREE.BackSide, blending: THREE.AdditiveBlending, depthWrite: false })
  );

  // arcos ligando pontos aleatórios, acima dos continentes
  const arcos = new THREE.Group();
  const curvas = [];
  for (let i = 0; i < 9; i++) {
    const a = new THREE.Vector3().randomDirection().multiplyScalar(R + 0.15);
    const b = new THREE.Vector3().randomDirection().multiplyScalar(R + 0.15);
    const meio = a.clone().add(b).normalize().multiplyScalar(2.5);
    const curva = new THREE.QuadraticBezierCurve3(a, meio, b);
    curvas.push(curva);
    const linha = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(curva.getPoints(40)),
      new THREE.LineBasicMaterial({ color: i % 2 ? "#22d3ee" : "#e879f9", transparent: true, opacity: 0.55 })
    );
    arcos.add(linha);
  }
  const nuvens = new THREE.Group(); // recebe as nuvens do modelo; gira um pouco mais rápido
  planeta.add(atmosfera, arcos, nuvens);

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
  const lua = new THREE.Group(); // recebe a lua do modelo
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

  // satélites em órbitas inclinadas (o corpo chega do modelo; a luz piscando fica aqui)
  const satelites = [0, 1].map((i) => {
    const orbitaSat = new THREE.Group();
    orbitaSat.rotation.set(i ? 1.1 : -0.5, 0, i ? 0.4 : -0.9);
    const sat = new THREE.Group();
    sat.scale.setScalar(0.7);
    const luzSat = new THREE.Sprite(new THREE.SpriteMaterial({ map: texturaBrilho(), color: i ? "#f0abfc" : "#ff8787", transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    luzSat.position.y = 0.24; // ponta da antena
    luzSat.scale.setScalar(0.3);
    sat.add(luzSat);
    orbitaSat.add(sat);
    cena.add(orbitaSat);
    return { sat, luzSat, modelo: i ? "Satelite_B" : "Satelite_A", raio: i ? 2.05 : 2.75, vel: i ? 0.9 : 0.5, fase: i * 2 };
  });

  // ---------- modelo do Blender ----------
  new GLTFLoader().load(
    new URL("../models/planeta.glb", import.meta.url).href,
    (gltf) => {
      const achar = (nome) => gltf.scene.getObjectByName(nome);
      // gotas da superfície se sobrepõem; contorno nelas viraria emenda escura
      const semEmenda = (o) => !/^(Terra|Areia|Calota)_/.test(o.name);
      const corpo = achar("Planeta");
      estiloDesenho(corpo, { espessura: 0.02, contorno: semEmenda });
      planeta.add(corpo);
      const ceu = achar("Nuvens");
      estiloDesenho(ceu, { espessura: 0.03 });
      nuvens.add(ceu);
      const luaModelo = achar("Lua");
      estiloDesenho(luaModelo, { espessura: 0.012 });
      lua.add(luaModelo);
      for (const s of satelites) {
        const m = achar(s.modelo);
        estiloDesenho(m, { espessura: 0.012 });
        s.sat.add(m);
      }
    },
    undefined,
    (erro) => console.error("Não consegui carregar o planeta:", erro)
  );

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
    nuvens.rotation.y += dt * 0.08;
    arcos.children.forEach((l, i) => { l.material.opacity = 0.25 + Math.max(0, Math.sin(t * 1.5 + i)) * 0.5; });
    const ang = t * 0.6;
    lua.position.set(Math.cos(ang) * 2.32, Math.sin(ang) * 2.32, 0);
    lua.lookAt(camera.position); // o rostinho sempre virado para quem está vendo
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
