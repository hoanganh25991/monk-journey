import * as THREE from 'three';
import { sharedResources } from './SharedResourceManager.js';

/**
 * Memory Manager class that handles memory management and cleanup
 * Enhanced with advanced object pooling, timed disposal, and shared resources
 */
export class MemoryManager {
    constructor(scene, terrainManager, environmentManager, structureManager) {
        this.scene = scene;
        this.terrainManager = terrainManager;
        this.environmentManager = environmentManager;
        this.structureManager = structureManager;
        
        // Object pooling - enhanced with type-specific pools and metadata
        this.objectPools = new Map(); // Map of object type to pool of reusable objects
        this.poolStats = {
            created: 0,
            reused: 0,
            disposed: 0,
            currentPoolSize: 0
        };
        
        // Timed disposal tracking
        this.disposalQueue = new Map(); // Map of object IDs to disposal timers
        this.disposalTimers = new Map(); // Map of object IDs to timeout handles
        this.disposalDelay = 5000; // 5 seconds delay before actual disposal
        
        // Chunk tracking for distance-based cleanup
        this.activeChunks = new Set(); // Set of active chunk keys
        this.chunkLastUsed = new Map(); // Map of chunk keys to last used timestamp
        this.chunkObjects = new Map(); // Map of chunk keys to arrays of objects
        
        // Initialize object pools
        this.initializeObjectPools();
        
        // Initialize shared resources
        sharedResources.init();
    }
    
    /**
     * Initialize object pools for reusing objects
     * Enhanced with more object types and better categorization
     */
    initializeObjectPools() {
        // Create pools for common environment objects with specific pool sizes
        const poolConfigs = [
            { type: 'tree', maxSize: 100, preCreate: 20 },
            { type: 'pine_tree', maxSize: 50, preCreate: 10 },
            { type: 'oak_tree', maxSize: 50, preCreate: 10 },
            { type: 'bush', maxSize: 80, preCreate: 15 },
            { type: 'rock', maxSize: 80, preCreate: 15 },
            { type: 'boulder', maxSize: 30, preCreate: 5 },
            { type: 'flower', maxSize: 60, preCreate: 10 },
            { type: 'grass', maxSize: 120, preCreate: 20 },
            { type: 'mushroom', maxSize: 40, preCreate: 5 },
            { type: 'fern', maxSize: 40, preCreate: 5 },
            { type: 'fallen_log', maxSize: 30, preCreate: 5 },
            { type: 'cactus', maxSize: 30, preCreate: 5 },
            { type: 'desert_plant', maxSize: 30, preCreate: 5 },
            { type: 'swamp_plant', maxSize: 30, preCreate: 5 }
        ];
        
        // Initialize pools with configuration
        poolConfigs.forEach(config => {
            this.objectPools.set(config.type, {
                objects: [],
                maxSize: config.maxSize,
                stats: {
                    created: 0,
                    reused: 0,
                    disposed: 0
                }
            });
        });
        
        console.debug('✅ Enhanced object pools initialized');
    }
    
    /**
     * Pre-create objects for pools to avoid creation spikes
     * @param {Function} createCallback - Function to create objects for each type
     */
    preCreatePoolObjects(createCallback) {
        if (!createCallback) return;
        
        // Pre-create objects for each pool based on configuration
        for (const [type, pool] of this.objectPools.entries()) {
            const preCreateCount = Math.min(20, pool.maxSize / 4); // Pre-create up to 25% of max size
            
            // Skip if pool already has enough objects
            if (pool.objects.length >= preCreateCount) continue;
            
            const toCreate = preCreateCount - pool.objects.length;
            console.debug(`Pre-creating ${toCreate} objects for ${type} pool`);
            
            // Create objects in batches to avoid frame drops
            const createBatch = (remaining, batchSize = 5) => {
                const count = Math.min(remaining, batchSize);
                
                for (let i = 0; i < count; i++) {
                    try {
                        const object = createCallback(type);
                        if (object) {
                            // Initialize object but keep it hidden
                            if (object.visible !== undefined) {
                                object.visible = false;
                            }
                            
                            // Move below terrain
                            if (object.position) {
                                object.position.set(0, -1000, 0);
                            }
                            
                            // Add to pool
                            pool.objects.push(object);
                            pool.stats.created++;
                            this.poolStats.created++;
                            this.poolStats.currentPoolSize++;
                        }
                    } catch (error) {
                        console.warn(`Error pre-creating object for ${type} pool:`, error);
                    }
                }
                
                // Continue with next batch if needed
                const nextRemaining = remaining - count;
                if (nextRemaining > 0) {
                    setTimeout(() => createBatch(nextRemaining, batchSize), 0);
                }
            };
            
            // Start creating objects
            createBatch(toCreate);
        }
    }
    
    /**
     * Get an object from the pool or create a new one
     * Enhanced with pool statistics and object preparation
     * @param {string} objectType - Type of object to get
     * @param {Function} createCallback - Function to create a new object if none in pool
     * @returns {Object} - Object from pool or newly created
     */
    getObjectFromPool(objectType, createCallback) {
        const poolType = this.getPoolTypeForObject(objectType);
        const pool = this.objectPools.get(poolType);
        
        if (!pool) {
            // Create a new pool for this type if it doesn't exist
            this.objectPools.set(poolType, {
                objects: [],
                maxSize: 50, // Default max size
                stats: {
                    created: 0,
                    reused: 0,
                    disposed: 0
                }
            });
            
            // Create and return a new object
            const newObject = createCallback();
            if (newObject) {
                this.poolStats.created++;
            }
            return newObject;
        }
        
        if (pool.objects.length > 0) {
            // Get object from pool
            const object = pool.objects.pop();
            
            // Update stats
            pool.stats.reused++;
            this.poolStats.reused++;
            this.poolStats.currentPoolSize--;
            
            // Prepare object for reuse
            this.prepareObjectForReuse(object, objectType);
            
            return object;
        } else {
            // Create new object
            const newObject = createCallback();
            
            // Update stats if object was created successfully
            if (newObject) {
                pool.stats.created++;
                this.poolStats.created++;
            }
            
            return newObject;
        }
    }
    
    /**
     * Prepare an object from the pool for reuse
     * @param {Object} object - Object to prepare
     * @param {string} objectType - Type of object
     * @private
     */
    prepareObjectForReuse(object, objectType) {
        if (!object) return;
        
        // Reset visibility
        if (object.visible !== undefined) {
            object.visible = true;
        }
        
        // Reset rotation
        if (object.rotation) {
            object.rotation.set(0, 0, 0);
        }
        
        // Reset scale if it was modified
        if (object.scale) {
            object.scale.set(1, 1, 1);
        }
        
        // Reset any animation state
        if (object.userData) {
            object.userData.animationState = undefined;
            object.userData.lastUpdate = undefined;
        }
        
        // Cancel any pending disposal
        this.cancelDisposal(object);
    }
    
    /**
     * Return an object to the pool for reuse
     * Enhanced with better pool management and delayed disposal
     * @param {Object} object - Object to return to pool
     * @param {string} objectType - Type of object
     * @param {boolean} immediate - Whether to dispose immediately instead of returning to pool
     */
    returnObjectToPool(object, objectType, immediate = false) {
        if (!object) return;
        
        // Generate a unique ID for this object if it doesn't have one
        if (!object.userData) object.userData = {};
        if (!object.userData.poolId) {
            object.userData.poolId = `obj_${Math.random().toString(36).substr(2, 9)}`;
        }
        
        const poolType = this.getPoolTypeForObject(objectType);
        const pool = this.objectPools.get(poolType);
        
        // If immediate disposal is requested or pool doesn't exist, dispose immediately
        if (immediate || !pool) {
            this.disposeObject(object);
            if (pool) {
                pool.stats.disposed++;
            }
            this.poolStats.disposed++;
            return;
        }
        
        // If pool is full, queue for delayed disposal
        if (pool.objects.length >= pool.maxSize) {
            this.queueForDisposal(object, objectType);
            return;
        }
        
        // Reset object state
        if (object.position) {
            object.position.set(0, -1000, 0); // Move below terrain
        }
        
        // Hide the object
        if (object.visible !== undefined) {
            object.visible = false;
        }
        
        // Remove from scene if it's still there
        if (object.parent) {
            object.parent.remove(object);
        }
        
        // Add to pool
        pool.objects.push(object);
        this.poolStats.currentPoolSize++;
    }
    
    /**
     * Queue an object for delayed disposal
     * This helps prevent immediate disposal of objects that might be needed again soon
     * @param {Object} object - Object to queue for disposal
     * @param {string} objectType - Type of object
     * @private
     */
    queueForDisposal(object, objectType) {
        if (!object || !object.userData || !object.userData.poolId) return;
        
        const objectId = object.userData.poolId;
        
        // Cancel any existing disposal timer
        this.cancelDisposal(object);
        
        // Hide the object immediately
        if (object.visible !== undefined) {
            object.visible = false;
        }
        
        // Move below terrain
        if (object.position) {
            object.position.set(0, -1000, 0);
        }
        
        // Remove from scene if it's still there
        if (object.parent) {
            object.parent.remove(object);
        }
        
        // Queue for disposal after delay
        this.disposalQueue.set(objectId, {
            object,
            objectType,
            queueTime: Date.now()
        });
        
        // Set timer for actual disposal
        const timer = setTimeout(() => {
            this.processDisposal(objectId);
        }, this.disposalDelay);
        
        this.disposalTimers.set(objectId, timer);
    }
    
    /**
     * Cancel a pending disposal
     * @param {Object} object - Object to cancel disposal for
     * @private
     */
    cancelDisposal(object) {
        if (!object || !object.userData || !object.userData.poolId) return;
        
        const objectId = object.userData.poolId;
        
        // Clear timeout if exists
        if (this.disposalTimers.has(objectId)) {
            clearTimeout(this.disposalTimers.get(objectId));
            this.disposalTimers.delete(objectId);
        }
        
        // Remove from disposal queue
        this.disposalQueue.delete(objectId);
    }
    
    /**
     * Process actual disposal of an object
     * @param {string} objectId - ID of object to dispose
     * @private
     */
    processDisposal(objectId) {
        const disposalInfo = this.disposalQueue.get(objectId);
        if (!disposalInfo) return;
        
        const { object, objectType } = disposalInfo;
        
        // Remove from queue and timers
        this.disposalQueue.delete(objectId);
        this.disposalTimers.delete(objectId);
        
        // Dispose the object
        this.disposeObject(object);
        
        // Update stats
        const pool = this.objectPools.get(this.getPoolTypeForObject(objectType));
        if (pool) {
            pool.stats.disposed++;
        }
        this.poolStats.disposed++;
    }
    
    /**
     * Get pool type for object (simplifies object types for pooling)
     * Enhanced with more specific categorization
     * @param {string} objectType - Original object type
     * @returns {string} - Simplified pool type
     */
    getPoolTypeForObject(objectType) {
        if (!objectType) return 'generic';
        
        // Convert to lowercase for consistency
        const type = String(objectType).toLowerCase();
        
        // More specific categorization
        if (type.includes('pine')) return 'pine_tree';
        if (type.includes('oak')) return 'oak_tree';
        if (type.includes('tree')) return 'tree';
        if (type.includes('bush')) return 'bush';
        if (type.includes('boulder')) return 'boulder';
        if (type.includes('rock')) return 'rock';
        if (type.includes('flower')) return 'flower';
        if (type.includes('grass')) return 'grass';
        if (type.includes('mushroom')) return 'mushroom';
        if (type.includes('fern')) return 'fern';
        if (type.includes('log')) return 'fallen_log';
        if (type.includes('cactus')) return 'cactus';
        if (type.includes('desert')) return 'desert_plant';
        if (type.includes('swamp')) return 'swamp_plant';
        
        // Default to original type
        return type;
    }
    
    /**
     * Dispose an object and its resources
     * Enhanced with shared resource handling
     * @param {Object} object - Object to dispose
     */
    disposeObject(object) {
        if (!object) return;
        
        // Remove from scene if it's a child
        if (object.parent) {
            object.parent.remove(object);
        }
        
        // Check if object uses shared resources
        const usesSharedResources = object.userData && object.userData.usesSharedResources;
        
        // Dispose geometry and materials
        if (object.traverse) {
            object.traverse(child => {
                // Handle geometry disposal
                if (child.geometry) {
                    // If using shared geometry, release reference instead of disposing
                    if (usesSharedResources && child.userData && child.userData.sharedGeometryKey) {
                        sharedResources.releaseGeometry(child.userData.sharedGeometryKey);
                    } else {
                        child.geometry.dispose();
                    }
                }
                
                // Handle material disposal
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(material => {
                            // If using shared material, release reference instead of disposing
                            if (usesSharedResources && child.userData && child.userData.sharedMaterialKey) {
                                sharedResources.releaseMaterial(child.userData.sharedMaterialKey);
                            } else {
                                if (material.map) material.map.dispose();
                                material.dispose();
                            }
                        });
                    } else {
                        // If using shared material, release reference instead of disposing
                        if (usesSharedResources && child.userData && child.userData.sharedMaterialKey) {
                            sharedResources.releaseMaterial(child.userData.sharedMaterialKey);
                        } else {
                            if (child.material.map) child.material.map.dispose();
                            child.material.dispose();
                        }
                    }
                }
            });
        }
    }
    
    /**
     * Track a chunk and its objects for better memory management
     * @param {string} chunkKey - Chunk key (e.g., "x,z")
     * @param {Object} object - Object to track
     * @param {string} objectType - Type of object
     */
    trackChunkObject(chunkKey, object, objectType) {
        if (!chunkKey || !object) return;
        
        // Update last used time for this chunk
        this.chunkLastUsed.set(chunkKey, Date.now());
        
        // Add to active chunks set
        this.activeChunks.add(chunkKey);
        
        // Add object to chunk tracking
        if (!this.chunkObjects.has(chunkKey)) {
            this.chunkObjects.set(chunkKey, []);
        }
        
        // Add object info to chunk objects
        this.chunkObjects.get(chunkKey).push({
            object,
            objectType
        });
    }
    
    /**
     * Untrack a chunk and its objects
     * @param {string} chunkKey - Chunk key to untrack
     * @param {boolean} disposeObjects - Whether to dispose objects in the chunk
     * @returns {number} - Number of objects removed
     */
    untrackChunk(chunkKey, disposeObjects = true) {
        if (!chunkKey || !this.chunkObjects.has(chunkKey)) return 0;
        
        const objects = this.chunkObjects.get(chunkKey);
        let removedCount = 0;
        
        if (disposeObjects && objects && objects.length > 0) {
            // Process objects in batches to avoid frame drops
            const processBatch = (startIdx, batchSize) => {
                const endIdx = Math.min(startIdx + batchSize, objects.length);
                
                for (let i = startIdx; i < endIdx; i++) {
                    const { object, objectType } = objects[i];
                    
                    // Return to pool or dispose
                    this.returnObjectToPool(object, objectType);
                    removedCount++;
                }
                
                // If there are more objects to process, schedule the next batch
                if (endIdx < objects.length) {
                    setTimeout(() => {
                        processBatch(endIdx, batchSize);
                    }, 0);
                }
            };
            
            // Start processing the first batch (20 objects at a time)
            processBatch(0, 20);
        }
        
        // Remove from tracking
        this.activeChunks.delete(chunkKey);
        this.chunkLastUsed.delete(chunkKey);
        this.chunkObjects.delete(chunkKey);
        
        return removedCount;
    }
    
    /**
     * Clean up chunks that haven't been used for a while
     * @param {number} maxAgeMs - Maximum age in milliseconds before cleaning up
     * @returns {number} - Number of chunks cleaned up
     */
    cleanupStaleChunks(maxAgeMs = 30000) { // Default to 30 seconds
        const now = Date.now();
        const chunksToRemove = [];
        
        // Find chunks that haven't been used for a while
        for (const [chunkKey, lastUsed] of this.chunkLastUsed.entries()) {
            if (now - lastUsed > maxAgeMs) {
                chunksToRemove.push(chunkKey);
            }
        }
        
        // Process removal in batches
        let removedCount = 0;
        
        if (chunksToRemove.length > 0) {
            console.debug(`Cleaning up ${chunksToRemove.length} stale chunks`);
            
            // Process in batches to avoid frame drops
            const processBatch = (startIdx, batchSize) => {
                const endIdx = Math.min(startIdx + batchSize, chunksToRemove.length);
                
                for (let i = startIdx; i < endIdx; i++) {
                    const chunkKey = chunksToRemove[i];
                    removedCount += this.untrackChunk(chunkKey, true);
                }
                
                // If there are more chunks to process, schedule the next batch
                if (endIdx < chunksToRemove.length) {
                    setTimeout(() => {
                        processBatch(endIdx, batchSize);
                    }, 0);
                }
            };
            
            // Start processing the first batch (5 chunks at a time)
            processBatch(0, 5);
        }
        
        return removedCount;
    }
    
    /**
     * ENHANCED: Clean up distant objects with improved performance
     * This version avoids causing lag spikes by processing objects in batches
     * Enhanced with chunk-based tracking and timed disposal
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
     * Enhanced with chunk-based tracking and object pooling
     * @param {number} playerChunkX - Player's chunk X coordinate
     * @param {number} playerChunkZ - Player's chunk Z coordinate
     * @param {number} viewDistance - View distance in chunks
     * @param {Function} resolveCallback - Callback to resolve the promise
     */
    processBatchedCleanup(playerChunkX, playerChunkZ, viewDistance, resolveCallback) {
        // Collect chunks to remove
        const chunksToRemove = [];
        
        // Check active chunks
        for (const chunkKey of this.activeChunks) {
            const [chunkX, chunkZ] = chunkKey.split(',').map(Number);
            
            // Calculate distance from player chunk
            const distX = Math.abs(chunkX - playerChunkX);
            const distZ = Math.abs(chunkZ - playerChunkZ);
            
            // If chunk is too far away, mark for removal
            if (distX > viewDistance || distZ > viewDistance) {
                chunksToRemove.push(chunkKey);
            }
        }
        
        // Also check structures and environment objects that might not be tracked
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
        const totalToRemove = chunksToRemove.length + structuresToRemove.length + environmentObjectsToRemove.length;
        
        if (totalToRemove === 0) {
            // Nothing to remove, resolve immediately
            resolveCallback(0);
            return;
        }
        
        // Process in batches to avoid frame drops
        const batchSize = 20; // Reduced batch size for smoother performance
        let processedCount = 0;
        
        const processBatch = () => {
            const startTime = performance.now();
            let batchCount = 0;
            
            // Process chunks first (most efficient)
            while (chunksToRemove.length > 0 && batchCount < batchSize) {
                const chunkKey = chunksToRemove.pop();
                
                // Untrack and dispose chunk objects
                const removedInChunk = this.untrackChunk(chunkKey, true);
                processedCount += removedInChunk;
                batchCount += Math.min(removedInChunk, 1); // Count as at least 1 for batch limit
            }
            
            // Process structures next
            while (structuresToRemove.length > 0 && batchCount < batchSize) {
                const { index, structureInfo } = structuresToRemove.pop();
                
                // Remove from scene
                if (structureInfo.object && structureInfo.object.parent) {
                    this.scene.remove(structureInfo.object);
                }
                
                // Return to pool or dispose with delayed disposal
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
                
                // Return to pool or dispose with delayed disposal
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
            if (chunksToRemove.length > 0 || structuresToRemove.length > 0 || environmentObjectsToRemove.length > 0) {
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
     * PERFORMANCE FIX: Force aggressive cleanup for urgent scenarios (teleportation, severe FPS drops)
     * Enhanced with immediate disposal and shared resource handling
     * @param {number} playerChunkX - Player's chunk X coordinate
     * @param {number} playerChunkZ - Player's chunk Z coordinate
     * @param {number} aggressiveViewDistance - Aggressive view distance (smaller = more aggressive)
     * @returns {number} - Number of objects removed
     */
    forceAggressiveCleanup(playerChunkX, playerChunkZ, aggressiveViewDistance = 3) {
        console.debug(`🧹 Starting aggressive cleanup with view distance ${aggressiveViewDistance}`);
        
        // Skip if managers aren't available
        if (!this.environmentManager || !this.structureManager) {
            return 0;
        }
        
        let removedCount = 0;
        
        // Find chunks to remove aggressively
        const chunksToRemove = [];
        
        // Check active chunks
        for (const chunkKey of this.activeChunks) {
            const [chunkX, chunkZ] = chunkKey.split(',').map(Number);
            
            // Calculate distance from player chunk
            const distX = Math.abs(chunkX - playerChunkX);
            const distZ = Math.abs(chunkZ - playerChunkZ);
            
            // If chunk is too far away, mark for removal
            if (distX > aggressiveViewDistance || distZ > aggressiveViewDistance) {
                chunksToRemove.push(chunkKey);
            }
        }
        
        // Process chunks immediately
        for (const chunkKey of chunksToRemove) {
            removedCount += this.untrackChunk(chunkKey, true);
        }
        
        // Immediate cleanup without batching - process all at once for urgent scenarios
        const structuresToRemove = [];
        const environmentObjectsToRemove = [];
        
        // Check structures with more aggressive distance thresholds
        if (this.structureManager && this.structureManager.structures) {
            this.structureManager.structures.forEach((structureInfo, index) => {
                if (structureInfo.chunkKey) {
                    const [chunkX, chunkZ] = structureInfo.chunkKey.split(',').map(Number);
                    
                    // Calculate distance from player chunk
                    const distX = Math.abs(chunkX - playerChunkX);
                    const distZ = Math.abs(chunkZ - playerChunkZ);
                    
                    // More aggressive cleanup - smaller view distance
                    if (distX > aggressiveViewDistance || distZ > aggressiveViewDistance) {
                        structuresToRemove.push({ index, structureInfo });
                    }
                }
            });
        }
        
        // Check environment objects with more aggressive distance thresholds
        if (this.environmentManager && this.environmentManager.environmentObjects) {
            this.environmentManager.environmentObjects.forEach((objectInfo, index) => {
                if (objectInfo.chunkKey) {
                    const [chunkX, chunkZ] = objectInfo.chunkKey.split(',').map(Number);
                    
                    // Calculate distance from player chunk
                    const distX = Math.abs(chunkX - playerChunkX);
                    const distZ = Math.abs(chunkZ - playerChunkZ);
                    
                    // More aggressive cleanup - smaller view distance
                    if (distX > aggressiveViewDistance || distZ > aggressiveViewDistance) {
                        environmentObjectsToRemove.push({ index, objectInfo });
                    }
                }
            });
        }
        
        // Immediate processing without frame delays for urgent scenarios
        // Remove structures
        structuresToRemove.forEach(({ index, structureInfo }) => {
            // Remove from scene
            if (structureInfo.object && structureInfo.object.parent) {
                this.scene.remove(structureInfo.object);
            }
            
            // Force immediate disposal instead of returning to pool
            this.returnObjectToPool(structureInfo.object, structureInfo.type, true);
            removedCount++;
        });
        
        // Remove environment objects
        environmentObjectsToRemove.forEach(({ index, objectInfo }) => {
            // Remove from scene
            if (objectInfo.object && objectInfo.object.parent) {
                this.scene.remove(objectInfo.object);
            }
            
            // Force immediate disposal instead of returning to pool
            this.returnObjectToPool(objectInfo.object, objectInfo.type, true);
            removedCount++;
        });
        
        // Update arrays after removal (immediate processing)
        if (structuresToRemove.length > 0 && this.structureManager && this.structureManager.structures) {
            const indicesToRemove = new Set(structuresToRemove.map(item => item.index));
            this.structureManager.structures = this.structureManager.structures.filter(
                (_, i) => !indicesToRemove.has(i)
            );
        }
        
        if (environmentObjectsToRemove.length > 0 && this.environmentManager && this.environmentManager.environmentObjects) {
            const indicesToRemove = new Set(environmentObjectsToRemove.map(item => item.index));
            this.environmentManager.environmentObjects = this.environmentManager.environmentObjects.filter(
                (_, i) => !indicesToRemove.has(i)
            );
        }
        
        // Process any pending disposals immediately
        this.processAllPendingDisposals();
        
        console.debug(`🧹 Aggressive cleanup removed ${removedCount} objects immediately`);
        return removedCount;
    }
    
    /**
     * Process all pending disposals immediately
     * Used in emergency cleanup situations
     */
    processAllPendingDisposals() {
        // Process all items in the disposal queue immediately
        for (const [objectId, disposalInfo] of this.disposalQueue.entries()) {
            // Clear any existing timer
            if (this.disposalTimers.has(objectId)) {
                clearTimeout(this.disposalTimers.get(objectId));
                this.disposalTimers.delete(objectId);
            }
            
            // Dispose the object immediately
            const { object, objectType } = disposalInfo;
            this.disposeObject(object);
            
            // Update stats
            const pool = this.objectPools.get(this.getPoolTypeForObject(objectType));
            if (pool) {
                pool.stats.disposed++;
            }
            this.poolStats.disposed++;
        }
        
        // Clear the disposal queue
        this.disposalQueue.clear();
        this.disposalTimers.clear();
    }
    
    /**
     * Get pool statistics
     * @returns {Object} - Pool statistics
     */
    getPoolStats() {
        const stats = {
            ...this.poolStats,
            pools: {},
            activeChunks: this.activeChunks.size,
            pendingDisposals: this.disposalQueue.size
        };
        
        // Collect stats for each pool
        for (const [type, pool] of this.objectPools.entries()) {
            stats.pools[type] = {
                ...pool.stats,
                currentSize: pool.objects.length,
                maxSize: pool.maxSize
            };
        }
        
        return stats;
    }
    
    /**
     * Clear WebGL resources and caches
     */
    clearWebGLResources() {
        if (THREE.Cache && THREE.Cache.clear) {
            THREE.Cache.clear();
        }
        
        // Also clear shared resources
        sharedResources.dispose();
    }
}