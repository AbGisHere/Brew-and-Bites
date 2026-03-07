// Service Worker for Brew & Bites - Advanced Caching
const CACHE_NAME = 'brew-bites-v1'
const ADMIN_CACHE_NAME = 'brew-bites-admin'
const STATIC_CACHE = 'brew-bites-static'

// Files to cache for customers (lightweight)
const CUSTOMER_CACHE_FILES = [
  '/',
  '/index.html',
  '/favicon.ico',
  '/manifest.json'
]

// Admin modules to cache for staff
const ADMIN_MODULES = [
  '/admin-dashboard',
  '/waiter-dashboard', 
  '/chef-dashboard',
  '/super-admin-dashboard'
]

// Install event - cache essential files
self.addEventListener('install', (event) => {
  console.log('🚀 Service Worker installing...')
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('📦 Caching static files')
        return cache.addAll(CUSTOMER_CACHE_FILES)
      })
      .then(() => self.skipWaiting())
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker activating')
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && 
              cacheName !== ADMIN_CACHE_NAME && 
              cacheName !== STATIC_CACHE) {
            console.log('🗑️ Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    }).then(() => self.clients.claim())
  )
})

// Fetch event - smart caching strategy
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  
  // Skip non-HTTP requests
  if (!url.protocol.startsWith('http')) {
    return
  }

  // Handle different caching strategies based on request type
  if (isAdminRequest(event.request)) {
    event.respondWith(handleAdminRequest(event.request))
  } else if (isStaticAsset(event.request)) {
    event.respondWith(handleStaticAsset(event.request))
  } else {
    event.respondWith(handleNetworkFirst(event.request))
  }
})

// Check if request is for admin functionality
function isAdminRequest(request) {
  const url = new URL(request.url)
  return ADMIN_MODULES.some(module => url.pathname.includes(module)) ||
         url.pathname.includes('/admin') ||
         url.pathname.includes('/waiter') ||
         url.pathname.includes('/chef') ||
         url.pathname.includes('/superadmin')
}

// Check if request is for static asset
function isStaticAsset(request) {
  const url = new URL(request.url)
  return url.pathname.includes('/assets/') ||
         url.pathname.includes('/images/') ||
         url.pathname.endsWith('.css') ||
         url.pathname.endsWith('.js') ||
         url.pathname.endsWith('.woff') ||
         url.pathname.endsWith('.woff2')
}

// Handle admin requests with cache-first strategy
async function handleAdminRequest(request) {
  try {
    const cache = await caches.open(ADMIN_CACHE_NAME)
    const cachedResponse = await cache.match(request)
    
    if (cachedResponse) {
      console.log('⚡ Serving admin module from cache:', request.url)
      return cachedResponse
    }
    
    // Not in cache, fetch from network
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      console.log('📦 Caching new admin module:', request.url)
      const responseClone = networkResponse.clone()
      await cache.put(request, responseClone)
    }
    
    return networkResponse
  } catch (error) {
    console.error('❌ Admin request failed:', error)
    return new Response('Offline - Admin features unavailable', { 
      status: 503, 
      statusText: 'Service Unavailable' 
    })
  }
}

// Handle static assets with cache-first strategy
async function handleStaticAsset(request) {
  try {
    const cache = await caches.open(STATIC_CACHE)
    const cachedResponse = await cache.match(request)
    
    if (cachedResponse) {
      return cachedResponse
    }
    
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      const responseClone = networkResponse.clone()
      await cache.put(request, responseClone)
    }
    
    return networkResponse
  } catch (error) {
    // Return cached version if network fails
    const cache = await caches.open(STATIC_CACHE)
    return cache.match(request) || new Response('Asset unavailable', { 
      status: 404, 
      statusText: 'Not Found' 
    })
  }
}

// Handle other requests with network-first strategy
async function handleNetworkFirst(request) {
  try {
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME)
      const responseClone = networkResponse.clone()
      await cache.put(request, responseClone)
    }
    
    return networkResponse
  } catch (error) {
    console.log('🌐 Network failed, trying cache:', request.url)
    const cache = await caches.open(CACHE_NAME)
    const cachedResponse = await cache.match(request)
    
    if (cachedResponse) {
      return cachedResponse
    }
    
    return new Response('Offline - Please check your connection', { 
      status: 503, 
      statusText: 'Service Unavailable' 
    })
  }
}

// Message event for cache management
self.addEventListener('message', (event) => {
  const { type, payload } = event.data
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting()
      break
      
    case 'CACHE_ADMIN_MODULES':
      cacheAdminModules(payload.userRole)
      break
      
    case 'CLEAR_CACHE':
      clearCache(payload.cacheName)
      break
      
    case 'GET_CACHE_STATS':
      getCacheStats().then(stats => {
        event.ports[0].postMessage({ type: 'CACHE_STATS', data: stats })
      })
      break
  }
})

// Cache admin modules for specific role
async function cacheAdminModules(userRole) {
  try {
    const cache = await caches.open(ADMIN_CACHE_NAME)
    const modules = getModulesForRole(userRole)
    
    console.log(`🎯 Pre-caching modules for ${userRole}:`, modules)
    
    // Cache the role information
    await cache.put(`/current-role`, new Response(JSON.stringify({
      role: userRole,
      timestamp: Date.now(),
      modules: modules
    })))
    
  } catch (error) {
    console.error('Failed to cache admin modules:', error)
  }
}

// Get modules for specific role
function getModulesForRole(role) {
  const moduleMap = {
    admin: ['AdminDashboard'],
    superadmin: ['SuperAdminDashboard'],
    waiter: ['WaiterDashboard'],
    chef: ['ChefDashboard']
  }
  return moduleMap[role] || []
}

// Clear specific cache
async function clearCache(cacheName) {
  try {
    if (cacheName === 'all') {
      await caches.delete(CACHE_NAME)
      await caches.delete(ADMIN_CACHE_NAME)
      await caches.delete(STATIC_CACHE)
    } else {
      await caches.delete(cacheName)
    }
    console.log(`🗑️ Cleared cache: ${cacheName}`)
  } catch (error) {
    console.error('Failed to clear cache:', error)
  }
}

// Get cache statistics
async function getCacheStats() {
  try {
    const stats = {
      totalCaches: 0,
      totalEntries: 0,
      caches: {}
    }
    
    const cacheNames = await caches.keys()
    stats.totalCaches = cacheNames.length
    
    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName)
      const keys = await cache.keys()
      stats.caches[cacheName] = keys.length
      stats.totalEntries += keys.length
    }
    
    return stats
  } catch (error) {
    console.error('Failed to get cache stats:', error)
    return { totalCaches: 0, totalEntries: 0, caches: {} }
  }
}
