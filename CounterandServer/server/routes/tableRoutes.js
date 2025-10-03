const express = require('express');
const router = express.Router();
const tableService = require('../services/tableService');
const { handleResponse } = require('../utils/apiutils');

// GET /api/tables - Get all tables
router.get('/', async (req, res) => {
    const data = await tableService.getAllTables();
    handleResponse(res, () => { return data; });
});

// POST /api/tables - Add a new table
router.post('/', async (req, res) => {
    const { name } = req.body;
    const data = await tableService.addTable({ tableNumber: name });
    handleResponse(res, () => { return data; }, 201);
});

// PUT /api/tables/:id - Update a table
router.put('/:id', async (req, res) => {
    const data = await tableService.updateTable(req.params.id, req.body, req.app.get('socketio'));
    handleResponse(res, () => { return data; });
});

// DELETE /api/tables/:id - Delete a table
router.delete('/:id', async (req, res) => {
    const data = await tableService.deleteTable(req.params.id, req.app.get('socketio'));
    handleResponse(res, () => { return data; });
});

module.exports = router;