/**
 * Alpha Quarante — Registration Route
 * POST /api/register
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();

const { registerParticipant } = require('../services/storage');
const { sendConfirmationEmail } = require('../services/email');
const { appendToSheet } = require('../services/sheets');

const registrationValidators = [
  body('prenom')
    .trim()
    .notEmpty().withMessage('Le prénom est obligatoire.')
    .isLength({ min: 2, max: 50 }),

  body('nom')
    .trim()
    .notEmpty().withMessage('Le nom est obligatoire.')
    .isLength({ min: 2, max: 50 }),

  body('email')
    .trim()
    .notEmpty().withMessage("L'email est obligatoire.")
    .isEmail().withMessage("L'adresse email est invalide.")
    .normalizeEmail(),

  body('sujetPriere')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 500 }).withMessage('Le sujet de prière est trop long.'),
];

router.post('/', registrationValidators, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Données invalides.',
      errors: errors.array(),
    });
  }

  const { prenom, nom, email, sujetPriere } = req.body;
  const created_at = new Date().toISOString();

  const dbResult = await registerParticipant({ prenom, nom, email, sujetPriere, created_at });

  if (!dbResult.success) {
    if (dbResult.alreadyRegistered) {
      return res.status(409).json({
        success: false,
        message: 'Cette adresse email est déjà inscrite.',
        alreadyRegistered: true,
      });
    }
    return res.status(500).json({
      success: false,
      message: "Erreur lors de l'enregistrement. Veuillez réessayer.",
    });
  }

  const row = { prenom, nom, email, sujetPriere: sujetPriere || '', created_at };

  // Google Sheet optionnel (si webhook configuré)
  appendToSheet(row)
    .then((r) => console.log(`📗 sheets=${r.success || r.skipped} ${r.reason || r.error || ''}`))
    .catch((err) => console.error('Sheets async:', err.message));

  const inviteLink = process.env.INVITE_LINK || process.env.EVENT_LINK || 'https://meet.google.com/eyy-bofp-zyb';
  sendConfirmationEmail({ prenom, nom, email })
    .then((r) => console.log(`📧 emailSent=${r.sent} ${r.reason || ''}`))
    .catch((err) => console.error('Email async:', err.message));

  console.log(`✅ Inscription: ${prenom} ${nom} <${email}>`);

  return res.status(201).json({
    success: true,
    message: 'Inscription enregistrée.',
    id: dbResult.id,
    emailSent: true,
    inviteLink,
  });
});

router.get('/count', async (req, res) => {
  const { getCount } = require('../services/storage');
  try {
    res.json({ success: true, count: await getCount() });
  } catch {
    res.status(500).json({ success: false });
  }
});

module.exports = router;
