const db = require('./db.js');

function decodeHtmlEntities(str) {
  if (!str) return '';
  return str
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

function cleanDescription(html) {
  if (!html) return '';
  
  let text = html;
  
  // Replace <br> tags with newline
  text = text.replace(/<br\s*\/?>/gi, '\n');
  
  // Replace list items with "- Text\n"
  text = text.replace(/<li[^>]*>(.*?)<\/li>/gi, (match, content) => {
    const cleanContent = content.replace(/<[^>]*>/g, '').trim();
    return `- ${cleanContent}\n`;
  });
  
  // Replace other block elements with newlines around them
  text = text.replace(/<\/(p|div|h[1-6]|ul|ol)>/gi, '\n');
  
  // Strip all other HTML tags
  text = text.replace(/<[^>]*>/g, '');
  
  // Decode common HTML entities
  text = decodeHtmlEntities(text);
  
  // Normalize whitespace: replace 3 or more newlines with double newlines
  text = text.replace(/\n{3,}/g, '\n\n');
  
  // Normalize double spaces or spaces around newlines
  text = text.split('\n').map(line => line.trim()).join('\n');
  
  // Trim start/end
  return text.trim();
}

function extractHighlights(html) {
  if (!html) return [];
  const highlights = [];
  
  // 1. Try to find <li> elements
  const liRegex = /<li[^>]*>(.*?)<\/li>/gi;
  let match;
  while ((match = liRegex.exec(html)) !== null) {
    const item = match[1].replace(/<[^>]*>/g, '').trim();
    const decoded = decodeHtmlEntities(item);
    if (decoded && !highlights.includes(decoded)) {
      highlights.push(decoded);
    }
  }
  
  // 2. If no <li> elements found, look for lines starting with - or * or • in clean text
  if (highlights.length === 0) {
    const cleanText = html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|div|h[1-6]|ul|ol|li)>/gi, '\n')
      .replace(/<[^>]*>/g, '');
    const decodedText = decodeHtmlEntities(cleanText);
    const lines = decodedText.split('\n');
    for (let line of lines) {
      line = line.trim();
      const bulletMatch = line.match(/^[-*•]\s*(.+)$/);
      if (bulletMatch) {
        const item = bulletMatch[1].trim();
        if (item && !highlights.includes(item)) {
          highlights.push(item);
        }
      }
    }
  }
  
  // Cap highlights count or trim them to keep it clean if needed
  return highlights.slice(0, 10);
}

async function run() {
  try {
    const dbName = process.env.DB_NAME || 'homef4fw_homefaci';
    console.log('Starting migration and description cleanup...');

    // 1. Check/Add highlights column to node_services
    const [nodeCols] = await db.query("SHOW COLUMNS FROM `node_services` LIKE 'highlights'");
    if (nodeCols.length === 0) {
      console.log('Adding highlights column to node_services...');
      await db.query("ALTER TABLE `node_services` ADD COLUMN `highlights` TEXT NULL");
      console.log('highlights column added to node_services.');
    } else {
      console.log('highlights column already exists in node_services.');
    }

    // 2. Check/Add highlights column to Laravel services
    // Note: Since db.query prefixes table names, we direct query with dbName prefix to bypass
    const [laravelCols] = await db.query(`SHOW COLUMNS FROM \`${dbName}\`.\`services\` LIKE 'highlights'`);
    if (laravelCols.length === 0) {
      console.log(`Adding highlights column to ${dbName}.services...`);
      await db.query(`ALTER TABLE \`${dbName}\`.\`services\` ADD COLUMN \`highlights\` TEXT NULL`);
      console.log(`highlights column added to ${dbName}.services.`);
    } else {
      console.log(`highlights column already exists in ${dbName}.services.`);
    }

    // 3. Process node_services
    console.log('\n--- Processing node_services ---');
    const [nodeRows] = await db.query("SELECT id, title, description FROM `node_services`");
    let nodeCleanedCount = 0;
    for (const row of nodeRows) {
      const originalDesc = row.description || '';
      const cleanDesc = cleanDescription(originalDesc);
      const highlights = extractHighlights(originalDesc);
      const highlightsJson = highlights.length > 0 ? JSON.stringify(highlights) : null;

      // Update node_services
      await db.query(
        "UPDATE `node_services` SET description = ?, highlights = ? WHERE id = ?",
        [cleanDesc, highlightsJson, row.id]
      );
      nodeCleanedCount++;
    }
    console.log(`Successfully cleaned and saved ${nodeCleanedCount} rows in node_services.`);

    // 4. Process Laravel services
    console.log(`\n--- Processing Laravel ${dbName}.services ---`);
    const [laravelRows] = await db.query(`SELECT id, title, description FROM \`${dbName}\`.\`services\``);
    let laravelCleanedCount = 0;
    for (const row of laravelRows) {
      const originalDesc = row.description || '';
      const cleanDesc = cleanDescription(originalDesc);
      const highlights = extractHighlights(originalDesc);
      const highlightsJson = highlights.length > 0 ? JSON.stringify(highlights) : null;

      // Update Laravel services
      await db.query(
        `UPDATE \`${dbName}\`.\`services\` SET description = ?, highlights = ? WHERE id = ?`,
        [cleanDesc, highlightsJson, row.id]
      );
      laravelCleanedCount++;
    }
    console.log(`Successfully cleaned and saved ${laravelCleanedCount} rows in Laravel services.`);

    console.log('\nMigration and description cleanup completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

run();
