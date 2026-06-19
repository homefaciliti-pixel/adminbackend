const express = require('express');
const router = express.Router();
const db = require('../db');

// ─────────────────────────────────────────────
// NOTE: db.js auto-prefixes table names with "node_"
// So writing 'orders'  → queries 'node_orders'  (admin panel orders)
//    writing 'partners' → queries 'node_partners' (but we use 'partners' table)
// node_orders schema: id, serviceRequestNumber, serviceName, serviceAmount,
//   slotTime, serviceDate, city, locality, status, vendorName, vendorMobile,
//   address, createdAt, paymentMethod, latitude, longitude
// ─────────────────────────────────────────────

// Helper: Haversine distance in km
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Helper: Resolve partner name from phone number
async function resolveVendorName(vendorName, vendorPhone, phone, mobile) {
  let targetPhone = vendorPhone || phone || mobile;
  let lookupName = vendorName || '';

  if (!targetPhone && lookupName && /^\+?\d{10,15}$/.test(String(lookupName).trim())) {
    targetPhone = String(lookupName).trim();
  }

  if (targetPhone) {
    const [partners] = await db.query('SELECT name FROM partners WHERE mobile = ?', [targetPhone]);
    if (partners.length === 0) {
      throw new Error(`No partner found with phone number: ${targetPhone}`);
    }
    return partners[0].name;
  }

  return (lookupName === '' || lookupName === '-') ? null : lookupName;
}

// ─────────────────────────────────────────────
// GET /api/orders  — List all orders (admin panel)
// ─────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM orders ORDER BY id DESC');
    const mapped = rows.map(r => ({
      ...r,
      vendorName: r.vendorName === null ? '-' : r.vendorName,
      serviceAmount: parseFloat(r.serviceAmount)
    }));
    res.json({ success: true, data: mapped });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch orders', error: error.message });
  }
});

// ─────────────────────────────────────────────
// GET /api/orders/:id  — Single order detail
// ─────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM orders WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    res.json({
      success: true,
      data: {
        ...rows[0],
        vendorName: rows[0].vendorName === null ? '-' : rows[0].vendorName,
        serviceAmount: parseFloat(rows[0].serviceAmount)
      }
    });
  } catch (error) {
    console.error('Error fetching order details:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch order details', error: error.message });
  }
});

// ─────────────────────────────────────────────
// PUT /api/orders/:id  — Update order fields
// ─────────────────────────────────────────────
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

    const hasVendorUpdate = (vendorName !== undefined || req.body.vendorPhone !== undefined || req.body.phone !== undefined || req.body.mobile !== undefined);
    if (hasVendorUpdate) {
      let resolvedName;
      try {
        resolvedName = await resolveVendorName(vendorName, req.body.vendorPhone, req.body.phone, req.body.mobile);
      } catch (err) {
        return res.status(404).json({ success: false, message: err.message });
      }
      fields.push('`vendorName` = ?');
      values.push(resolvedName);
    }

    if (slotTime !== undefined) { fields.push('`slotTime` = ?'); values.push(slotTime); }
    if (serviceDate !== undefined) { fields.push('`serviceDate` = ?'); values.push(serviceDate); }
    if (city !== undefined) { fields.push('`city` = ?'); values.push(city); }
    if (locality !== undefined) { fields.push('`locality` = ?'); values.push(locality); }
    if (address !== undefined) { fields.push('`address` = ?'); values.push(address); }

    if (fields.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    values.push(id);
    const [result] = await db.query(`UPDATE orders SET ${fields.join(', ')} WHERE id = ?`, values);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const [rows] = await db.query('SELECT * FROM orders WHERE id = ?', [id]);
    res.json({
      success: true,
      message: 'Order updated successfully',
      data: {
        ...rows[0],
        vendorName: rows[0].vendorName === null ? '-' : rows[0].vendorName,
        serviceAmount: parseFloat(rows[0].serviceAmount)
      }
    });
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ success: false, message: 'Failed to update order', error: error.message });
  }
});

// ─────────────────────────────────────────────
// DELETE /api/orders/:id
// ─────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('DELETE FROM orders WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    res.json({ success: true, message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ success: false, message: 'Failed to delete order', error: error.message });
  }
});

// ─────────────────────────────────────────────
// PUT /api/orders/:id/assign  — Admin assigns order to a partner
// Accepts: { vendorName } OR { vendorPhone / phone / mobile }
// ─────────────────────────────────────────────
router.put('/:id/assign', async (req, res) => {
  const { id } = req.params;
  const { vendorName, vendorPhone, phone, mobile } = req.body;

  let dbVendorName;
  try {
    dbVendorName = await resolveVendorName(vendorName, vendorPhone, phone, mobile);
  } catch (err) {
    return res.status(404).json({ success: false, message: err.message });
  }

  const newStatus = dbVendorName === null ? 'Pending' : 'Assigned';

  try {
    const [result] = await db.query(
      'UPDATE orders SET vendorName = ?, status = ? WHERE id = ?',
      [dbVendorName, newStatus, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const [rows] = await db.query('SELECT * FROM orders WHERE id = ?', [id]);
    res.json({
      success: true,
      message: dbVendorName === null ? 'Order unassigned successfully' : `Order assigned to ${dbVendorName} successfully`,
      data: {
        ...rows[0],
        vendorName: rows[0].vendorName === null ? '-' : rows[0].vendorName,
        serviceAmount: parseFloat(rows[0].serviceAmount)
      }
    });
  } catch (error) {
    console.error('Error assigning order:', error);
    res.status(500).json({ success: false, message: 'Failed to assign order', error: error.message });
  }
});

// ─────────────────────────────────────────────
// POST /api/orders  — Create new order with optional auto-assign
// ─────────────────────────────────────────────
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
    createdAt,
    latitude,
    longitude,
    lat,
    lon,
    lng
  } = req.body;

  if (!serviceRequestNumber || !serviceName || serviceAmount === undefined || !slotTime || !serviceDate || !city || !locality || !status || !address) {
    return res.status(400).json({ success: false, message: 'Missing required order fields' });
  }

  const amt = parseFloat(serviceAmount);
  const rawVendorName = vendorName || '-';
  let dbVendorName = rawVendorName === '-' ? null : rawVendorName;
  let dbVendorMobile = req.body.vendorMobile || req.body.vendorPhone || null;
  let assignedStatus = status;

  const orderLat = parseFloat(latitude || lat);
  const orderLon = parseFloat(longitude || lon || lng);
  const hasCoordinates = !isNaN(orderLat) && !isNaN(orderLon);

  const cTime = createdAt || new Date().toLocaleString();

  try {
    // Auto-assign to nearest active, approved, paid partner within 5/10 km
    if (hasCoordinates && !dbVendorName) {
      const [partners] = await db.query(
        'SELECT id, name, mobile, services, category, latitude, longitude FROM partners WHERE status = 1 AND isApproved = 1 AND isPaid = 1'
      );

      const orderService = serviceName.toLowerCase().trim();
      const eligiblePartners = [];

      for (const partner of partners) {
        const partnerServices = (partner.services || '').toLowerCase().split(',').map(s => s.trim());
        const partnerCategory = (partner.category || '').toLowerCase().trim();
        const isQualified = partnerServices.includes(orderService) ||
                            partnerCategory === orderService ||
                            orderService.includes(partnerCategory) ||
                            partnerCategory.includes(orderService);

        if (isQualified && partner.latitude && partner.longitude) {
          const pLat = parseFloat(partner.latitude);
          const pLon = parseFloat(partner.longitude);
          if (!isNaN(pLat) && !isNaN(pLon)) {
            const distance = getDistance(orderLat, orderLon, pLat, pLon);
            eligiblePartners.push({ partner, distance });
          }
        }
      }

      if (eligiblePartners.length > 0) {
        let matches = eligiblePartners.filter(p => p.distance <= 5);
        if (matches.length === 0) matches = eligiblePartners.filter(p => p.distance <= 10);
        if (matches.length > 0) {
          matches.sort((a, b) => a.distance - b.distance);
          const assigned = matches[0].partner;
          dbVendorName = assigned.name;
          dbVendorMobile = assigned.mobile;
          assignedStatus = 'Assigned';
          console.log(`[Auto-Assign] Order ${serviceRequestNumber} → ${dbVendorName} at ${matches[0].distance.toFixed(2)} km`);
        }
      }
    }

    const [result] = await db.query(
      `INSERT INTO orders 
      (serviceRequestNumber, serviceName, serviceAmount, slotTime, serviceDate, city, locality, status, vendorName, vendorMobile, address, createdAt, latitude, longitude)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        serviceRequestNumber, serviceName, amt, slotTime, serviceDate,
        city, locality, assignedStatus, dbVendorName, dbVendorMobile,
        address, cTime,
        hasCoordinates ? orderLat.toString() : null,
        hasCoordinates ? orderLon.toString() : null
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: {
        id: result.insertId,
        serviceRequestNumber, serviceName,
        serviceAmount: amt, slotTime, serviceDate,
        city, locality,
        status: assignedStatus,
        vendorName: dbVendorName || '-',
        vendorMobile: dbVendorMobile,
        address, createdAt: cTime,
        latitude: hasCoordinates ? orderLat.toString() : null,
        longitude: hasCoordinates ? orderLon.toString() : null
      }
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ success: false, message: 'Failed to create order', error: error.message });
  }
});

module.exports = router;
