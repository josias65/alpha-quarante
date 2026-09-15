/**
 * ALPHA 40 — Stockage durable via dépôt GitHub privé
 * Source de vérité : josias65/alpha40-data (inscriptions.json + .csv)
 */

const OWNER = process.env.GITHUB_DATA_OWNER || 'josias65';
const REPO = process.env.GITHUB_DATA_REPO || 'alpha40-data';
const JSON_PATH = 'inscriptions.json';
const CSV_PATH = 'inscriptions.csv';

function token() {
  return (process.env.GITHUB_DATA_TOKEN || process.env.GITHUB_TOKEN || '').trim();
}

function isConfigured() {
  return Boolean(token());
}

function apiHeaders() {
  return {
    Authorization: `Bearer ${token()}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'alpha40-app',
  };
}

async function getFile(path) {
  const res = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}`,
    { headers: apiHeaders(), signal: AbortSignal.timeout(12000) }
  );
  if (res.status === 404) return null;
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GitHub GET ${path}: ${res.status} ${body}`);
  }
  const data = await res.json();
  const content = Buffer.from(data.content.replace(/\n/g, ''), 'base64').toString('utf8');
  return { sha: data.sha, content };
}

async function putFile(path, content, message, sha) {
  const body = {
    message,
    content: Buffer.from(content, 'utf8').toString('base64'),
  };
  if (sha) body.sha = sha;

  const res = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}`,
    {
      method: 'PUT',
      headers: { ...apiHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    }
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub PUT ${path}: ${res.status} ${text}`);
  }
  return res.json();
}

function toCsv(inscriptions) {
  const escape = (v) => {
    const s = String(v ?? '');
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const lines = ['Date,Prenom,Nom,Email,Sujet de priere'];
  for (const i of inscriptions) {
    lines.push([
      escape(i.created_at),
      escape(i.prenom),
      escape(i.nom),
      escape(i.email),
      escape(i.sujetPriere || ''),
    ].join(','));
  }
  return lines.join('\n') + '\n';
}

async function loadAll() {
  if (!isConfigured()) {
    return { inscriptions: [], sha: null, durable: false };
  }
  const file = await getFile(JSON_PATH);
  if (!file) return { inscriptions: [], sha: null, durable: true };
  try {
    const parsed = JSON.parse(file.content);
    return {
      inscriptions: Array.isArray(parsed.inscriptions) ? parsed.inscriptions : [],
      sha: file.sha,
      durable: true,
    };
  } catch {
    return { inscriptions: [], sha: file.sha, durable: true };
  }
}

async function saveAll(inscriptions, sha) {
  const json = JSON.stringify({ inscriptions }, null, 2) + '\n';
  const saved = await putFile(
    JSON_PATH,
    json,
    `inscription: ${inscriptions.length} participant(s)`,
    sha
  );
  // CSV Excel-compatible (ouvre dans Excel / Google Sheets)
  let csvSha = null;
  try {
    const csvFile = await getFile(CSV_PATH);
    csvSha = csvFile?.sha || null;
  } catch {
    csvSha = null;
  }
  await putFile(
    CSV_PATH,
    toCsv(inscriptions),
    `csv sync: ${inscriptions.length} ligne(s)`,
    csvSha
  );
  return saved;
}

/**
 * Enregistre une inscription de façon durable.
 * Retry 1x en cas de conflit SHA (inscriptions simultanées).
 */
async function registerDurable(data) {
  if (!isConfigured()) {
    return { success: false, error: 'GITHUB_DATA_TOKEN manquant' };
  }

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const { inscriptions, sha } = await loadAll();
      const emailLow = String(data.email || '').toLowerCase();
      if (inscriptions.some((i) => i.email === emailLow)) {
        return { success: false, alreadyRegistered: true };
      }

      const inscription = {
        id: Date.now(),
        prenom: data.prenom,
        nom: data.nom,
        email: emailLow,
        sujetPriere: data.sujetPriere || null,
        created_at: data.created_at || new Date().toISOString(),
      };

      inscriptions.push(inscription);
      await saveAll(inscriptions, sha);
      console.log(`💾 Durable GitHub: ${inscription.prenom} ${inscription.nom}`);
      return { success: true, id: inscription.id, inscription };
    } catch (err) {
      const conflict = String(err.message).includes('409');
      if (conflict && attempt === 0) continue;
      console.error('Durable storage error:', err.message);
      return { success: false, error: err.message };
    }
  }
  return { success: false, error: 'Conflit de sauvegarde' };
}

async function getAllDurable() {
  const { inscriptions, durable } = await loadAll();
  return { inscriptions, durable };
}

async function getCountDurable() {
  const { inscriptions } = await loadAll();
  return inscriptions.length;
}

module.exports = {
  isConfigured,
  registerDurable,
  getAllDurable,
  getCountDurable,
  toCsv,
};
