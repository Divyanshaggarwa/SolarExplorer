import * as THREE from 'three';

export function createPlanetSurface(renderer, planet) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.1, 1000);
  camera.position.set(0, 2, 6);

  // Sky/fog color per planet (draft — swap when final data arrives)
  const SKY = {
    mercury: '#050510', venus: '#c9a55e', earth: '#5b9bd5',
    mars: '#c17a4a', ceres: '#4a4a52', jupiter: '#8a6a4a',
    saturn: '#a89a70', uranus: '#7ab8c8', neptune: '#2a4a8a',
    pluto: '#5a4a3a', sun: '#ff9900',
  };
  const skyColor = new THREE.Color(SKY[planet.slug] || '#0a0a1a');
  scene.background = skyColor;
  scene.fog = new THREE.Fog(skyColor, 8, 60);

  // Lighting
  scene.add(new THREE.HemisphereLight(0xffffff, skyColor, 1.2));
  const sunLight = new THREE.DirectionalLight(0xffffff, 1.5);
  sunLight.position.set(5, 10, 5);
  scene.add(sunLight);

  // Terrain — displaced plane with noise
  const geo = new THREE.PlaneGeometry(120, 120, 100, 100);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    const h = Math.sin(x * 0.3) * 0.4 + Math.cos(z * 0.4) * 0.3 +
              Math.sin(x * 0.1 + z * 0.15) * 0.8 + (Math.random() - 0.5) * 0.05;
    pos.setY(i, h);
  }
  geo.computeVertexNormals();

  const surfaceColor = new THREE.Color(planet.color_hex || '#666666');
  surfaceColor.multiplyScalar(0.7);
  const mat = new THREE.MeshStandardMaterial({ color: surfaceColor, roughness: 1 });
  const terrain = new THREE.Mesh(geo, mat);
  scene.add(terrain);

  // Distant silhouette — horizon marker
  const horizon = new THREE.Mesh(
    new THREE.CylinderGeometry(200, 200, 40, 64, 1, true),
    new THREE.MeshBasicMaterial({ color: skyColor, side: THREE.BackSide })
  );
  horizon.position.y = 15;
  scene.add(horizon);

  // Drifting dust particles
  const dustGeo = new THREE.BufferGeometry();
  const dust = new Float32Array(500 * 3);
  for (let i = 0; i < dust.length; i += 3) {
    dust[i] = (Math.random() - 0.5) * 80;
    dust[i+1] = Math.random() * 20;
    dust[i+2] = (Math.random() - 0.5) * 80;
  }
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dust, 3));
  scene.add(new THREE.Points(dustGeo,
    new THREE.PointsMaterial({ color: 0xffffff, size: 0.06, transparent: true, opacity: 0.6 })));

  let t = 0;
  return {
    scene, camera,
    update() {
      t += 0.016;
      dustGeo.attributes.position.array.forEach((_, i) => {
        if (i % 3 === 0) dustGeo.attributes.position.array[i] += 0.02;
        if (dustGeo.attributes.position.array[i] > 40) dustGeo.attributes.position.array[i] = -40;
      });
      dustGeo.attributes.position.needsUpdate = true;
    },
  };
}
