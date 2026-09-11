/**
 * Alpha Quarante — Registration Route
 * POST /api/register
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();

const { registerParticipant } = require('../services/storage');
const { sendConfirmationEmail } = require('../services/email');

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

  body('telephone')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .matches(/^[\+\d\s\-\(\)]{7,20}$/).withMessage('Numéro de téléphone invalide.'),
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

  const { prenom, nom, email, telephone } = req.body;

  const dbResult = registerParticipant({ prenom, nom, email, telephone });

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

  // Attendre l'envoi pour savoir si le mail est parti
  const emailResult = await sendConfirmationEmail({ prenom, nom, email });

  console.log(`✅ Inscription: ${prenom} ${nom} <${email}> | emailSent=${emailResult.sent}`);

  return res.status(201).json({
    success: true,
    message: emailResult.sent
      ? 'Inscription enregistrée. Invitation envoyée par email.'
      : 'Inscription enregistrée. Email non envoyé (configuration manquante).',
    id: dbResult.id,
    emailSent: emailResult.sent,
    emailError: emailResult.reason || null,
  });
});

router.get('/count', (req, res) => {
  const { getCount } = require('../services/storage');
  try {
    res.json({ success: true, count: getCount() });
  } catch {
    res.status(500).json({ success: false });
  }
});

module.exports = router;
