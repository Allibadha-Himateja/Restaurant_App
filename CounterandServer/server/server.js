const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const { dbManager } = require('./config/database');

// Import routes
const menuRoutes = require('./routes/menuRoutes');
const orderRoutes = require('./routes/orderRoutes');
const kitchenRoutes = require('./routes/kitchenRoutes');
const tableRoutes = require('./routes/tableRoutes');
const billRoutes = require('./routes/billRoutes');

const app = express();
const server = http.createServer(app);

// Socket.IO setup
const io = socketIo(server, {
    cors: {
        origin: "*", // For development. In production, restrict this to your domain.
        methods: ["GET", "POST"]
    }
});

// Pass the io instance to the Express app so routes can access it
app.set('socketio', io);

// --- Middleware ---
// app.use(helmet({
//   // Keep your existing Content Security Policy
//   contentSecurityPolicy: {
//     directives: {
//       defaultSrc: ["'self'"],
//       scriptSrc: ["'self'", "https://cdn.socket.io", "https://cdn.jsdelivr.net"],
//       styleSrc: ["'self'", "https://cdnjs.cloudflare.com", "'unsafe-inline'"],
//       fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
//       imgSrc: ["'self'", "data:", "https://images.pexels.com"],
//       connectSrc: ["'self'", "https://cdn.socket.io", "https://cdn.jsdelivr.net"],
//       objectSrc: ["'none'"],
//       upgradeInsecureRequests: [], // This was already here, which is good
//     }
//   },
//   // Add these two lines to disable the problematic headers
//   hsts: false,
//   crossOriginEmbedderPolicy: false
// }));

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting for API routes
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // Limit each IP to 500 requests per window
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/', apiLimiter);

// Force correct MIME types
app.use((req, res, next) => {
  if (req.url.endsWith('.css')) {
    res.type('text/css');
  } else if (req.url.endsWith('.js')) {
    res.type('application/javascript');
  }
  next();
});
// ✅ SERVE STATIC FILES
app.use(express.static(path.join(__dirname, '..')));


// --- API Routes ---
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/kitchen', kitchenRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/bills', billRoutes);

app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        database: dbManager.isConnected() ? 'Connected' : 'Disconnected'
    });
});

// ✅ SPA CATCH-ALL ROUTE
// For any request that doesn't match an API route, send the index.html file.
// This must be placed AFTER all API routes.
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// --- General Error Handler ---
app.use((err, req, res, next) => {
    console.error('❌ Server Error:', err.stack);
    res.status(500).json({
        success: false,
        error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message
    });
});

// --- Server Startup ---
const PORT = process.env.PORT || 8888;

async function startServer() {
    try {
        await dbManager.connect();
        console.log('✅ Database connected successfully');
        
        server.listen(PORT, () => {
            console.log(`🚀 Restaurant Counter Server running on port ${PORT}`);
            console.log(`🔌 Socket.IO server running on port ${PORT}`);
            console.log(`📊 API Health Check: http://localhost:${PORT}/api/health`);
            console.log(`🔚 access to Counter dashboard: http://localhost:${PORT}`);
        });
        
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

// --- Graceful Shutdown ---
const shutdown = async () => {
    console.log('\n🛑 Shutting down server...');
    try {
        await dbManager.disconnect();
        server.close(() => {
            console.log('✅ Server shutdown complete');
            process.exit(0);
        });
    } catch (error) {
        console.error('❌ Error during shutdown:', error);
        process.exit(1);
    }
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

startServer();

module.exports = { app, server, io };