const db = require('./db.js');

async function run() {
  try {
    const dbName = process.env.DB_NAME || 'homef4fw_homefaci';
    
    const [nodeServices] = await db.query("SELECT id, title, category_id FROM services ORDER BY category_id, id");
    console.log('--- NODE SERVICES CATEGORY IDS ---');
    nodeServices.forEach(s => {
      console.log(`ID: ${s.id} | Title: "${s.title}" | category_id: ${s.category_id}`);
    });

    const [laravelServices] = await db.query(`SELECT id, title, category_id FROM \`${dbName}\`.\`services\` ORDER BY category_id, id`);
    console.log(`\n--- LARAVEL SERVICES CATEGORY IDS ---`);
    laravelServices.forEach(s => {
      console.log(`ID: ${s.id} | Title: "${s.title}" | category_id: ${s.category_id}`);
    });

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
