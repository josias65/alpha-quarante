/**
 * Alpha Quarante — JSON Storage Service
 * Uses Node.js built-in fs module — zero native dependencies.
 * Stores registrations in a JSON file.
 */

const fs   = require('fs');
const path = require('path');

const DB_DIR  = path.resolve(process.env.DB_PATH ? path.dirname(process.env.DB_PATH) : './db');
const DB_FILE = path.resolve(process.env.DB_PATH
  ? process.env.DB_PATH.replace('.sqlite', '.json')
  : './db/inscriptions.json');

// ── Init ──────────────────────────────────────────────
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify({ inscriptions: [] }, null, 2), 'utf8');
  console.log('✅ Fichier JSON créé:', DB_FILE);
} else {
  console.log('✅ Stockage JSON chargé:', DB_FILE);
}

// ── Helpers ───────────────────────────────────────────
function load() {
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch {
    return { inscriptions: [] };
  }
}

function save(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// ── API ───────────────────────────────────────────────

/**
 * Register a new participant.
 * @returns {{ success: true, id: number } | { success: false, alreadyRegistered?: true, error?: string }}
 */
function registerParticipant(data) {
  try {
    const db = load();

    // Check duplicate email (case-insensitive)
    const emailLow = data.email.toLowerCase();
    if (db.inscriptions.find(i => i.email === emailLow)) {
      return { success: false, alreadyRegistered: true };
    }

    const inscription = {
      id:         Date.now(),
      prenom:     data.prenom,
      nom:        data.nom,
      email:      emailLow,
      telephone:  data.telephone || null,
      motivation: data.motivation || null,
      niveau:     data.niveau || null,
      source:     data.source || null,
      created_at: new Date().toISOString(),
    };

    db.inscriptions.push(inscription);
    save(db);

    return { success: true, id: inscription.id };
  } catch (err) {
    console.error('Storage Error:', err.message);
    return { success: false, error: err.message };
  }
}

/** Get total number of registrations. */
function getCount() {
  return load().inscriptions.length;
}

/** Get all registrations (admin use). */
function getAllRegistrations() {
  return load().inscriptions;
}

module.exports = { registerParticipant, getCount, getAllRegistrations };
