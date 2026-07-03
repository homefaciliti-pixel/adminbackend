const db = require('./db');

async function run() {
  try {
    const [rows] = await db.query('SELECT id, title, category_id FROM services ORDER BY category_id, title');
    const categories = {};
    for (const r of rows) {
      if (!categories[r.category_id]) {
        categories[r.category_id] = [];
      }
      categories[r.category_id].push(r.title);
    }
    
    for (const [catId, titles] of Object.entries(categories)) {
      console.log(`\nCategory ${catId}:`);
      for (const t of titles) {
        console.log(`  - ${t}`);
      }
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
