const db = require('./db.js');

async function check() {
  try {
    const dbName = process.env.DB_NAME || 'homef4fw_homefaci';
    
    // Check if Uttar Pradesh exists in states
    const [states] = await db.query("SELECT * FROM states WHERE name = 'Uttar Pradesh'");
    console.log('Uttar Pradesh State in node_states:', states);

    // Check cities in Uttar Pradesh
    const [cities] = await db.query("SELECT * FROM cities WHERE stateName = 'Uttar Pradesh'");
    console.log(`\nFound ${cities.length} cities in Uttar Pradesh (node_cities):`);
    console.log(cities.map(c => c.cityName).sort());

    // Check count of localities in Uttar Pradesh
    const [localitiesCount] = await db.query("SELECT COUNT(*) as c FROM localities WHERE stateName = 'Uttar Pradesh'");
    console.log(`\nLocalities in Uttar Pradesh (node_localities): ${localitiesCount[0].c}`);

    // Check Laravel database status for Uttar Pradesh (state_id = 32)
    const [laravelCities] = await db.query(`SELECT COUNT(*) as c FROM \`${dbName}\`.\`cities\` WHERE state_id = 32`);
    console.log(`\nCities in Uttar Pradesh (Laravel): ${laravelCities[0].c}`);

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

check();
