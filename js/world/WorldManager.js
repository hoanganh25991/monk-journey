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
import { ENVIRONMENT_OBJECTS, THEME_SPECIFIC_OBJECTS, CROSS_THEME_FEATURES } from '../config/environment.js';
import { STRUCTURE_OBJECTS } from '../config/structure.js';
import ZONE_TYPES from '../config/zone.js';

// Import new modular managers
import { PerformanceManager } from './managers/PerformanceManager.js';
import { MemoryManager } from './managers/MemoryManager.js';
import { GenerationManager } from './generation/GenerationManager.js';
import { SpatialGrid } from './utils/SpatialGrid.js';

/**
 * Main World Manager class that coordinates all world-related systems
 * Optimized for performance with object pooling, throttling, and spatial partitioning
 * Refactored to use modular managers for better maintainability
 */
export class WorldManager {
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
        this.worldScale = 1.0; // Scale factor to make objects appear farther apart
        
        // Zone definitions and densities
        this.zoneDensities = {
            [ZONE_TYPES.FOREST]: { 
                environment: 1.5, // Reduced from 2.5
                structures: 0.25, // Reduced from 0.4
                environmentTypes: [
                    ENVIRONMENT_OBJECTS.TREE,
                    ENVIRONMENT_OBJECTS.BUSH,
                    ENVIRONMENT_OBJECTS.FLOWER,
                    ENVIRONMENT_OBJECTS.TALL_GRASS,
                    ENVIRONMENT_OBJECTS.FERN,
                    ENVIRONMENT_OBJECTS.BERRY_BUSH,
                    ENVIRONMENT_OBJECTS.ANCIENT_TREE,
                    ENVIRONMENT_OBJECTS.MUSHROOM,
                    ENVIRONMENT_OBJECTS.FALLEN_LOG,
                    ENVIRONMENT_OBJECTS.TREE_CLUSTER,
                    ENVIRONMENT_OBJECTS.FOREST_FLOWER,
                    ENVIRONMENT_OBJECTS.FOREST_DEBRIS,
                    ENVIRONMENT_OBJECTS.SMALL_MUSHROOM
                ],
                structureTypes: ['ruins', 'village', 'house', 'tower', 'temple', 'altar']
            },
            [ZONE_TYPES.DESERT]: { 
                environment: 1.0, // Reduced from 1.8
                structures: 0.2, // Reduced from 0.35
                environmentTypes: [
                    ENVIRONMENT_OBJECTS.DESERT_PLANT,
                    ENVIRONMENT_OBJECTS.OASIS,
                    ENVIRONMENT_OBJECTS.DESERT_SHRINE,
                    ENVIRONMENT_OBJECTS.ASH_PILE,
                    ENVIRONMENT_OBJECTS.ROCK,
                    ENVIRONMENT_OBJECTS.ROCK_FORMATION,
                    ENVIRONMENT_OBJECTS.SMALL_PEAK,
                    ENVIRONMENT_OBJECTS.LAVA_ROCK,
                    ENVIRONMENT_OBJECTS.OBSIDIAN
                ],
                structureTypes: ['ruins', 'temple', 'altar', 'house', 'tower']
            },
            [ZONE_TYPES.MOUNTAIN]: { 
                environment: 1.2, // Reduced from 2.0
                structures: 0.18, // Reduced from 0.3
                environmentTypes: [
                    ENVIRONMENT_OBJECTS.PINE_TREE,
                    ENVIRONMENT_OBJECTS.MOUNTAIN_ROCK,
                    ENVIRONMENT_OBJECTS.ICE_SHARD,
                    ENVIRONMENT_OBJECTS.ALPINE_FLOWER,
                    ENVIRONMENT_OBJECTS.SMALL_PEAK,
                    ENVIRONMENT_OBJECTS.SNOW_PATCH,
                    ENVIRONMENT_OBJECTS.ROCK,
                    ENVIRONMENT_OBJECTS.ROCK_FORMATION,
                    ENVIRONMENT_OBJECTS.TREE
                ],
                structureTypes: ['ruins', 'fortress', 'tower', 'mountain', 'house', 'altar']
            },
            [ZONE_TYPES.SWAMP]: { 
                environment: 1.8, // Reduced from 3.0
                structures: 0.25, // Reduced from 0.4
                environmentTypes: [
                    ENVIRONMENT_OBJECTS.SWAMP_TREE,
                    ENVIRONMENT_OBJECTS.LILY_PAD,
                    ENVIRONMENT_OBJECTS.SWAMP_PLANT,
                    ENVIRONMENT_OBJECTS.GLOWING_MUSHROOM,
                    ENVIRONMENT_OBJECTS.MOSS,
                    ENVIRONMENT_OBJECTS.SWAMP_DEBRIS,
                    ENVIRONMENT_OBJECTS.TREE,
                    ENVIRONMENT_OBJECTS.BUSH,
                    ENVIRONMENT_OBJECTS.FALLEN_LOG,
                    ENVIRONMENT_OBJECTS.MUSHROOM
                ],
                structureTypes: ['ruins', 'dark_sanctum', 'altar', 'house', 'tower']
            },
            [ZONE_TYPES.MAGICAL]: { 
                environment: 1.5, // Reduced from 2.5
                structures: 0.25, // Reduced from 0.45
                environmentTypes: [
                    ENVIRONMENT_OBJECTS.GLOWING_FLOWERS,
                    ENVIRONMENT_OBJECTS.CRYSTAL_FORMATION,
                    ENVIRONMENT_OBJECTS.FAIRY_CIRCLE,
                    ENVIRONMENT_OBJECTS.MAGICAL_STONE,
                    ENVIRONMENT_OBJECTS.ANCIENT_ARTIFACT,
                    ENVIRONMENT_OBJECTS.MYSTERIOUS_PORTAL,
                    ENVIRONMENT_OBJECTS.ANCIENT_TREE,
                    ENVIRONMENT_OBJECTS.GLOWING_MUSHROOM,
                    ENVIRONMENT_OBJECTS.RUNE_STONE,
                    ENVIRONMENT_OBJECTS.MAGIC_CIRCLE
                ],
                structureTypes: ['ruins', 'temple', 'altar', 'tower', 'dark_sanctum']
            }
        };
        
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
            
            // Use a promise-based approach with setTimeout to prevent UI freezing
            await this.generateInitialChunksProgressively(startChunkX, startChunkZ, initialGenDistance);
            
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
     * @param {number} startChunkX - Starting chunk X coordinate
     * @param {number} startChunkZ - Starting chunk Z coordinate
     * @param {number} distance - Distance from center to generate
     * @returns {Promise<void>}
     */
    async generateInitialChunksProgressively(startChunkX, startChunkZ, distance) {
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
                this.generationManager.generateChunkContent(chunk.x, chunk.z);
                
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
            this.updateTerrainForPlayer(playerPosition, effectiveDrawDistance);
            
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
            
            // 4. Generate procedural content (can be throttled most aggressively)
            // Only generate content if we're not already processing chunks
            if (!this.generationManager.processingChunk && 
                (!this._lastContentGeneration || now - this._lastContentGeneration > 500)) {
                // Use requestAnimationFrame to defer content generation to next frame
                requestAnimationFrame(() => {
                    this.generationManager.generateProceduralContent(
                        playerChunkX, 
                        playerChunkZ, 
                        playerPosition, 
                        Math.floor(effectiveDrawDistance * 0.5), // Reduce generation distance
                        this.performanceManager.isLowPerformanceMode()
                    );
                    this._lastContentGeneration = performance.now();
                });
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
     */
    updateTerrainForPlayer(playerPosition, effectiveDrawDistance) {
        if (this.terrainManager) {
            // Use a try-catch to prevent errors from breaking the game loop
            try {
                this.terrainManager.updateForPlayer(playerPosition, effectiveDrawDistance);
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
        if (this.environmentManager && this.environmentManager.updateForPlayer) {
            // Use a try-catch to prevent errors from breaking the game loop
            try {
                // First, check if we have any preloaded objects to add to the scene
                this.addPreloadedObjectsToScene(playerPosition, effectiveDrawDistance);
                
                // Then update environment as usual
                this.environmentManager.updateForPlayer(playerPosition, effectiveDrawDistance);
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
                                // Set rotation if specified
                                if (objData.rotation !== undefined) {
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
                        
                        // Create structure based on type
                        switch (structData.type) {
                            case 'village':
                                structure = this.structureManager.structureFactory.createStructure(
                                    STRUCTURE_OBJECTS.VILLAGE, 
                                    { x: structData.position.x, z: structData.position.z }
                                );
                                break;
                            case 'temple':
                                structure = this.structureManager.createBuilding(
                                    structData.position.x, 
                                    structData.position.z, 
                                    8 + Math.random() * 4, // width
                                    8 + Math.random() * 4, // depth
                                    6 + Math.random() * 3, // height
                                    'temple'
                                );
                                break;
                            case 'fortress':
                                structure = this.structureManager.createBuilding(
                                    structData.position.x, 
                                    structData.position.z, 
                                    10 + Math.random() * 5, // width
                                    10 + Math.random() * 5, // depth
                                    8 + Math.random() * 4, // height
                                    'fortress'
                                );
                                break;
                            case 'mountain':
                                structure = this.structureManager.structureFactory.createStructure(
                                    STRUCTURE_OBJECTS.MOUNTAIN, 
                                    { x: structData.position.x, z: structData.position.z }
                                );
                                break;
                            case 'dark_sanctum':
                                structure = this.structureManager.structureFactory.createStructure(
                                    STRUCTURE_OBJECTS.DARK_SANCTUM, 
                                    { x: structData.position.x, z: structData.position.z }
                                );
                                break;
                            case 'ruins':
                            default:
                                structure = this.structureManager.structureFactory.createStructure(
                                    STRUCTURE_OBJECTS.RUINS, 
                                    { x: structData.position.x, z: structData.position.z }
                                );
                                break;
                        }
                        
                        if (structure) {
                            // Set rotation if specified
                            if (structData.rotation !== undefined) {
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
        // Only generate landmark with 50% probability
        if (Math.random() < 0.5) return;
        
        // Calculate position for landmark (ahead of player in random direction)
        const angle = Math.random() * Math.PI * 2;
        const distance = 50 + Math.random() * 50; // 50-100 units away
        
        const landmarkX = playerPosition.x + Math.cos(angle) * distance;
        const landmarkZ = playerPosition.z + Math.sin(angle) * distance;
        
        // Choose landmark type based on zone
        let landmarkType = 'ruins'; // Default
        
        switch (zoneType) {
            case ZONE_TYPES.FOREST:
                landmarkType = Math.random() < 0.5 ? 'ancient_tree' : 'village';
                break;
            case ZONE_TYPES.DESERT:
                landmarkType = Math.random() < 0.5 ? 'temple' : 'oasis';
                break;
            case 'Mountain':
                landmarkType = Math.random() < 0.5 ? 'fortress' : 'mountain';
                break;
            case 'Swamp':
                landmarkType = Math.random() < 0.5 ? 'dark_sanctum' : 'ruins';
                break;
            case 'Magical':
                landmarkType = Math.random() < 0.5 ? 'mysterious_portal' : 'temple';
                break;
        }
        
        console.debug(`Generating zone landmark: ${landmarkType} at (${landmarkX.toFixed(1)}, ${landmarkZ.toFixed(1)})`);
        
        // Create the landmark
        let landmark = null;
        
        if (landmarkType === 'ancient_tree') {
            // Create a massive ancient tree
            const scale = 3.0 + Math.random() * 2.0;
            landmark = this.environmentManager.createEnvironmentObject('ancient_tree', landmarkX, landmarkZ, scale);
            
            if (landmark) {
                // Add to environment objects tracking
                this.environmentManager.environmentObjects.push({
                    type: 'ancient_tree',
                    object: landmark,
                    position: new THREE.Vector3(landmarkX, this.terrainManager.getTerrainHeight(landmarkX, landmarkZ), landmarkZ),
                    scale: scale,
                    chunkKey: `${Math.floor(landmarkX / this.terrainManager.terrainChunkSize)},${Math.floor(landmarkZ / this.terrainManager.terrainChunkSize)}`
                });
                
                // Add to type-specific collections
                this.environmentManager.addToTypeCollection('ancient_tree', landmark);
            }
        } else if (landmarkType === 'oasis') {
            // Create an oasis
            landmark = this.environmentManager.createEnvironmentObject('oasis', landmarkX, landmarkZ, 2.0);
            
            if (landmark) {
                // Add to environment objects tracking
                this.environmentManager.environmentObjects.push({
                    type: 'oasis',
                    object: landmark,
                    position: new THREE.Vector3(landmarkX, this.terrainManager.getTerrainHeight(landmarkX, landmarkZ), landmarkZ),
                    scale: 2.0,
                    chunkKey: `${Math.floor(landmarkX / this.terrainManager.terrainChunkSize)},${Math.floor(landmarkZ / this.terrainManager.terrainChunkSize)}`
                });
                
                // Add to type-specific collections
                this.environmentManager.addToTypeCollection('oasis', landmark);
            }
        } else if (landmarkType === 'mysterious_portal') {
            // Create a mysterious portal
            landmark = this.environmentManager.createEnvironmentObject('mysterious_portal', landmarkX, landmarkZ, 1.5);
            
            if (landmark) {
                // Add to environment objects tracking
                this.environmentManager.environmentObjects.push({
                    type: 'mysterious_portal',
                    object: landmark,
                    position: new THREE.Vector3(landmarkX, this.terrainManager.getTerrainHeight(landmarkX, landmarkZ), landmarkZ),
                    scale: 1.5,
                    chunkKey: `${Math.floor(landmarkX / this.terrainManager.terrainChunkSize)},${Math.floor(landmarkZ / this.terrainManager.terrainChunkSize)}`
                });
                
                // Add to type-specific collections
                this.environmentManager.addToTypeCollection('mysterious_portal', landmark);
            }
        } else {
            // Create a structure
            switch (landmarkType) {
                case 'village':
                    landmark = this.structureManager.structureFactory.createStructure(
                        STRUCTURE_OBJECTS.VILLAGE, 
                        { x: landmarkX, z: landmarkZ }
                    );
                    break;
                case 'temple':
                    const tWidth = 8 + Math.random() * 4;
                    const tDepth = 8 + Math.random() * 4;
                    const tHeight = 6 + Math.random() * 3;
                    landmark = this.structureManager.createBuilding(landmarkX, landmarkZ, tWidth, tDepth, tHeight, 'temple');
                    break;
                case 'fortress':
                    const fWidth = 10 + Math.random() * 5;
                    const fDepth = 10 + Math.random() * 5;
                    const fHeight = 8 + Math.random() * 4;
                    landmark = this.structureManager.createBuilding(landmarkX, landmarkZ, fWidth, fDepth, fHeight, 'fortress');
                    break;
                case 'mountain':
                    landmark = this.structureManager.structureFactory.createStructure(
                        STRUCTURE_OBJECTS.MOUNTAIN, 
                        { x: landmarkX, z: landmarkZ }
                    );
                    break;
                case 'dark_sanctum':
                    landmark = this.structureManager.structureFactory.createStructure(
                        STRUCTURE_OBJECTS.DARK_SANCTUM, 
                        { x: landmarkX, z: landmarkZ }
                    );
                    break;
                case 'ruins':
                default:
                    landmark = this.structureManager.structureFactory.createStructure(
                        STRUCTURE_OBJECTS.RUINS, 
                        { x: landmarkX, z: landmarkZ }
                    );
                    break;
            }
            
            if (landmark) {
                // Add to structures tracking
                this.structureManager.structures.push({
                    type: landmarkType,
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
                const probability = baseProbability * densityFactor * this.worldScale;
                
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
                            
                            // Set rotation if specified and object exists
                            if (object && objData.rotation !== undefined) {
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
}