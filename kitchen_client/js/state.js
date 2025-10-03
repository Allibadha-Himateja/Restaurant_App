import { kitchenApi } from './kitchen-api.js';
import { showNotification } from './ui.js';

const appState = { kitchenOrders: [] };
const stateEvents = new EventTarget();

export const addStateListener = (key, cb) => stateEvents.addEventListener(`state:change:${key}`, cb);
export const removeStateListener = (key, cb) => stateEvents.removeEventListener(`state:change:${key}`, cb);

export const getKitchenOrders = () => appState.kitchenOrders;

// This function is now called directly from kitchen-api.js on socket events
export const refreshState = async () => {
    try {
        const data = await kitchenApi.getKitchenQueue();
        appState.kitchenOrders = data.data || [];
        stateEvents.dispatchEvent(new Event('state:change:kitchenOrders'));
    } catch (err) {
        console.error(err);
        showNotification('Error', 'Could not fetch kitchen orders', 'error');
    }
};

export const markItemAsServed = async (queueId, orderItemId) => {
    try {
        await kitchenApi.serveItem(queueId, orderItemId);
        await refreshState();
    } catch (err) {
        showNotification('Error', `Could not mark item served: ${err.message}`, 'error');
        await refreshState(); // Refresh even on error to ensure consistency
    }
};

export const serveEntireParcel = async (itemsJson, orderId) => {
    try {
        const items = JSON.parse(itemsJson);
        await Promise.all(items.map(i => kitchenApi.serveItem(i.QueueID, i.OrderItemID)));
        await kitchenApi.updateOrderStatus(orderId, 'Ready');
        await refreshState();
    } catch (err) {
        showNotification('Error', `Could not serve parcel: ${err.message}`, 'error');
        await refreshState();
    }
};

export const renderKitchenOrders = () => {
    const container = document.getElementById('kot-display-area');
    if (!container) return;

    const orders = getKitchenOrders();
    if (!orders.length) { container.innerHTML = '<p class="no-data-msg">No pending kitchen orders.</p>'; return; }
    
    // Group items by OrderID to display as single tickets
    const grouped = orders.reduce((acc, item) => {
        if (!acc[item.OrderID]) {
            acc[item.OrderID] = { orderId: item.OrderID, orderNumber: item.OrderNumber, source: item.TableNumber ? `Table ${item.TableNumber}` : 'Parcel', createdAt: kitchenApi.formatTime(item.CreatedAt), items: [] };
        }
        acc[item.OrderID].items.push(item);
        return acc;
    }, {});

    container.innerHTML = Object.values(grouped).map(order => {
        let itemsHtml = '', footerHtml = '';

        if (order.source === 'Parcel') {
            itemsHtml = order.items.map(i => `<li class="kot-item-row-no-button"><div class="item-details"><span>${i.ItemName} <strong>x${i.Quantity}</strong></span></div></li>`).join('');
            const itemsJson = JSON.stringify(order.items.map(i => ({ QueueID: i.QueueID, OrderItemID: i.OrderItemID })));
            footerHtml = `<div class="kot-footer"><button class="btn btn-ready btn-serve-parcel" data-items='${itemsJson}' data-order-id="${order.orderId}">Serve Entire Parcel</button></div>`;
        } else {
            // For table orders, create a separate "Serve One" button for each quantity
            itemsHtml = order.items.flatMap(i => {
                const list = [];
                for (let j = 0; j < i.Quantity; j++) {
                    list.push(`<li class="kot-item-row"><div class="item-details"><span>${i.ItemName} <strong>x1</strong></span></div><button class="btn btn-ready btn-serve-one" data-queue-id="${i.QueueID}" data-order-item-id="${i.OrderItemID}">Serve One</button></li>`);
                }
                return list;
            }).join('');
        }

        return `<div class="kot-ticket"><div class="kot-header"><span class="table-name">${order.source}</span><span class="order-number">#${order.orderNumber}</span><span class="timestamp">${order.createdAt}</span></div><ul class="kot-items-list">${itemsHtml}</ul>${footerHtml}</div>`;
    }).join('');
};

export const initKitchenPage = async () => {
    await refreshState();
    renderKitchenOrders();

    const container = document.getElementById('kot-display-area');

    const handleClick = (e) => {
        const btnOne = e.target.closest('.btn-serve-one');
        const btnParcel = e.target.closest('.btn-serve-parcel');

        if (btnOne) {
            btnOne.disabled = true;
            btnOne.textContent = 'Serving...';
            markItemAsServed(parseInt(btnOne.dataset.queueId), parseInt(btnOne.dataset.orderItemId));
        }

        if (btnParcel) {
            btnParcel.disabled = true;
            btnParcel.textContent = 'Serving...';
            serveEntireParcel(btnParcel.dataset.items, parseInt(btnParcel.dataset.orderId));
        }
    };

    container?.addEventListener('click', handleClick);
    // Listen for our custom state change event to re-render
    stateEvents.addEventListener('state:change:kitchenOrders', renderKitchenOrders);
    
    // --- CORRECTED: Removed the redundant socket listener from here ---
    // kitchenApi.socket.on('kitchenQueueUpdate', refreshState);

    // Return a cleanup function to remove listeners if the page were to change
    return () => {
        container?.removeEventListener('click', handleClick);
        stateEvents.removeEventListener('state:change:kitchenOrders', renderKitchenOrders);
    };
};
