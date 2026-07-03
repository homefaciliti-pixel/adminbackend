const db = require('./db');

async function run() {
  try {
    const [rows] = await db.query('SHOW TABLES');
    console.log('--- ALL TABLES ---');
    console.log(JSON.stringify(rows, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

run();
