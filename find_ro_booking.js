const db = require('./backend/db');

async function main() {
  try {
    const bookingId = 597;
    const todayDate = '2026-08-01';

    const [before] = await db.query('SELECT id, serviceName, date, timeSlot, status FROM orders_v2 WHERE id = ?', [bookingId]);
    console.log('Before:', before[0]);

    await db.query('UPDATE orders_v2 SET date = ? WHERE id = ?', [todayDate, bookingId]);
    console.log('Updated!');

    const [after] = await db.query('SELECT id, serviceName, date, timeSlot, status FROM orders_v2 WHERE id = ?', [bookingId]);
    console.log('After:', after[0]);

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

main();
