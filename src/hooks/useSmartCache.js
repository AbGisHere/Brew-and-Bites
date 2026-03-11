import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import cacheManager from '../utils/cacheManager'

// Custom hook for smart caching and lazy loading
export const useSmartCache = () => {
  const { user } = useAuth()
  const [cacheStatus, setCacheStatus] = useState({
    loading: false,
    cached: false,
    firstLoad: false,
    expired: false
  })

  // Initialize cache for staff users
  const initializeCache = useCallback(async () => {
    if (!user || !cacheManager.isStaffRole(user.role)) {
      return
    }

    setCacheStatus(prev => ({ ...prev, loading: true }))

    try {
      const status = cacheManager.getCacheStatus(user.role)
      const wasFirstLoad = await cacheManager.initializeStaffCache(user.role)
      
      setCacheStatus({
        loading: false,
        cached: status.cached || wasFirstLoad,
        firstLoad: wasFirstLoad,
        expired: status.expired
      })

      // Log cache status for debugging
      if (wasFirstLoad) {
        console.log(`🚀 First-time load for ${user.role} - caching modules...`)
      } else if (status.expired) {
        console.log(`🔄 Cache expired for ${user.role} - refreshing...`)
      } else if (status.cached) {
        console.log(`⚡ Using cached modules for ${user.role}`)
      }
    } catch (error) {
      console.error('Cache initialization failed:', error)
      setCacheStatus(prev => ({ ...prev, loading: false }))
    }
  }, [user])

  // Preload modules when user logs in
  useEffect(() => {
    if (user && cacheManager.isStaffRole(user.role)) {
      initializeCache()
    }
  }, [user, initializeCache])

  // Clear cache for current user
  const clearCache = useCallback(async () => {
    if (!user) return false
    
    const success = await cacheManager.clearRoleCache(user.role)
    if (success) {
      setCacheStatus({
        loading: false,
        cached: false,
        firstLoad: false,
        expired: false
      })
      console.log(`🗑️ Cache cleared for ${user.role}`)
    }
    return success
  }, [user])

  // Get cache statistics
  const getCacheStats = useCallback(async () => {
    return await cacheManager.getCacheStats()
  }, [])

  return {
    cacheStatus,
    clearCache,
    getCacheStats,
    isStaff: user ? cacheManager.isStaffRole(user.role) : false
  }
}

// Custom lazy loading hook with caching
export const useLazyLoad = (importFunction, moduleName) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const loadModule = useCallback(async () => {
    if (loading) return null

    setLoading(true)
    setError(null)

    try {
      // Check if module is already cached
      const isCached = await cacheManager.isModuleCached(moduleName)
      
      const module = await importFunction()
      
      if (!isCached) {
        console.log(`📦 Loading new module: ${moduleName}`)
      } else {
        console.log(`⚡ Loading cached module: ${moduleName}`)
      }
      
      setLoading(false)
      return module
    } catch (err) {
      console.error(`Failed to load module ${moduleName}:`, err)
      setError(err)
      setLoading(false)
      return null
    }
  }, [importFunction, moduleName, loading])

  return { loadModule, loading, error }
}

export default useSmartCache
