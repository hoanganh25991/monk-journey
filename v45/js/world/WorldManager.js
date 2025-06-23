import * as THREE from 'three';
import { TerrainManager } from './terrain/TerrainManager.js';
import { StructureManager } from './structures/StructureManager.js';
import { EnvironmentManager } from './environment/EnvironmentManager.js';
import { InteractiveObjectManager } from './interactive/InteractiveObjectManager.js';
import { ZoneManager } from './zones/ZoneManager.js';
import { LightingManager } from './lighting/LightingManager.js';
import { FogManager } from './environment/FogManager.js';
import { SkyManager } from './environment/SkyManager.js';
import { TeleportManager } from './teleport/TeleportManager.js';

/**
 * Main World Manager class that coordinates all world-related systems
 * Now using a fully randomized approach for all world elements
 */
export class WorldManager {
    constructor(scene, loadingManager, game) {
        this.scene = scene;
        this.loadingManager = loadingManager;
        this.game = game;
        
        // Terrain caching system
        this.terrainCache = {
            chunks: {},
            structures: {},
            environment: {},
            preGenerated: false,
            chunkSize: 100, // Size of each terrain chunk in world units
            maxCachedChunks: 100, // Maximum number of chunks to keep in memory
            saveToLocalStorage: true, // Whether to save terrain to localStorage
            localStorageKey: 'monk_journey_terrain_cache'
        };
        
        // Initialize managers
        this.lightingManager = new LightingManager(scene);
        this.skyManager = new SkyManager(scene);
        this.fogManager = new FogManager(scene, this, game);
        this.terrainManager = new TerrainManager(scene, this, game);
        this.structureManager = new StructureManager(scene, this, game);
        this.environmentManager = new EnvironmentManager(scene, this, game);
        this.interactiveManager = new InteractiveObjectManager(scene, this, game);
        this.zoneManager = new ZoneManager(scene, this, game);
        
        // Load cached terrain data if available
        this.loadTerrainCache();
        this.teleportManager = new TeleportManager(scene, this, game);
        
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
        
        // Memory management
        this.lastMemoryCheck = Date.now();
        this.memoryCheckInterval = 10000; // Check every 10 seconds
        this.lastGarbageCollection = Date.now();
        this.gcInterval = 30000; // Force GC hint every 30 seconds
        
        // Performance monitoring
        this.frameRateHistory = [];
        this.frameRateHistoryMaxLength = 60; // Track last 60 frames
        this.lastPerformanceAdjustment = Date.now();
        this.performanceAdjustmentInterval = 5000; // Adjust every 5 seconds
        this.lowPerformanceMode = false;
        
        // Random world generation settings
        this.randomGenerationEnabled = false;
        this.randomGenerationBuffer = 100; // Reduced buffer distance from 150 to 100 to prevent buffering too far
        this.randomGenerationInterval = 800; // Milliseconds between generation attempts (increased for better stability)
        this.lastRandomGenerationTime = 0;
        this.randomGenerationProbability = {
            structure: 0.04,  // 4% chance to generate a structure (reduced by 5x for performance)
            environment: 0.1, // 10% chance to generate environment objects (reduced by 5x for performance)
            interactive: 0.02 // 2% chance to generate interactive objects (reduced by 5x for performance)
        };
        
        // Path generation settings
        this.pathGenerationEnabled = true;
        this.pathWidth = 3;
        this.pathSegmentLength = 10;
        this.pathCurve = 0.2; // How much the path can curve
        this.pathNodes = []; // Track path nodes for connecting structures
        this.paths = []; // Array to store path meshes
        
        // Enhanced environment settings
        this.enhancedTreeDensity = 0.5; // Multiplier for tree density along paths (reduced by 5x for performance)
        
        // Chunk tracking for consistent loading/unloading
        this.activeChunks = {}; // Track which chunks are currently active
        this.chunkObjectCounts = {}; // Track how many objects are in each chunk
        this.chunkLoadRadius = 2; // How many chunks to load in each direction from player
        this.enhancedMountainDensity = 1.8; // Multiplier for mountain density in the distance
        
        // Track player movement for predictive generation
        this.playerMovementHistory = [];
        this.playerMovementHistoryMaxLength = 15; // Increased from 10 for better prediction
        this.playerMovementDirection = new THREE.Vector3(0, 0, 0);
        this.lastPathGenerationPosition = new THREE.Vector3(0, 0, 0);
        this.pathGenerationDistance = 30; // Distance between path segments
    }
    
    // setGame method removed - game is now passed in constructor
    
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
        
        // Initialize terrain
        await this.terrainManager.init();
        
        // Initialize structures
        this.structureManager.init();
        
        // Initialize zones
        this.zoneManager.init();
        
        // Initialize interactive objects
        this.interactiveManager.init();
        
        // Initialize teleport portals
        this.teleportManager.init();
        
        // Pre-generate terrain if not already cached
        if (!this.terrainCache.preGenerated) {
            await this.preGenerateTerrain();
        } else {
            console.log("Using cached terrain data");
        }
        
        console.debug("World initialization complete");
        return true;
    }
    
    /**
     * Pre-generate terrain in a large area around the starting point
     * @returns {Promise} - Resolves when terrain generation is complete
     */
    async preGenerateTerrain() {
        console.log("Pre-generating terrain and cleaning up duplicate structures...");
        
        // Clean up any duplicate structures that might exist
        this.cleanupDuplicateStructures();
        
        // Show loading message
        if (this.game.ui) {
            this.game.ui.showMessage("Generating world...", 0);
        }
        
        // Define the area to pre-generate (centered at origin)
        const preGenRadius = 500; // Units in each direction
        const chunkSize = this.terrainCache.chunkSize;
        const chunksPerSide = Math.ceil(preGenRadius * 2 / chunkSize);
        
        // Track progress
        let totalChunks = chunksPerSide * chunksPerSide;
        let chunksGenerated = 0;
        
        // Create a promise to track completion
        return new Promise((resolve) => {
            // Use setTimeout to avoid blocking the main thread
            const generateNextChunk = () => {
                if (chunksGenerated >= totalChunks) {
                    // All chunks generated
                    this.terrainCache.preGenerated = true;
                    this.saveTerrainCache();
                    
                    // Hide loading message
                    if (this.game.ui) {
                        this.game.ui.hideMessage();
                    }
                    
                    console.log("Terrain pre-generation complete!");
                    resolve();
                    return;
                }
                
                // Calculate the chunk coordinates
                const x = Math.floor(chunksGenerated / chunksPerSide);
                const z = chunksGenerated % chunksPerSide;
                
                // Convert to world coordinates (centered around origin)
                const worldX = (x - chunksPerSide/2) * chunkSize;
                const worldZ = (z - chunksPerSide/2) * chunkSize;
                
                // Generate and cache the chunk
                this.generateTerrainChunk(worldX, worldZ);
                
                // Update progress
                chunksGenerated++;
                if (this.game.ui) {
                    const progress = Math.floor((chunksGenerated / totalChunks) * 100);
                    this.game.ui.showMessage(`Generating world... ${progress}%`, 0);
                }
                
                // Schedule the next chunk generation
                setTimeout(generateNextChunk, 0);
            };
            
            // Start the generation process
            generateNextChunk();
        });
    }
    
    /**
     * Generate a terrain chunk at the specified coordinates
     * @param {number} chunkX - X coordinate of chunk center
     * @param {number} chunkZ - Z coordinate of chunk center
     * @returns {Object} - The generated chunk data
     */
    generateTerrainChunk(chunkX, chunkZ) {
        const chunkSize = this.terrainCache.chunkSize;
        const chunkKey = `${Math.floor(chunkX/chunkSize)}_${Math.floor(chunkZ/chunkSize)}`;
        
        // Skip if already cached
        if (this.terrainCache.chunks[chunkKey]) {
            return this.terrainCache.chunks[chunkKey];
        }
        
        // Generate terrain data for this chunk
        const chunkData = {
            heightMap: {},
            biomeMap: {},
            structures: [],
            environment: []
        };
        
        // Generate height and biome data for points in this chunk
        for (let x = chunkX; x < chunkX + chunkSize; x += 10) {
            for (let z = chunkZ; z < chunkZ + chunkSize; z += 10) {
                // Sample points at 10-unit intervals
                const height = this.getTerrainHeight(x, z);
                // Create a position vector and use getZoneAt instead of getZoneTypeAt
                const position = new THREE.Vector3(x, 0, z);
                const zone = this.zoneManager.getZoneAt(position);
                const biome = zone ? zone.name : 'Terrant';
                
                chunkData.heightMap[`${x}_${z}`] = height;
                chunkData.biomeMap[`${x}_${z}`] = biome;
            }
        }
        
        // Generate some structures in this chunk (reduced density)
        const structureCount = Math.floor(Math.random() * 2); // 0-1 structures per chunk (reduced from 1-3)
        for (let i = 0; i < structureCount; i++) {
            const structX = chunkX + Math.random() * chunkSize;
            const structZ = chunkZ + Math.random() * chunkSize;
            
            // Create a fake player position for structure generation
            const fakePlayerPos = new THREE.Vector3(structX, 0, structZ);
            
            // Generate a structure and store its data
            const structure = this.structureManager.generateRandomStructure(fakePlayerPos);
            if (structure) {
                chunkData.structures.push({
                    type: structure.type,
                    position: {
                        x: structure.position.x,
                        y: structure.position.y,
                        z: structure.position.z
                    },
                    isGroup: structure.isGroup || false,
                    groupId: structure.groupId || null,
                    chunkKey: chunkKey // Store which chunk this belongs to
                });
            }
        }
        
        // Generate some environment objects in this chunk (reduced density)
        const envObjectCount = 1 + Math.floor(Math.random() * 20); // 1-3 environment objects per chunk (reduced from 5-15)
        for (let i = 0; i < envObjectCount; i++) {
            const envX = chunkX + Math.random() * chunkSize;
            const envZ = chunkZ + Math.random() * chunkSize;
            
            // Create a fake player position for environment generation
            const fakePlayerPos = new THREE.Vector3(envX, 0, envZ);
            
            // Generate an environment object and store its data
            const envObject = this.environmentManager.generateRandomObject(fakePlayerPos);
            if (envObject) {
                chunkData.environment.push({
                    type: envObject.type,
                    position: {
                        x: envObject.position.x,
                        y: envObject.position.y,
                        z: envObject.position.z
                    },
                    chunkKey: chunkKey // Store which chunk this belongs to
                });
            }
        }
        
        // Store the chunk data in cache
        this.terrainCache.chunks[chunkKey] = chunkData;
        
        // Limit cache size
        this.limitCacheSize();
        
        return chunkData;
    }
    
    /**
     * Limit the size of the terrain cache to prevent memory issues
     */
    limitCacheSize() {
        const chunks = Object.keys(this.terrainCache.chunks);
        if (chunks.length > this.terrainCache.maxCachedChunks) {
            // Remove oldest chunks (we'll just remove the first ones in the object)
            const chunksToRemove = chunks.length - this.terrainCache.maxCachedChunks;
            for (let i = 0; i < chunksToRemove; i++) {
                delete this.terrainCache.chunks[chunks[i]];
            }
        }
    }
    
    /**
     * Save the terrain cache to localStorage
     */
    saveTerrainCache() {
        if (!this.terrainCache.saveToLocalStorage) {
            return;
        }
        
        try {
            // Only save the preGenerated flag and a subset of chunks to avoid localStorage limits
            const cacheToSave = {
                preGenerated: this.terrainCache.preGenerated,
                chunks: {}
            };
            
            // Only save a limited number of chunks around the origin
            const centralChunks = Object.keys(this.terrainCache.chunks)
                .filter(key => {
                    const [x, z] = key.split('_').map(Number);
                    return Math.abs(x) <= 5 && Math.abs(z) <= 5; // Only save chunks within 5 chunks of origin
                })
                .slice(0, 50); // Maximum 50 chunks
            
            centralChunks.forEach(key => {
                cacheToSave.chunks[key] = this.terrainCache.chunks[key];
            });
            
            localStorage.setItem(this.terrainCache.localStorageKey, JSON.stringify(cacheToSave));
            console.log("Terrain cache saved to localStorage");
        } catch (e) {
            console.warn("Failed to save terrain cache to localStorage:", e);
        }
    }
    
    /**
     * Load the terrain cache from localStorage
     */
    loadTerrainCache() {
        if (!this.terrainCache.saveToLocalStorage) {
            return;
        }
        
        try {
            const cachedData = localStorage.getItem(this.terrainCache.localStorageKey);
            if (cachedData) {
                const parsedData = JSON.parse(cachedData);
                this.terrainCache.preGenerated = parsedData.preGenerated;
                this.terrainCache.chunks = parsedData.chunks || {};
                console.log("Terrain cache loaded from localStorage");
            }
        } catch (e) {
            console.warn("Failed to load terrain cache from localStorage:", e);
        }
    }
    
    /**
     * Update the world based on player position
     * @param {THREE.Vector3} playerPosition - The player's current position
     * @param {number} drawDistanceMultiplier - Multiplier for draw distance
     * @param {number} delta - Time since last update (in seconds)
     */
    updateWorldForPlayer(playerPosition, drawDistanceMultiplier = 1.0, delta = 0) {
        // Apply low performance mode if needed
        const effectiveDrawDistance = this.lowPerformanceMode ? 
            Math.min(0.6, drawDistanceMultiplier) : drawDistanceMultiplier;
        
        // Check if we need to load cached terrain data for this area
        this.loadCachedTerrainForPlayer(playerPosition);
        
        // Update terrain chunks with potentially reduced draw distance
        this.terrainManager.updateForPlayer(playerPosition, effectiveDrawDistance);
        
        // Update environment objects based on player position
        // this.environmentManager.updateForPlayer(playerPosition, effectiveDrawDistance);
        
        // Track player movement for predictive generation
        this.updatePlayerMovementTracking(playerPosition);
        
        // Update lighting to follow player
        this.updateLighting(playerPosition);
        
        // Check if player has moved far enough for screen-based enemy spawning
        // Only update if we're not in low performance mode or if significant movement has occurred
        const distanceFromLastCheck = playerPosition.distanceTo(this.lastPlayerPosition);
        if (!this.lowPerformanceMode || distanceFromLastCheck > this.screenSpawnDistance) {
            this.checkPlayerScreenMovement(playerPosition, effectiveDrawDistance, delta);
        }
    }
    
    /**
     * Load cached terrain data for the player's current area
     * @param {THREE.Vector3} playerPosition - The player's current position
     */
    loadCachedTerrainForPlayer(playerPosition) {
        // Calculate which cache chunk the player is in
        const chunkSize = this.terrainCache.chunkSize;
        const playerChunkX = Math.floor(playerPosition.x / chunkSize);
        const playerChunkZ = Math.floor(playerPosition.z / chunkSize);
        
        // Track which chunks should be active
        const newActiveChunks = {};
        
        // Check if we have cached data for this chunk and surrounding chunks within load radius
        for (let xOffset = -this.chunkLoadRadius; xOffset <= this.chunkLoadRadius; xOffset++) {
            for (let zOffset = -this.chunkLoadRadius; zOffset <= this.chunkLoadRadius; zOffset++) {
                const chunkX = (playerChunkX + xOffset) * chunkSize;
                const chunkZ = (playerChunkZ + zOffset) * chunkSize;
                const chunkKey = `${playerChunkX + xOffset}_${playerChunkZ + zOffset}`;
                
                // Mark this chunk as active
                newActiveChunks[chunkKey] = true;
                
                // If we don't have this chunk cached, generate it
                if (!this.terrainCache.chunks[chunkKey]) {
                    this.generateTerrainChunk(chunkX, chunkZ);
                }
                
                // Only load objects if this chunk wasn't already active
                if (!this.activeChunks[chunkKey]) {
                    console.debug(`Loading chunk ${chunkKey}`);
                    
                    // If we have cached structures for this chunk, ensure they're created
                    if (this.terrainCache.chunks[chunkKey] && this.terrainCache.chunks[chunkKey].structures) {
                        this.ensureStructuresCreated(this.terrainCache.chunks[chunkKey].structures);
                    }
                    
                    // If we have cached environment objects for this chunk, ensure they're created
                    if (this.terrainCache.chunks[chunkKey] && this.terrainCache.chunks[chunkKey].environment) {
                        this.ensureEnvironmentCreated(this.terrainCache.chunks[chunkKey].environment);
                    }
                }
            }
        }
        
        // Unload chunks that are no longer active
        for (const chunkKey in this.activeChunks) {
            if (!newActiveChunks[chunkKey]) {
                console.debug(`Unloading chunk ${chunkKey}`);
                this.unloadChunk(chunkKey);
            }
        }
        
        // Update active chunks
        this.activeChunks = newActiveChunks;
    }
    
    /**
     * Unload objects from a chunk that is no longer active
     * @param {string} chunkKey - The key of the chunk to unload
     */
    unloadChunk(chunkKey) {
        // Unload structures in this chunk
        this.structureManager.structures = this.structureManager.structures.filter(structure => {
            // Keep structures that don't have a chunkKey or are in a different chunk
            if (!structure.chunkKey || structure.chunkKey !== chunkKey) {
                return true;
            }
            
            // Remove the structure from the scene
            if (structure.object && structure.object.parent) {
                this.scene.remove(structure.object);
            }
            
            return false;
        });
        
        // Unload environment objects in this chunk
        this.environmentManager.environmentObjects = this.environmentManager.environmentObjects.filter(envObj => {
            // Keep objects that don't have a chunkKey or are in a different chunk
            if (!envObj.chunkKey || envObj.chunkKey !== chunkKey) {
                return true;
            }
            
            // Remove the object from the scene
            if (envObj.object && envObj.object.parent) {
                this.scene.remove(envObj.object);
            }
            
            return false;
        });
    }
    
    /**
     * Ensure that cached structures are created in the world
     * @param {Array} structures - Array of structure data
     */
    ensureStructuresCreated(structures) {
        // Skip if no structures to create
        if (!structures || !Array.isArray(structures) || structures.length === 0) {
            return;
        }
        
        // Debug log to track structure creation
        console.debug(`Ensuring ${structures.length} structures are created`);
        
        // For each cached structure
        structures.forEach(structureData => {
            // Skip invalid structure data
            if (!structureData || !structureData.position) {
                console.warn("Invalid structure data encountered:", structureData);
                return;
            }
            
            // Create a Vector3 for position comparison
            const structurePosition = new THREE.Vector3(
                structureData.position.x,
                structureData.position.y || 0,
                structureData.position.z
            );
            
            // Use a larger distance threshold to prevent stacking
            const distanceThreshold = 20; // Increased from 5 to 20
            
            // Check if this structure already exists in the world
            const exists = this.structureManager.structures.some(s => {
                // Skip structures without valid position
                if (!s || !s.position) return false;
                
                // Check distance and type
                return s.position.distanceTo(structurePosition) < distanceThreshold && 
                       s.type === structureData.type;
            });
            
            // If it doesn't exist, create it
            if (!exists) {
                // Use the appropriate creation method based on structure type
                let structure = null;
                
                switch (structureData.type) {
                    case 'house':
                        structure = this.structureManager.createBuilding(
                            structurePosition.x, 
                            structurePosition.z
                        );
                        break;
                    case 'tower':
                        structure = this.structureManager.createTower(
                            structurePosition.x, 
                            structurePosition.z
                        );
                        break;
                    case 'ruins':
                        structure = this.structureManager.createRuins(
                            structurePosition.x, 
                            structurePosition.z
                        );
                        break;
                    case 'darkSanctum':
                        structure = this.structureManager.createDarkSanctum(
                            structurePosition.x, 
                            structurePosition.z
                        );
                        break;
                    case 'mountain':
                        structure = this.structureManager.createMountain(
                            structurePosition.x, 
                            structurePosition.z
                        );
                        break;
                    case 'bridge':
                        structure = this.structureManager.createBridge(
                            structurePosition.x, 
                            structurePosition.z
                        );
                        break;
                    case 'village':
                        structure = this.structureManager.createVillage(
                            structurePosition.x, 
                            structurePosition.z
                        );
                        break;
                }
                
                // If structure was created, add it to the tracking array
                if (structure) {
                    // Create structure info
                    const structureInfo = {
                        type: structureData.type,
                        object: structure,
                        position: structurePosition,
                        chunkKey: structureData.chunkKey // Track which chunk this belongs to
                    };
                    
                    // Add to structures array for tracking
                    this.structureManager.structures.push(structureInfo);
                }
            } else {
                // Debug log for duplicate structures
                console.debug(`Skipped duplicate ${structureData.type} at (${structurePosition.x.toFixed(1)}, ${structurePosition.z.toFixed(1)})`);
            }
        });
    }
    
    /**
     * Ensure that cached environment objects are created in the world
     * @param {Array} envObjects - Array of environment object data
     */
    ensureEnvironmentCreated(envObjects) {
        // Skip if no environment objects to create
        if (!envObjects || !Array.isArray(envObjects) || envObjects.length === 0) {
            return;
        }
        
        // Debug log to track environment object creation
        console.debug(`Ensuring ${envObjects.length} environment objects are created`);
        
        // For each cached environment object
        envObjects.forEach(envData => {
            // Skip invalid environment data
            if (!envData || !envData.position) {
                console.warn("Invalid environment data encountered:", envData);
                return;
            }
            
            // Create a Vector3 for position comparison
            const envPosition = new THREE.Vector3(
                envData.position.x,
                envData.position.y || 0,
                envData.position.z
            );
            
            // Use a larger distance threshold to prevent stacking
            const distanceThreshold = 20; // Increased from 5 to 20
            
            // Check if this object already exists in the world
            const exists = this.environmentManager.environmentObjects.some(o => {
                // Skip objects without valid position
                if (!o || !o.position) return false;
                
                // Check distance and type
                return o.position.distanceTo(envPosition) < distanceThreshold && 
                       o.type === envData.type;
            });
            
            // If it doesn't exist, create it
            if (!exists) {
                // Create the environment object based on its type
                const position = new THREE.Vector3(
                    envData.position.x,
                    envData.position.y || 0,
                    envData.position.z
                );
                
                // Use the appropriate creation method based on object type
                let envObject = null;
                switch (envData.type) {
                    case 'tree':
                        envObject = this.environmentManager.createTree(position.x, position.z);
                        break;
                    case 'rock':
                        envObject = this.environmentManager.createRock(position.x, position.z);
                        break;
                    case 'bush':
                        envObject = this.environmentManager.createBush(position.x, position.z);
                        break;
                    case 'flower':
                        envObject = this.environmentManager.createFlower(position.x, position.z);
                        break;
                }
                
                // If we have a created object, add the chunk information to it
                if (envObject && this.environmentManager.environmentObjects.length > 0) {
                    // Get the last added object (the one we just created)
                    const lastIndex = this.environmentManager.environmentObjects.length - 1;
                    const lastObject = this.environmentManager.environmentObjects[lastIndex];
                    
                    // Add chunk key to the object
                    if (lastObject) {
                        lastObject.chunkKey = envData.chunkKey;
                    }
                }
            }
        });
    }
    
    /**
     * Update lighting to follow player
     * @param {THREE.Vector3} playerPosition - The player's current position
     */
    updateLighting(playerPosition) {
        // Use a fixed delta time value instead of getting it from the clock
        // This prevents issues with the clock.getDelta() being called multiple times
        const fixedDeltaTime = 0.016; // 60 FPS equivalent
        this.lightingManager.update(fixedDeltaTime, playerPosition);
    }
    
    /**
     * Check if player has moved far enough for screen-based enemy spawning
     * @param {THREE.Vector3} playerPosition - The player's current position
     * @param {number} effectiveDrawDistance - The effective draw distance
     * @param {number} delta - Time since last update (in seconds)
     * @private
     */
    checkPlayerScreenMovement(playerPosition, effectiveDrawDistance, delta = 0) {
        const distanceMoved = playerPosition.distanceTo(this.lastPlayerPosition);
        if (distanceMoved >= this.screenSpawnDistance) {
            // Update last position
            this.lastPlayerPosition.copy(playerPosition);
            
            // Notify game that player has moved a screen distance (for enemy spawning)
            if (this.game && this.game.enemyManager) {
                this.game.enemyManager.onPlayerMovedScreenDistance(playerPosition);
            }
            
            // Force cleanup of distant objects when player moves significant distance
            if (distanceMoved >= this.screenSpawnDistance * 3) {
                console.debug(`Player moved significant distance (${distanceMoved.toFixed(1)}), forcing world cleanup`);
                
                // Perform unified cleanup of all distant objects
                this.cleanupDistantObjects(playerPosition, effectiveDrawDistance);
                
                // Force garbage collection hint
                this.hintGarbageCollection();
            }
        }
        
        // Update sky using the SkyManager
        if (this.skyManager) {
            this.skyManager.update(delta);
        }
        
        // Update fog using the FogManager
        if (this.fogManager) {
            // Pass delta as deltaTime to match the expected parameter name
            this.fogManager.update(delta, playerPosition);
            
            // Pass draw distance multiplier to fog manager for density adjustments
            if (this.game && this.game.performanceManager) {
                const drawDistanceMultiplier = this.game.performanceManager.getDrawDistanceMultiplier();
                // The fog manager will handle density adjustments internally
            }
        }
        
        // Update teleport portals
        if (this.teleportManager) {
            // Pass delta as deltaTime to match the expected parameter name
            this.teleportManager.update(delta, playerPosition);
        }
        
        // Periodically check memory and performance
        this.manageMemoryAndPerformance();
    }
    
    /**
     * Track player movement for predictive generation
     * @param {THREE.Vector3} playerPosition - Current player position
     */
    updatePlayerMovementTracking(playerPosition) {
        // Skip if this is the first position
        if (this.playerMovementHistory.length === 0) {
            this.playerMovementHistory.push(playerPosition.clone());
            return;
        }
        
        // Get previous position
        const previousPosition = this.playerMovementHistory[this.playerMovementHistory.length - 1];
        
        // Calculate movement vector
        const movement = new THREE.Vector3().subVectors(playerPosition, previousPosition);
        const distance = movement.length();
        
        // Only track significant movements (> 0.5 units)
        if (distance > 0.5) {
            // Add to history
            this.playerMovementHistory.push(playerPosition.clone());
            
            // Keep history at max length
            if (this.playerMovementHistory.length > this.playerMovementHistoryMaxLength) {
                this.playerMovementHistory.shift();
            }
            
            // Calculate average movement direction from recent history
            if (this.playerMovementHistory.length >= 2) {
                this.playerMovementDirection.set(0, 0, 0);
                
                for (let i = 1; i < this.playerMovementHistory.length; i++) {
                    const prev = this.playerMovementHistory[i - 1];
                    const curr = this.playerMovementHistory[i];
                    const segmentDir = new THREE.Vector3().subVectors(curr, prev).normalize();
                    this.playerMovementDirection.add(segmentDir);
                }
                
                // Normalize to get average direction
                this.playerMovementDirection.divideScalar(this.playerMovementHistory.length - 1);
            }
        }
    }
    
    /**
     * Generate a path segment based on player movement
     * @param {THREE.Vector3} playerPosition - Current player position
     */
    generatePathSegment(playerPosition) {
        // Check if player has moved far enough to generate a new path segment
        const distanceMoved = playerPosition.distanceTo(this.lastPathGenerationPosition);
        
        if (distanceMoved >= this.pathGenerationDistance) {
            // Update last position
            this.lastPathGenerationPosition.copy(playerPosition);
            
            // Generate path in the direction of player movement
            const pathDirection = this.playerMovementDirection.clone();
            
            // If we have a valid direction
            if (pathDirection.length() > 0.1) {
                // Normalize direction
                pathDirection.normalize();
                
                // Calculate path endpoint
                const pathLength = this.pathSegmentLength * (0.8 + Math.random() * 0.4); // 80-120% of segment length
                const endX = playerPosition.x + pathDirection.x * pathLength;
                const endZ = playerPosition.z + pathDirection.z * pathLength;
                
                // Add some randomness to path direction
                const randomAngle = (Math.random() - 0.5) * this.pathCurve;
                const rotatedX = Math.cos(randomAngle) * pathDirection.x - Math.sin(randomAngle) * pathDirection.z;
                const rotatedZ = Math.sin(randomAngle) * pathDirection.x + Math.cos(randomAngle) * pathDirection.z;
                
                // Final endpoint with randomness
                const finalEndX = playerPosition.x + rotatedX * pathLength;
                const finalEndZ = playerPosition.z + rotatedZ * pathLength;
                
                // Create path segment
                this.createPathSegment(
                    playerPosition.x, playerPosition.z,
                    finalEndX, finalEndZ
                );
                
                // Add path node
                this.addPathNode(new THREE.Vector3(finalEndX, 0, finalEndZ), 'path');
                
                // Generate trees along the path
                this.generateTreesAlongPath(playerPosition, 3 + Math.floor(Math.random() * 5));
                
                console.debug(`Generated path segment from (${playerPosition.x.toFixed(1)}, ${playerPosition.z.toFixed(1)}) to (${finalEndX.toFixed(1)}, ${finalEndZ.toFixed(1)})`);
            }
        }
    }
    
    /**
     * Create a path segment between two points
     * @param {number} startX - Start X coordinate
     * @param {number} startZ - Start Z coordinate
     * @param {number} endX - End X coordinate
     * @param {number} endZ - End Z coordinate
     */
    createPathSegment(startX, startZ, endX, endZ) {
        // Calculate path direction
        const dirX = endX - startX;
        const dirZ = endZ - startZ;
        const length = Math.sqrt(dirX * dirX + dirZ * dirZ);
        
        // Normalize direction
        const normDirX = dirX / length;
        const normDirZ = dirZ / length;
        
        // Calculate perpendicular direction for path width
        const perpDirX = -normDirZ;
        const perpDirZ = normDirX;
        
        // Create path geometry
        const pathGeometry = new THREE.PlaneGeometry(length, this.pathWidth);
        
        // Create path material
        const pathMaterial = new THREE.MeshStandardMaterial({
            color: 0x8B4513, // Brown color for dirt path
            roughness: 0.9,
            metalness: 0.1
        });
        
        // Create path mesh
        const pathMesh = new THREE.Mesh(pathGeometry, pathMaterial);
        
        // Position path at midpoint
        const midX = (startX + endX) / 2;
        const midZ = (startZ + endZ) / 2;
        
        // Calculate rotation angle
        const angle = Math.atan2(dirZ, dirX);
        
        // Set position and rotation
        pathMesh.position.set(midX, this.getTerrainHeight(midX, midZ) + 0.05, midZ);
        pathMesh.rotation.set(-Math.PI / 2, 0, angle);
        
        // Add to scene
        this.scene.add(pathMesh);
        
        // Add to paths array for tracking
        this.paths.push(pathMesh);
        
        // Limit the number of path segments
        if (this.paths.length > 50) {
            const oldestPath = this.paths.shift();
            if (oldestPath && oldestPath.parent) {
                this.scene.remove(oldestPath);
            }
        }
        
        return pathMesh;
    }
    
    /**
     * Add a path node for connecting structures
     * @param {THREE.Vector3} position - Node position
     * @param {string} type - Node type
     */
    addPathNode(position, type) {
        this.pathNodes.push({
            position: position.clone(),
            type: type,
            timestamp: Date.now()
        });
        
        // Limit the number of path nodes
        if (this.pathNodes.length > 20) {
            this.pathNodes.shift();
        }
        
        // Try to connect to nearby nodes
        this.connectNearbyPathNodes(position);
    }
    
    /**
     * Connect nearby path nodes with paths
     * @param {THREE.Vector3} position - Current position
     */
    connectNearbyPathNodes(position) {
        // Only connect if we have at least 2 nodes
        if (this.pathNodes.length < 2) {
            return;
        }
        
        // Get the most recent node (should be the one we just added)
        const currentNode = this.pathNodes[this.pathNodes.length - 1];
        
        // Find a nearby node to connect to
        for (let i = 0; i < this.pathNodes.length - 1; i++) {
            const node = this.pathNodes[i];
            const distance = currentNode.position.distanceTo(node.position);
            
            // Connect if within reasonable distance and not already connected
            if (distance < 100 && distance > 20 && Math.random() < 0.3) {
                // Create path between nodes
                this.createPathSegment(
                    currentNode.position.x, currentNode.position.z,
                    node.position.x, node.position.z
                );
                
                console.debug(`Connected path nodes: ${currentNode.type} to ${node.type}`);
                
                // Only connect to one node for now
                break;
            }
        }
    }
    
    /**
     * Generate trees along the player's path
     * @param {THREE.Vector3} playerPosition - Current player position
     * @param {number} count - Number of trees to generate
     */
    generateTreesAlongPath(playerPosition, count) {
        // Get player movement direction
        const direction = this.playerMovementDirection.clone();
        
        // Only proceed if we have a valid direction
        if (direction.length() < 0.1) {
            return;
        }
        
        // Normalize direction
        direction.normalize();
        
        // Generate trees along the path
        for (let i = 0; i < count; i++) {
            // Calculate position along path
            const distance = 20 + Math.random() * 80; // 20-100 units ahead
            
            // Add some randomness to direction
            const angle = Math.atan2(direction.z, direction.x);
            const randomAngle = angle + (Math.random() - 0.5) * Math.PI * 0.5; // +/- 45 degrees
            
            // Calculate final position
            const treeX = playerPosition.x + Math.cos(randomAngle) * distance;
            const treeZ = playerPosition.z + Math.sin(randomAngle) * distance;
            
            // Calculate perpendicular offset from path
            const perpAngle = randomAngle + Math.PI / 2;
            const perpDistance = 5 + Math.random() * 15; // 5-20 units from path center
            const sideMultiplier = Math.random() > 0.5 ? 1 : -1; // Randomly choose side of path
            
            const finalX = treeX + Math.cos(perpAngle) * perpDistance * sideMultiplier;
            const finalZ = treeZ + Math.sin(perpAngle) * perpDistance * sideMultiplier;
            
            // Generate tree
            this.environmentManager.generateRandomObject(new THREE.Vector3(finalX, 0, finalZ));
        }
    }
    
    /**
     * Generate trees around a specific point
     * @param {THREE.Vector3} center - Center point
     * @param {number} radius - Radius around center
     * @param {number} count - Number of trees to generate
     */
    generateTreesAroundPoint(center, radius, count) {
        for (let i = 0; i < count; i++) {
            // Random angle and distance
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * radius;
            
            // Calculate position
            const x = center.x + Math.cos(angle) * distance;
            const z = center.z + Math.sin(angle) * distance;
            
            // Generate tree
            this.environmentManager.generateRandomObject(new THREE.Vector3(x, 0, z));
        }
    }
    
    /**
     * Generate mountains in the distance
     * @param {THREE.Vector3} playerPosition - Current player position
     * @param {number} count - Number of mountains to generate
     */
    generateDistantMountains(playerPosition, count) {
        // Generate mountains in the distance
        for (let i = 0; i < count; i++) {
            // Random angle but biased toward player movement direction
            const baseAngle = Math.atan2(this.playerMovementDirection.z, this.playerMovementDirection.x);
            const randomAngle = baseAngle + (Math.random() - 0.5) * Math.PI * 0.8; // +/- 72 degrees
            
            // Far distance
            const distance = 150 + Math.random() * 100; // 150-250 units away
            
            // Calculate position
            const x = playerPosition.x + Math.cos(randomAngle) * distance;
            const z = playerPosition.z + Math.sin(randomAngle) * distance;
            
            // Generate mountain range
            this.structureManager.createMountainRange(x, z, 3 + Math.floor(Math.random() * 5));
        }
    }
    
    /**
     * Unified cleanup of all distant objects
     * @param {THREE.Vector3} playerPosition - Current player position
     * @param {number} drawDistanceMultiplier - Multiplier for draw distance
     */
    cleanupDistantObjects(playerPosition, drawDistanceMultiplier) {
        // Calculate maximum cleanup distance based on buffer and draw distance
        // Reduced multiplier to clean up objects sooner and prevent too many objects in the scene
        const maxCleanupDistance = this.randomGenerationBuffer * drawDistanceMultiplier * 2.5; // Reduced from 3.5 to 2.5
        
        // Add a smaller buffer to prevent flickering - clean up objects sooner
        const cleanupBuffer = 30; // Reduced from 50 to 30
        const effectiveCleanupDistance = maxCleanupDistance + cleanupBuffer;
        
        // Clean up terrain (still using chunk-based approach for terrain)
        const terrainChunkSize = this.terrainManager.terrainChunkSize;
        const playerChunkX = Math.floor(playerPosition.x / terrainChunkSize);
        const playerChunkZ = Math.floor(playerPosition.z / terrainChunkSize);
        this.terrainManager.clearDistantChunks(playerChunkX, playerChunkZ);
        
        // Track how many objects were removed for debugging
        let structuresRemoved = 0;
        let environmentObjectsRemoved = 0;
        
        // Clean up structures
        if (this.structureManager && this.structureManager.structures) {
            const structuresCount = this.structureManager.structures.length;
            this.structureManager.structures = this.structureManager.structures.filter(structure => {
                if (!structure || !structure.position) return false;
                
                const distance = playerPosition.distanceTo(structure.position);
                if (distance > effectiveCleanupDistance) {
                    // Remove from scene
                    if (structure.object && structure.object.parent) {
                        this.scene.remove(structure.object);
                    }
                    structuresRemoved++;
                    return false;
                }
                return true;
            });
        }
        
        // Clean up environment objects
        if (this.environmentManager && this.environmentManager.environmentObjects) {
            const envObjectsCount = this.environmentManager.environmentObjects.length;
            this.environmentManager.environmentObjects = this.environmentManager.environmentObjects.filter(obj => {
                if (!obj || !obj.position) return false;
                
                const distance = playerPosition.distanceTo(obj.position);
                if (distance > effectiveCleanupDistance) {
                    // Remove from scene
                    if (obj.object && obj.object.parent) {
                        this.scene.remove(obj.object);
                    }
                    
                    // Also remove from type-specific arrays
                    if (obj.type === 'tree') {
                        this.environmentManager.trees = this.environmentManager.trees.filter(t => t !== obj.object);
                    } else if (obj.type === 'rock') {
                        this.environmentManager.rocks = this.environmentManager.rocks.filter(r => r !== obj.object);
                    } else if (obj.type === 'bush') {
                        this.environmentManager.bushes = this.environmentManager.bushes.filter(b => b !== obj.object);
                    } else if (obj.type === 'flower') {
                        this.environmentManager.flowers = this.environmentManager.flowers.filter(f => f !== obj.object);
                    }
                    
                    environmentObjectsRemoved++;
                    return false;
                }
                return true;
            });
        }
        
        // Clean up interactive objects if the method exists
        if (this.interactiveManager && this.interactiveManager.cleanupDistantObjects) {
            this.interactiveManager.cleanupDistantObjects(playerPosition, effectiveCleanupDistance);
        }
        
        // Clean up enemies
        if (this.game && this.game.enemyManager) {
            this.game.enemyManager.cleanupDistantEnemies(effectiveCleanupDistance);
        }
        
        // Only log if objects were actually removed
        if (structuresRemoved > 0 || environmentObjectsRemoved > 0) {
            console.debug(`Cleaned up distant objects beyond ${effectiveCleanupDistance.toFixed(1)} units from player: ${structuresRemoved} structures, ${environmentObjectsRemoved} environment objects`);
        }
    }
    
    /**
     * Clean up structures that are far from the player
     * @param {number} playerChunkX - Player's chunk X coordinate (not used in new randomized version)
     * @param {number} playerChunkZ - Player's chunk Z coordinate (not used in new randomized version)
     * @deprecated Use cleanupDistantObjects instead
     */
    cleanupDistantStructures(playerChunkX, playerChunkZ) {
        // This method is kept for backward compatibility
        // The new cleanupDistantObjects method handles all object types
        console.debug("cleanupDistantStructures called (deprecated, using unified cleanup system instead)");
        
        // If we have a player position, use the new method
        if (this.lastPlayerPosition) {
            this.cleanupDistantObjects(this.lastPlayerPosition, 1.0);
        }
        
        return;
    }
    
    /**
     * Manage memory and performance to prevent memory leaks and maintain frame rate
     */
    manageMemoryAndPerformance() {
        const currentTime = Date.now();
        
        // Track frame rate
        if (this.game && this.game.stats && this.game.stats.fps) {
            this.frameRateHistory.push(this.game.stats.fps);
            
            // Keep history at max length
            if (this.frameRateHistory.length > this.frameRateHistoryMaxLength) {
                this.frameRateHistory.shift();
            }
        }
        
        // Periodically check memory usage
        if (currentTime - this.lastMemoryCheck > this.memoryCheckInterval) {
            this.lastMemoryCheck = currentTime;
            
            // Check if we need to force cleanup
            if (this.frameRateHistory.length > 10) {
                // Calculate average FPS
                const avgFPS = this.frameRateHistory.reduce((sum, fps) => sum + fps, 0) / 
                               this.frameRateHistory.length;
                
                // If FPS is consistently low, trigger aggressive cleanup
                if (avgFPS < 30) {
                    console.debug(`Low FPS detected (${avgFPS.toFixed(1)}), performing aggressive cleanup`);
                    this.performAggressiveCleanup();
                } else {
                    // Even if FPS is good, periodically clean up distant terrain to prevent memory buildup
                    // This addresses the issue of memory accumulation during long-distance travel
                    console.debug("Performing routine terrain cleanup to prevent memory buildup");
                    this.terrainManager.clearDistantChunks();
                }
            }
        }
        
        // Periodically adjust performance settings
        if (currentTime - this.lastPerformanceAdjustment > this.performanceAdjustmentInterval) {
            this.lastPerformanceAdjustment = currentTime;
            
            if (this.frameRateHistory.length > 10) {
                // Calculate average FPS
                const avgFPS = this.frameRateHistory.reduce((sum, fps) => sum + fps, 0) / 
                               this.frameRateHistory.length;
                
                // Adjust performance mode based on FPS
                const wasLowPerformanceMode = this.lowPerformanceMode;
                this.lowPerformanceMode = avgFPS < 30;
                
                // Notify if performance mode changed
                if (wasLowPerformanceMode !== this.lowPerformanceMode) {
                    console.debug(`Performance mode changed to: ${this.lowPerformanceMode ? 'LOW' : 'NORMAL'}`);
                    
                    // Notify user if performance mode changed
                    if (this.game && this.game.hudManager) {
                        const message = this.lowPerformanceMode ? 
                            "Performance mode: LOW - Reducing visual quality to improve performance" :
                            "Performance mode: NORMAL - Visual quality restored";
                        
                        if (this.game.hudManager.showNotification) {
                            this.game.hudManager.showNotification(message, 3000);
                        }
                    }
                    
                    // If switching to low performance mode, force terrain cleanup
                    if (this.lowPerformanceMode) {
                        this.terrainManager.clearDistantChunks(this.terrainChunkViewDistance);
                    }
                }
            }
        }
        
        // Periodically hint for garbage collection
        if (currentTime - this.lastGarbageCollection > this.gcInterval) {
            this.lastGarbageCollection = currentTime;
            this.hintGarbageCollection();
        }
    }
    
    /**
     * Perform aggressive cleanup to recover memory and improve performance
     */
    performAggressiveCleanup() {
        // Clear terrain and environment caches
        this.terrainFeatures = [];
        this.trees = [];
        this.rocks = [];
        this.buildings = [];
        this.paths = [];
        
        // Force terrain manager to clear distant chunks
        if (this.terrainManager && this.terrainManager.clearDistantChunks) {
            this.terrainManager.clearDistantChunks();
        }
        
        // Clear texture caches if available
        if (this.game && this.game.renderer) {
            // Clear WebGL state
            this.game.renderer.state.reset();
            
            // Clear texture cache if available
            if (THREE.Cache && THREE.Cache.clear) {
                THREE.Cache.clear();
            }
        }
        
        // Hint for garbage collection
        this.hintGarbageCollection();
        
        console.debug("Aggressive cleanup performed");
    }
    
    /**
     * Hint for garbage collection
     */
    hintGarbageCollection() {
        // Force garbage collection hint if available
        if (window.gc) {
            try {
                window.gc();
                console.debug("Garbage collection hint triggered");
            } catch (e) {
                // Ignore if not available
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
     * Clean up duplicate structures that might be stacked at the same location
     */
    cleanupDuplicateStructures() {
        if (!this.structureManager || !this.structureManager.structures) {
            return;
        }
        
        const structures = this.structureManager.structures;
        const uniqueStructures = [];
        const duplicates = [];
        
        // Find duplicates (structures that are too close to each other)
        for (let i = 0; i < structures.length; i++) {
            const structure = structures[i];
            
            // Skip invalid structures
            if (!structure || !structure.position) continue;
            
            // Check if this structure is a duplicate of any we've already processed
            const isDuplicate = uniqueStructures.some(s => 
                s.position.distanceTo(structure.position) < 20 && s.type === structure.type
            );
            
            if (isDuplicate) {
                duplicates.push(structure);
            } else {
                uniqueStructures.push(structure);
            }
        }
        
        // Remove duplicates from the scene
        duplicates.forEach(duplicate => {
            if (duplicate.object && duplicate.object.parent) {
                this.scene.remove(duplicate.object);
            }
        });
        
        // Update the structures array to only include unique structures
        this.structureManager.structures = uniqueStructures;
        
        console.debug(`Cleaned up ${duplicates.length} duplicate structures. Remaining: ${uniqueStructures.length}`);
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
        
        // Clear cached data to prevent memory leaks
        this.terrainFeatures = [];
        this.trees = [];
        this.rocks = [];
        this.buildings = [];
        this.paths = [];
        
        // Force garbage collection hint
        if (window.gc) {
            try {
                window.gc();
            } catch (e) {
                // Ignore if not available
            }
        }
        
        console.debug("World objects cleared for reload");
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
            teleport: this.teleportManager.save ? this.teleportManager.save() : null
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
    }
    
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
        }
        
        // Add structures as walls
        if (this.structureManager && this.structureManager.structures) {
            this.structureManager.structures.forEach(structure => {
                this.terrainFeatures.push({
                    type: 'wall',
                    position: structure.position
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
                        position: tree.position
                    });
                });
            }
            
            // Add rocks
            if (this.environmentManager.rocks) {
                this.environmentManager.rocks.forEach(rock => {
                    this.terrainFeatures.push({
                        type: 'rock',
                        position: rock.position
                    });
                });
            }
            
            // Add water bodies
            if (this.environmentManager.waterBodies) {
                this.environmentManager.waterBodies.forEach(water => {
                    this.terrainFeatures.push({
                        type: 'water',
                        position: water.position
                    });
                });
            }
        }
        
        return this.terrainFeatures;
    }
    
    /**
     * Get trees for the minimap
     * @returns {Array} - Array of trees
     */
    getTrees() {
        this.trees = [];
        
        // Add trees from environment manager
        if (this.environmentManager && this.environmentManager.trees) {
            this.environmentManager.trees.forEach(tree => {
                this.trees.push({
                    position: tree.position
                });
            });
        }
        
        return this.trees;
    }
    
    /**
     * Get rocks for the minimap
     * @returns {Array} - Array of rocks
     */
    getRocks() {
        this.rocks = [];
        
        // Add rocks from environment manager
        if (this.environmentManager && this.environmentManager.rocks) {
            this.environmentManager.rocks.forEach(rock => {
                this.rocks.push({
                    position: rock.position
                });
            });
        }
        
        return this.rocks;
    }
    
    /**
     * Get buildings for the minimap
     * @returns {Array} - Array of buildings
     */
    getBuildings() {
        this.buildings = [];
        
        // Add buildings from structure manager
        if (this.structureManager && this.structureManager.structures) {
            this.structureManager.structures.forEach(structure => {
                if (structure.type === 'building') {
                    this.buildings.push({
                        position: structure.position
                    });
                }
            });
        }
        
        return this.buildings;
    }
    
    /**
     * Get paths for the minimap
     * @returns {Array} - Array of paths
     */
    getPaths() {
        this.paths = [];
        
        // Add paths from environment manager or other sources
        if (this.environmentManager && this.environmentManager.paths) {
            this.environmentManager.paths.forEach(path => {
                this.paths.push({
                    position: path.position,
                    nextPoint: path.nextPoint
                });
            });
        }
        
        return this.paths;
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
     * Get interactive objects near a position
     * @param {THREE.Vector3} position - The position to check
     * @param {number} range - The range to check
     * @returns {Array} - Array of interactive objects within range
     */
    getInteractiveObjectsNear(position, range) {
        // Default to empty array
        let nearbyObjects = [];
        
        // Get interactive objects from the interactive manager
        if (this.interactiveManager && this.interactiveManager.getObjectsNear) {
            nearbyObjects = this.interactiveManager.getObjectsNear(position, range);
        }
        
        // Add teleport portals if they exist
        if (this.teleportManager && this.teleportManager.getPortals) {
            const portals = this.teleportManager.getPortals();
            
            // Filter portals by distance
            const nearbyPortals = portals.filter(portal => {
                // Skip portals without a position
                if (!portal.position) return false;
                
                // Calculate distance
                const distance = position.distanceTo(portal.position);
                
                // Return true if within range
                return distance <= range;
            });
            
            // Add nearby portals to the result
            nearbyObjects = nearbyObjects.concat(nearbyPortals);
        }
        
        return nearbyObjects;
    }
}