const db = require('./db.js');

async function check() {
  try {
    const dbName = process.env.DB_NAME || 'homef4fw_homefaci';
    
    // Describe node_services (since db.query maps 'services' to 'node_services')
    const [nodeSchema] = await db.query("DESCRIBE services");
    console.log('--- node_services SCHEMA ---');
    console.log(nodeSchema);

    // Describe Laravel services
    const [laravelSchema] = await db.query(`DESCRIBE \`${dbName}\`.\`services\``);
    console.log('\n--- Laravel services SCHEMA ---');
    console.log(laravelSchema);

    // Let's see some rows in node_services
    const [nodeRows] = await db.query("SELECT id, title, description, highlights FROM services LIMIT 5");
    console.log('\n--- node_services SAMPLE ROWS ---');
    console.log(JSON.stringify(nodeRows, null, 2));

    // Let's see some rows in Laravel services
    const [laravelRows] = await db.query(`SELECT id, name, description, highlights FROM \`${dbName}\`.\`services\` LIMIT 5`);
    console.log('\n--- Laravel services SAMPLE ROWS ---');
    console.log(JSON.stringify(laravelRows, null, 2));

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

check();
