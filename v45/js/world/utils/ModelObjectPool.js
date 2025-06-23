import { ObjectPool } from './ObjectPool.js';
import * as THREE from 'three';

/**
 * Generic model object pool for reusing 3D models
 * Helps improve performance by reusing model instances instead of creating new ones
 */
export class ModelObjectPool {
    constructor(scene) {
        this.scene = scene;
        
        // Create pools for each model type
        this.pools = {};
        
        // Track active models for performance monitoring
        this.activeModels = {};
    }
    
    /**
     * Initialize a pool for a specific model type
     * @param {string} modelType - The model type identifier
     * @param {Function} factory - Factory function to create new model instances
     * @param {Function} reset - Function to reset a model before reuse
     * @param {number} initialSize - Initial pool size (optional)
     */
    initializePool(modelType, factory, reset, initialSize = 0) {
        // Skip if pool already exists
        if (this.pools[modelType]) {
            return;
        }
        
        // Initialize tracking counter
        this.activeModels[modelType] = 0;
        
        // Create model pool for this type
        this.pools[modelType] = new ObjectPool(factory, reset, initialSize);
    }
    
    /**
     * Get a model from the pool
     * @param {string} modelType - The model type
     * @param {Object} config - Configuration for the model (optional)
     * @returns {Object} - The model from the pool
     */
    get(modelType, config = {}) {
        // If pool doesn't exist for this type, throw error
        if (!this.pools[modelType]) {
            throw new Error(`No pool initialized for model type: ${modelType}`);
        }
        
        // Get model from pool
        const model = this.pools[modelType].get();
        
        // Apply configuration if provided
        if (config.position) {
            model.position.copy(config.position);
        }
        
        if (config.rotation) {
            model.rotation.copy(config.rotation);
        }
        
        if (config.scale) {
            if (typeof config.scale === 'number') {
                model.scale.set(config.scale, config.scale, config.scale);
            } else {
                model.scale.copy(config.scale);
            }
        }
        
        // Make visible
        model.visible = true;
        
        // Track active models
        this.activeModels[modelType]++;
        
        return model;
    }
    
    /**
     * Return a model to the pool
     * @param {string} modelType - The model type
     * @param {Object} model - The model to return to the pool
     */
    release(modelType, model) {
        // If pool doesn't exist for this type, ignore
        if (!this.pools[modelType]) {
            console.warn(`No pool initialized for model type: ${modelType}`);
            return;
        }
        
        // Return to pool
        this.pools[modelType].release(model);
        
        // Update tracking
        this.activeModels[modelType]--;
    }
    
    /**
     * Get statistics about the pool usage
     * @returns {Object} - Pool statistics
     */
    getStats() {
        const stats = {
            active: { ...this.activeModels },
            poolSizes: {}
        };
        
        // Get pool sizes
        for (const poolKey in this.pools) {
            stats.poolSizes[poolKey] = this.pools[poolKey].size();
        }
        
        return stats;
    }
    
    /**
     * Clear all pools or a specific pool
     * @param {string} modelType - The model type (optional)
     */
    clear(modelType) {
        if (modelType && this.pools[modelType]) {
            // Get all objects from the pool
            const pool = this.pools[modelType];
            const objects = [];
            
            // Empty the pool
            while (pool.size() > 0) {
                objects.push(pool.get());
            }
            
            // Remove all objects from the scene
            for (const object of objects) {
                if (object.parent) {
                    this.scene.remove(object);
                }
            }
            
            // Clear the pool
            pool.clear();
            
            // Reset active model count
            this.activeModels[modelType] = 0;
        } else if (!modelType) {
            // Clear all pools
            for (const poolKey in this.pools) {
                this.clear(poolKey);
            }
        }
    }
}