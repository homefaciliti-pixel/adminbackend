const express = require('express');
const router = require('express').Router();
const db = require('../db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Jimp } = require('jimp');

// Multer setup for banner image uploads
const bannerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/banners');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}_${file.originalname.replace(/\s+/g, '_')}`;
    cb(null, unique);
  }
});

// Only allow image files for banner uploads (videos not supported - use git committed files)
const bannerFileFilter = (req, file, cb) => {
  const videoExtensions = ['.mp4', '.mov', '.avi', '.webm', '.mkv', '.m4v'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (videoExtensions.includes(ext)) {
    return cb(new Error('Video files cannot be uploaded via admin panel. Please commit video files to git (e.g. save.mp4) and use the filename directly in the DB.'), false);
  }
  cb(null, true);
};

const uploadBanner = multer({ storage: bannerStorage, fileFilter: bannerFileFilter });

async function cropToBannerRatio(filePath) {
  try {
    const image = await Jimp.read(filePath);
    const width = image.bitmap.width;
    const height = image.bitmap.height;
    
    let targetWidth = width;
    let targetHeight = Math.round(width * 370 / 1000);
    
    if (targetHeight > height) {
      targetHeight = height;
      targetWidth = Math.round(height * 1000 / 370);
    }
    
    const x = Math.round((width - targetWidth) / 2);
    const y = Math.round((height - targetHeight) / 2);
    
    await image.crop({ x, y, w: targetWidth, h: targetHeight });
    await image.write(filePath);
    console.log(`Cropped image to banner aspect ratio (1000:370): ${targetWidth}x${targetHeight}`);
  } catch (err) {
    console.error('Failed to crop image to banner aspect ratio:', err);
  }
}

async function handleBannerUpload(file) {
  if (!file) return;
  const videoExtensions = ['.mp4', '.mov', '.avi', '.webm', '.mkv', '.m4v'];
  const ext = path.extname(file.originalname || '').toLowerCase();
  if (videoExtensions.includes(ext)) {
    // Skip Jimp processing for video files
    return;
  }
  try {
    // 1. Crop to banner aspect ratio (1000:370)
    await cropToBannerRatio(file.path);
    
    // 2. Copy to uploads folder
    const destDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    const destPath = path.join(destDir, file.filename);
    fs.copyFileSync(file.path, destPath);
    console.log(`Synced cropped banner image to ${destPath}`);

    // Save to Database for persistence
    const { saveFileToDb } = require('../filePersistence');
    // Save both the subpath and the root path copy
    await saveFileToDb('banners/' + file.filename, file.path, file.mimetype || 'image/png');
    await saveFileToDb(file.filename, destPath, file.mimetype || 'image/png');
  } catch (err) {
    console.error('Failed to handle banner upload:', err);
  }
}

// ==========================================
// 1. BANNERS API
// ==========================================

// GET all banners (with search)
router.get('/banners', async (req, res) => {
  try {
    const { title } = req.query;
    let query = 'SELECT * FROM banners';
    const params = [];
    if (title) {
      query += ' WHERE title LIKE ?';
      params.push(`%${title}%`);
    }
    query += ' ORDER BY id DESC';
    const [rows] = await db.query(query, params);
    res.json({
      success: true,
      data: rows.map(r => ({ ...r, status: r.status === 1 }))
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch banners', error: error.message });
  }
});

// POST add banner (multipart + JSON both supported)
router.post('/banners', uploadBanner.single('image'), async (req, res) => {
  const { title, status, category, badge, subtitle, buttonText } = req.body;
  if (!title) {
    return res.status(400).json({ success: false, message: 'Title is required' });
  }
  const statusInt = status === true || status === 1 || status === 'true' ? 1 : 0;

  let imageValue = req.body.image || '';
  if (req.file) {
    imageValue = req.file.filename;
    await handleBannerUpload(req.file);
  }

  if (!imageValue) {
    return res.status(400).json({ success: false, message: 'Image is required' });
  }

  try {
    const [result] = await db.query(
      'INSERT INTO banners (title, image, status, category, badge, subtitle, buttonText) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [title.trim(), imageValue, statusInt, category || '', badge || '', subtitle || '', buttonText || 'Book Now']
    );
    res.status(201).json({
      success: true,
      data: { id: result.insertId, title, image: imageValue, status: statusInt === 1, category: category || '', badge: badge || '', subtitle: subtitle || '', buttonText: buttonText || 'Book Now' }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create banner', error: error.message });
  }
});

// PUT update banner (multipart + JSON both supported)
router.put('/banners/:id', uploadBanner.single('image'), async (req, res) => {
  const { id } = req.params;
  const { title, status, category, badge, subtitle, buttonText } = req.body;
  try {
    const fields = [];
    const values = [];

    if (title !== undefined && title !== '') { fields.push('`title` = ?'); values.push(title.trim()); }
    if (status !== undefined) { fields.push('`status` = ?'); values.push(status === true || status === 1 || status === 'true' ? 1 : 0); }
    if (category !== undefined) { fields.push('`category` = ?'); values.push(category); }
    if (badge !== undefined) { fields.push('`badge` = ?'); values.push(badge); }
    if (subtitle !== undefined) { fields.push('`subtitle` = ?'); values.push(subtitle); }
    if (buttonText !== undefined) { fields.push('`buttonText` = ?'); values.push(buttonText); }

    if (req.file) {
      fields.push('`image` = ?');
      values.push(req.file.filename);
      await handleBannerUpload(req.file);
    } else if (req.body.image !== undefined && req.body.image !== '') {
      fields.push('`image` = ?');
      values.push(req.body.image);
    }

    if (fields.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update. Please provide at least one field.' });
    }

    values.push(id);
    const [result] = await db.query(`UPDATE banners SET ${fields.join(', ')} WHERE id = ?`, values);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Banner not found' });

    const [rows] = await db.query('SELECT * FROM banners WHERE id = ?', [id]);
    res.json({ success: true, data: { ...rows[0], status: rows[0].status === 1 } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update banner', error: error.message });
  }
});

// PATCH partial update / status toggle banner
router.patch('/banners/:id', async (req, res) => {
  const { id } = req.params;
  const { title, status, category, badge, subtitle, buttonText } = req.body;
  try {
    const fields = [];
    const values = [];

    if (title !== undefined && title !== '') { fields.push('`title` = ?'); values.push(title.trim()); }
    if (status !== undefined) { fields.push('`status` = ?'); values.push(status === true || status === 1 || status === 'true' ? 1 : 0); }
    if (category !== undefined) { fields.push('`category` = ?'); values.push(category); }
    if (badge !== undefined) { fields.push('`badge` = ?'); values.push(badge); }
    if (subtitle !== undefined) { fields.push('`subtitle` = ?'); values.push(subtitle); }
    if (buttonText !== undefined) { fields.push('`buttonText` = ?'); values.push(buttonText); }

    if (fields.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    values.push(id);
    const [result] = await db.query(`UPDATE banners SET ${fields.join(', ')} WHERE id = ?`, values);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Banner not found' });

    const [rows] = await db.query('SELECT * FROM banners WHERE id = ?', [id]);
    res.json({ success: true, data: { ...rows[0], status: rows[0].status === 1 } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update banner', error: error.message });
  }
});

// DELETE banner
router.delete('/banners/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('DELETE FROM banners WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Banner not found' });
    res.json({ success: true, message: 'Banner deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete banner', error: error.message });
  }
});


// ==========================================
// 2. STATES API
// ==========================================

// GET all states (with search)
router.get('/states', async (req, res) => {
  try {
    const { name } = req.query;
    let query = 'SELECT * FROM states';
    const params = [];
    if (name) {
      query += ' WHERE name LIKE ?';
      params.push(`%${name}%`);
    }
    query += ' ORDER BY name ASC';
    const [rows] = await db.query(query, params);
    res.json({
      success: true,
      data: rows.map(r => ({ ...r, status: r.status === 1 }))
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch states', error: error.message });
  }
});

// POST add state
router.post('/states', async (req, res) => {
  const { name, status } = req.body;
  if (!name) return res.status(400).json({ success: false, message: 'State name is required' });
  const statusInt = status === true || status === 1 || status === 'true' ? 1 : 0;
  try {
    const [result] = await db.query('INSERT INTO states (name, status) VALUES (?, ?)', [name, statusInt]);
    res.status(201).json({
      success: true,
      data: { id: result.insertId, name, status: statusInt === 1 }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create state', error: error.message });
  }
});

// PUT update state
router.put('/states/:id', async (req, res) => {
  const { id } = req.params;
  const { name, status } = req.body;
  try {
    const fields = [];
    const values = [];
    if (name !== undefined) { fields.push('`name` = ?'); values.push(name); }
    if (status !== undefined) { fields.push('`status` = ?'); values.push(status === true || status === 1 || status === 'true' ? 1 : 0); }
    
    if (fields.length === 0) return res.status(400).json({ success: false, message: 'No fields to update' });
    values.push(id);
    
    const [result] = await db.query(`UPDATE states SET ${fields.join(', ')} WHERE id = ?`, values);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'State not found' });
    
    const [rows] = await db.query('SELECT * FROM states WHERE id = ?', [id]);
    res.json({ success: true, data: { ...rows[0], status: rows[0].status === 1 } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update state', error: error.message });
  }
});

// DELETE state
router.delete('/states/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Fetch state name to perform programmatic cascade delete of cities and localities
    const [rows] = await db.query('SELECT name FROM states WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'State not found' });
    const stateName = rows[0].name;

    // Delete all localities in this state
    await db.query('DELETE FROM localities WHERE stateName = ?', [stateName]);

    // Delete all cities in this state
    await db.query('DELETE FROM cities WHERE stateName = ?', [stateName]);

    // Delete state record
    await db.query('DELETE FROM states WHERE id = ?', [id]);

    res.json({ success: true, message: 'State and its cities and localities deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete state', error: error.message });
  }
});


// ==========================================
// 3. CITIES API
// ==========================================

// GET all cities (with search)
router.get('/cities', async (req, res) => {
  try {
    const { cityName, stateName } = req.query;
    let query = 'SELECT * FROM cities WHERE 1=1';
    const params = [];
    if (cityName) {
      query += ' AND cityName LIKE ?';
      params.push(`%${cityName}%`);
    }
    if (stateName) {
      query += ' AND stateName LIKE ?';
      params.push(`%${stateName}%`);
    }
    query += ' ORDER BY cityName ASC';
    const [rows] = await db.query(query, params);
    res.json({
      success: true,
      data: rows.map(r => ({ ...r, status: r.status === 1 }))
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch cities', error: error.message });
  }
});

// POST add city
router.post('/cities', async (req, res) => {
  const { cityName, stateName, status } = req.body;
  if (!cityName || !stateName) return res.status(400).json({ success: false, message: 'City name and State name are required' });
  const statusInt = status === true || status === 1 || status === 'true' ? 1 : 0;
  try {
    const [result] = await db.query(
      'INSERT INTO cities (cityName, stateName, status) VALUES (?, ?, ?)',
      [cityName, stateName, statusInt]
    );
    res.status(201).json({
      success: true,
      data: { id: result.insertId, cityName, stateName, status: statusInt === 1 }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create city', error: error.message });
  }
});

// PUT update city
router.put('/cities/:id', async (req, res) => {
  const { id } = req.params;
  const { cityName, stateName, status } = req.body;
  try {
    const fields = [];
    const values = [];
    if (cityName !== undefined) { fields.push('`cityName` = ?'); values.push(cityName); }
    if (stateName !== undefined) { fields.push('`stateName` = ?'); values.push(stateName); }
    if (status !== undefined) { fields.push('`status` = ?'); values.push(status === true || status === 1 || status === 'true' ? 1 : 0); }
    
    if (fields.length === 0) return res.status(400).json({ success: false, message: 'No fields to update' });
    values.push(id);
    
    const [result] = await db.query(`UPDATE cities SET ${fields.join(', ')} WHERE id = ?`, values);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'City not found' });
    
    const [rows] = await db.query('SELECT * FROM cities WHERE id = ?', [id]);
    res.json({ success: true, data: { ...rows[0], status: rows[0].status === 1 } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update city', error: error.message });
  }
});

// DELETE city
router.delete('/cities/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Fetch city name to perform programmatic cascade delete of localities
    const [rows] = await db.query('SELECT cityName FROM cities WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'City not found' });
    const cityName = rows[0].cityName;

    // Delete all localities in this city
    await db.query('DELETE FROM localities WHERE cityName = ?', [cityName]);

    // Delete city record
    await db.query('DELETE FROM cities WHERE id = ?', [id]);

    res.json({ success: true, message: 'City and its localities deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete city', error: error.message });
  }
});


// ==========================================
// 4. LOCALITIES API
// ==========================================

// GET all localities (with search)
router.get('/localities', async (req, res) => {
  try {
    const { localityName, cityName, stateName } = req.query;
    let query = 'SELECT * FROM localities WHERE 1=1';
    const params = [];
    if (localityName) {
      query += ' AND localityName LIKE ?';
      params.push(`%${localityName}%`);
    }
    if (cityName) {
      query += ' AND cityName LIKE ?';
      params.push(`%${cityName}%`);
    }
    if (stateName) {
      query += ' AND stateName LIKE ?';
      params.push(`%${stateName}%`);
    }
    query += ' ORDER BY localityName ASC';
    const [rows] = await db.query(query, params);
    res.json({
      success: true,
      data: rows.map(r => ({ ...r, status: r.status === 1 }))
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch localities', error: error.message });
  }
});

// POST add locality
router.post('/localities', async (req, res) => {
  const { localityName, cityName, stateName, status } = req.body;
  if (!localityName || !cityName || !stateName) {
    return res.status(400).json({ success: false, message: 'Locality name, City name, and State name are required' });
  }
  const statusInt = status === true || status === 1 || status === 'true' ? 1 : 0;
  try {
    const [result] = await db.query(
      'INSERT INTO localities (localityName, cityName, stateName, status) VALUES (?, ?, ?, ?)',
      [localityName, cityName, stateName, statusInt]
    );
    res.status(201).json({
      success: true,
      data: { id: result.insertId, localityName, cityName, stateName, status: statusInt === 1 }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create locality', error: error.message });
  }
});

// PUT update locality
router.put('/localities/:id', async (req, res) => {
  const { id } = req.params;
  const { localityName, cityName, stateName, status } = req.body;
  try {
    const fields = [];
    const values = [];
    if (localityName !== undefined) { fields.push('`localityName` = ?'); values.push(localityName); }
    if (cityName !== undefined) { fields.push('`cityName` = ?'); values.push(cityName); }
    if (stateName !== undefined) { fields.push('`stateName` = ?'); values.push(stateName); }
    if (status !== undefined) { fields.push('`status` = ?'); values.push(status === true || status === 1 || status === 'true' ? 1 : 0); }
    
    if (fields.length === 0) return res.status(400).json({ success: false, message: 'No fields to update' });
    values.push(id);
    
    const [result] = await db.query(`UPDATE localities SET ${fields.join(', ')} WHERE id = ?`, values);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Locality not found' });
    
    const [rows] = await db.query('SELECT * FROM localities WHERE id = ?', [id]);
    res.json({ success: true, data: { ...rows[0], status: rows[0].status === 1 } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update locality', error: error.message });
  }
});

// DELETE locality
router.delete('/localities/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('DELETE FROM localities WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Locality not found' });
    res.json({ success: true, message: 'Locality deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete locality', error: error.message });
  }
});


// ==========================================
// 5. REVIEWS API
// ==========================================

// GET all reviews
router.get('/reviews', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM reviews ORDER BY id DESC');
    res.json({
      success: true,
      data: rows.map(r => ({
        ...r,
        rating: parseFloat(r.rating),
        status: r.status === 1
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch reviews', error: error.message });
  }
});

// POST add review
router.post('/reviews', async (req, res) => {
  const { userName, partnerName, serviceName, rating, reviewText, status } = req.body;
  if (!userName || !partnerName || !serviceName || rating === undefined) {
    return res.status(400).json({ success: false, message: 'User, Partner, Service, and Rating are required' });
  }
  const statusInt = status === true || status === 1 || status === 'true' ? 1 : 0;
  const ratVal = parseFloat(rating);
  const textVal = reviewText || '';

  try {
    const [result] = await db.query(
      'INSERT INTO reviews (userName, partnerName, serviceName, rating, reviewText, status) VALUES (?, ?, ?, ?, ?, ?)',
      [userName, partnerName, serviceName, ratVal, textVal, statusInt]
    );
    res.status(201).json({
      success: true,
      data: { id: result.insertId, userName, partnerName, serviceName, rating: ratVal, reviewText: textVal, status: statusInt === 1 }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create review', error: error.message });
  }
});

// PUT update review
router.put('/reviews/:id', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (status === undefined) return res.status(400).json({ success: false, message: 'Status is required' });
  
  const statusInt = status === true || status === 1 || status === 'true' ? 1 : 0;
  try {
    const [result] = await db.query('UPDATE reviews SET status = ? WHERE id = ?', [statusInt, id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Review not found' });
    
    const [rows] = await db.query('SELECT * FROM reviews WHERE id = ?', [id]);
    res.json({ success: true, data: { ...rows[0], rating: parseFloat(rows[0].rating), status: rows[0].status === 1 } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update review', error: error.message });
  }
});

// DELETE review
router.delete('/reviews/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('DELETE FROM reviews WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Review not found' });
    res.json({ success: true, message: 'Review deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete review', error: error.message });
  }
});


// ==========================================
// 6. NOTIFICATIONS API
// ==========================================

// GET all notifications (with search)
router.get('/notifications', async (req, res) => {
  try {
    const { title, audience, status } = req.query;
    let query = 'SELECT * FROM notifications WHERE 1=1';
    const params = [];
    if (title) {
      query += ' AND title LIKE ?';
      params.push(`%${title}%`);
    }
    if (audience) {
      query += ' AND audience LIKE ?';
      params.push(`%${audience}%`);
    }
    if (status !== undefined) {
      const statusInt = status === 'true' || status === '1' ? 1 : 0;
      query += ' AND status = ?';
      params.push(statusInt);
    }
    query += ' ORDER BY id DESC';
    const [rows] = await db.query(query, params);
    res.json({
      success: true,
      data: rows.map(r => ({
        ...r,
        status: r.status === 1,
        isSent: r.isSent === 1
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch notifications', error: error.message });
  }
});

// POST add notification
router.post('/notifications', async (req, res) => {
  const { title, message, audience, status } = req.body;
  if (!title || !message || !audience) {
    return res.status(400).json({ success: false, message: 'Title, Message, and Audience are required' });
  }
  const statusInt = status === true || status === 1 || status === 'true' ? 1 : 0;
  const createdAtStr = new Date().toLocaleString('en-IN');
  try {
    const [result] = await db.query(
      'INSERT INTO notifications (title, message, audience, createdAt, status, isSent, sentAt) VALUES (?, ?, ?, ?, ?, 0, "")',
      [title, message, audience, createdAtStr, statusInt]
    );
    res.status(201).json({
      success: true,
      data: { id: result.insertId, title, message, audience, createdAt: createdAtStr, status: statusInt === 1, isSent: false, sentAt: '' }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create notification', error: error.message });
  }
});

// PUT update notification (e.g. toggle status, or send notification)
router.put('/notifications/:id', async (req, res) => {
  const { id } = req.params;
  const { status, isSent } = req.body;
  try {
    const fields = [];
    const values = [];
    if (status !== undefined) {
      fields.push('`status` = ?');
      values.push(status === true || status === 1 || status === 'true' ? 1 : 0);
    }
    if (isSent !== undefined) {
      fields.push('`isSent` = ?');
      values.push(isSent === true || isSent === 1 || isSent === 'true' ? 1 : 0);
      if (isSent === true || isSent === 1 || isSent === 'true') {
        fields.push('`sentAt` = ?');
        values.push(new Date().toLocaleString('en-IN'));
      }
    }
    
    if (fields.length === 0) return res.status(400).json({ success: false, message: 'No fields to update' });
    values.push(id);
    
    const [result] = await db.query(`UPDATE notifications SET ${fields.join(', ')} WHERE id = ?`, values);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Notification not found' });
    
    const [rows] = await db.query('SELECT * FROM notifications WHERE id = ?', [id]);
    res.json({
      success: true,
      data: {
        ...rows[0],
        status: rows[0].status === 1,
        isSent: rows[0].isSent === 1
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update notification', error: error.message });
  }
});

// DELETE notification
router.delete('/notifications/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('DELETE FROM notifications WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Notification not found' });
    res.json({ success: true, message: 'Notification deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete notification', error: error.message });
  }
});


// ==========================================
// 7. COMMISSION SETTINGS API
// ==========================================

// GET commission settings
router.get('/commission', async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM settings_config WHERE `key` = 'commission_rate'");
    const rate = rows.length > 0 ? parseFloat(rows[0].value) : 25.0;
    res.json({
      success: true,
      commissionRate: rate
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch commission setting', error: error.message });
  }
});

// PUT update commission settings
router.put('/commission', async (req, res) => {
  const { commissionRate } = req.body;
  if (commissionRate === undefined) {
    return res.status(400).json({ success: false, message: 'commissionRate is required' });
  }
  const rateVal = parseFloat(commissionRate);
  try {
    await db.query(
      "INSERT INTO settings_config (`key`, `value`) VALUES ('commission_rate', ?) ON DUPLICATE KEY UPDATE `value` = ?",
      [String(rateVal), String(rateVal)]
    );
    res.json({
      success: true,
      message: 'Commission rate updated successfully',
      commissionRate: rateVal
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update commission setting', error: error.message });
  }
});

// ==========================================
// 8. COUNTRIES LIST API
// ==========================================

// GET all countries (with optional name/code search)
router.get('/countries', (req, res) => {
  try {
    const countries = require('../defaults/countries.json');
    const { name, code } = req.query;
    
    let filtered = countries;
    
    if (name) {
      const q = name.toLowerCase();
      filtered = filtered.filter(c => c.name.toLowerCase().includes(q));
    }
    
    if (code) {
      const q = code.toUpperCase();
      filtered = filtered.filter(c => c.code === q);
    }
    
    res.json({
      success: true,
      data: filtered
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch countries', error: error.message });
  }
});


// GET country codes of all registered users and partners
router.get('/country-codes', async (req, res) => {
  try {
    const dbName = process.env.DB_NAME || 'homef4fw_homefaci';
    const list = [];

    // 1. Fetch from node_users_v2 (Flutter application users)
    const [nodeV2Rows] = await db.query("SELECT name, phone as mobile, countryCode FROM node_users_v2");
    nodeV2Rows.forEach(r => {
      const code = r.countryCode ? (r.countryCode.startsWith('+') ? r.countryCode : `+${r.countryCode}`) : '+91';
      list.push({
        name: r.name || 'Guest User',
        mobile: r.mobile || '',
        role: 'user',
        countryCode: code,
        source: 'User App (MySQL v2)'
      });
    });

    // 2. Fetch from node_users (Admin users)
    const [nodeRows] = await db.query("SELECT name, mobile FROM users");
    nodeRows.forEach(r => {
      list.push({
        name: r.name || '',
        mobile: r.mobile || '',
        role: 'user',
        countryCode: '+91',
        source: 'Admin User (MySQL)'
      });
    });

    // 3. Fetch from original Laravel users
    const [laravelRows] = await db.query(`SELECT name, mobile_number as mobile, role_id FROM \`${dbName}\`.\`users\` WHERE deleted_at IS NULL`);
    laravelRows.forEach(r => {
      list.push({
        name: r.name || '',
        mobile: r.mobile || '',
        role: r.role_id === 2 ? 'partner' : 'user',
        countryCode: '+91',
        source: r.role_id === 2 ? 'App Partner (Laravel)' : 'App User (Laravel)'
      });
    });

    // 4. Fetch from node_partners (Admin Partner)
    const [nodePartnerRows] = await db.query("SELECT name, mobile, countryCode FROM partners");
    nodePartnerRows.forEach(r => {
      const code = r.countryCode ? (r.countryCode.startsWith('+') ? r.countryCode : `+${r.countryCode}`) : '+91';
      list.push({
        name: r.name || '',
        mobile: r.mobile || '',
        role: 'partner',
        countryCode: code,
        source: 'Admin Partner (MySQL)'
      });
    });

    res.json({
      success: true,
      data: list
    });
  } catch (error) {
    console.error('Error fetching country codes:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch country codes', error: error.message });
  }
});


// ==========================================
// STATUS TOGGLE APIS
// ==========================================

// BANNERS - PUT/PATCH toggle status
router.put('/banners/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (status === undefined) return res.status(400).json({ success: false, message: 'Status is required' });
  const statusInt = (status === true || status === 1 || status === 'true') ? 1 : 0;
  try {
    const [result] = await db.query('UPDATE banners SET status = ? WHERE id = ?', [statusInt, id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Banner not found' });
    const [rows] = await db.query('SELECT * FROM banners WHERE id = ?', [id]);
    res.json({ success: true, message: `Banner status updated to ${statusInt === 1 ? 'active' : 'inactive'}`, data: { ...rows[0], status: rows[0].status === 1 } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update banner status', error: error.message });
  }
});
router.patch('/banners/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (status === undefined) return res.status(400).json({ success: false, message: 'Status is required' });
  const statusInt = (status === true || status === 1 || status === 'true') ? 1 : 0;
  try {
    const [result] = await db.query('UPDATE banners SET status = ? WHERE id = ?', [statusInt, id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Banner not found' });
    const [rows] = await db.query('SELECT * FROM banners WHERE id = ?', [id]);
    res.json({ success: true, message: `Banner status updated to ${statusInt === 1 ? 'active' : 'inactive'}`, data: { ...rows[0], status: rows[0].status === 1 } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update banner status', error: error.message });
  }
});

// STATES - PUT/PATCH toggle status
router.put('/states/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (status === undefined) return res.status(400).json({ success: false, message: 'Status is required' });
  const statusInt = (status === true || status === 1 || status === 'true') ? 1 : 0;
  try {
    const [result] = await db.query('UPDATE states SET status = ? WHERE id = ?', [statusInt, id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'State not found' });
    const [rows] = await db.query('SELECT * FROM states WHERE id = ?', [id]);
    res.json({ success: true, message: `State status updated to ${statusInt === 1 ? 'active' : 'inactive'}`, data: { ...rows[0], status: rows[0].status === 1 } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update state status', error: error.message });
  }
});
router.patch('/states/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (status === undefined) return res.status(400).json({ success: false, message: 'Status is required' });
  const statusInt = (status === true || status === 1 || status === 'true') ? 1 : 0;
  try {
    const [result] = await db.query('UPDATE states SET status = ? WHERE id = ?', [statusInt, id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'State not found' });
    const [rows] = await db.query('SELECT * FROM states WHERE id = ?', [id]);
    res.json({ success: true, message: `State status updated to ${statusInt === 1 ? 'active' : 'inactive'}`, data: { ...rows[0], status: rows[0].status === 1 } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update state status', error: error.message });
  }
});

// CITIES - PUT/PATCH toggle status
router.put('/cities/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (status === undefined) return res.status(400).json({ success: false, message: 'Status is required' });
  const statusInt = (status === true || status === 1 || status === 'true') ? 1 : 0;
  try {
    const [result] = await db.query('UPDATE cities SET status = ? WHERE id = ?', [statusInt, id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'City not found' });
    const [rows] = await db.query('SELECT * FROM cities WHERE id = ?', [id]);
    res.json({ success: true, message: `City status updated to ${statusInt === 1 ? 'active' : 'inactive'}`, data: { ...rows[0], status: rows[0].status === 1 } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update city status', error: error.message });
  }
});
router.patch('/cities/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (status === undefined) return res.status(400).json({ success: false, message: 'Status is required' });
  const statusInt = (status === true || status === 1 || status === 'true') ? 1 : 0;
  try {
    const [result] = await db.query('UPDATE cities SET status = ? WHERE id = ?', [statusInt, id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'City not found' });
    const [rows] = await db.query('SELECT * FROM cities WHERE id = ?', [id]);
    res.json({ success: true, message: `City status updated to ${statusInt === 1 ? 'active' : 'inactive'}`, data: { ...rows[0], status: rows[0].status === 1 } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update city status', error: error.message });
  }
});

// LOCALITIES - PUT/PATCH toggle status
router.put('/localities/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (status === undefined) return res.status(400).json({ success: false, message: 'Status is required' });
  const statusInt = (status === true || status === 1 || status === 'true') ? 1 : 0;
  try {
    const [result] = await db.query('UPDATE localities SET status = ? WHERE id = ?', [statusInt, id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Locality not found' });
    const [rows] = await db.query('SELECT * FROM localities WHERE id = ?', [id]);
    res.json({ success: true, message: `Locality status updated to ${statusInt === 1 ? 'active' : 'inactive'}`, data: { ...rows[0], status: rows[0].status === 1 } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update locality status', error: error.message });
  }
});
router.patch('/localities/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (status === undefined) return res.status(400).json({ success: false, message: 'Status is required' });
  const statusInt = (status === true || status === 1 || status === 'true') ? 1 : 0;
  try {
    const [result] = await db.query('UPDATE localities SET status = ? WHERE id = ?', [statusInt, id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Locality not found' });
    const [rows] = await db.query('SELECT * FROM localities WHERE id = ?', [id]);
    res.json({ success: true, message: `Locality status updated to ${statusInt === 1 ? 'active' : 'inactive'}`, data: { ...rows[0], status: rows[0].status === 1 } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update locality status', error: error.message });
  }
});

// REVIEWS - PUT/PATCH toggle status
router.put('/reviews/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (status === undefined) return res.status(400).json({ success: false, message: 'Status is required' });
  const statusInt = (status === true || status === 1 || status === 'true') ? 1 : 0;
  try {
    const [result] = await db.query('UPDATE reviews SET status = ? WHERE id = ?', [statusInt, id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Review not found' });
    const [rows] = await db.query('SELECT * FROM reviews WHERE id = ?', [id]);
    res.json({ success: true, message: `Review status updated to ${statusInt === 1 ? 'active' : 'inactive'}`, data: { ...rows[0], rating: parseFloat(rows[0].rating), status: rows[0].status === 1 } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update review status', error: error.message });
  }
});
router.patch('/reviews/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (status === undefined) return res.status(400).json({ success: false, message: 'Status is required' });
  const statusInt = (status === true || status === 1 || status === 'true') ? 1 : 0;
  try {
    const [result] = await db.query('UPDATE reviews SET status = ? WHERE id = ?', [statusInt, id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Review not found' });
    const [rows] = await db.query('SELECT * FROM reviews WHERE id = ?', [id]);
    res.json({ success: true, message: `Review status updated to ${statusInt === 1 ? 'active' : 'inactive'}`, data: { ...rows[0], rating: parseFloat(rows[0].rating), status: rows[0].status === 1 } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update review status', error: error.message });
  }
});


module.exports = router;
