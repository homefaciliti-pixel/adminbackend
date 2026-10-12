const express = require('express');
const router = express.Router();
const db = require('../db');

// In-memory cache for subcategories
let subcategoryCache = null;
let subcategoryCacheTimestamp = null;
const SUBCATEGORY_CACHE_TTL = 10 * 1000; // 10 seconds

function clearSubcategoryCache() {
  subcategoryCache = null;
  subcategoryCacheTimestamp = null;
}

function formatImageUrl(img, req) {
  if (!img) return '';
  const host = req ? req.get('host') : 'adminbackend-1-h03r.onrender.com';
  const protocol = req && (req.protocol === 'https' || req.headers['x-forwarded-proto'] === 'https') ? 'https' : 'http';
  
  if (img.includes('/uploads/')) {
    const filename = img.split('/uploads/').pop();
    return `${protocol}://${host}/uploads/${filename}`;
  }

  if (img.startsWith('http://') || img.startsWith('https://')) {
    return img;
  }
  const cleanFilename = img.replace(/^uploads\//, '').replace(/^categories\//, '').replace(/^subcategories\//, '');
  return `${protocol}://${host}/uploads/${cleanFilename}`;
}

// Helper: build map of parent categories (id -> title & title -> id)
async function getCategoryMaps() {
  try {
    const [rows] = await db.query("SELECT id, title FROM categories WHERE parent IS NULL OR parent = '' OR parent = 'None'");
    const idToTitle = {};
    const titleToId = {};
    rows.forEach(r => {
      idToTitle[r.id] = r.title;
      titleToId[r.title.toLowerCase()] = r.id;
    });
    return { idToTitle, titleToId, mainCategories: rows };
  } catch (err) {
    console.error('Error fetching category maps:', err.message);
    return { idToTitle: {}, titleToId: {}, mainCategories: [] };
  }
}

// -------------------------------------------------------------
// GET /api/subcategories
// Fetch all subcategories (optional filtering by category_id, parent, search, status)
// -------------------------------------------------------------
router.get('/', async (req, res) => {
  try {
    const { category_id, categoryId, parent, category, categoryName, search, q, title, status } = req.query;

    const isFiltered = category_id !== undefined || categoryId !== undefined || parent || category || categoryName || search || q || title || status !== undefined;

    if (!isFiltered && subcategoryCache && (Date.now() - subcategoryCacheTimestamp < SUBCATEGORY_CACHE_TTL)) {
      return res.json({
        success: true,
        source: 'cache',
        total: subcategoryCache.length,
        data: subcategoryCache,
        subcategories: subcategoryCache,
        result: subcategoryCache
      });
    }

    const { idToTitle, titleToId } = await getCategoryMaps();

    // Subcategories are categories where parent IS NOT NULL and parent != 'None' and parent != ''
    let query = "SELECT * FROM categories WHERE parent IS NOT NULL AND parent != '' AND parent != 'None'";
    const params = [];

    // Filter by Parent Category ID
    const catIdParam = category_id !== undefined ? category_id : categoryId;
    if (catIdParam !== undefined && catIdParam !== null && catIdParam !== '') {
      const parsedCatId = parseInt(catIdParam, 10);
      const parentTitle = idToTitle[parsedCatId];
      if (parentTitle) {
        query += " AND (parent = ? OR parent = ?)";
        params.push(parentTitle, String(parsedCatId));
      } else {
        query += " AND (parent = ?)";
        params.push(String(catIdParam));
      }
    }

    // Filter by Parent Category Name
    const parentParam = parent || category || categoryName;
    if (parentParam) {
      query += " AND parent LIKE ?";
      params.push(`%${parentParam}%`);
    }

    // Search by Subcategory Title / Name
    const searchVal = search || q || title;
    if (searchVal) {
      query += " AND title LIKE ?";
      params.push(`%${searchVal}%`);
    }

    // Filter by Status
    if (status !== undefined) {
      const statusInt = (status === 'true' || status === '1' || status === true) ? 1 : 0;
      query += " AND status = ?";
      params.push(statusInt);
    }

    query += " ORDER BY id DESC";

    const [rows] = await db.query(query, params);

    const mapped = rows.map(r => {
      const parentName = r.parent || '';
      const resolvedCatId = titleToId[parentName.toLowerCase()] || (parseInt(parentName, 10) || null);

      return {
        id: r.id,
        title: r.title,
        name: r.title,
        slug: r.slug,
        parent: parentName,
        categoryName: parentName,
        category_id: resolvedCatId,
        categoryId: resolvedCatId,
        image: formatImageUrl(r.image, req),
        status: r.status === 1 || r.status === true
      };
    });

    if (!isFiltered) {
      subcategoryCache = mapped;
      subcategoryCacheTimestamp = Date.now();
    }

    res.json({
      success: true,
      total: mapped.length,
      data: mapped,
      subcategories: mapped,
      result: mapped
    });
  } catch (error) {
    console.error('Error fetching subcategories:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch subcategories', error: error.message });
  }
});

// -------------------------------------------------------------
// GET /api/subcategories/:id
// Retrieve single subcategory details by ID
// -------------------------------------------------------------
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const numericId = parseInt(id, 10);
  if (isNaN(numericId)) {
    return res.status(400).json({ success: false, message: 'Invalid Subcategory ID format' });
  }

  try {
    const [rows] = await db.query('SELECT * FROM categories WHERE id = ?', [numericId]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Subcategory not found' });
    }

    const r = rows[0];
    const { titleToId } = await getCategoryMaps();
    const parentName = r.parent || '';
    const resolvedCatId = titleToId[parentName.toLowerCase()] || (parseInt(parentName, 10) || null);

    const data = {
      id: r.id,
      title: r.title,
      name: r.title,
      slug: r.slug,
      parent: parentName,
      categoryName: parentName,
      category_id: resolvedCatId,
      categoryId: resolvedCatId,
      image: formatImageUrl(r.image, req),
      status: r.status === 1 || r.status === true
    };

    res.json({
      success: true,
      data,
      subcategory: data
    });
  } catch (error) {
    console.error('Error fetching subcategory:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch subcategory', error: error.message });
  }
});

// -------------------------------------------------------------
// GET /api/subcategories/:id/services
// Retrieve all services linked to this subcategory
// -------------------------------------------------------------
router.get('/:id/services', async (req, res) => {
  const { id } = req.params;
  const numericId = parseInt(id, 10);
  if (isNaN(numericId)) {
    return res.status(400).json({ success: false, message: 'Invalid Subcategory ID format' });
  }

  try {
    const [subRows] = await db.query('SELECT * FROM categories WHERE id = ?', [numericId]);
    if (subRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Subcategory not found' });
    }

    const sub = subRows[0];

    // Fetch services linked to this subcategory (by sub_category_id, sub_category title, or category_id)
    let services = [];
    try {
      const [res] = await db.query(
        "SELECT * FROM services WHERE (sub_category_id = ? OR category_id = ? OR sub_category = ?) ORDER BY id DESC",
        [numericId, numericId, sub.title]
      );
      services = res;
    } catch (e) {
      // Fallback if sub_category_id or sub_category column does not exist
      try {
        const [res] = await db.query(
          "SELECT * FROM services WHERE category_id = ? ORDER BY id DESC",
          [numericId]
        );
        services = res;
      } catch (err2) {
        services = [];
      }
    }

    const mappedServices = services.map(s => ({
      ...s,
      image: formatImageUrl(s.image, req),
      status: s.status === 1 || s.status === true
    }));

    res.json({
      success: true,
      subcategoryId: numericId,
      subcategoryTitle: sub.title,
      total: mappedServices.length,
      data: mappedServices,
      services: mappedServices
    });
  } catch (error) {
    console.error('Error fetching services for subcategory:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch services for subcategory', error: error.message });
  }
});

// -------------------------------------------------------------
// POST /api/subcategories
// Create a new subcategory under a parent category
// -------------------------------------------------------------
router.post('/', async (req, res) => {
  const titleVal = req.body.title || req.body.name || req.body.subCategoryName || req.body.categoryName;
  const parentVal = req.body.parent || req.body.category || req.body.mainCategory || req.body.categoryName;
  const categoryIdVal = req.body.category_id !== undefined ? req.body.category_id : req.body.categoryId;
  const imageVal = req.body.image || '';
  const statusVal = req.body.status !== undefined ? req.body.status : true;

  if (!titleVal) {
    return res.status(400).json({ success: false, message: 'Subcategory Title/Name is required' });
  }

  let finalParent = parentVal;

  // If category_id was provided instead of parent title, resolve parent title
  if ((!finalParent || finalParent === 'None') && categoryIdVal !== undefined && categoryIdVal !== null && categoryIdVal !== '') {
    const { idToTitle } = await getCategoryMaps();
    finalParent = idToTitle[parseInt(categoryIdVal, 10)] || String(categoryIdVal);
  }

  if (!finalParent || finalParent === 'None') {
    return res.status(400).json({
      success: false,
      message: 'Parent category (parent or category_id) is required for a subcategory'
    });
  }

  const statusInt = (statusVal === true || statusVal === 1 || statusVal === 'true') ? 1 : 0;
  const slug = titleVal.trim().toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

  try {
    const [result] = await db.query(
      'INSERT INTO categories (title, slug, parent, image, status) VALUES (?, ?, ?, ?, ?)',
      [titleVal, slug, finalParent, imageVal, statusInt]
    );

    clearSubcategoryCache();

    const { titleToId } = await getCategoryMaps();
    const resolvedCatId = titleToId[finalParent.toLowerCase()] || (parseInt(categoryIdVal, 10) || null);

    const createdData = {
      id: result.insertId,
      title: titleVal,
      name: titleVal,
      slug: slug,
      parent: finalParent,
      categoryName: finalParent,
      category_id: resolvedCatId,
      categoryId: resolvedCatId,
      image: formatImageUrl(imageVal, req),
      status: statusInt === 1
    };

    res.status(201).json({
      success: true,
      message: 'Subcategory created successfully',
      data: createdData,
      subcategory: createdData
    });
  } catch (error) {
    console.error('Error creating subcategory:', error);
    res.status(500).json({ success: false, message: 'Failed to create subcategory', error: error.message });
  }
});

// -------------------------------------------------------------
// PUT /api/subcategories/:id
// Update subcategory details
// -------------------------------------------------------------
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const numericId = parseInt(id, 10);
  if (isNaN(numericId)) {
    return res.status(400).json({ success: false, message: 'Invalid Subcategory ID format' });
  }

  const titleVal = req.body.title || req.body.name || req.body.subCategoryName || req.body.categoryName;
  const parentVal = req.body.parent || req.body.category || req.body.mainCategory;
  const categoryIdVal = req.body.category_id !== undefined ? req.body.category_id : req.body.categoryId;
  const imageVal = req.body.image;
  const statusVal = req.body.status;

  try {
    let finalParent = parentVal;
    if (categoryIdVal !== undefined && categoryIdVal !== null && categoryIdVal !== '') {
      const { idToTitle } = await getCategoryMaps();
      finalParent = idToTitle[parseInt(categoryIdVal, 10)] || String(categoryIdVal);
    }

    const fields = [];
    const values = [];

    if (titleVal !== undefined) {
      fields.push('`title` = ?');
      values.push(titleVal);

      const slug = titleVal.trim().toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
      fields.push('`slug` = ?');
      values.push(slug);
    }

    if (finalParent !== undefined) {
      fields.push('`parent` = ?');
      values.push(finalParent === 'None' || !finalParent ? null : finalParent);
    }

    if (imageVal !== undefined) {
      fields.push('`image` = ?');
      values.push(imageVal);
    }

    if (statusVal !== undefined) {
      fields.push('`status` = ?');
      values.push((statusVal === true || statusVal === 1 || statusVal === 'true') ? 1 : 0);
    }

    if (fields.length === 0) {
      const [rows] = await db.query('SELECT * FROM categories WHERE id = ?', [numericId]);
      return res.json({ success: true, message: 'Update successful (no changes made)', data: rows[0] });
    }

    values.push(numericId);
    const query = `UPDATE categories SET ${fields.join(', ')} WHERE id = ?`;
    const [result] = await db.query(query, values);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Subcategory not found' });
    }

    clearSubcategoryCache();

    const [rows] = await db.query('SELECT * FROM categories WHERE id = ?', [numericId]);
    const r = rows[0];
    const { titleToId } = await getCategoryMaps();
    const parentName = r.parent || '';
    const resolvedCatId = titleToId[parentName.toLowerCase()] || (parseInt(parentName, 10) || null);

    const updatedData = {
      id: r.id,
      title: r.title,
      name: r.title,
      slug: r.slug,
      parent: parentName,
      categoryName: parentName,
      category_id: resolvedCatId,
      categoryId: resolvedCatId,
      image: formatImageUrl(r.image, req),
      status: r.status === 1 || r.status === true
    };

    res.json({
      success: true,
      message: 'Subcategory updated successfully',
      data: updatedData,
      subcategory: updatedData
    });
  } catch (error) {
    console.error('Error updating subcategory:', error);
    res.status(500).json({ success: false, message: 'Failed to update subcategory', error: error.message });
  }
});

// -------------------------------------------------------------
// DELETE /api/subcategories/:id
// Delete a subcategory by ID
// -------------------------------------------------------------
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const numericId = parseInt(id, 10);
  if (isNaN(numericId)) {
    return res.status(400).json({ success: false, message: 'Invalid Subcategory ID format' });
  }

  try {
    const [rows] = await db.query('SELECT * FROM categories WHERE id = ?', [numericId]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Subcategory not found' });
    }

    await db.query('DELETE FROM categories WHERE id = ?', [numericId]);

    clearSubcategoryCache();

    res.json({
      success: true,
      message: 'Subcategory deleted successfully',
      deletedId: numericId
    });
  } catch (error) {
    console.error('Error deleting subcategory:', error);
    res.status(500).json({ success: false, message: 'Failed to delete subcategory', error: error.message });
  }
});

// -------------------------------------------------------------
// PUT/PATCH /api/subcategories/:id/status
// Toggle subcategory active/inactive status
// -------------------------------------------------------------
const toggleStatusHandler = async (req, res) => {
  const { id } = req.params;
  const numericId = parseInt(id, 10);
  if (isNaN(numericId)) {
    return res.status(400).json({ success: false, message: 'Invalid Subcategory ID format' });
  }

  const statusVal = req.body.status;
  if (statusVal === undefined) {
    return res.status(400).json({ success: false, message: 'Status is required' });
  }

  const statusInt = (statusVal === true || statusVal === 1 || statusVal === 'true') ? 1 : 0;

  try {
    const [result] = await db.query('UPDATE categories SET status = ? WHERE id = ?', [statusInt, numericId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Subcategory not found' });
    }

    clearSubcategoryCache();

    const [rows] = await db.query('SELECT * FROM categories WHERE id = ?', [numericId]);
    const r = rows[0];

    res.json({
      success: true,
      message: `Subcategory status updated to ${statusInt === 1 ? 'active' : 'inactive'}`,
      data: {
        id: r.id,
        title: r.title,
        name: r.title,
        parent: r.parent,
        status: r.status === 1
      }
    });
  } catch (error) {
    console.error('Error toggling subcategory status:', error);
    res.status(500).json({ success: false, message: 'Failed to update status', error: error.message });
  }
};

router.put('/:id/status', toggleStatusHandler);
router.patch('/:id/status', toggleStatusHandler);

module.exports = router;
