const mysql = require('mysql2/promise');

async function approvePendingPartners() {
  const pool = await mysql.createPool({
    host: 'homefaciliti.com',
    user: 'homef4fw_homefaci',
    password: 'Xnj3*t%F36RDK+!',
    database: 'homef4fw_homefaci',
    port: 3306,
  });

  try {
    // =====================================
    // 1. NODE PARTNERS TABLE (node_partners)
    // =====================================
    console.log('\n📋 Checking node_partners table...');
    const [nodePending] = await pool.query(`
      SELECT id, name, email, isApproved, createdAt
      FROM node_partners
      WHERE isApproved = 0
        AND createdAt >= '2025-01-01'
        AND createdAt < '2027-01-01'
      ORDER BY createdAt ASC
    `);

    console.log(`Found ${nodePending.length} pending partner(s) in node_partners (2025-2026):`);
    nodePending.forEach(p => console.log(`  - [ID ${p.id}] ${p.name} | ${p.email} | Registered: ${p.createdAt}`));

    if (nodePending.length > 0) {
      const [nodeResult] = await pool.query(`
        UPDATE node_partners
        SET isApproved = 1
        WHERE isApproved = 0
          AND createdAt >= '2025-01-01'
          AND createdAt < '2027-01-01'
      `);
      console.log(`✅ node_partners: ${nodeResult.affectedRows} row(s) updated to approved.`);
    } else {
      console.log(`ℹ️  No pending partners found in node_partners for 2025-2026.`);
    }

    // =====================================
    // 2. LARAVEL USERS TABLE (node_users) - role_id = 2 means partner
    // =====================================
    console.log('\n📋 Checking node_users table (Laravel partners, role_id=2)...');
    const [laravelPending] = await pool.query(`
      SELECT id, name, email, is_approval, created_at
      FROM homef4fw_homefaci.users
      WHERE role_id = 2
        AND is_approval = 0
        AND created_at >= '2025-01-01'
        AND created_at < '2027-01-01'
      ORDER BY created_at ASC
    `);

    console.log(`Found ${laravelPending.length} pending partner(s) in users table (2025-2026):`);
    laravelPending.forEach(p => console.log(`  - [ID ${p.id}] ${p.name} | ${p.email} | Registered: ${p.created_at}`));

    if (laravelPending.length > 0) {
      const [laravelResult] = await pool.query(`
        UPDATE homef4fw_homefaci.users
        SET is_approval = 1
        WHERE role_id = 2
          AND is_approval = 0
          AND created_at >= '2025-01-01'
          AND created_at < '2027-01-01'
      `);
      console.log(`✅ users (Laravel): ${laravelResult.affectedRows} row(s) updated to approved.`);
    } else {
      console.log(`ℹ️  No pending partners found in users table for 2025-2026.`);
    }

    // =====================================
    // 3. VERIFICATION
    // =====================================
    console.log('\n🔍 Verifying...');
    const [[nodeCheck]] = await pool.query(`
      SELECT COUNT(*) as count FROM node_partners
      WHERE isApproved = 0
        AND createdAt >= '2025-01-01'
        AND createdAt < '2027-01-01'
    `);
    const [[laravelCheck]] = await pool.query(`
      SELECT COUNT(*) as count FROM homef4fw_homefaci.users
      WHERE role_id = 2 AND is_approval = 0
        AND created_at >= '2025-01-01'
        AND created_at < '2027-01-01'
    `);
    console.log(`Remaining pending in node_partners (2025-2026): ${nodeCheck.count}`);
    console.log(`Remaining pending in users (2025-2026):         ${laravelCheck.count}`);
    console.log('\n✅ Done!');

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await pool.end();
  }
}

approvePendingPartners();
