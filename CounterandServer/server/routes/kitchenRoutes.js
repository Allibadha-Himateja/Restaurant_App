const express = require('express');
const router = express.Router();
const kitchenService = require('../services/kitchenService');
const { handleResponse } = require('../utils/apiutils');

// GET /api/kitchen/queue - Get the current kitchen queue
router.get('/queue', async (req, res) => {
    const data = await kitchenService.getPendingItems();
    handleResponse(res, () => { return data; });
});

router.patch('/serve-item', async (req, res) => {
    const { queueId, orderItemId } = req.body;
    const io = req.app.get('socketio');
    
    const data = await kitchenService.serveKitchenItem(queueId, orderItemId, io);
    handleResponse(res, () => data);
});
module.exports = router;