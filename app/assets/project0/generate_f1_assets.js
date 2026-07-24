#!/usr/bin/env node
/*
 * Procedural low-poly F1 showcase assets for Project 0.
 * Units: millimetres. Generates six self-contained binary STL files plus
 * assembly.json; no external model or licence dependency is introduced.
 */
const fs = require('fs');
const path = require('path');

const OUT = __dirname;
const meshes = new Map();

function mesh(name) { const t = []; meshes.set(name, t); return t; }
function tri(t, a, b, c) { t.push([a, b, c]); }
function quad(t, a, b, c, d) { tri(t, a, b, c); tri(t, a, c, d); }

function box(t, x0, x1, y0, y1, z0, z1, rotateY = 0) {
  const raw = [
    [x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0],
    [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1],
  ];
  const c = Math.cos(rotateY), s = Math.sin(rotateY);
  const p = raw.map(([x, y, z]) => [x * c + z * s, y, -x * s + z * c]);
  quad(t, p[0], p[1], p[2], p[3]); quad(t, p[4], p[7], p[6], p[5]);
  quad(t, p[0], p[4], p[5], p[1]); quad(t, p[1], p[5], p[6], p[2]);
  quad(t, p[2], p[6], p[7], p[3]); quad(t, p[3], p[7], p[4], p[0]);
}

function cylinderY(t, cx, y0, y1, cz, r, n = 16) {
  const lower = [], upper = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    lower.push([cx + Math.cos(a) * r, y0, cz + Math.sin(a) * r]);
    upper.push([cx + Math.cos(a) * r, y1, cz + Math.sin(a) * r]);
  }
  for (let i = 0; i < n; i++) quad(t, lower[i], lower[(i + 1) % n], upper[(i + 1) % n], upper[i]);
  const cl = [cx, y0, cz], cu = [cx, y1, cz];
  for (let i = 1; i < n - 1; i++) { tri(t, cl, lower[i + 1], lower[i]); tri(t, cu, upper[i], upper[i + 1]); }
}

function torusY(t, cx, cy, cz, major, minor, u = 24, v = 8) {
  const point = (i, j) => {
    const a = i / u * Math.PI * 2, b = j / v * Math.PI * 2;
    const ring = major + minor * Math.cos(b);
    return [cx + ring * Math.cos(a), cy + minor * Math.sin(b), cz + ring * Math.sin(a)];
  };
  for (let i = 0; i < u; i++) for (let j = 0; j < v; j++) {
    const a = point(i, j), b = point((i + 1) % u, j), c = point((i + 1) % u, (j + 1) % v), d = point(i, (j + 1) % v);
    quad(t, a, b, c, d);
  }
}

function sweepX(t, sections, sides = 12) {
  const rings = sections.map((s) => Array.from({ length: sides }, (_, i) => {
    const a = i / sides * Math.PI * 2;
    return [s.x, s.cy + Math.cos(a) * s.ry, s.cz + Math.sin(a) * s.rz];
  }));
  for (let j = 0; j < rings.length - 1; j++) for (let i = 0; i < sides; i++) {
    quad(t, rings[j][i], rings[j + 1][i], rings[j + 1][(i + 1) % sides], rings[j][(i + 1) % sides]);
  }
  const close = (ring, centre, reverse) => {
    for (let i = 1; i < sides - 1; i++) reverse ? tri(t, centre, ring[i], ring[i + 1]) : tri(t, centre, ring[i + 1], ring[i]);
  };
  close(rings[0], [sections[0].x, sections[0].cy, sections[0].cz], true);
  close(rings[rings.length - 1], [sections.at(-1).x, sections.at(-1).cy, sections.at(-1).cz], false);
}

function cylinderBetween(t, a, b, r, n = 10) {
  const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const len = Math.hypot(...d); if (!len) return;
  const w = d.map((x) => x / len);
  const ref = Math.abs(w[2]) < .85 ? [0, 0, 1] : [0, 1, 0];
  const u0 = [w[1] * ref[2] - w[2] * ref[1], w[2] * ref[0] - w[0] * ref[2], w[0] * ref[1] - w[1] * ref[0]];
  const ul = Math.hypot(...u0), u = u0.map((x) => x / ul);
  const v = [w[1] * u[2] - w[2] * u[1], w[2] * u[0] - w[0] * u[2], w[0] * u[1] - w[1] * u[0]];
  const ring = (p, i) => p.map((x, k) => x + r * (u[k] * Math.cos(i / n * Math.PI * 2) + v[k] * Math.sin(i / n * Math.PI * 2)));
  const ra = Array.from({ length: n }, (_, i) => ring(a, i));
  const rb = Array.from({ length: n }, (_, i) => ring(b, i));
  for (let i = 0; i < n; i++) quad(t, ra[i], rb[i], rb[(i + 1) % n], ra[(i + 1) % n]);
}

function wheel() {
  const t = mesh('wheel.stl');
  torusY(t, 0, 0, 0, 140, 24);                 // 13-inch display tyre/rim
  cylinderY(t, 0, -15, 15, 0, 42, 16);         // centre-lock hub
  for (let i = 0; i < 6; i++) box(t, 34, 121, -12, 12, -9, 9, i * Math.PI / 3);
  return t;
}

function wing() {
  const t = mesh('wing.stl');
  box(t, -65, 65, -450, 450, -10, 10);          // single main element, 900mm span
  box(t, -45, 45, -360, 360, 30, 42);           // DRS flap, 20mm visual gap
  box(t, -85, 85, -470, -450, -12, 88); box(t, -85, 85, 450, 470, -12, 88);
  box(t, -16, 16, -95, -55, -250, -10); box(t, -16, 16, 55, 95, -250, -10);
  return t;
}

function nose() {
  const t = mesh('nose.stl');
  sweepX(t, [
    { x: -120, cy: 0, cz: 0, ry: 55, rz: 55 },
    { x: 0, cy: 0, cz: 30, ry: 130, rz: 130 },
    { x: 420, cy: 0, cz: 55, ry: 95, rz: 100 },
    { x: 780, cy: 0, cz: 38, ry: 48, rz: 55 },
    { x: 900, cy: 0, cz: 25, ry: 12, rz: 16 },
  ], 12);
  box(t, -180, -120, -58, 58, -42, 42);         // front crash-structure mount
  return t;
}

function sidepod() {
  const t = mesh('sidepod.stl');
  sweepX(t, [
    { x: -700, cy: 145, cz: 0, ry: 68, rz: 68 },
    { x: -430, cy: 165, cz: 28, ry: 128, rz: 105 },
    { x: 100, cy: 170, cz: 38, ry: 138, rz: 100 },
    { x: 520, cy: 140, cz: 28, ry: 98, rz: 78 },
    { x: 700, cy: 85, cz: 10, ry: 42, rz: 45 },
  ], 12);
  box(t, -500, -310, 42, 65, -24, 56);          // inlet lip / undercut suggestion
  return t;
}

function floor() {
  const t = mesh('floor.stl');
  box(t, -1600, 1600, -450, 450, 0, 28);         // 900mm floor
  box(t, -1550, -880, -450, -390, 25, 95);       // diffuser side walls
  box(t, -1550, -880, 390, 450, 25, 95);
  [-210, 0, 210].forEach((y) => box(t, -1510, -900, y - 8, y + 8, 25, 105)); // three strakes
  box(t, 960, 1510, -450, -398, 25, 52); box(t, 960, 1510, 398, 450, 25, 52);
  return t;
}

function halo() {
  const t = mesh('halo.stl');
  const r = 18;
  const left = [[300, 0, 0], [220, 0, 160], [65, 118, 220], [-190, 168, 190], [-450, 132, 0]];
  const right = [[300, 0, 0], [220, 0, 160], [65, -118, 220], [-190, -168, 190], [-450, -132, 0]];
  [left, right].forEach((p) => p.slice(0, -1).forEach((a, i) => cylinderBetween(t, a, p[i + 1], r)));
  cylinderBetween(t, [-450, 132, 0], [-450, -132, 0], r);
  cylinderBetween(t, [300, 0, 0], [300, 0, -120], r);
  return t;
}

function normal(a, b, c) {
  const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
  const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
  const l = Math.hypot(...n) || 1; return n.map((x) => x / l);
}

function writeStl(name, triangles) {
  const out = Buffer.alloc(84 + triangles.length * 50);
  out.write('ORYND Project 0 F1 procedural showcase asset', 0, 80, 'ascii');
  out.writeUInt32LE(triangles.length, 80);
  let o = 84;
  for (const [a, b, c] of triangles) {
    for (const x of normal(a, b, c)) { out.writeFloatLE(x, o); o += 4; }
    for (const p of [a, b, c]) for (const x of p) { out.writeFloatLE(x, o); o += 4; }
    out.writeUInt16LE(0, o); o += 2;
  }
  fs.writeFileSync(path.join(OUT, name), out);
}

const assembly = {
  schemaVersion: 1,
  title: 'ORYND Project 0 — F1 showcase assembly',
  units: 'mm',
  coordinateSystem: {
    origin: 'floor centre at ground plane',
    axes: { x: 'forward (nose)', y: 'left when facing forward', z: 'up' },
    rotations: 'Euler degrees [X, Y, Z], applied in XYZ order',
  },
  safety: 'Visual showcase only. Not manufacturing, vehicle, or safety-certified geometry.',
  instances: [
    { id: 'floor', asset: 'floor.stl', positionMm: [0, 0, 0], rotationDeg: [0, 0, 0], scale: [1, 1, 1], mate: 'reference datum; ground at Z=0' },
    { id: 'nose', asset: 'nose.stl', positionMm: [600, 0, 135], rotationDeg: [0, 0, 0], scale: [1, 1, 1], mate: 'nose rear mount to floor front centreline' },
    { id: 'sidepod-left', asset: 'sidepod.stl', positionMm: [-80, 350, 175], rotationDeg: [0, 0, 0], scale: [1, 1, 1], mate: 'inboard face 90mm above floor' },
    { id: 'sidepod-right', asset: 'sidepod.stl', positionMm: [-80, -350, 175], rotationDeg: [0, 0, 0], scale: [1, -1, 1], mate: 'mirror sidepod-left across XZ plane' },
    { id: 'rear-wing', asset: 'wing.stl', positionMm: [-1450, 0, 315], rotationDeg: [0, 0, 0], scale: [1, 1, 1], mate: 'wing pylons land on rear floor/diffuser' },
    { id: 'halo', asset: 'halo.stl', positionMm: [-180, 0, 250], rotationDeg: [0, 0, 0], scale: [1, 1, 1], mate: 'front pylon to cockpit centre; rear legs to cockpit shoulders' },
    { id: 'wheel-front-left', asset: 'wheel.stl', positionMm: [930, 650, 165], rotationDeg: [0, 0, 0], scale: [1, 1, 1], mate: 'hub axis parallel to Y' },
    { id: 'wheel-front-right', asset: 'wheel.stl', positionMm: [930, -650, 165], rotationDeg: [0, 0, 0], scale: [1, 1, 1], mate: 'hub axis parallel to Y' },
    { id: 'wheel-rear-left', asset: 'wheel.stl', positionMm: [-1000, 650, 165], rotationDeg: [0, 0, 0], scale: [1, 1, 1], mate: 'hub axis parallel to Y' },
    { id: 'wheel-rear-right', asset: 'wheel.stl', positionMm: [-1000, -650, 165], rotationDeg: [0, 0, 0], scale: [1, 1, 1], mate: 'hub axis parallel to Y' },
  ],
  assemblyOrder: ['floor', 'nose', 'sidepod-left', 'sidepod-right', 'rear-wing', 'halo', 'wheel-front-left', 'wheel-front-right', 'wheel-rear-left', 'wheel-rear-right'],
};

wheel(); wing(); nose(); sidepod(); floor(); halo();
for (const [name, triangles] of meshes) writeStl(name, triangles);
fs.writeFileSync(path.join(OUT, 'assembly.json'), JSON.stringify(assembly, null, 2) + '\n');
console.log(`Generated ${meshes.size} STL assets and assembly.json in ${OUT}`);
