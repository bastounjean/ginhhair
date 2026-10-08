// Éléments communs à toutes les pages : en-tête, pied de page, appels API, notifications.

const NAV = [
  ['/', 'Accueil'],
  ['/equipe', "L'équipe"],
  ['/rdv', 'Rendez-vous'],
  ['/jeu', 'Mini-jeu'],
  ['/espace', 'Mon espace', 'cta'],
];

const CLUB_INSTA = 'ginhair38';
const instaUrl = (h) => `https://www.instagram.com/${h}/`;
// « La coupe du mois » sur l'accueil : les 3 coupes en compétition (noms des photos de TEAM ci-dessous).
// Les votes repartent à zéro chaque mois. Pensez à mettre ici vos 3 dernières coupes ajoutées.
const COUPE_DU_MOIS = ['gatien1.jpg', 'coupe9.jpg', 'coupe10.jpg'];
const snapUrl = (h) => `https://www.snapchat.com/add/${h}`;

// Musique de la page L'équipe (fichier dans public/music), lancée dès l'arrivée et jouée en boucle.
const TEAM_MUSIC = 'equipe.mp3';

// Les photos des coupes. Pour en ajouter : déposer le fichier dans public/img et l'ajouter ici.
const TEAM = {
  anton: {
    name: 'Anton', color: '#c8202f',
    title: 'Le maître du dégradé (autoproclamé)',
    fifa: { note: 98, stats: [['DÉG', 92], ['CTR', 85], ['VIT', 78], ['PAT', 84], ['TCH', 90], ['DIP', 0]] },
    insta: 'anton_flz',
    instaNote: 'DM saturés, passe par webmail',
    avatar: 'avatar-anton.jpg',
    diploma: ['Diplôme de désherbage animalier', 'Mention « le mouton n’a presque rien senti »'],
    bio: "Anton a découvert sa vocation en tondant le chien de sa grand-mère en 2014. Le chien s'en est remis. Depuis, il traite chaque crâne avec tout le respect qu'il n'a pas eu pour ce pauvre caniche.",
    stats: [['Spécialité', 'Le mid fade'], ['Arme favorite', 'Tondeuse sabot 1,5'], ['Cheveux coupés', '≈ 4,2 millions'], ['Client perdu', 'Aucun (confirmé)']],
    photos: [],
  },
  gatien: {
    name: 'Gatien', color: '#2456a6',
    title: 'Le chirurgien de la nuque',
    fifa: { note: 85, stats: [['DÉG', 84], ['CTR', 97], ['VIT', 70], ['PAT', 95], ['TCH', 41], ['DIP', 0]] },
    insta: 'gatien.clv',
    instaNote: 'Ajoute-le sur Pokémon Go plutôt',
    avatar: 'avatar-gatien.jpg',
    diploma: ['CAP Tonte de pelouse synthétique', 'Option : taille de haies en forme de dauphin'],
    bio: "Gatien entretient une relation presque mystique avec la ligne droite. Ses contours sont si nets que les règles de la résidence viennent lui demander conseil. Il parle peu pendant la coupe : il se concentre (ou il dort debout, on n'a jamais tranché).",
    stats: [['Spécialité', 'Les contours au millimètre'], ['Arme favorite', 'Le rasoir de précision'], ['Temps moyen', '32 min (avec débrief)'], ['Niveau de stress', 'Zéro, c’est lui qui tient la tondeuse']],
    debuts: {
      photo: 'carnage-gatien.jpg', caption: 'Coupe n°1 de Gatien · RIP',
      report: [
        ['Victime', 'Un cobaye volontaire (il ne savait pas).'],
        ['Matériel utilisé', 'Une tondeuse et beaucoup trop de confiance.'],
        ['Constat', 'Un dégradé qui monte en escalier et une oreille qui a vu la lame de près.'],
        ['Bilan', 'Une petite trace rouge derrière l’oreille, souvenir à vie.'],
        ['Leçon apprise', 'Les oreilles, ça se plie avant de passer la tondeuse.'],
      ],
    },
    photos: [['gatien1.jpg', 'Taper bouclé'], ['gatien2.jpg', 'Bouclé au soleil'], ['gatien3.jpg', 'Coupe au bol revisitée'], ['gatien4.jpg', 'Mèches blondes']],
  },
  baptiste: {
    name: 'Baptiste', color: '#2f8f5b',
    title: 'Le dégradeur en série',
    fifa: { note: 85, stats: [['DÉG', 94], ['CTR', 86], ['VIT', 88], ['PAT', 80], ['TCH', 92], ['DIP', 0]] },
    insta: 'baptistee__jean',
    snap: 'baptistee.jean',
    instaNote: 'N’hésitez pas, en vrai',
    snapNote: 'Pareil, hésitez pas',
    avatar: 'avatar-baptiste.jpg',
    // « Un petit peu d'histoire » en bas de la fiche : la toute première coupe (photo censurée au départ)
    debuts: {
      photo: 'carnage1.jpg', caption: 'Coupe n°1 de Baptiste · RIP',
      report: [
        ['Victime', 'Ce brave De Castel.'],
        ['Matériel utilisé', 'Sûrement une tondeuse à boules.'],
        ['Constat', "Un dégradé qui n'arrivait pas à choisir entre trois hauteurs, et une nuque d'un rouge qui n'était pas prévu au programme."],
        ['Bilan', 'Une nuque presque anéantie.'],
        ['Leçon apprise', "Y'a un début à tout."],
      ],
    },
    diploma: ['Master en optimisation des flux capillaires', 'Spécialité cheveu rebelle (non reconnu par l’État)'],
    bio: "Baptiste a calculé que 87 % des étudiants de Grenoble avaient une coupe à revoir. Il a donc décidé d'agir. Sa seule mesure de satisfaction : le nombre de selfies que tu prends en sortant de sa chaise.",
    stats: [['Spécialité', 'Le taper fade texturé'], ['Arme favorite', 'La tondeuse et le peigne'], ['Taux de retour client', '100 % (les cheveux repoussent)'], ['Diplômes réels', '0, mais beaucoup d’ambition']],
    photos: [
      ['coupe10.jpg', 'Mid fade du soir'], ['coupe3.jpg', 'Mèche maîtrisée'], ['coupe5.jpg', 'Texture naturelle'],
      ['coupe6.jpg', 'Mid fade + bière'], ['coupe8.jpg', 'Blond surfeur'], ['coupe9.jpg', 'Taper texturé'],
      ['coupe2.jpg', 'Nuque nette'], ['coupe1.jpg', 'Taper blond platine'],
    ],
  },
  // Le remplaçant : affiché à part sur L'équipe, pas de prise de RDV
  gajelle: {
    name: 'Gajelle', color: '#7a3fa0', sub: true,
    title: 'Joker de luxe',
    insta: '_bttgael',
    avatar: 'avatar-gajelle.jpg',
    fifa: { note: 77, stats: [['DÉG', 68], ['CTR', 71], ['VIT', 99], ['PAT', 62], ['TCH', 96], ['DIP', 0]] },
    bio: "Gajelle attend sur le banc depuis le premier jour, tondeuse chargée et antennes de papillon sur la tête. Le jour où un titulaire se tord le poignet en plein dégradé, c'est Gajelle qui rentre sur le terrain. En attendant, l'échauffement se fait sur des brosses à cheveux.",
    stats: [['Poste', 'Remplaçant (banc de touche)'], ['Spécialité', 'Rentrer à la 89e minute'], ['Arme favorite', 'Les antennes papillon'], ['Temps de jeu', 'En attente du coach']],
    soon: "Le banc de touche n'a encore rien révélé. L'enquête suit son cours.",
    photos: [],
  },
};

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

async function api(url, opts = {}) {
  const res = await fetch(url, {
    method: opts.method || (opts.body ? 'POST' : 'GET'),
    headers: opts.body ? { 'Content-Type': 'application/json' } : {},
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Oups, une erreur est survenue.');
  return data;
}

function toast(msg) {
  let t = $('#toast');
  if (!t) { t = document.createElement('div'); t.id = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._h);
  t._h = setTimeout(() => t.classList.remove('show'), 3200);
}

// Dates « locales » au format AAAA-MM-JJTHH:MM (heure de Grenoble)
const pad = (n) => String(n).padStart(2, '0');
const isoDay = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
function fmtWhen(start, withYear = false) {
  const d = new Date(start + ':00');
  const day = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: withYear ? 'numeric' : undefined });
  return day.charAt(0).toUpperCase() + day.slice(1) + ' · ' + start.slice(11, 16).replace(':', 'h');
}
const STATUS = { pending: 'En attente', accepted: 'Confirmé', refused: 'Refusé', cancelled: 'Annulé', done: 'Effectué', noshow: 'Absent' };

function renderChrome() {
  const here = location.pathname.replace(/\.html$/, '').replace(/\/index$/, '/') || '/';
  const header = document.createElement('header');
  header.className = 'site-header';
  header.innerHTML = `
    <div class="bar">
      <a class="brand" href="/"><span>GI N' HAIR</span></a>
      <button class="burger" aria-label="Menu">☰</button>
      <nav class="nav">${NAV.map(([href, label, cls]) =>
        `<a href="${href}" class="${cls || ''} ${here === href ? 'active' : ''}">${label}</a>`).join('')}</nav>
    </div>
    <div class="pole"></div>`;
  document.body.prepend(header);
  $('.burger', header).onclick = () => $('.nav', header).classList.toggle('open');

  const footer = document.createElement('footer');
  footer.className = 'site-footer';
  footer.innerHTML = `
    <div class="pole"></div>
    <div class="wrap">
      <div><b class="display" style="color:#fff;font-size:1.3rem">GI N' HAIR</b><br>
      <small>Barber club étudiant · Grenoble INP</small></div>
      <div><a class="insta" href="${instaUrl(CLUB_INSTA)}" target="_blank" rel="noopener">📸 @${CLUB_INSTA}</a></div>
      <div><small>Aucun diplôme. Beaucoup de passion. Les cheveux repoussent.</small></div>
      <div><a href="/barber">Espace barbers</a></div>
    </div>`;
  document.body.appendChild(footer);
}

// Visionneuse de photos façon polaroid
function lightbox(items, index) {
  let lb = $('.lightbox');
  if (!lb) {
    lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.innerHTML = `<figure><img alt=""><figcaption></figcaption></figure>
      <button class="close" aria-label="Fermer">✕</button><button class="prev" aria-label="Précédente">‹</button><button class="next" aria-label="Suivante">›</button>`;
    document.body.appendChild(lb);
    lb.addEventListener('click', (e) => { if (e.target === lb) lb.classList.remove('open'); });
    $('.close', lb).onclick = () => lb.classList.remove('open');
    document.addEventListener('keydown', (e) => {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'Escape') lb.classList.remove('open');
      if (e.key === 'ArrowRight') lb._go(1);
      if (e.key === 'ArrowLeft') lb._go(-1);
    });
  }
  lb._go = (delta) => {
    index = (index + delta + items.length) % items.length;
    $('img', lb).src = '/img/' + items[index][0];
    $('figcaption', lb).textContent = items[index][1];
  };
  $('.prev', lb).onclick = () => lb._go(-1);
  $('.next', lb).onclick = () => lb._go(1);
  lb._go(0);
  lb.classList.add('open');
}

function polaroid(photo, i, onClick) {
  const f = document.createElement('figure');
  f.className = 'polaroid';
  f.style.setProperty('--r', `${[-4, 3, -2, 5, -5, 2, -3, 4][i % 8]}deg`);
  f.innerHTML = `<img src="/img/${photo[0]}" alt="${esc(photo[1])}" loading="lazy"><figcaption>${esc(photo[1])}</figcaption>`;
  f.onclick = onClick;
  return f;
}

renderChrome();

// Musique de L'équipe. Les navigateurs refusent de lancer du son sans clic : quand on clique sur
// « L'équipe » depuis une autre page, on lance la musique dans ce clic puis on affiche la page sans recharger.
function teamAudio() {
  if (!window._teamAudio) {
    window._teamAudio = new Audio(`/music/${TEAM_MUSIC}`);
    window._teamAudio.volume = 0.6;
    window._teamAudio.loop = true;
  }
  return window._teamAudio;
}
document.addEventListener('click', async (e) => {
  const a = e.target.closest('a[href="/equipe"]');
  if (!a || e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return;
  if (location.pathname === '/equipe' || location.pathname.startsWith('/jeu')) return; // le jeu tourne en boucle : vraie navigation
  e.preventDefault();
  teamAudio().play().catch(() => {});
  try {
    const doc = new DOMParser().parseFromString(await (await fetch('/equipe')).text(), 'text/html');
    document.title = doc.title;
    const footer = $('.site-footer');
    [...document.body.children].forEach((el) => { if (!el.matches('.site-header, .site-footer, #toast')) el.remove(); });
    [...doc.body.children].forEach((el) => { if (el.tagName !== 'SCRIPT') footer.before(document.adoptNode(el)); });
    $('.site-header .nav').classList.remove('open');
    document.querySelectorAll('.site-header .nav a').forEach((l) => l.classList.toggle('active', l.getAttribute('href') === '/equipe'));
    history.pushState(null, '', '/equipe');
    window._softNav = true;
    scrollTo(0, 0);
    doc.querySelectorAll('script:not([src])').forEach((old) => {
      const sc = document.createElement('script');
      sc.textContent = old.textContent;
      document.body.appendChild(sc);
    });
  } catch {
    location.href = '/equipe';
  }
});
addEventListener('popstate', () => { if (window._softNav) location.reload(); });
