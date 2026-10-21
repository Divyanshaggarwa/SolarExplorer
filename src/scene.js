import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export function createScene() {
  const canvas = document.getElementById('scene');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 5000);
  camera.position.set(0, 40, 90);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.minDistance = 10;
  controls.maxDistance = 400;

  const sun = new THREE.Mesh(
    new THREE.SphereGeometry(4, 48, 48),
    new THREE.MeshBasicMaterial({ color: 0xfdb813 })
  );
  scene.add(sun);
  scene.add(new THREE.PointLight(0xffffff, 3, 0, 0));

  // Starfield
  const starGeo = new THREE.BufferGeometry();
  const stars = new Float32Array(3000 * 3);
  for (let i = 0; i < 3000 * 3; i += 3) {
    stars[i] = (Math.random() - 0.5) * 2000;
    stars[i+1] = (Math.random() - 0.5) * 2000;
    stars[i+2] = (Math.random() - 0.5) * 2000;
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(stars, 3));
  scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.7 })));

  addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });

  return { scene, camera, renderer, controls, sun };
}