const { dbManager, sql } = require('../config/database');

class OrderService {
    /**
     * OPTIMIZED: Adds multiple items to an order using fewer database queries.
     */
    async addItemsToOrder(orderId, items, io, existingTransaction = null) {
        const transaction = existingTransaction || new sql.Transaction(dbManager.getPool());
        try {
            if (!existingTransaction) await transaction.begin();
            
            const itemsArray = Array.isArray(items) ? items : items.items;
            if (!itemsArray || itemsArray.length === 0) {
                await this.recalculateOrderTotals(orderId, transaction);
                if (!existingTransaction) await transaction.commit();
                return { success: true, orderId };
            }
            
            const itemIds = itemsArray.map(item => item.itemId);
            const menuItemsResult = await transaction.request()
                .input('itemIds', sql.NVarChar, itemIds.join(','))
                .query(`SELECT ItemID, ItemName, RegularPrice FROM MenuItems WHERE ItemID IN (SELECT value FROM STRING_SPLIT(@itemIds, ','))`);

            const menuItemsMap = new Map(menuItemsResult.recordset.map(i => [i.ItemID, i]));

            for (const item of itemsArray) {
                const menuItem = menuItemsMap.get(item.itemId);
                if (!menuItem) throw new Error(`Menu item with ID ${item.itemId} not found.`);

                const unitPrice = menuItem.RegularPrice;
                const totalPrice = item.quantity * unitPrice;

                const orderItemResult = await transaction.request()
                    .input('orderId', sql.Int, orderId)
                    .input('itemId', sql.Int, item.itemId)
                    .input('itemName', sql.NVarChar(200), menuItem.ItemName)
                    .input('quantity', sql.Int, item.quantity)
                    .input('unitPrice', sql.Decimal(10, 2), unitPrice)
                    .input('totalPrice', sql.Decimal(10, 2), totalPrice)
                    .query(`
                        INSERT INTO OrderItems (OrderID, ItemID, ItemName, Quantity, UnitPrice, TotalPrice, Status)
                        OUTPUT INSERTED.OrderItemID
                        VALUES (@orderId, @itemId, @itemName, @quantity, @unitPrice, @totalPrice, 'Preparing')
                    `);
                
                const orderItemId = orderItemResult.recordset[0].OrderItemID;

                await transaction.request()
                    .input('orderId', sql.Int, orderId)
                    .input('orderItemId', sql.Int, orderItemId)
                    .input('itemId', sql.Int, item.itemId)
                    .input('itemName', sql.NVarChar(200), menuItem.ItemName)
                    .input('quantity', sql.Int, item.quantity)
                    .query(`
                        INSERT INTO KitchenQueue (OrderID, OrderItemID, ItemID, ItemName, Quantity, Status)
                        VALUES (@orderId, @orderItemId, @itemId, @itemName, @quantity, 'Queued')
                    `);
            }
            await this.recalculateOrderTotals(orderId, transaction);
            if (!existingTransaction) await transaction.commit();
            
            io.emit('kitchenUpdate', { orderId });
            io.emit('orderUpdate', { orderId });
            return { success: true, orderId };
        } catch (error) {
            if (!existingTransaction) await transaction.rollback();
            console.error(`Error adding items to order ${orderId}:`, error);
            throw error;
        }
    }

    /**
     * Creates a new order and its associated items.
     */
    async createOrder(orderData, io) {
        const transaction = new sql.Transaction(dbManager.getPool());
        try {
            await transaction.begin();
            const orderPrefix = 'ORD';
            const orderNumber = `${orderPrefix}-${Date.now()}`;
            
            const orderResult = await transaction.request()
                .input('orderNumber', sql.NVarChar(50), orderNumber)
                .input('tableId', sql.Int, orderData.tableId || null)
                .input('orderType', sql.NVarChar(20), orderData.orderType)
                .query(`
                    INSERT INTO Orders (OrderNumber, TableID, OrderType, Status)
                    OUTPUT INSERTED.OrderID
                    VALUES (@orderNumber, @tableId, @orderType, 'Pending')
                `);
            
            const orderId = orderResult.recordset[0].OrderID;
            
            if (orderData.items && orderData.items.length > 0) {
               await this.addItemsToOrder(orderId, orderData.items, io, transaction);
            } else {
               // If no items, totals are zero, but we should still run this
               await this.recalculateOrderTotals(orderId, transaction);
            }
            
            if (orderData.tableId) {
                const tableUpdateResult = await transaction.request()
                    .input('tableId', sql.Int, orderData.tableId)
                    .input('orderId', sql.Int, orderId)
                    .query(`
                        UPDATE Tables 
                        SET Status = 'Occupied', CurrentOrderID = @orderId 
                        OUTPUT INSERTED.*
                        WHERE TableID = @tableId
                    `);
                if (io && tableUpdateResult.recordset.length > 0) {
                    io.emit('tableStatusUpdate', tableUpdateResult.recordset[0]);
                }
            }

            await transaction.commit();
            io.emit('newOrder', { orderId, orderNumber });
            return { orderId, orderNumber };
        } catch (error) {
            await transaction.rollback();
            console.error('Error creating order:', error);
            throw error;
        }
    }

    /**
     * Recalculates and updates the total amounts for a given order.
     */
    async recalculateOrderTotals(orderId, transaction) {
        await transaction.request()
            .input('orderId', sql.Int, orderId)
            .query(`
                WITH OrderTotals AS (
                    SELECT SUM(TotalPrice) as SubTotal FROM OrderItems WHERE OrderID = @orderId
                )
                UPDATE Orders
                SET 
                    TotalAmount = ISNULL(OT.SubTotal, 0),
                    TaxAmount = ISNULL(OT.SubTotal, 0) * 0.05,
                    FinalAmount = ISNULL(OT.SubTotal, 0) * 1.05,
                    UpdatedAt = GETDATE()
                FROM Orders
                LEFT JOIN OrderTotals OT ON 1=1
                WHERE Orders.OrderID = @orderId;
            `);
    }

    /**
     * Retrieves a single order by its ID, including all of its items.
     */
    async getOrderById(orderId) {
        const pool = dbManager.getPool();
        const orderResult = await pool.request()
            .input('orderId', sql.Int, orderId)
            .query('SELECT o.*, t.TableNumber FROM Orders o LEFT JOIN Tables t ON o.TableID = t.TableID WHERE o.OrderID = @orderId');

        if (orderResult.recordset.length === 0) return null;

        const order = orderResult.recordset[0];
        const itemsResult = await pool.request()
            .input('orderId', sql.Int, orderId)
            .query('SELECT * FROM OrderItems WHERE OrderID = @orderId ORDER BY CreatedAt');
        
        order.items = itemsResult.recordset;
        return order;
    }

    /**
     * OPTIMIZED: Retrieves all orders with their items, with optional filters.
     */
    async getAllOrders(status, orderType) {
        const pool = dbManager.getPool();
        let ordersQuery = `
            SELECT o.OrderID, o.OrderNumber, o.OrderType, o.Status, o.FinalAmount, o.CreatedAt, t.TableNumber
            FROM Orders o LEFT JOIN Tables t ON o.TableID = t.TableID WHERE 1=1
        `;
        const request = pool.request();
        if (status) {
            ordersQuery += ` AND o.Status = @status`;
            request.input('status', sql.NVarChar(20), status);
        }
        if (orderType) {
            ordersQuery += ` AND o.OrderType = @orderType`;
            request.input('orderType', sql.NVarChar(20), orderType);
        }
        ordersQuery += ` ORDER BY o.CreatedAt DESC`;

        const ordersResult = await request.query(ordersQuery);
        const orders = ordersResult.recordset;

        if (orders.length === 0) return [];
        
        const orderIds = orders.map(o => o.OrderID);
        const itemsResult = await pool.request()
            .input('orderIds', sql.NVarChar(4000), orderIds.join(','))
            .query(`
                SELECT OrderID, ItemName, Quantity, Status 
                FROM OrderItems 
                WHERE OrderID IN (SELECT value FROM STRING_SPLIT(@orderIds, ','))
            `);
        
        const itemsByOrderId = itemsResult.recordset.reduce((acc, item) => {
            if (!acc[item.OrderID]) acc[item.OrderID] = [];
            acc[item.OrderID].push(item);
            return acc;
        }, {});

        orders.forEach(order => {
            order.items = itemsByOrderId[order.OrderID] || [];
        });

        return orders;
    }

    /**
     * Updates the status of a single item within an order.
     */
    async updateOrderItemStatus(OrderItemID, status, transaction) {
        const request = transaction.request(); 
        const result = await request
            .input('OrderItemID', sql.Int, OrderItemID)
            .input('status', sql.NVarChar(50), status)
            .query(`
                UPDATE OrderItems
                SET Status = @status
                OUTPUT INSERTED.OrderItemID, INSERTED.OrderID, INSERTED.Status
                WHERE OrderItemID = @OrderItemID;
            `);

        if (result.recordset.length === 0) {
            throw new Error(`OrderItem with ID ${OrderItemID} not found.`);
        }
        return result.recordset[0];
    }

    /**
     * Updates the status of a specific order.
     */
    async updateOrderStatus(orderId, status, io) {
        const pool = await dbManager.getPool();
        const result = await pool.request()
            .input('orderId', sql.Int, orderId)
            .input('status', sql.NVarChar(50), status)
            .query(`
                UPDATE Orders
                SET Status = @status
                OUTPUT INSERTED.*
                WHERE OrderID = @orderId;
            `);

        if (result.recordset.length === 0) {
            throw new Error(`Order with ID ${orderId} not found.`);
        }
        const updatedOrder = result.recordset[0];

        if (io) {
            io.emit('orderUpdate', updatedOrder);
        }
        return updatedOrder;
    }
}

module.exports = new OrderService();