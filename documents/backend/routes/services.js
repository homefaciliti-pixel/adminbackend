const express = require('express');
const router = express.Router();
const db = require('../db');

// GET all services
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM services ORDER BY id DESC');
    const mapped = rows.map(r => ({
      ...r,
      price: parseFloat(r.price),
      status: r.status === 1
    }));
    res.json({
      success: true,
      data: mapped
    });
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch services', error: error.message });
  }
});

// POST create service
router.post('/', async (req, res) => {
  const { title, price, image, description, status } = req.body;
  if (!title || price === undefined || !description) {
    return res.status(400).json({ success: false, message: 'Title, Price, and Description are required' });
  }

  const priceFloat = parseFloat(price);
  const statusInt = status === true || status === 1 || status === 'true' ? 1 : 0;
  const imageVal = image || '';

  try {
    const [result] = await db.query(
      'INSERT INTO services (title, price, image, description, status) VALUES (?, ?, ?, ?, ?)',
      [title, priceFloat, imageVal, description, statusInt]
    );
    res.status(201).json({
      success: true,
      message: 'Service created successfully',
      data: {
        id: result.insertId,
        title,
        price: priceFloat,
        image: imageVal,
        description,
        status: statusInt === 1
      }
    });
  } catch (error) {
    console.error('Error creating service:', error);
    res.status(500).json({ success: false, message: 'Failed to create service', error: error.message });
  }
});

// PUT update service
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { title, price, image, description, status } = req.body;

  try {
    const fields = [];
    const values = [];

    if (title !== undefined) {
      fields.push('`title` = ?');
      values.push(title);
    }
    if (price !== undefined) {
      fields.push('`price` = ?');
      values.push(parseFloat(price));
    }
    if (image !== undefined) {
      fields.push('`image` = ?');
      values.push(image);
    }
    if (description !== undefined) {
      fields.push('`description` = ?');
      values.push(description);
    }
    if (status !== undefined) {
      fields.push('`status` = ?');
      values.push(status === true || status === 1 || status === 'true' ? 1 : 0);
    }

    if (fields.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    values.push(id);
    const query = `UPDATE services SET ${fields.join(', ')} WHERE id = ?`;
    const [result] = await db.query(query, values);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    // Retrieve updated service
    const [rows] = await db.query('SELECT * FROM services WHERE id = ?', [id]);
    res.json({
      success: true,
      message: 'Service updated successfully',
      data: {
        ...rows[0],
        price: parseFloat(rows[0].price),
        status: rows[0].status === 1
      }
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
    res.json({
      success: true,
      message: 'Service deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({ success: false, message: 'Failed to delete service', error: error.message });
  }
});

module.exports = router;
