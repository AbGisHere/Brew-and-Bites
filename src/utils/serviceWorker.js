// Service Worker Registration for Brew & Bites
const SW_URL = '/sw.js' // Service worker is in public folder

// Check if service worker is supported
const isServiceWorkerSupported = () => {
  return 'serviceWorker' in navigator
}

// Register service worker
export const registerServiceWorker = async (userRole = null) => {
  if (!isServiceWorkerSupported()) {
    console.warn('⚠️ Service Worker not supported')
    return false
  }

  try {
    const registration = await navigator.serviceWorker.register(SW_URL, {
      scope: '/'
    })

    console.log('✅ Service Worker registered:', registration.scope)

    // Handle updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing
      console.log('🔄 New Service Worker found')

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // New version available
          if (window.confirm('🚀 New version available! Reload to update?')) {
            window.location.reload()
          }
        }
      })
    })

    // Cache admin modules if user is staff
    if (userRole && ['admin', 'superadmin', 'waiter', 'chef'].includes(userRole.toLowerCase())) {
      console.log(`🎯 Pre-caching modules for ${userRole}`)
      sendMessage({
        type: 'CACHE_ADMIN_MODULES',
        payload: { userRole }
      })
    }

    return true
  } catch (error) {
    console.error('❌ Service Worker registration failed:', error)
    return false
  }
}

// Unregister service worker
export const unregisterServiceWorker = async () => {
  if (!isServiceWorkerSupported()) return false

  try {
    const registration = await navigator.serviceWorker.ready
    await registration.unregister()
    console.log('🗑️ Service Worker unregistered')
    return true
  } catch (error) {
    console.error('❌ Service Worker unregistration failed:', error)
    return false
  }
}

// Send message to service worker
export const sendMessage = (message) => {
  return new Promise((resolve, reject) => {
    if (!isServiceWorkerSupported()) {
      reject(new Error('Service Worker not supported'))
      return
    }

    const messageChannel = new MessageChannel()
    
    messageChannel.port1.onmessage = (event) => {
      resolve(event.data)
    }

    navigator.serviceWorker.controller.postMessage(message, [messageChannel.port2])
    
    // Timeout after 5 seconds
    setTimeout(() => {
      reject(new Error('Message timeout'))
    }, 5000)
  })
}

// Get cache statistics
export const getCacheStats = async () => {
  try {
    const response = await sendMessage({ type: 'GET_CACHE_STATS' })
    return response.data
  } catch (error) {
    console.error('Failed to get cache stats:', error)
    return { totalCaches: 0, totalEntries: 0, caches: {} }
  }
}

// Clear cache
export const clearCache = async (cacheName = 'all') => {
  try {
    await sendMessage({ type: 'CLEAR_CACHE', payload: { cacheName } })
    console.log(`🗑️ Cache cleared: ${cacheName}`)
    return true
  } catch (error) {
    console.error('Failed to clear cache:', error)
    return false
  }
}

// Check if service worker is ready
export const isServiceWorkerReady = () => {
  return isServiceWorkerSupported() && navigator.serviceWorker.controller !== null
}

// Wait for service worker to be ready
export const waitForServiceWorker = (timeout = 5000) => {
  return new Promise((resolve, reject) => {
    if (!isServiceWorkerSupported()) {
      reject(new Error('Service Worker not supported'))
      return
    }

    if (isServiceWorkerReady()) {
      resolve(navigator.serviceWorker.controller)
      return
    }

    const timer = setTimeout(() => {
      reject(new Error('Service Worker ready timeout'))
    }, timeout)

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      clearTimeout(timer)
      resolve(navigator.serviceWorker.controller)
    }, { once: true })
  })
}

export default {
  registerServiceWorker,
  unregisterServiceWorker,
  sendMessage,
  getCacheStats,
  clearCache,
  isServiceWorkerReady,
  waitForServiceWorker
}
