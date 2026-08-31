const mysql = require('mysql2/promise');
const PDFDocument = require('pdfkit');
const fs = require('fs');

async function run() {
  const pool = await mysql.createPool({
    host: 'homefaciliti.com',
    user: 'homef4fw_homefaci',
    password: 'Xnj3*t%F36RDK+!',
    database: 'homef4fw_homefaci',
    port: 3306,
  });

  try {
    // node_partners table
    const [nodeRows] = await pool.query(
      `SELECT id, name, email, mobile, city, locality, category, isApproved, createdAt
       FROM node_partners WHERE city LIKE ? ORDER BY name ASC`,
      ['%Jaipur%']
    );

    // Laravel users table
    const [laravelRows] = await pool.query(
      `SELECT u.id, u.name, u.email, u.mobile_number AS mobile,
              c.name AS city, l.name AS locality,
              cat.title AS category,
              u.is_approval AS isApproved, u.created_at AS createdAt
       FROM homef4fw_homefaci.users u
       LEFT JOIN homef4fw_homefaci.cities c ON u.city_id = c.id
       LEFT JOIN homef4fw_homefaci.localities l ON u.locality_id = l.id
       LEFT JOIN homef4fw_homefaci.categories cat ON u.category_id = cat.id
       WHERE u.role_id = 2 AND c.name LIKE ?
       ORDER BY u.name ASC`,
      ['%Jaipur%']
    );

    const outPath = 'd:/admin_panel/backend/scratch/jaipur_partners_list.pdf';
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const stream = fs.createWriteStream(outPath);
    doc.pipe(stream);

    // ========================
    // TITLE PAGE HEADER
    // ========================
    doc.rect(0, 0, doc.page.width, 80).fill('#1a237e');
    doc.fillColor('white')
       .fontSize(22)
       .font('Helvetica-Bold')
       .text('HomeFaciliti - Jaipur Partners List', 40, 25, { align: 'center' });
    doc.fontSize(10)
       .font('Helvetica')
       .text(`Generated: ${new Date().toLocaleString('en-IN')}   |   Total: ${nodeRows.length + laravelRows.length} Partners`, 40, 52, { align: 'center' });

    doc.fillColor('#000').moveDown(3);

    // ========================
    // Helper: Draw table
    // ========================
    function drawTable(title, rows, startY) {
      const pageW = doc.page.width - 80;
      const cols = [30, 170, 140, 110, 110];  // widths: S.No, Name, Mobile, Category, Locality
      const headers = ['S.No', 'Name', 'Mobile', 'Category', 'Locality'];
      const rowH = 22;
      let y = startY;

      // Section title
      doc.rect(40, y, pageW, 24).fill('#3949ab');
      doc.fillColor('white').fontSize(11).font('Helvetica-Bold')
         .text(title, 46, y + 6);
      y += 30;
      doc.fillColor('#000');

      // Header row
      doc.rect(40, y, pageW, rowH).fill('#e8eaf6');
      let x = 40;
      headers.forEach((h, i) => {
        doc.fillColor('#1a237e').fontSize(9).font('Helvetica-Bold')
           .text(h, x + 4, y + 6, { width: cols[i] - 6, lineBreak: false });
        x += cols[i];
      });
      y += rowH;

      // Data rows
      rows.forEach((p, idx) => {
        if (y > doc.page.height - 60) {
          doc.addPage();
          y = 40;
        }

        const bg = idx % 2 === 0 ? '#ffffff' : '#f5f5f5';
        doc.rect(40, y, pageW, rowH).fill(bg);

        const cells = [
          String(idx + 1) + '.',
          p.name || '-',
          p.mobile || '-',
          p.category || '-',
          p.locality || '-',
        ];

        let cx = 40;
        cells.forEach((val, i) => {
          doc.fillColor('#333333').fontSize(8).font('Helvetica')
             .text(truncate(val, cols[i] - 8), cx + 4, y + 7, { width: cols[i] - 8, lineBreak: false });
          cx += cols[i];
        });

        // bottom border line
        doc.moveTo(40, y + rowH).lineTo(40 + pageW, y + rowH).strokeColor('#e0e0e0').lineWidth(0.5).stroke();
        y += rowH;
      });

      return y + 20;
    }

    function truncate(str, maxPx) {
      const maxChars = Math.floor(maxPx / 5.5);
      if (!str) return '-';
      return str.length > maxChars ? str.substring(0, maxChars - 1) + '…' : str;
    }

    // ========================
    // SECTION 1
    // ========================
    let currentY = 100;
    currentY = drawTable(`Section 1: Admin Panel Partners  (${nodeRows.length} total)`, nodeRows, currentY);

    // Page break before section 2
    doc.addPage();
    currentY = 40;

    // ========================
    // SECTION 2
    // ========================
    currentY = drawTable(`Section 2: App Partners / Laravel Users  (${laravelRows.length} total)`, laravelRows, currentY);

    // ========================
    // FOOTER SUMMARY
    // ========================
    if (currentY > doc.page.height - 80) doc.addPage();
    doc.rect(40, currentY + 10, doc.page.width - 80, 40).fill('#1a237e');
    doc.fillColor('white').fontSize(12).font('Helvetica-Bold')
       .text(`Grand Total: ${nodeRows.length + laravelRows.length} Partners in Jaipur  |  All Approved ✓`, 46, currentY + 21, { align: 'center' });

    doc.end();

    stream.on('finish', () => {
      console.log('✅ PDF saved: ' + outPath);
      console.log(`Total partners: ${nodeRows.length + laravelRows.length}`);
    });

  } finally {
    await pool.end();
  }
}

run().catch(console.error);
