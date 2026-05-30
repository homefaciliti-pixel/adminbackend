const express = require('express');
const router = express.Router();
const db = require('../db');

// GET all categories (with optional search/filtering)
router.get('/', async (req, res) => {
  try {
    const { title, categoryName, parent, mainCategory, status, emailStatus } = req.query;
    let query = 'SELECT * FROM categories WHERE 1=1';
    const params = [];

    const searchTitle = title || categoryName;
    if (searchTitle) {
      query += ' AND title LIKE ?';
      params.push(`%${searchTitle}%`);
    }

    const searchParent = parent || mainCategory;
    if (searchParent) {
      query += ' AND parent LIKE ?';
      params.push(`%${searchParent}%`);
    }

    const searchStatus = status !== undefined ? status : emailStatus;
    if (searchStatus !== undefined) {
      const statusInt = searchStatus === 'true' || searchStatus === '1' ? 1 : 0;
      query += ' AND status = ?';
      params.push(statusInt);
    }

    query += ' ORDER BY id DESC';
    const [rows] = await db.query(query, params);
    const mapped = rows.map(r => ({
      ...r,
      status: r.status === 1
    }));
    res.json({
      success: true,
      data: mapped
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch categories', error: error.message });
  }
});

// POST create category
router.post('/', async (req, res) => {
  const titleVal = req.body.title || req.body.categoryName;
  const parentVal = req.body.parent || req.body.mainCategory;
  const imageVal = req.body.image || '';
  const statusVal = req.body.status !== undefined ? req.body.status : req.body.emailStatus;
  
  if (!titleVal || !parentVal) {
    return res.status(400).json({ success: false, message: 'Category Name (title) and Main Category (parent) are required' });
  }
  
  const statusInt = statusVal === true || statusVal === 1 || statusVal === 'true' ? 1 : 0;

  try {
    const [result] = await db.query(
      'INSERT INTO categories (title, parent, image, status) VALUES (?, ?, ?, ?)',
      [titleVal, parentVal, imageVal, statusInt]
    );
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

// PUT update category
router.put('/:id', async (req, res) => {
  const { id } = req.params;
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
      values.push(parentVal);
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
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    values.push(id);
    const query = `UPDATE categories SET ${fields.join(', ')} WHERE id = ?`;
    const [result] = await db.query(query, values);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    // Retrieve updated category
    const [rows] = await db.query('SELECT * FROM categories WHERE id = ?', [id]);
    res.json({
      success: true,
      message: 'Category updated successfully',
      data: {
        ...rows[0],
        status: rows[0].status === 1
      }
    });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ success: false, message: 'Failed to update category', error: error.message });
  }
});

// DELETE category
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('DELETE FROM categories WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ success: false, message: 'Failed to delete category', error: error.message });
  }
});

module.exports = router;
