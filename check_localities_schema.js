const db = require('./db.js');

async function check() {
  try {
    const dbName = process.env.DB_NAME || 'homef4fw_homefaci';
    
    // Describe node_localities (since db.query maps 'localities' to 'node_localities')
    const [nodeSchema] = await db.query("DESCRIBE localities");
    console.log('--- node_localities SCHEMA ---');
    console.log(nodeSchema);

    // Describe Laravel localities
    const [laravelSchema] = await db.query(`DESCRIBE \`${dbName}\`.\`localities\``);
    console.log('\n--- Laravel localities SCHEMA ---');
    console.log(laravelSchema);

    // Let's also see a row in Laravel localities to see how they map to cities/states
    const [laravelRows] = await db.query(`SELECT * FROM \`${dbName}\`.\`localities\` LIMIT 5`);
    console.log('\n--- Laravel localities ROWS ---');
    console.log(laravelRows);

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

check();
