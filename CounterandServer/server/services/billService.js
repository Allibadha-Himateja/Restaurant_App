const { dbManager, sql } = require('../config/database');

class BillService {
    async getAllBills() {
        const pool = dbManager.getPool();
        const result = await pool.request().query(`
            SELECT b.*, o.OrderNumber 
            FROM Bills b
            JOIN Orders o ON b.OrderID = o.OrderID
            ORDER BY b.CreatedAt DESC
        `);
        return result.recordset;
    }

    async generateBill(orderId, io) {
    // This is a complex transaction that reads order details and creates a bill
    const transaction = new sql.Transaction(dbManager.getPool());
    await transaction.begin();
    try {
        // Fetch financial details from the Order
        const orderRequest = await transaction.request()
            .input('orderId', sql.Int, orderId)
            .query(`
                SELECT 
                    TableID, 
                    TotalAmount as SubTotal, 
                    TaxAmount, 
                    DiscountAmount, 
                    FinalAmount as TotalAmount 
                FROM Orders 
                WHERE OrderID = @orderId
            `);

        if (orderRequest.recordset.length === 0) {
            throw new Error('Order not found');
        }
        
        const orderDetails = orderRequest.recordset[0];
        const tableId = orderDetails.TableID;

        // ✅ FIX: Use a fixed 5% tax rate as requested
        const taxRate = 0.05;

        // Check if a bill already exists for this order to prevent duplicates
        const existingBill = await transaction.request()
            .input('orderId', sql.Int, orderId)
            .query('SELECT BillID FROM Bills WHERE OrderID = @orderId');
        if (existingBill.recordset.length > 0) {
            throw new Error('Bill already exists for this order');
        }

        const billNumber = `BILL-${Date.now()}`;

        // Provide all mandatory values to the INSERT query
        const result = await transaction.request()
            .input('orderId', sql.Int, orderId)
            .input('billNumber', sql.VarChar, billNumber)
            .input('subTotal', sql.Decimal(10, 2), orderDetails.SubTotal)
            .input('taxRate', sql.Decimal(5, 2), taxRate) // Use the fixed rate here
            .input('taxAmount', sql.Decimal(10, 2), orderDetails.TaxAmount)
            .input('discountAmount', sql.Decimal(10, 2), orderDetails.DiscountAmount || 0)
            .input('totalAmount', sql.Decimal(10, 2), orderDetails.TotalAmount)
            .query(`
                INSERT INTO Bills (
                    OrderID, 
                    BillNumber, 
                    SubTotal, 
                    TaxRate, 
                    TaxAmount, 
                    DiscountAmount, 
                    TotalAmount,
                    PaymentStatus 
                )
                OUTPUT INSERTED.*
                VALUES (
                    @orderId, 
                    @billNumber, 
                    @subTotal, 
                    @taxRate, 
                    @taxAmount, 
                    @discountAmount, 
                    @totalAmount,
                    'Pending' 
                )
            `);
        
        // Update the associated Table's status to clear it
        if (tableId) {
            await transaction.request()
                .input('tableId', sql.Int, tableId)
                .query("UPDATE Tables SET Status = 'Available', CurrentOrderID = NULL WHERE TableID = @tableId");
        }

        await transaction.commit();
        const newBill = result.recordset[0];
        
        // Notify the frontend that the data has changed
        if (io) {
            io.emit('billsUpdate', { action: 'generate', bill: newBill });
            if (tableId) {
                io.emit('tableStatusUpdate', { tableId: tableId, status: 'Available' });
            }
        }
        return newBill;
    } catch (err) {
        await transaction.rollback();
        console.error("Transaction failed and was rolled back.", err);
        throw err;
    }
}

async updateBillStatus(billId, status, io) {
    try {
        const pool = await dbManager.getPool();
        const result = await pool.request()
            .input('billId', sql.Int, billId)
            .input('status', sql.NVarChar(20), status)
            .query(`
                UPDATE Bills
                SET PaymentStatus = @status
                OUTPUT INSERTED.*
                WHERE BillID = @billId
            `);

        if (result.recordset.length === 0) {
            throw new Error('Bill not found or could not be updated.');
        }

        const updatedBill = result.recordset[0];

        // Notify all clients that a bill has been updated
        if (io) {
            io.emit('billsUpdate', { action: 'update', bill: updatedBill });
        }

        return updatedBill;
    } catch (error) {
        console.error(`Error updating bill status for BillID ${billId}:`, error);
        throw error; // Re-throw the error to be handled by the route
    }
}

async  getBillsWithItems() {
    const pool = await dbManager.getPool();
    
    // 1. Fetch all the primary bill records
    const billsResult = await pool.request().query(`
        SELECT b.*, o.OrderNumber, t.TableNumber
        FROM Bills b
        JOIN Orders o ON b.OrderID = o.OrderID
        LEFT JOIN Tables t ON o.TableID = t.TableID
        ORDER BY b.CreatedAt DESC
    `);
    const bills = billsResult.recordset;

    if (bills.length === 0) {
        return [];
    }

    // 2. Get all OrderIDs from the bills to fetch their items in a single second query
    const orderIds = bills.map(b => b.OrderID);

    const itemsResult = await pool.request()
        .input('orderIds', sql.NVarChar(4000), orderIds.join(','))
        .query(`
            SELECT OrderID, ItemName, Quantity, UnitPrice, TotalPrice 
            FROM OrderItems 
            WHERE OrderID IN (SELECT value FROM STRING_SPLIT(@orderIds, ','))
        `);
    
    // 3. Group all the fetched items by their OrderID for quick lookup
    const itemsByOrderId = itemsResult.recordset.reduce((acc, item) => {
        if (!acc[item.OrderID]) {
            acc[item.OrderID] = [];
        }
        acc[item.OrderID].push(item);
        return acc;
    }, {});

    // 4. Attach the grouped items to their corresponding bill
    bills.forEach(bill => {
        bill.items = itemsByOrderId[bill.OrderID] || [];
    });

    return bills;
}
}

module.exports = new BillService();
