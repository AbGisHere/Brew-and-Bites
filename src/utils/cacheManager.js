// Smart Cache Manager for Brew & Bites
class CacheManager {
  constructor() {
    this.CACHE_NAME = 'brew-bites-v1'
    this.ADMIN_CACHE_NAME = 'brew-bites-admin'
    this.CACHE_DURATION = 7 * 24 * 60 * 60 * 1000 // 7 days
  }

  // Initialize caching for staff users
  async initializeStaffCache(userRole) {
    if (!this.isStaffRole(userRole)) return false

    try {
      const cache = await caches.open(this.ADMIN_CACHE_NAME)
      const existingCache = await cache.match(`/staff-${userRole}-cache`)
      
      if (!existingCache) {
        // First time staff login - pre-load related modules
        await this.preloadStaffModules(userRole)
        return true
      }
      
      // Check if cache is still valid
      const cacheData = await existingCache.json()
      if (Date.now() - cacheData.timestamp < this.CACHE_DURATION) {
        return false // Cache is still valid
      }
      
      // Cache expired, refresh it
      await this.preloadStaffModules(userRole)
      return true
    } catch (error) {
      console.warn('Cache initialization failed:', error)
      return false
    }
  }

  // Preload staff modules based on role
  async preloadStaffModules(userRole) {
    const modules = this.getModulesForRole(userRole)
    const cache = await caches.open(this.ADMIN_CACHE_NAME)
    
    const cacheData = {
      role: userRole,
      timestamp: Date.now(),
      modules: modules
    }
    
    await cache.put(`/staff-${userRole}-cache`, new Response(JSON.stringify(cacheData)))
    
    // Store in localStorage for faster access
    localStorage.setItem(`brew-bites-${userRole}-cached`, 'true')
    localStorage.setItem(`brew-bites-${userRole}-cache-time`, Date.now().toString())
  }

  // Get modules to preload based on role
  getModulesForRole(role) {
    const moduleMap = {
      admin: ['AdminDashboard', 'SuperAdminDashboard'],
      waiter: ['WaiterDashboard', 'TableManagement'],
      chef: ['ChefDashboard', 'OrderManagement']
    }
    return moduleMap[role] || []
  }

  // Check if user is staff
  isStaffRole(role) {
    return ['admin', 'superadmin', 'waiter', 'chef'].includes(role?.toLowerCase())
  }

  // Check if module is cached
  async isModuleCached(moduleName) {
    try {
      const cache = await caches.open(this.ADMIN_CACHE_NAME)
      const cached = await cache.match(`/module-${moduleName}`)
      return cached !== undefined
    } catch {
      return false
    }
  }

  // Get cache status
  getCacheStatus(userRole) {
    const cached = localStorage.getItem(`brew-bites-${userRole}-cached`)
    const cacheTime = localStorage.getItem(`brew-bites-${userRole}-cache-time`)
    
    if (!cached || !cacheTime) return { cached: false, age: 0 }
    
    const age = Date.now() - parseInt(cacheTime)
    return { 
      cached: true, 
      age: age,
      expired: age > this.CACHE_DURATION
    }
  }

  // Clear cache for specific role
  async clearRoleCache(userRole) {
    try {
      const cache = await caches.open(this.ADMIN_CACHE_NAME)
      await cache.delete(`/staff-${userRole}-cache`)
      localStorage.removeItem(`brew-bites-${userRole}-cached`)
      localStorage.removeItem(`brew-bites-${userRole}-cache-time`)
      return true
    } catch {
      return false
    }
  }

  // Clear all admin cache
  async clearAllAdminCache() {
    try {
      await caches.delete(this.ADMIN_CACHE_NAME)
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('brew-bites-') && key.includes('-cached')) {
          localStorage.removeItem(key)
        }
        if (key.startsWith('brew-bites-') && key.includes('-cache-time')) {
          localStorage.removeItem(key)
        }
      })
      return true
    } catch {
      return false
    }
  }

  // Get cache statistics
  async getCacheStats() {
    try {
      const cache = await caches.open(this.ADMIN_CACHE_NAME)
      const keys = await cache.keys()
      const stats = {
        totalEntries: keys.length,
        roles: {},
        lastUpdated: null
      }

      for (const request of keys) {
        const response = await cache.match(request)
        if (response) {
          const data = await response.json().catch(() => null)
          if (data?.role) {
            stats.roles[data.role] = (stats.roles[data.role] || 0) + 1
            if (!stats.lastUpdated || data.timestamp > stats.lastUpdated) {
              stats.lastUpdated = data.timestamp
            }
          }
        }
      }

      return stats
    } catch {
      return { totalEntries: 0, roles: {}, lastUpdated: null }
    }
  }
}

export default new CacheManager()
