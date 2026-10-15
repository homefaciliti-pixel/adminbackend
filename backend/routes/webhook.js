const express = require('express');
const router = express.Router();

const db = require('../db'); 

// POST /api/webhook/whatsapp-order
router.post('/whatsapp-order', async (req, res) => {
    try {
        const orderData = req.body;

        const {
            customer_phone,
            customer_name,
            order_details,
            total_amount,
            ai_response_summary
        } = orderData;

        // Basic validation
        if (!customer_phone) {
            return res.status(400).json({ success: false, message: 'Customer phone is required' });
        }

        const query = `
            INSERT INTO orders (customer_phone, customer_name, items, total_amount, status, created_at) 
            VALUES (?, ?, ?, ?, 'Pending', NOW())
        `;
        
        const values = [
            customer_phone, 
            customer_name || 'WhatsApp Customer', 
            JSON.stringify(order_details || ai_response_summary), 
            total_amount || 0
        ];


        const [result] = await db.execute(query, values);

        console.log('WhatsApp Order Saved Successfully:', result.insertId);

        return res.status(200).json({ 
            success: true, 
            message: 'Order booked and saved to database successfully',
            order_id: result.insertId 
        });

    } catch (error) {
        console.error('Webhook Error:', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
    }
});

module.exports = router;