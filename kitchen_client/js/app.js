import { initKitchenPage } from './state.js';

window.updateKitchenStatus = async () => {
    await initKitchenPage();
};

document.addEventListener('DOMContentLoaded', async () => {
    await initKitchenPage();
});
