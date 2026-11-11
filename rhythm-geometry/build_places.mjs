// Makes live/places.js: the seas and beaches the Blue Wave performance pages can pick from.
// Reads the lists straight out of /blue-wave/index.html.   node build_places.mjs
import fs from 'fs';
const src = fs.readFileSync(new URL('../blue-wave/index.html', import.meta.url), 'utf8');
const grab = name => { const i = src.indexOf('const ' + name + ' = ['); const j = src.indexOf('\n];', i); return new Function('return ' + src.slice(src.indexOf('[', i), j + 2))(); };
const out = [];
for (const [n, la, lo, h, p, d, t] of grab('SEAS')) out.push([n, la, lo, h, p, d, t, 0, 'Seas']);
for (const r of grab('BLUE_BEACHES')) out.push([r[7] + ', ' + r[8], r[1], r[2], r[3], r[4], r[5], r[6], 0, 'Blue coast beaches']);
for (const [n, where, la, lo] of grab('BEACHES')) out.push([n + ', ' + where, la, lo, 1.5, 9, 270, 15, 1, 'Beaches of the world']);
fs.writeFileSync(new URL('./live/places.js', import.meta.url), 'window.RG_WAVE=' + JSON.stringify(out) + ';\n');
console.log(out.length, 'places');
