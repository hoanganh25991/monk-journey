import * as THREE from 'three';
import { TerrainManager } from './terrain/TerrainManager.js';
import { StructureManager } from './structures/StructureManager.js';
import { EnvironmentManager } from './environment/EnvironmentManager.js';
import { InteractiveObjectManager } from './interactive/InteractiveObjectManager.js';
import { ZoneManager } from './zones/ZoneManager.js';
import { LightingManager } from './lighting/LightingManager.js';
import { FogManager } from './environment/FogManager.js';
import { TeleportManager } from './teleport/TeleportManager.js';

/**
 * Main World Manager class that coordinates all world-related systems
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
        
        console.debug("World initialization complete");
        return true;
    }
    
    /**
     * Update the world based on player position
     * @param {THREE.Vector3} playerPosition - The player's current position
     * @param {number} drawDistanceMultiplier - Multiplier for draw distance
     */
    updateWorldForPlayer(playerPosition, drawDistanceMultiplier = 1.0) {
        // Apply low performance mode if needed
        const effectiveDrawDistance = this.lowPerformanceMode ? 
            Math.min(0.6, drawDistanceMultiplier) : drawDistanceMultiplier;
        
        // Calculate which terrain chunk the player is in
        const terrainChunkSize = this.terrainManager.terrainChunkSize;
        const playerChunkX = Math.floor(playerPosition.x / terrainChunkSize);
        const playerChunkZ = Math.floor(playerPosition.z / terrainChunkSize);
        
        // Update terrain chunks with potentially reduced draw distance
        this.terrainManager.updateForPlayer(playerPosition, effectiveDrawDistance);
        
        // Update environment objects with potentially reduced draw distance
        this.environmentManager.updateForPlayer(playerPosition, effectiveDrawDistance);
        
        // IMPROVED: Ensure structures are generated for a larger area around the player
        // This helps fix the issue where structures weren't showing up when moving away from center
        if (this.structureManager) {
            // Generate structures for a wider area around the player (increased from 1 to 3 chunks in each direction)
            const structureGenDistance = 3; // Increased from 1 to 3
            for (let x = playerChunkX - structureGenDistance; x <= playerChunkX + structureGenDistance; x++) {
                for (let z = playerChunkZ - structureGenDistance; z <= playerChunkZ + structureGenDistance; z++) {
                    const chunkKey = `${x},${z}`;
                    if (!this.structureManager.structuresPlaced[chunkKey]) {
                        this.structureManager.generateStructuresForChunk(x, z);
                    }
                }
            }
        }
        
        // Update lighting to follow player
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
            
            // Force cleanup of distant terrain chunks and enemies when player moves significant distance
            // This ensures memory is properly released during long-distance travel
            if (distanceMoved >= this.screenSpawnDistance * 3) {
                console.debug(`Player moved significant distance (${distanceMoved.toFixed(1)}), forcing terrain and enemy cleanup`);
                
                // Clean up terrain
                this.terrainManager.clearDistantChunks(playerChunkX, playerChunkZ);
                
                // Clean up structures that are far from the player
                this.cleanupDistantStructures(playerChunkX, playerChunkZ);
                
                // Clean up environment objects
                // Use the existing updateForPlayer method which handles cleanup internally
                if (this.environmentManager) {
                    this.environmentManager.updateForPlayer(playerPosition, this.drawDistanceMultiplier);
                }
                
                // Clean up enemies
                if (this.game && this.game.enemyManager) {
                    this.game.enemyManager.cleanupDistantEnemies();
                }
                
                // Force garbage collection hint
                this.hintGarbageCollection();
            }
        }
        
        // Update fog using the FogManager
        if (this.fogManager) {
            // Get delta time from game if available
            const deltaTime = this.game && this.game.clock ? this.game.clock.getDelta() : 0.016;
            
            // Update fog with player position and delta time
            this.fogManager.update(deltaTime, playerPosition);
            
            // Pass draw distance multiplier to fog manager for density adjustments
            if (this.game && this.game.performanceManager) {
                const drawDistanceMultiplier = this.game.performanceManager.getDrawDistanceMultiplier();
                // The fog manager will handle density adjustments internally
            }
        }
        
        // Update teleport portals
        if (this.teleportManager) {
            // Get delta time from game if available
            const deltaTime = this.game && this.game.clock ? this.game.clock.getDelta() : 0.016;
            
            // Update teleport portals with player position and delta time
            this.teleportManager.update(deltaTime, playerPosition);
        }
        
        // Periodically check memory and performance
        this.manageMemoryAndPerformance();
    }
    
    /**
     * Clean up structures that are far from the player
     * @param {number} playerChunkX - Player's chunk X coordinate
     * @param {number} playerChunkZ - Player's chunk Z coordinate
     */
    cleanupDistantStructures(playerChunkX, playerChunkZ) {
        try {
            // Make sure structure manager is available and initialized
            if (!this.structureManager || !this.structureManager.structuresPlaced) {
                return;
            }
            
            // FIXED: Significantly increased view distance for structures to ensure they're visible from much farther away
            // This fixes the issue where structures completely disappear when moving far away
            const maxViewDistance = this.terrainManager.terrainChunkViewDistance + 10; // Increased from +4 to +10
            
            // Check all structure chunks
            for (const chunkKey in this.structureManager.structuresPlaced) {
                // Parse chunk coordinates
                const [chunkX, chunkZ] = chunkKey.split(',').map(Number);
                
                // Calculate distance from player chunk
                const distX = Math.abs(chunkX - playerChunkX);
                const distZ = Math.abs(chunkZ - playerChunkZ);
                
                // If chunk is too far away, remove its structures
                if (distX > maxViewDistance || distZ > maxViewDistance) {
                    this.structureManager.removeStructuresInChunk(chunkKey, true);
                }
            }
        } catch (error) {
            console.warn("Error cleaning up distant structures:", error);
        }
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