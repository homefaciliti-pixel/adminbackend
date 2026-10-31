const express = require('express');
const router = express.Router();
const db = require('../db');

// updated new code for the cache memory or storage 
let categoryCache = null;
let cacheTimestamp = null;
const CACHE_TTL = 10 * 1000; // Cache lives for 10 seconds 

function clearCategoryCache() {
  categoryCache = null;
  cacheTimestamp = null;
}

function formatImageUrl(img, req) {
  if (!img) return '';
  const host = req.get('host');
  const protocol = req.protocol === 'https' || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
  
  if (img.includes('/uploads/')) {
    const filename = img.split('/uploads/').pop();
    return `${protocol}://${host}/uploads/${filename}`;
  }

  if (img.startsWith('http://') || img.startsWith('https://')) {
    return img;
  }
  const cleanFilename = img.replace(/^uploads\//, '').replace(/^categories\//, '');
  return `${protocol}://${host}/uploads/${cleanFilename}`;
}

// GET all categories (with optional search/filtering)
router.get('/', async (req, res) => {
  try {
    const { title, categoryName, parent, mainCategory, status, emailStatus, all, include_subcategories } = req.query;

    // If no search or filters are applied, check the cache first!
    const isFiltered = title || categoryName || parent || mainCategory || status !== undefined || emailStatus !== undefined || all || include_subcategories;
    
    if (!isFiltered && categoryCache && (Date.now() - cacheTimestamp < CACHE_TTL)) {
      return res.json({
        success: true,
        source: 'cache', // Easy to verify in Postman/Console
        data: categoryCache,
        categories: categoryCache,
        result: categoryCache
      });
    }    

    let query = 'SELECT * FROM categories WHERE 1=1';
    const params = [];

    const searchTitle = title || categoryName;
    if (searchTitle) {
      query += ' AND title LIKE ?';
      params.push(`%${searchTitle}%`);
    }

    const searchParent = parent || mainCategory;
    if (searchParent) {
      if (searchParent === 'None' || searchParent === 'Main Category') {
        query += " AND (parent IS NULL OR parent = '' OR parent = 'None' OR parent = 'Main Category')";
      } else {
        query += ' AND parent = ?';
        params.push(searchParent);
      }
    } else if (all !== 'true' && include_subcategories !== 'true') {
      // By default, /api/categories returns ONLY Main Categories! Subcategories belong in /api/subcategories
      query += " AND (parent IS NULL OR parent = '' OR parent = 'None' OR parent = 'Main Category')";
    }

    const searchStatus = status !== undefined ? status : emailStatus;
    if (searchStatus !== undefined) {
      const statusInt = searchStatus === 'true' || searchStatus === '1' ? 1 : 0;
      query += ' AND status = ?';
      params.push(statusInt);
    }

    query += ' ORDER BY id DESC';
    const [rows] = await db.query(query, params);

    // Fetch all subcategories so they are nested under each category for User App
    const subMap = {};
    try {
      const [subRows] = await db.query(
        "SELECT * FROM categories WHERE parent IS NOT NULL AND parent != '' AND parent != 'None' AND parent != 'Main Category' ORDER BY id ASC"
      );
      subRows.forEach(sub => {
        const pKey = String(sub.parent || '').trim().toLowerCase();
        if (!subMap[pKey]) subMap[pKey] = [];
        const formattedSub = {
          ...sub,
          id: sub.id,
          title: sub.title,
          name: sub.name || sub.title,
          slug: sub.slug,
          parent: sub.parent,
          image: formatImageUrl(sub.image, req),
          status: sub.status === 1 || sub.status === true
        };
        subMap[pKey].push(formattedSub);
      });
    } catch (subErr) {
      console.error('Error fetching nested subcategories:', subErr.message);
    }

    const mapped = rows.map(r => {
      const titleKey = String(r.title || '').trim().toLowerCase();
      const idKey = String(r.id);
      const subs = subMap[titleKey] || subMap[idKey] || [];
      const resolvedSubs = subs.map(s => ({
        ...s,
        category_id: r.id,
        categoryId: r.id
      }));

      return {
        ...r,
        id: r.id,
        title: r.title,
        name: r.name || r.title,
        image: formatImageUrl(r.image, req),
        parent: (r.parent === null || r.parent === '' || r.parent === 'None') ? 'Main Category' : r.parent,
        status: r.status === 1 || r.status === true,
        subcategories: resolvedSubs,
        sub_categories: resolvedSubs,
        subCategories: resolvedSubs
      };
    });

    // Save to cache if it's an unfiltered request
    if (!isFiltered) {
      categoryCache = mapped;
      cacheTimestamp = Date.now();
    }

    res.json({
      success: true,
      data: mapped,
      categories: mapped,
      result: mapped
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch categories', error: error.message });
  }
});

// GET /search - search categories
router.get('/search', async (req, res) => {
  const q = req.query.q || req.query.query || '';
  try {
    let rows;
    if (q.trim() === '') {
      [rows] = await db.query("SELECT * FROM categories WHERE (parent IS NULL OR parent = '' OR parent = 'None' OR parent = 'Main Category') ORDER BY id DESC");
    } else {
      [rows] = await db.query(
        "SELECT * FROM categories WHERE (parent IS NULL OR parent = '' OR parent = 'None' OR parent = 'Main Category') AND title LIKE ? ORDER BY id DESC",
        [`%${q}%`]
      );
    }
    const mapped = rows.map(r => ({
      ...r,
      id: r.id,
      image: formatImageUrl(r.image, req),
      parent: (r.parent === null || r.parent === '' || r.parent === 'None') ? 'Main Category' : r.parent,
      status: r.status === 1
    }));
    res.json({ success: true, data: mapped, categories: mapped, result: mapped });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Search failed', error: error.message });
  }
});

// POST create category
router.post('/', async (req, res) => {
  const titleVal = req.body.title || req.body.categoryName;
  const parentVal = req.body.parent || req.body.mainCategory;
  const imageVal = req.body.image || '';
  const statusVal = req.body.status !== undefined ? req.body.status : req.body.emailStatus;
  
  if (!titleVal) {
    return res.status(400).json({ success: false, message: 'Category Name (title) is required' });
  }
  
  const statusInt = statusVal === true || statusVal === 1 || statusVal === 'true' ? 1 : 0;
  const dbParentVal = (parentVal === 'None' || !parentVal) ? 'Main Category' : parentVal;
  
  const slug = titleVal.trim().toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

  try {
    const [result] = await db.query(
      'INSERT INTO categories (title, slug, parent, image, status) VALUES (?, ?, ?, ?, ?)',
      [titleVal, slug, dbParentVal, imageVal, statusInt]
    );

    clearCategoryCache();

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: {
        id: result.insertId,
        title: titleVal,
        parent: parentVal,
        image: imageVal,
        status: statusInt === 1
      }
    });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ success: false, message: 'Failed to create category', error: error.message });
  }
});

// GET single category by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const numericId = id.startsWith('c') ? parseInt(id.slice(1)) : parseInt(id);
  if (isNaN(numericId)) {
    return res.status(400).json({ success: false, message: 'Invalid Category ID format' });
  }

  try {
    const [rows] = await db.query('SELECT * FROM categories WHERE id = ?', [numericId]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    const r = rows[0];

    // Fetch child subcategories for this category
    const [subRows] = await db.query(
      "SELECT * FROM categories WHERE parent = ? OR parent = ? ORDER BY id ASC",
      [r.title, String(numericId)]
    );
    const subs = subRows.map(sub => ({
      ...sub,
      id: sub.id,
      title: sub.title,
      name: sub.name || sub.title,
      parent: sub.parent,
      category_id: numericId,
      categoryId: numericId,
      image: formatImageUrl(sub.image, req),
      status: sub.status === 1 || sub.status === true
    }));

    const categoryData = {
      ...r,
      id: r.id,
      title: r.title,
      name: r.name || r.title,
      image: formatImageUrl(r.image, req),
      parent: r.parent === null ? 'None' : r.parent,
      status: r.status === 1 || r.status === true,
      subcategories: subs,
      sub_categories: subs,
      subCategories: subs
    };
    res.json({ success: true, data: categoryData, category: categoryData });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch category', error: error.message });
  }
});

// GET /:id/subcategories - Fetch subcategories for a given category ID
router.get('/:id/subcategories', async (req, res) => {
  const { id } = req.params;
  const numericId = id.startsWith('c') ? parseInt(id.slice(1)) : parseInt(id);
  if (isNaN(numericId)) {
    return res.status(400).json({ success: false, message: 'Invalid Category ID format' });
  }

  try {
    const [catRows] = await db.query('SELECT title, image FROM categories WHERE id = ?', [numericId]);
    if (catRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    const cat = catRows[0];
    const categoryTitle = cat.title;
    const catImg = formatImageUrl(cat.image, req);

    const [rows] = await db.query(
      'SELECT * FROM categories WHERE parent = ? OR parent = ? ORDER BY id ASC',
      [categoryTitle, String(numericId)]
    );

    let allServices = [];
    try {
      const [sRows] = await db.query("SELECT * FROM services ORDER BY id ASC");
      allServices = sRows;
    } catch (e) {
      allServices = [];
    }

    const mapped = rows.map(r => {
      const subIdStr = String(r.id).trim().toLowerCase();
      const subTitleLower = String(r.title || '').trim().toLowerCase();
      const parentCatIdStr = String(numericId);

      const matched = allServices.filter(s => {
        if (s.sub_category_id !== undefined && s.sub_category_id !== null && s.sub_category_id !== '') {
          if (String(s.sub_category_id).trim().toLowerCase() === subIdStr) return true;
        }
        if (s.sub_category && String(s.sub_category).trim().toLowerCase() === subTitleLower) {
          return true;
        }
        if (s.category_id && String(s.category_id).trim().toLowerCase() === subIdStr) {
          return true;
        }
        if (s.category_id && String(s.category_id).trim().toLowerCase() === parentCatIdStr) {
          const sTitleLower = String(s.title || s.name || '').toLowerCase();
          if (sTitleLower.includes(subTitleLower)) return true;
          const subWords = subTitleLower.split(/[\s,&]+/).filter(w => w.length > 3 && !['home', 'deep', 'cleaning', 'services'].includes(w));
          if (subWords.length > 0 && subWords.some(w => sTitleLower.includes(w))) {
            return true;
          }
        }
        return false;
      });

      const subImg = formatImageUrl(r.image, req);
      const servicesList = matched.map(s => {
        const priceVal = parseFloat(s.price) || 0;
        let cutPriceVal = s.cutPrice !== undefined && s.cutPrice !== null && s.cutPrice !== '' ? parseFloat(s.cutPrice) : priceVal;
        let discountVal = s.discount !== undefined && s.discount !== null && s.discount !== '' ? parseFloat(s.discount) : 0;
        if (!discountVal && cutPriceVal > priceVal) {
          discountVal = Math.round(((cutPriceVal - priceVal) / cutPriceVal) * 100);
        }

        let variantsArr = [];
        if (Array.isArray(s.variants)) {
          variantsArr = s.variants;
        } else if (typeof s.variants === 'string' && s.variants.trim()) {
          try { variantsArr = JSON.parse(s.variants); } catch (e) { variantsArr = []; }
        }

        const sId = String(s.id);
        const sTitle = s.title || s.name || '';

        return {
          id: sId,
          serviceId: sId,
          productDbId: sId,
          productId: s.productId || sTitle,
          title: sTitle,
          name: s.name || sTitle,
          serviceName: sTitle,
          description: s.description || `${sTitle} by professional experts with 100% satisfaction guarantee.`,
          image: formatImageUrl(s.image, req),
          price: priceVal,
          cutPrice: cutPriceVal,
          discount: discountVal,
          rating: s.rating !== null && s.rating !== undefined ? parseFloat(s.rating) : 4.8,
          reviewsCount: s.reviewsCount !== null && s.reviewsCount !== undefined ? parseInt(s.reviewsCount, 10) : 120,
          category: String(numericId),
          category_id: String(numericId),
          categoryId: String(numericId),
          subCategoryId: String(r.id),
          sub_category_id: String(r.id),
          subCategory: r.title,
          sub_category: r.title,
          status: (s.status === 1 || s.status === true || s.status === 'active' || s.status === '1') ? 'active' : 'inactive',
          hasVariants: s.hasVariants === true || s.hasVariants === 1 || false,
          variants: variantsArr
        };
      });

      return {
        id: String(r.id),
        subCategoryId: String(r.id),
        categoryId: String(numericId),
        category_id: numericId,
        name: r.title,
        title: r.title,
        subCategoryName: r.title,
        categoryName: categoryTitle,
        image: subImg,
        subCategoryImage: subImg,
        categoryImage: catImg,
        parent: categoryTitle,
        status: (r.status === 1 || r.status === true || r.status === 'active' || r.status === '1') ? 'active' : 'inactive',
        slug: r.slug,
        services: servicesList
      };
    });

    res.json({
      success: true,
      category: categoryTitle,
      categoryTitle: categoryTitle,
      categoryId: String(numericId),
      total: mapped.length,
      subcategories: mapped,
      data: mapped,
      result: mapped
    });
  } catch (error) {
    console.error('Error fetching subcategories:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch subcategories', error: error.message });
  }
});

// POST /:id/subcategories - Create subcategory for a given category ID
router.post('/:id/subcategories', async (req, res) => {
  const { id } = req.params;
  const numericId = id.startsWith('c') ? parseInt(id.slice(1)) : parseInt(id);
  if (isNaN(numericId)) {
    return res.status(400).json({ success: false, message: 'Invalid Category ID format' });
  }

  const titleVal = req.body.title || req.body.categoryName;
  const imageVal = req.body.image || '';
  const statusVal = req.body.status !== undefined ? req.body.status : true;
  
  if (!titleVal) {
    return res.status(400).json({ success: false, message: 'Subcategory Name (title) is required' });
  }

  try {
    const [parentRows] = await db.query('SELECT title FROM categories WHERE id = ?', [numericId]);
    if (parentRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Parent category not found' });
    }
    const parentTitle = parentRows[0].title;

    const statusInt = statusVal === true || statusVal === 1 || statusVal === 'true' ? 1 : 0;
    const slug = titleVal.trim().toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

    const [result] = await db.query(
      'INSERT INTO categories (title, slug, parent, image, status) VALUES (?, ?, ?, ?, ?)',
      [titleVal, slug, parentTitle, imageVal, statusInt]
    );

    clearCategoryCache();

    res.status(201).json({
      success: true,
      message: 'Subcategory created successfully',
      data: {
        id: result.insertId,
        title: titleVal,
        parent: parentTitle,
        category_id: numericId,
        categoryId: numericId,
        image: formatImageUrl(imageVal, req),
        status: statusInt === 1
      }
    });
  } catch (error) {
    console.error('Error creating subcategory:', error);
    res.status(500).json({ success: false, message: 'Failed to create subcategory', error: error.message });
  }
});

// PUT update category
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const numericId = id.startsWith('c') ? parseInt(id.slice(1)) : parseInt(id);
  if (isNaN(numericId)) {
    return res.status(400).json({ success: false, message: 'Invalid Category ID format' });
  }

  const titleVal = req.body.title || req.body.categoryName;
  const parentVal = req.body.parent || req.body.mainCategory;
  const imageVal = req.body.image;
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
      values.push(parentVal === 'None' || !parentVal ? null : parentVal);
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
      return res.json({ success: true, message: 'Update successful (no changes made)', data: rows[0] });
    }

    values.push(numericId);
    const query = `UPDATE categories SET ${fields.join(', ')} WHERE id = ?`;
    const [result] = await db.query(query, values);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    clearCategoryCache();

    // ✅ THE CORRECTION: Build the response object instantly from memory without a second DB query
    const updatedCategory = {
      id: numericId,
      title: titleVal !== undefined ? titleVal : null,
      parent: parentVal === 'None' || !parentVal ? 'None' : parentVal,
      image: imageVal !== undefined ? formatImageUrl(imageVal, req) : '',
      status: statusVal !== undefined ? (statusVal === true || statusVal === 1 || statusVal === 'true') : true
    };

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
    // Fetch category title first to perform programmatic cascade delete of sub-categories
    const [rows] = await db.query('SELECT title FROM categories WHERE id = ?', [numericId]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    const categoryTitle = rows[0].title;

    await Promise.all([
      db.query('DELETE FROM categories WHERE parent = ?', [categoryTitle]),
      db.query('DELETE FROM categories WHERE id = ?', [numericId])
    ]);

    clearCategoryCache();

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

    clearCategoryCache();

    const [rows] = await db.query('SELECT * FROM categories WHERE id = ?', [numericId]);
    res.json({
      success: true,
      message: `Category status updated to ${statusInt === 1 ? 'active' : 'inactive'}`,
      data: {
        ...rows[0],
        id: rows[0].id,
        parent: rows[0].parent === null ? 'None' : rows[0].parent,
        status: rows[0].status === 1
      }
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

    clearCategoryCache();

    const [rows] = await db.query('SELECT * FROM categories WHERE id = ?', [numericId]);
    res.json({
      success: true,
      message: `Category status updated to ${statusInt === 1 ? 'active' : 'inactive'}`,
      data: {
        ...rows[0],
        id: rows[0].id,
        parent: rows[0].parent === null ? 'None' : rows[0].parent,
        status: rows[0].status === 1
      }
    });
  } catch (error) {
    console.error('Error toggling category status:', error);
    res.status(500).json({ success: false, message: 'Failed to update status', error: error.message });
  }

});

module.exports = router;
