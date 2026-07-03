const db = require('./db.js');

async function check() {
  try {
    const [rows] = await db.query("SELECT id, title, description, isHighlighted FROM services LIMIT 10");
    console.log('--- node_services ROWS ---');
    rows.forEach(r => {
      console.log(`\nID: ${r.id} | Title: ${r.title}`);
      console.log('isHighlighted:', r.isHighlighted);
      console.log('Description:', r.description);
    });
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

check();
