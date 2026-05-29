const express = require('express');
const router = express.Router();
const db = require('../db');

// GET all categories
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM categories ORDER BY id DESC');
    // Map status from TINYINT (0/1) to boolean for Flutter
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
  const { title, parent, image, status } = req.body;
  if (!title || !parent) {
    return res.status(400).json({ success: false, message: 'Title and Parent are required' });
  }
  
  // Status is boolean or int
  const statusInt = status === true || status === 1 || status === 'true' ? 1 : 0;
  const imageVal = image || '';

  try {
    const [result] = await db.query(
      'INSERT INTO categories (title, parent, image, status) VALUES (?, ?, ?, ?)',
      [title, parent, imageVal, statusInt]
    );
    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: {
        id: result.insertId,
        title,
        parent,
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
  const { title, parent, image, status } = req.body;
  
  try {
    // Build update query dynamically
    const fields = [];
    const values = [];

    if (title !== undefined) {
      fields.push('`title` = ?');
      values.push(title);
    }
    if (parent !== undefined) {
      fields.push('`parent` = ?');
      values.push(parent);
    }
    if (image !== undefined) {
      fields.push('`image` = ?');
      values.push(image);
    }
    if (status !== undefined) {
      fields.push('`status` = ?');
      values.push(status === true || status === 1 || status === 'true' ? 1 : 0);
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
