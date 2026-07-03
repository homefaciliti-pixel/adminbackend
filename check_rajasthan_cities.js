const db = require('./db.js');

async function check() {
  try {
    // 1. Check if Rajasthan exists in states
    const [states] = await db.query("SELECT * FROM states");
    console.log('States in Database:');
    console.log(states);

    // 2. Check cities in Rajasthan
    const [cities] = await db.query("SELECT * FROM cities WHERE stateName = 'Rajasthan'");
    console.log(`\nFound ${cities.length} cities in Rajasthan:`);
    console.log(cities.map(c => c.cityName).sort());

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

check();
