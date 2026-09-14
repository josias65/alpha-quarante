/**
 * GitHub Action — envoi email de bienvenue ALPHA 40
 * (SMTP Gmail fonctionne sur GitHub Actions, pas sur Render)
 */
const nodemailer = require('nodemailer');

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function main() {
  const prenom = process.env.MAIL_PRENOM || '';
  const email = process.env.MAIL_EMAIL || '';
  const invite =
    process.env.MAIL_INVITE ||
    process.env.INVITE_LINK ||
    'https://meet.google.com/eyy-bofp-zyb';
  const user = (process.env.EMAIL_USER || '').trim();
  const pass = (process.env.EMAIL_PASS || '').replace(/\s/g, '');

  if (!email) throw new Error('email manquant');
  if (!user || !pass) throw new Error('EMAIL_USER / EMAIL_PASS manquants');

  const name = escapeHtml(prenom);
  const link = escapeHtml(invite);

  const html = `<!DOCTYPE html>
<html lang="fr"><body style="margin:0;padding:28px 20px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.7;color:#222;">
  <p>Bonjour ${name},</p>
  <p style="font-size:17px;font-weight:700;">Merci pour ton inscription ! ❤️🔥</p>
  <p style="font-size:16px;font-weight:600;">Bienvenue dans la famille ALPHA 40 ! 🫂✨</p>
  <p>On est vraiment heureux de t’avoir parmi nous. Cette aventure, on veut la vivre ensemble, dans la bonne humeur, le partage et la fraternité.</p>
  <p>Merci pour ta confiance, et surtout… bienvenue chez toi ! ❤️</p>
  <p><strong>Voici ton accès Meet :</strong></p>
  <p><a href="${link}" style="color:#1a73e8;font-weight:700;">Rejoindre ALPHA 40 sur Google Meet</a></p>
  <p style="font-size:13px;color:#666;word-break:break-all;">${link}</p>
  <p style="margin-top:28px;font-size:13px;color:#888;">À bientôt,<br/>L'équipe ALPHA 40</p>
</body></html>`;

  const text = [
    `Bonjour ${prenom},`,
    '',
    'Merci pour ton inscription ! ❤️🔥',
    '',
    'Bienvenue dans la famille ALPHA 40 ! 🫂✨',
    '',
    "On est vraiment heureux de t’avoir parmi nous. Cette aventure, on veut la vivre ensemble, dans la bonne humeur, le partage et la fraternité.",
    '',
    'Merci pour ta confiance, et surtout… bienvenue chez toi ! ❤️',
    '',
    'Voici ton accès Meet :',
    invite,
    '',
    'À bientôt,',
    "L'équipe ALPHA 40",
  ].join('\n');

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user, pass },
  });

  const info = await transporter.sendMail({
    from: `"ALPHA 40" <${user}>`,
    replyTo: `"ALPHA 40" <${user}>`,
    to: email,
    subject: 'Bienvenue dans ALPHA 40 ❤️🔥',
    text,
    html,
  });

  console.log('Email sent:', info.messageId);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
