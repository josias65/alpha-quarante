/**
 * ALPHA 40 — Envoi d'emails via HTTPS (Render bloque le SMTP Gmail)
 *
 * Priorité :
 * 1) EMAIL_WEBHOOK_URL  → Google Apps Script (MailApp) — recommandé
 * 2) RESEND_API_KEY     → Resend (nécessite domaine vérifié pour la prod)
 * 3) SMTP Gmail         → secours local uniquement
 */

const nodemailer = require('nodemailer');

function isEmailConfigured() {
  if ((process.env.EMAIL_WEBHOOK_URL || '').trim()) return true;
  if ((process.env.RESEND_API_KEY || '').trim()) return true;
  const user = (process.env.EMAIL_USER || '').trim();
  const pass = (process.env.EMAIL_PASS || '').replace(/\s/g, '');
  if (!user || !pass) return false;
  if (user.includes('votre.email') || user.includes('example')) return false;
  if (pass.includes('votre_app_password') || pass.includes('xxxx')) return false;
  return true;
}

function createTransporter({ port, secure }) {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port,
    secure,
    requireTLS: !secure,
    family: 4,
    connectionTimeout: 6000,
    greetingTimeout: 6000,
    socketTimeout: 10000,
    auth: {
      user: process.env.EMAIL_USER.trim(),
      pass: process.env.EMAIL_PASS.replace(/\s/g, ''),
    },
  });
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildEmailHTML({ prenom, inviteLink }) {
  const name = escapeHtml(prenom);
  const link = escapeHtml(inviteLink);
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#ffffff;color:#222222;">
  <div style="max-width:560px;margin:0 auto;padding:28px 20px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.7;color:#222222;">
    <p style="margin:0 0 8px;">Bonjour ${name},</p>
    <p style="margin:0 0 18px;font-size:17px;font-weight:700;">Merci pour ton inscription ! ❤️🔥</p>
    <p style="margin:0 0 16px;font-size:16px;font-weight:600;">Bienvenue dans la famille ALPHA 40 ! 🫂✨</p>
    <p style="margin:0 0 16px;">
      On est vraiment heureux de t’avoir parmi nous. Cette aventure, on veut la vivre ensemble,
      dans la bonne humeur, le partage et la fraternité.
    </p>
    <p style="margin:0 0 24px;">
      Merci pour ta confiance, et surtout… bienvenue chez toi ! ❤️
    </p>
    <p style="margin:0 0 10px;font-weight:600;">Voici ton accès Meet :</p>
    <p style="margin:0 0 8px;font-size:17px;">
      <a href="${link}" style="color:#1a73e8;text-decoration:underline;font-weight:700;">Rejoindre ALPHA 40 sur Google Meet</a>
    </p>
    <p style="margin:0 0 8px;font-size:13px;color:#666666;word-break:break-all;">${link}</p>
    <p style="margin:28px 0 0;font-size:13px;color:#888888;">À bientôt,<br />L'équipe ALPHA 40</p>
  </div>
</body>
</html>`;
}

function buildEmailText({ prenom, inviteLink }) {
  return [
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
    inviteLink,
    '',
    'À bientôt,',
    "L'équipe ALPHA 40",
  ].join('\n');
}

async function sendViaWebhook({ prenom, nom, email, inviteLink }) {
  const url = process.env.EMAIL_WEBHOOK_URL.trim();
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prenom,
      nom: nom || '',
      email,
      inviteLink,
      subject: 'Bienvenue dans ALPHA 40 ❤️🔥',
      html: buildEmailHTML({ prenom, inviteLink }),
      text: buildEmailText({ prenom, inviteLink }),
    }),
    redirect: 'follow',
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Email webhook ${res.status}: ${body}`);
  }
}

async function sendViaResend({ prenom, email, inviteLink, fromName }) {
  const key = process.env.RESEND_API_KEY.trim();
  // Sans domaine vérifié, Resend n'accepte que onboarding@resend.dev (tests)
  const fromEmail = (process.env.RESEND_FROM || 'onboarding@resend.dev').trim();
  const replyTo = (process.env.EMAIL_USER || '').trim() || undefined;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `${fromName} <${fromEmail}>`,
      to: [email],
      reply_to: replyTo,
      subject: 'Bienvenue dans ALPHA 40 ❤️🔥',
      html: buildEmailHTML({ prenom, inviteLink }),
      text: buildEmailText({ prenom, inviteLink }),
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend ${res.status}: ${body}`);
  }
}

async function sendViaSmtp({ prenom, email, inviteLink, fromName, fromEmail }) {
  const mail = {
    from: `"${fromName}" <${fromEmail}>`,
    replyTo: `"${fromName}" <${fromEmail}>`,
    to: email,
    subject: 'Bienvenue dans ALPHA 40 ❤️🔥',
    text: buildEmailText({ prenom, inviteLink }),
    html: buildEmailHTML({ prenom, inviteLink }),
  };

  const attempts = [
    { port: 465, secure: true },
    { port: 587, secure: false },
  ];

  let lastErr;
  for (const cfg of attempts) {
    try {
      const transporter = createTransporter(cfg);
      await transporter.sendMail(mail);
      transporter.close();
      return;
    } catch (err) {
      lastErr = err;
      console.warn(`SMTP ${cfg.port} échoué:`, err.message);
    }
  }
  throw lastErr || new Error('SMTP indisponible');
}

async function sendConfirmationEmail({ prenom, nom, email }) {
  if (!isEmailConfigured()) {
    const reason = 'EMAIL non configuré';
    console.warn('⚠️  ' + reason);
    return { sent: false, reason };
  }

  const inviteLink = process.env.INVITE_LINK || process.env.EVENT_LINK || 'https://meet.google.com/eyy-bofp-zyb';
  const fromName = process.env.EMAIL_FROM_NAME || 'ALPHA 40';
  const fromEmail = (process.env.EMAIL_USER || '').trim();

  try {
    if ((process.env.EMAIL_WEBHOOK_URL || '').trim()) {
      await sendViaWebhook({ prenom, nom, email, inviteLink });
    } else if ((process.env.RESEND_API_KEY || '').trim()) {
      await sendViaResend({ prenom, email, inviteLink, fromName });
    } else {
      await sendViaSmtp({ prenom, email, inviteLink, fromName, fromEmail });
    }
    console.log(`📧 Invitation envoyée à ${email}`);
    return { sent: true };
  } catch (err) {
    console.error('❌ Échec envoi email:', err.message);
    return { sent: false, reason: err.message };
  }
}

module.exports = { sendConfirmationEmail, isEmailConfigured };
