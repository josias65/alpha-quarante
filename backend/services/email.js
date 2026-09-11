/**
 * Alpha Quarante — Email Service (Nodemailer + Gmail)
 * Mail simple (style personnel) pour mieux arriver en boîte de réception
 */

const nodemailer = require('nodemailer');

let transporter = null;

function isEmailConfigured() {
  const user = (process.env.EMAIL_USER || '').trim();
  const pass = (process.env.EMAIL_PASS || '').replace(/\s/g, '');
  if (!user || !pass) return false;
  if (user.includes('votre.email') || user.includes('example')) return false;
  if (pass.includes('votre_app_password') || pass.includes('xxxx')) return false;
  return true;
}

function getTransporter() {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER.trim(),
      pass: process.env.EMAIL_PASS.replace(/\s/g, ''),
    },
  });
  return transporter;
}

function buildEmailHTML({ prenom, nom, inviteLink }) {
  // Lien cliquable nommé « Alpha 40 » (pas un gros bouton promo)
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Alpha 40</title>
</head>
<body style="margin:0;padding:0;background:#ffffff;color:#222222;">
  <div style="max-width:560px;margin:0 auto;padding:28px 20px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#222222;">
    <p style="margin:0 0 16px;">Bonjour ${prenom},</p>

    <p style="margin:0 0 16px;">
      Ton inscription à <strong>Alpha 40</strong> est confirmée.
    </p>

    <p style="margin:0 0 16px;font-style:italic;color:#444444;">
      À l'image de Christ, selon sa ressemblance, pour dominer.<br />
      <span style="font-style:normal;font-size:13px;color:#666666;">— Genèse 1:26</span>
    </p>

    <p style="margin:0 0 8px;">Voici ton accès :</p>
    <p style="margin:0 0 24px;font-size:17px;">
      <a href="${inviteLink}" style="color:#1a73e8;text-decoration:underline;font-weight:600;">Alpha 40</a>
    </p>

    <p style="margin:0 0 8px;font-size:13px;color:#666666;">
      Si le lien ne s'ouvre pas, copie cette adresse dans ton navigateur :<br />
      <span style="color:#1a73e8;word-break:break-all;">${inviteLink}</span>
    </p>

    <p style="margin:24px 0 0;font-size:13px;color:#888888;">
      À bientôt,<br />
      L'équipe Alpha 40
    </p>
  </div>
</body>
</html>`;
}

function buildEmailText({ prenom, inviteLink }) {
  return [
    `Bonjour ${prenom},`,
    '',
    'Ton inscription à Alpha 40 est confirmée.',
    '',
    "À l'image de Christ, selon sa ressemblance, pour dominer.",
    '— Genèse 1:26',
    '',
    'Accès Alpha 40 :',
    inviteLink,
    '',
    "À bientôt,",
    "L'équipe Alpha 40",
  ].join('\n');
}

/**
 * @returns {Promise<{ sent: boolean, reason?: string }>}
 */
async function sendConfirmationEmail({ prenom, nom, email }) {
  if (!isEmailConfigured()) {
    const reason = 'EMAIL non configuré dans backend/.env';
    console.warn('⚠️  ' + reason);
    return { sent: false, reason };
  }

  const inviteLink = process.env.INVITE_LINK || process.env.EVENT_LINK || 'https://alphaquarante.fr';
  const fromEmail = process.env.EMAIL_USER.trim();
  const fromName = process.env.EMAIL_FROM_NAME || 'Alpha 40';

  try {
    await getTransporter().sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      replyTo: `"${fromName}" <${fromEmail}>`,
      to: email,
      subject: 'Alpha 40 — confirmation',
      text: buildEmailText({ prenom, inviteLink }),
      html: buildEmailHTML({ prenom, nom, inviteLink }),
      headers: {
        'X-Entity-Ref-ID': `alpha40-${Date.now()}`,
      },
    });
    console.log(`📧 Invitation envoyée à ${email}`);
    return { sent: true };
  } catch (err) {
    console.error('❌ Échec envoi email:', err.message);
    return { sent: false, reason: err.message };
  }
}

module.exports = { sendConfirmationEmail, isEmailConfigured };
