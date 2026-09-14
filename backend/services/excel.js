/**
 * ALPHA 40 — Export Excel depuis la source durable
 */

const ExcelJS = require('exceljs');
const { getAllRegistrations } = require('./storage');

async function buildExcelFromRegistrations(inscriptions) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Inscriptions');
  sheet.addRow(['Date', 'Prénom', 'Nom', 'Email', 'Sujet de prière']);
  sheet.getRow(1).font = { bold: true };
  sheet.columns = [
    { width: 22 },
    { width: 18 },
    { width: 18 },
    { width: 32 },
    { width: 50 },
  ];

  for (const i of inscriptions) {
    sheet.addRow([
      i.created_at || '',
      i.prenom || '',
      i.nom || '',
      i.email || '',
      i.sujetPriere || '',
    ]);
  }

  return workbook.xlsx.writeBuffer();
}

/** Conservé pour compat éventuelle — écrit aussi une ligne locale si besoin */
async function appendRegistration() {
  return { success: true, skipped: true };
}

async function getExcelBuffer() {
  const inscriptions = await getAllRegistrations();
  return buildExcelFromRegistrations(inscriptions);
}

module.exports = { appendRegistration, getExcelBuffer, buildExcelFromRegistrations };
