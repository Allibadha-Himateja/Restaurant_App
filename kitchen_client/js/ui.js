// Generic UI helper functions for Kitchen Display

// Show a notification
export const showNotification = (title, message, type = 'info') => {
    const container = document.getElementById('notification-container') || createNotificationContainer();
    const notification = document.createElement('div');
    notification.className = `kitchen-notification kitchen-notification-${type}`;
    notification.innerHTML = `
        <div class="notification-title">${title}</div>
        <div class="notification-message">${message}</div>
        <div class="notification-time">${new Date().toLocaleTimeString()}</div>
        <button class="notification-close" onclick="this.parentElement.remove()">&times;</button>
    `;
    container.appendChild(notification);
    setTimeout(() => notification.remove(), 8000);
};

// Create the notification container if it doesn't exist
const createNotificationContainer = () => {
    const container = document.createElement('div');
    container.id = 'notification-container';
    document.body.appendChild(container);
    return container;
};

// Optional: Flash screen effect (for new orders)
export const flashScreen = () => {
    const flash = document.createElement('div');
    flash.style.cssText = `
        position: fixed;
        top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(255,255,255,0.8);
        z-index: 9999;
        pointer-events: none;
        animation: flash 0.5s ease-out;
    `;
    const style = document.createElement('style');
    style.textContent = `
        @keyframes flash {
            0% {opacity: 0;}
            50% {opacity: 1;}
            100% {opacity: 0;}
        }
    `;
    document.head.appendChild(style);
    document.body.appendChild(flash);
    setTimeout(() => { flash.remove(); style.remove(); }, 500);
};

// Optional: Play a notification sound
export const playNotificationSound = (type = 'default') => {
    if (!window.KITCHEN_CONFIG?.NOTIFICATION_SOUND) return;

    const freqMap = {
        newOrder: [800, 1000, 1200],
        success: [600, 800],
        default: [800]
    };
    const freqs = freqMap[type] || freqMap.default;

    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    freqs.forEach((f, i) => {
        setTimeout(() => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.frequency.value = f;
            osc.type = 'sine';
            gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
            osc.start(audioCtx.currentTime);
            osc.stop(audioCtx.currentTime + 0.2);
        }, i * 250);
    });
};
