const sql = require('mssql');
require('dotenv').config();

const dbConfig = {
    server: "localhost", // Use 'localhost' for local development
    database: "RestaurantCounter", 
    user: "sa",
    password: "himateja",
    port: parseInt("1433",10),
    options: {
        encrypt: process.env.DB_ENCRYPT === 'true',
        trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true',
        enableArithAbort: true,
        connectionTimeout: 30000,
        requestTimeout: 30000
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

class DatabaseManager {
    constructor() {
        this.pool = null;
        this.connected = false;
    }

    async connect() {
        try {
            if (this.pool) {
                await this.pool.close();
            }
            
            this.pool = await sql.connect(dbConfig);
            this.connected = true;
            console.log('✅ Connected to MSSQL Database');
            
            // Test connection
            await this.pool.request().query('SELECT 1 as test');
            console.log('✅ Database connection test successful');
            
            return this.pool;
        } catch (error) {
            console.error('❌ Database connection failed:', error.message);
            this.connected = false;
            throw error;
        }
    }

    async disconnect() {
        try {
            if (this.pool) {
                await this.pool.close();
                this.pool = null;
                this.connected = false;
                console.log('✅ Disconnected from MSSQL Database');
            }
        } catch (error) {
            console.error('❌ Error disconnecting from database:', error.message);
        }
    }

    getPool() {
        if (!this.connected || !this.pool) {
            throw new Error('Database not connected. Call connect() first.');
        }
        return this.pool;
    }

    isConnected() {
        return this.connected;
    }
}

const dbManager = new DatabaseManager();

module.exports = {
    dbManager,
    sql
};