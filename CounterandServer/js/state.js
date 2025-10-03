import { apiService, socketService } from './apiService.js';
import { showNotification } from './ui.js';

// --- Central Application State ---
const appState = {
    orders: [],
    tables: [],
    menu: [],
    kitchenOrders: [],
    bills: [],
};

// --- Custom Event System ---
const stateEvents = new EventTarget();

/**
 * Allows page modules to listen for changes to a specific part of the state.
 * @param {string} key The state key to listen to (e.g., 'tables').
 * @param {Function} callback The function to call when the state changes.
 */
export const addStateListener = (key, callback) => {
    stateEvents.addEventListener(`state:change:${key}`, callback);
};
export const removeStateListener = (key, callback) => {
    stateEvents.removeEventListener(`state:change:${key}`, callback);
};

// --- Data Fetching and Management ---

/**
 * A reusable function to refresh a single piece of state from the API.
 * @param {string} key The key of the state to refresh.
 */
export const refreshState = async (key) => {
    try {
        let response;
        switch (key) {
            case 'tables': response = await apiService.getTables(); break;
            case 'menu': response = await apiService.getMenu(); break;
            case 'kitchenOrders': response = await apiService.getKitchenOrders(); break;
            case 'bills': response = await apiService.getBills(); break;
            case 'orders': response = await apiService.getOrders(); break;
            default: console.warn(`Unknown state key: ${key}`); return;
        }
        if (response.success) {
            appState[key] = response.data;
            console.log(`✅ State for '${key}' has been refreshed via API.`);
            stateEvents.dispatchEvent(new Event(`state:change:${key}`));
        } else {
            throw new Error(response.error);
        }
    } catch (error) {
        showNotification('Refresh Error', `Could not refresh ${key}.`, 'error');
    }
};

/**
 * Initializes the entire application state on startup by fetching data sequentially.
 */
export const initializeAppState = async () => {
    document.body.classList.add('loading');
    try {
        const keysToFetch = ['orders', 'menu', 'tables', 'kitchenOrders', 'bills'];
        for (const key of keysToFetch) {
            await refreshState(key);
        }
        listenForRealtimeUpdates(); // Start listening for socket events
        console.log('✅ Application state initialized.');
    } catch (error) {
        console.error('❌ Failed to initialize application state:', error);
        showNotification('Fatal Error', 'Could not load initial data.', 'error');
    } finally {
        document.body.classList.remove('loading');
    }
};

// --- Getters ---
export const getTables = () => appState.tables;
export const getMenu = () => appState.menu;
export const getKitchenOrders = () => appState.kitchenOrders;
export const getBills = () => appState.bills;
export const getOrders = () => appState.orders;

// --- Real-time Update Handling ---
function listenForRealtimeUpdates() {
    socketService.on('orderUpdate', (updatedData) => {
        const index = appState.orders.findIndex(o => o.OrderID === updatedData.OrderID);
        if (index !== -1) {
            appState.orders[index] = { ...appState.orders[index], ...updatedData };
            stateEvents.dispatchEvent(new Event('state:change:orders'));
        } else {
            appState.orders.unshift(updatedData);
            stateEvents.dispatchEvent(new Event('state:change:orders'));
        }
    });

    socketService.on('tableStatusUpdate', (updatedData) => {
        const index = appState.tables.findIndex(t => t.TableID === updatedData.TableID);
        if (index !== -1) appState.tables[index] = updatedData;
        stateEvents.dispatchEvent(new Event('state:change:tables'));
    });
    
    // For lists where we get a full refresh, we can call refreshState
    socketService.on('billsUpdate', () => refreshState('bills'));
    socketService.on('kitchenQueueUpdate', () => refreshState('kitchenOrders'));
}