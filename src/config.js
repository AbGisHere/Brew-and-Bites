// src/config.js

// 1. Log the hostname so we can see what the browser sees
console.log("🔍 System Check - Hostname:", window.location.hostname);

// 2. Determine if we are running locally
const isLocal = 
    window.location.hostname === 'localhost' || 
    window.location.hostname === '127.0.0.1';

// 3. Select the API URL
const API_URL = isLocal 
    ? 'http://localhost:5001' 
    : 'https://brewandbites-backend.onrender.com'; // Your Render URL

// 4. Log the final decision
console.log("🚀 API Configuration Set To:", API_URL);

export default API_URL;