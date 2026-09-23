const express = require('express');
const router = express.Router();
const db = require('../db');

function formatImageUrl(img, req) {
  if (!img) return '';
  
  const host = (req && req.get) ? (req.get('host') || 'adminbackend-1-h03r.onrender.com') : 'adminbackend-1-h03r.onrender.com';
  const isHttps = host.includes('onrender.com') || (req && (req.protocol === 'https' || req.headers['x-forwarded-proto'] === 'https' || req.headers['x-forwarded-ssl'] === 'on'));
  const protocol = isHttps ? 'https' : 'http';
  
  let cleanFilename = img;
  if (cleanFilename.includes('/uploads/')) {
    cleanFilename = cleanFilename.split('/uploads/').pop();
  } else if (cleanFilename.startsWith('http://') || cleanFilename.startsWith('https://')) {
    if (isHttps && cleanFilename.startsWith('http://')) {
      return cleanFilename.replace('http://', 'https://');
    }
    return cleanFilename;
  } else {
    cleanFilename = cleanFilename.replace(/^\/?uploads\//, '').replace(/^\/?categories\//, '');
  }

  return `${protocol}://${host}/uploads/${cleanFilename}`;
}

function mapCategory(r, req) {
  const formattedImg = formatImageUrl(r.image, req);
  const titleVal = r.title || r.categoryName || r.name || '';
  const parentVal = (r.parent === null || r.parent === 'None' || !r.parent) ? 'Main Category' : r.parent;

  return {
    ...r,
    id: r.id,
    title: titleVal,
    name: titleVal,
    categoryName: titleVal,
    category_name: titleVal,
    
    // Icon and Image field variations for all Flutter app versions & Admin Panel
    image: formattedImg,
    img: formattedImg,
    icon: formattedImg,
    icon_3d: formattedImg,
    icon3d: formattedImg,
    imageUrl: formattedImg,
    image_url: formattedImg,
    cat_image: formattedImg,
    cat_icon: formattedImg,
    categoryImage: formattedImg,
    categoryIcon: formattedImg,
    category_icon: formattedImg,
    category_image: formattedImg,
    iconUrl: formattedImg,
    banner: formattedImg,

    parent: parentVal,
    mainCategory: parentVal === 'Main Category',
    isMain: parentVal === 'Main Category',
    status: r.status === 1 || r.status === true
  };
}

// In-memory cache for categories (TTL 30 seconds)
const categoriesCache = new Map();
const CAT_CACHE_TTL = 30000;

function clearCategoriesCache() {
  categoriesCache.clear();
}

// GET all categories (with optional search/filtering/pagination)
router.get('/', async (req, res) => {
  try {
    const { title, categoryName, parent, mainCategory, status, emailStatus } = req.query;
    const pageNum = parseInt(req.query.page || '1') || 1;
    const limitNum = parseInt(req.query.limit || '0') || 0;

    const cacheKey = `cats_${title || ''}_${categoryName || ''}_${parent || ''}_${mainCategory || ''}_${status !== undefined ? status : ''}_${pageNum}_${limitNum}`;
    const cached = categoriesCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < CAT_CACHE_TTL)) {
      return res.json(cached.data);
    }

    let query = 'SELECT * FROM categories WHERE 1=1';
    const params = [];

    const searchTitle = title || categoryName;
    if (searchTitle) {
      query += ' AND (title LIKE ? OR name_hi LIKE ?)';
      params.push(`%${searchTitle}%`, `%${searchTitle}%`);
    }

    const searchParent = parent || mainCategory;
    if (searchParent) {
      if (searchParent === 'Main Category' || searchParent === 'main' || searchParent === 'true') {
        query += " AND (parent IS NULL OR parent = '' OR parent = 'None' OR parent = 'Main Category')";
      } else {
        query += ' AND parent LIKE ?';
        params.push(`%${searchParent}%`);
      }
    }

    const searchStatus = status !== undefined ? status : emailStatus;
    if (searchStatus !== undefined) {
      const statusInt = searchStatus === 'true' || searchStatus === '1' ? 1 : 0;
      query += ' AND status = ?';
      params.push(statusInt);
    }

    query += ' ORDER BY id DESC';
    const [rows] = await db.query(query, params);
    const mapped = rows.map(r => mapCategory(r, req));

    let paginatedMapped = mapped;
    let totalPages = 1;

    if (limitNum > 0) {
      const startIndex = (pageNum - 1) * limitNum;
      paginatedMapped = mapped.slice(startIndex, startIndex + limitNum);
      totalPages = Math.ceil(mapped.length / limitNum) || 1;
    }

    const response = {
      success: true,
      total: mapped.length,
      page: pageNum,
      limit: limitNum > 0 ? limitNum : mapped.length,
      totalPages: totalPages,
      data: paginatedMapped,
      categories: paginatedMapped,
      result: paginatedMapped
    };

    categoriesCache.set(cacheKey, { data: response, timestamp: Date.now() });
    res.json(response);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch categories', error: error.message });
  }
});

// GET /main - get main categories
router.get('/main', async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM categories WHERE (parent IS NULL OR parent = '' OR parent = 'None' OR parent = 'Main Category') AND status = 1 ORDER BY id DESC");
    const mapped = rows.map(r => mapCategory(r, req));
    res.json({ success: true, data: mapped, categories: mapped, result: mapped });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch main categories', error: error.message });
  }
});

// GET /search - search categories
router.get('/search', async (req, res) => {
  const q = req.query.q || req.query.query || '';
  try {
    let rows;
    if (q.trim() === '') {
      [rows] = await db.query('SELECT * FROM categories ORDER BY id DESC');
    } else {
      [rows] = await db.query(
        'SELECT * FROM categories WHERE title LIKE ? OR parent LIKE ? ORDER BY id DESC',
        [`%${q}%`, `%${q}%`]
      );
    }
    const mapped = rows.map(r => mapCategory(r, req));
    res.json({ success: true, data: mapped, categories: mapped, result: mapped });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Search failed', error: error.message });
  }
});

// GET /:id - single category
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  if (id === 'main' || id === 'search') return; // Handled by specific routes
  const numericId = id.startsWith('c') ? parseInt(id.slice(1)) : parseInt(id);
  if (isNaN(numericId)) {
    return res.status(400).json({ success: false, message: 'Invalid Category ID format' });
  }
  try {
    const [rows] = await db.query('SELECT * FROM categories WHERE id = ?', [numericId]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    const mapped = mapCategory(rows[0], req);
    res.json({ success: true, data: mapped, category: mapped });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch category', error: error.message });
  }
});

// POST create category
router.post('/', async (req, res) => {
  const titleVal = req.body.title || req.body.categoryName || req.body.name;
  const parentVal = req.body.parent || req.body.mainCategory;
  const imageVal = req.body.image || req.body.icon || req.body.icon_3d || req.body.imageUrl || '';
  const statusVal = req.body.status !== undefined ? req.body.status : req.body.emailStatus;
  
  if (!titleVal) {
    return res.status(400).json({ success: false, message: 'Category Name (title) is required' });
  }
  
  const statusInt = statusVal === true || statusVal === 1 || statusVal === 'true' ? 1 : 0;
  const dbParentVal = parentVal === 'None' || !parentVal ? 'Main Category' : parentVal;
  
  const slug = titleVal.trim().toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

  try {
    const [result] = await db.query(
      'INSERT INTO categories (title, slug, parent, image, status) VALUES (?, ?, ?, ?, ?)',
      [titleVal, slug, dbParentVal, imageVal, statusInt]
    );

    const [newRows] = await db.query('SELECT * FROM categories WHERE id = ?', [result.insertId]);
    const createdCategory = mapCategory(newRows[0] || { id: result.insertId, title: titleVal, parent: dbParentVal, image: imageVal, status: statusInt }, req);

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: createdCategory,
      category: createdCategory
    });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ success: false, message: 'Failed to create category', error: error.message });
  }
});

// PUT update category
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const numericId = id.startsWith('c') ? parseInt(id.slice(1)) : parseInt(id);
  if (isNaN(numericId)) {
    return res.status(400).json({ success: false, message: 'Invalid Category ID format' });
  }

  const titleVal = req.body.title || req.body.categoryName || req.body.name;
  const parentVal = req.body.parent || req.body.mainCategory;
  const imageVal = req.body.image || req.body.icon || req.body.icon_3d || req.body.imageUrl;
  const statusVal = req.body.status !== undefined ? req.body.status : req.body.emailStatus;
  
  try {
    const fields = [];
    const values = [];

    if (titleVal !== undefined) {
      fields.push('`title` = ?');
      values.push(titleVal);
    }
    if (parentVal !== undefined) {
      fields.push('`parent` = ?');
      values.push(parentVal === 'None' || !parentVal ? 'Main Category' : parentVal);
    }
    if (imageVal !== undefined) {
      fields.push('`image` = ?');
      values.push(imageVal);
    }
    if (statusVal !== undefined) {
      fields.push('`status` = ?');
      values.push(statusVal === true || statusVal === 1 || statusVal === 'true' ? 1 : 0);
    }

    if (fields.length === 0) {
      const [rows] = await db.query('SELECT * FROM categories WHERE id = ?', [numericId]);
      const mapped = mapCategory(rows[0], req);
      return res.json({ success: true, message: 'Update successful (no changes made)', data: mapped, category: mapped });
    }

    values.push(numericId);
    const query = `UPDATE categories SET ${fields.join(', ')} WHERE id = ?`;
    const [result] = await db.query(query, values);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    // Retrieve updated category
    const [rows] = await db.query('SELECT * FROM categories WHERE id = ?', [numericId]);
    const updatedCategory = mapCategory(rows[0], req);

    res.json({
      success: true,
      message: 'Category updated successfully',
      data: updatedCategory,
      category: updatedCategory
    });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ success: false, message: 'Failed to update category', error: error.message });
  }
});

// DELETE category
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const numericId = id.startsWith('c') ? parseInt(id.slice(1)) : parseInt(id);
  if (isNaN(numericId)) {
    return res.status(400).json({ success: false, message: 'Invalid Category ID format' });
  }

  try {
    const [rows] = await db.query('SELECT title FROM categories WHERE id = ?', [numericId]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    const categoryTitle = rows[0].title;

    await db.query('DELETE FROM categories WHERE parent = ?', [categoryTitle]);
    await db.query('DELETE FROM categories WHERE id = ?', [numericId]);

    res.json({
      success: true,
      message: 'Category and its sub-categories deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ success: false, message: 'Failed to delete category', error: error.message });
  }
});

// PUT/PATCH toggle category status
router.put('/:id/status', async (req, res) => {
  const { id } = req.params;
  const numericId = id.startsWith('c') ? parseInt(id.slice(1)) : parseInt(id);
  if (isNaN(numericId)) {
    return res.status(400).json({ success: false, message: 'Invalid Category ID format' });
  }

  const statusVal = req.body.status !== undefined ? req.body.status : req.body.emailStatus;
  if (statusVal === undefined) {
    return res.status(400).json({ success: false, message: 'Status is required' });
  }
  const statusInt = (statusVal === true || statusVal === 1 || statusVal === 'true') ? 1 : 0;
  try {
    const [result] = await db.query('UPDATE categories SET status = ? WHERE id = ?', [statusInt, numericId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    const [rows] = await db.query('SELECT * FROM categories WHERE id = ?', [numericId]);
    const mapped = mapCategory(rows[0], req);
    res.json({
      success: true,
      message: `Category status updated to ${statusInt === 1 ? 'active' : 'inactive'}`,
      data: mapped
    });
  } catch (error) {
    console.error('Error toggling category status:', error);
    res.status(500).json({ success: false, message: 'Failed to update status', error: error.message });
  }
});

router.patch('/:id/status', async (req, res) => {
  const { id } = req.params;
  const numericId = id.startsWith('c') ? parseInt(id.slice(1)) : parseInt(id);
  if (isNaN(numericId)) {
    return res.status(400).json({ success: false, message: 'Invalid Category ID format' });
  }

  const statusVal = req.body.status !== undefined ? req.body.status : req.body.emailStatus;
  if (statusVal === undefined) {
    return res.status(400).json({ success: false, message: 'Status is required' });
  }
  const statusInt = (statusVal === true || statusVal === 1 || statusVal === 'true') ? 1 : 0;
  try {
    const [result] = await db.query('UPDATE categories SET status = ? WHERE id = ?', [statusInt, numericId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    const [rows] = await db.query('SELECT * FROM categories WHERE id = ?', [numericId]);
    const mapped = mapCategory(rows[0], req);
    res.json({
      success: true,
      message: `Category status updated to ${statusInt === 1 ? 'active' : 'inactive'}`,
      data: mapped
    });
  } catch (error) {
    console.error('Error toggling category status:', error);
    res.status(500).json({ success: false, message: 'Failed to update status', error: error.message });
  }
});

module.exports = router;
