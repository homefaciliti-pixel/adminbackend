const db = require('./db.js');

const targetCities = [
  'Anupgarh',
  'Ajmer',
  'Alwar',
  'Balotra',
  'Banswara',
  'Baran',
  'Barmer',
  'Beawar',
  'Bharatpur',
  'Bhilwara',
  'Bikaner',
  'Bundi',
  'Chittorgarh',
  'Churu',
  'Dausa',
  'Deeg',
  'Dholpur',
  'Didwana-Kuchaman',
  'Dudu',
  'Dungarpur',
  'Gangapur City',
  'Hanumangarh',
  'Jaipur',
  'Jaipur Rural',
  'Jaisalmer',
  'Jalore',
  'Jhalawar',
  'Jhunjhunu',
  'Jodhpur',
  'Jodhpur Rural',
  'Karauli',
  'Kekri',
  'Khairthal-Tijara',
  'Kota',
  'Kotputli-Behror',
  'Nagaur',
  'Neem Ka Thana',
  'Pali',
  'Phalodi',
  'Pratapgarh',
  'Rajsamand',
  'Salumber',
  'Sanchore',
  'Sawai Madhopur',
  'Shahpura',
  'Sikar',
  'Sirohi',
  'Sri Ganganagar',
  'Tonk',
  'Udaipur',
  'Abu Road',
  'Bhiwadi',
  'Jaitaran',
  'Merta',
  'Sujangarh'
];

async function run() {
  try {
    const dbName = process.env.DB_NAME || 'homef4fw_homefaci';
    console.log(`Starting Rajasthan cities sync for database: ${dbName}...`);

    // Fetch existing cities from node_cities (which is translated from 'cities')
    const [existingNodeCities] = await db.query("SELECT * FROM cities WHERE stateName = 'Rajasthan'");
    
    // Fetch existing cities from Laravel database
    const [existingLaravelCities] = await db.query(`SELECT * FROM \`${dbName}\`.\`cities\` WHERE state_id = 29`);

    const nodeStats = { added: [], updated: [], existed: [] };
    const laravelStats = { added: [], updated: [], existed: [] };

    for (const city of targetCities) {
      // 1. Process node_cities
      const matchingNode = existingNodeCities.find(
        c => c.cityName.toLowerCase() === city.toLowerCase()
      );

      if (matchingNode) {
        if (matchingNode.cityName !== city) {
          // Capitalization mismatch, update it
          await db.query("UPDATE cities SET cityName = ? WHERE id = ?", [city, matchingNode.id]);
          nodeStats.updated.push(`${matchingNode.cityName} -> ${city}`);
        } else {
          nodeStats.existed.push(city);
        }
      } else {
        // Missing, insert it
        await db.query("INSERT INTO cities (cityName, stateName, status) VALUES (?, 'Rajasthan', 1)", [city]);
        nodeStats.added.push(city);
      }

      // 2. Process Laravel cities
      const matchingLaravel = existingLaravelCities.find(
        c => c.name.toLowerCase() === city.toLowerCase()
      );

      if (matchingLaravel) {
        if (matchingLaravel.name !== city) {
          // Capitalization mismatch, update it
          await db.query(`UPDATE \`${dbName}\`.\`cities\` SET name = ? WHERE id = ?`, [city, matchingLaravel.id]);
          laravelStats.updated.push(`${matchingLaravel.name} -> ${city}`);
        } else {
          laravelStats.existed.push(city);
        }
      } else {
        // Missing, insert it
        await db.query(
          `INSERT INTO \`${dbName}\`.\`cities\` (name, state_id, status, created_at, updated_at) VALUES (?, 29, 1, NOW(), NOW())`,
          [city]
        );
        laravelStats.added.push(city);
      }
    }

    console.log('\n--- SYNC COMPLETED ---');
    console.log('\n[node_cities Table]');
    console.log(`Added (${nodeStats.added.length}):`, nodeStats.added);
    console.log(`Updated Capitalization (${nodeStats.updated.length}):`, nodeStats.updated);
    console.log(`Already Existed (${nodeStats.existed.length}):`, nodeStats.existed);

    console.log(`\n[\`${dbName}\`.cities Table]`);
    console.log(`Added (${laravelStats.added.length}):`, laravelStats.added);
    console.log(`Updated Capitalization (${laravelStats.updated.length}):`, laravelStats.updated);
    console.log(`Already Existed (${laravelStats.existed.length}):`, laravelStats.existed);

    process.exit(0);
  } catch (err) {
    console.error('Error executing cities sync:', err);
    process.exit(1);
  }
}

run();
