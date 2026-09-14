/**
 * ALPHA 40 — Google Apps Script : envoi des emails de bienvenue
 *
 * 1. Va sur https://script.google.com
 * 2. Nouveau projet → colle TOUT ce fichier
 * 3. Enregistrer (nom : ALPHA40 Email)
 * 4. Déployer → Nouveau déploiement
 *    - Type : Application Web
 *    - Exécuter en tant que : Moi
 *    - Qui a accès : Tout le monde
 * 5. Copie l'URL (.../exec) et envoie-la dans le chat
 *    → on la met dans Render comme EMAIL_WEBHOOK_URL
 */

function doPost(e) {
  try {
    const data = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const to = String(data.email || '').trim();
    if (!to) {
      return json_({ success: false, error: 'email manquant' });
    }

    const subject = data.subject || 'Bienvenue dans ALPHA 40';
    const html = data.html || fallbackHtml_(data);
    const text = data.text || fallbackText_(data);

    GmailApp.sendEmail(to, subject, text, {
      htmlBody: html,
      name: 'ALPHA 40',
      replyTo: Session.getActiveUser().getEmail(),
    });

    return json_({ success: true });
  } catch (err) {
    return json_({ success: false, error: String(err) });
  }
}

function doGet() {
  return json_({ ok: true, service: 'ALPHA 40 Email Webhook' });
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function fallbackHtml_(data) {
  const prenom = data.prenom || '';
  const link = data.inviteLink || 'https://meet.google.com/eyy-bofp-zyb';
  return '<p>Bonjour ' + prenom + ',</p>' +
    '<p><strong>Merci pour ton inscription !</strong></p>' +
    '<p>Bienvenue dans la famille ALPHA 40 !</p>' +
    '<p>Accès Meet : <a href="' + link + '">' + link + '</a></p>';
}

function fallbackText_(data) {
  const prenom = data.prenom || '';
  const link = data.inviteLink || 'https://meet.google.com/eyy-bofp-zyb';
  return 'Bonjour ' + prenom + ',\n\nMerci pour ton inscription !\nBienvenue dans ALPHA 40 !\n\nAccès Meet :\n' + link;
}
