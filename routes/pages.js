const express = require('express');
const router = express.Router();
const db = require('../db');

// Automatically seed Refund and Cancellation Policy page if it doesn't exist
async function seedPages() {
  try {
    const [rows] = await db.query("SELECT * FROM pages WHERE title = 'Refund and Cancellation Policy' OR title = 'Refund and Cancellation'");
    if (rows.length === 0) {
      await db.query(
        "INSERT INTO pages (title, description) VALUES ('Refund and Cancellation Policy', 'We offer a full refund if the service request is cancelled at least 24 hours before the scheduled time slot. For cancellations within 24 hours, a processing fee may apply.')"
      );
      console.log('✅ Seeded Refund & Cancellation Policy page.');
    }
  } catch (error) {
    console.error('Error seeding pages:', error);
  }
}
seedPages();

// GET all pages
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM pages ORDER BY id DESC');
    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('Error fetching pages:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch pages', error: error.message });
  }
});

// POST create page
router.post('/', async (req, res) => {
  const { title, description } = req.body;
  if (!title || !description) {
    return res.status(400).json({ success: false, message: 'Title and Description are required' });
  }
  try {
    const [result] = await db.query(
      'INSERT INTO pages (title, description) VALUES (?, ?)',
      [title, description]
    );
    res.status(201).json({
      success: true,
      message: 'Page created successfully',
      data: {
        id: result.insertId,
        title,
        description
      }
    });
  } catch (error) {
    console.error('Error creating page:', error);
    res.status(500).json({ success: false, message: 'Failed to create page', error: error.message });
  }
});

// PUT update page
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { title, description } = req.body;

  try {
    const fields = [];
    const values = [];

    if (title !== undefined) {
      fields.push('`title` = ?');
      values.push(title);
    }
    if (description !== undefined) {
      fields.push('`description` = ?');
      values.push(description);
    }

    if (fields.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    values.push(id);
    const query = `UPDATE pages SET ${fields.join(', ')} WHERE id = ?`;
    const [result] = await db.query(query, values);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Page not found' });
    }

    // Retrieve updated page
    const [rows] = await db.query('SELECT * FROM pages WHERE id = ?', [id]);
    res.json({
      success: true,
      message: 'Page updated successfully',
      data: rows[0]
    });
  } catch (error) {
    console.error('Error updating page:', error);
    res.status(500).json({ success: false, message: 'Failed to update page', error: error.message });
  }
});

// DELETE page
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('DELETE FROM pages WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Page not found' });
    }
    res.json({
      success: true,
      message: 'Page deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting page:', error);
    res.status(500).json({ success: false, message: 'Failed to delete page', error: error.message });
  }
});

module.exports = router;
