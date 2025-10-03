const { dbManager, sql } = require('../config/database');
const orderService = require('./orderService');

class KitchenService {
    /**
     * Fetches all necessary data for KOTs directly from the KitchenQueue table.
     * This query is more reliable and ensures QueueID is always present.
     */
    async getPendingItems() {
        const pool = dbManager.getPool();
        const result = await pool.request().query(`
            SELECT 
                kq.QueueID,
                kq.OrderItemID,
                kq.ItemName,
                kq.Quantity,
                kq.Status,
                kq.CreatedAt,
                o.OrderNumber,
                o.OrderID,
                t.TableNumber
            FROM KitchenQueue kq
            JOIN Orders o ON kq.OrderID = o.OrderID
            LEFT JOIN Tables t ON o.TableID = t.TableID
            WHERE kq.Status = 'Queued'
            ORDER BY kq.CreatedAt ASC;
        `);
        return result.recordset;
    }

    /**
     * Serves one unit of an item from the kitchen.
     * It decrements the item's quantity and deletes it from the queue only when the quantity reaches zero.
     * @param {number} queueId - The ID from the KitchenQueue table.
     * @param {number} orderItemId - The ID from the OrderItems table.
     * @param {object} io - The Socket.IO instance.
     */
    async serveKitchenItem(queueId, orderItemId, io) {
        const transaction = new sql.Transaction(dbManager.getPool());
        await transaction.begin();
        try {
            // Step 1: Get the current quantity from the kitchen queue
            const queueItemResult = await transaction.request()
                .input('QueueID', sql.Int, queueId)
                .query('SELECT Quantity FROM KitchenQueue WHERE QueueID = @QueueID');

            if (queueItemResult.recordset.length === 0) {
                console.warn(`KitchenQueue item with ID ${queueId} was already processed.`);
                await transaction.rollback();
                return { message: 'Item already served.' };
            }

            const currentQuantity = queueItemResult.recordset[0].Quantity;

            // Step 2: If quantity is more than 1, decrement it. Otherwise, delete the item.
            if (currentQuantity > 1) {
                await transaction.request()
                    .input('QueueID', sql.Int, queueId)
                    .query('UPDATE KitchenQueue SET Quantity = Quantity - 1 WHERE QueueID = @QueueID');
            } else {
                await transaction.request()
                    .input('QueueID', sql.Int, queueId)
                    .query('DELETE FROM KitchenQueue WHERE QueueID = @QueueID');
            }
            
            // Step 3: Update the main OrderItem status to 'Served'
            const updatedItemInfo = await orderService.updateOrderItemStatus(orderItemId, 'Served', transaction);

            await transaction.commit();

            // Step 4: Notify clients to refresh their views
            if (io) {
                io.emit('kitchenUpdate'); 
                io.emit('orderItemStatusUpdate', updatedItemInfo);
            }

            return { message: 'Item served successfully', updatedItem: updatedItemInfo };
        } catch (err) {
            await transaction.rollback();
            console.error("Transaction to serve kitchen item failed:", err);
            throw err;
        }
    }
}

module.exports = new KitchenService();