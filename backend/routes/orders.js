const express = require('express');
const router = express.Router();
const db = require('../db');

// ─────────────────────────────────────────────
// TABLE: node_orders_v2
// Columns: id, userPhone, serviceName, price, date, status, bookingStatus,
//          partnerName, partnerDistance, productId, description, timeSlot,
//          address (JSON), payment (JSON), razorpayOrderId, razorpayPaymentId, createdAt
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

// Helper: Parse address JSON safely
function parseAddr(order) {
  try {
    return typeof order.address === 'string' ? JSON.parse(order.address) : (order.address || {});
  } catch (e) {
    return {};
  }
}

// Helper: Parse payment JSON safely
function parsePayment(order) {
  try {
    return typeof order.payment === 'string' ? JSON.parse(order.payment) : (order.payment || {});
  } catch (e) {
    return {};
  }
}

// Helper: Map node_orders_v2 row → admin API response
function mapOrder(row) {
  const addr = parseAddr(row);
  const pay = parsePayment(row);
  return {
    id: row.id,
    serviceRequestNumber: row.id.toString(),
    serviceName: row.serviceName,
    serviceAmount: parseFloat(row.price || 0),
    slotTime: row.timeSlot,
    serviceDate: row.date,
    status: row.status,
    bookingStatus: row.bookingStatus,
    vendorName: row.partnerName || '-',
    vendorMobile: '',
    address: addr.houseNo
      ? `${addr.houseNo}, ${addr.society || ''}, ${addr.floor ? 'Floor ' + addr.floor + ', ' : ''}${addr.locality || ''}, ${addr.city || ''} ${addr.pincode || ''}`.replace(/,\s*,/g, ',').trim()
      : (typeof row.address === 'string' ? row.address : ''),
    city: addr.city || '',
    locality: addr.locality || '',
    latitude: addr.latitude ? addr.latitude.toString() : null,
    longitude: addr.longitude ? addr.longitude.toString() : null,
    customerName: addr.name || '',
    customerPhone: row.userPhone || '',
    paymentMethod: pay.paymentMethod || '',
    amountPaid: pay.amountPaid || 0,
    createdAt: row.createdAt
  };
}

// Helper: Resolve partner name from phone (looks up `partners` table)
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
// GET /api/orders  — List all orders (admin)
// ─────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM node_orders_v2 ORDER BY id DESC');
    res.json({ success: true, data: rows.map(mapOrder) });
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
    const [rows] = await db.query('SELECT * FROM node_orders_v2 WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    res.json({ success: true, data: mapOrder(rows[0]) });
  } catch (error) {
    console.error('Error fetching order details:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch order details', error: error.message });
  }
});

// ─────────────────────────────────────────────
// PUT /api/orders/:id  — Update order (status, vendorName, etc.)
// ─────────────────────────────────────────────
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { status, vendorName } = req.body;

  try {
    const fields = [];
    const values = [];

    if (status !== undefined) {
      fields.push('`status` = ?');
      values.push(status);
      // Also update bookingStatus to match
      const bs = status.toLowerCase() === 'assigned' ? 'assigned'
        : status.toLowerCase() === 'completed' ? 'completed'
        : status.toLowerCase() === 'cancelled' ? 'cancelled'
        : status.toLowerCase() === 'in progress' ? 'in_progress'
        : 'searching';
      fields.push('`bookingStatus` = ?');
      values.push(bs);
    }

    if (vendorName !== undefined) {
      const resolvedName = (vendorName === '' || vendorName === '-') ? null : vendorName;
      fields.push('`partnerName` = ?');
      values.push(resolvedName);
    }

    if (fields.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    values.push(id);
    const [result] = await db.query(`UPDATE node_orders_v2 SET ${fields.join(', ')} WHERE id = ?`, values);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const [rows] = await db.query('SELECT * FROM node_orders_v2 WHERE id = ?', [id]);
    res.json({ success: true, message: 'Order updated successfully', data: mapOrder(rows[0]) });
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ success: false, message: 'Failed to update order', error: error.message });
  }
});

// ─────────────────────────────────────────────
// DELETE /api/orders/:id  — Delete order
// ─────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('DELETE FROM node_orders_v2 WHERE id = ?', [id]);
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

  let dbPartnerName;
  try {
    dbPartnerName = await resolveVendorName(vendorName, vendorPhone, phone, mobile);
  } catch (err) {
    return res.status(404).json({ success: false, message: err.message });
  }

  const newStatus = dbPartnerName === null ? 'Pending' : 'Assigned';
  const newBookingStatus = dbPartnerName === null ? 'searching' : 'assigned';

  try {
    const [result] = await db.query(
      'UPDATE node_orders_v2 SET partnerName = ?, status = ?, bookingStatus = ? WHERE id = ?',
      [dbPartnerName, newStatus, newBookingStatus, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const [rows] = await db.query('SELECT * FROM node_orders_v2 WHERE id = ?', [id]);
    res.json({
      success: true,
      message: dbPartnerName === null ? 'Order unassigned successfully' : `Order assigned to ${dbPartnerName} successfully`,
      data: mapOrder(rows[0])
    });
  } catch (error) {
    console.error('Error assigning order:', error);
    res.status(500).json({ success: false, message: 'Failed to assign order', error: error.message });
  }
});

// ─────────────────────────────────────────────
// POST /api/orders  — Create new order (from admin or user app)
// Supports auto-assign to nearest active, approved, paid partner within 5/10 km
// ─────────────────────────────────────────────
router.post('/', async (req, res) => {
  const {
    serviceName,
    serviceAmount,
    slotTime,
    serviceDate,
    status,
    vendorName,
    address,
    userPhone,
    latitude,
    longitude,
    lat,
    lon,
    lng,
    createdAt
  } = req.body;

  if (!serviceName || serviceAmount === undefined || !slotTime || !serviceDate || !address) {
    return res.status(400).json({ success: false, message: 'Missing required order fields' });
  }

  const amt = parseFloat(serviceAmount);
  let dbPartnerName = (!vendorName || vendorName === '-') ? null : vendorName;
  let assignedStatus = status || 'Pending';

  const orderLat = parseFloat(latitude || lat);
  const orderLon = parseFloat(longitude || lon || lng);
  const hasCoords = !isNaN(orderLat) && !isNaN(orderLon);

  // Build address JSON
  const addrJson = typeof address === 'object' ? JSON.stringify(address) : address;

  const cTime = createdAt || Date.now();

  try {
    // Auto-assign if no vendor specified and coordinates available
    if (hasCoords && !dbPartnerName) {
      const [partners] = await db.query(
        'SELECT id, name, mobile, services, category, latitude, longitude FROM partners WHERE status = 1 AND isApproved = 1 AND isPaid = 1'
      );

      const orderService = serviceName.toLowerCase().trim();
      const eligible = [];

      for (const partner of partners) {
        const partnerServices = (partner.services || '').toLowerCase().split(',').map(s => s.trim());
        const partnerCategory = (partner.category || '').toLowerCase().trim();
        const qualified = partnerServices.includes(orderService) ||
                          partnerCategory === orderService ||
                          orderService.includes(partnerCategory) ||
                          partnerCategory.includes(orderService);

        if (qualified && partner.latitude && partner.longitude) {
          const pLat = parseFloat(partner.latitude);
          const pLon = parseFloat(partner.longitude);
          if (!isNaN(pLat) && !isNaN(pLon)) {
            const dist = getDistance(orderLat, orderLon, pLat, pLon);
            eligible.push({ partner, dist });
          }
        }
      }

      if (eligible.length > 0) {
        let matches = eligible.filter(p => p.dist <= 5);
        if (matches.length === 0) matches = eligible.filter(p => p.dist <= 10);
        if (matches.length > 0) {
          matches.sort((a, b) => a.dist - b.dist);
          dbPartnerName = matches[0].partner.name;
          assignedStatus = 'Assigned';
          console.log(`[Auto-Assign] Order auto-assigned to ${dbPartnerName} at ${matches[0].dist.toFixed(2)} km`);
        }
      }
    }

    const bookingStatus = assignedStatus === 'Assigned' ? 'assigned' : 'searching';

    const [result] = await db.query(
      `INSERT INTO node_orders_v2 (userPhone, serviceName, price, date, status, bookingStatus, partnerName, address, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userPhone || '', serviceName, amt, serviceDate, assignedStatus, bookingStatus, dbPartnerName, addrJson, cTime]
    );

    const [rows] = await db.query('SELECT * FROM node_orders_v2 WHERE id = ?', [result.insertId]);
    res.status(201).json({ success: true, message: 'Order created successfully', data: mapOrder(rows[0]) });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ success: false, message: 'Failed to create order', error: error.message });
  }
});

module.exports = router;
