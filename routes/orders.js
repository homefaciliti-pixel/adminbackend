const express = require('express');
const router = express.Router();
const db = require('../db');

// GET all orders
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM orders ORDER BY id DESC');
    const mapped = rows.map(r => ({
      ...r,
      serviceAmount: parseFloat(r.serviceAmount)
    }));
    res.json({
      success: true,
      data: mapped
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch orders', error: error.message });
  }
});

// POST create order
router.post('/', async (req, res) => {
  const { 
    serviceRequestNumber, 
    serviceName, 
    serviceAmount, 
    slotTime, 
    serviceDate, 
    city, 
    locality, 
    status, 
    vendorName, 
    address, 
    createdAt 
  } = req.body;

  if (!serviceRequestNumber || !serviceName || serviceAmount === undefined || !slotTime || !serviceDate || !city || !locality || !status || !address) {
    return res.status(400).json({ success: false, message: 'Missing required order fields' });
  }

  const amt = parseFloat(serviceAmount);
  const vName = vendorName || '-';
  const cTime = createdAt || new Date().toLocaleString();

  try {
    const [result] = await db.query(
      `INSERT INTO orders 
      (serviceRequestNumber, serviceName, serviceAmount, slotTime, serviceDate, city, locality, status, vendorName, address, createdAt) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [serviceRequestNumber, serviceName, amt, slotTime, serviceDate, city, locality, status, vName, address, cTime]
    );

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: {
        id: result.insertId,
        serviceRequestNumber,
        serviceName,
        serviceAmount: amt,
        slotTime,
        serviceDate,
        city,
        locality,
        status,
        vendorName: vName,
        address,
        createdAt: cTime
      }
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ success: false, message: 'Failed to create order', error: error.message });
  }
});

// PUT update order (e.g. status, vendor)
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { status, vendorName, slotTime, serviceDate, city, locality, address } = req.body;

  try {
    const fields = [];
    const values = [];

    if (status !== undefined) {
      fields.push('`status` = ?');
      values.push(status);
    }
    if (vendorName !== undefined) {
      fields.push('`vendorName` = ?');
      values.push(vendorName);
    }
    if (slotTime !== undefined) {
      fields.push('`slotTime` = ?');
      values.push(slotTime);
    }
    if (serviceDate !== undefined) {
      fields.push('`serviceDate` = ?');
      values.push(serviceDate);
    }
    if (city !== undefined) {
      fields.push('`city` = ?');
      values.push(city);
    }
    if (locality !== undefined) {
      fields.push('`locality` = ?');
      values.push(locality);
    }
    if (address !== undefined) {
      fields.push('`address` = ?');
      values.push(address);
    }

    if (fields.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    values.push(id);
    const query = `UPDATE orders SET ${fields.join(', ')} WHERE id = ?`;
    const [result] = await db.query(query, values);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Retrieve updated order
    const [rows] = await db.query('SELECT * FROM orders WHERE id = ?', [id]);
    res.json({
      success: true,
      message: 'Order updated successfully',
      data: {
        ...rows[0],
        serviceAmount: parseFloat(rows[0].serviceAmount)
      }
    });
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ success: false, message: 'Failed to update order', error: error.message });
  }
});

// DELETE order
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('DELETE FROM orders WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    res.json({
      success: true,
      message: 'Order deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ success: false, message: 'Failed to delete order', error: error.message });
  }
});

module.exports = router;
