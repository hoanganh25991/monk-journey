/**
 * Generic object pool for reusing objects instead of creating new ones
 * Optimized version with tracking of active objects
 */
export class ObjectPool {
    /**
     * Create a new object pool
     * @param {Function} factory - Factory function to create new objects
     * @param {Function} reset - Function to reset an object before reuse
     * @param {number} initialSize - Initial pool size (optional)
     */
    constructor(factory, reset, initialSize = 0) {
        this.factory = factory;
        this.reset = reset;
        this.pool = [];
        
        // Track active objects for better management
        this.activeObjects = new Set();
        
        // Optional callback for active objects
        this.forEachActive = null;
        
        // Pre-populate the pool if initialSize > 0
        for (let i = 0; i < initialSize; i++) {
            this.pool.push(this.factory());
        }
    }
    
    /**
     * Get an object from the pool or create a new one if empty
     * @returns {Object} - An object from the pool
     */
    get() {
        let object;
        
        if (this.pool.length > 0) {
            object = this.pool.pop();
        } else {
            object = this.factory();
        }
        
        // Track this object as active
        this.activeObjects.add(object);
        
        return object;
    }
    
    /**
     * Return an object to the pool for reuse
     * @param {Object} object - The object to return to the pool
     */
    release(object) {
        if (object) {
            // Apply any active object callback before resetting
            if (this.forEachActive && typeof this.forEachActive === 'function') {
                this.forEachActive(object);
            }
            
            // Reset the object
            this.reset(object);
            
            // Remove from active tracking
            this.activeObjects.delete(object);
            
            // Return to pool
            this.pool.push(object);
        }
    }
    
    /**
     * Get the current size of the pool (available objects)
     * @returns {number} - The number of available objects in the pool
     */
    size() {
        return this.pool.length;
    }
    
    /**
     * Get the number of active objects
     * @returns {number} - The number of active objects
     */
    activeCount() {
        return this.activeObjects.size;
    }
    
    /**
     * Apply a function to all active objects
     * @param {Function} callback - Function to apply to each active object
     */
    applyToActive(callback) {
        if (typeof callback !== 'function') return;
        
        this.activeObjects.forEach(object => {
            callback(object);
        });
    }
    
    /**
     * Clear the pool
     */
    clear() {
        this.pool = [];
        // Don't clear active objects - they're still in use
    }
}

/**
 * Structure pool for reusing structure objects
 * Enhanced version with better tracking and management
 */
export class StructurePool {
    constructor() {
        this.pools = {};
        this.totalActiveCount = 0;
    }
    
    /**
     * Initialize a pool for a specific structure type
     * @param {string} type - The structure type
     * @param {Function} factory - Factory function to create new objects
     * @param {Function} reset - Function to reset an object before reuse
     * @param {number} initialSize - Initial pool size (optional)
     */
    initPool(type, factory, reset, initialSize = 0) {
        if (!this.pools[type]) {
            this.pools[type] = new ObjectPool(factory, reset, initialSize);
        }
    }
    
    /**
     * Get a structure from the pool
     * @param {string} type - The structure type
     * @returns {Object} - A structure from the pool
     */
    get(type) {
        if (!this.pools[type]) {
            console.warn(`No pool initialized for structure type: ${type}`);
            return null;
        }
        
        const object = this.pools[type].get();
        this.totalActiveCount++;
        return object;
    }
    
    /**
     * Return a structure to the pool
     * @param {string} type - The structure type
     * @param {Object} structure - The structure to return to the pool
     */
    release(type, structure) {
        if (this.pools[type]) {
            this.pools[type].release(structure);
            this.totalActiveCount = Math.max(0, this.totalActiveCount - 1);
        }
    }
    
    /**
     * Get the current size of a specific pool
     * @param {string} type - The structure type
     * @returns {number} - The number of objects in the pool
     */
    size(type) {
        if (this.pools[type]) {
            return this.pools[type].size();
        }
        return 0;
    }
    
    /**
     * Get the number of active objects for a specific type
     * @param {string} type - The structure type
     * @returns {number} - The number of active objects
     */
    activeCount(type) {
        if (this.pools[type]) {
            return this.pools[type].activeCount();
        }
        return 0;
    }
    
    /**
     * Get the total number of active objects across all pools
     * @returns {number} - The total number of active objects
     */
    getTotalActiveCount() {
        return this.totalActiveCount;
    }
    
    /**
     * Apply a function to all active objects of a specific type
     * @param {string} type - The structure type
     * @param {Function} callback - Function to apply to each active object
     */
    applyToActive(type, callback) {
        if (this.pools[type] && typeof callback === 'function') {
            this.pools[type].applyToActive(callback);
        }
    }
    
    /**
     * Apply a function to all active objects across all pools
     * @param {Function} callback - Function to apply to each active object
     */
    applyToAllActive(callback) {
        if (typeof callback !== 'function') return;
        
        Object.keys(this.pools).forEach(type => {
            this.applyToActive(type, callback);
        });
    }
    
    /**
     * Set a callback to be applied to objects when they're released
     * @param {string} type - The structure type
     * @param {Function} callback - Function to apply to each object on release
     */
    setReleaseCallback(type, callback) {
        if (this.pools[type] && typeof callback === 'function') {
            this.pools[type].forEachActive = callback;
        }
    }
    
    /**
     * Clear all pools or a specific pool
     * @param {string} type - The structure type (optional)
     */
    clear(type) {
        if (type && this.pools[type]) {
            this.pools[type].clear();
        } else if (!type) {
            Object.keys(this.pools).forEach(key => {
                this.pools[key].clear();
            });
        }
    }
}