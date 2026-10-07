// GI N' HAIR — serveur du site (Express + SQLite/Turso + Nodemailer)
process.env.TZ = process.env.TZ || 'Europe/Paris'; // les heures du planning sont celles de Grenoble
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const express = require('express');
const { createClient } = require('@libsql/client');
const nodemailer = require('nodemailer');

const PORT = process.env.PORT || 3000;
const SITE_URL = process.env.SITE_URL || process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
const LOYALTY_GOAL = 10; // nombre de visites pour remplir la tondeuse

// Base de données : Turso (gratuit, hébergé) si DATABASE_URL est défini, sinon un fichier SQLite local.
let DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
  DATABASE_URL = 'file:' + path.join(__dirname, 'data', 'barber.db');
}
const client = createClient({ url: DATABASE_URL, authToken: process.env.DATABASE_TOKEN });
// Petite surcouche pour écrire db.prepare(sql).get / .all / .run (versions asynchrones)
const db = {
  prepare: (sql) => ({
    get: async (...args) => (await client.execute({ sql, args })).rows[0],
    all: async (...args) => (await client.execute({ sql, args })).rows,
    run: async (...args) => {
      const r = await client.execute({ sql, args });
      return { lastInsertRowid: Number(r.lastInsertRowid), changes: r.rowsAffected };
    },
  }),
};
const SCHEMA = `
  CREATE TABLE IF NOT EXISTS barbers (
    id INTEGER PRIMARY KEY, slug TEXT UNIQUE, name TEXT, color TEXT
  );
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY, email TEXT UNIQUE COLLATE NOCASE, name TEXT, phone TEXT,
    password_hash TEXT, role TEXT DEFAULT 'client', barber_id INTEGER REFERENCES barbers(id),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY, user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, expires_at INTEGER
  );
  CREATE TABLE IF NOT EXISTS slots (
    id INTEGER PRIMARY KEY, barber_id INTEGER REFERENCES barbers(id),
    start TEXT, duration INTEGER DEFAULT 30, status TEXT DEFAULT 'open'
  );
  CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY, client_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    barber_id INTEGER REFERENCES barbers(id), slot_id INTEGER REFERENCES slots(id) ON DELETE SET NULL,
    start TEXT, duration INTEGER DEFAULT 30, kind TEXT, status TEXT DEFAULT 'pending',
    message TEXT, reply TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS outbox (
    id INTEGER PRIMARY KEY, recipient TEXT, subject TEXT, body TEXT, sent INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`;

// ---------- Mots de passe & sessions ----------
function hashPassword(pw) {
  const salt = crypto.randomBytes(16).toString('hex');
  return salt + ':' + crypto.scryptSync(pw, salt, 64).toString('hex');
}
function checkPassword(pw, stored) {
  const [salt, hash] = (stored || '').split(':');
  if (!salt || !hash) return false;
  const test = crypto.scryptSync(pw, salt, 64);
  return crypto.timingSafeEqual(test, Buffer.from(hash, 'hex'));
}

// ---------- Les trois barbers ----------
const BARBERS = [
  { slug: 'anton', name: 'Anton', color: '#c8202f' },
  { slug: 'gatien', name: 'Gatien', color: '#2456a6' },
  { slug: 'baptiste', name: 'Baptiste', color: '#2f8f5b' },
];
// Les comptes barbers suivent les variables BARBER_<NOM>_EMAIL / _PASSWORD à chaque démarrage :
// pour changer l'email ou le mot de passe d'un barber, il suffit de modifier la variable sur Render.
async function setup() {
  await client.executeMultiple(SCHEMA);
  for (const b of BARBERS) {
    await db.prepare('INSERT OR IGNORE INTO barbers (slug, name, color) VALUES (?, ?, ?)').run(b.slug, b.name, b.color);
    const barber = await db.prepare('SELECT * FROM barbers WHERE slug = ?').get(b.slug);
    const envEmail = process.env[`BARBER_${b.slug.toUpperCase()}_EMAIL`];
    const envPw = process.env[`BARBER_${b.slug.toUpperCase()}_PASSWORD`];
    const existing = await db.prepare('SELECT id, email FROM users WHERE barber_id = ?').get(barber.id);
    if (!existing) {
      const email = envEmail || `${b.slug}@ginhair.local`;
      await db.prepare("INSERT INTO users (email, name, password_hash, role, barber_id) VALUES (?, ?, ?, 'barber', ?)")
        .run(email, b.name, hashPassword(envPw || `${b.slug}-tondeuse`), barber.id);
      console.log(`Compte barber créé pour ${b.name} : ${email}`);
      continue;
    }
    if (envEmail && envEmail.toLowerCase() !== String(existing.email).toLowerCase()) {
      const taken = await db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(envEmail, existing.id);
      if (taken) console.error(`Impossible de passer ${b.name} à ${envEmail} : cet email a déjà un compte client.`);
      else {
        await db.prepare('UPDATE users SET email = ? WHERE id = ?').run(envEmail, existing.id);
        console.log(`Email de ${b.name} mis à jour : ${envEmail}`);
      }
    }
    if (envPw) await db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hashPassword(envPw), existing.id);
  }
}

// ---------- Emails ----------
// Deux façons d'envoyer : l'API HTTP de Brevo (BREVO_API_KEY, marche aussi sur les hébergeurs gratuits
// qui bloquent le SMTP) ou un serveur SMTP classique (SMTP_HOST...). Sinon, les mails sont juste journalisés.
const mailer = process.env.SMTP_HOST
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    })
  : null;
const MAIL_FROM_NAME = process.env.MAIL_FROM_NAME || "GI N' HAIR";
const MAIL_FROM_EMAIL = process.env.MAIL_FROM_EMAIL || 'no-reply@ginhair.local';

async function deliver(to, subject, text) {
  if (process.env.BREVO_API_KEY) {
    const r = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': process.env.BREVO_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ sender: { name: MAIL_FROM_NAME, email: MAIL_FROM_EMAIL }, to: [{ email: to }], subject, textContent: text }),
    });
    if (!r.ok) throw new Error(`Brevo ${r.status} ${await r.text()}`);
    return true;
  }
  if (mailer) {
    await mailer.sendMail({ from: `${MAIL_FROM_NAME} <${MAIL_FROM_EMAIL}>`, to, subject, text });
    return true;
  }
  return false;
}

async function sendMail(to, subject, text) {
  const info = await db.prepare('INSERT INTO outbox (recipient, subject, body) VALUES (?, ?, ?)').run(to, subject, text);
  try {
    if (await deliver(to, subject, text)) await db.prepare('UPDATE outbox SET sent = 1 WHERE id = ?').run(info.lastInsertRowid);
    else console.log(`\n📧 [email non envoyé, aucun service mail configuré] À: ${to}\nObjet: ${subject}\n${text}\n`);
  } catch (e) {
    console.error('Erreur envoi email', e.message);
  }
}

function fmtDate(start) {
  const d = new Date(start + ':00');
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }) +
    ' à ' + start.slice(11, 16).replace(':', 'h');
}

// ---------- App ----------
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'] }));

function parseCookies(req) {
  const out = {};
  (req.headers.cookie || '').split(';').forEach((c) => {
    const i = c.indexOf('=');
    if (i > 0) out[c.slice(0, i).trim()] = decodeURIComponent(c.slice(i + 1).trim());
  });
  return out;
}
app.use(async (req, res, next) => {
  const token = parseCookies(req).sid;
  if (token) {
    const row = await db.prepare(
      'SELECT u.id, u.email, u.name, u.phone, u.role, u.barber_id FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ? AND s.expires_at > ?'
    ).get(token, Date.now());
    if (row) req.user = row;
  }
  next();
});
async function startSession(res, userId) {
  const token = crypto.randomBytes(32).toString('hex');
  const maxAge = 30 * 24 * 3600 * 1000;
  await db.prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)').run(token, userId, Date.now() + maxAge);
  const secure = SITE_URL.startsWith('https') ? '; Secure' : '';
  res.setHeader('Set-Cookie', `sid=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge / 1000}${secure}`);
}
const needUser = (req, res, next) => (req.user ? next() : res.status(401).json({ error: 'Connecte-toi d’abord.' }));
const needBarber = (req, res, next) =>
  req.user && req.user.role === 'barber' ? next() : res.status(403).json({ error: 'Réservé aux barbers.' });

const isDateTime = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(s);
const nowLocal = () => {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

// --- Comptes
app.post('/api/register', async (req, res) => {
  const { email, name, password, phone } = req.body || {};
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return res.status(400).json({ error: 'Email invalide.' });
  if (!name || !name.trim()) return res.status(400).json({ error: 'Il nous faut ton prénom.' });
  if (!password || password.length < 6) return res.status(400).json({ error: 'Mot de passe : 6 caractères minimum.' });
  if (await db.prepare('SELECT id FROM users WHERE email = ?').get(email))
    return res.status(409).json({ error: 'Cet email a déjà un compte.' });
  const r = await db.prepare('INSERT INTO users (email, name, phone, password_hash) VALUES (?, ?, ?, ?)')
    .run(email.trim(), name.trim(), (phone || '').trim(), hashPassword(password));
  await startSession(res, r.lastInsertRowid);
  sendMail(email, "Bienvenue au GI N' HAIR ✂️",
    `Salut ${name.trim()} !\n\nTon compte est créé. Ta tondeuse de fidélité est vide pour l'instant, à toi de la remplir.\n\nRéserve ton prochain créneau : ${SITE_URL}/rdv\n\nL'équipe GI N' HAIR`);
  res.json({ ok: true });
});
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body || {};
  const u = await db.prepare('SELECT * FROM users WHERE email = ?').get(email || '');
  if (!u || !checkPassword(password || '', u.password_hash))
    return res.status(401).json({ error: 'Email ou mot de passe incorrect.' });
  await startSession(res, u.id);
  res.json({ ok: true, role: u.role });
});
app.post('/api/logout', async (req, res) => {
  const token = parseCookies(req).sid;
  if (token) await db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
  res.setHeader('Set-Cookie', 'sid=; Path=/; Max-Age=0');
  res.json({ ok: true });
});
app.get('/api/me', async (req, res) => {
  if (!req.user) return res.json({ user: null });
  const out = { user: req.user };
  if (req.user.role === 'client') {
    const visits = (await db.prepare("SELECT COUNT(*) AS n FROM appointments WHERE client_id = ? AND status = 'done'").get(req.user.id)).n;
    out.loyalty = { visits, goal: LOYALTY_GOAL, current: visits % LOYALTY_GOAL, rewards: Math.floor(visits / LOYALTY_GOAL) };
  }
  res.json(out);
});

// --- Barbers & créneaux (public)
app.get('/api/barbers', async (req, res) => res.json(await db.prepare('SELECT * FROM barbers ORDER BY id').all()));

app.get('/api/slots', async (req, res) => {
  const { from, to } = req.query;
  const rows = await db.prepare(
    `SELECT s.id, s.barber_id, s.start, s.duration, s.status, b.name AS barber, b.color
     FROM slots s JOIN barbers b ON b.id = s.barber_id
     WHERE s.start >= ? AND s.start < ? AND s.start >= ? ORDER BY s.start`
  ).all(from || '0000', to || '9999', nowLocal());
  res.json(rows);
});

// --- Demandes de rendez-vous (clients)
app.post('/api/appointments', needUser, async (req, res) => {
  const { slot_id, barber_id, start, duration, message } = req.body || {};
  let appt;
  if (slot_id) {
    const slot = await db.prepare("SELECT * FROM slots WHERE id = ? AND status = 'open'").get(slot_id);
    if (!slot) return res.status(409).json({ error: 'Ce créneau vient d’être pris, choisis-en un autre.' });
    await db.prepare("UPDATE slots SET status = 'held' WHERE id = ?").run(slot.id);
    appt = await db.prepare("INSERT INTO appointments (client_id, barber_id, slot_id, start, duration, kind, message) VALUES (?, ?, ?, ?, ?, 'slot', ?)")
      .run(req.user.id, slot.barber_id, slot.id, slot.start, slot.duration, message || '');
  } else {
    if (!isDateTime(start) || start < nowLocal()) return res.status(400).json({ error: 'Choisis une date et une heure dans le futur.' });
    const bid = barber_id ? Number(barber_id) : null;
    if (bid && !await db.prepare('SELECT id FROM barbers WHERE id = ?').get(bid)) return res.status(400).json({ error: 'Barber inconnu.' });
    appt = await db.prepare("INSERT INTO appointments (client_id, barber_id, start, duration, kind, message) VALUES (?, ?, ?, ?, 'proposal', ?)")
      .run(req.user.id, bid, start, Number(duration) || 30, message || '');
  }
  // Prévenir le ou les barbers concernés
  const a = await db.prepare('SELECT * FROM appointments WHERE id = ?').get(appt.lastInsertRowid);
  const targets = a.barber_id
    ? await db.prepare("SELECT email FROM users WHERE role = 'barber' AND barber_id = ?").all(a.barber_id)
    : await db.prepare("SELECT email FROM users WHERE role = 'barber'").all();
  for (const t of targets)
    sendMail(t.email, `Nouvelle demande de RDV : ${req.user.name}`,
      `${req.user.name} (${req.user.email}) demande un rendez-vous le ${fmtDate(a.start)}.\n` +
      (a.kind === 'proposal' ? 'Créneau proposé par le client (hors planning).\n' : '') +
      (a.message ? `Message : ${a.message}\n` : '') + `\nRéponds ici : ${SITE_URL}/barber`);
  res.json({ ok: true, id: a.id });
});

app.get('/api/my/appointments', needUser, async (req, res) => {
  res.json(await db.prepare(
    `SELECT a.*, b.name AS barber, b.color FROM appointments a LEFT JOIN barbers b ON b.id = a.barber_id
     WHERE a.client_id = ? ORDER BY a.start DESC`
  ).all(req.user.id));
});

app.post('/api/appointments/:id/cancel', needUser, async (req, res) => {
  const a = await db.prepare('SELECT * FROM appointments WHERE id = ? AND client_id = ?').get(req.params.id, req.user.id);
  if (!a || !['pending', 'accepted'].includes(a.status)) return res.status(400).json({ error: 'Impossible d’annuler ce RDV.' });
  await db.prepare("UPDATE appointments SET status = 'cancelled' WHERE id = ?").run(a.id);
  if (a.slot_id) await db.prepare("UPDATE slots SET status = 'open' WHERE id = ?").run(a.slot_id);
  if (a.barber_id && a.status === 'accepted') {
    const t = await db.prepare("SELECT email FROM users WHERE role = 'barber' AND barber_id = ?").get(a.barber_id);
    if (t) sendMail(t.email, `RDV annulé : ${req.user.name}`, `${req.user.name} a annulé son RDV du ${fmtDate(a.start)}.`);
  }
  res.json({ ok: true });
});

// --- Espace barber
app.post('/api/barber/slots', needBarber, async (req, res) => {
  // Crée une série de créneaux : date, heure de début, heure de fin, durée de chaque créneau
  const { date, from, to, duration } = req.body || {};
  const dur = Number(duration) || 30;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '') || !/^\d{2}:\d{2}$/.test(from || '') || !/^\d{2}:\d{2}$/.test(to || ''))
    return res.status(400).json({ error: 'Date ou heures invalides.' });
  const toMin = (t) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
  const p = (n) => String(n).padStart(2, '0');
  let created = 0;
  for (let m = toMin(from); m + dur <= toMin(to); m += dur) {
    const start = `${date}T${p(Math.floor(m / 60))}:${p(m % 60)}`;
    const clash = await db.prepare("SELECT id FROM slots WHERE barber_id = ? AND start = ? AND status != 'deleted'").get(req.user.barber_id, start);
    if (!clash) {
      await db.prepare('INSERT INTO slots (barber_id, start, duration) VALUES (?, ?, ?)').run(req.user.barber_id, start, dur);
      created++;
    }
  }
  res.json({ ok: true, created });
});
app.delete('/api/barber/slots/:id', needBarber, async (req, res) => {
  const r = await db.prepare("DELETE FROM slots WHERE id = ? AND barber_id = ? AND status = 'open'").run(req.params.id, req.user.barber_id);
  if (!r.changes) return res.status(400).json({ error: 'Créneau introuvable ou déjà demandé.' });
  res.json({ ok: true });
});
app.get('/api/barber/appointments', needBarber, async (req, res) => {
  res.json(await db.prepare(
    `SELECT a.*, u.name AS client, u.email AS client_email, u.phone AS client_phone, b.name AS barber, b.color
     FROM appointments a JOIN users u ON u.id = a.client_id LEFT JOIN barbers b ON b.id = a.barber_id
     WHERE (a.barber_id = ? OR a.barber_id IS NULL) AND a.status IN ('pending', 'accepted')
        OR (a.barber_id = ? AND a.start >= date('now', '-30 day'))
     ORDER BY a.start`
  ).all(req.user.barber_id, req.user.barber_id));
});
app.post('/api/barber/appointments/:id/:action', needBarber, async (req, res) => {
  const { id, action } = req.params;
  const a = await db.prepare(
    'SELECT a.*, u.email, u.name AS client FROM appointments a JOIN users u ON u.id = a.client_id WHERE a.id = ?'
  ).get(id);
  if (!a || (a.barber_id && a.barber_id !== req.user.barber_id)) return res.status(404).json({ error: 'RDV introuvable.' });
  const reply = ((req.body || {}).reply || '').trim();
  const me = await db.prepare('SELECT * FROM barbers WHERE id = ?').get(req.user.barber_id);

  if (action === 'accept' && a.status === 'pending') {
    await db.prepare("UPDATE appointments SET status = 'accepted', barber_id = ?, reply = ? WHERE id = ?").run(me.id, reply, a.id);
    if (a.slot_id) await db.prepare("UPDATE slots SET status = 'booked' WHERE id = ?").run(a.slot_id);
    sendMail(a.email, `✅ RDV confirmé le ${fmtDate(a.start)}`,
      `Salut ${a.client} !\n\n${me.name} a accepté ton rendez-vous du ${fmtDate(a.start)}.\n` +
      (reply ? `\nSon message : « ${reply} »\n` : '') +
      `\nViens avec des cheveux (c'est mieux pour nous).\n\nTon espace : ${SITE_URL}/espace\n\nGI N' HAIR`);
  } else if (action === 'refuse' && a.status === 'pending') {
    await db.prepare("UPDATE appointments SET status = 'refused', reply = ? WHERE id = ?").run(reply, a.id);
    if (a.slot_id) await db.prepare("UPDATE slots SET status = 'open' WHERE id = ?").run(a.slot_id);
    sendMail(a.email, `❌ RDV du ${fmtDate(a.start)} non disponible`,
      `Salut ${a.client},\n\nDésolé, ${me.name} ne peut pas te prendre le ${fmtDate(a.start)}.\n` +
      (reply ? `\nSon message : « ${reply} »\n` : '') +
      `\nRegarde les autres créneaux ou propose-nous une autre date : ${SITE_URL}/rdv\n\nGI N' HAIR`);
  } else if (action === 'done' && a.status === 'accepted') {
    await db.prepare("UPDATE appointments SET status = 'done' WHERE id = ?").run(a.id);
    const visits = (await db.prepare("SELECT COUNT(*) AS n FROM appointments WHERE client_id = ? AND status = 'done'").get(a.client_id)).n;
    if (visits % LOYALTY_GOAL === 0)
      sendMail(a.email, '🎉 Ta tondeuse est pleine !',
        `Bravo ${a.client}, ${LOYALTY_GOAL} visites ! Ta prochaine coupe est offerte. Montre ce mail (ou ton espace perso) au barber.`);
  } else if (action === 'noshow' && a.status === 'accepted') {
    await db.prepare("UPDATE appointments SET status = 'noshow' WHERE id = ?").run(a.id);
  } else {
    return res.status(400).json({ error: 'Action impossible sur ce RDV.' });
  }
  res.json({ ok: true });
});
app.get('/api/barber/outbox', needBarber, async (req, res) => {
  res.json(await db.prepare('SELECT * FROM outbox ORDER BY id DESC LIMIT 30').all());
});

setup().then(() => app.listen(PORT, () => console.log(`GI N' HAIR en ligne sur ${SITE_URL}`)));
