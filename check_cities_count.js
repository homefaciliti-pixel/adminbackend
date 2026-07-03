const db = require('./db');

async function run() {
  try {
    const dbName = process.env.DB_NAME || 'homef4fw_homefaci';
    
    // node_cities count by stateName
    const [nodeRows] = await db.query(`
      SELECT stateName, COUNT(*) as count 
      FROM cities 
      GROUP BY stateName 
      ORDER BY count DESC
    `);
    console.log('--- node_cities count by state ---');
    console.log(nodeRows.map(r => `${r.stateName}: ${r.count} cities`).join('\n'));

    // Laravel cities count by state_id
    try {
      const [laravelRows] = await db.query(`
        SELECT s.name as stateName, COUNT(c.id) as count 
        FROM \`${dbName}\`.\`cities\` c
        JOIN \`${dbName}\`.\`states\` s ON c.state_id = s.id
        GROUP BY s.id, s.name 
        ORDER BY count DESC
      `);
      console.log('\n--- Laravel cities count by state ---');
      console.log(laravelRows.map(r => `${r.stateName}: ${r.count} cities`).join('\n'));
    } catch (e) {
      console.error('Error fetching Laravel cities count:', e.message);
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

run();
