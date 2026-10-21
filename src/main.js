import * as THREE from 'three';
import { createScene } from './scene.js';
import { getPlanets, getPlanet, simulate } from './api.js';

const { scene, camera, renderer, controls } = createScene();
const bodies = new Map(); // slug -> { mesh, dist, angle }

const listEl = document.getElementById('planetList');
const infoPanel = document.getElementById('infoPanel');
const simModal = document.getElementById('simModal');

async function boot() {
  const planets = await getPlanets();
  planets.forEach((p, i) => {
    const size = p.slug === 'sun' ? 0 : Math.max(0.6, Math.log10(p.radius_km) * 0.9);
    const dist = p.slug === 'sun' ? 0 : 15 + p.distance_au * 2.4;
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(size, 24, 24),
      new THREE.MeshStandardMaterial({ color: new THREE.Color(p.color_hex), roughness: 0.8 })
    );
    mesh.userData = { slug: p.slug };
    if (dist === 0) { mesh.visible = false; }
    else scene.add(mesh);
    bodies.set(p.slug, { mesh, dist, angle: Math.random() * Math.PI * 2 });

    const btn = document.createElement('button');
    btn.className = 'planet-btn';
    btn.dataset.slug = p.slug;
    btn.innerHTML = `<span class="dot" style="background:${p.color_hex}"></span>${p.name}`;
    btn.onclick = () => focusPlanet(p.slug);
    listEl.appendChild(btn);
  });
}

async function focusPlanet(slug) {
  document.querySelectorAll('.planet-btn').forEach(b => b.classList.toggle('active', b.dataset.slug === slug));

  const data = await getPlanet(slug);
  const body = bodies.get(slug);
  const target = body ? body.mesh.position.clone() : new THREE.Vector3(0, 0, 0);

  // Cinematic camera transition
  const startPos = camera.position.clone();
  const startTarget = controls.target.clone();
  const endPos = target.clone().add(new THREE.Vector3(8, 4, 8));
  const endTarget = target.clone();
  const t0 = performance.now();
  const dur = 1200;

  function ease(x) { return 1 - Math.pow(1 - x, 4); }
  function anim(now) {
    const t = Math.min((now - t0) / dur, 1);
    camera.position.lerpVectors(startPos, endPos, ease(t));
    controls.target.lerpVectors(startTarget, endTarget, ease(t));
    if (t < 1) requestAnimationFrame(anim);
  }
  requestAnimationFrame(anim);

  infoPanel.classList.remove('hidden');
  document.getElementById('pName').textContent = data.name;
  document.getElementById('pType').textContent = data.type;

  const stats = [
    ['Temperature', `${data.avg_temp_c} °C`],
    ['Gravity', `${data.gravity_ms2} m/s²`],
    ['Atmosphere', data.atmosphere],
    ['Water', data.water],
    ['Radiation', `${data.radiation_msv} mSv/yr`],
    ['Moons', data.moons],
    ['Day length', `${data.day_length_h} h`],
    ['Year', data.orbital_days ? `${data.orbital_days} d` : '—'],
  ];
  document.getElementById('stats').innerHTML = stats.map(([l, v]) =>
    `<div class="stat"><div class="stat-label">${l}</div><div class="stat-value">${v}</div></div>`
  ).join('');

  const surv = data.survival_json || {};
  const pill = document.getElementById('survival');
  if (!surv.causeOfDeath) {
    pill.className = 'survival-pill safe';
    pill.textContent = '✓ HABITABLE WITHOUT EQUIPMENT';
  } else if (!data.landable) {
    pill.className = 'survival-pill dead';
    pill.textContent = `⚠ UNLANDABLE — ${surv.causeOfDeath}`;
  } else {
    pill.className = 'survival-pill warn';
    pill.textContent = `⚠ REQUIRES EQUIPMENT — death in ~${surv.unprotectedDeathSeconds}s`;
  }

  document.getElementById('simBtn').onclick = () => openSim(slug);
}

function openSim(slug) {
  simModal.classList.remove('hidden');
  document.getElementById('simResult').textContent = '';
  document.getElementById('simResult').className = 'sim-result';
  document.getElementById('simResult').dataset.slug = slug;
}

document.getElementById('simClose').onclick = () => simModal.classList.add('hidden');

document.getElementById('simResult').parentElement.addEventListener('click', async (e) => {
  if (!e.target.classList.contains('primary-btn') && e.target.id !== 'simBtn') return;
});

document.querySelector('.modal-card').addEventListener('click', async (e) => {
  if (e.target.tagName !== 'LABEL' && e.target.type !== 'checkbox' && e.target.type !== 'number') return;
  // live-update on change
  const slug = document.getElementById('simResult').dataset.slug;
  if (!slug) return;
  const equipment = {
    pressureAtm: document.getElementById('eqPressure').checked ? 1 : 0,
    oxygen: document.getElementById('eqOxygen').checked,
    tempC: Number(document.getElementById('eqTempVal').value),
    radiationMsvYr: Number(document.getElementById('eqRadVal').value),
  };
  const res = await simulate({ slug, equipment });
  const box = document.getElementById('simResult');
  box.textContent = res.viable ? '✓ SURVIVABLE' : `✕ ${res.reason}`;
  box.style.background = res.viable ? 'rgba(74,222,128,0.15)' : 'rgba(255,107,74,0.15)';
  box.style.color = res.viable ? '#4ADE80' : '#FF6B4A';
});

document.getElementById('backBtn').onclick = () => {
  infoPanel.classList.add('hidden');
  document.querySelectorAll('.planet-btn').forEach(b => b.classList.remove('active'));
  controls.target.set(0, 0, 0);
  camera.position.set(0, 40, 90);
};

renderer.setAnimationLoop(() => {
  bodies.forEach(({ mesh, dist, angle }, slug) => {
    if (dist === 0) return;
    angle += 0.0015;
    mesh.position.x = Math.cos(angle) * dist;
    mesh.position.z = Math.sin(angle) * dist;
    mesh.rotation.y += 0.01;
  });
  controls.update();
  renderer.render(scene, camera);
});

boot();