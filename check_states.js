const db = require('./db');

async function run() {
  try {
    const dbName = process.env.DB_NAME || 'homef4fw_homefaci';
    
    // node_states
    const [nodeStates] = await db.query('SELECT * FROM states');
    console.log('--- node_states ---');
    console.log(nodeStates);

    // Laravel states
    try {
      const [laravelStates] = await db.query(`SELECT * FROM \`${dbName}\`.\`states\``);
      console.log('\n--- Laravel states ---');
      console.log(laravelStates);
    } catch (e) {
      console.error('Error fetching Laravel states:', e.message);
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

run();
