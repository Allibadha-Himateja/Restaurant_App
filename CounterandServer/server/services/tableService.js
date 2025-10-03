const { dbManager, sql } = require('../config/database');

class TableService {
    async getAllTables() {
        const pool = dbManager.getPool();
        const result = await pool.request().query(`
            SELECT t.*, o.OrderNumber 
            FROM Tables t 
            LEFT JOIN Orders o ON t.CurrentOrderID = o.OrderID
            ORDER BY t.TableNumber
        `);
        return result.recordset;
    }

    async addTable(tableData, io) {
        // Assuming tableData contains { tableNumber, capacity, etc. }
        // The apiService sends { name: 'T1' }, so we map 'name' to 'tableNumber'
        const pool = dbManager.getPool();
        const result = await pool.request()
            .input('tableNumber', sql.NVarChar(50), tableData.tableNumber)
            .input('capacity', sql.Int, tableData.capacity || 4) // Default capacity
            .query(`
                INSERT INTO Tables (TableNumber, Capacity)
                OUTPUT INSERTED.*
                VALUES (@tableNumber, @capacity)
            `);
        const newTable = result.recordset[0];
        if (io) io.emit('tablesUpdate', { action: 'add', table: newTable });
        return newTable;
    }

    async updateTable(id, tableData, io) {
        const pool = dbManager.getPool();
        const result = await pool.request()
            .input('tableId', sql.Int, id)
            .input('tableNumber', sql.NVarChar(50), tableData.tableNumber)
            .input('capacity', sql.Int, tableData.capacity)
            .input('status', sql.NVarChar(20), tableData.status)
            .query(`
                UPDATE Tables 
                SET TableNumber = @tableNumber, Capacity = @capacity, Status = @status, UpdatedAt = GETDATE()
                OUTPUT INSERTED.*
                WHERE TableID = @tableId
            `);
        if (result.recordset.length === 0) throw new Error('Table not found');
        const updatedTable = result.recordset[0];
        if (io) io.emit('tablesUpdate', { action: 'update', table: updatedTable });
        return updatedTable;
    }

    async deleteTable(id, io) {
        const pool = dbManager.getPool();
        // Add logic to prevent deleting a table with an active order if necessary
        const result = await pool.request()
            .input('tableId', sql.Int, id)
            .query('DELETE FROM Tables WHERE TableID = @tableId');

        if (result.rowsAffected[0] === 0) throw new Error('Table not found or already deleted');
        
        if (io) io.emit('tablesUpdate', { action: 'delete', tableId: id });
        return { message: 'Table deleted successfully' };
    }
}

module.exports = new TableService();
