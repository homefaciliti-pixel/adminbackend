const db = require('./db.js');

async function run() {
  try {
    const dbName = process.env.DB_NAME || 'homef4fw_homefaci';
    
    const [categories] = await db.query("SELECT id, title, image FROM categories");
    console.log('--- CATEGORY IMAGES ---');
    categories.forEach(c => {
      console.log(`ID: ${c.id} | Title: "${c.title}" | Image: "${c.image}"`);
    });

    const [services] = await db.query("SELECT id, title, image, category_id FROM services LIMIT 20");
    console.log('\n--- SAMPLE SERVICES IMAGES ---');
    services.forEach(s => {
      console.log(`ID: ${s.id} | Title: "${s.title}" | CategoryID: ${s.category_id} | Image: "${s.image}"`);
    });

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
