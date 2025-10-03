import { getKitchenOrders, addStateListener, removeStateListener, refreshState } from './state.js';
import { apiService } from './apiService.js';
import { showNotification } from './ui.js';

const markItemAsServed = async (queueId, orderItemId) => {
    try {
        await apiService.serveKitchenItem(queueId, orderItemId);
        // The UI will update automatically via the WebSocket event caught by state.js
        await refreshState('kitchenOrders');
    } catch (error) {
        showNotification('API Error', `Could not update item status: ${error.message}`, 'error');
        renderKitchenOrders(); 
    }
};

const serveEntireParcel = async (itemsJson, orderId) => {
    try {
        const items = JSON.parse(itemsJson);
        const servePromises = items.map(item => 
            apiService.serveKitchenItem(item.QueueID, item.OrderItemID)
        );
        
        await Promise.all(servePromises);
        await apiService.updateOrderStatus(orderId, 'Ready');
        // The UI will update automatically via WebSocket events.
    } catch (error) {
        showNotification('API Error', `Could not serve the entire parcel: ${error.message}`, 'error');
        renderKitchenOrders();
    }
};

// ✅ FIX: This function is now synchronous and ONLY renders the UI.
const renderKitchenOrders = () => {
    // It no longer calls refreshState().
    const kotContainer = document.getElementById('kot-display-area');
    if (!kotContainer) return;

    const allKitchenItems = getKitchenOrders() || [];
    
    if (allKitchenItems.length === 0) {
        kotContainer.innerHTML = `<p class="no-data-msg">No pending kitchen orders.</p>`;
        return;
    }

    const orders = allKitchenItems.reduce((acc, item) => {
        if (!acc[item.OrderID]) {
            acc[item.OrderID] = {
                orderId: item.OrderID,
                orderNumber: item.OrderNumber,
                source: item.TableNumber ? `Table ${item.TableNumber}` : `Parcel`,
                createdAt: new Date(item.CreatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                items: []
            };
        }
        acc[item.OrderID].items.push(item);
        return acc;
    }, {});

    kotContainer.innerHTML = Object.values(orders).map(order => {
        let itemsListHtml = '';
        let ticketFooterHtml = '';

        if (order.source === 'Parcel') {
            itemsListHtml = order.items.map(item => `
                <li class="kot-item-row-no-button">
                    <div class="item-details">
                        <span>${item.ItemName} <strong>x${item.Quantity}</strong></span>
                    </div>
                </li>
            `).join('');

            const itemsJson = JSON.stringify(order.items.map(i => ({ QueueID: i.QueueID, OrderItemID: i.OrderItemID })));
            ticketFooterHtml = `
                <div class="kot-footer">
                    <button class="btn btn-ready btn-serve-parcel" data-items='${itemsJson}' data-order-id="${order.orderId}">
                        Serve Entire Parcel
                    </button>
                </div>
            `;
        } else {
            itemsListHtml = order.items.flatMap(item => {
                const individualItems = [];
                for (let i = 0; i < item.Quantity; i++) {
                    individualItems.push(`
                        <li class="kot-item-row">
                            <div class="item-details">
                                <span>${item.ItemName} <strong>x1</strong></span>
                            </div>
                            <button class="btn btn-ready btn-serve-one" data-queue-id="${item.QueueID}" data-order-item-id="${item.OrderItemID}">
                                Serve One
                            </button>
                        </li>
                    `);
                }
                return individualItems;
            }).join('');
        }

        return `
            <div class="kot-ticket">
                <div class="kot-header">
                    <span class="table-name">${order.source}</span>
                    <span class="order-number">#${order.orderNumber}</span>
                    <span class="timestamp">${order.createdAt}</span>
                </div>
                <ul class="kot-items-list">${itemsListHtml}</ul>
                ${ticketFooterHtml}
            </div>
        `;
    }).join('');
};

// ✅ FIX: This function is now async and handles the initial data fetch.
export const initKitchenPage = async () => {
    // 1. Fetch the initial data for the page ONE time.
    await refreshState('kitchenOrders');
    // 2. Now render the view with the fresh data.
    renderKitchenOrders();

    const kotContainer = document.getElementById('kot-display-area');

    const handleServeClick = (e) => {
        const serveOneBtn = e.target.closest('.btn-serve-one');
        const serveParcelBtn = e.target.closest('.btn-serve-parcel');

        if (serveOneBtn) {
            const queueId = parseInt(serveOneBtn.dataset.queueId);
            const orderItemId = parseInt(serveOneBtn.dataset.orderItemId);
            serveOneBtn.disabled = true;
            serveOneBtn.textContent = 'Serving...';
            markItemAsServed(queueId, orderItemId);
        }

        if (serveParcelBtn) {
            const itemsJson = serveParcelBtn.dataset.items;
            const orderId = parseInt(serveParcelBtn.dataset.orderId);
            serveParcelBtn.disabled = true;
            serveParcelBtn.textContent = 'Serving...';
            serveEntireParcel(itemsJson, orderId);
        }
    };
    kotContainer?.addEventListener('click', handleServeClick);

    // 3. Subscribe to future state changes.
    addStateListener('kitchenOrders', renderKitchenOrders);

    // Return a cleanup function
    return () => {
        kotContainer?.removeEventListener('click', handleServeClick);
        removeStateListener('kitchenOrders', renderKitchenOrders);
    };
};