const { dbManager, sql } = require('../config/database');

class MenuService {
    async getAllMenuItems() {
        const pool = dbManager.getPool();
        const result = await pool.request().query(`
            SELECT m.*, c.CategoryName 
            FROM MenuItems m
            LEFT JOIN Categories c ON m.CategoryID = c.CategoryID
            ORDER BY c.DisplayOrder, m.DisplayOrder, m.ItemName
        `);
        return result.recordset;
    }

    async getMenuItemById(id) {
        const pool = dbManager.getPool();
        const result = await pool.request()
            .input('itemId', sql.Int, id)
            .query('SELECT * FROM MenuItems WHERE ItemID = @itemId');
        if (result.recordset.length === 0) throw new Error('Menu item not found');
        return result.recordset[0];
    }

    async addMenuItem(itemData, io) {
        const pool = dbManager.getPool();
        const result = await pool.request()
            .input('categoryId', sql.Int, itemData.categoryId)
            .input('itemName', sql.NVarChar(200), itemData.itemName)
            .input('regularPrice', sql.Decimal(10, 2), itemData.regularPrice)
            // Add other fields as necessary from your DB schema
            .query(`
                INSERT INTO MenuItems (CategoryID, ItemName, RegularPrice)
                OUTPUT INSERTED.*
                VALUES (@categoryId, @itemName, @regularPrice)
            `);
        const newItem = result.recordset[0];
        if (io) io.emit('menuUpdate', { action: 'add', item: newItem });
        return newItem;
    }

    async updateMenuItem(id, itemData, io) {
        const pool = dbManager.getPool();
        const result = await pool.request()
            .input('itemId', sql.Int, id)
            .input('categoryId', sql.Int, itemData.categoryId)
            .input('itemName', sql.NVarChar(200), itemData.itemName)
            .input('regularPrice', sql.Decimal(10, 2), itemData.regularPrice)
            // Add other fields to update
            .query(`
                UPDATE MenuItems 
                SET CategoryID = @categoryId, ItemName = @itemName, RegularPrice = @regularPrice, UpdatedAt = GETDATE()
                OUTPUT INSERTED.*
                WHERE ItemID = @itemId
            `);
        const updatedItem = result.recordset[0];
        if (io) io.emit('menuUpdate', { action: 'update', item: updatedItem });
        return updatedItem;
    }

    async deleteMenuItem(id, io) {
        const pool = dbManager.getPool();
        const result = await pool.request()
            .input('itemId', sql.Int, id)
            .query('DELETE FROM MenuItems WHERE ItemID = @itemId');
        
        if (result.rowsAffected[0] === 0) throw new Error('Menu item not found or already deleted');

        if (io) io.emit('menuUpdate', { action: 'delete', itemId: id });
        return { message: 'Menu item deleted successfully' };
    }

    async toggleItemAvailability(id, isAvailable, io) {
        if (typeof isAvailable !== 'boolean') throw new Error('isAvailable must be a boolean');
        const pool = dbManager.getPool();
        const result = await pool.request()
            .input('itemId', sql.Int, id)
            .input('isAvailable', sql.Bit, isAvailable)
            .query(`
                UPDATE MenuItems 
                SET IsAvailable = @isAvailable, UpdatedAt = GETDATE()
                OUTPUT INSERTED.ItemID, INSERTED.IsAvailable
                WHERE ItemID = @itemId
            `);
        const updatedItem = result.recordset[0];
        if (io) io.emit('menuUpdate', { action: 'toggle', item: updatedItem });
        return updatedItem;
    }
    
    async getMenuCategories() {
        const pool = dbManager.getPool();
        const result = await pool.request().query(`
            SELECT * FROM Categories ORDER BY DisplayOrder, CategoryName
        `);
        return result.recordset;
    }
}

module.exports = new MenuService();
