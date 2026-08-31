const mysql = require('mysql2/promise');
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
      'SELECT id, name, email, mobile, city, locality, category, isApproved, createdAt FROM node_partners WHERE city LIKE ? ORDER BY name ASC',
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

    let lines = [];
    lines.push('============================================================');
    lines.push('         JAIPUR PARTNERS LIST - HomeFaciliti');
    lines.push(`         Generated: ${new Date().toLocaleString('en-IN')}`);
    lines.push('============================================================');
    lines.push('');

    // --- Admin Panel Partners ---
    lines.push(`SECTION 1: Admin Panel Partners (node_partners) - Total: ${nodeRows.length}`);
    lines.push('------------------------------------------------------------');
    lines.push(padCol('S.No', 5) + padCol('ID', 7) + padCol('Name', 28) + padCol('Mobile', 16) + padCol('Category', 22) + padCol('Locality', 22) + padCol('Approved', 10));
    lines.push('-'.repeat(110));
    nodeRows.forEach((p, i) => {
      lines.push(
        padCol(`${i + 1}.`, 5) +
        padCol(String(p.id), 7) +
        padCol(p.name || '-', 28) +
        padCol(p.mobile || '-', 16) +
        padCol(p.category || '-', 22) +
        padCol(p.locality || '-', 22) +
        padCol(p.isApproved ? 'Yes' : 'No', 10)
      );
    });

    lines.push('');
    lines.push('');

    // --- Laravel/App Partners ---
    lines.push(`SECTION 2: App Partners (Laravel users) - Total: ${laravelRows.length}`);
    lines.push('------------------------------------------------------------');
    lines.push(padCol('S.No', 5) + padCol('ID', 7) + padCol('Name', 28) + padCol('Mobile', 16) + padCol('Category', 22) + padCol('Locality', 22) + padCol('Approved', 10));
    lines.push('-'.repeat(110));
    laravelRows.forEach((p, i) => {
      lines.push(
        padCol(`${i + 1}.`, 5) +
        padCol(String(p.id), 7) +
        padCol(p.name || '-', 28) +
        padCol(p.mobile || '-', 16) +
        padCol(p.category || '-', 22) +
        padCol(p.locality || '-', 22) +
        padCol(p.isApproved ? 'Yes' : 'No', 10)
      );
    });

    lines.push('');
    lines.push('============================================================');
    lines.push(`GRAND TOTAL: ${nodeRows.length + laravelRows.length} Partners in Jaipur`);
    lines.push('============================================================');

    const content = lines.join('\n');
    const outPath = 'd:/admin_panel/backend/scratch/jaipur_partners_list.txt';
    fs.writeFileSync(outPath, content, 'utf8');
    console.log(`✅ File saved: ${outPath}`);
    console.log(`Total partners: ${nodeRows.length + laravelRows.length}`);

  } finally {
    await pool.end();
  }
}

function padCol(str, len) {
  str = String(str || '');
  if (str.length > len - 1) str = str.substring(0, len - 2) + '…';
  return str.padEnd(len);
}

run().catch(console.error);
