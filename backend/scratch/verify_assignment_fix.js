const mysql = require('mysql2/promise');

async function run() {
  const connection = await mysql.createConnection({
    host: 'homefaciliti.com',
    user: 'homef4fw_homefaci',
    password: 'Xnj3*t%F36RDK+!',
    database: 'homef4fw_homefaci',
    port: 3306
  });

  try {
    const orderId = 608;
    const vendorMobile = '+919875787616';
    const vendorName = 'Vikash Sharma';

    console.log(`Assigning Order ${orderId} to ${vendorName} with input mobile (${vendorMobile})...`);

    // Simulate resolveVendorName cleaning logic with Laravel fallback
    let targetPhone = vendorMobile;
    let resolvedName = vendorName;
    let resolvedMobile = vendorMobile;

    if (targetPhone) {
      let cleanedPhone = String(targetPhone).trim().replace(/\s+/g, '');
      if (cleanedPhone.startsWith('+91') && cleanedPhone.length === 13) {
        cleanedPhone = cleanedPhone.substring(3);
      } else if (cleanedPhone.startsWith('91') && cleanedPhone.length === 12) {
        cleanedPhone = cleanedPhone.substring(2);
      } else if (cleanedPhone.startsWith('+')) {
        cleanedPhone = cleanedPhone.replace('+', '');
      }

      console.log(`Cleaned phone for query lookup: "${cleanedPhone}"`);

      // 1. Try node_partners
      let [partners] = await connection.query(
        'SELECT name FROM node_partners WHERE mobile = ? OR mobile = ? OR CONCAT(countryCode, mobile) = ?',
        [cleanedPhone, targetPhone, targetPhone]
      );

      // 2. Try Laravel users table
      if (partners.length === 0) {
        console.log('Not found in node_partners. Falling back to Laravel users...');
        const dbName = 'homef4fw_homefaci';
        const [laravelRows] = await connection.query(
          `SELECT name FROM \`${dbName}\`.\`users\` WHERE role_id = 2 AND (mobile_number = ? OR mobile_number = ? OR mobile_number = ?)`,
          [cleanedPhone, targetPhone, `+91${cleanedPhone}`]
        );
        if (laravelRows.length > 0) {
          partners = laravelRows;
        }
      }

      if (partners.length > 0) {
        resolvedName = partners[0].name;
      }
    }

    if (resolvedMobile) {
      let cleaned = String(resolvedMobile).trim().replace(/\s+/g, '');
      if (cleaned.startsWith('+91') && cleaned.length === 13) {
        resolvedMobile = cleaned.substring(3);
      } else if (cleaned.startsWith('91') && cleaned.length === 12) {
        resolvedMobile = cleaned.substring(2);
      } else if (cleaned.startsWith('+')) {
        resolvedMobile = cleaned.replace('+', '');
      }
    }

    console.log(`Resolved Name to save: "${resolvedName}", Resolved Mobile to save: "${resolvedMobile}"`);

  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

run();
