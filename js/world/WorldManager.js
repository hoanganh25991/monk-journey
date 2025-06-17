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
        
        // For save/load functionality
        this.savedData = null;
        
        // For minimap features
        this.terrainFeatures = [];
        this.trees = [];
        this.rocks = [];
        this.buildings = [];
        this.paths = [];
        
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
            'Forest': { 
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
            'Desert': { 
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
            'Mountain': { 
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
            'Swamp': { 
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
            'Magical': { 
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
            playerPosition.distanceTo(this.lastPlayerPosition) > 5;
            
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
                now - this._lastEnvironmentUpdate > 200) {
                this.updateEnvironmentForPlayer(playerPosition, effectiveDrawDistance);
                this._lastEnvironmentUpdate = now;
            }
            
            // 3. Generate procedural content (can be throttled most aggressively)
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
            
            // 4. Update world systems (lighting, fog, etc.)
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
                this.environmentManager.updateForPlayer(playerPosition, effectiveDrawDistance);
            } catch (error) {
                console.error("Error updating environment:", error);
            }
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
            case 'Forest':
                landmarkType = Math.random() < 0.5 ? 'ancient_tree' : 'village';
                break;
            case 'Desert':
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
                    landmark = this.structureManager.createVillage(landmarkX, landmarkZ);
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
                    landmark = this.structureManager.createMountain(landmarkX, landmarkZ);
                    break;
                case 'dark_sanctum':
                    landmark = this.structureManager.createDarkSanctum(landmarkX, landmarkZ);
                    break;
                case 'ruins':
                default:
                    landmark = this.structureManager.createRuins(landmarkX, landmarkZ);
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
     * Get vegetation objects for the minimap
     * @returns {Array} - Array of vegetation objects
     */
    getVegetation() {
        const vegetation = [];
        
        // Get vegetation from environment manager
        if (this.environmentManager && this.environmentManager.trees) {
            this.environmentManager.trees.forEach(tree => {
                vegetation.push({
                    position: tree.position,
                    type: 'tree'
                });
            });
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
        if (this.environmentManager && this.environmentManager.rocks) {
            this.environmentManager.rocks.forEach(rock => {
                rocks.push({
                    position: rock.position,
                    type: 'rock'
                });
            });
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
        return this.getStructures().filter(structure => 
            ['house', 'building', 'tavern', 'shop', 'temple'].includes(structure.type)
        );
    }
    
    /**
     * Get trees for the minimap (for backward compatibility)
     * @returns {Array} - Array of tree objects
     */
    getTrees() {
        return this.getVegetation().filter(obj => 
            ['tree', 'pine_tree', 'ancient_tree', 'swamp_tree'].includes(obj.type)
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
}