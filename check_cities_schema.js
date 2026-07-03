const db = require('./db.js');

async function check() {
  try {
    const dbName = process.env.DB_NAME || 'homef4fw_homefaci';
    
    // Describe node_cities (since db.query maps 'cities' to 'node_cities')
    const [nodeSchema] = await db.query("DESCRIBE cities");
    console.log('--- node_cities SCHEMA ---');
    console.log(nodeSchema);

    // Describe Laravel cities
    const [laravelSchema] = await db.query(`DESCRIBE \`${dbName}\`.\`cities\``);
    console.log('\n--- Laravel cities SCHEMA ---');
    console.log(laravelSchema);

    // Let's also see some rows in Laravel cities to see how they map to states
    const [laravelRows] = await db.query(`SELECT * FROM \`${dbName}\`.\`cities\` LIMIT 5`);
    console.log('\n--- Laravel cities ROWS ---');
    console.log(laravelRows);

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

check();
