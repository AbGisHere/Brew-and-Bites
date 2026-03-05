// src/utils/apiInterceptor.js

const originalFetch = window.fetch;

window.fetch = async (...args) => {
    let [resource, config] = args;

    // Create config if it doesn't exist
    if (!config) {
        config = {};
    }

    // Ensure headers exist
    if (!config.headers) {
        config.headers = {};
    }

    // We only care about adding x-restaurant-id for API calls.
    // We don't want to interfere with external URLs (like ipify).
    const isApiCall = typeof resource === 'string' && resource.includes('/api/');

    if (isApiCall) {
        // 1. Try to get restaurant ID from currently selected restaurant (Super Admin override)
        const selectedRestaurantStr = localStorage.getItem('selectedRestaurant');
        if (selectedRestaurantStr) {
            try {
                const selected = JSON.parse(selectedRestaurantStr);
                if (selected && selected._id) {
                    config.headers['x-restaurant-id'] = selected._id;
                }
            } catch (e) {
                console.error('Failed to parse selectedRestaurant', e);
            }
        }
        // 2. Otherwise, try to infer from the logged-in user
        else {
            const userStr = localStorage.getItem('user');
            if (userStr) {
                try {
                    const user = JSON.parse(userStr);
                    // If it's a regular user, they have a restaurantId
                    // If it's Super Admin (AbG), they might not have one, so we don't send one until they select
                    if (user && user.restaurantId) {
                        config.headers['x-restaurant-id'] = user.restaurantId;
                    }
                } catch (e) {
                    console.error('Failed to parse user from localStorage', e);
                }
            }
        }

        // 3. Customer Fallback
        // If there's an active order or table we scanned that gave us a restaurantId, we can use it.
        // For customers, the table fetch handles everything, but just in case:
        if (!config.headers['x-restaurant-id']) {
            const tableStr = localStorage.getItem('ordering_table');
            if (tableStr) {
                try {
                    const tableInfo = JSON.parse(tableStr);
                    if (tableInfo && tableInfo.restaurantId) {
                        config.headers['x-restaurant-id'] = tableInfo.restaurantId;
                    }
                } catch (e) { }
            }
        }
    }

    return originalFetch(resource, config);
};
