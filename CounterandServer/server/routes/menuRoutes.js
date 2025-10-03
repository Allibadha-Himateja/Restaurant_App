const express = require('express');
const router = express.Router();
const menuService = require('../services/menuService');
const { handleResponse } = require('../utils/apiutils');

// GET /api/menu - Get all menu items
router.get('/', async (req, res) => {
    const data = await menuService.getAllMenuItems();
    handleResponse(res, () => { return data; });
});

// GET /api/menu/categories - Get all menu categories
router.get('/categories', async (req, res) => {
    const data = await menuService.getMenuCategories();
    handleResponse(res, () => { return data; });
});

// POST /api/menu - Add a new menu item
router.post('/', async (req, res) => {
    const data = await menuService.addMenuItem(req.body, req.app.get('socketio'));
    handleResponse(res, () => { return data; }, 201);
});

// GET /api/menu/:id - Get a single menu item by ID
router.get('/:id', async (req, res) => {
    const data = await menuService.getMenuItemById(req.params.id);
    handleResponse(res, () => { return data; });
});

// PUT /api/menu/:id - Update an existing menu item
router.put('/:id', async (req, res) => {
    const data = await menuService.updateMenuItem(req.params.id, req.body, req.app.get('socketio'));
    handleResponse(res, () => { return data; });
});

// DELETE /api/menu/:id - Delete a menu item
router.delete('/:id', async (req, res) => {
    const data = await menuService.deleteMenuItem(req.params.id, req.app.get('socketio'));
    handleResponse(res, () => { return data; });
});

// PATCH /api/menu/:id/availability - Toggle item availability
router.patch('/:id/availability', async (req, res) => {
    const { isAvailable } = req.body;
    const data = await menuService.toggleItemAvailability(req.params.id, isAvailable, req.app.get('socketio'));
    handleResponse(res, () => { return data; });
});

module.exports = router;