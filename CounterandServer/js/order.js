import { getMenu, refreshState } from './state.js';
import { showNotification } from './ui.js';
import { apiService } from './apiService.js';

// --- Module-level State ---
let currentOrder = {
    tableId: null,
    orderType: null,
    items: [], // This will hold individual line items, not aggregated ones
};

// --- DOM Element Cache ---
let menuGridContainer, summaryContainer, actionButtonsContainer, categoryFilters, searchInput, orderTitle;

// --- Helper Functions ---
const calculateTotals = (items) => {
    const subtotal = items.reduce((sum, item) => sum + (item.RegularPrice || item.UnitPrice || item.Price || 0) * (item.quantity || 0), 0);
    const taxRate = 0.05;
    const tax = subtotal * taxRate;
    const grandTotal = subtotal + tax;
    return { subtotal, tax, grandTotal };
};

// --- Render Functions ---
const renderMenuGrid = () => {
    if (!menuGridContainer) return;
    const filter = searchInput.value.toLowerCase();
    const activeCategory = categoryFilters.querySelector('.filter-btn.active');
    const categoryId = activeCategory ? activeCategory.dataset.categoryId : 'All';
    const menu = getMenu() || [];
    const filteredMenu = menu.filter(item =>
        item.IsAvailable &&
        (categoryId === 'All' || item.CategoryID == categoryId) &&
        item.ItemName.toLowerCase().includes(filter)
    );
    if (filteredMenu.length === 0) {
        menuGridContainer.innerHTML = `<p class="no-data-msg" style="grid-column: 1 / -1;">No menu items found.</p>`;
    } else {
        menuGridContainer.innerHTML = filteredMenu.map(item => `
            <div class="item-card menu-item-card" data-item-id="${item.ItemID}">
                <div class="card-content">
                    <h4 class="item-name">${item.ItemName}</h4>
                    <p class="item-price">₹${item.RegularPrice.toFixed(2)}</p>
                </div>
            </div>`).join('');
    }
};

const renderOrderSummary = () => {
    if (!summaryContainer) return;
    if (currentOrder.items.length === 0) {
        summaryContainer.innerHTML = `
            <div class="summary-header"><h3>Current Order</h3></div>
            <div class="order-empty"><i class="fas fa-receipt"></i><p>Click menu items to add them.</p></div>`;
    } else {
        const { subtotal, tax, grandTotal } = calculateTotals(currentOrder.items);

        // Aggregate items by ItemID for a clean UI display
        const aggregatedItems = currentOrder.items.reduce((acc, item) => {
            if (!acc[item.ItemID]) {
                acc[item.ItemID] = {
                    ItemID: item.ItemID,
                    ItemName: item.ItemName,
                    Price: (item.RegularPrice || item.UnitPrice || item.Price || 0),
                    totalQuantity: 0,
                    statuses: {}
                };
            }
            acc[item.ItemID].totalQuantity += item.quantity;
            const status = item.Status || 'Preparing';
            acc[item.ItemID].statuses[status] = (acc[item.ItemID].statuses[status] || 0) + item.quantity;
            return acc;
        }, {});

        const orderItemsHtml = Object.values(aggregatedItems).map(aggItem => {
            const statusParts = Object.entries(aggItem.statuses).map(([status, count]) => `${count} ${status}`);
            const statusText = statusParts.join(', ');

            return `
            <div class="order-item-row" data-item-id="${aggItem.ItemID}">
                <div class="item-info">
                    <div>
                        <span class="item-name">${aggItem.ItemName}</span>
                        <small class="item-status">${statusText}</small>
                    </div>
                    <span class="item-price">₹${aggItem.Price.toFixed(2)}</span>
                </div>
                <div class="item-actions">
                    <div class="quantity-controls">
                        <button class="btn-qty-minus" data-item-id="${aggItem.ItemID}">-</button>
                        <span class="item-qty">${aggItem.totalQuantity}</span>
                        <button class="btn-qty-plus" data-item-id="${aggItem.ItemID}">+</button>
                    </div>
                    <button class="btn-icon btn-delete-item" data-item-id="${aggItem.ItemID}"><i class="fas fa-trash-alt"></i></button>
                </div>
            </div>`;
        }).join('');

        summaryContainer.innerHTML = `
            <div class="summary-header"><h3>Current Order</h3></div>
            <div class="order-items-list">${orderItemsHtml}</div>
            <div class="order-totals">
                <div class="total-row"><span>Subtotal</span><span>₹${subtotal.toFixed(2)}</span></div>
                <div class="total-row"><span>Tax (5%)</span><span>₹${tax.toFixed(2)}</span></div>
                <div class="total-row grand-total"><span>Grand Total</span><span>₹${grandTotal.toFixed(2)}</span></div>
            </div>`;
    }
    updateActionButtonsState();
};

const updateActionButtonsState = () => {
    if (!actionButtonsContainer) return;

    const sendBtn = actionButtonsContainer.querySelector('#send-to-kitchen-btn');
    const checkoutBtn = actionButtonsContainer.querySelector('#checkout-btn');

    if (sendBtn) {
        const hasNewItems = currentOrder.items.some(item => !item.OrderItemID);
        sendBtn.disabled = !hasNewItems;
        sendBtn.textContent = currentOrder.OrderID ? 'Update Order' : 'Send to Kitchen';
    }

    if (checkoutBtn) {
        checkoutBtn.style.display = currentOrder.OrderID ? 'inline-block' : 'none';
    }
};

// --- Initialization ---
export const initOrderInterface = async (config, orderViewContainer, onComplete) => {

    const handleSendToKitchen = async () => {
        const itemsToSend = currentOrder.items
            .filter(item => !item.OrderItemID) // Find all new, unsaved line items
            .map(item => ({ itemId: item.ItemID, quantity: item.quantity }));
    
        if (itemsToSend.length === 0) {
            showNotification('No new items', 'There are no new items to send to the kitchen.', 'info');
            return;
        }
        
        showNotification('Sending...', 'Submitting new items...', 'info');
        try {
            let response;
            if (currentOrder.OrderID) {
                response = await apiService.addItemsToOrder(currentOrder.OrderID, { items: itemsToSend });
            } else {
                const orderData = {
                    tableId: currentOrder.tableId,
                    orderType: currentOrder.orderType,
                    items: itemsToSend
                };
                response = await apiService.createOrder(orderData);
            }
    
            if (response && response.success) {
                const orderNum = response.data.orderNumber || currentOrder.OrderNumber;
                showNotification('Success!', `Order #${orderNum} updated successfully.`, 'success');
    
                await refreshState("orders");
                await refreshState("tables");
                
                // ✅ CORRECTED: Call the callback function to navigate back.
                if (onComplete) onComplete();
                
            } else {
                throw new Error(response.error || 'The server responded with an error.');
            }
        } catch (error) {
            console.error("Failed to send order:", error);
        }
    };
    
    const handleCheckout = async () => {
        if (!currentOrder.OrderID) {
            showNotification('Error', 'Cannot checkout an order that has not been sent to the kitchen.', 'error');
            return;
        }
        showNotification('Checking out...', `Generating bill for Order #${currentOrder.OrderNumber}.`, 'info');
        try {
            const response = await apiService.generateBill(currentOrder.OrderID);
            if (response.success) {
                showNotification('Success!', 'Checkout complete and table is now clear.', 'success');
                await refreshState("orders");
                await refreshState("tables");
                
                // ✅ CORRECTED: Call the callback function to navigate back.
                if (onComplete) onComplete();
                
            } else {
                throw new Error(response.error || 'The server responded with an error.');
            }
        } catch (error) {
            console.error("Failed to checkout:", error);
        }
    };
    
    // --- Cart Management ---
    const handleAddItem = (itemId) => {
        const menuItem = getMenu().find(i => i.ItemID === itemId);
        if (menuItem) {
            currentOrder.items.push({
                ...menuItem,
                quantity: 1,
                Status: 'Preparing'
            });
        }
        renderOrderSummary();
    };
    
    const handleRemoveItem = (itemId) => {
        for (let i = currentOrder.items.length - 1; i >= 0; i--) {
            if (currentOrder.items[i].ItemID === itemId && !currentOrder.items[i].OrderItemID) {
                currentOrder.items.splice(i, 1);
                renderOrderSummary();
                return;
            }
        }
    };
    
    const handleDeleteItem = (itemId) => {
        const originalCount = currentOrder.items.length;
        currentOrder.items = currentOrder.items.filter(item => {
            return item.ItemID !== itemId || !!item.OrderItemID;
        });
    
        if (currentOrder.items.length < originalCount) {
            renderOrderSummary();
        }
    };
    
    // --- Event Delegation ---
    function handleOrderViewClick(e) {
        const target = e.target;
        const filterBtn = target.closest('.filter-btn');
        if (filterBtn) {
            categoryFilters.querySelector('.filter-btn.active')?.classList.remove('active');
            filterBtn.classList.add('active');
            renderMenuGrid();
            return;
        }
        const menuItemCard = target.closest('.menu-item-card');
        if (menuItemCard) {
            handleAddItem(parseInt(menuItemCard.dataset.itemId));
            return;
        }
        const plusBtn = target.closest('.btn-qty-plus');
        if (plusBtn) {
            handleAddItem(parseInt(plusBtn.dataset.itemId));
            return;
        }
        const minusBtn = target.closest('.btn-qty-minus');
        if (minusBtn) {
            handleRemoveItem(parseInt(minusBtn.dataset.itemId));
            return;
        }
        const deleteBtn = target.closest('.btn-delete-item');
        if (deleteBtn) {
            handleDeleteItem(parseInt(deleteBtn.dataset.itemId));
            return;
        }
        if (target.closest('[id^="send-to-kitchen-btn"]')) {
            handleSendToKitchen();
            return;
        }
        const checkoutBtn = target.closest('#checkout-btn');
        if (checkoutBtn) {
            handleCheckout();
            return;
        }
    }

    const table = config.source;

    menuGridContainer = orderViewContainer.querySelector('#menu-grid-container');
    summaryContainer = orderViewContainer.querySelector('#current-order-summary');
    actionButtonsContainer = orderViewContainer.querySelector('.action-buttons');
    categoryFilters = orderViewContainer.querySelector('#category-filters');
    searchInput = orderViewContainer.querySelector('#menu-search-input');
    orderTitle = orderViewContainer.querySelector('#order-title, #parcel-order-title');

    summaryContainer.innerHTML = `
        <div class="summary-header"><h3>Current Order</h3></div>
        <div class="order-empty"><p>Loading order...</p></div>`;
    actionButtonsContainer.querySelector('[id^="send-to-kitchen-btn"]').disabled = true;

    if (config.type === 'Table' && table && table.Status === 'Occupied' && table.CurrentOrderID) {
        try {
            const response = await apiService.getOrderById(table.CurrentOrderID);
            currentOrder = response.data;
            currentOrder.items = response.data.items.map(item => ({
                ...item,
                quantity: item.Quantity,
            })) || [];
        } catch (error) {
            console.error("Failed to fetch order details:", error);
            showNotification('Error', 'Could not load existing order.', 'error');
            currentOrder = { tableId: table.TableID, orderType: 'DineIn', items: [] };
        }
    } else if (config.type === 'Table' && table) {
        currentOrder = { tableId: table.TableID, orderType: 'DineIn', items: [] };
    } else {
        currentOrder = { tableId: null, orderType: 'Parcel', items: [] };
        if (config.source && config.source.OrderID) { // Check for existing parcel data
            currentOrder = config.source;
            currentOrder.items = (config.source.items || []).map(item => ({
                ...item,
                quantity: item.Quantity,
            }));
        }
    }

    if (config.type === 'Table') {
        const titlePrefix = currentOrder.OrderID ? `Editing Order #${currentOrder.OrderNumber} for` : 'New Order for';
        orderTitle.textContent = `${titlePrefix} Table ${table.TableNumber}`;
    } else {
        orderTitle.textContent = currentOrder.OrderID ? `Editing Parcel #${currentOrder.OrderNumber}` : 'New Parcel Order';
    }

    searchInput.value = '';
    const categories = getMenu().reduce((acc, item) => {
        if (!acc.find(c => c.CategoryID === item.CategoryID)) {
            acc.push({ CategoryID: item.CategoryID, CategoryName: item.CategoryName });
        }
        return acc;
    }, []);
    categoryFilters.innerHTML = `<button class="filter-btn active" data-category-id="All">All</button>` +
        categories.map(cat => `<button class="filter-btn" data-category-id="${cat.CategoryID}">${cat.CategoryName}</button>`).join('');

    renderMenuGrid();
    renderOrderSummary();

    orderViewContainer.addEventListener('click', handleOrderViewClick);
    searchInput.addEventListener('input', renderMenuGrid);

    return () => {
        orderViewContainer.removeEventListener('click', handleOrderViewClick);
        searchInput.removeEventListener('input', renderMenuGrid);
    };
};