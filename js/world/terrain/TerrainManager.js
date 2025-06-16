import * as THREE from 'three';
import { TERRAIN_CONFIG } from '../../config/terrain.js';
import { TerrainChunkManager } from './TerrainChunkManager.js';
import { TerrainColoringManager } from './TerrainColoringManager.js';
import { TerrainQueueManager } from './TerrainQueueManager.js';
import { TerrainTemplateManager } from './TerrainTemplateManager.js';
import { TerrainCleanupManager } from './TerrainCleanupManager.js';

/**
 * Manages terrain generation and rendering
 * Main orchestrator class that coordinates all terrain-related functionality
 */
export class TerrainManager {
    constructor(scene, worldManager, game = null) {
        this.scene = scene;
        this.worldManager = worldManager;
        this.game = game;
        
        // Get world scale for consistent scaling
        const worldScale = this.worldManager.worldScale || 1.0;
        
        // Terrain properties from config
        this.terrainSize = TERRAIN_CONFIG.size * worldScale; // Scale base terrain with world scale
        this.terrainResolution = TERRAIN_CONFIG.resolution;
        this.terrainHeight = TERRAIN_CONFIG.height;
        
        // For terrain chunks from config - scale with world scale for performance
        this.terrainChunkSize = TERRAIN_CONFIG.chunkSize * worldScale;
        this.terrainChunkViewDistance = Math.max(1, Math.floor(TERRAIN_CONFIG.chunkViewDistance / worldScale)); // Reduce view distance with scaling
        
        // For terrain buffering (pre-rendering) from config - scale appropriately
        this.terrainBufferDistance = Math.max(1, Math.floor(TERRAIN_CONFIG.bufferDistance / worldScale));
        
        // Log the terrain scaling adjustments
        if (worldScale !== 1.0) {
            console.log(`🌍 Terrain scaling applied (${worldScale}x):`, {
                originalChunkSize: TERRAIN_CONFIG.chunkSize,
                scaledChunkSize: this.terrainChunkSize,
                originalViewDistance: TERRAIN_CONFIG.chunkViewDistance,
                scaledViewDistance: this.terrainChunkViewDistance,
                originalBufferDistance: TERRAIN_CONFIG.bufferDistance,
                scaledBufferDistance: this.terrainBufferDistance
            });
        }

        // Base terrain
        this.terrain = null;
        
        // Flag to prevent terrain vibration on first load
        this.initialTerrainCreated = false;
        
        // Initialize managers
        this.coloringManager = new TerrainColoringManager();
        this.templateManager = new TerrainTemplateManager();
        
        // Create scaled terrain config for optimized performance with world scaling
        const scaledTerrainConfig = {
            ...TERRAIN_CONFIG,
            chunkSize: this.terrainChunkSize,
            chunkViewDistance: this.terrainChunkViewDistance,
            bufferDistance: this.terrainBufferDistance
        };
        
        this.chunkManager = new TerrainChunkManager(
            scene, 
            worldManager, 
            scaledTerrainConfig, 
            this.templateManager, 
            this.coloringManager
        );
        this.queueManager = new TerrainQueueManager(this.chunkManager, scaledTerrainConfig);
        this.cleanupManager = new TerrainCleanupManager(scene, worldManager, scaledTerrainConfig);
        
        // Set game reference for queue manager
        if (game) {
            this.queueManager.setGame(game);
        }
    }
    
    /**
     * Initialize the terrain system
     * @returns {Promise<boolean>} - True if initialization was successful
     */
    async init() {
        // Create base terrain
        await this.createBaseTerrain();
        
        // Set flag to indicate initial terrain is created
        this.initialTerrainCreated = true;
        
        // Initialize the first chunks around the player
        this.updateForPlayer(new THREE.Vector3(0, 0, 0));
        
        // Wait for initial terrain chunks to be fully generated
        await this.queueManager.waitForInitialTerrainGeneration();
        
        return true;
    }
    
    /**
     * Create the base flat terrain
     * @returns {Promise<void>}
     */
    async createBaseTerrain() {
        // Create the base terrain at the center (0,0) using the unified terrain creation method
        const terrain = this.chunkManager.createTerrainMesh(
            0, // Center X
            0, // Center Z
            this.terrainSize, // Use terrainSize for the base terrain
            this.terrainResolution - 1, // Use slightly lower resolution for base terrain
            true, // Is base terrain
            new THREE.Vector3(0, 0, 0) // Position at center
        );
        
        // Store reference to the base terrain
        this.terrain = terrain;
        
        console.debug("Flat terrain created and added to scene");
    }
    
    /**
     * Update terrain based on player position
     * @param {THREE.Vector3} playerPosition - The player's current position
     * @param {number} drawDistanceMultiplier - Multiplier for draw distance
     */
    updateForPlayer(playerPosition, drawDistanceMultiplier = 1.0) {
        // Get the terrain chunk coordinates for the player's position
        const terrainChunkX = Math.floor(playerPosition.x / this.terrainChunkSize);
        const terrainChunkZ = Math.floor(playerPosition.z / this.terrainChunkSize);
        
        // Update player movement tracking in queue manager
        this.queueManager.updatePlayerMovement(terrainChunkX, terrainChunkZ);
        
        // Update terrain chunks
        this.updateTerrainChunks(terrainChunkX, terrainChunkZ, drawDistanceMultiplier);
    }
    
    /**
     * Update visible terrain chunks based on player position
     * @param {number} centerX - Center X chunk coordinate
     * @param {number} centerZ - Center Z chunk coordinate
     * @param {number} drawDistanceMultiplier - Multiplier for draw distance
     */
    updateTerrainChunks(centerX, centerZ, drawDistanceMultiplier = 1.0) {
        // Update terrain chunks through chunk manager
        const { newVisibleTerrainChunks, viewDistance } = this.chunkManager.updateTerrainChunks(
            centerX, 
            centerZ, 
            drawDistanceMultiplier
        );
        
        // Queue terrain chunks for buffering (prioritize in the direction of movement)
        this.queueManager.queueTerrainChunksForBuffering(
            centerX, 
            centerZ, 
            this.chunkManager.visibleTerrainChunks,
            this.chunkManager.terrainBuffer,
            this.chunkManager.terrainChunks
        );
        
        // Check if queue processing should start
        if (this.queueManager.shouldProcessQueue()) {
            this.queueManager.processTerrainGenerationQueue();
        }
        
        // Handle chunk visibility changes
        this.chunkManager.handleChunkVisibilityChanges(
            newVisibleTerrainChunks, 
            centerX, 
            centerZ, 
            viewDistance
        );
        
        // Periodically check buffer for chunks that are too far away
        // This helps prevent buffer from growing too large during long-distance travel
        if (Math.random() < 0.1) { // 10% chance each update to check buffer
            this.cleanupManager.cleanupBufferChunks(
                centerX, 
                centerZ, 
                viewDistance, 
                this.chunkManager.terrainBuffer
            );
        }
    }
    
    /**
     * Get the terrain height at a specific world position
     * @param {number} x - X coordinate
     * @param {number} z - Z coordinate
     * @returns {number} - The height of the terrain at the specified position
     */
    getTerrainHeight(x, z) {
        return this.chunkManager.getTerrainHeight(x, z);
    }
    
    /**
     * Clear all terrain objects
     */
    clear() {
        // Clear through cleanup manager
        this.cleanupManager.clearAll(
            this.chunkManager.terrainChunks,
            this.chunkManager.terrainBuffer,
            this.terrain
        );
        
        // Clear managers
        this.chunkManager.clear();
        this.queueManager.clear();
        this.templateManager.clear();
        
        // Reset terrain reference
        this.terrain = null;
        this.initialTerrainCreated = false;
    }
    
    /**
     * Clear distant terrain chunks to free memory
     * @param {number} playerChunkX - Player's chunk X coordinate (optional)
     * @param {number} playerChunkZ - Player's chunk Z coordinate (optional)
     * @param {number} maxDistance - Maximum distance from player to keep chunks (defaults to 2x view distance)
     */
    clearDistantChunks(playerChunkX, playerChunkZ, maxDistance) {
        this.cleanupManager.clearDistantChunks(
            playerChunkX,
            playerChunkZ,
            maxDistance,
            this.chunkManager.terrainChunks,
            this.chunkManager.terrainBuffer,
            this.queueManager.terrainGenerationQueue
        );
    }
    
    /**
     * Save terrain state
     * @returns {object} - The saved terrain state
     */
    save() {
        return this.chunkManager.save();
    }
    
    /**
     * Load terrain state
     * @param {object} terrainState - The terrain state to load
     */
    load(terrainState) {
        this.chunkManager.load(terrainState);
    }

    // Legacy methods for backward compatibility
    
    /**
     * Apply terrain coloring based on zone type with natural variations
     * @param {THREE.Mesh} terrain - The terrain mesh to color
     * @param {string} zoneType - The type of zone (Forest, Desert, etc.)
     * @param {Object} themeColors - Optional theme colors from loaded map
     */
    colorTerrainUniform(terrain, zoneType = 'Terrant', themeColors = null) {
        this.coloringManager.colorTerrainUniform(terrain, zoneType, themeColors);
    }

    /**
     * Create a terrain chunk at the specified coordinates
     * @param {number} chunkX - X chunk coordinate
     * @param {number} chunkZ - Z chunk coordinate
     * @returns {THREE.Mesh} - The created terrain chunk
     */
    createTerrainChunk(chunkX, chunkZ) {
        return this.chunkManager.createTerrainChunk(chunkX, chunkZ);
    }

    /**
     * Create a new terrain chunk from scratch
     * @param {number} chunkX - X chunk coordinate
     * @param {number} chunkZ - Z chunk coordinate
     * @returns {THREE.Mesh} - The created terrain chunk
     */
    createNewTerrainChunk(chunkX, chunkZ) {
        return this.chunkManager.createNewTerrainChunk(chunkX, chunkZ);
    }

    /**
     * Create a terrain chunk from saved data
     * @param {number} chunkX - X chunk coordinate
     * @param {number} chunkZ - Z chunk coordinate
     * @param {object} chunkData - Saved chunk data
     * @returns {THREE.Mesh} - The created terrain chunk
     */
    createTerrainChunkFromSavedData(chunkX, chunkZ, chunkData) {
        return this.chunkManager.createTerrainChunkFromSavedData(chunkX, chunkZ, chunkData);
    }

    /**
     * Create a terrain chunk for the buffer (not immediately visible)
     * @param {number} chunkX - X chunk coordinate
     * @param {number} chunkZ - Z chunk coordinate
     */
    createBufferedTerrainChunk(chunkX, chunkZ) {
        this.chunkManager.createBufferedTerrainChunk(chunkX, chunkZ);
    }

    /**
     * Convert a buffered placeholder to a real chunk when needed
     * @param {string} chunkKey - The chunk key
     */
    convertPlaceholderToRealChunk(chunkKey) {
        this.chunkManager.convertPlaceholderToRealChunk(chunkKey);
    }

    /**
     * Remove a terrain chunk and associated objects
     * @param {string} chunkKey - The chunk key
     * @param {boolean} cleanupAssociatedObjects - Whether to clean up associated objects (structures, environment)
     */
    removeTerrainChunk(chunkKey, cleanupAssociatedObjects = true) {
        this.cleanupManager.removeTerrainChunk(
            chunkKey, 
            this.chunkManager.terrainChunks, 
            cleanupAssociatedObjects
        );
    }

    /**
     * Create a unified terrain mesh for both base terrain and chunks
     * @param {number} x - X coordinate (chunk or world)
     * @param {number} z - Z coordinate (chunk or world)
     * @param {number} size - Size of the terrain mesh
     * @param {number} resolution - Resolution of the terrain mesh
     * @param {boolean} isBaseTerrain - Whether this is the base terrain or a chunk
     * @param {THREE.Vector3} position - Position to place the terrain
     * @returns {THREE.Mesh} - The created terrain mesh
     */
    createTerrainMesh(x, z, size, resolution, isBaseTerrain = false, position = null) {
        return this.chunkManager.createTerrainMesh(x, z, size, resolution, isBaseTerrain, position);
    }

    // Getters for accessing internal state (for backward compatibility)
    get terrainChunks() {
        return this.chunkManager.terrainChunks;
    }

    get visibleTerrainChunks() {
        return this.chunkManager.visibleTerrainChunks;
    }

    get terrainBuffer() {
        return this.chunkManager.terrainBuffer;
    }

    get terrainGenerationQueue() {
        return this.queueManager.terrainGenerationQueue;
    }

    get isProcessingTerrainQueue() {
        return this.queueManager.isProcessingTerrainQueue;
    }
}