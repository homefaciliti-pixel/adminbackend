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

// Helper: Get all orders from admin, v2 (live app), and Laravel tables
async function getAllOrders(req) {
  const dbName = process.env.DB_NAME || 'homef4fw_homefaci';

  // Fetch partners map to match partner name -> partner mobile
  const [partners] = await db.query('SELECT id, name, mobile FROM partners');
  const partnerMobileMap = {};
  const partnerNameMap = {};
  partners.forEach(p => {
    partnerMobileMap[p.name] = p.mobile;
    partnerNameMap[p.id] = p.name;
  });

  // Fetch Laravel partners map
  const [laravelPartners] = await db.query(`SELECT id, name, mobile_number FROM \`${dbName}\`.\`users\` WHERE role_id = 2`);
  const laravelPartnerMobileMap = {};
  const laravelPartnerNameMap = {};
  laravelPartners.forEach(p => {
    laravelPartnerMobileMap[p.id] = p.mobile_number;
    laravelPartnerNameMap[p.id] = p.name;
  });

  // 1. Fetch from node_orders (Admin Panel manually created orders)
  const [nodeOrders] = await db.query('SELECT * FROM orders');
  const list = [];
  nodeOrders.forEach(r => {
    list.push({
      id: r.id,
      serviceRequestNumber: r.serviceRequestNumber || `REQ-${r.id}`,
      serviceName: r.serviceName || '',
      serviceAmount: parseFloat(r.serviceAmount || 0),
      slotTime: r.slotTime || '',
      serviceDate: r.serviceDate || '',
      city: r.city || '',
      locality: r.locality || '',
      status: r.status || 'Pending',
      vendorName: r.vendorName || '-',
      vendorMobile: r.vendorMobile || '',
      address: r.address || '',
      createdAt: r.createdAt || '',
      paymentMethod: r.paymentMethod || 'COD',
      latitude: r.latitude,
      longitude: r.longitude,
      source: 'Admin Panel (MySQL)'
    });
  });

  // 2. Fetch from node_orders_v2 (Live orders from Flutter apps)
  const [nodeV2Orders] = await db.query('SELECT * FROM node_orders_v2');
  nodeV2Orders.forEach(r => {
    let addrObj = {};
    try {
      addrObj = JSON.parse(r.address || '{}');
    } catch (e) {}

    let payObj = {};
    try {
      payObj = JSON.parse(r.payment || '{}');
    } catch (e) {}

    const fullAddr = addrObj.houseNo 
      ? `${addrObj.houseNo}, ${addrObj.society || ''}, ${addrObj.locality || ''}, ${addrObj.city || ''}`.replace(/,\s*,/g, ',').trim()
      : (r.address || '');

    const createdStr = r.createdAt 
      ? new Date(r.createdAt).toLocaleString('en-US') 
      : '';

    list.push({
      id: r.id + 2000000000, // Offset by 2 billion
      serviceRequestNumber: r.id.toString(),
      serviceName: r.serviceName || '',
      serviceAmount: parseFloat(r.price || 0),
      slotTime: r.timeSlot || '',
      serviceDate: r.date || '',
      city: addrObj.city || '',
      locality: addrObj.locality || '',
      status: r.status || 'Pending',
      vendorName: r.partnerName || '-',
      vendorMobile: partnerMobileMap[r.partnerName] || '',
      address: fullAddr,
      createdAt: createdStr,
      paymentMethod: payObj.paymentMethod || 'COD',
      latitude: addrObj.latitude ? parseFloat(addrObj.latitude) : null,
      longitude: addrObj.longitude ? parseFloat(addrObj.longitude) : null,
      source: 'User App (MySQL v2)'
    });
  });

  // 3. Fetch from Laravel orders
  const [laravelOrders] = await db.query(`
    SELECT 
      oi.id, 
      oi.service_request_number, 
      oi.service_name, 
      oi.total_amount, 
      oi.time_slot, 
      oi.service_date, 
      oi.status, 
      oi.vendor_id, 
      oi.created_at, 
      o.address,
      o.payment_method
    FROM \`${dbName}\`.\`order_items\` oi
    LEFT JOIN \`${dbName}\`.\`orders\` o ON oi.order_id = o.id
  `);
  laravelOrders.forEach(r => {
    const createdStr = r.created_at 
      ? new Date(r.created_at).toLocaleString('en-US') 
      : '';
    const dateStr = r.service_date
      ? new Date(r.service_date).toLocaleDateString('en-IN')
      : '';

    list.push({
      id: r.id + 10000000, // Offset by 10 million
      serviceRequestNumber: r.service_request_number || `REQ-LA-${r.id}`,
      serviceName: r.service_name || '',
      serviceAmount: parseFloat(r.total_amount || 0),
      slotTime: r.time_slot || '',
      serviceDate: dateStr,
      city: '',
      locality: '',
      status: r.status || 'Pending',
      vendorName: laravelPartnerNameMap[r.vendor_id] || '-',
      vendorMobile: laravelPartnerMobileMap[r.vendor_id] || '',
      address: r.address || '',
      createdAt: createdStr,
      paymentMethod: r.payment_method || 'COD',
      latitude: null,
      longitude: null,
      source: 'App User (Laravel)'
    });
  });

  // Sort by ID descending (which translates to sorting by booking timeline)
  list.sort((a, b) => b.id - a.id);

  return list;
}

// ─────────────────────────────────────────────
// GET /api/orders  — List all orders (admin panel)
// ─────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const list = await getAllOrders(req);
    res.json({ success: true, data: list });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch orders', error: error.message });
  }
});

// ─────────────────────────────────────────────
// GET /api/orders/:id  — Single order detail
// ─────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  const rawId = parseInt(req.params.id);
  if (isNaN(rawId)) {
    return res.status(400).json({ success: false, message: 'Invalid Order ID format' });
  }

  try {
    const list = await getAllOrders(req);
    const order = list.find(o => o.id === rawId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    res.json({ success: true, data: order });
  } catch (error) {
    console.error('Error fetching order details:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch order details', error: error.message });
  }
});

// ─────────────────────────────────────────────
// PUT /api/orders/:id  — Update order fields
// ─────────────────────────────────────────────
router.put('/:id', async (req, res) => {
  const rawId = parseInt(req.params.id);
  if (isNaN(rawId)) {
    return res.status(400).json({ success: false, message: 'Invalid Order ID format' });
  }
  
  const { status, vendorName, slotTime, serviceDate, city, locality, address } = req.body;
  const dbName = process.env.DB_NAME || 'homef4fw_homefaci';

  try {
    let resolvedName = null;
    let resolvedMobile = null;
    const hasVendorUpdate = (vendorName !== undefined || req.body.vendorPhone !== undefined || req.body.phone !== undefined || req.body.mobile !== undefined);

    if (hasVendorUpdate) {
      try {
        resolvedName = await resolveVendorName(vendorName, req.body.vendorPhone, req.body.phone, req.body.mobile);
        if (resolvedName) {
          const [partners] = await db.query('SELECT mobile FROM partners WHERE name = ?', [resolvedName]);
          if (partners.length > 0) {
            resolvedMobile = partners[0].mobile;
          }
        }
      } catch (err) {
        return res.status(404).json({ success: false, message: err.message });
      }
    }

    if (rawId >= 2000000000) {
      // It is a node_orders_v2 order
      const originalId = rawId - 2000000000;
      const fields = [];
      const values = [];

      if (status !== undefined) {
        fields.push('`status` = ?');
        values.push(status);
        
        fields.push('`bookingStatus` = ?');
        const bStatus = status.toLowerCase() === 'pending' ? 'searching' : status.toLowerCase();
        values.push(bStatus);
      }

      if (hasVendorUpdate) {
        fields.push('`partnerName` = ?');
        values.push(resolvedName);
      }

      if (slotTime !== undefined) { fields.push('`timeSlot` = ?'); values.push(slotTime); }
      if (serviceDate !== undefined) { fields.push('`date` = ?'); values.push(serviceDate); }
      if (address !== undefined) { fields.push('`address` = ?'); values.push(address); }

      if (fields.length === 0) {
        return res.status(400).json({ success: false, message: 'No fields to update' });
      }

      values.push(originalId);
      const [result] = await db.query(`UPDATE node_orders_v2 SET ${fields.join(', ')} WHERE id = ?`, values);
      if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Order not found' });

    } else if (rawId >= 10000000) {
      // It is a Laravel order (maps to order_items)
      const originalId = rawId - 10000000;
      
      // Update order_items table
      const oiFields = [];
      const oiValues = [];

      if (status !== undefined) {
        oiFields.push('`status` = ?');
        oiValues.push(status);
      }

      if (hasVendorUpdate) {
        // Resolve vendor_id in Laravel users table
        let laravelVendorId = null;
        if (resolvedName) {
          const [laravelRows] = await db.query(`SELECT id FROM \`${dbName}\`.\`users\` WHERE role_id = 2 AND name = ?`, [resolvedName]);
          if (laravelRows.length > 0) {
            laravelVendorId = laravelRows[0].id;
          }
        }
        oiFields.push('`vendor_id` = ?');
        oiValues.push(laravelVendorId);
      }

      if (slotTime !== undefined) { oiFields.push('`time_slot` = ?'); oiValues.push(slotTime); }
      if (serviceDate !== undefined) { oiFields.push('`service_date` = ?'); oiValues.push(serviceDate); }

      if (oiFields.length > 0) {
        oiValues.push(originalId);
        await db.query(`UPDATE \`${dbName}\`.\`order_items\` SET ${oiFields.join(', ')} WHERE id = ?`, oiValues);
      }

      // Update orders address if updated
      if (address !== undefined) {
        const [oiRows] = await db.query(`SELECT order_id FROM \`${dbName}\`.\`order_items\` WHERE id = ?`, [originalId]);
        if (oiRows.length > 0 && oiRows[0].order_id) {
          await db.query(`UPDATE \`${dbName}\`.\`orders\` SET address = ? WHERE id = ?`, [address, oiRows[0].order_id]);
        }
      }

    } else {
      // It is a node_orders (original Admin panel order)
      const fields = [];
      const values = [];

      if (status !== undefined) { fields.push('`status` = ?'); values.push(status); }
      if (hasVendorUpdate) {
        fields.push('`vendorName` = ?');
        values.push(resolvedName);
        fields.push('`vendorMobile` = ?');
        values.push(resolvedMobile);
      }
      if (slotTime !== undefined) { fields.push('`slotTime` = ?'); values.push(slotTime); }
      if (serviceDate !== undefined) { fields.push('`serviceDate` = ?'); values.push(serviceDate); }
      if (city !== undefined) { fields.push('`city` = ?'); values.push(city); }
      if (locality !== undefined) { fields.push('`locality` = ?'); values.push(locality); }
      if (address !== undefined) { fields.push('`address` = ?'); values.push(address); }

      if (fields.length === 0) {
        return res.status(400).json({ success: false, message: 'No fields to update' });
      }

      values.push(rawId);
      const [result] = await db.query(`UPDATE orders SET ${fields.join(', ')} WHERE id = ?`, values);
      if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Return the updated order details
    const list = await getAllOrders(req);
    const updatedOrder = list.find(o => o.id === rawId);
    res.json({
      success: true,
      message: 'Order updated successfully',
      data: updatedOrder
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
  const rawId = parseInt(req.params.id);
  if (isNaN(rawId)) {
    return res.status(400).json({ success: false, message: 'Invalid Order ID format' });
  }
  const dbName = process.env.DB_NAME || 'homef4fw_homefaci';

  try {
    let affected = 0;
    if (rawId >= 2000000000) {
      const originalId = rawId - 2000000000;
      const [result] = await db.query('DELETE FROM node_orders_v2 WHERE id = ?', [originalId]);
      affected = result.affectedRows;
    } else if (rawId >= 10000000) {
      const originalId = rawId - 10000000;
      const [result] = await db.query(`DELETE FROM \`${dbName}\`.\`order_items\` WHERE id = ?`, [originalId]);
      affected = result.affectedRows;
    } else {
      const [result] = await db.query('DELETE FROM orders WHERE id = ?', [rawId]);
      affected = result.affectedRows;
    }

    if (affected === 0) {
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
  const rawId = parseInt(req.params.id);
  if (isNaN(rawId)) {
    return res.status(400).json({ success: false, message: 'Invalid Order ID format' });
  }
  const { vendorName, vendorPhone, phone, mobile } = req.body;
  const dbName = process.env.DB_NAME || 'homef4fw_homefaci';

  try {
    let resolvedName = null;
    try {
      resolvedName = await resolveVendorName(vendorName, vendorPhone, phone, mobile);
    } catch (err) {
      return res.status(404).json({ success: false, message: err.message });
    }

    const newStatus = resolvedName === null ? 'Pending' : 'Assigned';

    if (rawId >= 2000000000) {
      const originalId = rawId - 2000000000;
      const bStatus = newStatus === 'Pending' ? 'searching' : 'assigned';
      const [result] = await db.query(
        'UPDATE node_orders_v2 SET partnerName = ?, status = ?, bookingStatus = ? WHERE id = ?',
        [resolvedName, newStatus, bStatus, originalId]
      );
      if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Order not found' });

    } else if (rawId >= 10000000) {
      const originalId = rawId - 10000000;
      let laravelVendorId = null;
      if (resolvedName) {
        const [laravelRows] = await db.query(`SELECT id FROM \`${dbName}\`.\`users\` WHERE role_id = 2 AND name = ?`, [resolvedName]);
        if (laravelRows.length > 0) {
          laravelVendorId = laravelRows[0].id;
        }
      }
      const [result] = await db.query(
        `UPDATE \`${dbName}\`.\`order_items\` SET vendor_id = ?, status = ? WHERE id = ?`,
        [laravelVendorId, newStatus, originalId]
      );
      if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Order not found' });

    } else {
      let resolvedMobile = null;
      if (resolvedName) {
        const [partners] = await db.query('SELECT mobile FROM partners WHERE name = ?', [resolvedName]);
        if (partners.length > 0) {
          resolvedMobile = partners[0].mobile;
        }
      }
      const [result] = await db.query(
        'UPDATE orders SET vendorName = ?, vendorMobile = ?, status = ? WHERE id = ?',
        [resolvedName, resolvedMobile, newStatus, rawId]
      );
      if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const list = await getAllOrders(req);
    const updatedOrder = list.find(o => o.id === rawId);
    res.json({
      success: true,
      message: resolvedName === null ? 'Order unassigned successfully' : `Order assigned to ${resolvedName} successfully`,
      data: updatedOrder
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
