const db = require('./db.js');

async function test() {
  try {
    const dbName = process.env.DB_NAME || 'homef4fw_homefaci';
    
    // Search in node_users_v2
    const [nodeV2] = await db.query("SELECT * FROM node_users_v2 WHERE name LIKE '%kajal%'");
    console.log('Search in node_users_v2:', nodeV2);
    
    // Search in users (node_users)
    const [nodeUsers] = await db.query("SELECT * FROM users WHERE name LIKE '%kajal%'");
    console.log('Search in node_users (users):', nodeUsers);
    
    // Search in partners (node_partners)
    const [nodePartners] = await db.query("SELECT * FROM partners WHERE name LIKE '%kajal%'");
    console.log('Search in node_partners (partners):', nodePartners);
    
    // Search in Laravel users
    const [laravelUsers] = await db.query(`SELECT id, name, email, mobile_number, role_id FROM \`${dbName}\`.\`users\` WHERE name LIKE '%kajal%'`);
    console.log('Search in Laravel users:', laravelUsers);
    
    // Search in Laravel partners
    const [laravelPartners] = await db.query(`SELECT * FROM \`${dbName}\`.\`partners\` WHERE name LIKE '%kajal%'`);
    console.log('Search in Laravel partners:', laravelPartners);

    process.exit(0);
  } catch (error) {
    console.error('Query failed:', error);
    process.exit(1);
  }
}

test();
