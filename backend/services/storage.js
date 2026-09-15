/**
 * ALPHA 40 — Stockage
 * 1) Durable : dépôt GitHub privé (prioritaire)
 * 2) Cache local JSON (secours / lecture rapide)
 */

const fs = require('fs');
const path = require('path');
const githubStore = require('./githubStore');

const DB_DIR = path.resolve(process.env.DB_PATH ? path.dirname(process.env.DB_PATH) : './db');
const DB_FILE = path.resolve(
  process.env.DB_PATH
    ? process.env.DB_PATH.replace('.sqlite', '.json')
    : './db/inscriptions.json'
);

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify({ inscriptions: [] }, null, 2), 'utf8');
}

function loadLocal() {
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch {
    return { inscriptions: [] };
  }
}

function saveLocal(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
}

function cacheLocal(inscription) {
  const db = loadLocal();
  if (!db.inscriptions.find((i) => i.email === inscription.email)) {
    db.inscriptions.push(inscription);
    saveLocal(db);
  }
}

/**
 * @returns {Promise<{ success: true, id: number } | { success: false, alreadyRegistered?: true, error?: string }>}
 */
async function registerParticipant(data) {
  const created_at = data.created_at || new Date().toISOString();
  const payload = { ...data, created_at };

  // Source de vérité durable
  if (githubStore.isConfigured()) {
    const result = await githubStore.registerDurable(payload);
    if (result.success && result.inscription) {
      cacheLocal(result.inscription);
      return result;
    }
    if (result.alreadyRegistered) return result;
    console.warn('⚠️  GitHub durable indisponible, secours local:', result.error || '');
  }

  // Secours local (éphémère sur Render, mais évite un échec total / 502 côté user)
  try {
    const db = loadLocal();
    const emailLow = String(data.email || '').toLowerCase();
    if (db.inscriptions.find((i) => i.email === emailLow)) {
      return { success: false, alreadyRegistered: true };
    }
    const inscription = {
      id: Date.now(),
      prenom: data.prenom,
      nom: data.nom,
      email: emailLow,
      sujetPriere: data.sujetPriere || null,
      created_at,
    };
    db.inscriptions.push(inscription);
    saveLocal(db);
    console.warn('⚠️  Inscription en local seulement (pas de stockage durable configuré)');
    return { success: true, id: inscription.id };
  } catch (err) {
    console.error('Storage Error:', err.message);
    return { success: false, error: err.message };
  }
}

async function getCount() {
  if (githubStore.isConfigured()) {
    try {
      return await githubStore.getCountDurable();
    } catch (err) {
      console.error('Count durable:', err.message);
    }
  }
  return loadLocal().inscriptions.length;
}

async function getAllRegistrations() {
  if (githubStore.isConfigured()) {
    try {
      const { inscriptions } = await githubStore.getAllDurable();
      return inscriptions;
    } catch (err) {
      console.error('Load durable:', err.message);
    }
  }
  return loadLocal().inscriptions;
}

module.exports = { registerParticipant, getCount, getAllRegistrations };
