import * as THREE from 'three';

/**
 * Memory Manager class that handles memory management and cleanup
 * Extracted from WorldManager for better maintainability
 */
export class MemoryManager {
    constructor(scene, terrainManager, environmentManager, structureManager) {
        this.scene = scene;
        this.terrainManager = terrainManager;
        this.environmentManager = environmentManager;
        this.structureManager = structureManager;
        
        // Object pooling
        this.objectPools = new Map(); // Map of object type to pool of reusable objects
        
        // Initialize object pools
        this.initializeObjectPools();
    }
    
    /**
     * Initialize object pools for reusing objects
     * This significantly reduces garbage collection and improves performance
     */
    initializeObjectPools() {
        // Create pools for common environment objects
        const commonTypes = [
            'tree', 'bush', 'rock', 'flower', 'grass',
            'mushroom', 'fern', 'fallen_log'
        ];
        
        commonTypes.forEach(type => {
            this.objectPools.set(type, []);
        });
        
        console.debug('✅ Object pools initialized');
    }
    
    /**
     * Get an object from the pool or create a new one
     * @param {string} objectType - Type of object to get
     * @param {Function} createCallback - Function to create a new object if none in pool
     * @returns {Object} - Object from pool or newly created
     */
    getObjectFromPool(objectType, createCallback) {
        const poolType = this.getPoolTypeForObject(objectType);
        const pool = this.objectPools.get(poolType);
        
        if (pool && pool.length > 0) {
            // Get object from pool
            return pool.pop();
        } else {
            // Create new object
            return createCallback();
        }
    }
    
    /**
     * Return an object to the pool for reuse
     * @param {Object} object - Object to return to pool
     * @param {string} objectType - Type of object
     */
    returnObjectToPool(object, objectType) {
        if (!object) return;
        
        const poolType = this.getPoolTypeForObject(objectType);
        const pool = this.objectPools.get(poolType);
        
        if (pool && pool.length < 50) { // Limit pool size
            // Reset object state
            if (object.position) {
                object.position.set(0, -1000, 0); // Move below terrain
            }
            
            // Add to pool
            pool.push(object);
        } else {
            // Dispose object if pool is full
            this.disposeObject(object);
        }
    }
    
    /**
     * Get pool type for object (simplifies object types for pooling)
     * @param {string} objectType - Original object type
     * @returns {string} - Simplified pool type
     */
    getPoolTypeForObject(objectType) {
        // Convert to lowercase for consistency
        const type = String(objectType).toLowerCase();
        
        // Map specific types to general categories
        if (type.includes('tree')) return 'tree';
        if (type.includes('bush')) return 'bush';
        if (type.includes('rock')) return 'rock';
        if (type.includes('flower')) return 'flower';
        if (type.includes('grass')) return 'grass';
        if (type.includes('mushroom')) return 'mushroom';
        if (type.includes('fern')) return 'fern';
        if (type.includes('log')) return 'fallen_log';
        
        // Default to original type
        return type;
    }
    
    /**
     * Dispose an object and its resources
     * @param {Object} object - Object to dispose
     */
    disposeObject(object) {
        if (!object) return;
        
        // Remove from scene if it's a child
        if (object.parent) {
            object.parent.remove(object);
        }
        
        // Dispose geometry and materials
        if (object.traverse) {
            object.traverse(child => {
                if (child.geometry) {
                    child.geometry.dispose();
                }
                
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(material => material.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
            });
        }
    }
    
    /**
     * ENHANCED: Clean up distant objects with improved performance
     * This version avoids causing lag spikes by processing objects in batches
     * @param {number} playerChunkX - Player's chunk X coordinate
     * @param {number} playerChunkZ - Player's chunk Z coordinate
     * @param {number} maxViewDistance - Maximum view distance in chunks
     * @returns {Promise<number>} - Promise that resolves with the number of objects removed
     */
    cleanupDistantObjects(playerChunkX, playerChunkZ, maxViewDistance) {
        return new Promise(resolve => {
            // Skip if managers aren't available
            if (!this.environmentManager || !this.structureManager) {
                resolve(0);
                return;
            }
            
            // Use a higher view distance to avoid objects popping in and out
            const effectiveViewDistance = maxViewDistance + 5;
            
            // Process in batches to avoid lag spikes
            this.processBatchedCleanup(playerChunkX, playerChunkZ, effectiveViewDistance, resolve);
        });
    }
    
    /**
     * Process cleanup in batches to avoid lag spikes
     * @param {number} playerChunkX - Player's chunk X coordinate
     * @param {number} playerChunkZ - Player's chunk Z coordinate
     * @param {number} viewDistance - View distance in chunks
     * @param {Function} resolveCallback - Callback to resolve the promise
     */
    processBatchedCleanup(playerChunkX, playerChunkZ, viewDistance, resolveCallback) {
        // Collect objects to remove
        const structuresToRemove = [];
        const environmentObjectsToRemove = [];
        
        // Check structures
        if (this.structureManager && this.structureManager.structures) {
            this.structureManager.structures.forEach((structureInfo, index) => {
                if (structureInfo.chunkKey) {
                    const [chunkX, chunkZ] = structureInfo.chunkKey.split(',').map(Number);
                    
                    // Calculate distance from player chunk
                    const distX = Math.abs(chunkX - playerChunkX);
                    const distZ = Math.abs(chunkZ - playerChunkZ);
                    
                    // If chunk is too far away, mark for removal
                    if (distX > viewDistance || distZ > viewDistance) {
                        structuresToRemove.push({ index, structureInfo });
                    }
                }
            });
        }
        
        // Check environment objects
        if (this.environmentManager && this.environmentManager.environmentObjects) {
            this.environmentManager.environmentObjects.forEach((objectInfo, index) => {
                if (objectInfo.chunkKey) {
                    const [chunkX, chunkZ] = objectInfo.chunkKey.split(',').map(Number);
                    
                    // Calculate distance from player chunk
                    const distX = Math.abs(chunkX - playerChunkX);
                    const distZ = Math.abs(chunkZ - playerChunkZ);
                    
                    // If chunk is too far away, mark for removal
                    if (distX > viewDistance || distZ > viewDistance) {
                        environmentObjectsToRemove.push({ index, objectInfo });
                    }
                }
            });
        }
        
        // Process removal in batches
        const totalToRemove = structuresToRemove.length + environmentObjectsToRemove.length;
        
        if (totalToRemove === 0) {
            // Nothing to remove, resolve immediately
            resolveCallback(0);
            return;
        }
        
        // Process in batches of 50 objects per frame
        const batchSize = 50;
        let processedCount = 0;
        
        const processBatch = () => {
            const startTime = performance.now();
            let batchCount = 0;
            
            // Process structures first
            while (structuresToRemove.length > 0 && batchCount < batchSize) {
                const { index, structureInfo } = structuresToRemove.pop();
                
                // Remove from scene
                if (structureInfo.object && structureInfo.object.parent) {
                    this.scene.remove(structureInfo.object);
                }
                
                // Return to pool or dispose
                this.returnObjectToPool(structureInfo.object, structureInfo.type);
                
                batchCount++;
                processedCount++;
            }
            
            // Then process environment objects
            while (environmentObjectsToRemove.length > 0 && batchCount < batchSize) {
                const { index, objectInfo } = environmentObjectsToRemove.pop();
                
                // Remove from scene
                if (objectInfo.object && objectInfo.object.parent) {
                    this.scene.remove(objectInfo.object);
                }
                
                // Return to pool or dispose
                this.returnObjectToPool(objectInfo.object, objectInfo.type);
                
                batchCount++;
                processedCount++;
            }
            
            // Update arrays after removal
            if (structuresToRemove.length === 0 && this.structureManager && this.structureManager.structures) {
                // Rebuild structures array without removed objects
                this.structureManager.structures = this.structureManager.structures.filter(
                    (_, i) => !structuresToRemove.some(item => item.index === i)
                );
            }
            
            if (environmentObjectsToRemove.length === 0 && this.environmentManager && this.environmentManager.environmentObjects) {
                // Rebuild environment objects array without removed objects
                this.environmentManager.environmentObjects = this.environmentManager.environmentObjects.filter(
                    (_, i) => !environmentObjectsToRemove.some(item => item.index === i)
                );
            }
            
            // Continue processing or resolve
            if (structuresToRemove.length > 0 || environmentObjectsToRemove.length > 0) {
                // Schedule next batch for next frame
                requestAnimationFrame(processBatch);
            } else {
                // All done, resolve with total count
                console.debug(`Cleaned up ${processedCount} distant objects in batches`);
                resolveCallback(processedCount);
            }
        };
        
        // Start processing batches
        requestAnimationFrame(processBatch);
    }
    
    /**
     * Clear WebGL resources and caches
     */
    clearWebGLResources() {
        if (THREE.Cache && THREE.Cache.clear) {
            THREE.Cache.clear();
        }
    }
}