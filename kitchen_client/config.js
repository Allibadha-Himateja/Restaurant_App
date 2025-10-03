// This is the single, correct configuration object for your kitchen client.
const KITCHEN_CONFIG = {
    // --- URLs for IIS Deployment ---
    // These MUST point to your main CounterAndServer application on port 8888.
    SERVER_URL: 'http://192.168.29.114:8888',
    API_BASE_URL: 'http://192.168.29.114:8888/api',
    SOCKET_URL: 'http://192.168.29.114:8888',

    // --- Application Settings ---
    // Interval for automatically refreshing the kitchen display (in milliseconds).
    REFRESH_INTERVAL: 30000, // 30 seconds

    // Enable or disable the notification sound for new orders.
    NOTIFICATION_SOUND: true,

    // Enable or disable the auto-refresh feature.
    AUTO_REFRESH: true,

    // Visual theme for the display.
    THEME: 'light',

    // Language setting.
    LANGUAGE: 'en',
};

// Make the configuration available globally in the browser.
// This single line ensures the object is accessible by your other scripts.
if (typeof window !== 'undefined') {
    window.KITCHEN_CONFIG = KITCHEN_CONFIG;
}

