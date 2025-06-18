import * as THREE from 'three';
import BIOMES from '../../config/map/biomes.js';

/**
 * Generation Manager class that handles procedural content generation
 * Extracted from MapManager for better maintainability
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
        this.currentZoneType = BIOMES.FOREST; // Current zone type
        this.mapManagerScale = 1.0; // Scale factor to make objects appear farther apart
        
        // For spiral generation
        this.pendingChunks = []; // Queue of chunks waiting to be processed
        this.processingChunk = false; // Flag to prevent concurrent chunk processing
        
        // Constants for performance optimization
        this.CHUNK_PROCESSING_BUDGET_MS = 5; // Maximum time to spend processing chunks per frame
        
        // Zone definitions and densities
        this.zoneSize = 500 * this.mapManagerScale; // Scale zone size to maintain proper zone distribution
        this.zoneTransitionBuffer = 20 * this.mapManagerScale; // Scale buffer zone for transitions
        
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
            
            // Get player movement direction if available
            let directionX = 0;
            let directionZ = 0;
            let lastPlayerPosition = null;
            
            // Get last player position from map manager if available
            if (this.terrainManager && this.terrainManager.MapManager && 
                this.terrainManager.MapManager.lastPlayerPosition) {
                lastPlayerPosition = this.terrainManager.MapManager.lastPlayerPosition;
            }
            
            if (lastPlayerPosition && playerPosition) {
                // Calculate movement direction
                const moveX = playerPosition.x - lastPlayerPosition.x;
                const moveZ = playerPosition.z - lastPlayerPosition.z;
                
                // Normalize direction
                const length = Math.sqrt(moveX * moveX + moveZ * moveZ);
                if (length > 0.001) {
                    directionX = moveX / length;
                    directionZ = moveZ / length;
                }
            }
            
            // Queue chunks for processing instead of processing immediately
            // This allows us to spread the work across multiple frames
            this.queueChunksForProcessing(
                playerChunkX, 
                playerChunkZ, 
                effectiveDistance, 
                directionX, 
                directionZ
            );
            
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
     * Queue chunks for processing in spiral order with direction prioritization
     * @param {number} centerX - Center chunk X coordinate
     * @param {number} centerZ - Center chunk Z coordinate
     * @param {number} distance - Maximum distance from center
     * @param {number} directionX - X component of player movement direction (normalized)
     * @param {number} directionZ - Z component of player movement direction (normalized)
     */
    queueChunksForProcessing(centerX, centerZ, distance, directionX = 0, directionZ = 0) {
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
            
            // Calculate base priority based on distance from center
            const distanceFromCenter = Math.max(Math.abs(x - centerX), Math.abs(z - centerZ));
            let priority = distance - distanceFromCenter; // Higher priority for closer chunks
            
            // If we have a movement direction, prioritize chunks in that direction
            if (Math.abs(directionX) > 0.001 || Math.abs(directionZ) > 0.001) {
                // Calculate vector from center to chunk
                const chunkVectorX = x - centerX;
                const chunkVectorZ = z - centerZ;
                
                // Calculate dot product to determine if chunk is in movement direction
                // Higher dot product means chunk is more aligned with movement direction
                const dotProduct = chunkVectorX * directionX + chunkVectorZ * directionZ;
                
                // Boost priority for chunks in movement direction
                if (dotProduct > 0) {
                    // Normalize the boost based on distance and alignment
                    const directionBoost = dotProduct / (distanceFromCenter || 1);
                    priority += directionBoost * 3; // Significant boost for chunks in movement direction
                }
                
                // Extra boost for chunks directly ahead
                if (dotProduct > 0.7 && distanceFromCenter <= distance * 0.7) {
                    priority += 5; // Extra boost for chunks directly ahead
                }
            }
            
            // Add to pending chunks queue
            this.pendingChunks.push({
                key: chunkKey,
                x: x,
                z: z,
                priority: priority,
                timestamp: Date.now()
            });
        }
        
        // Sort pending chunks by priority (highest first)
        this.pendingChunks.sort((a, b) => b.priority - a.priority);
        
        // If we have a movement direction, add extra chunks farther ahead
        if ((Math.abs(directionX) > 0.001 || Math.abs(directionZ) > 0.001) && distance > 2) {
            // Look ahead distance (in chunks)
            const lookAheadDistance = distance * 1.5;
            
            // Calculate target chunk in movement direction
            const targetChunkX = Math.floor(centerX + directionX * lookAheadDistance);
            const targetChunkZ = Math.floor(centerZ + directionZ * lookAheadDistance);
            
            // Add chunks in a smaller radius around the target position
            const targetRadius = Math.floor(distance * 0.5);
            for (let x = targetChunkX - targetRadius; x <= targetChunkX + targetRadius; x++) {
                for (let z = targetChunkZ - targetRadius; z <= targetChunkZ + targetRadius; z++) {
                    const chunkKey = `${x},${z}`;
                    
                    // Skip if already generated or already in queue
                    if (this.generatedChunks.has(chunkKey)) continue;
                    
                    // Check if chunk is already in pending queue
                    const alreadyPending = this.pendingChunks.some(chunk => chunk.key === chunkKey);
                    if (alreadyPending) continue;
                    
                    // Calculate distance from target
                    const distanceFromTarget = Math.max(
                        Math.abs(x - targetChunkX),
                        Math.abs(z - targetChunkZ)
                    );
                    
                    // Higher priority for chunks closer to target
                    const priority = 10 + (targetRadius - distanceFromTarget);
                    
                    // Add to pending chunks queue
                    this.pendingChunks.push({
                        key: chunkKey,
                        x: x,
                        z: z,
                        priority: priority,
                        timestamp: Date.now()
                    });
                }
            }
            
            // Re-sort pending chunks by priority
            this.pendingChunks.sort((a, b) => b.priority - a.priority);
        }
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
     * This method now only handles terrain generation and marks the chunk as processed
     * Environment and structure generation are handled separately
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
        
        console.debug(`Generating terrain for chunk ${chunkKey}`);
        
        try {
            // Mark chunk as generated - we're only handling terrain here
            this.generatedChunks.add(chunkKey);
        } catch (error) {
            console.error(`Error generating terrain for chunk ${chunkKey}:`, error);
            this.generatedChunks.add(chunkKey); // Mark as generated to prevent retries
        }
    }
    
    /**
     * Generate environment objects for a specific chunk
     * This is now separated from terrain generation for better control
     * @param {number} chunkX - Chunk X coordinate
     * @param {number} chunkZ - Chunk Z coordinate
     * @returns {boolean} - True if environment was generated successfully
     */
    generateEnvironmentForChunk(chunkX, chunkZ) {
        const chunkKey = `${chunkX},${chunkZ}`;
        
        // Validate chunk coordinates
        if (isNaN(chunkX) || isNaN(chunkZ)) {
            console.warn(`Invalid chunk coordinates for environment: ${chunkX}, ${chunkZ}`);
            return false;
        }
        
        // Calculate world coordinates for this chunk
        const worldX = chunkX * this.terrainManager.terrainChunkSize;
        const worldZ = chunkZ * this.terrainManager.terrainChunkSize;
        
        // Determine zone type for this chunk
        const zoneType = this.getZoneTypeAt(worldX, worldZ);
        
        // Handle undefined zone type
        if (!zoneType) {
            console.warn(`Failed to determine zone type for environment in chunk ${chunkKey}`);
            return false;
        }
        
        // Get zone density, defaulting to Forest if not found
        const zoneDensity = this.zoneDensities[zoneType] || this.zoneDensities['Forest'];
        
        if (!zoneDensity) {
            console.warn(`No zone density configuration for environment in zone type: ${zoneType}`);
            return false;
        }
        
        try {
            // Apply density reduction based on performance settings
            const performanceMultiplier = 0.3; // Consistent multiplier for better performance
            const reducedDensity = { 
                ...zoneDensity,
                environment: zoneDensity.environment * performanceMultiplier
            };
            
            // Generate environment objects
            this.generateEnvironmentObjectsForChunk(chunkX, chunkZ, zoneType, reducedDensity);
            return true;
        } catch (error) {
            console.error(`Error generating environment for chunk ${chunkKey}:`, error);
            return false;
        }
    }
    
    /**
     * Generate structures for a specific chunk
     * This is now separated from terrain generation for better control
     * @param {number} chunkX - Chunk X coordinate
     * @param {number} chunkZ - Chunk Z coordinate
     * @returns {boolean} - True if structures were generated successfully
     */
    generateStructuresForChunk(chunkX, chunkZ) {
        const chunkKey = `${chunkX},${chunkZ}`;
        
        // Validate chunk coordinates
        if (isNaN(chunkX) || isNaN(chunkZ)) {
            console.warn(`Invalid chunk coordinates for structures: ${chunkX}, ${chunkZ}`);
            return false;
        }
        
        // Calculate world coordinates for this chunk
        const worldX = chunkX * this.terrainManager.terrainChunkSize;
        const worldZ = chunkZ * this.terrainManager.terrainChunkSize;
        
        // Determine zone type for this chunk
        const zoneType = this.getZoneTypeAt(worldX, worldZ);
        
        // Handle undefined zone type
        if (!zoneType) {
            console.warn(`Failed to determine zone type for structures in chunk ${chunkKey}`);
            return false;
        }
        
        // Get zone density, defaulting to Forest if not found
        const zoneDensity = this.zoneDensities[zoneType] || this.zoneDensities['Forest'];
        
        if (!zoneDensity) {
            console.warn(`No zone density configuration for structures in zone type: ${zoneType}`);
            return false;
        }
        
        try {
            // Apply density reduction based on performance settings
            const reducedDensity = { 
                ...zoneDensity,
                structures: zoneDensity.structures * 0.2
            };
            
            // Generate structures
            if (this.initialTerrainCreated) {
                // Call the structure manager's method directly to avoid recursion
                if (this.structureManager && this.structureManager.generateStructuresForChunk) {
                    this.structureManager.generateStructuresForChunk(chunkX, chunkZ, zoneType, reducedDensity);
                    return true;
                }
            }
            return false;
        } catch (error) {
            console.error(`Error generating structures for chunk ${chunkKey}:`, error);
            return false;
        }
    }
    
    /**
     * Get the current zone density for a given position
     * @param {THREE.Vector3} position - The position to check
     * @returns {number} - The density value (0.0 to 1.0)
     */
    getCurrentZoneDensity(position) {
        if (!position) return 0.5; // Default density
        
        // Get zone type for this position
        const zoneType = this.getZoneTypeAt(position.x, position.z);
        
        // Return density for this zone type
        return this.zoneDensities[zoneType] || 0.5;
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
        const zoneTypes = [
            BIOMES.FOREST,
            BIOMES.DESERT,
            BIOMES.MOUNTAIN,
            BIOMES.SWAMP,
            BIOMES.MAGICAL
        ];
        
        // Ensure we have a valid zone type
        const zoneType = zoneTypes[hash] || BIOMES.FOREST;
        
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
     * This is a placeholder - the actual implementation would be moved from MapManager
     */
    generateEnvironmentObjectsForChunk(chunkX, chunkZ, zoneType, zoneDensity) {
        // This would contain the implementation from MapManager.generateEnvironmentObjectsForChunk
        // For brevity, we're not including the full implementation here
        if (this.environmentManager && this.environmentManager.generateEnvironmentForChunk) {
            this.environmentManager.generateEnvironmentForChunk(chunkX, chunkZ, zoneType, zoneDensity);
        }
    }
    
    /**
     * Generate structures for a chunk
     * This is a placeholder - the actual implementation would be moved from MapManager
     */
    generateStructuresForChunk(chunkX, chunkZ, zoneType, zoneDensity) {
        // This would contain the implementation from MapManager.generateStructuresForChunk
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