/**
 * Script to download actual category images from Render server
 * and save them to the node_uploaded_files DB table for persistence.
 * Also saves them locally to backend/uploads/ folder.
 */
const https = require('https');
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

const UPLOADS_DIR = path.join(__dirname, 'backend', 'uploads');

async function downloadImage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        return;
      }
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        const ct = res.headers['content-type'] || 'image/png';
        resolve({ buffer, mimeType: ct });
      });
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function run() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'homefaciliti.com',
    user: process.env.DB_USER || 'homef4fw_homefaci',
    password: process.env.DB_PASSWORD || 'Xnj3*t%F36RDK+!',
    database: process.env.DB_NAME || 'homef4fw_homefaci',
  });

  console.log('✅ DB connected');

  // Get all categories with images
  const [cats] = await connection.query('SELECT id, title, image FROM node_categories');
  
  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;
  const DEFAULT_SIZE = 339500; // Size of the fallback default-document.png

  for (const cat of cats) {
    if (!cat.image || !cat.image.includes('/uploads/')) {
      console.log(`⏭  Skipping ${cat.title} (no uploads URL): ${cat.image}`);
      skipCount++;
      continue;
    }

    const filename = cat.image.split('/uploads/').pop();
    const localPath = path.join(UPLOADS_DIR, filename);

    // Check if we need to download (file doesn't exist or is the wrong default size)
    const localExists = fs.existsSync(localPath);
    const localSize = localExists ? fs.statSync(localPath).size : 0;
    
    // Also check if DB already has correct data
    const [existing] = await connection.query(
      'SELECT id, LENGTH(FROM_BASE64(file_data)) as size FROM node_uploaded_files WHERE filename = ?',
      [filename]
    );
    const dbSize = existing.length > 0 ? existing[0].size : 0;

    if (dbSize > 0 && dbSize !== DEFAULT_SIZE) {
      console.log(`✅ ${cat.title} (${filename}): Already in DB (${dbSize} bytes)`);
      
      // Restore to local disk if needed
      if (!localExists || localSize === DEFAULT_SIZE) {
        const [rows] = await connection.query(
          'SELECT file_data, mime_type FROM node_uploaded_files WHERE filename = ?',
          [filename]
        );
        if (rows.length > 0) {
          const buf = Buffer.from(rows[0].file_data, 'base64');
          fs.writeFileSync(localPath, buf);
          console.log(`  📁 Restored to local disk from DB`);
        }
      }
      successCount++;
      continue;
    }

    // Download from Render
    console.log(`⬇  Downloading ${cat.title} (${filename})...`);
    try {
      const { buffer, mimeType } = await downloadImage(cat.image);
      
      if (buffer.length === DEFAULT_SIZE) {
        console.log(`  ⚠️  Got default fallback image (${buffer.length} bytes) — Render may have lost this file`);
        errorCount++;
        continue;
      }

      // Save locally
      fs.writeFileSync(localPath, buffer);
      console.log(`  📁 Saved locally (${buffer.length} bytes)`);

      // Save to DB
      const base64Data = buffer.toString('base64');
      await connection.query(
        'INSERT INTO node_uploaded_files (filename, file_data, mime_type) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE file_data = ?, mime_type = ?',
        [filename, base64Data, mimeType, base64Data, mimeType]
      );
      console.log(`  💾 Saved to DB`);

      successCount++;
    } catch (err) {
      console.error(`  ❌ Error: ${err.message}`);
      errorCount++;
    }
    
    // Small delay to avoid hammering the server
    await new Promise(r => setTimeout(r, 200));
  }

  console.log('\n========= SUMMARY =========');
  console.log(`✅ Success: ${successCount}`);
  console.log(`⏭  Skipped: ${skipCount}`);
  console.log(`❌ Errors: ${errorCount}`);

  await connection.end();
}

run().catch(console.error);
