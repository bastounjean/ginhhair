// Clients du Tond'Clicker : chaque client est dessiné en deux calques SVG,
// la tête (crâne nu) et les cheveux, que le jeu découpe mèche par mèche.
const INK = '#1d1416';

// Cercles posés le long d'une ellipse, pour les coiffures bouclées
function ring(cx, cy, rx, ry, r, from, to, n) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const a = (from + (to - from) * i / (n - 1)) * Math.PI / 180;
    out.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a), r]);
  }
  return out;
}
const circles = (list) => list.map(([x, y, r]) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}"/>`).join('');
const curls = (list, color) => list.map(([x, y, r]) =>
  `<path d="M${(x - r * .45).toFixed(1)} ${(y + r * .1).toFixed(1)} a${(r * .45).toFixed(1)} ${(r * .45).toFixed(1)} 0 1 1 ${(r * .7).toFixed(1)} ${(r * .25).toFixed(1)}" stroke="${color}" stroke-width="4" fill="none" stroke-linecap="round"/>`).join('');

const CLIENTS = [
  {
    name: 'Mathéo, 1re année', skin: '#f2c4a0', blush: true, mouth: 'smile', brow: '#4a2c18',
    hair: '#6b4226', dark: '#3f2414', light: '#9a6a42',
    shape: () => {
      const top = [...ring(200, 205, 112, 100, 34, 190, 350, 9), ...ring(200, 195, 60, 55, 36, 200, 340, 5)];
      const fringe = ring(200, 190, 80, 18, 26, 20, 160, 6);
      return `<path d="M90 235 C80 140 130 100 200 100 C270 100 320 140 310 235 L290 200 L110 200 Z"/>${circles(top)}${circles(fringe)}`;
    },
    details: (c) => curls([...ring(200, 205, 112, 100, 30, 200, 340, 7), ...ring(200, 190, 80, 18, 24, 30, 150, 5)], c.dark),
  },
  {
    name: 'Le DJ de la soirée BDE', skin: '#8d5a3b', mouth: 'grin', brow: '#1d1416', earring: true,
    hair: '#231a17', dark: '#0e0a09', light: '#4a3a33',
    shape: () => {
      const bumps = ring(200, 112, 128, 118, 30, 140, 400, 16);
      return `<circle cx="200" cy="112" r="126"/>${circles(bumps)}<rect x="86" y="140" width="34" height="110" rx="14"/><rect x="280" y="140" width="34" height="110" rx="14"/>`;
    },
    details: (c) => curls([...ring(200, 105, 85, 70, 22, 160, 380, 12), ...ring(200, 95, 35, 30, 20, 0, 300, 5)], c.light),
  },
  {
    name: 'Kévin, mulet assumé', skin: '#f5d0b5', mouth: 'smirk', brow: '#b08a3a', mustache: true, freckles: true,
    hair: '#e3bb55', dark: '#b08a3a', light: '#f7e3a1',
    shape: () => `
      <path d="M93 220 C86 140 138 108 200 108 C262 108 314 140 307 220 C290 192 262 182 236 186 C222 174 178 174 164 186 C138 182 110 192 93 220 Z"/>
      <path d="M94 190 C76 270 84 360 62 430 C80 440 108 438 124 426 C112 370 108 300 112 240 Z"/>
      <path d="M306 190 C324 270 316 360 338 430 C320 440 292 438 276 426 C288 370 292 300 288 240 Z"/>`,
    details: (c) => `
      <path d="M120 150 C150 125 190 120 215 128 M230 130 C260 135 285 150 295 175" stroke="${c.light}" stroke-width="6" fill="none" stroke-linecap="round"/>
      <path d="M88 280 C86 330 82 380 74 420 M312 280 C314 330 318 380 326 420 M100 260 C98 320 98 370 92 425" stroke="${c.dark}" stroke-width="4" fill="none" stroke-linecap="round"/>`,
  },
  {
    name: 'Lucas, crête verte', skin: '#e9b48f', mouth: 'grin', brow: '#2a6e3f', earring: true,
    hair: '#3cc46e', dark: '#22834a', light: '#9af0b8',
    shape: () => `
      <path d="M160 190 L140 128 L170 140 L150 72 L186 104 L192 22 L214 98 L246 58 L232 132 L262 118 L240 190 Q200 172 160 190 Z"/>`,
    details: (c) => `
      <path d="M170 170 L162 110 M196 160 L194 60 M222 168 L236 90" stroke="${c.dark}" stroke-width="5" fill="none" stroke-linecap="round"/>
      <path d="M180 150 L176 120 M206 140 L208 105" stroke="${c.light}" stroke-width="5" fill="none" stroke-linecap="round"/>`,
  },
  {
    name: 'Le délégué de promo', skin: '#f0c19d', mouth: 'smile', brow: '#1d1416', glasses: true,
    hair: '#262633', dark: '#0f0f18', light: '#5b6b94',
    shape: () => `
      <path d="M93 222 C84 150 104 112 146 96 C146 54 214 30 276 50 C330 66 338 112 304 128 C322 154 314 190 307 222 C292 188 262 172 232 176 C200 166 142 174 93 222 Z"/>`,
    details: (c) => `
      <path d="M160 90 C190 60 250 52 290 72 M150 115 C190 85 260 82 300 110" stroke="${c.light}" stroke-width="6" fill="none" stroke-linecap="round"/>
      <path d="M120 170 C150 140 200 132 250 140" stroke="${c.dark}" stroke-width="5" fill="none" stroke-linecap="round"/>`,
  },
  {
    name: 'Théo, émo depuis 2009', skin: '#f6d5c0', mouth: 'sad', brow: '#1d1416',
    hair: '#1b1a22', dark: '#000', light: '#7b4fb0',
    shape: () => `
      <path d="M90 250 C78 150 128 104 200 104 C276 104 322 150 310 255 C302 226 294 206 286 194 C270 236 228 272 168 294 C186 262 192 232 188 206 C160 218 118 228 90 250 Z"/>`,
    details: (c) => `
      <path d="M270 150 C250 200 220 240 185 270" stroke="${c.light}" stroke-width="8" fill="none" stroke-linecap="round"/>
      <path d="M240 130 C230 180 210 220 180 250 M140 140 C130 170 120 200 105 230" stroke="${c.dark}" stroke-width="4" fill="none" stroke-linecap="round" opacity=".6"/>`,
  },
  {
    name: 'Le hipster du Starbucks', skin: '#efbf98', mouth: 'smile', brow: '#8a3f1a',
    hair: '#c0602a', dark: '#8a3f1a', light: '#e98d50',
    shape: () => `
      <circle cx="200" cy="92" r="36"/>
      <path d="M94 218 C88 140 138 112 200 112 C262 112 312 140 306 218 C290 176 250 160 200 162 C150 160 110 176 94 218 Z"/>
      <path d="M98 250 C96 340 140 405 200 410 C260 405 304 340 302 250 C292 300 272 326 246 330 C232 356 168 356 154 330 C128 326 108 300 98 250 Z"/>
      <path d="M158 310 Q200 290 242 310 Q226 322 200 315 Q174 322 158 310 Z"/>`,
    details: (c) => `
      <path d="M180 82 C195 70 215 72 222 88 M130 150 C160 128 240 128 272 150" stroke="${c.light}" stroke-width="5" fill="none" stroke-linecap="round"/>
      <path d="M120 300 C130 340 150 370 175 385 M280 300 C270 340 250 370 225 385 M200 365 L200 395" stroke="${c.dark}" stroke-width="4" fill="none" stroke-linecap="round"/>`,
  },
];

function svgWrap(inner, scale = 1) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -60 400 540" width="${400 * scale}" height="${540 * scale}">${inner}</svg>`;
}

function mouthSvg(type) {
  switch (type) {
    case 'grin': return `<path d="M163 318 Q200 366 237 318 Z" fill="#6b1f2a" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>
      <path d="M170 322 L230 322 L226 332 L174 332 Z" fill="#fff"/>`;
    case 'smirk': return `<path d="M172 330 Q205 344 236 318" stroke="${INK}" stroke-width="5" fill="none" stroke-linecap="round"/>`;
    case 'sad': return `<path d="M176 338 Q200 324 224 338" stroke="${INK}" stroke-width="5" fill="none" stroke-linecap="round"/>`;
    default: return `<path d="M168 320 Q200 348 232 320" stroke="${INK}" stroke-width="5" fill="none" stroke-linecap="round"/>`;
  }
}

// Calque 1 : le client sans cheveux (cape, cou, tête, visage)
function clientBase(c) {
  const shade = 'rgba(0,0,0,.14)';
  return svgWrap(`
    <rect x="166" y="340" width="68" height="90" fill="${c.skin}" stroke="${INK}" stroke-width="5"/>
    <ellipse cx="200" cy="372" rx="36" ry="12" fill="${shade}"/>
    <path d="M24 480 C34 420 104 404 200 404 C296 404 366 420 376 480 Z" fill="${INK}"/>
    <path d="M70 480 C80 440 120 426 150 424 M330 480 C320 440 280 426 250 424" stroke="#3a2a2e" stroke-width="5" fill="none"/>
    <path d="M148 406 Q200 432 252 406 L248 422 Q200 448 152 422 Z" fill="#fff" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
    <ellipse cx="96" cy="258" rx="20" ry="30" fill="${c.skin}" stroke="${INK}" stroke-width="5"/>
    <ellipse cx="304" cy="258" rx="20" ry="30" fill="${c.skin}" stroke="${INK}" stroke-width="5"/>
    <path d="M92 256 Q96 244 102 256 M308 256 Q304 244 298 256" stroke="${shade}" stroke-width="5" fill="none"/>
    ${c.earring ? `<circle cx="96" cy="292" r="6" fill="#f2c94c" stroke="${INK}" stroke-width="3"/>` : ''}
    <path d="M96 240 C96 152 142 124 200 124 C258 124 304 152 304 240 C304 322 262 378 200 378 C138 378 96 322 96 240 Z" fill="${c.skin}" stroke="${INK}" stroke-width="6"/>
    <path d="M120 300 C130 345 160 370 200 372 C170 360 140 335 124 290 Z" fill="${shade}"/>
    <ellipse cx="160" cy="160" rx="30" ry="13" fill="#fff" opacity=".45" transform="rotate(-25 160 160)"/>
    ${c.blush !== false ? `<circle cx="138" cy="300" r="15" fill="#ff6f6f" opacity=".22"/><circle cx="262" cy="300" r="15" fill="#ff6f6f" opacity=".22"/>` : ''}
    ${c.freckles ? [[140, 285], [150, 293], [132, 296], [260, 285], [250, 293], [268, 296]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.6" fill="#b5713f"/>`).join('') : ''}
    <path d="M142 226 Q160 212 182 222 M218 222 Q240 212 258 226" stroke="${c.brow}" stroke-width="8" fill="none" stroke-linecap="round"/>
    <ellipse cx="161" cy="256" rx="15" ry="17" fill="#fff" stroke="${INK}" stroke-width="4"/>
    <ellipse cx="239" cy="256" rx="15" ry="17" fill="#fff" stroke="${INK}" stroke-width="4"/>
    <circle cx="164" cy="259" r="8" fill="${INK}"/><circle cx="242" cy="259" r="8" fill="${INK}"/>
    <circle cx="167" cy="255" r="3" fill="#fff"/><circle cx="245" cy="255" r="3" fill="#fff"/>
    ${c.glasses ? `<g fill="rgba(255,255,255,.15)" stroke="${INK}" stroke-width="5"><rect x="132" y="232" width="58" height="48" rx="14"/><rect x="210" y="232" width="58" height="48" rx="14"/></g>
      <path d="M190 252 Q200 244 210 252 M132 250 L100 244 M268 250 L300 244" stroke="${INK}" stroke-width="5" fill="none"/>` : ''}
    <path d="M200 262 Q188 290 198 298 Q206 302 214 294" stroke="${INK}" stroke-width="4.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    ${mouthSvg(c.mouth)}
    ${c.mustache ? `<path d="M164 316 Q182 298 200 310 Q218 298 236 316 Q218 314 200 318 Q182 314 164 316 Z" fill="${c.hair}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>` : ''}
  `);
}

// Calque 2 : les cheveux seuls (contour épais, remplissage, mèches)
function clientHair(c, scale = 2) {
  const shape = c.shape();
  return svgWrap(`
    <defs><g id="h">${shape}</g></defs>
    <use href="#h" fill="${INK}" stroke="${INK}" stroke-width="12" stroke-linejoin="round"/>
    <use href="#h" fill="${c.hair}"/>
    ${c.details(c)}
  `, scale);
}
