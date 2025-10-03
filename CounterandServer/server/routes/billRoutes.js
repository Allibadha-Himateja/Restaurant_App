const express = require('express');
const router = express.Router();
const billService = require('../services/billService');
const { handleResponse } = require('../utils/apiutils');

// GET /api/bills - Get all bills
router.get('/', async (req, res) => {
    const data = await billService.getAllBills();
    handleResponse(res, () => { return data; });
});

// POST /api/bills/generate - Generate a new bill for an order
router.post('/generate', async (req, res) => {
    const { orderId } = req.body;
    const data = await billService.generateBill(orderId, req.app.get('socketio'));
    handleResponse(res, () => { return data; }, 201);
});

// PATCH /api/bills/:id/status - Update a bill's payment status
router.patch('/:id/status', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const io = req.app.get('socketio');

    const servicePromise = billService.updateBillStatus(id, status, io);
    const data = await servicePromise;
    
    handleResponse(res, () => data);
});

// GET /api/bills/with-items
router.get('/with-items', async (req, res) => {
    const data = await billService.getBillsWithItems();
    handleResponse(res, () => data);
});

module.exports = router;