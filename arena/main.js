// ARENA TEST: a floating arena, a low-poly buggy to drive and four CPU drivers to push off it, to
// see how a 3D game looks and runs here. three.js draws it, cannon-es moves it: each car is a box
// on four raycast wheels (suspension, grip, steering), so ramming, flipping and falling are the
// physics' own. Every model is built in code from simple shapes, flat-shaded.
import * as THREE from './lib/three.module.min.js';
import * as CANNON from './lib/cannon-es.js';

const touch = matchMedia('(pointer: coarse)').matches;
if (touch) document.documentElement.classList.add('touch');

// ── Renderer, scene, camera ──────────────────────────────────────────
const canvas = document.getElementById('view');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: !touch, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, touch ? 1.5 : 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene();
const HORIZON = 0xf0c7a6;
scene.fog = new THREE.Fog(HORIZON, 80, 340);
const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 900);

// (the sky: a cold dusk, deep blue overhead to a warm horizon)
function gradient(stops, w = 2, h = 256) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, h);
  for (const [at, col] of stops) g.addColorStop(at, col);
  x.fillStyle = g;
  x.fillRect(0, 0, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
scene.background = gradient([[0, '#0e1c3d'], [0.45, '#3d5a8c'], [0.72, '#c99aa0'], [0.82, '#f0c7a6'], [1, '#f0c7a6']]);

scene.add(new THREE.HemisphereLight(0xcfe0ff, 0x4a3d55, 1.1));
const sun = new THREE.DirectionalLight(0xffe0bd, 2.6);
sun.position.set(-45, 70, 20);
sun.target.position.set(0, 0, 14);
sun.castShadow = true;
sun.shadow.mapSize.set(touch ? 1024 : 2048, touch ? 1024 : 2048);
Object.assign(sun.shadow.camera, { left: -58, right: 58, top: 58, bottom: -58, near: 10, far: 220 });
sun.shadow.bias = -0.0004;
sun.shadow.normalBias = 0.03;
scene.add(sun, sun.target);

// ── Materials and little helpers ─────────────────────────────────────
const mats = new Map();
const mat = (color, o = {}) => {
  const key = `${color}|${JSON.stringify(o)}`;
  if (!mats.has(key)) mats.set(key, new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.7, metalness: 0.08, ...o }));
  return mats.get(key);
};
const glow = (color) => mat(color, { emissive: color, emissiveIntensity: 1.6, roughness: 0.4 });
function mesh(geo, m, x = 0, y = 0, z = 0) {
  const o = new THREE.Mesh(geo, m);
  o.position.set(x, y, z);
  o.castShadow = true;
  o.receiveShadow = true;
  return o;
}
const box = (w, h, d, m, x, y, z) => mesh(new THREE.BoxGeometry(w, h, d), m, x, y, z);
// (a round bar from a to b: roll cages, struts)
function bar(a, b, r, m) {
  const A = new THREE.Vector3(...a);
  const d = new THREE.Vector3(...b).sub(A);
  const o = mesh(new THREE.CylinderGeometry(r, r, d.length(), 6), m);
  o.position.copy(A).addScaledVector(d, 0.5);
  o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
  return o;
}
// (a canvas texture of panels: the arena floor, the road)
function panels({ base, line, cells = 4, size = 256, stripe = null, dash = null }) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const x = c.getContext('2d');
  x.fillStyle = base;
  x.fillRect(0, 0, size, size);
  x.strokeStyle = line;
  x.lineWidth = 3;
  const s = size / cells;
  for (let i = 0; i <= cells; i++) {
    x.beginPath(); x.moveTo(i * s, 0); x.lineTo(i * s, size); x.stroke();
    x.beginPath(); x.moveTo(0, i * s); x.lineTo(size, i * s); x.stroke();
  }
  x.fillStyle = line;
  for (let i = 0; i < cells; i++) for (let j = 0; j < cells; j++) for (const [u, v] of [[6, 6], [s - 6, 6], [6, s - 6], [s - 6, s - 6]]) x.fillRect(i * s + u - 2, j * s + v - 2, 4, 4);
  if (stripe) { // (hazard stripes)
    for (let i = -size; i < size * 2; i += 32) { x.fillStyle = stripe; x.beginPath(); x.moveTo(i, 0); x.lineTo(i + 16, 0); x.lineTo(i + 16 - size, size); x.lineTo(i - size, size); x.fill(); }
  }
  if (dash) { x.fillStyle = dash; for (let y = 8; y < size; y += 64) x.fillRect(size / 2 - 4, y, 8, 36); }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  return t;
}

// ── Physics ──────────────────────────────────────────────────────────
const world = new CANNON.World({ gravity: new CANNON.Vec3(0, -14, 0) });
world.broadphase = new CANNON.SAPBroadphase(world);
world.defaultContactMaterial.friction = 0.06;
world.defaultContactMaterial.restitution = 0.12;

// A static box: its body and its mesh together (center x, y, z; half sizes hx, hy, hz)
function slab(hx, hy, hz, x, y, z, m, { rx = 0, ry = 0, rz = 0, repeat = null } = {}) {
  const body = new CANNON.Body({ mass: 0 });
  body.addShape(new CANNON.Box(new CANNON.Vec3(hx, hy, hz)));
  body.position.set(x, y, z);
  body.quaternion.setFromEuler(rx, ry, rz);
  world.addBody(body);
  let material = m;
  if (repeat && m.map) { material = m.clone(); material.map = m.map.clone(); material.map.needsUpdate = true; material.map.repeat.set(...repeat); }
  const o = box(hx * 2, hy * 2, hz * 2, material, x, y, z);
  o.quaternion.copy(body.quaternion);
  o.castShadow = false;
  scene.add(o);
  return { body, mesh: o };
}

// ── The arena: a square floor in the sky, a road out to a far pad, two ramps, corner
// bumpers, the sweeper turning in the middle and a boost strip on the road ─────────
const HALF = 28; // (the main floor's half width)
const floorTex = panels({ base: '#3b424c', line: '#262b33', cells: 4 });
const floorMat = new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.85, metalness: 0.2 });
slab(HALF, 1, HALF, 0, -1, 0, floorMat, { repeat: [7, 7] });
const roadMat = new THREE.MeshStandardMaterial({ map: panels({ base: '#2b2f36', line: '#20242a', cells: 2, dash: '#e8e0c8' }), roughness: 0.9 });
slab(3, 0.5, 11, 0, -0.5, HALF + 11, roadMat, { repeat: [1, 4] });
slab(9, 0.75, 9, 0, -0.75, HALF + 22 + 9, floorMat, { repeat: [2, 2] });
// (the floor's edges: a thin hazard lip, under-plating and lights, all for looks)
const hazard = new THREE.MeshStandardMaterial({ map: panels({ base: '#1c1c1c', line: '#1c1c1c', cells: 1, stripe: '#f2bf1d' }), roughness: 0.6 });
for (const [w, d, x, z] of [[HALF * 2, 0.6, 0, -HALF + 0.3], [HALF * 2, 0.6, 0, HALF - 0.3], [0.6, HALF * 2, -HALF + 0.3, 0], [0.6, HALF * 2, HALF - 0.3, 0]]) {
  const m = hazard.clone(); m.map = hazard.map.clone(); m.map.needsUpdate = true; m.map.repeat.set(Math.max(w, d) / 2, 1);
  if (d > w) m.map.rotation = Math.PI / 2;
  scene.add(Object.assign(box(w, 0.04, d, m, x, 0.02, z), { castShadow: false }));
}
const under = new THREE.Group();
under.add(mesh(new THREE.CylinderGeometry(HALF * 1.05, HALF * 0.35, 14, 8), mat(0x2a2f3a), 0, -9, 0));
under.add(mesh(new THREE.ConeGeometry(HALF * 0.35, 10, 8), mat(0x22262f), 0, -21, 0).rotateX(Math.PI));
for (let i = 0; i < 8; i++) { // (glowing vents under the floor's rim)
  const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
  under.add(box(2.2, 0.5, 0.3, glow(0x58d6ff), Math.cos(a) * HALF * 0.92, -3.5, Math.sin(a) * HALF * 0.92).rotateY(-a + Math.PI / 2));
}
under.rotation.y = Math.PI / 8;
scene.add(under);
// (ramps: tilted slabs, low end on the floor toward the edge: a jump lands in the arena)
const rampMat = new THREE.MeshStandardMaterial({ map: panels({ base: '#5c4630', line: '#3d2e20', cells: 2, stripe: '#d99a2b' }), roughness: 0.8 });
const tilt = 0.26;
slab(5, 0.3, 3.5, -15, Math.sin(tilt) * 5 - 0.15, -12, rampMat, { rz: tilt, repeat: [2, 1] });
slab(5, 0.3, 3.5, 15, Math.sin(tilt) * 5 - 0.15, 12, rampMat, { rz: -tilt, repeat: [2, 1] });
// (corner bumpers: a few safe spots)
for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
  slab(3.2, 0.55, 0.45, x * (HALF - 3), 0.55, z * (HALF - 3), mat(0xd94848), { ry: (x * z > 0 ? 1 : -1) * Math.PI / 4 });
}
// (the hub in the middle, and the sweeper: a kinematic arm turning round it)
const hub = new CANNON.Body({ mass: 0 });
hub.addShape(new CANNON.Cylinder(1.6, 1.8, 1.6, 10));
hub.position.set(0, 0.8, 0);
world.addBody(hub);
scene.add(mesh(new THREE.CylinderGeometry(1.6, 1.8, 1.6, 10), mat(0x50586a), 0, 0.8, 0));
scene.add(mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.3, 10), glow(0xff5a5a), 0, 1.75, 0));
const sweeper = new CANNON.Body({ mass: 0, type: CANNON.Body.KINEMATIC });
for (const s of [-1, 1]) sweeper.addShape(new CANNON.Box(new CANNON.Vec3(6, 0.55, 0.4)), new CANNON.Vec3(s * 8.5, 0, 0));
sweeper.position.set(0, 0.6, 0);
sweeper.angularVelocity.set(0, 0.55, 0);
world.addBody(sweeper);
const sweepMesh = new THREE.Group();
for (const s of [-1, 1]) {
  sweepMesh.add(box(12, 1.1, 0.8, mat(0xe0b23a), s * 8.5, 0, 0));
  sweepMesh.add(box(11.6, 0.2, 0.84, mat(0x1d1d1d), s * 8.5, 0.15, 0));
  sweepMesh.add(box(0.5, 0.3, 0.86, glow(0xff7b3a), s * 14.2, 0.25, 0));
}
scene.add(sweepMesh);
// (the boost strip on the road: heading back in, it throws you at the arena)
const BOOST_STRIP = { x: 0, z: HALF + 13, hw: 2.4, hd: 2.5 };
const stripMesh = box(BOOST_STRIP.hw * 2, 0.05, BOOST_STRIP.hd * 2, glow(0x3affd0), BOOST_STRIP.x, 0.03, BOOST_STRIP.z);
stripMesh.castShadow = false;
scene.add(stripMesh);
for (let i = 0; i < 3; i++) { // (its arrows, pointing at the arena)
  const a = new THREE.Mesh(new THREE.ConeGeometry(0.9, 1.2, 3), mat(0x0c3b33, { emissive: 0x0c3b33 }));
  a.rotation.x = -Math.PI / 2;
  a.rotation.z = Math.PI;
  a.scale.y = 0.05;
  a.position.set(0, 0.07, BOOST_STRIP.z + 1.6 - i * 1.6);
  scene.add(a);
}

// ── Scenery: a sea of cloud far below, floating rocks with snow on top ─────────
const cloud = new THREE.Mesh(new THREE.PlaneGeometry(2400, 2400), new THREE.MeshBasicMaterial({ color: 0xf6e2d6 }));
cloud.rotation.x = -Math.PI / 2;
cloud.position.y = -70;
scene.add(cloud);
let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
for (let i = 0; i < 16; i++) {
  const a = rnd() * Math.PI * 2;
  const r = 120 + rnd() * 160;
  const s = 6 + rnd() * 16;
  const rock = new THREE.Group();
  rock.add(mesh(new THREE.DodecahedronGeometry(s, 0), mat(0x5d5468), 0, 0, 0).rotateY(rnd() * 3));
  rock.children[0].scale.set(1, 0.55, 1);
  const snow = mesh(new THREE.DodecahedronGeometry(s * 0.82, 0), mat(0xeef4ff), 0, s * 0.22, 0);
  snow.scale.set(1, 0.28, 1);
  rock.add(snow);
  rock.add(mesh(new THREE.ConeGeometry(s * 0.7, s * 1.6, 6), mat(0x463f52), 0, -s * 0.9, 0).rotateX(Math.PI));
  rock.position.set(Math.cos(a) * r, -20 + rnd() * 40, Math.sin(a) * r);
  scene.add(rock);
}

// ── The cars ─────────────────────────────────────────────────────────
// (each faces -x, as cannon's raycast vehicle drives: wheels 0 and 1 at the front steer, all four
// drive; a car's own look: its paint, what's bolted on the front, its stats)
const cars = [];
const carOf = new Map(); // (a chassis body: its car)
const FRONT = [[-1.45, 1.2], [-1.45, -1.2], [1.45, 1.2], [1.45, -1.2]];

function buggyModel(color, kind) {
  const g = new THREE.Group();
  const paint = mat(color);
  const dark = mat(0x23272e);
  const steel = mat(0x9aa3ad, { metalness: 0.55, roughness: 0.35 });
  // (the body: its side profile, front low and pointed, an open cockpit, extruded across its width)
  const s = new THREE.Shape();
  [[2.2, -0.2], [2.3, 0.5], [1.25, 0.55], [1.0, 0.3], [-0.55, 0.3], [-0.85, 0.62], [-2.2, 0.28], [-2.38, 0.02], [-2.1, -0.2]].forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y)));
  const bodyGeo = new THREE.ExtrudeGeometry(s, { depth: 1.8, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.06, bevelSegments: 1 });
  bodyGeo.translate(0, 0.25, -0.9);
  g.add(mesh(bodyGeo, paint));
  g.add(box(4.1, 0.22, 1.6, dark, 0, 0.08, 0)); // (skid plate)
  for (const [x, z] of FRONT) g.add(box(1.3, 0.12, 0.62, paint, x, 0.42, z)); // (fenders)
  for (const z of [0.42, -0.42]) { // (two seats)
    g.add(box(0.55, 0.18, 0.5, dark, 0.45, 0.62, z));
    g.add(box(0.14, 0.6, 0.5, dark, 0.78, 0.9, z));
  }
  // (the roll cage)
  for (const z of [0.82, -0.82]) {
    g.add(bar([0.95, 0.55, z], [0.95, 1.75, z * 0.9], 0.06, steel));
    g.add(bar([-0.62, 0.85, z], [-0.2, 1.75, z * 0.9], 0.06, steel));
    g.add(bar([-0.2, 1.75, z * 0.9], [0.95, 1.75, z * 0.9], 0.06, steel));
    g.add(bar([0.95, 1.75, z * 0.9], [1.95, 0.85, z * 0.7], 0.05, steel));
  }
  g.add(bar([0.95, 1.75, 0.74], [0.95, 1.75, -0.74], 0.06, steel));
  g.add(bar([-0.2, 1.75, 0.74], [-0.2, 1.75, -0.74], 0.06, steel));
  // (the driver: a CPU bot, a chip with two glowing eyes and an antenna)
  g.add(box(0.5, 0.42, 0.5, mat(0x1b2a23), 0.42, 1.12, 0.42));
  for (const ez of [0.3, 0.54]) g.add(box(0.04, 0.1, 0.09, glow(0x39ff8f), 0.16, 1.17, ez));
  g.add(bar([0.42, 1.33, 0.42], [0.5, 1.6, 0.42], 0.02, steel));
  g.add(mesh(new THREE.SphereGeometry(0.06, 6, 4), glow(0xff5a5a), 0.5, 1.62, 0.42));
  // (a turret on the back)
  g.add(mesh(new THREE.CylinderGeometry(0.16, 0.22, 0.6, 8), dark, 1.7, 0.95, 0));
  g.add(box(0.62, 0.34, 0.52, paint, 1.7, 1.38, 0));
  for (const z of [-0.13, 0, 0.13]) g.add(mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.95, 6), steel, 1.12, 1.4, z).rotateZ(Math.PI / 2));
  // (lights)
  for (const z of [0.6, -0.6]) {
    g.add(box(0.08, 0.13, 0.26, glow(0xfff4d6), -2.27, 0.52, z));
    g.add(box(0.06, 0.12, 0.22, glow(0xff2a3a), 2.33, 0.62, z));
  }
  // (what's bolted on the front)
  if (kind === 'ram') {
    g.add(box(0.22, 0.95, 2.8, steel, -2.62, 0.32, 0).rotateZ(-0.35));
    for (const z of [0.6, -0.6]) g.add(bar([-2.1, 0.2, z], [-2.55, 0.35, z], 0.07, dark));
  } else if (kind === 'spinner') {
    const disc = new THREE.Group();
    disc.add(mesh(new THREE.CylinderGeometry(0.95, 0.95, 0.14, 12), steel));
    for (let i = 0; i < 3; i++) { // (three teeth round the rim)
      const a = (i / 3) * Math.PI * 2;
      disc.add(box(0.5, 0.18, 0.2, mat(0xd94848), Math.cos(a) * 0.9, 0, Math.sin(a) * 0.9).rotateY(-a));
    }
    disc.position.set(-2.95, 0.3, 0);
    g.add(disc);
    g.add(box(0.8, 0.18, 0.3, dark, -2.4, 0.3, 0));
    g.userData.spin = disc;
  } else if (kind === 'spikes') {
    g.add(box(0.25, 0.3, 2.4, dark, -2.4, 0.32, 0));
    for (const z of [-0.95, -0.48, 0, 0.48, 0.95]) g.add(mesh(new THREE.ConeGeometry(0.15, 0.75, 6), steel, -2.85, 0.32, z).rotateZ(Math.PI / 2));
  } else if (kind === 'wedge') {
    const w = new THREE.Shape();
    [[-2.1, -0.2], [-3.1, -0.28], [-2.1, 0.45]].forEach(([x, y], i) => (i ? w.lineTo(x, y) : w.moveTo(x, y)));
    const wg = new THREE.ExtrudeGeometry(w, { depth: 2.4, bevelEnabled: false });
    wg.translate(0, 0.25, -1.2);
    g.add(mesh(wg, steel));
  }
  return g;
}

// TIMMY: a whale on wheels (a little quad's frame under it)
function whaleModel() {
  const g = new THREE.Group();
  const skin = mat(0x4f74a6);
  const belly = mat(0xd5dfeb);
  g.add(box(3.4, 0.24, 1.3, mat(0x23272e), 0, 0.1, 0));
  for (const [x, z] of [[-1.25, 0.95], [-1.25, -0.95], [1.25, 0.95], [1.25, -0.95]]) g.add(box(0.95, 0.1, 0.5, mat(0x23272e), x, 0.3, z));
  const body = mesh(new THREE.SphereGeometry(1, 12, 8), skin, 0, 1.2, 0);
  body.scale.set(2.5, 0.95, 1.05);
  g.add(body);
  const under = mesh(new THREE.SphereGeometry(1, 12, 6), belly, -0.25, 1.0, 0); // (the pale belly, showing under the chin and sides)
  under.scale.set(2.25, 0.62, 1.0);
  g.add(under);
  const tail = mesh(new THREE.ConeGeometry(0.55, 2.0, 8), skin, 2.75, 1.55, 0);
  tail.rotation.z = -Math.PI / 2 + 0.38; // (the tail sweeping up behind)
  g.add(tail);
  for (const s of [1, -1]) {
    const fluke = mesh(new THREE.SphereGeometry(0.6, 6, 4), skin, 3.65, 2.0, s * 0.62);
    fluke.scale.set(0.9, 0.12, 1.25);
    fluke.rotation.y = s * 0.5;
    g.add(fluke);
    const fin = mesh(new THREE.SphereGeometry(0.5, 6, 4), skin, -0.7, 0.85, s * 1.05);
    fin.scale.set(1.2, 0.22, 0.65);
    fin.rotation.x = s * 0.55;
    g.add(fin);
    g.add(mesh(new THREE.SphereGeometry(0.17, 8, 6), mat(0xffffff), -1.95, 1.38, s * 0.68));
    g.add(mesh(new THREE.SphereGeometry(0.09, 6, 4), mat(0x111111), -2.08, 1.4, s * 0.71));
  }
  g.add(box(0.7, 0.05, 1.6, mat(0x2b3a52), -2.05, 1.05, 0)); // (the mouth's line)
  g.add(mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.06, 8), mat(0x2b3a52), -0.6, 2.14, 0)); // (the blowhole)
  return g;
}

function label(text, color) {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 64;
  const x = c.getContext('2d');
  x.font = 'bold 34px Courier New, monospace';
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  x.lineWidth = 7;
  x.strokeStyle = 'rgba(0, 0, 0, 0.85)';
  x.strokeText(text, 128, 34);
  x.fillStyle = color;
  x.fillText(text, 128, 34);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthWrite: false, transparent: true }));
  sp.scale.set(2.4, 0.6, 1);
  sp.renderOrder = 10;
  return sp;
}

function makeCar({ name, color, kind, player = false, mass = 230, power = 1, top = 24, tint = '#ffffff' }) {
  const whale = kind === 'whale';
  const body = new CANNON.Body({ mass, angularDamping: 0.4, linearDamping: 0.05 });
  body.addShape(new CANNON.Box(new CANNON.Vec3(2.2, 0.4, 1.0)), new CANNON.Vec3(0, 0.25, 0));
  if (whale) body.addShape(new CANNON.Sphere(1.05), new CANNON.Vec3(0, 1.2, 0));
  else body.addShape(new CANNON.Box(new CANNON.Vec3(0.3, 0.35, 1.3)), new CANNON.Vec3(-2.45, 0.2, 0)); // (what's on the front: it does the pushing)
  const vehicle = new CANNON.RaycastVehicle({ chassisBody: body });
  const radius = whale ? 0.45 : 0.55;
  const spots = whale ? [[-1.25, 0.95], [-1.25, -0.95], [1.25, 0.95], [1.25, -0.95]] : FRONT;
  for (const [x, z] of spots) {
    vehicle.addWheel({
      radius, directionLocal: new CANNON.Vec3(0, -1, 0), axleLocal: new CANNON.Vec3(0, 0, 1),
      chassisConnectionPointLocal: new CANNON.Vec3(x, -0.05, z),
      suspensionStiffness: 30, suspensionRestLength: 0.35, maxSuspensionTravel: 0.35, maxSuspensionForce: 1e5,
      dampingRelaxation: 2.3, dampingCompression: 4.4, frictionSlip: 2.4, rollInfluence: 0.02,
      customSlidingRotationalSpeed: -30, useCustomSlidingRotationalSpeed: true,
    });
  }
  vehicle.addToWorld(world);
  const model = whale ? whaleModel() : buggyModel(color, kind);
  scene.add(model);
  const tire = mat(0x1a1c20);
  const hubMat = mat(whale ? 0x8fa6c4 : 0xb8c0c9, { metalness: 0.5 });
  const wheels = vehicle.wheelInfos.map(() => {
    const w = new THREE.Group();
    w.add(mesh(new THREE.CylinderGeometry(radius, radius, radius * 0.85, 10).rotateX(Math.PI / 2), tire));
    w.add(mesh(new THREE.CylinderGeometry(radius * 0.45, radius * 0.45, radius * 0.9, 6).rotateX(Math.PI / 2), hubMat));
    scene.add(w);
    return w;
  });
  const tag = label(name, tint);
  scene.add(tag);
  const car = {
    name, player, whale, body, vehicle, model, wheels, tag, power, top, mass,
    steer: 0, boostAt: -99, kos: 0, falls: 0, lastHit: null, out: false, outAt: 0, flipAt: 0, stuck: 0, backUp: 0,
  };
  body.addEventListener('collide', (e) => {
    const other = carOf.get(e.body);
    const hit = Math.abs(e.contact.getImpactVelocityAlongNormal());
    if (other) car.lastHit = { by: other, at: clock };
    if (hit > 4) {
      const p = new CANNON.Vec3();
      e.contact.bi.position.vadd(e.contact.ri, p);
      sparks(p, other ? 0xffb347 : 0xcfd8e3, Math.min(14, Math.round(hit * 1.5)));
    }
  });
  carOf.set(body, car);
  cars.push(car);
  return car;
}

const player = makeCar({ name: 'YOU', color: 0xff7a1a, kind: 'ram', player: true, tint: '#ffd166' });
makeCar({ name: 'GRIFTER', color: 0x2fc4bd, kind: 'spinner' });
makeCar({ name: 'BUNKER', color: 0x7d63f0, kind: 'wedge', mass: 280, power: 0.9, top: 21 });
makeCar({ name: 'GLITCH', color: 0xf0365f, kind: 'spikes', power: 1.1, top: 26 });
makeCar({ name: 'TIMMY', kind: 'whale', mass: 340, power: 0.85, top: 19, tint: '#9cc3ff' });

// (where cars come in: round the floor, facing the middle, clear of the sweeper)
const SPAWNS = Array.from({ length: 8 }, (_, i) => (i / 8) * Math.PI * 2 + Math.PI / 8);
function place(car, angle) {
  const r = 20;
  const x = Math.cos(angle) * r;
  const z = Math.sin(angle) * r;
  const yaw = Math.atan2(-z, x); // (local -x pointed at the middle)
  car.body.position.set(x, 1.6, z);
  car.body.quaternion.setFromEuler(0, yaw, 0);
  car.body.velocity.setZero();
  car.body.angularVelocity.setZero();
  car.out = false;
  car.lastHit = null;
  car.model.visible = car.tag.visible = true;
  car.wheels.forEach((w) => { w.visible = true; });
}
cars.forEach((c, i) => place(c, SPAWNS[(i * 3) % 8]));

// ── Sparks: little squares flying off a hit (and TIMMY's spout) ───────────────
const sparkGeo = new THREE.BoxGeometry(0.14, 0.14, 0.14);
const sparkPool = [];
function sparks(p, color, n, up = 0) {
  for (let i = 0; i < n; i++) {
    let s = sparkPool.find((x) => !x.live);
    if (!s) {
      if (sparkPool.length > 160) return;
      s = { mesh: new THREE.Mesh(sparkGeo, new THREE.MeshBasicMaterial({ color })), v: new THREE.Vector3(), live: 0 };
      scene.add(s.mesh);
      sparkPool.push(s);
    }
    s.mesh.material.color.set(color);
    s.mesh.position.set(p.x, p.y, p.z);
    s.v.set((Math.random() - 0.5) * 9, Math.random() * 6 + up, (Math.random() - 0.5) * 9);
    s.live = 0.5 + Math.random() * 0.4;
    s.mesh.visible = true;
  }
}
function tickSparks(dt) {
  for (const s of sparkPool) {
    if (s.live <= 0) continue;
    s.live -= dt;
    s.v.y -= 18 * dt;
    s.mesh.position.addScaledVector(s.v, dt);
    s.mesh.scale.setScalar(Math.max(0.05, s.live * 1.6));
    if (s.live <= 0) s.mesh.visible = false;
  }
}

// ── Driving ──────────────────────────────────────────────────────────
const tmp = new CANNON.Vec3();
const forwardOf = (car) => car.body.quaternion.vmult(new CANNON.Vec3(-1, 0, 0), tmp).clone();
const upOf = (car) => car.body.quaternion.vmult(new CANNON.Vec3(0, 1, 0));
const BOOST_COOL = 2.5;
function drive(car, throttle, steer, dt) {
  const v = car.vehicle;
  const f = forwardOf(car);
  const speed = car.body.velocity.dot(f);
  let force = 0;
  let brake = 0;
  if (throttle > 0.05) force = speed < car.top ? -620 * car.power * throttle : 0;
  else if (throttle < -0.05) {
    if (speed > 2) brake = 22 * -throttle;
    else force = speed > -10 ? 420 * car.power * -throttle : 0;
  } else brake = 2.5; // (rolling to a stop)
  for (let i = 0; i < 4; i++) { v.applyEngineForce(force, i); v.setBrake(brake, i); }
  // (steering eases in, and less of it at speed)
  const want = steer * 0.55 * (1 - Math.min(Math.abs(speed) / 45, 0.45));
  car.steer += (want - car.steer) * Math.min(1, dt * 10);
  v.setSteeringValue(car.steer, 0);
  v.setSteeringValue(car.steer, 1);
}
function boost(car) {
  if (clock - car.boostAt < BOOST_COOL || car.out) return false;
  car.boostAt = clock;
  const f = forwardOf(car);
  car.body.applyImpulse(new CANNON.Vec3(f.x * car.mass * 10, 1.5 * car.mass, f.z * car.mass * 10));
  const p = car.body.position;
  if (car.whale) sparks({ x: p.x - f.x * 0.5, y: p.y + 2.3, z: p.z - f.z * 0.5 }, 0x9fd8ff, 14, 6); // (a spout)
  else sparks({ x: p.x - f.x * 2.4, y: p.y + 0.5, z: p.z - f.z * 2.4 }, 0xffd166, 8);
  return true;
}
// (on its back or side a while, or asked: set back on its wheels where it is)
function flip(car) {
  const f = forwardOf(car);
  const yaw = Math.atan2(f.z, -f.x);
  car.body.position.y += 1.5;
  car.body.quaternion.setFromEuler(0, yaw, 0);
  car.body.angularVelocity.setZero();
  car.body.velocity.set(0, 0, 0);
}

// THE CPU DRIVERS: go for the nearest car still in (the player a little more often), aim a little
// ahead of it, boost when lined up and close; near an edge facing out, or off the floor, head for
// the middle; stuck against something, back up a moment
function cpu(car, dt) {
  const p = car.body.position;
  const f = forwardOf(car);
  const onFloor = Math.abs(p.x) < HALF && Math.abs(p.z) < HALF;
  let goal = null;
  let best = Infinity;
  for (const o of cars) {
    if (o === car || o.out || Math.abs(o.body.position.x) > HALF || Math.abs(o.body.position.z) > HALF) continue;
    const d = o.body.position.distanceTo(p) * (o.player ? 0.7 : 1);
    if (d < best) { best = d; goal = o; }
  }
  let tx = 0;
  let tz = 0;
  if (goal && onFloor) {
    tx = goal.body.position.x + goal.body.velocity.x * 0.35;
    tz = goal.body.position.z + goal.body.velocity.z * 0.35;
  }
  const edge = HALF - 6;
  const out = { x: Math.abs(p.x) > edge ? Math.sign(p.x) : 0, z: Math.abs(p.z) > edge ? Math.sign(p.z) : 0 };
  if (!onFloor || f.x * out.x + f.z * out.z > 0.25) { tx = 0; tz = 0; goal = null; } // (back to the middle)
  let dx = tx - p.x;
  let dz = tz - p.z;
  const len = Math.hypot(dx, dz) || 1;
  dx /= len;
  dz /= len;
  const angle = Math.atan2(f.x * dz - f.z * dx, f.x * dx + f.z * dz) * -1; // (+: the goal's to the left)
  let throttle = Math.abs(angle) > 1.9 ? 0.45 : 1;
  let steer = Math.max(-1, Math.min(1, angle * 1.6));
  const speed = car.body.velocity.length();
  if (car.backUp > 0) { car.backUp -= dt; throttle = -1; steer = -steer; } else if (speed < 1 && throttle > 0) {
    car.stuck += dt;
    if (car.stuck > 0.9) { car.stuck = 0; car.backUp = 0.7; } // (pinned against something: back off and charge again)
  } else car.stuck = 0;
  if (goal && best < 11 && Math.abs(angle) < 0.25 && Math.random() < dt * 1.5) boost(car);
  drive(car, throttle, steer, dt);
}

// ── Input: keys, a controller, the touch stick and buttons ─────────────────
const keys = new Set();
addEventListener('keydown', (e) => {
  keys.add(e.code);
  if (e.code === 'Space') { boost(player); e.preventDefault(); }
  if (e.code === 'KeyR') flip(player);
});
addEventListener('keyup', (e) => keys.delete(e.code));
const stick = { id: null, ox: 0, oy: 0, x: 0, y: 0 };
const stickEl = document.getElementById('stick');
const knob = stickEl.firstElementChild;
canvas.addEventListener('pointerdown', (e) => {
  if (e.pointerType === 'mouse' || stick.id !== null || e.clientX > innerWidth * 0.6) return;
  stick.id = e.pointerId;
  stick.ox = e.clientX;
  stick.oy = e.clientY;
  stickEl.style.left = `${e.clientX}px`;
  stickEl.style.top = `${e.clientY}px`;
  stickEl.style.display = 'block';
});
addEventListener('pointermove', (e) => {
  if (e.pointerId !== stick.id) return;
  let dx = e.clientX - stick.ox;
  let dy = e.clientY - stick.oy;
  const l = Math.hypot(dx, dy);
  if (l > 52) { dx *= 52 / l; dy *= 52 / l; }
  stick.x = dx / 52;
  stick.y = dy / 52;
  knob.style.transform = `translate(${dx}px, ${dy}px)`;
});
const stickUp = (e) => {
  if (e.pointerId !== stick.id) return;
  stick.id = null;
  stick.x = stick.y = 0;
  knob.style.transform = '';
  stickEl.style.display = 'none';
};
addEventListener('pointerup', stickUp);
addEventListener('pointercancel', stickUp);
const boostBtn = document.getElementById('boost');
boostBtn.addEventListener('pointerdown', (e) => { e.preventDefault(); boost(player); });
document.getElementById('flip').addEventListener('pointerdown', (e) => { e.preventDefault(); flip(player); });
let padBoost = false;
let padFlip = false;
function playerInput() {
  let throttle = 0;
  let steer = 0;
  if (keys.has('KeyW') || keys.has('ArrowUp')) throttle += 1;
  if (keys.has('KeyS') || keys.has('ArrowDown')) throttle -= 1;
  if (keys.has('KeyA') || keys.has('ArrowLeft')) steer += 1;
  if (keys.has('KeyD') || keys.has('ArrowRight')) steer -= 1;
  if (stick.id !== null) { throttle = -stick.y; steer = -stick.x; }
  const pad = navigator.getGamepads ? [...navigator.getGamepads()].find(Boolean) : null;
  if (pad) {
    const sx = pad.axes[0] || 0;
    if (Math.abs(sx) > 0.12) steer = -sx;
    const gas = pad.buttons[7] ? pad.buttons[7].value : 0;
    const rev = pad.buttons[6] ? pad.buttons[6].value : 0;
    if (gas > 0.05 || rev > 0.05) throttle = gas - rev;
    const a = pad.buttons[0] && pad.buttons[0].pressed;
    if (a && !padBoost) boost(player);
    padBoost = a;
    const y = pad.buttons[3] && pad.buttons[3].pressed;
    if (y && !padFlip) flip(player);
    padFlip = y;
  }
  return { throttle, steer };
}

// ── Falling off, knockouts, coming back ─────────────────────────────
const feedEl = document.getElementById('feed');
const tallyEl = document.getElementById('tally');
let feedTimer = 0;
function feed(text, bad = false) {
  feedEl.textContent = text;
  feedEl.className = `hud on${bad ? ' bad' : ''}`;
  clearTimeout(feedTimer);
  feedTimer = setTimeout(() => { feedEl.className = `hud${bad ? ' bad' : ''}`; }, 1600);
}
function checkFalls() {
  for (const car of cars) {
    const p = car.body.position;
    if (!car.out && p.y < -14) {
      car.out = true;
      car.outAt = clock;
      const by = car.lastHit && clock - car.lastHit.at < 5 ? car.lastHit.by : null;
      if (by) by.kos++;
      car.falls++;
      if (car.player) { feed(by ? `KNOCKED OFF BY ${by.name}` : 'YOU FELL', true); } else if (by && by.player) feed(`KNOCKOUT // ${car.name}`);
      tallyEl.textContent = `KNOCKOUTS ${player.kos} // FALLS ${player.falls}`;
    }
    if (car.out && clock - car.outAt > 1.6) place(car, SPAWNS[Math.floor(Math.random() * 8)]);
    if (car.out && p.y < -60) { car.body.velocity.setZero(); car.model.visible = car.tag.visible = false; car.wheels.forEach((w) => { w.visible = false; }); }
    // (on its back or side for 2 seconds: set right)
    if (!car.out && upOf(car).y < 0.35 && car.body.velocity.length() < 3) {
      if (!car.flipAt) car.flipAt = clock;
      else if (clock - car.flipAt > 2) { flip(car); car.flipAt = 0; }
    } else car.flipAt = 0;
    // (the boost strip: running over it toward the arena throws the car forward)
    if (!car.out && Math.abs(p.x - BOOST_STRIP.x) < BOOST_STRIP.hw && Math.abs(p.z - BOOST_STRIP.z) < BOOST_STRIP.hd && car.body.velocity.z < -2 && clock - (car.stripAt || -9) > 1) {
      car.stripAt = clock;
      car.body.applyImpulse(new CANNON.Vec3(0, car.mass * 2, -car.mass * 14));
      sparks(p, 0x3affd0, 10);
    }
  }
}

// ── The camera: behind the car, eased; or an overview of the arena ───────────
let camMode = 'chase';
const camPos = new THREE.Vector3(30, 22, 30);
const camLook = new THREE.Vector3();
let camFixed = null; // (tests: a set view)
function placeCamera(dt, attract) {
  if (camFixed) { camera.position.set(...camFixed[0]); camera.lookAt(...camFixed[1]); return; }
  const portrait = innerHeight > innerWidth;
  camera.fov = portrait ? 75 : 60;
  camera.updateProjectionMatrix();
  const p = player.body.position;
  const want = new THREE.Vector3();
  const look = new THREE.Vector3();
  if (attract || camMode === 'overview') {
    const a = clock * 0.12;
    want.set(Math.cos(a) * 52, 30, Math.sin(a) * 52 + 8);
    look.set(0, 0, 6);
  } else {
    const f = forwardOf(player);
    const l = Math.hypot(f.x, f.z) || 1;
    const back = portrait ? 12 : 9.5;
    const up = portrait ? 6.5 : 4.2;
    want.set(p.x - (f.x / l) * back, Math.max(p.y, -10) + up, p.z - (f.z / l) * back);
    look.set(p.x + (f.x / l) * 4, Math.max(p.y, -10) + 1.2, p.z + (f.z / l) * 4);
  }
  const k = 1 - Math.exp(-dt * (attract ? 1.5 : 5));
  camPos.lerp(want, k);
  camLook.lerp(look, k);
  camera.position.copy(camPos);
  camera.lookAt(camLook);
}

// ── Buttons on screen ─────────────────────────────────────────────────
const shadowsBtn = document.getElementById('shadows');
shadowsBtn.addEventListener('click', () => {
  sun.castShadow = !sun.castShadow;
  shadowsBtn.textContent = `SHADOWS: ${sun.castShadow ? 'ON' : 'OFF'}`;
});
const camBtn = document.getElementById('cam');
camBtn.addEventListener('click', () => {
  camMode = camMode === 'chase' ? 'overview' : 'chase';
  camBtn.textContent = `CAMERA: ${camMode === 'chase' ? 'CHASE' : 'OVERVIEW'}`;
});
if (touch) document.getElementById('how').textContent = 'DRIVE: drag on the left side (up to go). BOOST and FLIP: the buttons on the right. Turn the phone sideways for a wider view.';
let running = false;
document.getElementById('start').addEventListener('click', () => {
  running = true;
  document.getElementById('card').hidden = true;
});

// ── The loop ──────────────────────────────────────────────────────────
function resize() {
  renderer.setSize(innerWidth, innerHeight, false);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
}
addEventListener('resize', resize);
resize();
let clock = 0;
let last = performance.now();
let frames = 0;
let fpsAt = last;
const fpsEl = document.getElementById('fps');
const boostBar = document.getElementById('boost-bar');
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (!document.hidden) {
    clock += dt;
    if (running) {
      const { throttle, steer } = playerInput();
      if (!player.out) drive(player, throttle, steer, dt);
    }
    for (const car of cars) if (!car.player && !car.out) (running ? cpu(car, dt) : drive(car, 0, 0, dt));
    world.step(1 / 60, dt, 4);
    checkFalls();
  }
  // (the meshes follow the bodies)
  for (const car of cars) {
    car.model.position.copy(car.body.position);
    car.model.quaternion.copy(car.body.quaternion);
    car.vehicle.wheelInfos.forEach((_, i) => {
      car.vehicle.updateWheelTransform(i);
      const t = car.vehicle.wheelInfos[i].worldTransform;
      car.wheels[i].position.copy(t.position);
      car.wheels[i].quaternion.copy(t.quaternion);
    });
    car.tag.position.set(car.body.position.x, car.body.position.y + (car.whale ? 3.4 : 2.9), car.body.position.z);
    car.tag.visible = car.model.visible && !(car.player && running && camMode === 'chase' && !camFixed); // (your own: not over your head)
    if (car.model.userData.spin) car.model.userData.spin.rotation.y += dt * 18;
  }
  sweepMesh.position.copy(sweeper.position);
  sweepMesh.quaternion.copy(sweeper.quaternion);
  stripMesh.material.emissiveIntensity = 1.2 + Math.sin(clock * 6) * 0.5;
  tickSparks(dt);
  placeCamera(dt, !running);
  renderer.render(scene, camera);
  const cool = Math.min(1, (clock - player.boostAt) / BOOST_COOL);
  boostBar.style.width = `${cool * 100}%`;
  boostBtn.disabled = cool < 1;
  frames++;
  if (now - fpsAt > 500) {
    fpsEl.textContent = `${Math.round((frames * 1000) / (now - fpsAt))} FPS`;
    frames = 0;
    fpsAt = now;
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
// (for tests: the cars, and the game stepped at a true 60 a second without drawing)
window.arena = {
  cars, player, world, boost, flip, place: (car, x, z, yaw) => { car.body.position.set(x, 1.2, z); car.body.quaternion.setFromEuler(0, yaw, 0); car.body.velocity.setZero(); car.body.angularVelocity.setZero(); }, start: () => document.getElementById('start').click(),
  view(from, to) { camFixed = from ? [from, to] : null; },
  sim(seconds, throttle = 0, steer = 0) {
    for (let t = 0; t < seconds; t += 1 / 60) {
      clock += 1 / 60;
      if (!player.out) drive(player, throttle, steer, 1 / 60);
      for (const car of cars) if (!car.player && !car.out) cpu(car, 1 / 60);
      world.step(1 / 60);
      checkFalls();
    }
  },
};
