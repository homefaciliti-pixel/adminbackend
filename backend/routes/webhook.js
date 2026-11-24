
const express = require('express');
const router = express.Router();
const db = require('../db');

// POST /api/webhook/whatsapp-order
router.post('/whatsapp-order', async (req, res) => {
    try {
        const orderData = req.body || {};

        const customerMobile = orderData.mobile || orderData.customer_phone || orderData.customerMobile || orderData.phone;
        const customerName = orderData.name || orderData.customer_name || orderData.customerName || 'WhatsApp Customer';
        const {
            order_details,
            service_name,
            total_amount,
            address,
            city,
            locality,
            slot_time,
            service_date,
            payment_method,
            ai_response_summary
        } = orderData;

        if (!customerMobile) {
            return res.status(400).json({
                success: false,
                message: 'Customer mobile is required'
            });
        }

        const now = new Date();
        const year = now.getFullYear();
        const todayStr = `${year}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const serviceRequestNumber = `#REQ ${year}-${Date.now().toString().slice(-6)}`;

        const serviceName =
            service_name ||
            (order_details && order_details.item) ||
            'WhatsApp Order';
        const serviceAmount = parseFloat(total_amount || 0);
        const orderAddress =
            address ||
            (typeof order_details === 'object' && order_details !== null
                ? JSON.stringify(order_details)
                : order_details) ||
            ai_response_summary ||
            'WhatsApp Chat';

        const query = `
            INSERT INTO orders
            (serviceRequestNumber, customerName, customerMobile, serviceName, serviceAmount, slotTime, serviceDate, city, locality, status, vendorName, address, createdAt, paymentMethod)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', '-', ?, ?, ?)
        `;

        const values = [
            serviceRequestNumber,
            customerName,
            String(customerMobile),
            serviceName,
            serviceAmount,
            slot_time || '10:00 AM - 12:00 PM',
            service_date || todayStr,
            city || 'Jaipur',
            locality || '',
            orderAddress,
            now.toLocaleString('en-US'),
            payment_method || 'UPI'
        ];

        const [result] = await db.execute(query, values);

        return res.status(200).json({
            success: true,
            message: 'Order booked and saved to database successfully',
            order_id: result.insertId,
            serviceRequestNumber
        });
    } catch (error) {
        console.error('Webhook Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal Server Error',
            error: error.message
        });
    }
});

module.exports = router;
