const express = require('express');
const router = express.Router();
const orderService = require('../services/orderService');
const { handleResponse } = require('../utils/apiutils');

// POST /api/orders - Create a new order
router.post('/', async (req, res) => {
    const io = req.app.get('socketio');
    // console.log('Creating order with data:', req.body);
    data=await orderService.createOrder(req.body, io);
    handleResponse(res, ()=>{return data}, 201);
});

// GET /api/orders - Fetch all orders with optional filters
router.get('/', async (req, res) => {
    const { status, orderType } = req.query;
    data=await orderService.getAllOrders(status, orderType);
    handleResponse(res, () => { return data; });
});

// GET /api/orders/:id - Fetch a single order by its ID, including its items
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    data=await orderService.getOrderById(id);
    handleResponse(res, () =>{ return data; });
});

// POST /api/orders/:id/items - Add new items to an existing order
router.post('/:id/items', async (req, res) => {
    const { id } = req.params;
    const { items } = req.body;
    const io = req.app.get('socketio');
    data = await orderService.addItemsToOrder(id, items, io);
    handleResponse(res, () => { return data; }, 201);
});

// PATCH /api/orders/:id/status - Update an order's status
router.patch('/:id/status', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const io = req.app.get('socketio');
    
    const data = await orderService.updateOrderStatus(id, status, io);
    handleResponse(res, () =>{ return data; });
});

module.exports = router;

