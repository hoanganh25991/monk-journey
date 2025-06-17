import * as THREE from 'three';

/**
 * Generation Manager class that handles procedural content generation
 * Extracted from WorldManager for better maintainability
 */
export class GenerationManager {
    constructor(scene, terrainManager, structureManager, environmentManager, zoneManager) {
        this.scene = scene;
        this.terrainManager = terrainManager;
        this.structureManager = structureManager;
        this.environmentManager = environmentManager;
        this.zoneManager = zoneManager;
        
        // Procedural generation settings
        this.generatedChunks = new Set(); // Track which chunks have been generated
        this.currentZoneType = 'Forest'; // Current zone type
        this.worldScale = 1.0; // Scale factor to make objects appear farther apart
        
        // For spiral generation
        this.pendingChunks = []; // Queue of chunks waiting to be processed
        this.processingChunk = false; // Flag to prevent concurrent chunk processing
        
        // Constants for performance optimization
        this.CHUNK_PROCESSING_BUDGET_MS = 5; // Maximum time to spend processing chunks per frame
        
        // Zone definitions and densities
        this.zoneSize = 500 * this.worldScale; // Scale zone size to maintain proper zone distribution
        this.zoneTransitionBuffer = 20 * this.worldScale; // Scale buffer zone for transitions
        
        // Flag to track initial terrain creation
        this.initialTerrainCreated = false;
    }
    
    /**
     * Set zone densities configuration
     * @param {Object} zoneDensities - Zone densities configuration
     */
    setZoneDensities(zoneDensities) {
        this.zoneDensities = zoneDensities;
    }
    
    /**
     * Generate procedural content for chunks around the player
     * @param {number} playerChunkX - Player's chunk X coordinate
     * @param {number} playerChunkZ - Player's chunk Z coordinate
     * @param {THREE.Vector3} playerPosition - Player position for zone detection
     * @param {number} contentGenDistance - Distance to generate content
     * @param {boolean} lowPerformanceMode - Whether system is in low performance mode
     */
    generateProceduralContent(playerChunkX, playerChunkZ, playerPosition, contentGenDistance, lowPerformanceMode) {
        // Set flag to prevent concurrent processing
        this.processingChunk = true;
        
        try {
            // Set initialTerrainCreated to true after first update
            // This allows structures to be generated in subsequent updates
            if (!this.initialTerrainCreated) {
                console.debug("Initial terrain creation complete, enabling structure generation");
                this.initialTerrainCreated = true;
            }
            
            // Further reduce content generation distance in low performance mode
            const effectiveDistance = lowPerformanceMode ? Math.max(2, contentGenDistance - 1) : contentGenDistance;
            
            // Queue chunks for processing instead of processing immediately
            // This allows us to spread the work across multiple frames
            this.queueChunksForProcessing(playerChunkX, playerChunkZ, effectiveDistance);
            
            // Process a limited number of chunks from the queue
            this.processChunkQueue(this.CHUNK_PROCESSING_BUDGET_MS);
            
            // Update current zone type based on player position
            this.updatePlayerZone(playerPosition);
        } catch (error) {
            console.error("Error generating procedural content:", error);
        } finally {
            // Clear flag to allow future processing
            this.processingChunk = false;
        }
    }
    
    /**
     * Queue chunks for processing in spiral order
     * @param {number} centerX - Center chunk X coordinate
     * @param {number} centerZ - Center chunk Z coordinate
     * @param {number} distance - Maximum distance from center
     */
    queueChunksForProcessing(centerX, centerZ, distance) {
        // Generate spiral coordinates
        const spiralCoords = this.generateSpiralCoordinates(centerX, centerZ, distance);
        
        // Add chunks to processing queue if not already generated
        for (const [x, z] of spiralCoords) {
            const chunkKey = `${x},${z}`;
            
            // Skip if already generated or already in queue
            if (this.generatedChunks.has(chunkKey)) continue;
            
            // Check if chunk is already in pending queue
            const alreadyPending = this.pendingChunks.some(chunk => chunk.key === chunkKey);
            if (alreadyPending) continue;
            
            // Add to pending chunks queue with priority based on distance from center
            const distanceFromCenter = Math.max(Math.abs(x - centerX), Math.abs(z - centerZ));
            this.pendingChunks.push({
                key: chunkKey,
                x: x,
                z: z,
                priority: distance - distanceFromCenter, // Higher priority for closer chunks
                timestamp: Date.now()
            });
        }
        
        // Sort pending chunks by priority (highest first)
        this.pendingChunks.sort((a, b) => b.priority - a.priority);
    }
    
    /**
     * Generate spiral coordinates around a center point
     * @param {number} centerX - Center X coordinate
     * @param {number} centerZ - Center Z coordinate
     * @param {number} distance - Maximum distance from center
     * @returns {Array} - Array of [x, z] coordinates in spiral order
     */
    generateSpiralCoordinates(centerX, centerZ, distance) {
        const spiralCoords = [];
        
        // Generate spiral coordinates
        for (let layer = 0; layer <= distance; layer++) {
            if (layer === 0) {
                // Center point
                spiralCoords.push([centerX, centerZ]);
            } else {
                // Top edge (left to right)
                for (let i = -layer; i <= layer; i++) {
                    spiralCoords.push([centerX + i, centerZ - layer]);
                }
                // Right edge (top to bottom)
                for (let i = -layer + 1; i <= layer; i++) {
                    spiralCoords.push([centerX + layer, centerZ + i]);
                }
                // Bottom edge (right to left)
                for (let i = layer - 1; i >= -layer; i--) {
                    spiralCoords.push([centerX + i, centerZ + layer]);
                }
                // Left edge (bottom to top)
                for (let i = layer - 1; i >= -layer + 1; i--) {
                    spiralCoords.push([centerX - layer, centerZ + i]);
                }
            }
        }
        
        return spiralCoords;
    }
    
    /**
     * Process chunks from the queue with a time budget
     * @param {number} timeBudgetMs - Maximum time to spend processing chunks
     */
    processChunkQueue(timeBudgetMs) {
        const startTime = performance.now();
        let chunksProcessed = 0;
        
        // Process chunks until we run out of time or chunks
        while (this.pendingChunks.length > 0 && 
               performance.now() - startTime < timeBudgetMs) {
            
            // Get highest priority chunk
            const chunk = this.pendingChunks.shift();
            
            // Skip if already generated (could have been generated while in queue)
            if (this.generatedChunks.has(chunk.key)) continue;
            
            // Skip chunks that are too old (more than 5 seconds in queue)
            if (Date.now() - chunk.timestamp > 5000) continue;
            
            // Generate content for this chunk
            this.generateChunkContent(chunk.x, chunk.z);
            chunksProcessed++;
        }
        
        // If we processed chunks and still have more, schedule next batch
        if (chunksProcessed > 0 && this.pendingChunks.length > 0) {
            // Schedule next batch with a small delay to prevent frame drops
            setTimeout(() => {
                requestAnimationFrame(() => {
                    this.processChunkQueue(timeBudgetMs);
                });
            }, 50);
        }
    }
    
    /**
     * Generate procedural content for a terrain chunk
     * @param {number} chunkX - Chunk X coordinate
     * @param {number} chunkZ - Chunk Z coordinate
     */
    generateChunkContent(chunkX, chunkZ) {
        const chunkKey = `${chunkX},${chunkZ}`;
        
        // Skip if already generated
        if (this.generatedChunks.has(chunkKey)) {
            return;
        }
        
        // Validate chunk coordinates
        if (isNaN(chunkX) || isNaN(chunkZ)) {
            console.warn(`Invalid chunk coordinates: ${chunkX}, ${chunkZ}`);
            this.generatedChunks.add(chunkKey); // Mark as generated to prevent retries
            return;
        }
        
        console.debug(`Generating content for chunk ${chunkKey}`);
        
        // Calculate world coordinates for this chunk
        const worldX = chunkX * this.terrainManager.terrainChunkSize;
        const worldZ = chunkZ * this.terrainManager.terrainChunkSize;
        
        // Determine zone type for this chunk
        const zoneType = this.getZoneTypeAt(worldX, worldZ);
        
        // Handle undefined zone type
        if (!zoneType) {
            console.warn(`Failed to determine zone type for chunk ${chunkKey}`);
            this.generatedChunks.add(chunkKey); // Mark as generated to prevent retries
            return;
        }
        
        // Get zone density, defaulting to Forest if not found
        const zoneDensity = this.zoneDensities[zoneType] || this.zoneDensities['Forest'];
        
        if (!zoneDensity) {
            console.warn(`No zone density configuration for zone type: ${zoneType}`);
            this.generatedChunks.add(chunkKey); // Mark as generated to prevent retries
            return;
        }
        
        try {
            // Apply density reduction based on performance settings
            const performanceMultiplier = 0.3; // Consistent multiplier for better performance
            const reducedDensity = { 
                ...zoneDensity,
                environment: zoneDensity.environment * performanceMultiplier,
                structures: zoneDensity.structures * 0.2
            };
            
            // Generate environment objects
            this.generateEnvironmentObjectsForChunk(chunkX, chunkZ, zoneType, reducedDensity);
            
            // Generate structures with limited probability and only after initial terrain is created
            if (this.initialTerrainCreated && Math.random() < 0.1) {
                this.generateStructuresForChunk(chunkX, chunkZ, zoneType, reducedDensity);
            }
            
            // Mark chunk as generated
            this.generatedChunks.add(chunkKey);
        } catch (error) {
            console.error(`Error generating content for chunk ${chunkKey}:`, error);
            this.generatedChunks.add(chunkKey); // Mark as generated to prevent retries
        }
    }
    
    /**
     * Determine zone type based on world position
     * @param {number} x - World X coordinate
     * @param {number} z - World Z coordinate
     * @returns {string} - Zone type
     */
    getZoneTypeAt(x, z) {
        // Handle invalid coordinates
        if (x === undefined || z === undefined || isNaN(x) || isNaN(z)) {
            console.warn(`Invalid coordinates for zone determination: x=${x}, z=${z}`);
            return 'Forest'; // Default to Forest if coordinates are invalid
        }
        
        // Simple zone determination based on position
        // Creates a pattern of different zones across the world
        const zoneX = Math.floor(x / this.zoneSize);
        const zoneZ = Math.floor(z / this.zoneSize);
        
        // Use a simple hash to determine zone type
        const hash = Math.abs(zoneX * 73 + zoneZ * 127) % 5;
        const zoneTypes = ['Forest', 'Desert', 'Mountain', 'Swamp', 'Magical'];
        
        // Ensure we have a valid zone type
        const zoneType = zoneTypes[hash] || 'Forest';
        
        return zoneType;
    }
    
    /**
     * Update player's current zone and handle zone transitions
     * @param {THREE.Vector3} playerPosition - Player position
     */
    updatePlayerZone(playerPosition) {
        if (!playerPosition) return;
        
        // Ensure we have valid coordinates
        if (isNaN(playerPosition.x) || isNaN(playerPosition.z)) {
            console.warn(`Invalid player position for zone update: ${playerPosition.x}, ${playerPosition.z}`);
            return;
        }
        
        const newZoneType = this.getZoneTypeAt(playerPosition.x, playerPosition.z);
        
        // Ensure we have a valid zone type
        if (!newZoneType) {
            console.warn(`Invalid zone type returned for position: ${playerPosition.x}, ${playerPosition.z}`);
            return;
        }
        
        if (newZoneType !== this.currentZoneType) {
            console.debug(`Player entered new zone: ${this.currentZoneType} -> ${newZoneType}`);
            this.currentZoneType = newZoneType;
        }
    }
    
    /**
     * Generate environment objects for a chunk
     * This is a placeholder - the actual implementation would be moved from WorldManager
     */
    generateEnvironmentObjectsForChunk(chunkX, chunkZ, zoneType, zoneDensity) {
        // This would contain the implementation from WorldManager.generateEnvironmentObjectsForChunk
        // For brevity, we're not including the full implementation here
        if (this.environmentManager && this.environmentManager.generateEnvironmentForChunk) {
            this.environmentManager.generateEnvironmentForChunk(chunkX, chunkZ, zoneType, zoneDensity);
        }
    }
    
    /**
     * Generate structures for a chunk
     * This is a placeholder - the actual implementation would be moved from WorldManager
     */
    generateStructuresForChunk(chunkX, chunkZ, zoneType, zoneDensity) {
        // This would contain the implementation from WorldManager.generateStructuresForChunk
        // For brevity, we're not including the full implementation here
        if (this.structureManager && this.structureManager.generateStructuresForChunk) {
            this.structureManager.generateStructuresForChunk(chunkX, chunkZ, zoneType, zoneDensity);
        }
    }
    
    /**
     * Get current zone information for the player
     * @param {THREE.Vector3} playerPosition - Player's current position
     * @returns {object} - Zone information
     */
    getCurrentZoneInfo(playerPosition) {
        // Handle invalid player position
        if (!playerPosition || isNaN(playerPosition.x) || isNaN(playerPosition.z)) {
            console.warn(`Invalid player position for zone info: ${playerPosition?.x}, ${playerPosition?.z}`);
            // Return default zone info
            return {
                type: 'Forest',
                density: this.zoneDensities['Forest'],
                position: { x: 0, z: 0 }
            };
        }
        
        const zoneType = this.getZoneTypeAt(playerPosition.x, playerPosition.z);
        
        // Handle undefined zone type
        if (!zoneType) {
            console.warn(`Invalid zone type for position: ${playerPosition.x}, ${playerPosition.z}`);
            // Return default zone info
            return {
                type: 'Forest',
                density: this.zoneDensities['Forest'],
                position: {
                    x: Math.floor(playerPosition.x / this.zoneSize),
                    z: Math.floor(playerPosition.z / this.zoneSize)
                }
            };
        }
        
        // Get zone density, defaulting to Forest if not found
        const zoneDensity = this.zoneDensities[zoneType] || this.zoneDensities['Forest'];
        
        return {
            type: zoneType,
            density: zoneDensity,
            position: {
                x: Math.floor(playerPosition.x / this.zoneSize),
                z: Math.floor(playerPosition.z / this.zoneSize)
            }
        };
    }
    
    /**
     * Get statistics about generated content
     * @returns {object} - Content statistics
     */
    getContentStats() {
        return {
            generatedChunks: this.generatedChunks.size,
            currentZone: this.currentZoneType
        };
    }
}