// src/config.js

// This logic automatically switches to API URL based on where the site is running.
const API_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:5001'                            // Localhost (Your Laptop)
    : 'https://brewandbites-backend.onrender.com';              // Cloud (Your Live Server)

export default API_URL;