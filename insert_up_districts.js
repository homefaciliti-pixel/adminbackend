const db = require('./db.js');

const upDistricts = [
  'Agra',
  'Aligarh',
  'Ambedkar Nagar',
  'Amethi',
  'Amroha',
  'Auraiya',
  'Ayodhya',
  'Azamgarh',
  'Baghpat',
  'Bahraich',
  'Ballia',
  'Balrampur',
  'Banda',
  'Barabanki',
  'Bareilly',
  'Basti',
  'Bhadohi (Sant Ravidas Nagar)',
  'Bijnor',
  'Budaun',
  'Bulandshahr',
  'Chandauli',
  'Chitrakoot',
  'Deoria',
  'Etah',
  'Etawah',
  'Farrukhabad',
  'Fatehpur',
  'Firozabad',
  'Gautam Buddha Nagar',
  'Ghaziabad',
  'Ghazipur',
  'Gonda',
  'Gorakhpur',
  'Hamirpur',
  'Hapur',
  'Hardoi',
  'Hathras',
  'Jalaun',
  'Jaunpur',
  'Jhansi',
  'Kannauj',
  'Kanpur Dehat',
  'Kanpur Nagar',
  'Kasganj',
  'Kaushambi',
  'Kushinagar',
  'Lakhimpur Kheri',
  'Lalitpur',
  'Lucknow',
  'Maharajganj',
  'Mahoba',
  'Mainpuri',
  'Mathura',
  'Mau',
  'Meerut',
  'Mirzapur',
  'Moradabad',
  'Muzaffarnagar',
  'Pilibhit',
  'Pratapgarh',
  'Prayagraj',
  'Rae Bareli',
  'Rampur',
  'Saharanpur',
  'Sambhal',
  'Sant Kabir Nagar',
  'Shahjahanpur',
  'Shamli',
  'Shravasti',
  'Siddharthnagar',
  'Sitapur',
  'Sonbhadra',
  'Sultanpur',
  'Unnao',
  'Varanasi'
];

async function run() {
  try {
    const dbName = process.env.DB_NAME || 'homef4fw_homefaci';
    console.log(`Starting Uttar Pradesh districts and localities sync for database: ${dbName}...`);

    // Fetch existing cities
    const [existingNodeCities] = await db.query("SELECT * FROM cities WHERE stateName = 'Uttar Pradesh'");
    const [existingLaravelCities] = await db.query(`SELECT * FROM \`${dbName}\`.\`cities\` WHERE state_id = 32`);

    // Fetch existing localities
    const [existingNodeLocalities] = await db.query("SELECT * FROM localities WHERE stateName = 'Uttar Pradesh'");
    const [existingLaravelLocalities] = await db.query(`SELECT * FROM \`${dbName}\`.\`localities\` WHERE state_id = 32`);

    const stats = {
      citiesAdded: 0,
      citiesUpdated: 0,
      citiesExisted: 0,
      localitiesAdded: 0,
      localitiesSkipped: 0
    };

    for (const district of upDistricts) {
      console.log(`Processing district: ${district}...`);

      // 1. Process node_cities
      let matchingNodeCity = existingNodeCities.find(
        c => c.cityName.toLowerCase() === district.toLowerCase()
      );

      if (matchingNodeCity) {
        if (matchingNodeCity.cityName !== district) {
          await db.query("UPDATE cities SET cityName = ? WHERE id = ?", [district, matchingNodeCity.id]);
          stats.citiesUpdated++;
        } else {
          stats.citiesExisted++;
        }
      } else {
        await db.query("INSERT INTO cities (cityName, stateName, status) VALUES (?, 'Uttar Pradesh', 1)", [district]);
        stats.citiesAdded++;
      }

      // 2. Process Laravel cities
      let matchingLaravelCity = existingLaravelCities.find(
        c => c.name.toLowerCase() === district.toLowerCase()
      );

      let laravelCityId;
      if (matchingLaravelCity) {
        laravelCityId = matchingLaravelCity.id;
        if (matchingLaravelCity.name !== district) {
          await db.query(`UPDATE \`${dbName}\`.\`cities\` SET name = ? WHERE id = ?`, [district, matchingLaravelCity.id]);
        }
      } else {
        const [insertRes] = await db.query(
          `INSERT INTO \`${dbName}\`.\`cities\` (name, state_id, status, created_at, updated_at) VALUES (?, 32, 1, NOW(), NOW())`,
          [district]
        );
        laravelCityId = insertRes.insertId;
      }

      // 3. Process Localities
      // Find existing localities for this district in node_localities
      const nodeLocsForCity = existingNodeLocalities.filter(
        l => l.cityName.toLowerCase() === district.toLowerCase()
      );

      if (nodeLocsForCity.length === 0) {
        // District has 0 localities, insert standard localities
        const standardLocalities = [
          `${district} City`,
          'Civil Lines',
          'Railway Station Area',
          'Main Market',
          'Bus Stand Area'
        ];

        for (const locName of standardLocalities) {
          // Check if already in node_localities (just to be safe)
          const nodeExists = existingNodeLocalities.some(
            l => l.cityName.toLowerCase() === district.toLowerCase() && l.localityName.toLowerCase() === locName.toLowerCase()
          );

          if (!nodeExists) {
            await db.query(
              "INSERT INTO localities (localityName, cityName, stateName, status) VALUES (?, ?, 'Uttar Pradesh', 1)",
              [locName, district]
            );
          }

          // Check if already in Laravel localities
          const laravelExists = existingLaravelLocalities.some(
            l => l.city_id === laravelCityId && l.name.toLowerCase() === locName.toLowerCase()
          );

          if (!laravelExists) {
            await db.query(
              `INSERT INTO \`${dbName}\`.\`localities\` (name, state_id, city_id, status, created_at, updated_at) VALUES (?, 32, ?, 1, NOW(), NOW())`,
              [locName, laravelCityId]
            );
          }

          stats.localitiesAdded++;
        }
      } else {
        // City already has localities, skip inserting mock ones to preserve real-world ones
        stats.localitiesSkipped += nodeLocsForCity.length;
      }
    }

    console.log('\n--- UP SYNC SUMMARY ---');
    console.log(`Cities Added: ${stats.citiesAdded}`);
    console.log(`Cities Capitalization Updated: ${stats.citiesUpdated}`);
    console.log(`Cities Already Existed: ${stats.citiesExisted}`);
    console.log(`Localities Added (5 per new district): ${stats.localitiesAdded}`);
    console.log(`Existing Localities Preserved: ${stats.localitiesSkipped}`);

    process.exit(0);
  } catch (err) {
    console.error('Error running UP districts sync:', err);
    process.exit(1);
  }
}

run();
