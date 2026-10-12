const express = require('express');
const router = express.Router();
const db = require('../db');

// IN-MEMORY CACHE STORAGE FOR SERVICES
let servicesCache = null;
let servicesCacheTimestamp = null;
const SERVICES_CACHE_TTL = 10 * 1000; // Cache lives for 

function clearServicesCache() {
  servicesCache = null;
  servicesCacheTimestamp = null;
}

let servicesColumns = null;
async function getServicesColumns() {
  if (servicesColumns) return servicesColumns;
  try {
    const [cols] = await db.query("SHOW COLUMNS FROM services");
    servicesColumns = new Set(cols.map(c => c.Field));
    if (!servicesColumns.has('sub_category_id')) {
      try {
        await db.query("ALTER TABLE services ADD COLUMN `sub_category_id` INT NULL DEFAULT NULL");
        servicesColumns.add('sub_category_id');
      } catch (e) {
        // Ignored if permissions restrict ALTER TABLE
      }
    }
    if (!servicesColumns.has('sub_category')) {
      try {
        await db.query("ALTER TABLE services ADD COLUMN `sub_category` VARCHAR(255) NULL DEFAULT NULL");
        servicesColumns.add('sub_category');
      } catch (e) {
        // Ignored if permissions restrict ALTER TABLE
      }
    }
  } catch (err) {
    console.error('Error fetching services columns:', err.message);
  }
  return servicesColumns || new Set();
}

function formatImageUrl(img, req) {
  if (!img) return '';
  const host = req ? req.get('host') : 'adminbackend-1-h03r.onrender.com';
  const protocol = req && (req.protocol === 'https' || req.headers['x-forwarded-proto'] === 'https') ? 'https' : 'http';
  
  if (img.startsWith('http://') || img.startsWith('https://')) {
    if (img.includes('localhost:') || img.includes('127.0.0.1')) {
      const filename = img.split('/uploads/').pop();
      return `${protocol}://${host}/uploads/${filename}`;
    }
    return img;
  }
  const cleanFilename = img.replace(/^uploads\//, '').replace(/^services\//, '');
  return `${protocol}://${host}/uploads/${cleanFilename}`;
}

function mapServiceRow(r, req) {
  if (!r) return null;
  const dbPrice = parseFloat(r.price);
  const discountVal = r.discount !== null && r.discount !== undefined ? parseFloat(r.discount) : 0.00;
  
  const item = {
    ...r,
    id: r.id,
    title: r.title || r.name || '',
    name: r.name || r.title || '',
    image: formatImageUrl(r.image, req),
    price: dbPrice,
    cutPrice: dbPrice,
    discount: discountVal,
    status: r.status === 1 || r.status === true || r.status === '1',
    isHighlighted: r.isHighlighted !== null && r.isHighlighted !== undefined ? String(r.isHighlighted) : "",
    rating: r.rating !== null && r.rating !== undefined ? parseFloat(r.rating) : null,
    time: r.time !== null && r.time !== undefined ? r.time : null
  };
  
  if (r.category_id !== undefined && r.category_id !== null && r.category_id !== '') {
    let catId = r.category_id;
    if (typeof catId === 'string') {
      if (catId.startsWith('c')) {
        const parsed = parseInt(catId.slice(1), 10);
        if (!isNaN(parsed)) {
          catId = parsed;
        }
      } else {
        const parsed = parseInt(catId, 10);
        if (!isNaN(parsed)) {
          catId = parsed;
        }
      }
    }
    item.categoryId = catId;
    item.category_id = catId;
  } else {
    item.categoryId = null;
    item.category_id = null;
  }

  if (r.sub_category_id !== undefined && r.sub_category_id !== null && r.sub_category_id !== '') {
    let subCatId = r.sub_category_id;
    if (typeof subCatId === 'string') {
      const parsed = parseInt(subCatId, 10);
      if (!isNaN(parsed)) subCatId = parsed;
    }
    item.subCategoryId = subCatId;
    item.sub_category_id = subCatId;
  } else {
    item.subCategoryId = null;
    item.sub_category_id = null;
  }
  item.subCategory = r.sub_category || r.subCategory || '';
  item.sub_category = item.subCategory;

  return item;
}

router.get(['/', '/services'], async (req, res) => {
  try {
    const { search, category_id, categoryId, sub_category_id, subCategoryId, sub_category, subCategory } = req.query;
    const catIdFilter = category_id !== undefined ? category_id : categoryId;
    const subCatIdFilter = sub_category_id !== undefined ? sub_category_id : subCategoryId;
    const subCatNameFilter = sub_category || subCategory;

    const hasFilters = (search && search.trim() !== '') || catIdFilter !== undefined || subCatIdFilter !== undefined || subCatNameFilter;

    let allServices = servicesCache;

    if (!allServices || (Date.now() - servicesCacheTimestamp >= SERVICES_CACHE_TTL)) {
      const [rows] = await db.query('SELECT * FROM services ORDER BY id DESC');
      allServices = rows.map(r => mapServiceRow(r, req));
      servicesCache = allServices;
      servicesCacheTimestamp = Date.now();
    }

    if (!hasFilters) {
      return res.json({
        success: true,
        source: 'cache',
        total: allServices.length,
        data: allServices,
        services: allServices,
        result: allServices
      });
    }

    let filtered = allServices;

    if (search && search.trim() !== '') {
      const q = search.toLowerCase();
      filtered = filtered.filter(s => 
        (s.title && s.title.toLowerCase().includes(q)) ||
        (s.description && s.description.toLowerCase().includes(q))
      );
    }

    if (catIdFilter !== undefined && catIdFilter !== null && catIdFilter !== '') {
      const targetCatId = parseInt(catIdFilter, 10);
      filtered = filtered.filter(s => s.category_id === targetCatId || s.categoryId === targetCatId);
    }

    if (subCatIdFilter !== undefined && subCatIdFilter !== null && subCatIdFilter !== '') {
      const targetSubCatId = parseInt(subCatIdFilter, 10);
      filtered = filtered.filter(s => s.sub_category_id === targetSubCatId || s.subCategoryId === targetSubCatId);
    }

    if (subCatNameFilter) {
      const targetSubName = String(subCatNameFilter).toLowerCase();
      filtered = filtered.filter(s => s.sub_category && s.sub_category.toLowerCase().includes(targetSubName));
    }

    res.json({
      success: true,
      source: 'filtered',
      total: filtered.length,
      data: filtered,
      services: filtered,
      result: filtered
    });
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch services', error: error.message });
  }
});

// POST create service
router.post('/', async (req, res) => {
  const { title, price, image, description, status, rating, time, isHighlighted, discount, highlights } = req.body;
  const categoryIdVal = req.body.category_id !== undefined ? req.body.category_id : req.body.categoryId;
  const subCategoryIdVal = req.body.sub_category_id !== undefined ? req.body.sub_category_id : req.body.subCategoryId;
  const subCategoryVal = req.body.sub_category !== undefined ? req.body.sub_category : (req.body.subCategory || req.body.subCategoryName);

  if (!title || price === undefined || !description) {
    return res.status(400).json({ success: false, message: 'Title, Price, and Description are required' });
  }

  const inputPrice = parseFloat(price) || 0.00;
  const inputCutPrice = req.body.cutPrice !== undefined && req.body.cutPrice !== null && req.body.cutPrice !== '' ? parseFloat(req.body.cutPrice) : 0.00;
  const inputDiscountPercent = discount !== undefined && discount !== null && discount !== '' ? parseFloat(discount) : 0.00;

  let priceFloat = inputPrice;
  let discountVal = 0.00;

  if (inputCutPrice > inputPrice) {
    priceFloat = inputCutPrice;
    discountVal = inputCutPrice - inputPrice;
  } else if (inputDiscountPercent > 0) {
    priceFloat = inputPrice;
    discountVal = inputPrice * (inputDiscountPercent / 100);
  } else {
    priceFloat = inputPrice;
    discountVal = 0.00;
  }
  const statusInt = status === true || status === 1 || status === 'true' ? 1 : 0;
  const highlightedStr = isHighlighted !== undefined && isHighlighted !== null ? String(isHighlighted) : "";
  const imageVal = image || '';
  const ratingVal = rating !== undefined && rating !== null && rating !== '' ? parseFloat(rating) : null;
  const timeVal = time !== undefined && time !== null && time !== '' ? time : null;

  let dbCategoryId = null;
  if (categoryIdVal !== undefined && categoryIdVal !== null && categoryIdVal !== '') {
    const strVal = String(categoryIdVal);
    dbCategoryId = strVal.startsWith('c') ? parseInt(strVal.slice(1)) : parseInt(strVal);
    if (isNaN(dbCategoryId)) dbCategoryId = null;
  }

  let dbSubCategoryId = null;
  if (subCategoryIdVal !== undefined && subCategoryIdVal !== null && subCategoryIdVal !== '' && subCategoryIdVal !== 'null') {
    dbSubCategoryId = parseInt(subCategoryIdVal, 10);
    if (isNaN(dbSubCategoryId)) dbSubCategoryId = null;
  }

  // If categoryId wasn't passed but subCategoryId was passed, attempt to resolve parent category
  if (dbCategoryId === null && dbSubCategoryId !== null) {
    try {
      const [subRows] = await db.query('SELECT parent FROM categories WHERE id = ?', [dbSubCategoryId]);
      if (subRows.length > 0 && subRows[0].parent) {
        const parentName = subRows[0].parent;
        const [parentRows] = await db.query('SELECT id FROM categories WHERE title = ? LIMIT 1', [parentName]);
        if (parentRows.length > 0) {
          dbCategoryId = parentRows[0].id;
        }
      }
    } catch (e) {
      console.warn('Could not auto-resolve parent category for subcategory:', e.message);
    }
  }

  const slug = title.trim().toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

  let highlightsStr = '[]';
  if (highlights !== undefined && highlights !== null) {
    highlightsStr = typeof highlights === 'string' ? highlights : JSON.stringify(highlights);
  }

  try {
    const cols = await getServicesColumns();

    let query = 'INSERT INTO services (title, slug, price, image, description, status, isHighlighted, discount, highlights';
    const params = [title, slug, priceFloat, imageVal, description, statusInt, highlightedStr, discountVal, highlightsStr];
    let placeholders = '?, ?, ?, ?, ?, ?, ?, ?, ?';

    if (dbCategoryId !== null) {
      query += ', category_id';
      placeholders += ', ?';
      params.push(dbCategoryId);
    }

    if (cols.has('sub_category_id') && dbSubCategoryId !== null) {
      query += ', sub_category_id';
      placeholders += ', ?';
      params.push(dbSubCategoryId);
    }

    if (cols.has('sub_category') && subCategoryVal) {
      query += ', sub_category';
      placeholders += ', ?';
      params.push(String(subCategoryVal));
    }

    if (ratingVal !== null) {
      query += ', rating';
      placeholders += ', ?';
      params.push(ratingVal);
    }

    if (timeVal !== null) {
      query += ', time';
      placeholders += ', ?';
      params.push(timeVal);
    }

    query += `) VALUES (${placeholders})`;

    const [result] = await db.query(query, params);

    // ✅ Clear cache immediately after creation
    clearServicesCache();

    const [insertedRows] = await db.query('SELECT * FROM services WHERE id = ?', [result.insertId]);
    const responseData = mapServiceRow(insertedRows[0], req);

    res.status(201).json({
      success: true,
      message: 'Service created successfully',
      data: responseData
    });
  } catch (error) {
    console.error('Error creating service:', error);
    res.status(500).json({ success: false, message: 'Failed to create service', error: error.message });
  }
});

// PUT update service
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  console.log('✏️ PUT /services/:id REQUEST RECEIVED:', { id, headers: req.headers, body: req.body });

  const titleVal = req.body.title;
  const priceVal = req.body.price;
  const imageVal = req.body.image;
  const descriptionVal = req.body.description;
  const statusVal = req.body.status;
  const ratingVal = req.body.rating;
  const timeVal = req.body.time;
  const highlightedVal = req.body.isHighlighted !== undefined ? req.body.isHighlighted : req.body.is_highlighted;
  const discountVal = req.body.discount;
  const categoryIdVal = req.body.category_id !== undefined ? req.body.category_id : req.body.categoryId;
  const subCategoryIdVal = req.body.sub_category_id !== undefined ? req.body.sub_category_id : req.body.subCategoryId;
  const subCategoryVal = req.body.sub_category !== undefined ? req.body.sub_category : (req.body.subCategory || req.body.subCategoryName);
  const highlightsVal = req.body.highlights;

  try {
    const cols = await getServicesColumns();
    const [existingRows] = await db.query('SELECT * FROM services WHERE id = ?', [id]);
    if (existingRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }
    const current = existingRows[0];

    const fields = [];
    const values = [];

    if (titleVal !== undefined) {
      fields.push('`title` = ?');
      values.push(titleVal);
    }
    
    // Recalculate price and discount logic based on inputs and database state
    let hasPriceUpdate = (priceVal !== undefined || req.body.cutPrice !== undefined || req.body.discount !== undefined);
    if (hasPriceUpdate) {
      const currentOriginalPrice = parseFloat(current.price) || 0.00;
      const currentDiscountVal = current.discount !== null ? parseFloat(current.discount) : 0.00;
      const currentFinalPrice = Math.max(0, currentOriginalPrice - currentDiscountVal);
      const currentDiscountPercent = currentOriginalPrice > 0 ? (currentDiscountVal / currentOriginalPrice) * 100 : 0.00;

      const inputPrice = priceVal !== undefined ? parseFloat(priceVal) : currentFinalPrice;
      const inputCutPrice = req.body.cutPrice !== undefined 
        ? (req.body.cutPrice === '' || req.body.cutPrice === null ? 0.00 : parseFloat(req.body.cutPrice)) 
        : currentOriginalPrice;
      const inputDiscountPercent = req.body.discount !== undefined
        ? (req.body.discount === '' || req.body.discount === null ? 0.00 : parseFloat(req.body.discount))
        : currentDiscountPercent;

      let dbPrice = inputPrice;
      let dbDiscount = 0.00;

      if (inputCutPrice > inputPrice) {
        dbPrice = inputCutPrice;
        dbDiscount = inputCutPrice - inputPrice;
      } else if (inputDiscountPercent > 0) {
        dbPrice = inputPrice;
        dbDiscount = inputPrice * (inputDiscountPercent / 100);
      } else {
        dbPrice = inputPrice;
        dbDiscount = 0.00;
      }

      fields.push('`price` = ?');
      values.push(dbPrice);
      fields.push('`discount` = ?');
      values.push(dbDiscount);
    }

    if (imageVal !== undefined) {
      fields.push('`image` = ?');
      values.push(imageVal);
    }
    if (descriptionVal !== undefined) {
      fields.push('`description` = ?');
      values.push(descriptionVal);
    }
    if (statusVal !== undefined) {
      fields.push('`status` = ?');
      values.push(statusVal === true || statusVal === 1 || statusVal === 'true' ? 1 : 0);
    }
    if (categoryIdVal !== undefined) {
      let dbCategoryId = null;
      if (categoryIdVal !== null && categoryIdVal !== '' && categoryIdVal !== 'null') {
        const strVal = String(categoryIdVal);
        dbCategoryId = strVal.startsWith('c') ? parseInt(strVal.slice(1)) : parseInt(strVal);
        if (isNaN(dbCategoryId)) dbCategoryId = null;
      }
      fields.push('`category_id` = ?');
      values.push(dbCategoryId);
    }
    if (subCategoryIdVal !== undefined && cols.has('sub_category_id')) {
      let dbSubCatId = null;
      if (subCategoryIdVal !== null && subCategoryIdVal !== '' && subCategoryIdVal !== 'null') {
        const strVal = String(subCategoryIdVal);
        dbSubCatId = strVal.startsWith('c') ? parseInt(strVal.slice(1)) : parseInt(strVal);
        if (isNaN(dbSubCatId)) dbSubCatId = null;
      }
      fields.push('`sub_category_id` = ?');
      values.push(dbSubCatId);
    }
    if (subCategoryVal !== undefined && cols.has('sub_category')) {
      fields.push('`sub_category` = ?');
      values.push(subCategoryVal === '' || subCategoryVal === null ? null : String(subCategoryVal));
    }
    if (ratingVal !== undefined) {
      fields.push('`rating` = ?');
      values.push(ratingVal === '' || ratingVal === null ? null : parseFloat(ratingVal));
    }
    if (timeVal !== undefined) {
      fields.push('`time` = ?');
      values.push(timeVal === '' ? null : timeVal);
    }
    if (highlightedVal !== undefined) {
      fields.push('`isHighlighted` = ?');
      values.push(highlightedVal === null ? null : String(highlightedVal));
    }
    if (highlightsVal !== undefined) {
      fields.push('`highlights` = ?');
      values.push(highlightsVal === null ? '[]' : (typeof highlightsVal === 'string' ? highlightsVal : JSON.stringify(highlightsVal)));
    }

    if (fields.length === 0) {
      // If no fields to update, fetch and return the current service data with a success response.
      // This prevents the frontend from displaying error alerts when editing without changes.
      const [rows] = await db.query('SELECT * FROM services WHERE id = ?', [id]);
      if (rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Service not found' });
      }
      const responseData = mapServiceRow(rows[0], req);
      return res.json({
        success: true,
        message: 'Service updated (no changes made)',
        data: responseData
      });
    }

    values.push(id);
    const query = `UPDATE services SET ${fields.join(', ')} WHERE id = ?`;
    const [result] = await db.query(query, values);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    // ✅ Clear cache immediately after update
    clearServicesCache();

    // Retrieve updated service
    const [rows] = await db.query('SELECT * FROM services WHERE id = ?', [id]);
    const responseData = mapServiceRow(rows[0], req);

    res.json({
      success: true,
      message: 'Service updated successfully',
      data: responseData
    });
  } catch (error) {
    console.error('Error updating service:', error);
    res.status(500).json({ success: false, message: 'Failed to update service', error: error.message });
  }
});

// DELETE service
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('DELETE FROM services WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    // Clear cache immediately after deletion
    clearServicesCache();

    res.json({
      success: true,
      message: 'Service deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({ success: false, message: 'Failed to delete service', error: error.message });
  }
});


// GET /search - search services
router.get('/search', async (req, res) => {
  const q = req.query.q || req.query.query || '';

  try {
    // If we have a valid cache, filter from memory instantly with zero database lag
    if (servicesCache && (Date.now() - servicesCacheTimestamp < SERVICES_CACHE_TTL)) {
      if (q === '') {
        return res.json({ success: true, data: servicesCache });
      }
      const filtered = servicesCache.filter(s => 
        (s.title && s.title.toLowerCase().includes(q)) ||
        (s.description && s.description.toLowerCase().includes(q))
      );
      return res.json({ success: true, data: filtered });
    }
    
    // if we not have the cache then fallback diresctly to database
    let rows;
    if (q.trim() === '') {
      [rows] = await db.query('SELECT * FROM services ORDER BY id DESC');
    } else {
      [rows] = await db.query(
        'SELECT * FROM services WHERE title LIKE ? OR description LIKE ? ORDER BY id DESC',
        [`%${q}%`, `%${q}%`]
      );
    }
    const mapped = rows.map(r => mapServiceRow(r, req));
    res.json({ success: true, data: mapped });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Search failed', error: error.message });
  }
});

// PUT/PATCH toggle service status
router.put('/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (status === undefined) {
    return res.status(400).json({ success: false, message: 'Status is required' });
  }
  const statusInt = (status === true || status === 1 || status === 'true') ? 1 : 0;
  try {
    const [result] = await db.query('UPDATE services SET status = ? WHERE id = ?', [statusInt, id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    // Clear cache immediately after status change
    clearServicesCache();

    const [rows] = await db.query('SELECT * FROM services WHERE id = ?', [id]);
    const responseData = mapServiceRow(rows[0], req);
    res.json({
      success: true,
      message: `Service status updated to ${statusInt === 1 ? 'active' : 'inactive'}`,
      data: responseData
    });
  } catch (error) {
    console.error('Error toggling service status:', error);
    res.status(500).json({ success: false, message: 'Failed to update status', error: error.message });
  }
});

router.patch('/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (status === undefined) {
    return res.status(400).json({ success: false, message: 'Status is required' });
  }
  const statusInt = (status === true || status === 1 || status === 'true') ? 1 : 0;
  try {
    const [result] = await db.query('UPDATE services SET status = ? WHERE id = ?', [statusInt, id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    // ✅ Clear cache immediately after status change
    clearServicesCache();

    const [rows] = await db.query('SELECT * FROM services WHERE id = ?', [id]);
    const responseData = mapServiceRow(rows[0], req);
    res.json({
      success: true,
      message: `Service status updated to ${statusInt === 1 ? 'active' : 'inactive'}`,
      data: responseData
    });
  } catch (error) {
    console.error('Error toggling service status:', error);
    res.status(500).json({ success: false, message: 'Failed to update status', error: error.message });
  }
});

module.exports = router;
