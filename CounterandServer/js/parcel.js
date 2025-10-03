import { initOrderInterface } from './order.js';
import { apiService } from './apiService.js';
import { showNotification } from './ui.js';
import { getOrders, addStateListener, removeStateListener } from './state.js';

let orderInterfaceCleanup = null;

/**
 * Toggles between the list of parcels and the order creation view.
 */
const showView = (view) => {
    const selectionView = document.getElementById("parcel-selection");
    const orderView = document.getElementById("parcel-order-view");

    if (view === 'order') {
        selectionView.style.display = "none";
        orderView.style.display = "block";
    } else {
        if (orderInterfaceCleanup) {
            orderInterfaceCleanup();
            orderInterfaceCleanup = null;
        }
        selectionView.style.display = "block";
        orderView.style.display = "none";
    }
};

/**
 * Renders the list of all parcel orders from the state.
 */
const renderParcelList = () => {
    const listContainer = document.getElementById("ongoing-parcels-list");
    if (!listContainer) return;

    const allOrders = getOrders();
    const parcels = allOrders.filter(p => p.OrderType === 'Parcel');

    if (parcels.length === 0) {
        listContainer.innerHTML = '<p class="no-data-msg">No parcel orders found.</p>';
        return;
    }

    listContainer.innerHTML = parcels.map(order => {
        const itemsSummary = order.items && order.items.length > 0
            ? `${order.items.length} items`
            : 'Order Placed';
        
        return `
            <div class="item-card parcel-card status-${order.Status.toLowerCase()}" data-order-id="${order.OrderID}">
                <div class="table-card-header">
                    <h4>Parcel #${order.OrderNumber}</h4>
                    <span class="status-badge status-${order.Status.toLowerCase()}" style="color:black">${order.Status}</span>
                </div>
                <div class="parcel-card-body">
                    <i class="fas fa-box-open parcel-icon"></i>
                    <p class="item-summary">${itemsSummary}</p>
                </div>
                <div class="parcel-card-footer">
                    <span>Total:</span>
                    <span class="total-amount">₹${(order.FinalAmount || 0).toFixed(2)}</span>
                </div>
            </div>
        `;
    }).join('');
};

/**
 * Initializes the parcel page, renders the view, and sets up listeners.
 */
export const initParcelPage = () => {
    renderParcelList();
    showView('list');

    const newParcelBtn = document.getElementById("new-parcel-order-btn");
    const backBtn = document.getElementById("back-to-parcels-btn");
    const listContainer = document.getElementById("ongoing-parcels-list");
    const orderView = document.getElementById("parcel-order-view");

    const handleNewParcelClick = async () => {
        // ✅ CORRECTED: Pass a callback function to handle navigation.
        orderInterfaceCleanup = await initOrderInterface(
            { type: 'Parcel' }, 
            orderView,
            () => showView('list')
        );
        showView('order');
    };

    const handleBackClick = () => {
        showView('list');
        renderParcelList();
    };
    
    const handleCardClick = async (e) => {
        const card = e.target.closest('.parcel-card');
        if (card && !card.classList.contains('status-completed')) {
            const orderId = card.dataset.orderId;
            showNotification('Loading...', `Fetching details for order #${orderId}.`);
            try {
                const response = await apiService.getOrderById(orderId);
                if(response.data){
                    // ✅ CORRECTED: Pass a callback function to handle navigation.
                    orderInterfaceCleanup = await initOrderInterface(
                        { type: 'Parcel', source: response.data }, 
                        orderView,
                        () => showView('list')
                    );
                    showView('order');
                } else {
                    throw new Error('Order data not found in response.');
                }
            } catch (error) {
                showNotification('Error', 'Failed to load parcel details.', 'error');
            }
        }
    };

    newParcelBtn?.addEventListener("click", handleNewParcelClick);
    backBtn?.addEventListener("click", handleBackClick);
    listContainer?.addEventListener('click', handleCardClick);
    
    addStateListener('orders', renderParcelList);

    return () => {
        showView('list');
        newParcelBtn?.removeEventListener("click", handleNewParcelClick);
        backBtn?.removeEventListener("click", handleBackClick);
        listContainer?.removeEventListener('click', handleCardClick);
        removeStateListener('orders', renderParcelList);
    };
};