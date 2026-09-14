/**
 * Alpha Quarante — Express Server
 * Accessible en local ET sur le réseau (téléphone / autre PC)
 */

require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const express   = require('express');
const cors      = require('cors');
const helmet    = require('helmet');
const rateLimit = require('express-rate-limit');
const path      = require('path');
const fs        = require('fs');
const os        = require('os');

const registerRoute = require('./routes/register');

const app  = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0'; // écoute toutes les interfaces

function getLanIPs() {
  const ips = [];
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === 'IPv4' && !net.internal) ips.push(net.address);
    }
  }
  return ips;
}

app.set('trust proxy', 1);

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false,
}));

// CORS : autorise localhost + IPs du réseau local
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const allowed =
      origin.includes('localhost') ||
      origin.includes('127.0.0.1') ||
      /^https?:\/\/(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(origin) ||
      (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL);
    if (allowed) return callback(null, true);
    callback(null, true); // permissive pour le partage local / démo
  },
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false }));

app.use('/api/', rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Trop de tentatives. Veuillez réessayer dans 15 minutes.',
  },
}));

const frontendPath = path.join(__dirname, '../frontend');
if (fs.existsSync(frontendPath)) {
  app.use(express.static(frontendPath));
}

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Alpha Quarante API is running',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/register', registerRoute);

/** Téléchargement Excel des inscriptions (sujets de prière inclus) */
app.get('/api/admin/export.xlsx', async (req, res) => {
  const token = process.env.ADMIN_TOKEN || '';
  if (!token || req.query.token !== token) {
    return res.status(401).json({ success: false, message: 'Non autorisé.' });
  }
  try {
    const { getExcelBuffer } = require('./services/excel');
    const buffer = await getExcelBuffer();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="alpha40-inscriptions.xlsx"');
    return res.send(Buffer.from(buffer));
  } catch (err) {
    console.error('Export Excel:', err.message);
    return res.status(500).json({ success: false, message: 'Export impossible.' });
  }
});

app.get(['/inscription', '/confirmation'], (req, res) => {
  const page = req.path.replace('/', '') + '.html';
  res.sendFile(path.join(frontendPath, page));
});

app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ success: false, message: 'Route introuvable.' });
  }
  res.status(404).sendFile(path.join(frontendPath, 'index.html'));
});

app.use((err, req, res, next) => {
  console.error('Server Error:', err.message);
  res.status(500).json({ success: false, message: 'Erreur interne du serveur.' });
});

app.listen(PORT, HOST, () => {
  const lans = getLanIPs();
  console.log('');
  console.log('  ╔══════════════════════════════════════════╗');
  console.log('  ║          Alpha Quarante — EN LIGNE       ║');
  console.log('  ╚══════════════════════════════════════════╝');
  console.log(`  → Sur ce PC :     http://localhost:${PORT}`);
  lans.forEach((ip) => {
    console.log(`  → Téléphone/PC :  http://${ip}:${PORT}`);
  });
  console.log('');
  console.log('  Même Wi-Fi obligatoire pour téléphone / autre PC.');
  console.log('');
});

module.exports = app;
