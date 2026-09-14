/**
 * Google Apps Script — à coller dans ton Google Sheet ALPHA 40
 *
 * 1. Crée un Google Sheet : https://sheets.new
 * 2. Renomme l'onglet en "Inscriptions" (ou laisse Feuille 1)
 * 3. Extensions → Apps Script
 * 4. Colle CE fichier entier, Enregistrer
 * 5. Déployer → Nouveau déploiement → Type : Application Web
 *    - Exécuter en tant que : Moi
 *    - Qui a accès : Tout le monde
 * 6. Copie l'URL du déploiement → mets-la dans Render :
 *    SHEETS_WEBHOOK_URL=https://script.google.com/macros/s/XXXX/exec
 */

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents || '{}');
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName('Inscriptions');
    if (!sheet) {
      sheet = ss.insertSheet('Inscriptions');
    }

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['Date', 'Prénom', 'Nom', 'Email', 'Sujet de prière']);
      sheet.getRange(1, 1, 1, 5).setFontWeight('bold');
    }

    sheet.appendRow([
      data.created_at || new Date().toISOString(),
      data.prenom || '',
      data.nom || '',
      data.email || '',
      data.sujetPriere || '',
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, service: 'ALPHA 40 Sheets Webhook' }))
    .setMimeType(ContentService.MimeType.JSON);
}
