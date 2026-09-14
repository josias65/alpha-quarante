/**
 * Alpha Quarante — Google Sheets (tableur cloud type Excel)
 * Envoie chaque inscription vers un Webhook Apps Script.
 *
 * Config : SHEETS_WEBHOOK_URL dans .env / Render
 * Script à coller : tools/google-apps-script.js
 */

async function appendToSheet(data) {
  const url = (process.env.SHEETS_WEBHOOK_URL || '').trim();
  if (!url) {
    return { success: false, skipped: true, reason: 'SHEETS_WEBHOOK_URL non configuré' };
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prenom: data.prenom || '',
        nom: data.nom || '',
        email: data.email || '',
        sujetPriere: data.sujetPriere || '',
        created_at: data.created_at || new Date().toISOString(),
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Sheets webhook ${res.status}: ${body}`);
    }

    console.log('📗 Inscription ajoutée au Google Sheet');
    return { success: true };
  } catch (err) {
    console.error('Sheets Error:', err.message);
    return { success: false, error: err.message };
  }
}

module.exports = { appendToSheet };
