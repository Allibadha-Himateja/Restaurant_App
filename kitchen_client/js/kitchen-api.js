import { showNotification, playNotificationSound, flashScreen } from './ui.js';
// Import the state refresh function to be called on socket events
import { refreshState } from './state.js';

class KitchenApiService {
    constructor() {
        // Use the global config object set in config.js
        this.config = window.KITCHEN_CONFIG || {};
        this.baseURL = this.config.API_BASE_URL;
        this.socket = null;
        this.isConnected = false;
        this.initSocket();
    }

    initSocket() {
        try {
            const socketUrl = this.config.SOCKET_URL;
            this.socket = io(socketUrl, { transports: ['websocket', 'polling'] });
            this.socket.emit('join-room', 'kitchen');

            this.socket.on('connect', () => {
                this.isConnected = true;
                this.updateConnectionStatus(true);
                showNotification('Connected', 'Kitchen display is online.', 'success');
                playNotificationSound('success');
            });

            this.socket.on('disconnect', () => {
                this.isConnected = false;
                this.updateConnectionStatus(false);
                showNotification('Disconnected', 'Connection lost.', 'error');
            });

            // When a new order arrives...
            this.socket.on('newOrder', data => {
                showNotification('New Order', `Order #${data.orderNumber} has been added.`, 'info');
                playNotificationSound('newOrder');
                flashScreen();
                // --- CORRECTED: Directly call the state refresh function ---
                refreshState();
            });
            
            // When an existing order is updated...
            this.socket.on('orderUpdate', data => {
                showNotification('Order Updated', `Items added to order #${data.orderNumber}`, 'info');
                playNotificationSound('newOrder');
                // --- CORRECTED: Directly call the state refresh function ---
                refreshState();
            });

        } catch (err) {
            console.error(err);
            showNotification('Error', 'Socket initialization failed', 'error');
        }
    }

    // ... (the rest of your request methods: getKitchenQueue, serveItem, etc. remain the same) ...
    async request(endpoint, options = {}) {
        // This function is fine, no changes needed
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        try {
            const res = await fetch(`${this.baseURL}${endpoint}`, { signal: controller.signal, headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }, ...options });
            clearTimeout(timeoutId);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
            return data;
        } catch (err) {
            clearTimeout(timeoutId);
            if (err.name === 'AbortError') throw new Error('Request timed out');
            throw err;
        }
    }

    async getKitchenQueue() { return this.request('/kitchen/queue'); }
    async serveItem(queueId, orderItemId) { return this.request('/kitchen/serve-item', { method: 'PATCH', body: JSON.stringify({ queueId, orderItemId }) }); }
    async updateOrderStatus(orderId, status) { return this.request(`/orders/${orderId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }); }
    formatTime(dateStr) { return new Date(dateStr).toLocaleTimeString('en-IN', { hour12: false, hour: '2-digit', minute: '2-digit' }); }

    updateConnectionStatus(isConnected) {
        const el = document.getElementById('connection-status');
        if (el) { el.className = `connection-status ${isConnected ? 'connected' : 'disconnected'}`; el.textContent = isConnected ? 'Connected' : 'Disconnected'; }
    }
}

export const kitchenApi = new KitchenApiService();
