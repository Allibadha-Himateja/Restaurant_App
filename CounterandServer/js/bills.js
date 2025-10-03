import { getBills, getOrders, refreshState, addStateListener, removeStateListener } from './state.js';
import { apiService } from './apiService.js';
import { showNotification } from './ui.js';

// --- Helper Function to Generate Printable Bill HTML ---
const generateBillHtml = (bill, orderDetails) => {
    const aggregatedItems = orderDetails.items.reduce((accumulator, currentItem) => {
        const key = currentItem.ItemName;
        if (accumulator[key]) {
            accumulator[key].Quantity += currentItem.Quantity;
            accumulator[key].TotalPrice += currentItem.TotalPrice;
        } else {
            accumulator[key] = { ...currentItem };
        }
        return accumulator;
    }, {});

    const renderedItems = Object.values(aggregatedItems);
    const itemsHtml = renderedItems.map(item => `
        <tr>
            <td>${item.ItemName}</td>
            <td class="qty">${item.Quantity}</td>
            <td class="rate">₹${(item.TotalPrice / item.Quantity).toFixed(2)}</td>
            <td class="amount">₹${item.TotalPrice.toFixed(2)}</td>
        </tr>
    `).join('');

    const printStyles = `
        <style>
            body { font-family: 'Courier New', Courier, monospace; margin: 0; padding: 20px; color: #000; }
            .receipt { width: 100%; max-width: 320px; margin: auto; }
            h2 { text-align: center; margin: 0 0 10px 0; }
            p { margin: 2px 0; font-size: 14px; }
            .receipt-table { width: 100%; text-align: left; border-collapse: collapse; margin: 15px 0; font-size: 14px; }
            .receipt-table th, .receipt-table td { padding: 5px 0; }
            .receipt-table thead th { border-bottom: 1px dashed #000; }
            .receipt-table tbody { border-bottom: 1px dashed #000; }
            .qty, .rate, .amount { text-align: right; }
            .summary-item { display: flex; justify-content: space-between; padding: 2px 0; font-size: 14px; }
            .summary-total { border-top: 1px solid #000; font-weight: bold; margin-top: 5px; padding-top: 5px; display: flex; justify-content: space-between; font-size: 16px; }
        </style>
    `;

    return `
        <html>
            <head><title>Bill - ${bill.BillNumber}</title>${printStyles}</head>
            <body>
                <div class="receipt">
                    <h2>THE RESTAURANT</h2>
                    <p><strong>Bill No:</strong> ${bill.BillNumber}</p>
                    <p><strong>Order No:</strong> ${bill.OrderNumber}</p>
                    <p><strong>Date:</strong> ${new Date(bill.CreatedAt).toLocaleString()}</p>
                    <table class="receipt-table">
                        <thead><tr><th>Item</th><th class="qty">Qty</th><th class="rate">Rate</th><th class="amount">Amount</th></tr></thead>
                        <tbody>${itemsHtml}</tbody>
                    </table>
                    <div class="receipt-summary">
                        <div class="summary-item"><span>Subtotal:</span><span>₹${bill.SubTotal.toFixed(2)}</span></div>
                        <div class="summary-item"><span>Tax:</span><span>₹${bill.TaxAmount.toFixed(2)}</span></div>
                        <div class="summary-total"><span>Total:</span><span>₹${bill.TotalAmount.toFixed(2)}</span></div>
                    </div>
                </div>
            </body>
        </html>
    `;
};

const exportToCsv = async () => {
    showNotification('Preparing Report', 'Generating your CSV file...', 'info');
    try {
        const response = await apiService.getBillsWithItems();
        const billsWithItems = response.data;
        if (billsWithItems.length === 0) return alert("No data to export.");

        const headers = ["Date/Time", "Bill Number", "Order Number", "Source", "Details", "Total"];
        const rows = billsWithItems.map(bill => [
            `"${new Date(bill.CreatedAt).toLocaleString()}"`,
            `"${bill.BillNumber}"`,
            `"${bill.OrderNumber}"`,
            `"${bill.TableNumber || 'Parcel'}"`,
            `"${bill.items.map(i => `${i.ItemName} (x${i.Quantity})`).join("; ")}"`,
            bill.TotalAmount
        ]);
        
        const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "bills-report.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        console.error("Failed to generate CSV:", error);
        showNotification('Error', 'Could not generate the CSV report.', 'error');
    }
};

// --- Main Page Logic ---
export const initBillsPage = () => {
    const content = document.getElementById("bills-content");
    const bills = getBills();
    const orders = getOrders();
    
    let tableHtml = `
        <table class="bills-table">
            <thead>
                <tr>
                    <th>Bill Number</th><th>Order Number</th><th>Date/Time</th>
                    <th>Table</th><th>Status</th><th>Total</th><th>Actions</th>
                </tr>
            </thead>
            <tbody>`;
    
    if (!bills || bills.length === 0) {
        tableHtml += `<tr><td colspan="7" class="no-data-msg">No bills available.</td></tr>`;
    } else {
        const sortedBills = [...bills].sort((a, b) => new Date(b.CreatedAt) - new Date(a.CreatedAt));
        sortedBills.forEach(bill => {
            const originalOrder = orders.find(o => o.OrderNumber === bill.OrderNumber);
            const source = originalOrder ? (originalOrder.TableNumber || 'Parcel') : (bill.TableNumber || 'Parcel');
            let actionHtml = '';
            if (bill.PaymentStatus && bill.PaymentStatus.toLowerCase() === 'pending') {
                actionHtml = `<button class="btn btn-primary btn-sm btn-settle-bill" data-bill-id="${bill.BillID}">Settle & Print</button>`;
            } else {
                actionHtml = `<button class="btn btn-secondary btn-sm btn-view-receipt" data-bill-id="${bill.BillID}">View Receipt</button>`;
            }
            tableHtml += `
                <tr>
                    <td>${bill.BillNumber}</td>
                    <td>${bill.OrderNumber}</td>
                    <td>${new Date(bill.CreatedAt).toLocaleString()}</td>
                    <td>${source}</td>
                    <td><span class="status-badge status-${(bill.PaymentStatus || '').toLowerCase()}">${bill.PaymentStatus}</span></td>
                    <td>₹${bill.TotalAmount.toFixed(2)}</td>
                    <td>${actionHtml}</td>
                </tr>`;
        });
    }
    
    tableHtml += "</tbody></table>";
    content.innerHTML = tableHtml;

    const handleTableActionClick = async (e) => {
        const settleBtn = e.target.closest('.btn-settle-bill');
        const viewBtn = e.target.closest('.btn-view-receipt');
        const button = settleBtn || viewBtn;

        if (!button) return;

        const billId = parseInt(button.dataset.billId);
        const originalText = button.textContent;
        button.disabled = true;
        button.textContent = 'Processing...';

        // ✅ FIX: Open the window immediately before any 'await' calls.
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            showNotification('Pop-up Blocked', 'Please allow pop-ups to print receipts.', 'error');
            button.disabled = false;
            button.textContent = originalText;
            return;
        }
        printWindow.document.write('<html><body><h2>Generating receipt...</h2></body></html>');
        printWindow.document.close();

        try {
            const bill = getBills().find(b => b.BillID === billId);
            const order = getOrders().find(o => o.OrderNumber === bill.OrderNumber);
            if (!order) throw new Error('Could not find the original order for this bill.');

            // Now, fetch the detailed data
            const detailedOrderResponse = await apiService.getOrderById(order.OrderID);
            const detailedOrder = detailedOrderResponse.data;

            if (settleBtn) {
                await apiService.updateBillStatus(billId, 'Completed');
                if (order.OrderType === 'Parcel') {
                    await apiService.updateOrderStatus(order.OrderID, 'Completed');
                }
                showNotification('Success!', `Bill ${bill.BillNumber} has been settled.`, 'success');
            }

            // Populate the already-open window with the final bill HTML
            const billHtml = generateBillHtml(bill, detailedOrder);
            printWindow.document.open();
            printWindow.document.write(billHtml);
            printWindow.document.close();
            printWindow.focus();
            printWindow.print();
            printWindow.close();
            
        } catch (error) {
            console.error('Failed to process bill action:', error);
            showNotification('Error', error.message || 'Could not process the bill.', 'error');
            // Show error in the pop-up window if it's still open
            if(printWindow && !printWindow.closed) {
                printWindow.document.body.innerHTML = `<h2>Error</h2><p>${error.message}</p>`;
            }
        } finally {
            button.disabled = false;
            button.textContent = originalText;
        }
    };
    
    const downloadBtn = document.getElementById("download-excel-btn");
    const printPageBtn = document.getElementById("print-bills-btn");
    
    const downloadHandler = () => exportToCsv();
    const printPageHandler = () => window.print();

    content.addEventListener('click', handleTableActionClick);
    if (downloadBtn) downloadBtn.addEventListener("click", downloadHandler);
    if (printPageBtn) printPageBtn.addEventListener("click", printPageHandler);

    addStateListener('bills', initBillsPage);
    addStateListener('orders', initBillsPage);

    return () => {
        content.removeEventListener('click', handleTableActionClick);
        if (downloadBtn) downloadBtn.removeEventListener("click", downloadHandler);
        if (printPageBtn) printPageBtn.removeEventListener("click", printPageHandler);
        removeStateListener('bills', initBillsPage);
        removeStateListener('orders', initBillsPage);
    };
};