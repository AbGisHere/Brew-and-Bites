const mongoose = require('mongoose');

// Multi-database connection system
const databases = {
  central: null, // Super Admin database (restaurants, users, analytics)
  restaurants: {} // Per-restaurant databases
};

const getDatabase = (restaurantSlug = null) => {
  // Use environment variable if available, otherwise fallback to localhost
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017';

  // Safely extract the base URI (without database name)
  let baseUri = mongoUri;
  if (baseUri.split('/').length > 3 && !baseUri.endsWith('/')) {
    baseUri = baseUri.substring(0, baseUri.lastIndexOf('/'));
  } else if (baseUri.endsWith('/')) {
    baseUri = baseUri.slice(0, -1);
  }

  if (restaurantSlug) {
    // Connect to specific restaurant database
    if (!databases.restaurants[restaurantSlug]) {
      databases.restaurants[restaurantSlug] = mongoose.createConnection(
        `${baseUri}/restaurant_${restaurantSlug}`
      );
    }
    return databases.restaurants[restaurantSlug];
  } else {
    // Connect to central database for Super Admin
    if (!databases.central) {
      databases.central = mongoose.createConnection(
        `${baseUri}/brew_and_bites_central`
      );
    }
    return databases.central;
  }
};

module.exports = { getDatabase };