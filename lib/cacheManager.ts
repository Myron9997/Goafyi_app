// Simple cache manager for client-side caching
export class CacheManager {
  private static cachePrefix = 'goa-fyi-cache-';
  
  static set(key: string, data: any, ttlMs: number = 60000) {
    if (typeof window === 'undefined') return;
    
    try {
      const cacheData = {
        data,
        timestamp: Date.now(),
        ttl: ttlMs
      };
      localStorage.setItem(this.cachePrefix + key, JSON.stringify(cacheData));
    } catch (e) {
      // Ignore localStorage errors
    }
  }
  
  static get(key: string): any | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const cached = localStorage.getItem(this.cachePrefix + key);
      if (!cached) return null;
      
      const parsed = JSON.parse(cached);
      const now = Date.now();
      
      if (now - parsed.timestamp > parsed.ttl) {
        // Cache expired
        this.remove(key);
        return null;
      }
      
      return parsed.data;
    } catch (e) {
      // Ignore localStorage errors
      return null;
    }
  }
  
  static remove(key: string) {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.removeItem(this.cachePrefix + key);
    } catch (e) {
      // Ignore localStorage errors
    }
  }
  
  static invalidate(pattern?: string) {
    if (typeof window === 'undefined') return;
    
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.cachePrefix)) {
          if (!pattern || key.includes(pattern)) {
            localStorage.removeItem(key);
          }
        }
      });
    } catch (e) {
      // Ignore localStorage errors
    }
  }
  
  // Specific cache keys
  static readonly KEYS = {
    DASHBOARD: 'dashboard',
    PACKAGES: 'packages',
    AVAILABILITY: 'availability'
  } as const;
}
