const db = require('./db');

async function run() {
  try {
    const [rows] = await db.query('SELECT * FROM categories');
    console.log('--- ALL CATEGORIES ---');
    console.log(JSON.stringify(rows, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

run();
