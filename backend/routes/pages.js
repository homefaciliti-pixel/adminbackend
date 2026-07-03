const express = require('express');
const router = express.Router();
const db = require('../db');

// Auto-create pages table if it doesn't exist (handles remote DB where node_pages may be missing)
async function seedPages() {
  try {
    // Ensure the table exists (safe for both local and remote DB)
    await db.query(`
      CREATE TABLE IF NOT EXISTS \`pages\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`title\` VARCHAR(255) NOT NULL,
        \`description\` TEXT NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Seed default pages if table is empty
    const [existing] = await db.query('SELECT COUNT(*) as cnt FROM pages');
    if (existing[0].cnt === 0) {
      await db.query(`
        INSERT INTO pages (title, description) VALUES
        ('About Us', 'We provide the best on-demand home services including cleaning, plumbing, AC repair, and electrical work right at your doorstep.'),
        ('Terms and Conditions', 'Please read these terms carefully. By using our services you agree to comply with all safety and payment guidelines.'),
        ('Privacy Policy', 'We value your privacy. We collect your location and contact details only to provide services and we never share them with third parties.'),
        ('Refund and Cancellation Policy', 'We offer a full refund if the service request is cancelled at least 24 hours before the scheduled time slot. For cancellations within 24 hours, a processing fee may apply.')
      `);
      console.log('✅ Seeded 4 default pages.');
    } else {
      // Ensure Refund page exists even in non-empty table
      const [rows] = await db.query("SELECT id FROM pages WHERE title LIKE '%Refund%'");
      if (rows.length === 0) {
        await db.query(
          "INSERT INTO pages (title, description) VALUES ('Refund and Cancellation Policy', 'We offer a full refund if the service request is cancelled at least 24 hours before the scheduled time slot. For cancellations within 24 hours, a processing fee may apply.')"
        );
        console.log('✅ Seeded Refund & Cancellation Policy page.');
      }
    }
  } catch (error) {
    console.error('Error seeding pages:', error.message);
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

// GET single page by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM pages WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Page not found' });
    }
    res.json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    console.error('Error fetching page:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch page', error: error.message });
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
