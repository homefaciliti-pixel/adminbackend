const db = require('./db.js');

async function test() {
  try {
    const dbName = process.env.DB_NAME || 'homef4fw_homefaci';
    
    // 1. Count rows in node_partners (which prefixQuery will prefix)
    const [[{ count: nodeCount }]] = await db.query("SELECT COUNT(*) as count FROM partners");
    
    // 2. Count rows in original Laravel partners table
    const [[{ count: laravelCount }]] = await db.query(`SELECT COUNT(*) as count FROM \`${dbName}\`.\`partners\``);
    
    // 3. Count rows in original Laravel users table with role_id = 2
    const [[{ count: laravelUsersCount }]] = await db.query(`SELECT COUNT(*) as count FROM \`${dbName}\`.\`users\` WHERE role_id = 2`);
    
    console.log(`node_partners count: ${nodeCount}`);
    console.log(`laravel partners table count: ${laravelCount}`);
    console.log(`laravel users table (role_id = 2) count: ${laravelUsersCount}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Query failed:', error);
    process.exit(1);
  }
}

test();
