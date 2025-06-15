import * as THREE from 'three';

/**
 * Manages terrain generation queue and processing
 */
export class TerrainQueueManager {
    constructor(terrainChunkManager, terrainConfig) {
        this.terrainChunkManager = terrainChunkManager;
        this.terrainConfig = terrainConfig;
        
        this.terrainGenerationQueue = []; // Queue for prioritized terrain generation
        this.lastQueueProcessTime = 0; // Timestamp of last queue processing to prevent constant processing
        this.isProcessingTerrainQueue = false; // Flag to prevent multiple queue processing
        this.lastPlayerChunk = { x: 0, z: 0 }; // Last player chunk for movement prediction
        this.playerMovementDirection = new THREE.Vector3(0, 0, 0); // Track player movement direction for prediction
        
        this.game = null; // Will be set by TerrainManager
    }

    /**
     * Set the game reference for event dispatching
     * @param {Object} game - The game instance
     */
    setGame(game) {
        this.game = game;
    }

    /**
     * Update player movement tracking
     * @param {number} terrainChunkX - Current player chunk X
     * @param {number} terrainChunkZ - Current player chunk Z
     */
    updatePlayerMovement(terrainChunkX, terrainChunkZ) {
        // Calculate player movement direction for predictive loading
        if (this.lastPlayerChunk.x !== terrainChunkX || this.lastPlayerChunk.z !== terrainChunkZ) {
            // Calculate movement direction vector
            this.playerMovementDirection.x = terrainChunkX - this.lastPlayerChunk.x;
            this.playerMovementDirection.z = terrainChunkZ - this.lastPlayerChunk.z;
            
            // Normalize the direction vector if it's not zero
            if (this.playerMovementDirection.x !== 0 || this.playerMovementDirection.z !== 0) {
                const length = Math.sqrt(
                    this.playerMovementDirection.x * this.playerMovementDirection.x + 
                    this.playerMovementDirection.z * this.playerMovementDirection.z
                );
                if (length > 0) {
                    this.playerMovementDirection.x /= length;
                    this.playerMovementDirection.z /= length;
                }
            }
            
            // Update last player chunk
            this.lastPlayerChunk = { x: terrainChunkX, z: terrainChunkZ };
        }
    }

    /**
     * Queue terrain chunks for buffering with priority based on player movement direction
     * @param {number} centerX - Center X chunk coordinate
     * @param {number} centerZ - Center Z chunk coordinate
     * @param {Object} visibleTerrainChunks - Currently visible chunks
     * @param {Object} terrainBuffer - Terrain buffer
     * @param {Object} terrainChunks - Active terrain chunks
     */
    queueTerrainChunksForBuffering(centerX, centerZ, visibleTerrainChunks, terrainBuffer, terrainChunks) {
        // Limit the queue size to prevent memory issues
        const MAX_QUEUE_SIZE = 16; // Maximum number of chunks in the queue (reduced from 24 to 16)
        if (this.terrainGenerationQueue.length >= MAX_QUEUE_SIZE) {
            console.debug(`Terrain generation queue full (${this.terrainGenerationQueue.length}/${MAX_QUEUE_SIZE}), skipping new chunks`);
            return;
        }
        
        // Create a new queue to avoid duplicates
        const newQueue = [];
        
        // Keep track of chunks already in the queue using a Set for O(1) lookups
        const existingChunks = new Set();
        
        // Add existing queue items to the set to avoid duplicates
        this.terrainGenerationQueue.forEach(item => {
            existingChunks.add(`${item.chunkX},${item.chunkZ}`);
        });
        
        // Track how many chunks we've added to the queue
        let chunksAdded = 0;
        const MAX_CHUNKS_PER_UPDATE = 8; // Maximum chunks to add per update
        
        // Calculate buffer area (larger than view distance)
        for (let x = centerX - this.terrainConfig.bufferDistance; x <= centerX + this.terrainConfig.bufferDistance; x++) {
            for (let z = centerZ - this.terrainConfig.bufferDistance; z <= centerZ + this.terrainConfig.bufferDistance; z++) {
                // Stop if we've reached the maximum chunks per update
                if (chunksAdded >= MAX_CHUNKS_PER_UPDATE) {
                    break;
                }
                const chunkKey = `${x},${z}`;
                
                // Skip if already in visible chunks, buffer, active chunks, or already in queue
                if (visibleTerrainChunks[chunkKey] || 
                    terrainBuffer[chunkKey] || 
                    terrainChunks[chunkKey] ||
                    existingChunks.has(chunkKey)) {
                    continue;
                }
                
                // Calculate distance from center
                const distX = x - centerX;
                const distZ = z - centerZ;
                
                // Calculate dot product with movement direction to prioritize chunks in that direction
                let priority = 0;
                if (this.playerMovementDirection.x !== 0 || this.playerMovementDirection.z !== 0) {
                    const dotProduct = distX * this.playerMovementDirection.x + distZ * this.playerMovementDirection.z;
                    // Higher dot product means the chunk is more in the direction of movement
                    priority = dotProduct;
                }
                
                // Add to new queue with priority
                newQueue.push({
                    chunkX: x,
                    chunkZ: z,
                    priority: priority,
                    chunkKey: chunkKey
                });
                
                // Add to set to prevent duplicates
                existingChunks.add(chunkKey);
                
                // Increment the counter
                chunksAdded++;
            }
            
            // Also break the outer loop if we've reached the maximum
            if (chunksAdded >= MAX_CHUNKS_PER_UPDATE) {
                break;
            }
        }
        
        // Merge the new queue with the existing queue
        this.terrainGenerationQueue = [...this.terrainGenerationQueue, ...newQueue];
        
        // Limit the queue size
        if (this.terrainGenerationQueue.length > MAX_QUEUE_SIZE) {
            this.terrainGenerationQueue = this.terrainGenerationQueue.slice(0, MAX_QUEUE_SIZE);
        }
        
        // Sort queue by priority (higher priority first)
        this.terrainGenerationQueue.sort((a, b) => b.priority - a.priority);
        
        // Log the queue size for debugging
        if (this.terrainGenerationQueue.length > 0) {
            console.debug(`Terrain generation queue size: ${this.terrainGenerationQueue.length}, chunks added: ${chunksAdded}`);
        }
    }

    /**
     * Process the terrain generation queue asynchronously
     * Optimized to process multiple chunks per frame when possible
     */
    processTerrainGenerationQueue() {
        // If already processing, don't start another processing cycle
        if (this.isProcessingTerrainQueue) {
            console.debug("Already processing terrain queue, skipping duplicate processing");
            return;
        }
        
        // Track when we process the queue to prevent too frequent processing
        this.lastQueueProcessTime = Date.now();
        
        if (this.terrainGenerationQueue.length === 0) {
            this.isProcessingTerrainQueue = false;
            // Only log occasionally to reduce console spam
            if (Math.random() < 0.1) { // Only log 10% of the time
                console.debug("Terrain generation queue processing complete (empty queue)");
            }
            // Dispatch an event that terrain generation is complete
            if (this.game && this.game.events) {
                this.game.events.dispatch('terrainGenerationComplete');
            }
            return;
        }
        
        this.isProcessingTerrainQueue = true;
        
        // Process multiple chunks per frame when possible
        // Start with a timestamp to measure how long we've been processing
        const startTime = performance.now();
        const maxProcessingTime = 3; // Max milliseconds to spend processing per frame (reduced from 5 to 3)
        
        // Process chunks until we hit the time limit or empty the queue
        while (this.terrainGenerationQueue.length > 0 && 
               (performance.now() - startTime) < maxProcessingTime) {
            
            // Get the highest priority chunk
            const nextChunk = this.terrainGenerationQueue.shift();
            
            // Skip if this chunk already exists in active chunks or buffer
            const chunkKey = `${nextChunk.chunkX},${nextChunk.chunkZ}`;
            if (this.terrainChunkManager.hasChunk(chunkKey)) {
                console.debug(`Skipping duplicate chunk ${chunkKey} in queue`);
                continue;
            }
            
            // Create the chunk in the buffer (not visible yet)
            this.terrainChunkManager.createBufferedTerrainChunk(nextChunk.chunkX, nextChunk.chunkZ);
        }
        
        // If there are still chunks to process, continue in the next frame
        if (this.terrainGenerationQueue.length > 0) {
            // Add a maximum processing time to prevent infinite loops
            const MAX_PROCESSING_TIME = 500; // 500ms maximum total processing time
            const processingTime = performance.now() - startTime;
            
            if (processingTime > MAX_PROCESSING_TIME) {
                console.warn(`Terrain generation taking too long (${processingTime.toFixed(2)}ms), clearing queue to prevent FPS drop`);
                // Clear the queue to prevent infinite processing
                this.terrainGenerationQueue = [];
                this.isProcessingTerrainQueue = false;
                return;
            }
            
            // Schedule next batch with a longer delay to allow other operations
            // Increased from 16ms to 50ms to reduce CPU usage
            setTimeout(() => {
                requestAnimationFrame(() => {
                    this.processTerrainGenerationQueue();
                });
            }, 50); // Add a 50ms delay to reduce CPU load
        } else {
            this.isProcessingTerrainQueue = false;
            // Only log occasionally to reduce console spam
            if (Math.random() < 0.1) { // Only log 10% of the time
                console.debug("Terrain generation queue processing complete");
            }
            // Dispatch an event that terrain generation is complete
            if (this.game && this.game.events) {
                this.game.events.dispatch('terrainGenerationComplete');
            }
        }
    }

    /**
     * Check if queue processing should start
     * @returns {boolean} - True if processing should start
     */
    shouldProcessQueue() {
        const currentTime = Date.now();
        if (!this.lastQueueProcessTime) {
            this.lastQueueProcessTime = 0;
        }
        
        // Only process the queue if we're not already processing and enough time has passed
        const QUEUE_PROCESS_COOLDOWN = 3000; // 3000ms (3 seconds) cooldown for mobile performance
        return !this.isProcessingTerrainQueue && 
               currentTime - this.lastQueueProcessTime > QUEUE_PROCESS_COOLDOWN;
    }

    /**
     * Wait for initial terrain generation to complete
     * @returns {Promise<void>} - Promise that resolves when initial terrain is generated
     */
    waitForInitialTerrainGeneration() {
        return new Promise((resolve) => {
            const checkQueue = () => {
                // If queue is empty and we're not processing anything, terrain generation is complete
                if (this.terrainGenerationQueue.length === 0 && !this.isProcessingTerrainQueue) {
                    console.debug("Initial terrain generation complete");
                    resolve();
                } else {
                    // Check again after a short delay
                    console.debug(`Waiting for terrain generation to complete. Queue length: ${this.terrainGenerationQueue.length}`);
                    setTimeout(checkQueue, 100);
                }
            };
            
            // Start checking
            checkQueue();
        });
    }

    /**
     * Clear the generation queue
     */
    clear() {
        this.terrainGenerationQueue = [];
        this.isProcessingTerrainQueue = false;
        this.lastQueueProcessTime = 0;
        this.lastPlayerChunk = { x: 0, z: 0 };
        this.playerMovementDirection.set(0, 0, 0);
    }
}