const db = require('./db.js');

async function run() {
  try {
    const dbName = process.env.DB_NAME || 'homef4fw_homefaci';
    
    // Find in node_services
    const [nodeRows] = await db.query("SELECT id, title, description, isHighlighted FROM services");
    const nodeHtmlRows = nodeRows.filter(r => /<[^>]+>|&nbsp;|&amp;/i.test(r.description || ''));
    console.log(`node_services: Found ${nodeHtmlRows.length} out of ${nodeRows.length} rows with HTML or entities.`);

    // Find in Laravel services
    const [laravelRows] = await db.query(`SELECT id, title, description, isHighlighted FROM \`${dbName}\`.\`services\``);
    const laravelHtmlRows = laravelRows.filter(r => /<[^>]+>|&nbsp;|&amp;/i.test(r.description || ''));
    console.log(`Laravel services: Found ${laravelHtmlRows.length} out of ${laravelRows.length} rows with HTML or entities.`);

    if (nodeHtmlRows.length > 0) {
      console.log('\nSample HTML descriptions in node_services:');
      nodeHtmlRows.slice(0, 5).forEach(r => {
        console.log(`ID: ${r.id} | Title: ${r.title}`);
        console.log('Description:', r.description);
        console.log('---');
      });
    }

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

run();
