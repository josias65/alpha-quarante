/**
 * ALPHA 40 — Calendrier événement (UTC/GMT) + 3 rappels
 * Les horaires sont en UTC (suffixe Z) : chaque calendrier les convertit
 * automatiquement au fuseau du participant.
 */

const MEET_DEFAULT = 'https://meet.google.com/eyy-bofp-zyb';

/** Début événement : 21h00 GMT le 1er octobre 2026 (aligné sur la date du compte à rebours) */
function getEventStart() {
  const raw = (process.env.EVENT_START_UTC || '2026-10-01T21:00:00Z').trim();
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return new Date('2026-10-01T21:00:00Z');
  return d;
}

function getInviteLink() {
  return (
    process.env.INVITE_LINK ||
    process.env.EVENT_LINK ||
    MEET_DEFAULT
  ).trim();
}

function getSiteUrl() {
  return (
    process.env.SITE_URL ||
    process.env.FRONTEND_URL ||
    'https://alpha-quarante.onrender.com'
  ).replace(/\/$/, '');
}

const REMINDERS = [
  {
    offsetMin: -30,
    title: "L'événement commence dans 30 minutes !",
    message:
      'Prépare-toi ! Notre événement commence dans seulement 30 minutes. Rendez-vous à 21h00 GMT. 🔥',
  },
  {
    offsetMin: 0,
    title: "🔥 L'événement commence maintenant !",
    message:
      "C'est parti ! L'événement commence maintenant. Rejoins-nous et ne manque surtout pas ce moment. 🙌",
  },
  {
    offsetMin: 30,
    title: "🔔 L'événement est en cours !",
    message:
      "L'événement continue ! Si tu n'es pas encore avec nous, c'est le moment de nous rejoindre. Ne manque pas la suite ! 🔥",
  },
];

function pad(n) {
  return String(n).padStart(2, '0');
}

/** Format ICS UTC : YYYYMMDDTHHMMSSZ */
function toIcsUtc(date) {
  return (
    date.getUTCFullYear() +
    pad(date.getUTCMonth() + 1) +
    pad(date.getUTCDate()) +
    'T' +
    pad(date.getUTCHours()) +
    pad(date.getUTCMinutes()) +
    pad(date.getUTCSeconds()) +
    'Z'
  );
}

function icsEscape(text) {
  return String(text || '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

function foldLine(line) {
  const max = 75;
  if (line.length <= max) return line;
  let out = '';
  let rest = line;
  while (rest.length > max) {
    out += rest.slice(0, max) + '\r\n ';
    rest = rest.slice(max);
  }
  return out + rest;
}

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

/**
 * Fichier ICS : 3 événements horodatés en UTC (20h30 / 21h00 / 21h30 GMT)
 * avec titre + message exacts et alarme à l’heure de chaque rappel.
 * Les clients convertissent automatiquement au fuseau du participant.
 */
function buildIcs({ inviteLink } = {}) {
  const start = getEventStart();
  const meet = inviteLink || getInviteLink();
  const stamp = toIcsUtc(new Date());
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ALPHA 40//Calendar//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  REMINDERS.forEach((r, idx) => {
    const when = addMinutes(start, r.offsetMin);
    const whenEnd = addMinutes(when, r.offsetMin === 0 ? 120 : 5);
    const rUid = `alpha40-reminder-${idx + 1}-${toIcsUtc(start)}@alpha-quarante`;
    const desc =
      r.offsetMin === 0
        ? `${r.message}\n\nAccès Meet :\n${meet}`
        : r.message;
    lines.push(
      'BEGIN:VEVENT',
      `UID:${rUid}`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${toIcsUtc(when)}`,
      `DTEND:${toIcsUtc(whenEnd)}`,
      `SUMMARY:${icsEscape(r.title)}`,
      `DESCRIPTION:${icsEscape(desc)}`
    );
    if (r.offsetMin === 0) {
      lines.push(`LOCATION:${icsEscape(meet)}`, `URL:${meet}`);
    }
    lines.push(
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      'TRIGGER:PT0S',
      `DESCRIPTION:${icsEscape(`${r.title}\n${r.message}`)}`,
      'END:VALARM',
      'END:VEVENT'
    );
  });

  lines.push('END:VCALENDAR');
  return lines.map(foldLine).join('\r\n');
}

/**
 * Google Calendar : 3 liens TEMPLATE (un par rappel), ouverts via une URL
 * qui préremplit le rappel principal 21h00 + description des 3 rappels.
 * Les dates sont en UTC (Z) → conversion fuseau local automatique.
 */
function getGoogleCalendarUrl({ inviteLink } = {}) {
  const start = getEventStart();
  const end = addMinutes(start, 120);
  const meet = inviteLink || getInviteLink();
  const details = [
    REMINDERS[1].message,
    '',
    'Accès Meet :',
    meet,
    '',
    'Rappels ALPHA 40 (heure GMT, affichés en local dans ton agenda) :',
    '',
    `20h30 GMT — ${REMINDERS[0].title}`,
    REMINDERS[0].message,
    '',
    `21h00 GMT — ${REMINDERS[1].title}`,
    REMINDERS[1].message,
    '',
    `21h30 GMT — ${REMINDERS[2].title}`,
    REMINDERS[2].message,
  ].join('\n');

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: REMINDERS[1].title,
    dates: `${toIcsUtc(start)}/${toIcsUtc(end)}`,
    details,
    location: meet,
  });
  params.append('reminders', 'popup,30');
  params.append('reminders', 'popup,0');

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function getAppleCalendarUrl() {
  return `${getSiteUrl()}/api/calendar.ics`;
}

function getCalendarLinks({ inviteLink } = {}) {
  return {
    google: getGoogleCalendarUrl({ inviteLink }),
    apple: getAppleCalendarUrl(),
    ics: buildIcs({ inviteLink }),
  };
}

function escapeHtmlAttr(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** Bloc HTML e-mail (ajout uniquement) */
function buildCalendarEmailHtml({ inviteLink } = {}) {
  const { google, apple } = getCalendarLinks({ inviteLink });
  const g = escapeHtmlAttr(google);
  const a = escapeHtmlAttr(apple);
  return `
    <p style="margin:28px 0 10px;font-weight:600;">📅 Ajouter à mon calendrier</p>
    <p style="margin:0 0 14px;font-size:14px;color:#444;">
      L’événement est à <strong>21h00 GMT</strong> (ton calendrier affichera l’heure locale).
      Trois rappels sont inclus : 20h30, 21h00 et 21h30 GMT.
    </p>
    <p style="margin:0 0 8px;">
      <a href="${g}" style="color:#1a73e8;font-weight:700;text-decoration:underline;">Ajouter à Google Calendar</a>
    </p>
    <p style="margin:0 0 8px;">
      <a href="${a}" style="color:#1a73e8;font-weight:700;text-decoration:underline;">Ajouter au calendrier Apple</a>
    </p>
  `;
}

function buildCalendarEmailText({ inviteLink } = {}) {
  const { google, apple } = getCalendarLinks({ inviteLink });
  return [
    '📅 Ajouter à mon calendrier',
    'L’événement est à 21h00 GMT (affichage automatique dans ton fuseau).',
    'Rappels : 20h30, 21h00 et 21h30 GMT.',
    '',
    `Ajouter à Google Calendar : ${google}`,
    `Ajouter au calendrier Apple : ${apple}`,
  ].join('\n');
}

module.exports = {
  buildIcs,
  getGoogleCalendarUrl,
  getAppleCalendarUrl,
  getCalendarLinks,
  buildCalendarEmailHtml,
  buildCalendarEmailText,
  getEventStart,
  REMINDERS,
};
