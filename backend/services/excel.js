/**
 * Alpha Quarante — Excel local (inscriptions + sujets de prière)
 * Fichier : db/inscriptions.xlsx
 */

const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');

const DB_DIR = path.resolve(process.env.DB_PATH ? path.dirname(process.env.DB_PATH) : './db');
const XLSX_FILE = path.join(DB_DIR, 'inscriptions.xlsx');

const HEADERS = [
  'Date',
  'Prénom',
  'Nom',
  'Email',
  'Sujet de prière',
];

async function ensureWorkbook() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  const workbook = new ExcelJS.Workbook();
  if (fs.existsSync(XLSX_FILE)) {
    await workbook.xlsx.readFile(XLSX_FILE);
    let sheet = workbook.getWorksheet('Inscriptions') || workbook.worksheets[0];
    if (!sheet) {
      sheet = workbook.addWorksheet('Inscriptions');
      sheet.addRow(HEADERS);
    }
    return { workbook, sheet };
  }

  const sheet = workbook.addWorksheet('Inscriptions');
  sheet.addRow(HEADERS);
  sheet.getRow(1).font = { bold: true };
  sheet.columns = [
    { key: 'date', width: 22 },
    { key: 'prenom', width: 18 },
    { key: 'nom', width: 18 },
    { key: 'email', width: 32 },
    { key: 'sujetPriere', width: 50 },
  ];
  await workbook.xlsx.writeFile(XLSX_FILE);
  return { workbook, sheet };
}

async function appendRegistration(data) {
  try {
    const { workbook, sheet } = await ensureWorkbook();
    sheet.addRow([
      data.created_at || new Date().toISOString(),
      data.prenom || '',
      data.nom || '',
      data.email || '',
      data.sujetPriere || '',
    ]);
    await workbook.xlsx.writeFile(XLSX_FILE);
    console.log('📊 Ligne ajoutée dans Excel:', XLSX_FILE);
    return { success: true, path: XLSX_FILE };
  } catch (err) {
    console.error('Excel Error:', err.message);
    return { success: false, error: err.message };
  }
}

async function getExcelBuffer() {
  await ensureWorkbook();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(XLSX_FILE);
  return workbook.xlsx.writeBuffer();
}

function getExcelPath() {
  return XLSX_FILE;
}

module.exports = { appendRegistration, getExcelBuffer, getExcelPath };
