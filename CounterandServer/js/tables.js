import { getOrders, getTables, addStateListener, removeStateListener } from './state.js';
import { initOrderInterface } from './order.js';

let orderInterfaceCleanup = null;

/**
 * Toggles between the list of tables and the order creation view.
 */
const showView = (view) => {
    const selectionView = document.getElementById("table-selection-view");
    const orderView = document.getElementById("order-taking-view");

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
 * Renders the grid of tables with their current status and order details.
 */
const renderTablesView = () => {
    const tablesContainer = document.getElementById("tables-container");
    if (!tablesContainer) return;

    const tables = getTables();
    const orders = getOrders();

    if (tables.length === 0) {
        tablesContainer.innerHTML = '<p class="no-data-msg">No tables found.</p>';
        return;
    }

    tablesContainer.innerHTML = tables.map(table => {
        const status = table.Status || 'Available';
        const statusClass = `status-${status.toLowerCase()}`;
        let detailsHtml = '';

        switch (status) {
            case 'Occupied':
                const order = orders.find(o => o.OrderID === table.CurrentOrderID);
                if (order) {
                    const total = order.FinalAmount || 0;
                    const orderNum = order.OrderNumber || 'N/A';
                    
                    // ✅ NEW: Create a summary of item statuses
                    let statusSummary = 'Order Placed';
                    if (order.items && order.items.length > 0) {
                        const statusCounts = order.items.reduce((acc, item) => {
                            const itemStatus = item.Status || 'Preparing';
                            acc[itemStatus] = (acc[itemStatus] || 0) + item.Quantity;
                            return acc;
                        }, {});

                        statusSummary = Object.entries(statusCounts)
                            .map(([st, count]) => `${count} ${st}`)
                            .join(' | ');
                    }

                    detailsHtml = `
                        <div class="table-details">
                            <span><i class="fas fa-receipt"></i> #${orderNum}</span>
                            <span><i class="fas fa-rupee-sign"></i> ${total.toFixed(2)}</span>
                        </div>
                        <div class="order-status-summary">
                           ${statusSummary}
                        </div>`;
                } else {
                    detailsHtml = `<p class="error-msg">Order data loading...</p>`;
                }
                break;
            
            case 'Billed':
                detailsHtml = `<p class="availability">Billed, pending cleanup</p>`;
                break;

            case 'Available':
            default:
                detailsHtml = '<p class="availability">Ready for guests</p>';
                break;
        }
        
        return `
            <div class="item-card table-card ${statusClass}" data-table-id="${table.TableID}">
                <div class="table-card-header">
                    <h4>${table.TableNumber}</h4>
                    <span class="status-badge">${status}</span>
                </div>
                <div class="table-card-body">
                    <i class="fas fa-chair table-icon"></i>
                    ${detailsHtml}
                </div>
            </div>
        `;
    }).join('');
};


/**
 * Initializes the tables page, renders the initial view, and sets up listeners.
 */
export const initTablesPage = () => {
    renderTablesView();
    showView('list');

    const tablesContainer = document.getElementById("tables-container");
    const backButton = document.getElementById("back-to-tables-btn");

    const handleTableClick = async (e) => {
        const card = e.target.closest('.table-card');
        if (card) {
            const tableId = parseInt(card.dataset.tableId);
            const selectedTable = getTables().find(t => t.TableID === tableId);
            if (selectedTable) {
                const orderView = document.getElementById("order-taking-view");
                
                orderInterfaceCleanup = await initOrderInterface(
                    { type: 'Table', source: selectedTable }, 
                    orderView,
                    () => showView('list')
                );

                showView('order');
            }
        }
    };

    const handleBackClick = () => {
        showView('list');
        renderTablesView();
    };

    tablesContainer?.addEventListener("click", handleTableClick);
    backButton?.addEventListener("click", handleBackClick);
    
    addStateListener('tables', renderTablesView);
    addStateListener('orders', renderTablesView);

    return () => {
        if (orderInterfaceCleanup) {
            orderInterfaceCleanup();
            orderInterfaceCleanup = null;
        }
        tablesContainer?.removeEventListener("click", handleTableClick);
        backButton?.removeEventListener("click", handleBackClick);
        
        removeStateListener('tables', renderTablesView);
        removeStateListener('orders', renderTablesView);
    };
};