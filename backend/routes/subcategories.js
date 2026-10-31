const express = require('express');
const router = express.Router({ mergeParams: true });
const db = require('../db');

// In-memory cache map for subcategories (supports URL/filter based caching)
const subcategoryCache = new Map();
const SUBCATEGORY_CACHE_TTL = 30 * 1000; // 30 seconds TTL

function clearSubcategoryCache() {
  subcategoryCache.clear();
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

// Helper: build map of parent categories (id -> title & title -> id & id -> image)
async function getCategoryMaps(req) {
  try {
    const [rows] = await db.query("SELECT id, title, image FROM categories WHERE parent IS NULL OR parent = '' OR parent = 'None' OR parent = 'Main Category'");
    const idToTitle = {};
    const titleToId = {};
    const idToImage = {};
    rows.forEach(r => {
      idToTitle[r.id] = r.title;
      titleToId[r.title.toLowerCase()] = r.id;
      const formattedImg = formatImageUrl(r.image, req);
      idToImage[r.id] = formattedImg;
      idToImage[r.title.toLowerCase()] = formattedImg;
    });
    return { idToTitle, titleToId, idToImage, mainCategories: rows };
  } catch (err) {
    console.error('Error fetching category maps:', err.message);
    return { idToTitle: {}, titleToId: {}, idToImage: {}, mainCategories: [] };
  }
}

// Helper: format a single service item matching the user app requirements
function formatServiceItem(s, sub, resolvedCatId, req) {
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
    try {
      variantsArr = JSON.parse(s.variants);
    } catch (e) {
      variantsArr = [];
    }
  }

  const sId = String(s.id);
  const catIdStr = String(resolvedCatId || s.category_id || (sub ? (sub.categoryId || sub.category_id) : '') || '');
  const subIdStr = sub ? String(sub.id) : String(s.sub_category_id || '');
  const subTitle = sub ? (sub.title || sub.name) : (s.sub_category || '');
  const sTitle = s.title || s.name || '';

  return {
    id: sId,
    serviceId: sId,
    productDbId: sId,
    productId: s.productId || sTitle,
    title: sTitle,
    name: s.name || sTitle,
    serviceName: sTitle,
    description: s.description || '',
    image: formatImageUrl(s.image, req),
    price: priceVal,
    cutPrice: cutPriceVal,
    discount: discountVal,
    rating: s.rating !== null && s.rating !== undefined ? parseFloat(s.rating) : null,
    reviewsCount: s.reviewsCount !== null && s.reviewsCount !== undefined ? parseInt(s.reviewsCount, 10) : 0,
    category: catIdStr,
    category_id: catIdStr,
    categoryId: catIdStr,
    subCategoryId: subIdStr,
    sub_category_id: subIdStr,
    subCategory: subTitle,
    sub_category: subTitle,
    status: (s.status === 1 || s.status === true || s.status === 'active' || s.status === '1') ? 'active' : 'inactive',
    hasVariants: s.hasVariants === true || s.hasVariants === 1 || false,
    variants: variantsArr
  };
}

// Helper: match services belonging to a subcategory
function matchServicesForSubcategory(sub, resolvedCatId, allServices) {
  const subIdStr = String(sub.id).trim().toLowerCase();
  const subTitleLower = String(sub.title || '').trim().toLowerCase();

  return allServices.filter(s => {
    // Only match services actually linked to this subcategory in admin
    if (s.sub_category_id !== undefined && s.sub_category_id !== null && s.sub_category_id !== '') {
      if (String(s.sub_category_id).trim().toLowerCase() === subIdStr) return true;
    }
    if (s.sub_category && String(s.sub_category).trim().toLowerCase() === subTitleLower) {
      return true;
    }
    if (s.category_id && String(s.category_id).trim().toLowerCase() === subIdStr) {
      return true;
    }
    return false;
  });
}

// Helper: format a subcategory object with all aliases & nested services
function formatSubcategoryItem(r, matchedServices, idToTitle, titleToId, idToImage, req) {
  const rawParent = r.parent || '';
  const parentName = idToTitle[rawParent] || (titleToId[rawParent.toLowerCase()] ? rawParent : (idToTitle[parseInt(rawParent, 10)] || rawParent));
  const resolvedCatId = titleToId[parentName.toLowerCase()] || (parseInt(rawParent, 10) || null);
  const catIdStr = resolvedCatId ? String(resolvedCatId) : (rawParent ? String(rawParent) : '');
  const subIdStr = String(r.id);
  const subImg = formatImageUrl(r.image, req);
  const catImg = (idToImage && (idToImage[resolvedCatId] || idToImage[parentName.toLowerCase()])) || subImg;

  const servicesList = (matchedServices || []).map(s => formatServiceItem(s, r, resolvedCatId, req));

  return {
    id: subIdStr,
    subCategoryId: subIdStr,
    categoryId: catIdStr,
    category_id: resolvedCatId,
    name: r.title,
    title: r.title,
    subCategoryName: r.title,
    categoryName: parentName,
    image: subImg,
    subCategoryImage: subImg,
    categoryImage: catImg,
    parent: parentName,
    status: (r.status === 1 || r.status === true || r.status === 'active' || r.status === '1') ? 'active' : 'inactive',
    slug: r.slug,
    services: servicesList
  };
}

// -------------------------------------------------------------
// GET /api/subcategories or GET /api/categories/:id/subcategories
// Fetch all subcategories (optional filtering by category_id, parent, search, status)
// -------------------------------------------------------------
router.get('/', async (req, res) => {
  try {
    const cacheKey = req.originalUrl || req.url || 'default';
    if (subcategoryCache.has(cacheKey)) {
      const cached = subcategoryCache.get(cacheKey);
      if (Date.now() - cached.timestamp < SUBCATEGORY_CACHE_TTL) {
        return res.json(cached.data);
      }
    }

    const { category_id, categoryId, parent, category, categoryName, search, q, title, status } = req.query;
    const routeParentId = req.params && req.params.id ? req.params.id : undefined;

    const isFiltered = routeParentId !== undefined || category_id !== undefined || categoryId !== undefined || parent || category || categoryName || search || q || title || status !== undefined;

    const { idToTitle, titleToId, idToImage } = await getCategoryMaps(req);

    // Subcategories are categories where parent IS NOT NULL, not empty, not 'None', and not 'Main Category'
    let query = "SELECT * FROM categories WHERE parent IS NOT NULL AND parent != '' AND parent != 'None' AND parent != 'Main Category'";
    const params = [];

    // Filter by Parent Category ID (from route params or query)
    const catIdParam = routeParentId !== undefined ? routeParentId : (category_id !== undefined ? category_id : categoryId);
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
      const resolvedId = titleToId[parentParam.toLowerCase()];
      if (resolvedId) {
        query += " AND (parent LIKE ? OR parent = ?)";
        params.push(`%${parentParam}%`, String(resolvedId));
      } else {
        query += " AND parent LIKE ?";
        params.push(`%${parentParam}%`);
      }
    }

    // Search by Subcategory Title / Name
    const searchVal = search || q || title;
    if (searchVal) {
      query += " AND title LIKE ?";
      params.push(`%${searchVal}%`);
    }

    // Filter by Status
    if (status !== undefined) {
      const statusInt = (status === 'true' || status === '1' || status === true || status === 'active') ? 1 : 0;
      query += " AND status = ?";
      params.push(statusInt);
    }

    query += " ORDER BY id ASC";

    const [rows] = await db.query(query, params);

    // Fetch all services to nest under their respective subcategories
    let allServices = [];
    try {
      const [sRows] = await db.query("SELECT * FROM services ORDER BY id ASC");
      allServices = sRows;
    } catch (sErr) {
      console.error('Error fetching services for subcategories:', sErr.message);
    }

    const mapped = rows.map(r => {
      const rawParent = r.parent || '';
      const parentName = idToTitle[rawParent] || (titleToId[rawParent.toLowerCase()] ? rawParent : (idToTitle[parseInt(rawParent, 10)] || rawParent));
      const resolvedCatId = titleToId[parentName.toLowerCase()] || (parseInt(rawParent, 10) || null);
      const matched = matchServicesForSubcategory(r, resolvedCatId, allServices);
      return formatSubcategoryItem(r, matched, idToTitle, titleToId, idToImage, req);
    });



    // Determine parent category name for top level
    let topCategory = parentParam || null;
    if (!topCategory && catIdParam) {
      topCategory = idToTitle[parseInt(catIdParam, 10)] || null;
    }
    if (!topCategory && mapped.length > 0) {
      const firstParent = mapped[0].parent;
      const allSame = mapped.every(m => m.parent === firstParent);
      if (allSame) topCategory = firstParent;
    }

    const responsePayload = {
      success: true,
      category: topCategory || 'All Categories',
      total: mapped.length,
      subcategories: mapped
    };

    subcategoryCache.set(cacheKey, {
      timestamp: Date.now(),
      data: responsePayload
    });

    res.json(responsePayload);
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

  const cacheKey = `single_${numericId}`;
  if (subcategoryCache.has(cacheKey)) {
    const cached = subcategoryCache.get(cacheKey);
    if (Date.now() - cached.timestamp < SUBCATEGORY_CACHE_TTL) {
      return res.json(cached.data);
    }
  }

  try {
    const [rows] = await db.query("SELECT * FROM categories WHERE id = ? AND parent IS NOT NULL AND parent != '' AND parent != 'None' AND parent != 'Main Category'", [numericId]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Subcategory not found' });
    }

    const r = rows[0];
    const { idToTitle, titleToId, idToImage } = await getCategoryMaps(req);
    const rawParent = r.parent || '';
    const parentName = idToTitle[rawParent] || (titleToId[rawParent.toLowerCase()] ? rawParent : (idToTitle[parseInt(rawParent, 10)] || rawParent));
    const resolvedCatId = titleToId[parentName.toLowerCase()] || (parseInt(rawParent, 10) || null);

    let allServices = [];
    try {
      const [sRows] = await db.query("SELECT * FROM services ORDER BY id ASC");
      allServices = sRows;
    } catch (e) {
      allServices = [];
    }

    const matched = matchServicesForSubcategory(r, resolvedCatId, allServices);
    const data = formatSubcategoryItem(r, matched, idToTitle, titleToId, idToImage, req);

    const singlePayload = {
      success: true,
      category: parentName,
      data,
      subcategory: data
    };

    subcategoryCache.set(cacheKey, {
      timestamp: Date.now(),
      data: singlePayload
    });

    res.json(singlePayload);
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

  const cacheKey = `services_${numericId}`;
  if (subcategoryCache.has(cacheKey)) {
    const cached = subcategoryCache.get(cacheKey);
    if (Date.now() - cached.timestamp < SUBCATEGORY_CACHE_TTL) {
      return res.json(cached.data);
    }
  }

  try {
    const [subRows] = await db.query('SELECT * FROM categories WHERE id = ?', [numericId]);
    if (subRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Subcategory not found' });
    }

    const sub = subRows[0];
    const { idToTitle, titleToId } = await getCategoryMaps(req);
    const rawParent = sub.parent || '';
    const parentName = idToTitle[rawParent] || (titleToId[rawParent.toLowerCase()] ? rawParent : (idToTitle[parseInt(rawParent, 10)] || rawParent));
    const resolvedCatId = titleToId[parentName.toLowerCase()] || (parseInt(rawParent, 10) || null);

    let services = [];
    try {
      const [resDb] = await db.query(
        "SELECT * FROM services WHERE (sub_category_id = ? OR category_id = ? OR sub_category = ?) ORDER BY id ASC",
        [numericId, numericId, sub.title]
      );
      services = resDb;
    } catch (e) {
      try {
        const [resDb2] = await db.query(
          "SELECT * FROM services WHERE category_id = ? ORDER BY id ASC",
          [numericId]
        );
        services = resDb2;
      } catch (err2) {
        services = [];
      }
    }

    const mappedServices = services.map(s => formatServiceItem(s, sub, resolvedCatId, req));

    const servicesPayload = {
      success: true,
      category: parentName,
      subcategory: sub.title,
      subcategoryId: numericId,
      subcategoryTitle: sub.title,
      total: mappedServices.length,
      data: mappedServices,
      services: mappedServices
    };

    subcategoryCache.set(cacheKey, {
      timestamp: Date.now(),
      data: servicesPayload
    });

    res.json(servicesPayload);
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
  const parentVal = req.body.parent || req.body.category || req.body.mainCategory;
  const categoryIdVal = req.body.category_id !== undefined ? req.body.category_id : req.body.categoryId;
  const imageVal = req.body.image || req.body.subCategoryImage || '';
  const statusVal = req.body.status !== undefined ? req.body.status : true;

  if (!titleVal) {
    return res.status(400).json({ success: false, message: 'Subcategory title/name is required' });
  }

  try {
    const { idToTitle, titleToId, idToImage } = await getCategoryMaps(req);

    let finalParent = null;
    let finalCatId = null;

    if (categoryIdVal !== undefined && categoryIdVal !== null && categoryIdVal !== '') {
      const numericCatId = parseInt(categoryIdVal, 10);
      if (idToTitle[numericCatId]) {
        finalParent = idToTitle[numericCatId];
        finalCatId = numericCatId;
      } else {
        finalParent = String(categoryIdVal);
        finalCatId = numericCatId || null;
      }
    } else if (parentVal) {
      finalParent = parentVal;
      finalCatId = titleToId[parentVal.toLowerCase()] || (parseInt(parentVal, 10) || null);
    }

    if (!finalParent || finalParent === 'None' || finalParent === 'Main Category') {
      return res.status(400).json({
        success: false,
        message: 'A valid parent category (category_id or parent) is required for a subcategory'
      });
    }

    const statusInt = (statusVal === true || statusVal === 1 || statusVal === 'true' || statusVal === 'active') ? 1 : 0;
    const slug = titleVal.trim().toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

    const [result] = await db.query(
      'INSERT INTO categories (title, slug, parent, image, status) VALUES (?, ?, ?, ?, ?)',
      [titleVal.trim(), slug, finalParent, imageVal, statusInt]
    );

    clearSubcategoryCache();

    const createdSub = formatSubcategoryItem({
      id: result.insertId,
      title: titleVal.trim(),
      slug: slug,
      parent: finalParent,
      image: imageVal,
      status: statusInt
    }, [], idToTitle, titleToId, idToImage, req);

    res.status(201).json({
      success: true,
      message: 'Subcategory created successfully',
      data: createdSub,
      subcategory: createdSub
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
  const imageVal = req.body.image || req.body.subCategoryImage;
  const statusVal = req.body.status;

  try {
    let finalParent = parentVal;
    const { idToTitle, titleToId, idToImage } = await getCategoryMaps(req);
    if (categoryIdVal !== undefined && categoryIdVal !== null && categoryIdVal !== '') {
      finalParent = idToTitle[parseInt(categoryIdVal, 10)] || String(categoryIdVal);
    } else if (finalParent && !isNaN(parseInt(finalParent, 10)) && idToTitle[parseInt(finalParent, 10)]) {
      finalParent = idToTitle[parseInt(finalParent, 10)];
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
      values.push((statusVal === true || statusVal === 1 || statusVal === 'true' || statusVal === 'active') ? 1 : 0);
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

    let allServices = [];
    try {
      const [sRows] = await db.query("SELECT * FROM services ORDER BY id ASC");
      allServices = sRows;
    } catch (e) {
      allServices = [];
    }

    const rawParent = r.parent || '';
    const parentName = idToTitle[rawParent] || (titleToId[rawParent.toLowerCase()] ? rawParent : (idToTitle[parseInt(rawParent, 10)] || rawParent));
    const resolvedCatId = titleToId[parentName.toLowerCase()] || (parseInt(rawParent, 10) || null);
    const matched = matchServicesForSubcategory(r, resolvedCatId, allServices);
    const updatedData = formatSubcategoryItem(r, matched, idToTitle, titleToId, idToImage, req);

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
// -------------------------------------------------------------
// DELETE /api/subcategories/all or DELETE /api/subcategories
// Delete all subcategories
// -------------------------------------------------------------
const deleteAllSubcategoriesHandler = async (req, res) => {
  try {
    const [result] = await db.query(
      "DELETE FROM categories WHERE parent IS NOT NULL AND parent != '' AND parent != 'None' AND parent != 'Main Category'"
    );

    clearSubcategoryCache();

    res.json({
      success: true,
      message: `All subcategories deleted successfully (${result.affectedRows} removed)`,
      deletedCount: result.affectedRows
    });
  } catch (error) {
    console.error('Error deleting all subcategories:', error);
    res.status(500).json({ success: false, message: 'Failed to delete all subcategories', error: error.message });
  }
};

router.delete('/all', deleteAllSubcategoriesHandler);
router.delete('/', deleteAllSubcategoriesHandler);
router.post('/delete-all', deleteAllSubcategoriesHandler);

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
    const [rows] = await db.query("SELECT * FROM categories WHERE id = ? AND parent IS NOT NULL AND parent != '' AND parent != 'None' AND parent != 'Main Category'", [numericId]);
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

  const statusInt = (statusVal === true || statusVal === 1 || statusVal === 'true' || statusVal === 'active') ? 1 : 0;

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
        id: String(r.id),
        subCategoryId: String(r.id),
        title: r.title,
        name: r.title,
        parent: r.parent,
        status: statusInt === 1 ? 'active' : 'inactive'
      }
    });
  } catch (error) {
    console.error('Error toggling subcategory status:', error);
    res.status(500).json({ success: false, message: 'Failed to update status', error: error.message });
  }
};

router.put('/:id/status', toggleStatusHandler);
router.patch('/:id/status', toggleStatusHandler);

router.clearSubcategoryCache = clearSubcategoryCache;

module.exports = router;
