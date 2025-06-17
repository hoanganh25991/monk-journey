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

// Constants for performance optimization
const CHUNK_PROCESSING_BUDGET_MS = 5; // Maximum time to spend processing chunks per frame
const MAX_OBJECTS_PER_CHUNK = 30; // Maximum number of objects per chunk
const MAX_STRUCTURES_PER_CHUNK = 2; // Maximum number of structures per chunk
const OBJECT_POOL_SIZE = 200; // Size of object pool for recycling
const GENERATION_THROTTLE_MS = 50; // Minimum time between generation operations
const CLEANUP_DISTANCE_MULTIPLIER = 1.5; // Multiplier for cleanup distance

/**
 * Main World Manager class that coordinates all world-related systems
 * Optimized for performance with object pooling, throttling, and spatial partitioning
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
        
        // Performance optimization - Object pooling
        this.objectPools = new Map(); // Map of object type to pool of reusable objects
        this.pendingChunks = []; // Queue of chunks waiting to be processed
        this.processingChunk = false; // Flag to prevent concurrent chunk processing
        this.lastChunkProcessTime = 0; // Last time a chunk was processed
        
        // Memory management
        this.lastMemoryCheck = Date.now();
        this.memoryCheckInterval = 10000; // Check every 10 seconds
        this.lastGarbageCollection = Date.now();
        this.gcInterval = 30000; // Force GC hint every 30 seconds
        
        // Performance tracking for LOD adjustments
        this.lastPerformanceLevel = null; // Track last performance level to detect changes
        
        // Performance monitoring
        this.frameRateHistory = [];
        this.frameRateHistoryMaxLength = 30; // Reduced from 60 to 30 frames
        this.lastPerformanceAdjustment = Date.now();
        this.performanceAdjustmentInterval = 5000; // Adjust every 5 seconds
        this.lowPerformanceMode = false;
        
        // Spatial partitioning for faster object lookup
        this.spatialGrid = new Map(); // Grid-based spatial partitioning
        this.gridCellSize = 50; // Size of each grid cell
        
        // Throttling for generation operations
        this.lastGenerationTime = 0;
        this.generationQueue = []; // Queue of generation operations
        this.isProcessingQueue = false;
        
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
        
        // Procedural generation settings
        this.generatedChunks = new Set(); // Track which chunks have been generated
        this.currentZoneType = 'Forest'; // Current zone type
        this.zoneSize = 500 * this.worldScale; // Scale zone size to maintain proper zone distribution
        this.zoneTransitionBuffer = 20 * this.worldScale; // Scale buffer zone for transitions
        
        // Flag to track initial terrain creation
        this.initialTerrainCreated = false;
        
        // Generation densities per zone type - using environment configuration constants
        // Density values reduced by ~40% for better performance
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
        
        // Dynamic generation settings - reduced for better performance
        this.dynamicGenerationSettings = {
            environmentDensity: 0.6,  // Reduced from 1.2
            structureDensity: 0.4,    // Reduced from 0.8
            enableClusters: false,    // Disabled for better performance
            enableSpecialFeatures: false, // Disabled for better performance
            useThematicAreas: true
        };
        
        // Initialize object pools
        this.initializeObjectPools();
    }
    
    /**
     * Initialize object pools for reusing objects
     * This significantly reduces garbage collection and improves performance
     */
    initializeObjectPools() {
        // Create pools for common environment objects
        const commonTypes = [
            'tree', 'bush', 'rock', 'flower', 'grass',
            'mushroom', 'fern', 'fallen_log'
        ];
        
        commonTypes.forEach(type => {
            this.objectPools.set(type, []);
        });
        
        console.debug('✅ Object pools initialized');
    }
    
    /**
     * Initialize dynamic generators safely with performance controls
     * @returns {Promise<boolean>} - Promise that resolves when initialization is complete
     */
    initializeDynamicGenerators() {
        console.debug('🔄 Initializing dynamic generators...');
        
        // Check if already initialized
        if (this.dynamicEnvironmentGenerator && this.dynamicStructureGenerator) {
            console.debug('✅ Dynamic generators already initialized');
            return Promise.resolve(true);
        }
        
        // Return a promise that resolves when initialization is complete
        return new Promise((resolve) => {
            // Use requestAnimationFrame to ensure we don't block the main thread
            requestAnimationFrame(() => {
                try {
                    // Initialize environment generator if possible
                    if (this.environmentManager && this.environmentManager.environmentFactory) {
                        // Use a lightweight wrapper instead of a full generator
                        this.dynamicEnvironmentGenerator = {
                            generate: (position, radius, density) => {
                                // Queue generation for later processing instead of immediate execution
                                this.queueEnvironmentGeneration(position, radius, density);
                                return Promise.resolve(true);
                            },
                            getVegetation: () => {
                                return this.environmentManager.trees || [];
                            },
                            getObjectsByCategory: (category) => {
                                return [];
                            },
                            getAllObjects: () => {
                                return this.environmentManager.environmentObjects || [];
                            }
                        };
                        console.debug('✅ Dynamic Environment Generator initialized');
                    } else {
                        console.warn('⚠️ Environment factory not available for dynamic generator');
                    }
                    
                    // Initialize structure generator if possible
                    if (this.structureManager) {
                        // Use a lightweight wrapper instead of a full generator
                        this.dynamicStructureGenerator = {
                            generate: (position, radius, density) => {
                                // Queue generation for later processing instead of immediate execution
                                this.queueStructureGeneration(position, radius, density);
                                return Promise.resolve(true);
                            },
                            getAllStructures: () => {
                                return this.structureManager.structures || [];
                            }
                        };
                        console.debug('✅ Dynamic Structure Generator initialized');
                    }
                    
                    // Set conservative default settings to prevent freezes
                    this.dynamicGenerationSettings = {
                        environmentDensity: 0.2,     // Lower density for better performance
                        structureDensity: 0.05,      // Lower structure density
                        enableClusters: false,       // Disable clusters initially
                        enableSpecialFeatures: false, // Disable special features initially
                        useThematicAreas: false      // Disable thematic areas initially
                    };
                    
                    console.debug('✅ Dynamic generators initialized with safe settings');
                    resolve(true);
                } catch (error) {
                    console.error('❌ Error initializing dynamic generators:', error);
                    resolve(false);
                }
            });
        });
    }
    
    /**
     * Queue environment generation for later processing
     * This prevents blocking the main thread during generation
     * @param {THREE.Vector3} position - Center position for generation
     * @param {number} radius - Radius around position to generate
     * @param {number} density - Density multiplier
     */
    queueEnvironmentGeneration(position, radius, density) {
        this.generationQueue.push({
            type: 'environment',
            position: position.clone(),
            radius,
            density,
            timestamp: Date.now()
        });
        
        // Start processing the queue if not already processing
        if (!this.isProcessingQueue) {
            this.processGenerationQueue();
        }
    }
    
    /**
     * Queue structure generation for later processing
     * @param {THREE.Vector3} position - Center position for generation
     * @param {number} radius - Radius around position to generate
     * @param {number} density - Density multiplier
     */
    queueStructureGeneration(position, radius, density) {
        this.generationQueue.push({
            type: 'structure',
            position: position.clone(),
            radius,
            density,
            timestamp: Date.now()
        });
        
        // Start processing the queue if not already processing
        if (!this.isProcessingQueue) {
            this.processGenerationQueue();
        }
    }
    
    /**
     * Process the generation queue in small batches to prevent frame drops
     */
    processGenerationQueue() {
        // Set flag to prevent concurrent processing
        this.isProcessingQueue = true;
        
        // Check if we need to throttle generation
        const now = Date.now();
        if (now - this.lastGenerationTime < GENERATION_THROTTLE_MS) {
            // Schedule next processing after throttle time
            setTimeout(() => this.processGenerationQueue(), 
                GENERATION_THROTTLE_MS - (now - this.lastGenerationTime));
            return;
        }
        
        // Process one item from the queue
        if (this.generationQueue.length > 0) {
            const item = this.generationQueue.shift();
            
            // Skip items that are too old (more than 2 seconds)
            if (now - item.timestamp > 2000) {
                // Continue processing the queue
                if (this.generationQueue.length > 0) {
                    requestAnimationFrame(() => this.processGenerationQueue());
                } else {
                    this.isProcessingQueue = false;
                }
                return;
            }
            
            // Process the item based on type
            if (item.type === 'environment') {
                this.generateEnvironmentBatch(item.position, item.radius, item.density);
            } else if (item.type === 'structure') {
                this.generateStructureBatch(item.position, item.radius, item.density);
            }
            
            // Update last generation time
            this.lastGenerationTime = Date.now();
            
            // Continue processing the queue with a small delay
            if (this.generationQueue.length > 0) {
                setTimeout(() => this.processGenerationQueue(), 10);
            } else {
                this.isProcessingQueue = false;
            }
        } else {
            this.isProcessingQueue = false;
        }
    }
    
    /**
     * Generate a small batch of environment objects
     * @param {THREE.Vector3} position - Center position
     * @param {number} radius - Radius around position
     * @param {number} density - Density multiplier
     */
    generateEnvironmentBatch(position, radius, density) {
        // Determine zone type at position
        const zoneType = this.getZoneTypeAt(position.x, position.z);
        const zoneDensity = this.zoneDensities[zoneType];
        
        if (!zoneDensity) return;
        
        // Calculate chunk coordinates
        const chunkSize = this.terrainManager.terrainChunkSize;
        const chunkX = Math.floor(position.x / chunkSize);
        const chunkZ = Math.floor(position.z / chunkSize);
        
        // Generate a small batch of objects (max 5 per call)
        const maxObjects = 5;
        const effectiveDensity = density * zoneDensity.environment * 0.2; // Further reduce density
        
        // Calculate number of objects to generate
        const objectCount = Math.min(maxObjects, Math.floor(radius * effectiveDensity / 10));
        
        // Generate objects
        for (let i = 0; i < objectCount; i++) {
            // Random position within radius
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * radius;
            const x = position.x + Math.cos(angle) * distance;
            const z = position.z + Math.sin(angle) * distance;
            
            // Select object type from zone's environment types
            const objectType = this.selectRandomObjectType(zoneDensity.environmentTypes);
            
            // Create object with reduced scale for better performance
            const scale = 0.5 + Math.random() * 0.5; // Scale between 0.5 and 1.0
            
            // Try to get object from pool first
            const object = this.getObjectFromPool(objectType) || 
                this.environmentManager.createEnvironmentObject(objectType, x, z, scale);
            
            if (object) {
                // Add to environment objects tracking
                this.addEnvironmentObject(object, objectType, x, z, scale, chunkX, chunkZ);
            }
        }
    }
    
    /**
     * Get an object from the pool or return null if none available
     * @param {string} type - Object type
     * @returns {Object|null} - Object from pool or null
     */
    getObjectFromPool(type) {
        // Get simplified type for pooling
        const poolType = this.getPoolTypeForObject(type);
        
        // Check if we have a pool for this type
        if (!this.objectPools.has(poolType)) {
            return null;
        }
        
        // Get pool for this type
        const pool = this.objectPools.get(poolType);
        
        // Return object from pool if available
        if (pool.length > 0) {
            return pool.pop();
        }
        
        return null;
    }
    
    /**
     * Return an object to the pool for reuse
     * @param {Object} object - Object to return to pool
     * @param {string} type - Object type
     */
    returnObjectToPool(object, type) {
        // Get simplified type for pooling
        const poolType = this.getPoolTypeForObject(type);
        
        // Check if we have a pool for this type
        if (!this.objectPools.has(poolType)) {
            return;
        }
        
        // Get pool for this type
        const pool = this.objectPools.get(poolType);
        
        // Only add to pool if not full
        if (pool.length < OBJECT_POOL_SIZE) {
            // Reset object properties
            if (object.position) {
                object.position.set(0, -1000, 0); // Move below terrain
            }
            
            // Add to pool
            pool.push(object);
        } else {
            // Dispose object if pool is full
            this.disposeObject(object);
        }
    }
    
    /**
     * Get pool type for object (simplifies object types for pooling)
     * @param {string} objectType - Original object type
     * @returns {string} - Simplified pool type
     */
    getPoolTypeForObject(objectType) {
        // Convert to lowercase for consistency
        const type = String(objectType).toLowerCase();
        
        // Map specific types to general categories
        if (type.includes('tree')) return 'tree';
        if (type.includes('bush')) return 'bush';
        if (type.includes('rock')) return 'rock';
        if (type.includes('flower')) return 'flower';
        if (type.includes('grass')) return 'grass';
        if (type.includes('mushroom')) return 'mushroom';
        if (type.includes('fern')) return 'fern';
        if (type.includes('log')) return 'fallen_log';
        
        // Default to original type
        return type;
    }
    
    /**
     * Generate a small batch of structures
     * @param {THREE.Vector3} position - Center position
     * @param {number} radius - Radius around position
     * @param {number} density - Density multiplier
     */
    generateStructureBatch(position, radius, density) {
        // Determine zone type at position
        const zoneType = this.getZoneTypeAt(position.x, position.z);
        const zoneDensity = this.zoneDensities[zoneType];
        
        if (!zoneDensity) return;
        
        // Calculate chunk coordinates
        const chunkSize = this.terrainManager.terrainChunkSize;
        const chunkX = Math.floor(position.x / chunkSize);
        const chunkZ = Math.floor(position.z / chunkSize);
        
        // Only generate structures with low probability
        if (Math.random() > zoneDensity.structures * density * 0.2) return;
        
        // Generate at most one structure per batch
        // Random position within radius
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * radius;
        const x = position.x + Math.cos(angle) * distance;
        const z = position.z + Math.sin(angle) * distance;
        
        // Select structure type from zone's structure types
        const structureType = zoneDensity.structureTypes[
            Math.floor(Math.random() * zoneDensity.structureTypes.length)
        ];
        
        // Create a simple structure with minimal complexity
        let structure = null;
        
        switch (structureType) {
            case 'house':
                // Create a very simple house
                structure = this.structureManager.createBuilding(x, z, 3, 3, 2);
                break;
            case 'ruins':
                structure = this.structureManager.createRuins(x, z);
                break;
            default:
                // Skip other structure types for performance
                return;
        }
        
        if (structure) {
            // Add random rotation
            structure.rotation.y = Math.random() * Math.PI * 2;
            
            // Add to structures tracking
            this.structureManager.structures.push({
                type: structureType,
                object: structure,
                position: new THREE.Vector3(x, this.terrainManager.getTerrainHeight(x, z), z),
                chunkKey: `${chunkX},${chunkZ}`
            });
            
            // Mark chunk as having structures
            this.structureManager.structuresPlaced[`${chunkX},${chunkZ}`] = true;
        }
    }
    
    /**
     * Add environment object to tracking and spatial grid
     * @param {Object} object - Environment object
     * @param {string} objectType - Object type
     * @param {number} x - X coordinate
     * @param {number} z - Z coordinate
     * @param {number} scale - Object scale
     * @param {number} chunkX - Chunk X coordinate
     * @param {number} chunkZ - Chunk Z coordinate
     */
    addEnvironmentObject(object, objectType, x, z, scale, chunkX, chunkZ) {
        // Add random rotation
        if (object.rotation) {
            object.rotation.y = Math.random() * Math.PI * 2;
        }
        
        // Get terrain height at position
        const y = this.terrainManager.getTerrainHeight(x, z);
        
        // Create object info
        const objectInfo = {
            type: objectType,
            object: object,
            position: new THREE.Vector3(x, y, z),
            scale: scale,
            chunkKey: `${chunkX},${chunkZ}`
        };
        
        // Add to environment objects tracking
        this.environmentManager.environmentObjects.push(objectInfo);
        
        // Add to type-specific collections
        this.environmentManager.addToTypeCollection(objectType, object);
        
        // Add to spatial grid for faster lookup
        this.addToSpatialGrid(objectInfo);
    }
    
    /**
     * Add object to spatial grid for faster lookup
     * @param {Object} objectInfo - Object info with position
     */
    addToSpatialGrid(objectInfo) {
        if (!objectInfo.position) return;
        
        // Calculate grid cell coordinates
        const cellX = Math.floor(objectInfo.position.x / this.gridCellSize);
        const cellZ = Math.floor(objectInfo.position.z / this.gridCellSize);
        const cellKey = `${cellX},${cellZ}`;
        
        // Get or create cell
        if (!this.spatialGrid.has(cellKey)) {
            this.spatialGrid.set(cellKey, []);
        }
        
        // Add object to cell
        this.spatialGrid.get(cellKey).push(objectInfo);
    }
    
    /**
     * Select a random object type from an array of types
     * @param {Array} types - Array of object types
     * @returns {string} - Selected object type
     */
    selectRandomObjectType(types) {
        if (!types || types.length === 0) {
            return 'tree'; // Default to tree if no types available
        }
        
        return types[Math.floor(Math.random() * types.length)];
    }
    
    /**
     * Initialize dynamic generators with custom settings
     * @param {Object} settings - Custom generation settings
     * @returns {Promise<boolean>} - Promise that resolves when initialization is complete
     */
    async initializeDynamicGeneratorsWithSettings(settings = {}) {
        // First initialize with default settings
        await this.initializeDynamicGenerators();
        
        // Then apply custom settings with safety limits
        this.dynamicGenerationSettings = {
            environmentDensity: Math.min(settings.environmentDensity || 0.2, 0.4),
            structureDensity: Math.min(settings.structureDensity || 0.05, 0.1),
            enableClusters: false, // Always disable clusters for performance
            enableSpecialFeatures: false, // Always disable special features for performance
            useThematicAreas: settings.useThematicAreas || false
        };
        
        console.debug('✅ Dynamic generators initialized with custom settings:', this.dynamicGenerationSettings);
        return true;
    }
    
    /**
     * Set environment density level
     * @param {string} level - Density level: 'high', 'medium', 'low', or 'minimal'
     */
    setDensityLevel(level) {
        if (!this.densityLevels[level]) {
            console.warn(`Invalid density level: ${level}. Using 'medium' instead.`);
            level = 'medium';
        }
        
        this.environmentDensity = this.densityLevels[level];
        console.debug(`Environment density set to ${level} (${this.environmentDensity})`);
        
        // Update environment manager if available
        if (this.environmentManager && this.environmentManager.setDensity) {
            this.environmentManager.setDensity(this.environmentDensity);
        }
        
        return this.environmentDensity;
    }
    
    /**
     * Determine zone type based on world position
     * @param {number} x - World X coordinate
     * @param {number} z - World Z coordinate
     * @returns {string} - Zone type
     */
    getZoneTypeAt(x, z) {
        // Simple zone determination based on position
        // Creates a pattern of different zones across the world
        const zoneX = Math.floor(x / this.zoneSize);
        const zoneZ = Math.floor(z / this.zoneSize);
        
        // Use a simple hash to determine zone type
        const hash = Math.abs(zoneX * 73 + zoneZ * 127) % 5;
        const zoneTypes = ['Forest', 'Desert', 'Mountain', 'Swamp', 'Magical'];
        
        return zoneTypes[hash];
    }
    
    /**
     * Generate procedural content for a terrain chunk
     * @param {number} chunkX - Chunk X coordinate
     * @param {number} chunkZ - Chunk Z coordinate
     */
    generateChunkContent(chunkX, chunkZ) {
        // Otherwise use legacy chunk generation
        return this.generateLegacyChunkContent(chunkX, chunkZ);
    }
    
    /**
     * Generate environment objects for a chunk
     * @param {number} chunkX - Chunk X coordinate
     * @param {number} chunkZ - Chunk Z coordinate
     * @param {string} zoneType - Zone type
     * @param {object} zoneDensity - Zone density configuration
     */
    generateEnvironmentObjectsForChunk(chunkX, chunkZ, zoneType, zoneDensity) {
        try {
            const chunkSize = this.terrainManager.terrainChunkSize;
            const worldX = chunkX * chunkSize;
            const worldZ = chunkZ * chunkSize;
            
            // Calculate number of objects based on density - but with a lower base count
            const baseObjectCount = Math.floor(chunkSize * chunkSize / 100); // Reduced base density by 50%
            const objectCount = Math.floor(baseObjectCount * zoneDensity.environment * this.environmentDensity);
            
            // Cap the maximum number of objects per chunk to prevent performance issues
            const maxObjectsPerChunk = 50;
            const cappedObjectCount = Math.min(objectCount, maxObjectsPerChunk);
            
            console.debug(`Generating ${cappedObjectCount} environment objects for chunk ${chunkX},${chunkZ} (${zoneType})`);
            
            // Create clusters of objects for more natural grouping
            const clusterCount = Math.max(1, Math.floor(cappedObjectCount / 10)); // Create clusters of objects
            const objectsPerCluster = Math.floor(cappedObjectCount / clusterCount);
            const remainingObjects = cappedObjectCount - (clusterCount * objectsPerCluster);
            
            // Get theme-specific objects for this zone type
            const themeObjects = this.getThemeSpecificObjects(zoneType);
            
            // Generate clusters
            for (let c = 0; c < clusterCount; c++) {
                // Random cluster center within chunk
                const clusterCenterX = worldX + Math.random() * chunkSize;
                const clusterCenterZ = worldZ + Math.random() * chunkSize;
                
                // Random cluster radius
                const clusterRadius = 3 + Math.random() * 7;
                
                // Select a primary object type for this cluster that can form clusters
                const clusterableObjects = themeObjects.filter(obj => obj.canCluster);
                let primaryClusterObject = null;
                
                if (clusterableObjects.length > 0) {
                    // Select a random clusterable object based on weight
                    primaryClusterObject = this.selectWeightedObject(clusterableObjects);
                }
                
                // Generate objects in this cluster
                for (let i = 0; i < objectsPerCluster; i++) {
                    // Random angle and distance from cluster center
                    const angle = Math.random() * Math.PI * 2;
                    // Minimum distance to ensure objects aren't too close together
                    const minDistance = clusterRadius * 0.2; // At least 20% of radius
                    const distance = minDistance + Math.random() * (clusterRadius - minDistance);
                    
                    // Calculate position and apply world scale
                    const x = (clusterCenterX + Math.cos(angle) * distance) * this.worldScale;
                    const z = (clusterCenterZ + Math.sin(angle) * distance) * this.worldScale;
                    
                    // Make sure position is within scaled chunk bounds
                    if (x >= worldX * this.worldScale && x < (worldX + chunkSize) * this.worldScale && 
                        z >= worldZ * this.worldScale && z < (worldZ + chunkSize) * this.worldScale) {
                        
                        let objectType;
                        let scale;
                        
                        // Make sure we have valid environment types
                        if (!zoneDensity.environmentTypes || zoneDensity.environmentTypes.length === 0) {
                            console.warn(`No environment types defined for zone ${zoneType}`);
                            continue;
                        }
                        
                        // 70% chance to use the primary cluster object type if available
                        if (primaryClusterObject && Math.random() < 0.7) {
                            objectType = primaryClusterObject.type;
                            // Use the min/max size defined for this object type
                            scale = primaryClusterObject.minSize + 
                                Math.random() * (primaryClusterObject.maxSize - primaryClusterObject.minSize);
                        } else {
                            // Select a weighted object from the theme
                            const selectedObject = this.selectWeightedObject(themeObjects);
                            objectType = selectedObject.type;
                            // Use the min/max size defined for this object type
                            scale = selectedObject.minSize + 
                                Math.random() * (selectedObject.maxSize - selectedObject.minSize);
                        }
                        
                        // Create the object
                        const object = this.environmentManager.createEnvironmentObject(objectType, x, z, scale);
                        
                        if (object && object.rotation) {
                            // Add random rotation for more natural appearance
                            object.rotation.y = Math.random() * Math.PI * 2;
                            
                            // Add to environment objects tracking
                            this.environmentManager.environmentObjects.push({
                                type: objectType,
                                object: object,
                                position: new THREE.Vector3(x, this.terrainManager.getTerrainHeight(x, z), z),
                                scale: scale,
                                chunkKey: `${chunkX},${chunkZ}`
                            });
                            
                            // Add to type-specific collections
                            this.environmentManager.addToTypeCollection(objectType, object);
                        }
                    }
                }
            }
            
            // Generate remaining individual objects - but only if we're not in the initial loading phase
            // This helps reduce the load during initial game startup
            if (this.initialTerrainCreated && remainingObjects > 0) {
                // Limit the number of individual objects to further improve performance
                const maxIndividualObjects = Math.min(remainingObjects, 10);
                
                // Divide the chunk into grid sections to ensure better spacing
                const gridSize = Math.ceil(Math.sqrt(maxIndividualObjects));
                const cellSize = chunkSize / gridSize;
                
                for (let i = 0; i < maxIndividualObjects; i++) {
                    // Calculate grid position
                    const gridX = i % gridSize;
                    const gridZ = Math.floor(i / gridSize);
                    
                    // Add randomness within the grid cell, but ensure objects are spread out
                    const cellX = worldX + (gridX * cellSize);
                    const cellZ = worldZ + (gridZ * cellSize);
                    
                    // Random position within grid cell with padding to ensure spacing
                    const padding = cellSize * 0.2; // 20% padding
                    const x = cellX + padding + Math.random() * (cellSize - 2 * padding);
                    const z = cellZ + padding + Math.random() * (cellSize - 2 * padding);
                    
                    // Select a weighted object from the theme
                    const selectedObject = this.selectWeightedObject(themeObjects);
                    const objectType = selectedObject.type;
                    
                    // Use the min/max size defined for this object type
                    const scale = selectedObject.minSize + 
                        Math.random() * (selectedObject.maxSize - selectedObject.minSize);
                    
                    // Create the object
                    const object = this.environmentManager.createEnvironmentObject(objectType, x, z, scale);
                    
                    if (object && object.rotation) {
                        // Add random rotation
                        object.rotation.y = Math.random() * Math.PI * 2;
                        
                        // Add to environment objects tracking
                        this.environmentManager.environmentObjects.push({
                            type: objectType,
                            object: object,
                            position: new THREE.Vector3(x, this.terrainManager.getTerrainHeight(x, z), z),
                            scale: scale,
                            chunkKey: `${chunkX},${chunkZ}`
                        });
                        
                        // Add to type-specific collections
                        this.environmentManager.addToTypeCollection(objectType, object);
                    }
                }
            }
            
            // Small chance to add special cross-theme features
            if (Math.random() < 0.05) {
                this.addSpecialFeature(worldX, worldZ, chunkSize, zoneType);
            }
        } catch (error) {
            console.error(`Error generating environment objects for chunk ${chunkX},${chunkZ}:`, error);
        }
    }
    
    /**
     * Get theme-specific objects for a zone type
     * @param {string} zoneType - Zone type
     * @returns {Array} - Array of theme-specific objects with their properties
     */
    getThemeSpecificObjects(zoneType) {
        // Start with common objects that appear in all themes
        let objects = [...THEME_SPECIFIC_OBJECTS.COMMON];
        
        // Add theme-specific objects
        switch(zoneType) {
            case 'Forest':
                objects = objects.concat(THEME_SPECIFIC_OBJECTS.FOREST);
                break;
            case 'Desert':
                objects = objects.concat(THEME_SPECIFIC_OBJECTS.DESERT);
                break;
            case 'Mountain':
                objects = objects.concat(THEME_SPECIFIC_OBJECTS.MOUNTAINS);
                break;
            case 'Swamp':
                objects = objects.concat(THEME_SPECIFIC_OBJECTS.SWAMP);
                break;
            case 'Magical':
                // For magical zones, add some objects from all themes plus ruins
                objects = objects.concat(
                    THEME_SPECIFIC_OBJECTS.FOREST.filter(obj => obj.canGlow),
                    THEME_SPECIFIC_OBJECTS.SWAMP.filter(obj => obj.canGlow),
                    THEME_SPECIFIC_OBJECTS.RUINS
                );
                break;
            default:
                // Default to forest if unknown zone type
                objects = objects.concat(THEME_SPECIFIC_OBJECTS.FOREST);
        }
        
        return objects;
    }
    
    /**
     * Select an object from an array based on weight
     * @param {Array} objects - Array of objects with weight property
     * @returns {Object} - Selected object
     */
    selectWeightedObject(objects) {
        if (!objects || objects.length === 0) {
            return null;
        }
        
        // Calculate total weight
        const totalWeight = objects.reduce((sum, obj) => sum + (obj.weight || 1), 0);
        
        // Generate random value between 0 and total weight
        let random = Math.random() * totalWeight;
        
        // Find the object that corresponds to the random value
        for (const obj of objects) {
            random -= (obj.weight || 1);
            if (random <= 0) {
                return obj;
            }
        }
        
        // Fallback to first object if something goes wrong
        return objects[0];
    }
    
    /**
     * Add a special feature to the chunk
     * @param {number} worldX - World X coordinate
     * @param {number} worldZ - World Z coordinate
     * @param {number} chunkSize - Size of the chunk
     * @param {string} zoneType - Zone type
     */
    addSpecialFeature(worldX, worldZ, chunkSize, zoneType) {
        // Get special features for this zone type
        let features = [];
        
        switch(zoneType) {
            case 'Forest':
                features = CROSS_THEME_FEATURES.FOREST;
                break;
            case 'Desert':
                features = CROSS_THEME_FEATURES.DESERT;
                break;
            case 'Mountain':
                features = CROSS_THEME_FEATURES.MOUNTAINS;
                break;
            case 'Swamp':
                features = CROSS_THEME_FEATURES.SWAMP;
                break;
            case 'Magical':
                // For magical zones, combine features from all themes
                features = [
                    ...CROSS_THEME_FEATURES.FOREST,
                    ...CROSS_THEME_FEATURES.RUINS
                ];
                break;
            default:
                features = CROSS_THEME_FEATURES.FOREST;
        }
        
        if (features.length === 0) {
            return;
        }
        
        // Select a random feature
        const featureType = features[Math.floor(Math.random() * features.length)];
        
        // Position near the center of the chunk
        const x = (worldX + chunkSize * 0.5 + (Math.random() * 0.4 - 0.2) * chunkSize) * this.worldScale;
        const z = (worldZ + chunkSize * 0.5 + (Math.random() * 0.4 - 0.2) * chunkSize) * this.worldScale;
        
        // Larger scale for special features
        const scale = 1.0 + Math.random() * 1.5;
        
        // Create the special feature
        const object = this.environmentManager.createEnvironmentObject(featureType, x, z, scale);
        
        if (object && object.rotation) {
            // Add random rotation
            object.rotation.y = Math.random() * Math.PI * 2;
            
            // Add to environment objects tracking
            this.environmentManager.environmentObjects.push({
                type: featureType,
                object: object,
                position: new THREE.Vector3(x, this.terrainManager.getTerrainHeight(x, z), z),
                scale: scale,
                isSpecialFeature: true
            });
            
            // Add to type-specific collections
            this.environmentManager.addToTypeCollection(featureType, object);
            
            console.debug(`Added special feature ${featureType} at (${x.toFixed(1)}, ${z.toFixed(1)})`);
        }
    }
    
    /**
     * Generate structures for a chunk
     * @param {number} chunkX - Chunk X coordinate
     * @param {number} chunkZ - Chunk Z coordinate
     * @param {string} zoneType - Zone type
     * @param {object} zoneDensity - Zone density configuration
     */
    generateStructuresForChunk(chunkX, chunkZ, zoneType, zoneDensity) {
        try {
            const chunkSize = this.terrainManager.terrainChunkSize;
            const worldX = chunkX * chunkSize;
            const worldZ = chunkZ * chunkSize;
            
            // 50% chance to generate any structures at all to improve performance
            if (Math.random() > 0.5) {
                return; // Skip structure generation for this chunk
            }
            
            // Define structure generation probability based on zone type
            const structureProbabilities = {
                'village': {
                    'Forest': 0.05,
                    'Magical': 0.05,
                    'Mountain': 0.03,
                    'Desert': 0.02,
                    'Swamp': 0.01,
                    'default': 0.01
                },
                'special': {
                    'Forest': 0.03,
                    'Magical': 0.08,
                    'Mountain': 0.04,
                    'Desert': 0.03,
                    'Swamp': 0.05,
                    'default': 0.02
                }
            };
            
            // Get village probability for this zone
            const villageProbability = structureProbabilities.village[zoneType] || 
                structureProbabilities.village.default;
                
            // Get special structure probability for this zone
            const specialProbability = structureProbabilities.special[zoneType] || 
                structureProbabilities.special.default;
            
            // Calculate number of structures based on density
            const baseStructureCount = 1; // Base of 1 structure per chunk
            const structureCount = Math.random() < zoneDensity.structures ? 
                Math.min(2, Math.floor(baseStructureCount + Math.random() * 2)) : 1;
            
            console.debug(`Generating ${structureCount} structures for chunk ${chunkX},${chunkZ} (${zoneType})`);
            
            // Determine if we should create a village
            const createVillage = Math.random() < villageProbability;
            
            if (createVillage) {
                this.generateVillage(chunkX, chunkZ, worldX, worldZ, chunkSize, zoneType);
            } 
            // Determine if we should create a special structure
            else if (Math.random() < specialProbability) {
                this.generateSpecialStructure(chunkX, chunkZ, worldX, worldZ, chunkSize, zoneType, zoneDensity);
            }
            // Otherwise generate regular structures
            else {
                this.generateRegularStructures(chunkX, chunkZ, worldX, worldZ, chunkSize, zoneType, zoneDensity, structureCount);
            }
        } catch (error) {
            console.error(`Error generating structures for chunk ${chunkX},${chunkZ}:`, error);
        }
    }
    
    /**
     * Generate a village in a chunk
     * @param {number} chunkX - Chunk X coordinate
     * @param {number} chunkZ - Chunk Z coordinate
     * @param {number} worldX - World X coordinate
     * @param {number} worldZ - World Z coordinate
     * @param {number} chunkSize - Size of the chunk
     * @param {string} zoneType - Zone type
     */
    generateVillage(chunkX, chunkZ, worldX, worldZ, chunkSize, zoneType) {
        // Place village near center of chunk and apply world scale
        const villageX = (worldX + chunkSize * 0.5) * this.worldScale;
        const villageZ = (worldZ + chunkSize * 0.5) * this.worldScale;
        
        // Create the village
        const village = this.structureManager.createVillage(villageX, villageZ);
        
        if (village) {
            // Add to structures tracking
            this.structureManager.structures.push({
                type: 'village',
                object: village,
                position: new THREE.Vector3(villageX, this.terrainManager.getTerrainHeight(villageX, villageZ), villageZ),
                chunkKey: `${chunkX},${chunkZ}`
            });
            
            // Mark chunk as having structures
            this.structureManager.structuresPlaced[`${chunkX},${chunkZ}`] = true;
            
            // Create fewer additional buildings around the village
            const buildingCount = 1 + Math.floor(Math.random() * 2); // Reduced from 2-4 to 1-2
            
            // Define building types appropriate for this zone
            const buildingTypes = this.getZoneAppropriateBuildings(zoneType);
            
            for (let i = 0; i < buildingCount; i++) {
                // Position buildings in a circle around the village
                const angle = (i / buildingCount) * Math.PI * 2;
                const distance = 15 + Math.random() * 10;
                
                const buildingX = villageX + Math.cos(angle) * distance * this.worldScale;
                const buildingZ = villageZ + Math.sin(angle) * distance * this.worldScale;
                
                // Make sure building is within scaled chunk bounds
                if (buildingX >= worldX * this.worldScale && buildingX < (worldX + chunkSize) * this.worldScale && 
                    buildingZ >= worldZ * this.worldScale && buildingZ < (worldZ + chunkSize) * this.worldScale) {
                    
                    // Select a random building type appropriate for this zone
                    const buildingType = buildingTypes[Math.floor(Math.random() * buildingTypes.length)];
                    let building = null;
                    
                    if (buildingType === 'house') {
                        // Smaller buildings for better performance
                        const width = 3 + Math.random() * 2; // Reduced from 3-7 to 3-5
                        const depth = 3 + Math.random() * 2; // Reduced from 3-7 to 3-5
                        const height = 2 + Math.random() * 1; // Reduced from 2-5 to 2-3
                        building = this.structureManager.createBuilding(buildingX, buildingZ, width, depth, height);
                    } else if (buildingType === 'tower') {
                        building = this.structureManager.createTower(buildingX, buildingZ);
                    } else {
                        // For other building types (temple, altar, etc.)
                        const bWidth = 4 + Math.random() * 2;
                        const bDepth = 4 + Math.random() * 2;
                        const bHeight = 3 + Math.random() * 1;
                        building = this.structureManager.createBuilding(buildingX, buildingZ, bWidth, bDepth, bHeight, buildingType);
                    }
                    
                    if (building) {
                        // Rotate building to face village
                        const angleToVillage = Math.atan2(villageZ - buildingZ, villageX - buildingX);
                        building.rotation.y = angleToVillage;
                        
                        // Add to structures tracking
                        this.structureManager.structures.push({
                            type: buildingType,
                            object: building,
                            position: new THREE.Vector3(buildingX, this.terrainManager.getTerrainHeight(buildingX, buildingZ), buildingZ),
                            chunkKey: `${chunkX},${chunkZ}`
                        });
                    }
                }
            }
        }
    }
    
    /**
     * Generate a special structure in a chunk
     * @param {number} chunkX - Chunk X coordinate
     * @param {number} chunkZ - Chunk Z coordinate
     * @param {number} worldX - World X coordinate
     * @param {number} worldZ - World Z coordinate
     * @param {number} chunkSize - Size of the chunk
     * @param {string} zoneType - Zone type
     * @param {object} zoneDensity - Zone density configuration
     */
    generateSpecialStructure(chunkX, chunkZ, worldX, worldZ, chunkSize, zoneType, zoneDensity) {
        // Position near the center of the chunk
        const x = (worldX + chunkSize * 0.5 + (Math.random() * 0.3 - 0.15) * chunkSize) * this.worldScale;
        const z = (worldZ + chunkSize * 0.5 + (Math.random() * 0.3 - 0.15) * chunkSize) * this.worldScale;
        
        // Define special structures for each zone type
        const specialStructures = {
            'Forest': ['ruins', 'temple', 'altar'],
            'Desert': ['ruins', 'temple', 'altar'],
            'Mountain': ['ruins', 'fortress', 'mountain'],
            'Swamp': ['ruins', 'dark_sanctum', 'altar'],
            'Magical': ['ruins', 'temple', 'dark_sanctum', 'altar']
        };
        
        // Get special structures for this zone
        const zoneSpecialStructures = specialStructures[zoneType] || specialStructures['Forest'];
        
        // Select a random special structure
        const structureType = zoneSpecialStructures[Math.floor(Math.random() * zoneSpecialStructures.length)];
        
        // Create the structure
        let structure = null;
        
        switch (structureType) {
            case 'ruins':
                structure = this.structureManager.createRuins(x, z);
                break;
            case 'temple':
                const tWidth = 5 + Math.random() * 2;
                const tDepth = 5 + Math.random() * 2;
                const tHeight = 4 + Math.random() * 2;
                structure = this.structureManager.createBuilding(x, z, tWidth, tDepth, tHeight, 'temple');
                break;
            case 'altar':
                const aWidth = 3 + Math.random() * 2;
                const aDepth = 3 + Math.random() * 2;
                const aHeight = 2 + Math.random() * 1;
                structure = this.structureManager.createBuilding(x, z, aWidth, aDepth, aHeight, 'altar');
                break;
            case 'fortress':
                const fWidth = 6 + Math.random() * 3;
                const fDepth = 6 + Math.random() * 3;
                const fHeight = 5 + Math.random() * 2;
                structure = this.structureManager.createBuilding(x, z, fWidth, fDepth, fHeight, 'fortress');
                break;
            case 'mountain':
                structure = this.structureManager.createMountain(x, z);
                break;
            case 'dark_sanctum':
                structure = this.structureManager.createDarkSanctum(x, z);
                break;
        }
        
        if (structure) {
            // Add random rotation for more natural appearance
            structure.rotation.y = Math.random() * Math.PI * 2;
            
            // Add to structures tracking
            this.structureManager.structures.push({
                type: structureType,
                object: structure,
                position: new THREE.Vector3(x, this.terrainManager.getTerrainHeight(x, z), z),
                chunkKey: `${chunkX},${chunkZ}`,
                isSpecial: true
            });
            
            // Mark chunk as having structures
            this.structureManager.structuresPlaced[`${chunkX},${chunkZ}`] = true;
            
            // Add environment objects around the special structure
            if (this.initialTerrainCreated) {
                this.addEnvironmentAroundStructure(x, z, structureType, zoneType);
            }
        }
    }
    
    /**
     * Generate regular structures in a chunk
     * @param {number} chunkX - Chunk X coordinate
     * @param {number} chunkZ - Chunk Z coordinate
     * @param {number} worldX - World X coordinate
     * @param {number} worldZ - World Z coordinate
     * @param {number} chunkSize - Size of the chunk
     * @param {string} zoneType - Zone type
     * @param {object} zoneDensity - Zone density configuration
     * @param {number} structureCount - Number of structures to generate
     */
    generateRegularStructures(chunkX, chunkZ, worldX, worldZ, chunkSize, zoneType, zoneDensity, structureCount) {
        // Generate individual structures
        for (let i = 0; i < structureCount; i++) {
            // Random position within chunk (but not too close to edges) and apply world scale
            const margin = chunkSize * 0.1; // 10% margin
            const x = (worldX + margin + Math.random() * (chunkSize - 2 * margin)) * this.worldScale;
            const z = (worldZ + margin + Math.random() * (chunkSize - 2 * margin)) * this.worldScale;
            
            // Random structure type from zone types
            const structureType = zoneDensity.structureTypes[
                Math.floor(Math.random() * zoneDensity.structureTypes.length)
            ];
            
            // Create the structure
            let structure = null;
            
            switch (structureType) {
                case 'house':
                    // Smaller buildings for better performance
                    const width = 3 + Math.random() * 2; // Reduced from 3-7 to 3-5
                    const depth = 3 + Math.random() * 2; // Reduced from 3-7 to 3-5
                    const height = 2 + Math.random() * 1; // Reduced from 2-5 to 2-3
                    structure = this.structureManager.createBuilding(x, z, width, depth, height);
                    break;
                case 'tower':
                    structure = this.structureManager.createTower(x, z);
                    break;
                case 'ruins':
                    structure = this.structureManager.createRuins(x, z);
                    break;
                case 'village':
                    // Villages are larger, only create if we have space and with reduced chance
                    if (Math.random() < 0.2) { // Reduced from 40% to 20%
                        structure = this.structureManager.createVillage(x, z);
                    }
                    break;
                case 'temple':
                case 'altar':
                case 'fortress':
                    // Smaller buildings for better performance
                    const bWidth = 4 + Math.random() * 2; // Reduced from 4-7 to 4-6
                    const bDepth = 4 + Math.random() * 2; // Reduced from 4-7 to 4-6
                    const bHeight = 3 + Math.random() * 1; // Reduced from 3-5 to 3-4
                    structure = this.structureManager.createBuilding(x, z, bWidth, bDepth, bHeight, structureType);
                    break;
                case 'mountain':
                    structure = this.structureManager.createMountain(x, z);
                    break;
                case 'dark_sanctum':
                    structure = this.structureManager.createDarkSanctum(x, z);
                    break;
            }
            
            if (structure) {
                // Add random rotation for more natural appearance
                structure.rotation.y = Math.random() * Math.PI * 2;
                
                // Add to structures tracking
                this.structureManager.structures.push({
                    type: structureType,
                    object: structure,
                    position: new THREE.Vector3(x, this.terrainManager.getTerrainHeight(x, z), z),
                    chunkKey: `${chunkX},${chunkZ}`
                });
                
                // Mark chunk as having structures
                this.structureManager.structuresPlaced[`${chunkX},${chunkZ}`] = true;
                
                // For certain structure types, add some environment objects around them
                // But only if we're not in the initial loading phase
                if (this.initialTerrainCreated && 
                    ['temple', 'altar', 'ruins', 'dark_sanctum'].includes(structureType)) {
                    // 50% chance to add environment objects to further improve performance
                    if (Math.random() < 0.5) {
                        this.addEnvironmentAroundStructure(x, z, structureType, zoneType);
                    }
                }
            }
        }
    }
    
    /**
     * Get building types appropriate for a zone
     * @param {string} zoneType - Zone type
     * @returns {Array} - Array of appropriate building types
     */
    getZoneAppropriateBuildings(zoneType) {
        switch(zoneType) {
            case 'Forest':
                return ['house', 'tower', 'temple'];
            case 'Desert':
                return ['house', 'tower', 'temple', 'altar'];
            case 'Mountain':
                return ['house', 'tower', 'fortress'];
            case 'Swamp':
                return ['house', 'tower', 'altar'];
            case 'Magical':
                return ['house', 'tower', 'temple', 'altar'];
            default:
                return ['house', 'tower'];
        }
    }
    
    /**
     * Add environment objects around a structure to make it more interesting
     * @param {number} x - X coordinate of structure
     * @param {number} z - Z coordinate of structure
     * @param {string} structureType - Type of structure
     * @param {string} zoneType - Zone type
     */
    addEnvironmentAroundStructure(x, z, structureType, zoneType) {
        try {
            // Get environment types for this zone
            const environmentTypes = this.zoneDensities[zoneType].environmentTypes;
            
            // Reduced number of objects to add for better performance
            const objectCount = 3 + Math.floor(Math.random() * 4); // Reduced from 5-14 to 3-6
            
            // Add objects in a circle around the structure with increased spacing
            for (let i = 0; i < objectCount; i++) {
                // Evenly distribute angles for better spacing
                const angle = (i / objectCount) * Math.PI * 2 + (Math.random() * 0.5); // Add small randomness
                // Increase distance by 5x for more spacing
                const distance = (5 + Math.random() * 5) * 5; // Increased from 5-10 to 25-50
                
                // Calculate position
                const objX = x + Math.cos(angle) * distance;
                const objZ = z + Math.sin(angle) * distance;
                
                // Random object type
                const objectType = environmentTypes[
                    Math.floor(Math.random() * environmentTypes.length)
                ];
                
                // Random scale with less variation
                const scale = 0.5 + Math.random() * 0.8; // Reduced from 0.3-1.8 to 0.5-1.3
                
                // Create the object
                const object = this.environmentManager.createEnvironmentObject(objectType, objX, objZ, scale);
                
                if (object && object.rotation) {
                    // Add random rotation
                    object.rotation.y = Math.random() * Math.PI * 2;
                    
                    // Add to environment objects tracking
                    this.environmentManager.environmentObjects.push({
                        type: objectType,
                        object: object,
                        position: new THREE.Vector3(objX, this.terrainManager.getTerrainHeight(objX, objZ), objZ),
                        scale: scale,
                        // Use structure's chunk key
                        chunkKey: `${Math.floor(x / this.terrainManager.terrainChunkSize)},${Math.floor(z / this.terrainManager.terrainChunkSize)}`
                    });
                    
                    // Add to type-specific collections
                    this.environmentManager.addToTypeCollection(objectType, object);
                }
            }
        } catch (error) {
            console.error(`Error adding environment around structure at (${x}, ${z}):`, error);
        }
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
                this.generateZoneLandmark(startPosition, this.currentZoneType);
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
                this.generateChunkContent(chunk.x, chunk.z);
                
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
        const minUpdateInterval = this.lowPerformanceMode ? 100 : 50; // ms between updates
        const hasMovedSignificantly = this.lastPlayerPosition && 
            playerPosition.distanceTo(this.lastPlayerPosition) > 5;
            
        if (!this._lastWorldUpdate || 
            now - this._lastWorldUpdate > minUpdateInterval || 
            hasMovedSignificantly) {
            
            this._lastWorldUpdate = now;
            
            // Calculate effective draw distance based on performance mode
            const effectiveDrawDistance = this.calculateEffectiveDrawDistance(drawDistanceMultiplier);
            
            // Calculate player's current chunk coordinates
            const terrainChunkSize = this.terrainManager.terrainChunkSize;
            const playerChunkX = Math.floor(playerPosition.x / terrainChunkSize);
            const playerChunkZ = Math.floor(playerPosition.z / terrainChunkSize);
            
            // Use a priority-based update system
            // 1. Always update terrain first (most important for gameplay)
            this.updateTerrainForPlayer(playerPosition, effectiveDrawDistance);
            
            // 2. Update environment objects (can be throttled more aggressively)
            // Only update environment every other frame in low performance mode
            if (!this.lowPerformanceMode || !this._lastEnvironmentUpdate || 
                now - this._lastEnvironmentUpdate > 200) {
                this.updateEnvironmentForPlayer(playerPosition, effectiveDrawDistance);
                this._lastEnvironmentUpdate = now;
            }
            
            // 3. Generate procedural content (can be throttled most aggressively)
            // Only generate content if we're not already processing chunks
            if (!this.processingChunk && 
                (!this._lastContentGeneration || now - this._lastContentGeneration > 500)) {
                // Use requestAnimationFrame to defer content generation to next frame
                requestAnimationFrame(() => {
                    this.generateProceduralContent(playerChunkX, playerChunkZ, playerPosition, effectiveDrawDistance);
                    this._lastContentGeneration = performance.now();
                });
            }
            
            // 4. Update world systems (lighting, fog, etc.)
            // These are lightweight and can be updated every frame
            this.updateWorldSystems(playerPosition, effectiveDrawDistance);
        }
    }
    
    /**
     * Calculate effective draw distance based on performance settings
     * @private
     * @param {number} drawDistanceMultiplier - Base multiplier for draw distance
     * @returns {number} - Effective draw distance multiplier
     */
    calculateEffectiveDrawDistance(drawDistanceMultiplier) {
        // Get performance level from game if available
        let performanceLevel = 'medium';
        if (this.game && this.game.performanceManager) {
            performanceLevel = this.game.performanceManager.getCurrentPerformanceLevel();
        }
        
        // Apply more aggressive distance reduction based on performance level
        let effectiveMultiplier = drawDistanceMultiplier;
        
        switch (performanceLevel) {
            case 'low':
                effectiveMultiplier = Math.min(0.4, drawDistanceMultiplier);
                break;
            case 'medium':
                effectiveMultiplier = Math.min(0.7, drawDistanceMultiplier);
                break;
            case 'high':
                effectiveMultiplier = Math.min(1.0, drawDistanceMultiplier);
                break;
            default:
                effectiveMultiplier = Math.min(0.7, drawDistanceMultiplier);
        }
        
        return effectiveMultiplier;
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
     * Generate procedural content for chunks around the player
     * Optimized to prevent frame drops by limiting chunk processing
     * 
     * @param {number} playerChunkX - Player's chunk X coordinate
     * @param {number} playerChunkZ - Player's chunk Z coordinate
     * @param {THREE.Vector3} playerPosition - Player position for zone detection
     * @param {number} effectiveDrawDistance - Effective draw distance
     */
    generateProceduralContent(playerChunkX, playerChunkZ, playerPosition, effectiveDrawDistance) {
        // Set flag to prevent concurrent processing
        this.processingChunk = true;
        
        try {
            // Only generate content if dynamic world is enabled
            if (!this.dynamicWorldEnabled) {
                this.processingChunk = false;
                return;
            }
            
            // Set initialTerrainCreated to true after first update
            // This allows structures to be generated in subsequent updates
            if (!this.initialTerrainCreated) {
                console.debug("Initial terrain creation complete, enabling structure generation");
                this.initialTerrainCreated = true;
            }
            
            // Further reduce content generation distance in low performance mode
            const contentGenDistance = this.lowPerformanceMode ? 2 : 3;
            
            // Queue chunks for processing instead of processing immediately
            // This allows us to spread the work across multiple frames
            this.queueChunksForProcessing(playerChunkX, playerChunkZ, contentGenDistance);
            
            // Process a limited number of chunks from the queue
            this.processChunkQueue(CHUNK_PROCESSING_BUDGET_MS);
            
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
     * @private
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
     * @private
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
     * @private
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
            
            // Record last chunk process time
            this.lastChunkProcessTime = performance.now();
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
     * Update player's current zone and handle zone transitions
     * @private
     * @param {THREE.Vector3} playerPosition - Player position
     */
    updatePlayerZone(playerPosition) {
        if (!playerPosition) return;
        
        const newZoneType = this.getZoneTypeAt(playerPosition.x, playerPosition.z);
        if (newZoneType !== this.currentZoneType) {
            console.debug(`Player entered new zone: ${this.currentZoneType} -> ${newZoneType}`);
            this.currentZoneType = newZoneType;
            
            // Notify game about zone change if needed
            if (this.game && this.game.onZoneChange) {
                this.game.onZoneChange(newZoneType);
            }
            
            // When entering a new zone, generate some special landmark structures
            // But only if we're not in low performance mode
            if (!this.lowPerformanceMode) {
                // Defer landmark generation to prevent frame drops
                setTimeout(() => {
                    this.generateZoneLandmark(playerPosition, newZoneType);
                }, 100);
            }
        }
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
                
                // Add environment objects around the tree
                this.addEnvironmentAroundStructure(landmarkX, landmarkZ, 'ancient_tree', zoneType);
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
                
                // Add environment objects around the oasis
                this.addEnvironmentAroundStructure(landmarkX, landmarkZ, 'oasis', zoneType);
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
                
                // Add environment objects around the portal
                this.addEnvironmentAroundStructure(landmarkX, landmarkZ, 'mysterious_portal', zoneType);
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
                
                // Add environment objects around the landmark
                this.addEnvironmentAroundStructure(landmarkX, landmarkZ, landmarkType, zoneType);
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
            
            // Force cleanup of distant terrain chunks and enemies when player moves significant distance
            // This ensures memory is properly released during long-distance travel
            if (distanceMoved >= this.screenSpawnDistance * 3) {
                console.debug(`Player moved significant distance (${distanceMoved.toFixed(1)}), forcing terrain and enemy cleanup`);
                
                // Calculate player's current chunk coordinates
                const terrainChunkSize = this.terrainManager.terrainChunkSize;
                const playerChunkX = Math.floor(playerPosition.x / terrainChunkSize);
                const playerChunkZ = Math.floor(playerPosition.z / terrainChunkSize);
                
                // Clean up terrain
                this.terrainManager.clearDistantChunks(playerChunkX, playerChunkZ);
                
                // Clean up structures that are far from the player
                this.cleanupDistantStructures(playerChunkX, playerChunkZ);
                
                // Clean up environment objects that are far from the player
                this.cleanupDistantEnvironmentObjects(playerChunkX, playerChunkZ);
                
                // Clean up environment objects
                // Use the existing updateForPlayer method which handles cleanup internally
                if (this.environmentManager) {
                    this.environmentManager.updateForPlayer(playerPosition, effectiveDrawDistance);
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
        
        // Update LOD for objects based on camera position
        if (this.lodManager && playerPosition) {
            // Apply performance-based adjustments to LOD distances
            if (this.game && this.game.performanceManager) {
                const performanceLevel = this.game.performanceManager.getCurrentPerformanceLevel();
                const drawDistanceMultiplier = this.game.performanceManager.getDrawDistanceMultiplier();
                
                // Adjust LOD distances based on performance
                // Lower performance = show outlines at closer distances
                const lodConfig = this.lodManager.getConfig();
                
                // Only update if performance changes significantly
                if (performanceLevel !== this.lastPerformanceLevel) {
                    // Store current performance level
                    this.lastPerformanceLevel = performanceLevel;
                    
                    // Adjust distances based on performance
                    if (performanceLevel === 'low') {
                        // For low performance, show outlines at closer distances
                        this.lodManager.setConfig({
                            distances: {
                                ...lodConfig.distances,
                                wireframe: 100, // Show wireframe sooner
                                outlineOnly: 150 // Show outline-only sooner
                            }
                        });
                    } else if (performanceLevel === 'medium') {
                        // Default distances for medium performance
                        this.lodManager.setConfig({
                            distances: {
                                ...lodConfig.distances,
                                wireframe: 150,
                                outlineOnly: 200
                            }
                        });
                    } else {
                        // For high performance, show detailed models at greater distances
                        this.lodManager.setConfig({
                            distances: {
                                ...lodConfig.distances,
                                wireframe: 200, // Show wireframe later
                                outlineOnly: 250 // Show outline-only later
                            }
                        });
                    }
                    
                    console.debug(`Adjusted LOD distances for ${performanceLevel} performance`);
                }
            }
            
            // Update LOD based on player position
            this.lodManager.update(playerPosition);
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
            if (!this.structureManager || !this.structureManager.structures) {
                return;
            }
            
            // FIXED: Significantly increased view distance for structures to ensure they're visible from much farther away
            // This fixes the issue where structures completely disappear when moving far away
            const maxViewDistance = this.terrainManager.terrainChunkViewDistance + 10; // Increased from +4 to +10
            
            // Clean up structures that are too far away
            const structuresToRemove = [];
            
            this.structureManager.structures.forEach((structureInfo, index) => {
                if (structureInfo.chunkKey) {
                    const [chunkX, chunkZ] = structureInfo.chunkKey.split(',').map(Number);
                    
                    // Calculate distance from player chunk
                    const distX = Math.abs(chunkX - playerChunkX);
                    const distZ = Math.abs(chunkZ - playerChunkZ);
                    
                    // If chunk is too far away, mark for removal
                    if (distX > maxViewDistance || distZ > maxViewDistance) {
                        structuresToRemove.push({ index, structureInfo });
                        
                        // Remove from scene
                        if (structureInfo.object && structureInfo.object.parent) {
                            this.scene.remove(structureInfo.object);
                        }
                        
                        // Dispose resources
                        if (structureInfo.object && structureInfo.object.traverse) {
                            structureInfo.object.traverse(obj => {
                                if (obj.geometry) obj.geometry.dispose();
                                if (obj.material) {
                                    if (Array.isArray(obj.material)) {
                                        obj.material.forEach(mat => mat.dispose());
                                    } else {
                                        obj.material.dispose();
                                    }
                                }
                            });
                        }
                    }
                }
            });
            
            // Remove structures from tracking (reverse order to maintain indices)
            structuresToRemove.reverse().forEach(({index, structureInfo}) => {
                this.structureManager.structures.splice(index, 1);
                
                // Remove from structuresPlaced tracking
                if (structureInfo.chunkKey && this.structureManager.structuresPlaced) {
                    delete this.structureManager.structuresPlaced[structureInfo.chunkKey];
                }
                
                // Remove from generatedChunks so content can be regenerated if player returns
                if (structureInfo.chunkKey) {
                    this.generatedChunks.delete(structureInfo.chunkKey);
                }
            });
            
            if (structuresToRemove.length > 0) {
                console.debug(`Cleaned up ${structuresToRemove.length} distant structures`);
            }
        } catch (error) {
            console.warn("Error cleaning up distant structures:", error);
        }
    }
    
    /**
     * Clean up environment objects that are far from the player
     * @param {number} playerChunkX - Player's chunk X coordinate
     * @param {number} playerChunkZ - Player's chunk Z coordinate
     */
    cleanupDistantEnvironmentObjects(playerChunkX, playerChunkZ) {
        try {
            // Make sure environment manager is available
            if (!this.environmentManager || !this.environmentManager.environmentObjects) {
                return;
            }
            
            const maxViewDistance = this.terrainManager.terrainChunkViewDistance + 8;
            
            // Clean up environment objects that are too far away
            const objectsToRemove = [];
            
            this.environmentManager.environmentObjects.forEach((objectInfo, index) => {
                if (objectInfo.chunkKey) {
                    const [chunkX, chunkZ] = objectInfo.chunkKey.split(',').map(Number);
                    
                    // Calculate distance from player chunk
                    const distX = Math.abs(chunkX - playerChunkX);
                    const distZ = Math.abs(chunkZ - playerChunkZ);
                    
                    // If chunk is too far away, mark for removal
                    if (distX > maxViewDistance || distZ > maxViewDistance) {
                        objectsToRemove.push({ index, objectInfo });
                        
                        // Remove from scene
                        if (objectInfo.object && objectInfo.object.parent) {
                            this.scene.remove(objectInfo.object);
                        }
                        
                        // Dispose resources
                        if (objectInfo.object && objectInfo.object.traverse) {
                            objectInfo.object.traverse(obj => {
                                if (obj.geometry) obj.geometry.dispose();
                                if (obj.material) {
                                    if (Array.isArray(obj.material)) {
                                        obj.material.forEach(mat => mat.dispose());
                                    } else {
                                        obj.material.dispose();
                                    }
                                }
                            });
                        }
                    }
                }
            });
            
            // Remove objects from tracking (reverse order to maintain indices)
            objectsToRemove.reverse().forEach(({index, objectInfo}) => {
                this.environmentManager.environmentObjects.splice(index, 1);
                
                // Remove from type-specific collections
                // This is a bit complex, so we'll just clear and rebuild them periodically
                // For now, we'll leave them as they don't take much memory
            });
            
            if (objectsToRemove.length > 0) {
                console.debug(`Cleaned up ${objectsToRemove.length} distant environment objects`);
            }
        } catch (error) {
            console.warn("Error cleaning up distant environment objects:", error);
        }
    }
    
    /**
     * Manage memory and performance to prevent memory leaks and maintain frame rate
     * This method is called periodically to monitor and adjust performance settings
     */
    manageMemoryAndPerformance() {
        const currentTime = Date.now();
        
        // Track frame rate
        this.trackFrameRate();
        
        // Periodically check memory usage
        if (currentTime - this.lastMemoryCheck > this.memoryCheckInterval) {
            this.lastMemoryCheck = currentTime;
            this.checkMemoryUsage();
        }
        
        // Periodically adjust performance settings
        if (currentTime - this.lastPerformanceAdjustment > this.performanceAdjustmentInterval) {
            this.lastPerformanceAdjustment = currentTime;
            this.adjustPerformanceSettings();
        }
        
        // Periodically hint for garbage collection
        if (currentTime - this.lastGarbageCollection > this.gcInterval) {
            this.lastGarbageCollection = currentTime;
            this.hintGarbageCollection();
        }
    }
    
    /**
     * Track frame rate for performance monitoring
     * @private
     */
    trackFrameRate() {
        if (this.game && this.game.stats && this.game.stats.fps) {
            this.frameRateHistory.push(this.game.stats.fps);
            
            // Keep history at max length
            if (this.frameRateHistory.length > this.frameRateHistoryMaxLength) {
                this.frameRateHistory.shift();
            }
        }
    }
    
    /**
     * Check memory usage and perform cleanup if necessary
     * @private
     */
    checkMemoryUsage() {
        // Only proceed if we have enough frame rate history
        if (this.frameRateHistory.length <= 10) return;
        
        // Calculate average FPS
        const avgFPS = this.calculateAverageFPS();
        
        // If FPS is consistently low, trigger aggressive cleanup
        if (avgFPS < 30) {
            console.debug(`Low FPS detected (${avgFPS.toFixed(1)}), performing aggressive cleanup`);
            this.performAggressiveCleanup();
        } else {
            // Even if FPS is good, periodically clean up distant terrain to prevent memory buildup
            console.debug("Performing routine terrain cleanup to prevent memory buildup");
            this.terrainManager.clearDistantChunks();
        }
    }
    
    /**
     * Calculate average FPS from frame rate history
     * @private
     * @returns {number} - Average FPS
     */
    calculateAverageFPS() {
        if (this.frameRateHistory.length === 0) return 60; // Default to 60 if no history
        return this.frameRateHistory.reduce((sum, fps) => sum + fps, 0) / this.frameRateHistory.length;
    }
    
    /**
     * Adjust performance settings based on current frame rate
     * @private
     */
    adjustPerformanceSettings() {
        // Only proceed if we have enough frame rate history
        if (this.frameRateHistory.length <= 10) return;
        
        // Calculate average FPS
        const avgFPS = this.calculateAverageFPS();
        
        // Adjust performance mode and density based on FPS
        const wasLowPerformanceMode = this.lowPerformanceMode;
        
        // Determine performance level and density
        const { densityLevel, performanceMode } = this.determinePerformanceLevel(avgFPS);
        
        // Apply the new density level
        this.setDensityLevel(densityLevel);
        
        // Notify if performance mode changed
        if (wasLowPerformanceMode !== this.lowPerformanceMode || this.lastPerformanceLevel !== densityLevel) {
            console.debug(`Performance mode changed to: ${performanceMode} (density: ${densityLevel})`);
            this.lastPerformanceLevel = densityLevel;
            
            // Notify user if performance mode changed
            this.notifyPerformanceModeChange(performanceMode, densityLevel);
            
            // If switching to low performance mode, force terrain cleanup
            if (this.lowPerformanceMode) {
                this.terrainManager.clearDistantChunks(this.terrainChunkViewDistance);
            }
        }
    }
    
    /**
     * Determine performance level based on FPS
     * @private
     * @param {number} avgFPS - Average FPS
     * @returns {Object} - Performance level information
     */
    determinePerformanceLevel(avgFPS) {
        let densityLevel, performanceMode;
        
        if (avgFPS < 20) {
            // Very low FPS - minimal density
            densityLevel = 'minimal';
            performanceMode = 'MINIMAL';
            this.lowPerformanceMode = true;
        } else if (avgFPS < 30) {
            // Low FPS - low density
            densityLevel = 'low';
            performanceMode = 'LOW';
            this.lowPerformanceMode = true;
        } else if (avgFPS < 45) {
            // Medium FPS - medium density
            densityLevel = 'medium';
            performanceMode = 'NORMAL';
            this.lowPerformanceMode = false;
        } else {
            // High FPS - high density
            densityLevel = 'high';
            performanceMode = 'HIGH';
            this.lowPerformanceMode = false;
        }
        
        return { densityLevel, performanceMode };
    }
    
    /**
     * Notify user of performance mode change
     * @private
     * @param {string} performanceMode - New performance mode
     * @param {string} densityLevel - New density level
     */
    notifyPerformanceModeChange(performanceMode, densityLevel) {
        if (this.game && this.game.hudManager && this.game.hudManager.showNotification) {
            const message = `Performance mode: ${performanceMode} - Environment density set to ${densityLevel}`;
            this.game.hudManager.showNotification(message, 3000);
        }
    }
    
    /**
     * Perform aggressive cleanup to recover memory and improve performance
     * This method is called when FPS drops below acceptable levels
     */
    performAggressiveCleanup() {
        console.debug("🧹 Performing aggressive cleanup to recover memory");
        
        try {
            // Clear all cached data arrays
            this.clearCachedArrays();
            
            // Calculate reduced view distance for more aggressive cleanup
            const reducedViewDistance = Math.max(2, Math.floor(this.terrainChunkViewDistance * 0.6));
            
            // Force terrain manager to clear distant chunks with reduced view distance
            if (this.terrainManager && this.terrainManager.clearDistantChunks) {
                this.terrainManager.clearDistantChunks(reducedViewDistance);
            }
            
            // Clear environment objects beyond reduced distance
            if (this.environmentManager && this.environmentManager.clearDistantObjects) {
                const cleanupRadius = reducedViewDistance * this.terrainManager.terrainChunkSize;
                this.environmentManager.clearDistantObjects(cleanupRadius);
            }
            
            // Clear structures beyond reduced distance
            if (this.structureManager && this.structureManager.clearDistantStructures) {
                const cleanupRadius = reducedViewDistance * this.terrainManager.terrainChunkSize;
                this.structureManager.clearDistantStructures(cleanupRadius);
            }
            
            // Clear WebGL resources
            this.clearWebGLResources();
            
            // Hint for garbage collection
            this.hintGarbageCollection();
            
            console.debug("✅ Aggressive cleanup complete");
        } catch (error) {
            console.error("❌ Error during aggressive cleanup:", error);
        }
    }
    
    /**
     * Clear cached data arrays
     * @private
     */
    clearCachedArrays() {
        this.terrainFeatures = [];
        this.trees = [];
        this.rocks = [];
        this.buildings = [];
        this.paths = [];
    }
    
    /**
     * Clear WebGL resources and caches
     * @private
     */
    clearWebGLResources() {
        if (this.game && this.game.renderer) {
            // Clear WebGL state
            this.game.renderer.state.reset();
            
            // Clear texture cache if available
            if (THREE.Cache && THREE.Cache.clear) {
                THREE.Cache.clear();
            }
        }
    }
    
    /**
     * Hint for garbage collection and log memory usage
     * This is a best-effort approach as browsers handle memory differently
     */
    hintGarbageCollection() {
        // Try to trigger garbage collection if available
        this.triggerGarbageCollection();
        
        // Log memory usage information if available
        this.logMemoryUsage();
    }
    
    /**
     * Attempt to trigger garbage collection
     * @private
     */
    triggerGarbageCollection() {
        // Force garbage collection hint if available (Chrome with --js-flags="--expose-gc")
        if (window.gc) {
            try {
                window.gc();
                console.debug("Garbage collection hint triggered");
            } catch (e) {
                // Ignore if not available
            }
        } else {
            // Alternative approach for browsers without explicit GC
            // Create and release a large object to encourage GC
            try {
                const largeArray = new Array(10000).fill(0);
                largeArray.length = 0;
            } catch (e) {
                // Ignore any errors
            }
        }
    }
    
    /**
     * Log memory usage information if available
     * @private
     */
    logMemoryUsage() {
        // Log memory usage if performance.memory is available (Chrome)
        if (window.performance && window.performance.memory) {
            const memoryInfo = window.performance.memory;
            const usedMB = Math.round(memoryInfo.usedJSHeapSize / 1024 / 1024);
            const totalMB = Math.round(memoryInfo.jsHeapSizeLimit / 1024 / 1024);
            const percentUsed = Math.round((usedMB / totalMB) * 100);
            
            console.debug(`Memory usage: ${usedMB}MB / ${totalMB}MB (${percentUsed}%)`);
            
            // Warn if memory usage is high
            if (percentUsed > 80) {
                console.warn(`⚠️ High memory usage detected: ${percentUsed}% of available heap`);
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
        this.generatedChunks.clear();
        this.currentZoneType = 'Forest';
        
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
     * Get current zone information for the player
     * @param {THREE.Vector3} playerPosition - Player's current position
     * @returns {object} - Zone information
     */
    getCurrentZoneInfo(playerPosition) {
        const zoneType = this.getZoneTypeAt(playerPosition.x, playerPosition.z);
        const zoneDensity = this.zoneDensities[zoneType];
        
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
            environmentObjects: this.environmentManager.environmentObjects.length,
            structures: this.structureManager.structures.length,
            currentZone: this.currentZoneType,
            trees: this.environmentManager.trees.length,
            rocks: this.environmentManager.rocks.length,
            buildings: this.structureManager.structures.filter(s => s.type === 'house').length
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
                currentZoneType: this.currentZoneType
            },
            settings: {
                dynamicWorldEnabled: this.dynamicWorldEnabled,
                environmentDensity: this.environmentDensity,
                densityLevel: this.lastPerformanceLevel || 'medium',
                zoneSize: this.zoneSize
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
                
            this.zoneSize = worldState.settings.zoneSize !== undefined ? 
                worldState.settings.zoneSize : this.zoneSize;
        }
        
        // When loading from a saved position, we need to reset the generatedChunks
        // to ensure content is generated around the player's new position
        this.generatedChunks = new Set();
        
        // Load procedural generation data if available
        if (worldState.procedural) {
            // We intentionally don't restore generatedChunks from saved state
            // to force regeneration of content around the player's new position
            this.currentZoneType = worldState.procedural.currentZoneType || 'Forest';
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
        this.initialTerrainCreated = true;
        
        // Force world update on next frame to generate content around player's position
        if (this.game && this.game.player && this.game.player.position) {
            console.debug("Forcing world update for saved position:", this.game.player.position);
            setTimeout(() => {
                this.updateWorldForPlayer(this.game.player.position);
            }, 100);
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
     * Get vegetation objects for the minimap (replaces getTrees)
     * @returns {Array} - Array of vegetation objects
     */
    getVegetation() {
        const vegetation = [];
        
        // Get vegetation from dynamic environment generator if available
        if (this.environmentManager && this.environmentManager.dynamicGenerator) {
            const vegetationObjects = this.environmentManager.dynamicGenerator.getVegetation();
            vegetationObjects.forEach(obj => {
                vegetation.push({
                    position: obj.position,
                    type: obj.type
                });
            });
        }
        
        // Fallback to environment manager trees for backward compatibility
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
     * Get all environment objects by category
     * @param {string} category - Category name (vegetation, rocks, magical, etc.)
     * @returns {Array} - Array of objects in category
     */
    getEnvironmentObjectsByCategory(category) {
        if (this.environmentManager && this.environmentManager.dynamicGenerator) {
            return this.environmentManager.dynamicGenerator.getObjectsByCategory(category).map(obj => ({
                position: obj.position,
                type: obj.type,
                size: obj.size
            }));
        }
        return [];
    }
    
    /**
     * Get rock objects for the minimap
     * @returns {Array} - Array of rock objects
     */
    getRocks() {
        const rocks = this.getEnvironmentObjectsByCategory('rocks');
        
        // Fallback to environment manager rocks for backward compatibility
        if (rocks.length === 0 && this.environmentManager && this.environmentManager.rocks) {
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
     * Get structure objects for the minimap (replaces getBuildings)
     * @returns {Array} - Array of structure objects
     */
    getStructures() {
        const structures = [];
        
        // Get structures from dynamic structure generator if available
        if (this.structureManager && this.structureManager.dynamicGenerator) {
            const allStructures = this.structureManager.dynamicGenerator.getAllStructures();
            allStructures.forEach(structure => {
                structures.push({
                    position: structure.position,
                    type: structure.type
                });
            });
        }
        
        // Fallback to structure manager structures for backward compatibility
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
     * Get magical objects for the minimap
     * @returns {Array} - Array of magical objects
     */
    getMagicalObjects() {
        return this.getEnvironmentObjectsByCategory('magical');
    }
    
    /**
     * Get all environment objects
     * @returns {Array} - Array of all environment objects
     */
    getAllEnvironmentObjects() {
        if (this.environmentManager && this.environmentManager.dynamicGenerator) {
            return this.environmentManager.dynamicGenerator.getAllObjects();
        }
        return [];
    }
    
    /**
     * Get paths for the minimap
     * @returns {Array} - Array of paths
     */
    getPaths() {
        this.paths = [];
        
        // Get paths from environment manager if available
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

    /**
     * Legacy chunk generation (safe fallback)
     * @param {number} chunkX - Chunk X coordinate
     * @param {number} chunkZ - Chunk Z coordinate
     */
    generateLegacyChunkContent(chunkX, chunkZ) {
        const chunkKey = `${chunkX},${chunkZ}`;
        
        // Skip if already generated
        if (this.generatedChunks.has(chunkKey)) {
            return;
        }
        
        console.debug(`Generating content for chunk ${chunkKey}`);
        
        // Calculate world coordinates for this chunk
        const worldX = chunkX * this.terrainManager.terrainChunkSize;
        const worldZ = chunkZ * this.terrainManager.terrainChunkSize;
        
        // Determine zone type for this chunk
        const zoneType = this.getZoneTypeAt(worldX, worldZ);
        const zoneDensity = this.zoneDensities[zoneType];
        
        if (!zoneDensity) {
            console.warn(`Unknown zone type: ${zoneType}`);
            this.generatedChunks.add(chunkKey); // Mark as generated to prevent retries
            return;
        }
        
        try {
            // Apply density reduction based on performance settings
            const performanceMultiplier = this.lowPerformanceMode ? 0.2 : 0.3;
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
}