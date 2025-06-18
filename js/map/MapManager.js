import * as THREE from 'three';
import { TerrainManager } from './terrain/TerrainManager.js';
import { StructureManager } from './structures/StructureManager.js';
import { EnvironmentManager } from './environment/EnvironmentManager.js';
import { InteractiveObjectManager } from './interactive/InteractiveObjectManager.js';
import { ZoneManager } from './zones/ZoneManager.js';
import { LightingManager } from './lighting/LightingManager.js';
import { FogManager } from './environment/FogManager.js';
import { TeleportManager } from './teleport/TeleportManager.js';
import { LODManager } from './LODManager.js';
import { ENVIRONMENT_OBJECTS } from '../config/map/environment.js';
import { STRUCTURE_TYPES } from '../config/map/structure.js';
import { BIOMES } from '../config/map/biomes.js';
import { LANDMARK_TYPES, BIOME_LANDMARKS } from '../config/map/landmarks.js';
import { ZONE_DENSITIES } from '../config/map/zones.js';

// Import new modular managers
import { PerformanceManager } from './managers/PerformanceManager.js';
import { MemoryManager } from './managers/MemoryManager.js';
import { GenerationManager } from './generation/GenerationManager.js';
import { SpatialGrid } from './utils/SpatialGrid.js';

/**
 * Main Map Manager class that coordinates all world-related systems
 * Optimized for performance with object pooling, throttling, and spatial partitioning
 * Refactored to use modular managers for better maintainability
 */
export class MapManager {
    constructor(scene, loadingManager, game) {
        this.scene = scene;
        this.loadingManager = loadingManager;
        this.game = game;
        
        // Initialize managers
        this.lightingManager = new LightingManager(scene);
        this.fogManager = new FogManager(scene, this, game);
        this.terrainManager = new TerrainManager(scene, this, game);
        this.structureManager = new StructureManager(scene, this, game);
        this.environmentManager = new EnvironmentManager(scene, this, game);
        this.interactiveManager = new InteractiveObjectManager(scene, this, game);
        this.zoneManager = new ZoneManager(scene, this, game);
        this.teleportManager = new TeleportManager(scene, this, game);
        this.lodManager = new LODManager(scene, this);
        
        // Initialize new modular managers
        this.performanceManager = new PerformanceManager(game);
        this.memoryManager = new MemoryManager(scene, this.terrainManager, this.environmentManager, this.structureManager);
        
        // For screen-based enemy spawning
        this.lastPlayerPosition = new THREE.Vector3(0, 0, 0);
        this.screenSpawnDistance = 20; // Distance to move before spawning new enemies
        
        // For save/load functionality
        this.savedData = null;
        
        // For minimap features
        this.terrainFeatures = [];
        this.trees = [];
        this.rocks = [];
        this.buildings = [];
        this.paths = [];
        
        // Object preloading and buffering - IMPROVED VALUES
        this.objectBuffer = new Map(); // Map to store preloaded objects
        this.preloadDistance = 300; // Increased from 200 to 300 - Distance ahead of player to preload objects
        this.preloadedChunks = new Set(); // Track which chunks have been preloaded
        this.preloadRadius = 3; // Increased from 2 to 3 - Radius of chunks to preload (in chunks)
        this.significantMovementThreshold = 3; // Reduced threshold for triggering preloading (was implicitly 5)
        
        // Spatial partitioning for faster object lookup
        this.spatialGrid = new SpatialGrid(50); // Grid-based spatial partitioning with 50 unit cell size
        
        // Dynamic world generation settings
        this.dynamicWorldEnabled = true;
        
        // Environment density levels - reduced for better performance
        this.densityLevels = {
            high: 2.0,    // Reduced from 3.0
            medium: 1.2,  // Reduced from 2.0
            low: 0.6,     // Reduced from 1.0
            minimal: 0.3  // Reduced from 0.5
        };
        
        this.environmentDensity = this.densityLevels.medium; // Default to medium density
        this.mapManagerScale = 1.0; // Scale factor to make objects appear farther apart
        
        // Use zone densities from config
        this.zoneDensities = ZONE_DENSITIES;
        
        // Initialize generation manager after setting up zone densities
        this.generationManager = new GenerationManager(
            scene, 
            this.terrainManager, 
            this.structureManager, 
            this.environmentManager, 
            this.zoneManager
        );
        this.generationManager.setZoneDensities(this.zoneDensities);
    }
    
    /**
     * Initialize the world
     * @returns {Promise<boolean>} - True if initialization was successful
     */
    async init() {
        console.debug("Initializing world...");
        
        // Initialize lighting
        this.lightingManager.init();
        
        // Initialize fog system
        this.fogManager.initFog();
        
        // Initialize LOD manager
        this.lodManager.init();
        
        // Initialize terrain
        await this.terrainManager.init();
        
        // Initialize environment manager
        this.environmentManager.init();
        
        // Initialize structures with createInitialStructures set to false to prevent immediate structure generation
        this.structureManager.init(false);
        
        // Initialize zones
        this.zoneManager.init();
        
        // Initialize interactive objects
        this.interactiveManager.init();
        
        // Initialize teleport portals
        this.teleportManager.init();
        
        // Apply dynamic world settings
        if (this.dynamicWorldEnabled) {
            // Set environment density in the environment manager - reduce density for better performance
            if (this.environmentManager.setDensity) {
                // Reduce density to 50% of original value to improve performance
                this.environmentManager.setDensity(this.environmentDensity * 0.5);
            }
            
            // Generate initial content around the starting position
            const startPosition = new THREE.Vector3(0, 0, 0);
            const startChunkX = Math.floor(startPosition.x / this.terrainManager.terrainChunkSize);
            const startChunkZ = Math.floor(startPosition.z / this.terrainManager.terrainChunkSize);
            
            // Generate content in a smaller 3x3 grid around the starting position instead of 5x5
            const initialGenDistance = 1; // Reduced from 2 to 1
            console.debug(`Generating initial content in ${(initialGenDistance*2+1)*(initialGenDistance*2+1)} chunks around starting position`);
            
            // First generate only terrain
            console.debug("Generating initial terrain...");
            await this.generateInitialChunksProgressively(startChunkX, startChunkZ, initialGenDistance, {
                generateTerrain: true,
                generateEnvironment: false,
                generateStructures: false
            });
            
            // Then generate environment objects
            console.debug("Generating initial environment objects...");
            await this.generateInitialChunksProgressively(startChunkX, startChunkZ, initialGenDistance, {
                generateTerrain: false,
                generateEnvironment: true,
                generateStructures: false
            });
            
            // Finally generate structures
            console.debug("Generating initial structures...");
            await this.generateInitialChunksProgressively(startChunkX, startChunkZ, initialGenDistance, {
                generateTerrain: false,
                generateEnvironment: false,
                generateStructures: true
            });
            
            // Generate a special landmark near the starting position - but with 50% chance to skip for better performance
            if (Math.random() < 0.5) {
                this.generateZoneLandmark(startPosition, this.generationManager.currentZoneType);
            }
        }
        
        console.debug("World initialization complete");
        return true;
    }
    
    /**
     * Generate initial chunks progressively to prevent freezing
     * This now separates terrain, environment, and structure generation
     * @param {number} startChunkX - Starting chunk X coordinate
     * @param {number} startChunkZ - Starting chunk Z coordinate
     * @param {number} distance - Distance from center to generate
     * @param {Object} options - Generation options
     * @param {boolean} options.generateTerrain - Whether to generate terrain (default: true)
     * @param {boolean} options.generateEnvironment - Whether to generate environment objects (default: true)
     * @param {boolean} options.generateStructures - Whether to generate structures (default: true)
     * @returns {Promise<void>}
     */
    async generateInitialChunksProgressively(startChunkX, startChunkZ, distance, options = {}) {
        // Set default options
        const {
            generateTerrain = true,
            generateEnvironment = true,
            generateStructures = true
        } = options;
        
        return new Promise(resolve => {
            const chunks = [];
            
            // Create a list of chunks to generate
            for (let x = startChunkX - distance; x <= startChunkX + distance; x++) {
                for (let z = startChunkZ - distance; z <= startChunkZ + distance; z++) {
                    chunks.push({x, z});
                }
            }
            
            // Process chunks one by one with a small delay between each
            let index = 0;
            
            const processNextChunk = () => {
                if (index >= chunks.length) {
                    resolve();
                    return;
                }
                
                const chunk = chunks[index++];
                
                // Generate terrain if enabled
                if (generateTerrain) {
                    this.generationManager.generateChunkContent(chunk.x, chunk.z);
                }
                
                // Generate environment if enabled
                if (generateEnvironment) {
                    this.generationManager.generateEnvironmentForChunk(chunk.x, chunk.z);
                }
                
                // Generate structures if enabled
                if (generateStructures) {
                    this.generationManager.generateStructuresForChunk(chunk.x, chunk.z);
                }
                
                // Use setTimeout to yield to the browser's rendering thread
                setTimeout(processNextChunk, 10);
            };
            
            // Start processing chunks
            processNextChunk();
        });
    }
    
    /**
     * Update the world based on player position
     * This is the main method for world generation and updates
     * Optimized to prevent frame drops by throttling and batching operations
     * 
     * @param {THREE.Vector3} playerPosition - The player's current position
     * @param {number} drawDistanceMultiplier - Multiplier for draw distance (1.0 is default)
     */
    updateWorldForPlayer(playerPosition, drawDistanceMultiplier = 1.0) {
        // Skip update if position is invalid
        if (!playerPosition || isNaN(playerPosition.x) || isNaN(playerPosition.z)) {
            console.warn("Invalid player position for world update");
            return;
        }
        
        // Throttle updates to prevent excessive processing
        // Only update if enough time has passed since last update or player moved significantly
        const now = performance.now();
        const minUpdateInterval = this.performanceManager.isLowPerformanceMode() ? 100 : 50; // ms between updates
        const hasMovedSignificantly = this.lastPlayerPosition && 
            playerPosition.distanceTo(this.lastPlayerPosition) > this.significantMovementThreshold;
            
        if (!this._lastWorldUpdate || 
            now - this._lastWorldUpdate > minUpdateInterval || 
            hasMovedSignificantly) {
            
            this._lastWorldUpdate = now;
            
            // Calculate effective draw distance based on performance mode
            const effectiveDrawDistance = this.performanceManager.calculateEffectiveDrawDistance(drawDistanceMultiplier);
            
            // Calculate player's current chunk coordinates
            const terrainChunkSize = this.terrainManager.terrainChunkSize;
            const playerChunkX = Math.floor(playerPosition.x / terrainChunkSize);
            const playerChunkZ = Math.floor(playerPosition.z / terrainChunkSize);
            
            // Use a priority-based update system
            // 1. Always update terrain first (most important for gameplay)
            // Use a higher retention distance to prevent objects from disappearing
            const retentionDistanceMultiplier = 3.0; // Keep chunks in memory much longer
            this.updateTerrainForPlayer(playerPosition, effectiveDrawDistance, retentionDistanceMultiplier);
            
            // 2. Update environment objects (can be throttled more aggressively)
            // Only update environment every other frame in low performance mode
            if (!this.performanceManager.isLowPerformanceMode() || !this._lastEnvironmentUpdate || 
                now - this._lastEnvironmentUpdate > 150) { // Reduced from 200 to 150ms for more frequent updates
                this.updateEnvironmentForPlayer(playerPosition, effectiveDrawDistance);
                this._lastEnvironmentUpdate = now;
            }
            
            // 3. Preload objects in the direction of player movement
            // This prevents objects from suddenly appearing
            // Reduced threshold for preloading to make it happen more frequently
            if ((!this._lastPreload || now - this._lastPreload > 200) && this.lastPlayerPosition) { // Reduced from 300 to 200ms
                // Always preload, not just when moved significantly
                this.preloadObjectsInDirection(playerPosition, this.lastPlayerPosition);
                this._lastPreload = now;
            }
            
            // 4. Generate procedural content with separate control for terrain, environment, and structures
            // Only generate content if we're not already processing chunks
            if (!this.generationManager.processingChunk) {
                // 4a. Generate terrain (highest priority, most frequent updates)
                if (!this._lastTerrainGeneration || now - this._lastTerrainGeneration > 300) {
                    requestAnimationFrame(() => {
                        this.generationManager.generateProceduralContent(
                            playerChunkX, 
                            playerChunkZ, 
                            playerPosition, 
                            Math.floor(effectiveDrawDistance * 0.5), // Reduce generation distance
                            this.performanceManager.isLowPerformanceMode()
                        );
                        this._lastTerrainGeneration = performance.now();
                    });
                }
                
                // 4b. Generate environment objects (medium priority, less frequent updates)
                if (!this._lastEnvironmentGeneration || now - this._lastEnvironmentGeneration > 800) {
                    setTimeout(() => {
                        // Use our dedicated area-based environment generation
                        const envGenRadius = Math.floor(effectiveDrawDistance * 0.4 * this.terrainManager.terrainChunkSize);
                        
                        // Generate environment objects in the area around the player
                        this.generateEnvironmentInArea(
                            playerPosition.x,
                            playerPosition.z,
                            envGenRadius,
                            {
                                density: this.generationManager.getCurrentZoneDensity(playerPosition)
                            }
                        );
                        
                        this._lastEnvironmentGeneration = performance.now();
                    }, 50); // Small delay to prioritize terrain generation
                }
                
                // 4c. Generate structures (lowest priority, least frequent updates)
                if (!this._lastStructureGeneration || now - this._lastStructureGeneration > 1500) {
                    setTimeout(() => {
                        // Use our dedicated area-based structure generation
                        const structGenRadius = Math.floor(effectiveDrawDistance * 0.3 * this.terrainManager.terrainChunkSize);
                        
                        // Generate structures in the area around the player
                        this.generateStructuresInArea(
                            playerPosition.x,
                            playerPosition.z,
                            structGenRadius,
                            {
                                density: this.generationManager.getCurrentZoneDensity(playerPosition)
                            }
                        );
                        
                        this._lastStructureGeneration = performance.now();
                    }, 100); // Larger delay to prioritize terrain and environment
                }
            }
            
            // 5. Update world systems (lighting, fog, etc.)
            // These are lightweight and can be updated every frame
            this.updateWorldSystems(playerPosition, effectiveDrawDistance);
        }
    }
    
    /**
     * Update terrain for player position
     * @private
     * @param {THREE.Vector3} playerPosition - Player position
     * @param {number} effectiveDrawDistance - Effective draw distance
     * @param {number} retentionDistanceMultiplier - Multiplier for retention distance (default: 2.0)
     */
    updateTerrainForPlayer(playerPosition, effectiveDrawDistance, retentionDistanceMultiplier = 2.0) {
        if (this.terrainManager) {
            // Use a try-catch to prevent errors from breaking the game loop
            try {
                this.terrainManager.updateForPlayer(playerPosition, effectiveDrawDistance, retentionDistanceMultiplier);
            } catch (error) {
                console.error("Error updating terrain:", error);
            }
        }
    }
    
    /**
     * Update environment objects for player position
     * @private
     * @param {THREE.Vector3} playerPosition - Player position
     * @param {number} effectiveDrawDistance - Effective draw distance
     */
    updateEnvironmentForPlayer(playerPosition, effectiveDrawDistance) {
        if (this.environmentManager) {
            // Use a try-catch to prevent errors from breaking the game loop
            try {
                // First, check if we have any preloaded objects to add to the scene
                this.addPreloadedObjectsToScene(playerPosition, effectiveDrawDistance);
                
                // Clear environment objects that are too far from the player
                const clearRadius = effectiveDrawDistance * 1.5 * this.terrainManager.terrainChunkSize;
                const visibleRadius = effectiveDrawDistance * this.terrainManager.terrainChunkSize;
                
                // Only clear objects outside the visible radius but within the clear radius
                // This creates a buffer zone to prevent objects from disappearing suddenly
                this.clearEnvironmentInArea(
                    playerPosition.x, 
                    playerPosition.z, 
                    clearRadius, 
                    visibleRadius
                );
                
                // Generate new environment objects in the visible area
                // This uses our dedicated method for area-based generation
                this.generateEnvironmentInArea(
                    playerPosition.x,
                    playerPosition.z,
                    visibleRadius,
                    {
                        density: this.generationManager.getCurrentZoneDensity(playerPosition)
                    }
                );
            } catch (error) {
                console.error("Error updating environment:", error);
            }
        }
    }
    
    /**
     * Add preloaded objects to the scene when they come within draw distance
     * @param {THREE.Vector3} playerPosition - Player position
     * @param {number} drawDistance - Draw distance
     */
    addPreloadedObjectsToScene(playerPosition, drawDistance) {
        // Skip if no player position
        if (!playerPosition) return;
        
        // Calculate chunk coordinates for the player
        const terrainChunkSize = this.terrainManager.terrainChunkSize;
        const playerChunkX = Math.floor(playerPosition.x / terrainChunkSize);
        const playerChunkZ = Math.floor(playerPosition.z / terrainChunkSize);
        
        // Calculate visible chunk range - add 1 to ensure we have a buffer
        const chunkDrawDistance = Math.ceil(drawDistance / terrainChunkSize) + 1;
        
        // Collect chunks that need to be added to the scene
        const chunksToAdd = [];
        
        // Check each buffered chunk
        for (const [chunkKey, buffer] of this.objectBuffer.entries()) {
            // Parse chunk coordinates from key
            const [chunkX, chunkZ] = chunkKey.split(',').map(Number);
            
            // Calculate distance to player in chunks
            const chunkDistance = Math.max(
                Math.abs(chunkX - playerChunkX),
                Math.abs(chunkZ - playerChunkZ)
            );
            
            // If chunk is within draw distance, add it to the list
            if (chunkDistance <= chunkDrawDistance) {
                chunksToAdd.push({ chunkKey, buffer, priority: chunkDistance });
            }
        }
        
        // Sort chunks by priority (closest first)
        chunksToAdd.sort((a, b) => a.priority - b.priority);
        
        // Process chunks in batches to avoid frame drops
        const processBatch = (startIdx, batchSize) => {
            const endIdx = Math.min(startIdx + batchSize, chunksToAdd.length);
            
            for (let i = startIdx; i < endIdx; i++) {
                const { chunkKey, buffer } = chunksToAdd[i];
                
                // Check if we have pre-created objects
                if (buffer.preCreatedObjects && buffer.preCreatedObjects.length > 0) {
                    // Add pre-created environment objects to the scene
                    for (const preCreated of buffer.preCreatedObjects) {
                        const objData = preCreated.data;
                        const object = preCreated.object;
                        
                        if (object) {
                            // Make the object visible
                            object.visible = true;
                            
                            // Add to scene if not already added
                            if (!object.parent) {
                                this.scene.add(object);
                            }
                            
                            // Add to environment objects tracking
                            this.environmentManager.environmentObjects.push({
                                type: objData.type,
                                object: object,
                                position: objData.position,
                                scale: objData.scale,
                                chunkKey: chunkKey
                            });
                            
                            // Add to type-specific collections
                            this.environmentManager.addToTypeCollection(objData.type, object);
                            
                            // Add to spatial grid for faster lookup
                            this.spatialGrid.addObject(object, objData.position);
                        }
                    }
                } else {
                    // Fallback to creating objects on the fly if pre-created objects are not available
                    // Add environment objects
                    for (const objData of buffer.environment) {
                        // Create the actual object and add to scene
                        if (this.environmentManager && objData.type) {
                            const object = this.environmentManager.createEnvironmentObject(
                                objData.type,
                                objData.position.x,
                                objData.position.z,
                                objData.scale
                            );
                            
                            if (object) {
                                // Set rotation if specified and object has rotation property
                                if (objData.rotation !== undefined && object.rotation) {
                                    object.rotation.y = objData.rotation;
                                }
                                
                                // Add to environment objects tracking
                                this.environmentManager.environmentObjects.push({
                                    type: objData.type,
                                    object: object,
                                    position: objData.position,
                                    scale: objData.scale,
                                    chunkKey: chunkKey
                                });
                                
                                // Add to type-specific collections
                                this.environmentManager.addToTypeCollection(objData.type, object);
                                
                                // Add to spatial grid for faster lookup
                                this.spatialGrid.addObject(object, objData.position);
                            }
                        }
                    }
                }
                
                // Add structures
                for (const structData of buffer.structures || []) {
                    // Create the actual structure and add to scene
                    if (this.structureManager && structData.type) {
                        let structure;
                        
                        // Create structure using the factory
                        let options = {};
                        let structureType = structData.type;
                        
                        // Convert legacy type names to constants if needed
                        if (structData.type === 'dark_sanctum') structureType = STRUCTURE_TYPES.DARK_SANCTUM;
                        
                        // Prepare options based on structure type
                        switch (structureType) {
                            case 'temple':
                            case STRUCTURE_TYPES.TEMPLE:
                                options = {
                                    width: 8 + Math.random() * 4,
                                    depth: 8 + Math.random() * 4,
                                    height: 6 + Math.random() * 3
                                };
                                structureType = STRUCTURE_TYPES.TEMPLE;
                                break;
                            case 'fortress':
                            case STRUCTURE_TYPES.FORTRESS:
                                options = {
                                    width: 10 + Math.random() * 5,
                                    depth: 10 + Math.random() * 5,
                                    height: 8 + Math.random() * 4
                                };
                                structureType = STRUCTURE_TYPES.FORTRESS;
                                break;
                        }
                        
                        // Create the structure using the factory
                        structure = this.structureManager.createStructure(
                            structureType,
                            structData.position.x,
                            structData.position.z,
                            options
                        );
                        
                        if (structure) {
                            // Set rotation if specified and structure has rotation property
                            if (structData.rotation !== undefined && structure.rotation) {
                                structure.rotation.y = structData.rotation;
                            }
                            
                            // Add to structures tracking
                            this.structureManager.structures.push({
                                type: structData.type,
                                object: structure,
                                position: structData.position,
                                chunkKey: chunkKey
                            });
                            
                            // Mark chunk as having structures
                            this.structureManager.structuresPlaced[chunkKey] = true;
                        }
                    }
                }
                
                // Remove from buffer after adding to scene
                this.objectBuffer.delete(chunkKey);
            }
            
            // If there are more chunks to process, schedule the next batch
            if (endIdx < chunksToAdd.length) {
                setTimeout(() => {
                    processBatch(endIdx, batchSize);
                }, 0);
            }
        };
        
        // Start processing the first batch (5 chunks at a time)
        if (chunksToAdd.length > 0) {
            processBatch(0, 5);
        }
    }
    
    /**
     * Update lighting and other systems
     * @param {THREE.Vector3} playerPosition - The player's position
     * @param {number} effectiveDrawDistance - The effective draw distance
     */
    updateWorldSystems(playerPosition, effectiveDrawDistance) {
        // Get delta time from game if available
        const deltaTime = this.game && this.game.clock ? this.game.clock.getDelta() : 0.016;
        this.lightingManager.update(deltaTime, playerPosition);
        
        // Check if player has moved far enough for screen-based enemy spawning
        const distanceMoved = playerPosition.distanceTo(this.lastPlayerPosition);
        if (distanceMoved >= this.screenSpawnDistance) {
            // Update last position
            this.lastPlayerPosition.copy(playerPosition);
            
            // Notify game that player has moved a screen distance (for enemy spawning)
            if (this.game && this.game.enemyManager) {
                this.game.enemyManager.onPlayerMovedScreenDistance(playerPosition);
            }
        }
        
        // Update fog using the FogManager
        if (this.fogManager) {
            // Update fog with player position and delta time
            this.fogManager.update(deltaTime, playerPosition);
        }
        
        // Update teleport portals
        if (this.teleportManager) {
            // Update teleport portals with player position and delta time
            this.teleportManager.update(deltaTime, playerPosition);
        }
        
        // Update LOD for objects based on camera position
        if (this.lodManager && playerPosition) {
            // Update LOD based on player position
            this.lodManager.update(playerPosition);
        }
        
        // Track frame rate for performance monitoring
        this.performanceManager.trackFrameRate();
        
        // Periodically check memory and performance
        this.manageMemoryAndPerformance();
    }
    
    /**
     * Manage memory and performance to prevent memory leaks and maintain frame rate
     * This method is called periodically to monitor and adjust performance settings
     */
    manageMemoryAndPerformance() {
        const currentTime = Date.now();
        
        // Periodically check memory usage
        if (currentTime - this.performanceManager.lastMemoryCheck > this.performanceManager.memoryCheckInterval) {
            this.performanceManager.lastMemoryCheck = currentTime;
            this.checkMemoryUsage();
        }
        
        // Periodically adjust performance settings
        if (currentTime - this.performanceManager.lastPerformanceAdjustment > this.performanceManager.performanceAdjustmentInterval) {
            this.performanceManager.lastPerformanceAdjustment = currentTime;
            this.performanceManager.adjustPerformanceSettings(
                (level) => this.setDensityLevel(level),
                () => this.terrainManager.clearDistantChunks(this.terrainManager.terrainChunkViewDistance)
            );
        }
        
        // Periodically hint for garbage collection
        if (currentTime - this.performanceManager.lastGarbageCollection > this.performanceManager.gcInterval) {
            this.performanceManager.lastGarbageCollection = currentTime;
            this.performanceManager.hintGarbageCollection();
        }
    }
    
    /**
     * Check memory usage and perform cleanup if necessary
     * @private
     */
    checkMemoryUsage() {
        // Only proceed if we have enough frame rate history
        if (this.performanceManager.frameRateHistory.length <= 10) return;
        
        // Calculate average FPS
        const avgFPS = this.performanceManager.calculateAverageFPS();
        
        // If FPS is consistently low, trigger cleanup
        if (avgFPS < 30) {
            console.debug(`Low FPS detected (${avgFPS.toFixed(1)}), performing cleanup`);
            
            // Calculate player's current chunk coordinates for cleanup
            if (this.game && this.game.player && this.game.player.position) {
                const playerPosition = this.game.player.position;
                const terrainChunkSize = this.terrainManager.terrainChunkSize;
                const playerChunkX = Math.floor(playerPosition.x / terrainChunkSize);
                const playerChunkZ = Math.floor(playerPosition.z / terrainChunkSize);
                
                // Use the enhanced batched cleanup method to avoid lag spikes
                this.memoryManager.cleanupDistantObjects(
                    playerChunkX, 
                    playerChunkZ, 
                    this.terrainManager.terrainChunkViewDistance + 5 // Increased view distance
                ).then(count => {
                    if (count > 0) {
                        console.debug(`Cleaned up ${count} distant objects without lag`);
                    }
                });
            }
        }
    }
    
    /**
     * Set environment density level
     * @param {string} level - Density level: 'high', 'medium', 'low', or 'minimal'
     */
    setDensityLevel(level) {
        const newDensity = this.performanceManager.setDensityLevel(level);
        
        // Update environment manager if available
        if (this.environmentManager && this.environmentManager.setDensity) {
            this.environmentManager.setDensity(newDensity);
        }
        
        return newDensity;
    }
    
    /**
     * Generate a special landmark structure for a new zone
     * @param {THREE.Vector3} playerPosition - The player's position
     * @param {string} zoneType - The zone type
     */
    generateZoneLandmark(playerPosition, zoneType) {
        // Only generate landmark with 70% probability (increased from 50% to add more landmarks)
        if (Math.random() < 0.3) return;
        
        // Calculate position for landmark (ahead of player in random direction)
        const angle = Math.random() * Math.PI * 2;
        const distance = 50 + Math.random() * 50; // 50-100 units away
        
        const landmarkX = playerPosition.x + Math.cos(angle) * distance;
        const landmarkZ = playerPosition.z + Math.sin(angle) * distance;
        
        // Choose landmark type based on zone using weighted selection from BIOME_LANDMARKS
        let landmarkType = LANDMARK_TYPES.RUINS; // Default fallback
        
        // Map the string zone type to our BIOMES constant
        let biomeKey = null;
        switch (zoneType) {
            case BIOMES.FOREST:
                biomeKey = BIOMES.FOREST;
                break;
            case BIOMES.DESERT:
                biomeKey = BIOMES.DESERT;
                break;
            case BIOMES.MOUNTAIN:
                biomeKey = BIOMES.MOUNTAIN;
                break;
            case BIOMES.SWAMP:
                biomeKey = BIOMES.SWAMP;
                break;
            case BIOMES.MAGICAL:
                biomeKey = BIOMES.MAGICAL;
                break;
            default:
                // If we don't recognize the zone type, use a random biome
                const biomeKeys = Object.keys(BIOMES);
                biomeKey = BIOMES[biomeKeys[Math.floor(Math.random() * biomeKeys.length)]];
        }
        
        // Get the landmark options for this biome
        const landmarkOptions = BIOME_LANDMARKS[biomeKey] || BIOME_LANDMARKS[BIOMES.FOREST];
        
        // Weighted random selection
        if (landmarkOptions && landmarkOptions.length > 0) {
            // Calculate total weight
            const totalWeight = landmarkOptions.reduce((sum, option) => sum + option.weight, 0);
            
            // Select a random value within the total weight range
            let random = Math.random() * totalWeight;
            
            // Find the selected option
            for (const option of landmarkOptions) {
                random -= option.weight;
                if (random <= 0) {
                    landmarkType = option.type;
                    break;
                }
            }
        }
        
        console.debug(`Generating zone landmark: ${landmarkType} at (${landmarkX.toFixed(1)}, ${landmarkZ.toFixed(1)})`);
        
        // Create the landmark
        let landmark = null;
        
        // Check if this is an environment object or a structure
        const isEnvironmentObject = Object.values(ENVIRONMENT_OBJECTS).includes(landmarkType);
        
        if (isEnvironmentObject) {
            // Create an environment object
            const scale = 2.0 + Math.random() * 2.0; // Scale between 2.0 and 4.0
            landmark = this.environmentManager.createEnvironmentObject(landmarkType, landmarkX, landmarkZ, scale);
            
            if (landmark) {
                // Add to environment objects tracking
                this.environmentManager.environmentObjects.push({
                    type: landmarkType,
                    object: landmark,
                    position: new THREE.Vector3(landmarkX, this.terrainManager.getTerrainHeight(landmarkX, landmarkZ), landmarkZ),
                    scale: scale,
                    chunkKey: `${Math.floor(landmarkX / this.terrainManager.terrainChunkSize)},${Math.floor(landmarkZ / this.terrainManager.terrainChunkSize)}`
                });
                
                // Add to type-specific collections
                this.environmentManager.addToTypeCollection(landmarkType, landmark);
            }
        } else {
            // Create a structure using the factory
            let options = {};
            let structureType = landmarkType;
            
            // Prepare options based on structure type
            switch (structureType) {
                case STRUCTURE_TYPES.TEMPLE:
                    options = {
                        width: 8 + Math.random() * 4,
                        depth: 8 + Math.random() * 4,
                        height: 6 + Math.random() * 3
                    };
                    break;
                case STRUCTURE_TYPES.FORTRESS:
                    options = {
                        width: 10 + Math.random() * 5,
                        depth: 10 + Math.random() * 5,
                        height: 8 + Math.random() * 4
                    };
                    break;
                case STRUCTURE_TYPES.VILLAGE:
                    options = {
                        width: 20 + Math.random() * 10,
                        depth: 20 + Math.random() * 10,
                        height: 4 + Math.random() * 2
                    };
                    break;
                case STRUCTURE_TYPES.MOUNTAIN:
                    options = {
                        width: 15 + Math.random() * 10,
                        depth: 15 + Math.random() * 10,
                        height: 12 + Math.random() * 8
                    };
                    break;
                case STRUCTURE_TYPES.DARK_SANCTUM:
                    options = {
                        width: 10 + Math.random() * 5,
                        depth: 10 + Math.random() * 5,
                        height: 6 + Math.random() * 3
                    };
                    break;
                case STRUCTURE_TYPES.ALTAR:
                    options = {
                        width: 5 + Math.random() * 2,
                        depth: 5 + Math.random() * 2,
                        height: 3 + Math.random() * 1
                    };
                    break;
                case STRUCTURE_TYPES.HOUSE:
                    options = {
                        width: 5 + Math.random() * 2,
                        depth: 5 + Math.random() * 2,
                        height: 3 + Math.random() * 1
                    };
                    break;
                case STRUCTURE_TYPES.TOWER:
                    options = {
                        width: 4 + Math.random() * 2,
                        depth: 4 + Math.random() * 2,
                        height: 8 + Math.random() * 4
                    };
                    break;
                case STRUCTURE_TYPES.RUINS:
                default:
                    options = {
                        width: 8 + Math.random() * 4,
                        depth: 8 + Math.random() * 4,
                        height: 4 + Math.random() * 2
                    };
                    structureType = STRUCTURE_TYPES.RUINS;
                    break;
            }
            
            // Create the structure using the factory
            landmark = this.structureManager.createStructure(
                structureType,
                landmarkX,
                landmarkZ,
                options
            );
            
            if (landmark) {
                // Add to structures tracking
                this.structureManager.structures.push({
                    type: structureType,
                    object: landmark,
                    position: new THREE.Vector3(landmarkX, this.terrainManager.getTerrainHeight(landmarkX, landmarkZ), landmarkZ),
                    chunkKey: `${Math.floor(landmarkX / this.terrainManager.terrainChunkSize)},${Math.floor(landmarkZ / this.terrainManager.terrainChunkSize)}`
                });
                
                // Mark chunk as having structures
                this.structureManager.structuresPlaced[`${Math.floor(landmarkX / this.terrainManager.terrainChunkSize)},${Math.floor(landmarkZ / this.terrainManager.terrainChunkSize)}`] = true;
            }
        }
    }
    
    /**
     * Get the terrain height at a specific world position
     * @param {number} x - X coordinate
     * @param {number} z - Z coordinate
     * @returns {number} - The height of the terrain at the specified position
     */
    getTerrainHeight(x, z) {
        return this.terrainManager.getTerrainHeight(x, z);
    }
    
    /**
     * Get the zone at a specific world position
     * @param {THREE.Vector3} position - The position to check
     * @returns {object|null} - The zone at the specified position, or null if none
     */
    getZoneAt(position) {
        return this.zoneManager.getZoneAt(position);
    }
    
    /**
     * Get interactive objects near a specific position
     * @param {THREE.Vector3} position - The position to check
     * @param {number} radius - The radius to check
     * @returns {Array} - Array of interactive objects within the radius
     */
    getInteractiveObjectsNear(position, radius) {
        return this.interactiveManager.getObjectsNear(position, radius);
    }
    
    /**
     * Clear all world objects for a clean reload
     */
    clearWorldObjects() {
        this.terrainManager.clear();
        this.structureManager.clear();
        this.environmentManager.clear();
        this.interactiveManager.clear();
        this.zoneManager.clear();
        this.teleportManager.clear();
        
        // Clear procedural generation tracking
        this.generationManager.generatedChunks.clear();
        this.generationManager.currentZoneType = 'Forest';
        
        // Clear cached data to prevent memory leaks
        this.terrainFeatures = [];
        this.trees = [];
        this.rocks = [];
        this.buildings = [];
        this.paths = [];
        
        // Clear spatial grid
        this.spatialGrid.clear();
        
        // Force garbage collection hint
        this.performanceManager.hintGarbageCollection();
        
        console.debug("World objects cleared for reload");
    }
    
    /**
     * Get current zone information for the player
     * @param {THREE.Vector3} playerPosition - Player's current position
     * @returns {object} - Zone information
     */
    getCurrentZoneInfo(playerPosition) {
        return this.generationManager.getCurrentZoneInfo(playerPosition);
    }
    
    /**
     * Get statistics about generated content
     * @returns {object} - Content statistics
     */
    getContentStats() {
        const baseStats = this.generationManager.getContentStats();
        
        return {
            ...baseStats,
            environmentObjects: this.environmentManager.environmentObjects.length,
            structures: this.structureManager.structures.length,
            trees: this.environmentManager.trees ? this.environmentManager.trees.length : 0,
            rocks: this.environmentManager.rocks ? this.environmentManager.rocks.length : 0,
            buildings: this.structureManager.structures ? 
                this.structureManager.structures.filter(s => s.type === 'house').length : 0
        };
    }
    
    /**
     * Save the current world state
     * @returns {object} - The saved world state
     */
    saveWorldState() {
        const worldState = {
            terrain: this.terrainManager.save(),
            structures: this.structureManager.save(),
            environment: this.environmentManager.save(),
            interactive: this.interactiveManager.save(),
            zones: this.zoneManager.save(),
            teleport: this.teleportManager.save ? this.teleportManager.save() : null,
            // Add procedural generation data
            procedural: {
                // We don't save generatedChunks anymore to force regeneration on load
                // This ensures content is generated around the player's position when loading
                currentZoneType: this.generationManager.currentZoneType
            },
            settings: {
                dynamicWorldEnabled: this.dynamicWorldEnabled,
                environmentDensity: this.performanceManager.getDensityLevel(),
                densityLevel: this.performanceManager.lastPerformanceLevel || 'medium',
                zoneSize: this.generationManager.zoneSize
            }
        };
        
        return worldState;
    }
    
    /**
     * Load a saved world state
     * @param {object} worldState - The world state to load
     */
    loadWorldState(worldState) {
        if (!worldState) return;
        
        this.savedData = worldState;
        
        // Clear existing world
        this.clearWorldObjects();
        
        // Load settings if available
        if (worldState.settings) {
            this.dynamicWorldEnabled = worldState.settings.dynamicWorldEnabled !== undefined ? 
                worldState.settings.dynamicWorldEnabled : this.dynamicWorldEnabled;
                
            // Handle environment density using our new level system
            if (worldState.settings.environmentDensity !== undefined) {
                // Find the closest density level
                const savedDensity = worldState.settings.environmentDensity;
                let closestLevel = 'medium';
                let minDiff = Math.abs(this.densityLevels.medium - savedDensity);
                
                for (const [level, value] of Object.entries(this.densityLevels)) {
                    const diff = Math.abs(value - savedDensity);
                    if (diff < minDiff) {
                        minDiff = diff;
                        closestLevel = level;
                    }
                }
                
                // Set the density level
                this.setDensityLevel(closestLevel);
                console.debug(`Loaded environment density mapped to level: ${closestLevel}`);
            }
                
            if (worldState.settings.zoneSize !== undefined) {
                this.generationManager.zoneSize = worldState.settings.zoneSize;
            }
        }
        
        // When loading from a saved position, we need to reset the generatedChunks
        // to ensure content is generated around the player's new position
        this.generationManager.generatedChunks.clear();
        
        // Load procedural generation data if available
        if (worldState.procedural) {
            // We intentionally don't restore generatedChunks from saved state
            // to force regeneration of content around the player's new position
            this.generationManager.currentZoneType = worldState.procedural.currentZoneType || 'Forest';
        }
        
        // Load saved state into each manager
        this.terrainManager.load(worldState.terrain);
        this.structureManager.load(worldState.structures);
        this.environmentManager.load(worldState.environment);
        this.interactiveManager.load(worldState.interactive);
        this.zoneManager.load(worldState.zones);
        
        // Load teleport data if available
        if (worldState.teleport && this.teleportManager.load) {
            this.teleportManager.load(worldState.teleport);
        }
        
        // Set initialTerrainCreated to true to ensure structures are generated
        this.generationManager.initialTerrainCreated = true;
        
        // Force world update on next frame to generate content around player's position
        if (this.game && this.game.player && this.game.player.position) {
            console.debug("Forcing world update for saved position:", this.game.player.position);
            setTimeout(() => {
                this.updateWorldForPlayer(this.game.player.position);
            }, 100);
        }
    }
    
    // Minimap-related methods
    
    /**
     * Get all entities in the world for the minimap
     * @returns {Array} - Array of entities
     */
    getEntities() {
        const entities = [];
        
        // Add enemies if available
        if (this.game && this.game.enemyManager) {
            // Convert Map to Array of values
            entities.push(...this.game.enemyManager.enemies.values());
        }
        
        // Add interactive objects if available
        if (this.interactiveManager && this.interactiveManager.objects) {
            entities.push(...this.interactiveManager.objects);
        }
        
        return entities;
    }
    
    /**
     * Get terrain features for the minimap
     * @returns {Array} - Array of terrain features
     */
    getTerrainFeatures() {
        // Collect terrain features from various sources
        this.terrainFeatures = [];
        
        // Add terrain features from terrain manager
        if (this.terrainManager && this.terrainManager.terrainMeshes) {
            // Add terrain boundaries as walls
            const terrainSize = this.terrainManager.terrainSize || 100;
            const halfSize = terrainSize / 2;
            
            // Add boundary walls
            for (let i = -halfSize; i <= halfSize; i += 5) {
                // North wall
                this.terrainFeatures.push({
                    type: 'wall',
                    position: { x: i, y: 0, z: -halfSize }
                });
                
                // South wall
                this.terrainFeatures.push({
                    type: 'wall',
                    position: { x: i, y: 0, z: halfSize }
                });
                
                // East wall
                this.terrainFeatures.push({
                    type: 'wall',
                    position: { x: halfSize, y: 0, z: i }
                });
                
                // West wall
                this.terrainFeatures.push({
                    type: 'wall',
                    position: { x: -halfSize, y: 0, z: i }
                });
            }
            
            // Add terrain elevation markers
            if (this.terrainManager.getTerrainHeight) {
                // Sample terrain heights at various points to create elevation markers
                const sampleDistance = 20; // Distance between sample points
                for (let x = -halfSize + 10; x < halfSize; x += sampleDistance) {
                    for (let z = -halfSize + 10; z < halfSize; z += sampleDistance) {
                        const height = this.terrainManager.getTerrainHeight(x, z);
                        if (height > 2) { // Only mark significant elevations
                            this.terrainFeatures.push({
                                type: 'elevation',
                                position: { x, y: height, z },
                                height: height
                            });
                        }
                    }
                }
            }
        }
        
        // Add structures as walls
        if (this.structureManager && this.structureManager.structures) {
            this.structureManager.structures.forEach(structure => {
                this.terrainFeatures.push({
                    type: 'wall',
                    position: structure.position,
                    structureType: structure.type || 'generic'
                });
            });
        }
        
        // Add environment objects
        if (this.environmentManager) {
            // Add trees
            if (this.environmentManager.trees) {
                this.environmentManager.trees.forEach(tree => {
                    this.terrainFeatures.push({
                        type: 'tree',
                        position: tree.position,
                        treeType: tree.type || 'generic',
                        height: tree.height || 5
                    });
                });
            }
            
            // Add rocks
            if (this.environmentManager.rocks) {
                this.environmentManager.rocks.forEach(rock => {
                    this.terrainFeatures.push({
                        type: 'rock',
                        position: rock.position,
                        rockType: rock.type || 'generic',
                        size: rock.size || 'medium'
                    });
                });
            }
            
            // Add water bodies
            if (this.environmentManager.waterBodies) {
                this.environmentManager.waterBodies.forEach(water => {
                    this.terrainFeatures.push({
                        type: 'water',
                        position: water.position,
                        waterType: water.type || 'generic',
                        depth: water.depth || 2,
                        radius: water.radius || 5
                    });
                });
            }
            
            // Add bushes
            if (this.environmentManager.bushes) {
                this.environmentManager.bushes.forEach(bush => {
                    this.terrainFeatures.push({
                        type: 'bush',
                        position: bush.position,
                        bushType: bush.type || 'generic'
                    });
                });
            }
            
            // Add flowers
            if (this.environmentManager.flowers) {
                this.environmentManager.flowers.forEach(flower => {
                    this.terrainFeatures.push({
                        type: 'flower',
                        position: flower.position,
                        flowerType: flower.type || 'generic'
                    });
                });
            }
            
            // Add tall grass
            if (this.environmentManager.tallGrass) {
                this.environmentManager.tallGrass.forEach(grass => {
                    this.terrainFeatures.push({
                        type: 'grass',
                        position: grass.position
                    });
                });
            }
            
            // Add ancient trees
            if (this.environmentManager.ancientTrees) {
                this.environmentManager.ancientTrees.forEach(tree => {
                    this.terrainFeatures.push({
                        type: 'ancient_tree',
                        position: tree.position,
                        height: tree.height || 15
                    });
                });
            }
            
            // Add small plants
            if (this.environmentManager.smallPlants) {
                this.environmentManager.smallPlants.forEach(plant => {
                    this.terrainFeatures.push({
                        type: 'plant',
                        position: plant.position,
                        plantType: plant.type || 'generic'
                    });
                });
            }
            
            // Add any special environment objects
            if (this.environmentManager.environmentObjects) {
                this.environmentManager.environmentObjects.forEach(obj => {
                    if (obj.userData && obj.userData.type) {
                        this.terrainFeatures.push({
                            type: obj.userData.type,
                            position: obj.position,
                            objectType: obj.userData.objectType || 'generic',
                            size: obj.userData.size || 'medium',
                            interactive: obj.userData.interactive || false
                        });
                    }
                });
            }
        }
        
        // Add zone-specific features
        if (this.zoneManager && this.zoneManager.zones) {
            this.zoneManager.zones.forEach(zone => {
                // Add zone boundaries
                if (zone.boundary) {
                    const boundary = zone.boundary;
                    const centerX = (boundary.minX + boundary.maxX) / 2;
                    const centerZ = (boundary.minZ + boundary.maxZ) / 2;
                    
                    this.terrainFeatures.push({
                        type: 'zone_center',
                        position: { x: centerX, y: 0, z: centerZ },
                        zoneName: zone.name,
                        zoneType: zone.type
                    });
                }
                
                // Add zone landmarks
                if (zone.landmarks) {
                    zone.landmarks.forEach(landmark => {
                        this.terrainFeatures.push({
                            type: 'landmark',
                            position: landmark.position,
                            landmarkType: landmark.type,
                            zoneName: zone.name
                        });
                    });
                }
            });
        }
        
        // Add teleport locations
        if (this.teleportManager && this.teleportManager.teleportLocations) {
            this.teleportManager.teleportLocations.forEach(teleport => {
                this.terrainFeatures.push({
                    type: 'teleport',
                    position: teleport.position,
                    destination: teleport.destination
                });
            });
        }
        
        // Add paths between structures if they exist
        if (this.paths) {
            this.paths.forEach(path => {
                if (path.points && path.points.length > 0) {
                    path.points.forEach(point => {
                        this.terrainFeatures.push({
                            type: 'path',
                            position: point,
                            pathType: path.type || 'dirt'
                        });
                    });
                }
            });
        }
        
        return this.terrainFeatures;
    }
    
    /**
     * Get vegetation objects for the minimap
     * @returns {Array} - Array of vegetation objects
     */
    getVegetation() {
        const vegetation = [];
        
        // Get all vegetation from environment manager using predefined categories
        if (this.environmentManager) {
            // Process trees
            if (this.environmentManager.trees) {
                this.environmentManager.trees.forEach(tree => {
                    vegetation.push({
                        position: tree.position,
                        type: tree.type || ENVIRONMENT_OBJECTS.TREE
                    });
                });
            }
            
            // Process bushes
            if (this.environmentManager.bushes) {
                this.environmentManager.bushes.forEach(bush => {
                    vegetation.push({
                        position: bush.position,
                        type: bush.type || ENVIRONMENT_OBJECTS.BUSH
                    });
                });
            }
            
            // Process flowers
            if (this.environmentManager.flowers) {
                this.environmentManager.flowers.forEach(flower => {
                    vegetation.push({
                        position: flower.position,
                        type: flower.type || ENVIRONMENT_OBJECTS.FLOWER
                    });
                });
            }
            
            // Process tall grass
            if (this.environmentManager.tallGrass) {
                this.environmentManager.tallGrass.forEach(grass => {
                    vegetation.push({
                        position: grass.position,
                        type: grass.type || ENVIRONMENT_OBJECTS.TALL_GRASS
                    });
                });
            }
            
            // Process other vegetation types if available
            if (this.environmentManager.environmentObjects) {
                this.environmentManager.environmentObjects.forEach(obj => {
                    // Check if object belongs to vegetation category
                    if (obj.type && ENVIRONMENT_CATEGORIES.VEGETATION.includes(obj.type)) {
                        vegetation.push({
                            position: obj.position,
                            type: obj.type
                        });
                    }
                });
            }
        }
        
        return vegetation;
    }
    
    /**
     * Get rock objects for the minimap
     * @returns {Array} - Array of rock objects
     */
    getRocks() {
        const rocks = [];
        
        // Get rocks from environment manager
        if (this.environmentManager) {
            // Process basic rocks
            if (this.environmentManager.rocks) {
                this.environmentManager.rocks.forEach(rock => {
                    rocks.push({
                        position: rock.position,
                        type: rock.type || ENVIRONMENT_OBJECTS.ROCK
                    });
                });
            }
            
            // Process all rock-type objects from environment objects
            if (this.environmentManager.environmentObjects) {
                this.environmentManager.environmentObjects.forEach(obj => {
                    // Check if object belongs to rocks category
                    if (obj.type && ENVIRONMENT_CATEGORIES.ROCKS.includes(obj.type)) {
                        rocks.push({
                            position: obj.position,
                            type: obj.type
                        });
                    }
                });
            }
        }
        
        return rocks;
    }
    
    /**
     * Get structure objects for the minimap
     * @returns {Array} - Array of structure objects
     */
    getStructures() {
        const structures = [];
        
        // Get structures from structure manager
        if (this.structureManager && this.structureManager.structures) {
            this.structureManager.structures.forEach(structure => {
                structures.push({
                    position: structure.position,
                    type: structure.type
                });
            });
        }
        
        return structures;
    }
    
    /**
     * Get buildings for the minimap (for backward compatibility)
     * @returns {Array} - Array of building structures
     */
    getBuildings() {
        // Define building types using constants
        const buildingTypes = [
            STRUCTURE_TYPES.HOUSE,
            STRUCTURE_TYPES.TAVERN,
            STRUCTURE_TYPES.SHOP,
            STRUCTURE_TYPES.TEMPLE,
            'building' // Keep for backward compatibility
        ];
        
        return this.getStructures().filter(structure => 
            buildingTypes.includes(structure.type)
        );
    }
    
    /**
     * Get trees for the minimap (for backward compatibility)
     * @returns {Array} - Array of tree objects
     */
    getTrees() {
        // Define tree types using constants
        const treeTypes = [
            ENVIRONMENT_OBJECTS.TREE,
            ENVIRONMENT_OBJECTS.PINE_TREE,
            ENVIRONMENT_OBJECTS.ANCIENT_TREE,
            ENVIRONMENT_OBJECTS.SWAMP_TREE,
            ENVIRONMENT_OBJECTS.TREE_CLUSTER
        ];
        
        return this.getVegetation().filter(obj => 
            treeTypes.includes(obj.type)
        );
    }
    
    /**
     * Get teleport portals for the minimap
     * @returns {Array} - Array of teleport portals
     */
    getTeleportPortals() {
        if (this.teleportManager && this.teleportManager.getPortals) {
            return this.teleportManager.getPortals();
        }
        return [];
    }
    
    /**
     * Preload objects in the direction of player movement
     * This prevents objects from suddenly appearing by preloading them
     * @param {THREE.Vector3} currentPosition - Current player position
     * @param {THREE.Vector3} previousPosition - Previous player position
     */
    preloadObjectsInDirection(currentPosition, previousPosition) {
        if (!currentPosition || !previousPosition) return;
        
        // Calculate movement direction
        const direction = new THREE.Vector3()
            .subVectors(currentPosition, previousPosition)
            .normalize();
            
        // Calculate target positions - one directly ahead and two at slight angles
        // This creates a wider preloading area to handle direction changes
        const targetPositions = [];
        
        // Main direction (directly ahead)
        targetPositions.push(new THREE.Vector3()
            .copy(currentPosition)
            .addScaledVector(direction, this.preloadDistance));
            
        // Slightly to the left (15 degrees)
        const leftDirection = direction.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 12);
        targetPositions.push(new THREE.Vector3()
            .copy(currentPosition)
            .addScaledVector(leftDirection, this.preloadDistance * 0.8));
            
        // Slightly to the right (15 degrees)
        const rightDirection = direction.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI / 12);
        targetPositions.push(new THREE.Vector3()
            .copy(currentPosition)
            .addScaledVector(rightDirection, this.preloadDistance * 0.8));
            
        // Also preload in a radius around the current position
        targetPositions.push(currentPosition.clone());
        
        // Track chunks to preload without duplicates
        const chunksToPreload = new Map(); // Map of chunkKey -> priority
        const terrainChunkSize = this.terrainManager.terrainChunkSize;
        
        // Process each target position
        targetPositions.forEach((targetPosition, index) => {
            // Calculate chunk coordinates for the target position
            const targetChunkX = Math.floor(targetPosition.x / terrainChunkSize);
            const targetChunkZ = Math.floor(targetPosition.z / terrainChunkSize);
            
            // Preload chunks in an area around the target position
            for (let x = targetChunkX - this.preloadRadius; x <= targetChunkX + this.preloadRadius; x++) {
                for (let z = targetChunkZ - this.preloadRadius; z <= targetChunkZ + this.preloadRadius; z++) {
                    const chunkKey = `${x},${z}`;
                    
                    // Skip if already preloaded
                    if (this.preloadedChunks.has(chunkKey)) continue;
                    
                    // Calculate priority based on distance from target and which target (main direction has higher priority)
                    const distanceFromTarget = Math.max(
                        Math.abs(x - targetChunkX),
                        Math.abs(z - targetChunkZ)
                    );
                    
                    // Lower index = higher priority (main direction is index 0)
                    const priority = index * 10 + distanceFromTarget;
                    
                    // Store the chunk with its priority (lower value = higher priority)
                    if (!chunksToPreload.has(chunkKey) || chunksToPreload.get(chunkKey) > priority) {
                        chunksToPreload.set(chunkKey, priority);
                    }
                }
            }
        });
        
        // Sort chunks by priority
        const sortedChunks = Array.from(chunksToPreload.entries())
            .sort((a, b) => a[1] - b[1]); // Sort by priority (ascending)
        
        // Preload chunks with staggered delays based on priority
        sortedChunks.forEach(([chunkKey, priority], index) => {
            // Mark as preloaded
            this.preloadedChunks.add(chunkKey);
            
            // Extract chunk coordinates
            const [x, z] = chunkKey.split(',').map(Number);
            
            // Use a small delay based on priority to avoid overwhelming the main thread
            // Higher priority chunks (lower priority value) get processed first
            const delay = Math.min(priority * 20, 500); // Cap at 500ms
            
            setTimeout(() => {
                this.preloadChunkContent(x, z);
            }, delay);
        });
    }
    
    /**
     * Preload content for a specific chunk
     * @param {number} chunkX - Chunk X coordinate
     * @param {number} chunkZ - Chunk Z coordinate
     */
    preloadChunkContent(chunkX, chunkZ) {
        try {
            // Calculate world coordinates for this chunk
            const worldX = chunkX * this.terrainManager.terrainChunkSize;
            const worldZ = chunkZ * this.terrainManager.terrainChunkSize;
            
            // Determine zone type for this chunk
            const zoneType = this.generationManager.getZoneTypeAt(worldX, worldZ);
            
            // Skip if zone type is undefined
            if (!zoneType) return;
            
            // Get zone density configuration
            const zoneDensity = this.zoneDensities[zoneType];
            
            // Skip if no zone density is provided
            if (!zoneDensity) return;
            
            // Create a buffer of objects for this chunk
            const chunkKey = `${chunkX},${chunkZ}`;
            
            // Skip if we already have a buffer for this chunk
            if (this.objectBuffer.has(chunkKey)) return;
            
            // Create a new buffer for this chunk
            const buffer = {
                environment: [],
                structures: []
            };
            
            // Preload environment objects (just create the data, don't add to scene yet)
            if (this.environmentManager && zoneDensity.environmentTypes) {
                // Use the same density as the actual generation to ensure consistency
                const density = zoneDensity.environment * 0.5; // Slightly higher than in generateChunkContent
                const chunkSize = this.terrainManager.terrainChunkSize;
                
                // Calculate number of objects to create
                const numObjects = Math.floor(density * chunkSize / 10);
                
                // Use deterministic seeding for consistent generation
                const seed = chunkX * 10000 + chunkZ;
                const random = this.seededRandom(seed);
                
                // Create environment object data
                for (let i = 0; i < numObjects; i++) {
                    // Deterministic position within chunk
                    const offsetX = random() * chunkSize;
                    const offsetZ = random() * chunkSize;
                    const x = worldX + offsetX;
                    const z = worldZ + offsetZ;
                    
                    // Deterministic object type from zone's environment types
                    const typeIndex = Math.floor(random() * zoneDensity.environmentTypes.length);
                    const objectType = zoneDensity.environmentTypes[typeIndex];
                    
                    // Deterministic scale
                    const scale = 0.8 + random() * 0.4;
                    
                    // Get terrain height at this position
                    const y = this.terrainManager.getTerrainHeight(x, z);
                    
                    // Add to buffer
                    buffer.environment.push({
                        type: objectType,
                        position: new THREE.Vector3(x, y, z),
                        scale: scale,
                        rotation: random() * Math.PI * 2 // Random rotation
                    });
                }
            }
            
            // Preload structures (just create the data, don't add to scene yet)
            if (this.structureManager && zoneDensity.structureTypes && zoneDensity.structureTypes.length > 0) {
                // Use deterministic seeding for consistent generation
                const seed = chunkX * 20000 + chunkZ;
                const random = this.seededRandom(seed);
                
                // Calculate probability of placing a structure in this chunk
                const baseProbability = 0.2; // Base probability of placing a structure
                const densityFactor = zoneDensity.structures || 0.2;
                const probability = baseProbability * densityFactor * this.mapManagerScale;
                
                // Determine if we should place a structure in this chunk
                if (random() < probability) {
                    const chunkSize = this.terrainManager.terrainChunkSize;
                    
                    // Choose a random position within the chunk
                    const offsetX = random() * chunkSize * 0.8 + chunkSize * 0.1; // Keep away from edges
                    const offsetZ = random() * chunkSize * 0.8 + chunkSize * 0.1; // Keep away from edges
                    const x = worldX + offsetX;
                    const z = worldZ + offsetZ;
                    
                    // Choose a random structure type for this zone
                    const typeIndex = Math.floor(random() * zoneDensity.structureTypes.length);
                    const type = zoneDensity.structureTypes[typeIndex];
                    
                    // Get terrain height at this position
                    const y = this.terrainManager.getTerrainHeight(x, z);
                    
                    // Add to buffer
                    buffer.structures.push({
                        type: type,
                        position: new THREE.Vector3(x, y, z),
                        rotation: random() * Math.PI * 2 // Random rotation
                    });
                }
            }
            
            // Store buffer for this chunk
            this.objectBuffer.set(chunkKey, buffer);
            
            // Pre-create actual objects in the background for faster display later
            // This is done asynchronously to avoid blocking the main thread
            setTimeout(() => {
                this.preCreateEnvironmentObjects(chunkKey, buffer);
            }, 0);
            
        } catch (error) {
            console.error(`Error preloading chunk content for chunk ${chunkX},${chunkZ}:`, error);
        }
    }
    
    /**
     * Pre-create environment objects for a chunk
     * @param {string} chunkKey - Chunk key
     * @param {object} buffer - Object buffer for this chunk
     */
    preCreateEnvironmentObjects(chunkKey, buffer) {
        try {
            // Skip if buffer is empty or already processed
            if (!buffer || !buffer.environment || buffer.environment.length === 0 || buffer.processed) {
                return;
            }
            
            // Validate chunk key format
            if (!chunkKey || typeof chunkKey !== 'string' || !chunkKey.includes(',')) {
                console.warn(`Invalid chunk key format: ${chunkKey}`);
                return;
            }
            
            // Mark buffer as processed to prevent duplicate processing
            buffer.processed = true;
            
            // Create actual THREE.js objects for environment objects
            const preCreatedObjects = [];
            
            // Process objects in batches to avoid blocking the main thread
            const batchSize = 5; // Process 5 objects at a time
            const totalObjects = buffer.environment.length;
            let processedCount = 0;
            
            const processBatch = () => {
                // Calculate end index for this batch
                const endIdx = Math.min(processedCount + batchSize, totalObjects);
                
                // Process this batch
                for (let i = processedCount; i < endIdx; i++) {
                    const objData = buffer.environment[i];
                    
                    // Validate object data before processing
                    if (!objData || !objData.position || typeof objData.position.x !== 'number' || typeof objData.position.z !== 'number') {
                        console.warn(`Invalid environment object data at index ${i} for chunk ${chunkKey}`, objData);
                        continue;
                    }
                    
                    // Create the actual object but don't add to scene yet
                    if (this.environmentManager && objData.type) {
                        const object = this.environmentManager.createEnvironmentObject(
                            objData.type,
                            objData.position.x,
                            objData.position.z,
                            objData.scale || 1.0,
                            true // offscreenCreation = true
                        );
                        
                        // Only process valid objects
                        if (object) {
                            // Store the created object with its data
                            preCreatedObjects.push({
                                data: objData,
                                object: object
                            });
                            
                            // Set rotation if specified and object exists with rotation property
                            if (object && objData.rotation !== undefined && object.rotation) {
                                object.rotation.y = objData.rotation;
                            }
                            
                            // Hide the object until it's added to the scene (only if object exists)
                            if (object) {
                                object.visible = false;
                            }
                            
                            // Apply LOD if available to improve performance and object exists
                            if (object && this.lodManager && this.lodManager.applyLODToObject) {
                                this.lodManager.applyLODToObject(object, objData.type);
                            }
                        }
                    }
                }
                
                // Update processed count
                processedCount = endIdx;
                
                // Store pre-created objects in the buffer after each batch
                buffer.preCreatedObjects = preCreatedObjects;
                
                // If there are more objects to process, schedule the next batch
                if (processedCount < totalObjects) {
                    setTimeout(processBatch, 0);
                }
            };
            
            // Start processing the first batch
            processBatch();
            
        } catch (error) {
            console.error(`Error pre-creating environment objects for chunk ${chunkKey}:`, error);
        }
    }
    
    /**
     * Seeded random number generator for deterministic generation
     * @param {number} seed - Seed value
     * @returns {function} - Random number generator function
     */
    seededRandom(seed) {
        return function() {
            seed = (seed * 9301 + 49297) % 233280;
            return seed / 233280;
        };
    }
    
    /**
     * Generate environment objects for a specific area
     * This method allows direct control over environment generation
     * @param {number} centerX - Center X coordinate in world space
     * @param {number} centerZ - Center Z coordinate in world space
     * @param {number} radius - Radius around center to generate environment (in world units)
     * @param {Object} options - Generation options
     * @param {number} options.density - Density multiplier (0.0 to 1.0)
     * @param {Array<string>} options.types - Specific environment types to generate
     * @returns {Promise<boolean>} - True if generation was successful
     */
    async generateEnvironmentInArea(centerX, centerZ, radius, options = {}) {
        console.debug(`Generating environment in area around (${centerX}, ${centerZ}) with radius ${radius}`);
        
        // Calculate chunk coordinates
        const chunkSize = this.terrainManager.terrainChunkSize;
        const startChunkX = Math.floor((centerX - radius) / chunkSize);
        const startChunkZ = Math.floor((centerZ - radius) / chunkSize);
        const endChunkX = Math.floor((centerX + radius) / chunkSize);
        const endChunkZ = Math.floor((centerZ + radius) / chunkSize);
        
        // Set density if provided
        if (options.density !== undefined && this.environmentManager.setDensity) {
            this.environmentManager.setDensity(options.density);
        }
        
        // Process each chunk in the area
        for (let x = startChunkX; x <= endChunkX; x++) {
            for (let z = startChunkZ; z <= endChunkZ; z++) {
                // Calculate chunk center
                const chunkCenterX = (x * chunkSize) + (chunkSize / 2);
                const chunkCenterZ = (z * chunkSize) + (chunkSize / 2);
                
                // Skip chunks outside the radius
                const distance = Math.sqrt(
                    Math.pow(chunkCenterX - centerX, 2) + 
                    Math.pow(chunkCenterZ - centerZ, 2)
                );
                
                if (distance <= radius) {
                    // Generate environment for this chunk
                    this.generationManager.generateEnvironmentForChunk(x, z);
                    
                    // Small delay to prevent freezing
                    await new Promise(resolve => setTimeout(resolve, 5));
                }
            }
        }
        
        // Reset density if it was changed
        if (options.density !== undefined && this.environmentManager.setDensity) {
            this.environmentManager.setDensity(this.environmentDensity);
        }
        
        return true;
    }
    
    /**
     * Generate structures for a specific area
     * This method allows direct control over structure generation
     * @param {number} centerX - Center X coordinate in world space
     * @param {number} centerZ - Center Z coordinate in world space
     * @param {number} radius - Radius around center to generate structures (in world units)
     * @param {Object} options - Generation options
     * @param {number} options.density - Density multiplier (0.0 to 1.0)
     * @param {Array<string>} options.types - Specific structure types to generate
     * @returns {Promise<boolean>} - True if generation was successful
     */
    async generateStructuresInArea(centerX, centerZ, radius, options = {}) {
        console.debug(`Generating structures in area around (${centerX}, ${centerZ}) with radius ${radius}`);
        
        // Calculate chunk coordinates
        const chunkSize = this.terrainManager.terrainChunkSize;
        const startChunkX = Math.floor((centerX - radius) / chunkSize);
        const startChunkZ = Math.floor((centerZ - radius) / chunkSize);
        const endChunkX = Math.floor((centerX + radius) / chunkSize);
        const endChunkZ = Math.floor((centerZ + radius) / chunkSize);
        
        // Process each chunk in the area
        for (let x = startChunkX; x <= endChunkX; x++) {
            for (let z = startChunkZ; z <= endChunkZ; z++) {
                // Calculate chunk center
                const chunkCenterX = (x * chunkSize) + (chunkSize / 2);
                const chunkCenterZ = (z * chunkSize) + (chunkSize / 2);
                
                // Skip chunks outside the radius
                const distance = Math.sqrt(
                    Math.pow(chunkCenterX - centerX, 2) + 
                    Math.pow(chunkCenterZ - centerZ, 2)
                );
                
                if (distance <= radius) {
                    // Generate structures for this chunk
                    this.generationManager.generateStructuresForChunk(x, z);
                    
                    // Small delay to prevent freezing
                    await new Promise(resolve => setTimeout(resolve, 10));
                }
            }
        }
        
        return true;
    }
    
    /**
     * Clear environment objects in a specific area
     * @param {number} centerX - Center X coordinate in world space
     * @param {number} centerZ - Center Z coordinate in world space
     * @param {number} outerRadius - Outer radius around center to clear (in world units)
     * @param {number} innerRadius - Optional inner radius to preserve (in world units)
     * @returns {number} - Number of objects cleared
     */
    clearEnvironmentInArea(centerX, centerZ, outerRadius, innerRadius = 0) {
        console.debug(`Clearing environment in area around (${centerX}, ${centerZ}) with outer radius ${outerRadius}, inner radius ${innerRadius}`);
        
        let clearedCount = 0;
        
        // Filter environment objects to keep only those outside the radius
        if (this.environmentManager && this.environmentManager.environmentObjects) {
            const objectsToRemove = [];
            
            // Find objects within the outer radius but outside the inner radius
            this.environmentManager.environmentObjects.forEach(objInfo => {
                if (objInfo && objInfo.position) {
                    const distance = Math.sqrt(
                        Math.pow(objInfo.position.x - centerX, 2) + 
                        Math.pow(objInfo.position.z - centerZ, 2)
                    );
                    
                    // Only remove objects that are outside the inner radius but inside the outer radius
                    if (distance > innerRadius && distance <= outerRadius) {
                        objectsToRemove.push(objInfo);
                    }
                }
            });
            
            // Remove objects from the scene
            objectsToRemove.forEach(objInfo => {
                if (objInfo.object && objInfo.object.parent) {
                    objInfo.object.parent.remove(objInfo.object);
                    clearedCount++;
                }
            });
            
            // Update the environment objects array
            this.environmentManager.environmentObjects = this.environmentManager.environmentObjects.filter(objInfo => {
                if (objInfo && objInfo.position) {
                    const distance = Math.sqrt(
                        Math.pow(objInfo.position.x - centerX, 2) + 
                        Math.pow(objInfo.position.z - centerZ, 2)
                    );
                    
                    return distance > outerRadius;
                }
                return true;
            });
            
            // Clear chunk tracking for chunks in this area
            const chunkSize = this.terrainManager.terrainChunkSize;
            const startChunkX = Math.floor((centerX - radius) / chunkSize);
            const startChunkZ = Math.floor((centerZ - radius) / chunkSize);
            const endChunkX = Math.floor((centerX + radius) / chunkSize);
            const endChunkZ = Math.floor((centerZ + radius) / chunkSize);
            
            for (let x = startChunkX; x <= endChunkX; x++) {
                for (let z = startChunkZ; z <= endChunkZ; z++) {
                    const chunkKey = `${x},${z}`;
                    if (this.environmentManager.environmentObjectsByChunk[chunkKey]) {
                        delete this.environmentManager.environmentObjectsByChunk[chunkKey];
                    }
                }
            }
        }
        
        return clearedCount;
    }
    
    /**
     * Clear structures in a specific area
     * @param {number} centerX - Center X coordinate in world space
     * @param {number} centerZ - Center Z coordinate in world space
     * @param {number} radius - Radius around center to clear (in world units)
     * @returns {number} - Number of structures cleared
     */
    clearStructuresInArea(centerX, centerZ, radius) {
        console.debug(`Clearing structures in area around (${centerX}, ${centerZ}) with radius ${radius}`);
        
        let clearedCount = 0;
        
        // Filter structures to keep only those outside the radius
        if (this.structureManager && this.structureManager.structures) {
            const structuresToRemove = [];
            
            // Find structures within the radius
            this.structureManager.structures.forEach(structure => {
                if (structure && structure.position) {
                    const distance = Math.sqrt(
                        Math.pow(structure.position.x - centerX, 2) + 
                        Math.pow(structure.position.z - centerZ, 2)
                    );
                    
                    if (distance <= radius) {
                        structuresToRemove.push(structure);
                    }
                }
            });
            
            // Remove structures from the scene
            structuresToRemove.forEach(structure => {
                if (structure.mesh && structure.mesh.parent) {
                    structure.mesh.parent.remove(structure.mesh);
                    clearedCount++;
                }
            });
            
            // Update the structures array
            this.structureManager.structures = this.structureManager.structures.filter(structure => {
                if (structure && structure.position) {
                    const distance = Math.sqrt(
                        Math.pow(structure.position.x - centerX, 2) + 
                        Math.pow(structure.position.z - centerZ, 2)
                    );
                    
                    return distance > radius;
                }
                return true;
            });
            
            // Clear chunk tracking for chunks in this area
            const chunkSize = this.terrainManager.terrainChunkSize;
            const startChunkX = Math.floor((centerX - radius) / chunkSize);
            const startChunkZ = Math.floor((centerZ - radius) / chunkSize);
            const endChunkX = Math.floor((centerX + radius) / chunkSize);
            const endChunkZ = Math.floor((centerZ + radius) / chunkSize);
            
            for (let x = startChunkX; x <= endChunkX; x++) {
                for (let z = startChunkZ; z <= endChunkZ; z++) {
                    const chunkKey = `${x},${z}`;
                    if (this.structureManager.structuresPlaced[chunkKey]) {
                        delete this.structureManager.structuresPlaced[chunkKey];
                    }
                }
            }
        }
        
        return clearedCount;
    }
}