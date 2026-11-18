
const fs = require('fs');
const path = require('path');
const db = require('./db');

// ============================================================
// FILE CACHE MANAGEMENT
// ============================================================

// Stores only filenames confirmed missing from the database.
const missingFilesCache = new Set();

// Prevents duplicate database queries for the same filename.
const pendingLoads = new Map();

// Clear missing-file cache every 10 minutes.
const CACHE_CLEAR_INTERVAL = 10 * 60 * 1000;

const cacheTimer = setInterval(() => {
  missingFilesCache.clear();
}, CACHE_CLEAR_INTERVAL);

// Do not keep the Node.js process alive only for this timer.
if (typeof cacheTimer.unref === 'function') {
  cacheTimer.unref();
}

// Always use a consistent filename cache key.
function getCacheKey(filename) {
  return path.basename(String(filename).replace(/\\/g, '/'));
}

// ============================================================
// SAVE FILE TO DATABASE
// ============================================================

/**
 * Reads a local file, converts it to Base64,
 * and saves it in uploaded_files table.
 *
 * Database column:
 * file_data LONGTEXT
 */
async function saveFileToDb(filename, filepath, mimetype) {
  try {
    if (!filename || !filepath) {
      console.warn('[saveFileToDb] Filename or filepath is missing.');
      return;
    }

    if (!fs.existsSync(filepath)) {
      console.warn(
        `[saveFileToDb] File does not exist locally: ${filepath}`
      );
      return;
    }

    const data = await fs.promises.readFile(filepath);

    if (!data || data.length === 0) {
      console.warn(
        `[saveFileToDb] File is empty: ${filename}`
      );
      return;
    }

    // Convert image/file into Base64 for LONGTEXT storage.
    const base64Data = data.toString('base64');

    await db.query(
      `INSERT INTO uploaded_files
        (filename, file_data, mime_type)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE
        file_data = VALUES(file_data),
        mime_type = VALUES(mime_type)`,
      [
        filename,
        base64Data,
        mimetype || 'application/octet-stream'
      ]
    );

    // Clear missing cache after successful upload.
    missingFilesCache.delete(getCacheKey(filename));

    console.log(
      `[saveFileToDb] Successfully saved ${filename} to DB.`
    );

  } catch (err) {
    console.error(
      `[saveFileToDb] Failed to save ${filename} to DB:`,
      err.message
    );
  }
}

// ============================================================
// FETCH FILE FROM DATABASE
// ============================================================

/**
 * Fetches file data from MySQL using exact index lookups only.
 * Avoids LIKE '%/filename' which causes full 8GB table scans.
 *
 * Multiple simultaneous requests for the same file
 * share a single database query via pendingLoads Map.
 */
async function fetchFileFromDb(filename) {
  const cacheKey = getCacheKey(filename);

  // Return existing request if already running.
  if (pendingLoads.has(cacheKey)) {
    return pendingLoads.get(cacheKey);
  }

  const loadPromise = (async () => {
    const cleanBasename = path.basename(
      String(filename).replace(/\\/g, '/')
    );

    // Use exact index lookup ONLY — avoids scanning the 8GB table.
    // Both variants (full path and basename) are tried.
    const [rows] = await db.query(
      `SELECT file_data, mime_type
       FROM uploaded_files
       WHERE filename = ?
          OR filename = ?
       LIMIT 1`,
      [
        filename,
        cleanBasename
      ]
    );

    if (!rows || rows.length === 0) {
      return null;
    }

    const fileData = rows[0].file_data;

    if (
      fileData === null ||
      fileData === undefined ||
      fileData === ''
    ) {
      console.warn(
        `[fetchFileFromDb] Empty file data for ${filename}`
      );
      return null;
    }

    // file_data is LONGTEXT containing Base64.
    const buffer = Buffer.from(String(fileData), 'base64');

    if (buffer.length === 0) {
      console.warn(
        `[fetchFileFromDb] Invalid Base64 data for ${filename}`
      );
      return null;
    }

    return {
      buffer,
      mimeType:
        rows[0].mime_type || 'application/octet-stream'
    };
  })();

  pendingLoads.set(cacheKey, loadPromise);

  try {
    return await loadPromise;
  } finally {
    pendingLoads.delete(cacheKey);
  }
}

// ============================================================
// LOAD FILE FROM DATABASE AND RESTORE LOCALLY
// ============================================================

/**
 * Loads a file from MySQL and recreates it on local disk.
 *
 * @param {string} filename
 * @param {string} destPath
 * @returns {Promise<{buffer: Buffer, mimeType: string} | null>}
 */
async function loadFileFromDb(filename, destPath) {
  if (!filename || !destPath) {
    return null;
  }

  const cacheKey = getCacheKey(filename);

  // Skip repeated queries for confirmed missing files.
  if (missingFilesCache.has(cacheKey)) {
    return null;
  }

  try {
    const file = await fetchFileFromDb(filename);

    if (!file) {
      // Cache only after a successful query confirms no record
      // or the record has empty file data.
      missingFilesCache.add(cacheKey);
      return null;
    }

    // Create destination directory if it does not exist.
    const dir = path.dirname(destPath);

    await fs.promises.mkdir(dir, {
      recursive: true
    });

    // Restore file from database to local disk.
    await fs.promises.writeFile(
      destPath,
      file.buffer
    );

    console.log(
      `[loadFileFromDb] Successfully restored ${filename} from DB.`
    );

    return {
      buffer: file.buffer,
      mimeType: file.mimeType
    };

  } catch (err) {
    // Do not cache connection/database errors as missing files.
    console.error(
      `[loadFileFromDb] Failed to load ${filename} from DB:`,
      err.message
    );

    return null;
  }
}

// ============================================================
// EXPORT FUNCTIONS
// ============================================================

module.exports = {
  saveFileToDb,
  loadFileFromDb
};
