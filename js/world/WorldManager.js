import * as THREE from 'three';
import { TerrainManager } from './terrain/TerrainManager.js';
import { StructureManager } from './structures/StructureManager.js';
import { EnvironmentManager } from './environment/EnvironmentManager.js';
import { InteractiveObjectManager } from './interactive/InteractiveObjectManager.js';
import { ZoneManager } from './zones/ZoneManager.js';
import { LightingManager } from './lighting/LightingManager.js';
import { FogManager } from './environment/FogManager.js';
import { TeleportManager } from './teleport/TeleportManager.js';
<<<<<<< Updated upstream
import { LODManager } from './LODManager.js';
=======
import { DynamicEnvironmentGenerator } from './environment/DynamicEnvironmentGenerator.js';
import { DynamicStructureGenerator } from './structures/DynamicStructureGenerator.js';
>>>>>>> Stashed changes


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
        this.lodManager = new LODManager(scene, this);
        
        // Initialize dynamic generators (disabled by default to prevent freezing)
        // Call this.initializeDynamicGenerators() manually when needed
        // this.initializeDynamicGenerators();
        
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
        
        // Performance tracking for LOD adjustments
        this.lastPerformanceLevel = null; // Track last performance level to detect changes
        
        // Performance monitoring
        this.frameRateHistory = [];
        this.frameRateHistoryMaxLength = 60; // Track last 60 frames
        this.lastPerformanceAdjustment = Date.now();
        this.performanceAdjustmentInterval = 5000; // Adjust every 5 seconds
        this.lowPerformanceMode = false;
        
        // Dynamic world generation settings
        this.dynamicWorldEnabled = true;
        this.environmentDensity = 2.0; // Reduced from 3.0 to 2.0 for better performance
        
        // Procedural generation settings
        this.generatedChunks = new Set(); // Track which chunks have been generated
        this.currentZoneType = 'Forest'; // Current zone type
        this.zoneSize = 500; // Reduced size of each zone in world units for more frequent zone changes
        this.zoneTransitionBuffer = 20; // Buffer zone for transitions
        
        // Flag to track initial terrain creation
        this.initialTerrainCreated = false;
        
        // Generation densities per zone type - significantly increased for more objects
        this.zoneDensities = {
            'Forest': { 
                environment: 2.5, // Increased density
                structures: 0.4, // Increased structure probability
                environmentTypes: ['tree', 'bush', 'flower', 'tall_grass', 'fern', 'berry_bush', 'ancient_tree', 'mushroom', 'fallen_log', 'tree_cluster', 'forest_flower', 'forest_debris', 'small_mushroom'],
                structureTypes: ['ruins', 'village', 'house', 'tower', 'temple', 'altar']
            },
            'Desert': { 
                environment: 1.8, // Increased density
                structures: 0.35, // Increased structure probability
                environmentTypes: ['desert_plant', 'cactus', 'oasis', 'sand_dune', 'desert_shrine', 'ash_pile', 'rock', 'rock_formation', 'small_peak'],
                structureTypes: ['ruins', 'temple', 'altar', 'house', 'tower']
            },
            'Mountain': { 
                environment: 2.0, // Increased density
                structures: 0.3, // Increased structure probability
                environmentTypes: ['pine_tree', 'mountain_rock', 'ice_shard', 'alpine_flower', 'small_peak', 'snow_patch', 'rock', 'rock_formation', 'tree'],
                structureTypes: ['ruins', 'fortress', 'tower', 'mountain', 'house', 'altar']
            },
            'Swamp': { 
                environment: 3.0, // Increased density
                structures: 0.4, // Increased structure probability
                environmentTypes: ['swamp_tree', 'lily_pad', 'swamp_plant', 'glowing_mushroom', 'moss', 'swamp_debris', 'tree', 'bush', 'fallen_log', 'mushroom'],
                structureTypes: ['ruins', 'dark_sanctum', 'altar', 'house', 'tower']
            },
            'Magical': { 
                environment: 2.5, // Increased density
                structures: 0.45, // Increased structure probability
                environmentTypes: ['glowing_flowers', 'crystal_formation', 'fairy_circle', 'magical_stone', 'ancient_artifact', 'mysterious_portal', 'ancient_tree', 'glowing_mushroom', 'crystal_formation'],
                structureTypes: ['ruins', 'temple', 'altar', 'tower', 'dark_sanctum']
            }
        };
        
        // Dynamic generation settings
        this.dynamicGenerationSettings = {
            environmentDensity: 1.2,
            structureDensity: 0.8,
            enableClusters: true,
            enableSpecialFeatures: true,
            useThematicAreas: true
        };
    }
    
    /**
     * Initialize dynamic generators safely with performance controls
     */
    initializeDynamicGenerators() {
        console.log('🔄 Initializing dynamic generators...');
        
        // Check if already initialized
        if (this.dynamicEnvironmentGenerator && this.dynamicStructureGenerator) {
            console.log('✅ Dynamic generators already initialized');
            return;
        }
        
        // Wait for environment manager to be ready with its factory
        setTimeout(() => {
            try {
                if (this.environmentManager && this.environmentManager.environmentFactory) {
                    this.dynamicEnvironmentGenerator = new DynamicEnvironmentGenerator(
                        this.scene, 
                        this, 
                        this.environmentManager.environmentFactory
                    );
                    console.log('✅ Dynamic Environment Generator initialized');
                } else {
                    console.warn('⚠️ Environment factory not available for dynamic generator');
                }
                
                if (this.structureManager) {
                    this.dynamicStructureGenerator = new DynamicStructureGenerator(
                        this.scene,
                        this,
                        this.structureManager
                    );
                    console.log('✅ Dynamic Structure Generator initialized');
                }
                
                // Set conservative default settings to prevent freezes
                this.dynamicGenerationSettings = {
                    environmentDensity: 0.3,     // Much lower density
                    structureDensity: 0.1,       // Much lower structure density
                    enableClusters: false,       // Disable clusters initially
                    enableSpecialFeatures: false, // Disable special features initially
                    useThematicAreas: false      // Disable thematic areas initially
                };
                
                console.log('✅ Dynamic generators initialized with safe settings');
            } catch (error) {
                console.error('❌ Error initializing dynamic generators:', error);
            }
        }, 100);
    }
    
    /**
     * Initialize dynamic generators with custom settings (use carefully)
     */
    initializeDynamicGeneratorsWithSettings(settings = {}) {
        this.initializeDynamicGenerators();
        
        setTimeout(() => {
            this.dynamicGenerationSettings = {
                environmentDensity: settings.environmentDensity || 0.3,
                structureDensity: settings.structureDensity || 0.1,
                enableClusters: settings.enableClusters || false,
                enableSpecialFeatures: settings.enableSpecialFeatures || false,
                useThematicAreas: settings.useThematicAreas || false
            };
            console.log('✅ Dynamic generators initialized with custom settings:', this.dynamicGenerationSettings);
        }, 200);
    }
    
    // setGame method removed - game is now passed in constructor
    
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
        // Try dynamic generation first if available
        if (this.dynamicEnvironmentGenerator && this.dynamicStructureGenerator) {
            return this.generateDynamicChunkContent(chunkX, chunkZ);
        }
        
        // Fallback to original chunk generation
        const chunkKey = `${chunkX},${chunkZ}`;
        
        // Skip if already generated
        if (this.generatedChunks.has(chunkKey)) {
            return;
        }
        
        console.debug(`Generating content for chunk ${chunkKey} (legacy method)`);
        
        // Calculate world coordinates for this chunk
        const worldX = chunkX * this.terrainManager.terrainChunkSize;
        const worldZ = chunkZ * this.terrainManager.terrainChunkSize;
        
        // Determine zone type for this chunk
        const zoneType = this.getZoneTypeAt(worldX, worldZ);
        const zoneDensity = this.zoneDensities[zoneType];
        
        if (!zoneDensity) {
            console.warn(`Unknown zone type: ${zoneType}`);
            return;
        }
        
        try {
            // Generate environment objects with reduced density for better performance
            const reducedDensity = { ...zoneDensity };
            reducedDensity.environment = zoneDensity.environment * 0.6; // Reduce environment density by 40%
            reducedDensity.structures = zoneDensity.structures * 0.5; // Reduce structure probability by 50%
            
            // Generate environment objects
            this.generateEnvironmentObjectsForChunk(chunkX, chunkZ, zoneType, reducedDensity);
            
            // Generate structures - but only if this is not the initial loading
            // This helps prevent freezing during initial load
            if (this.initialTerrainCreated) {
                this.generateStructuresForChunk(chunkX, chunkZ, zoneType, reducedDensity);
            }
            
            // Mark chunk as generated
            this.generatedChunks.add(chunkKey);
        } catch (error) {
            console.error(`Error generating content for chunk ${chunkKey}:`, error);
            // Still mark as generated to prevent repeated attempts that might cause freezing
            this.generatedChunks.add(chunkKey);
        }
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
            
            // Generate clusters
            for (let c = 0; c < clusterCount; c++) {
                // Random cluster center within chunk
                const clusterCenterX = worldX + Math.random() * chunkSize;
                const clusterCenterZ = worldZ + Math.random() * chunkSize;
                
                // Random cluster radius - increased by 5x for more spacing between objects
                const clusterRadius = (3 + Math.random() * 7) * 5; // Increased from 3-10 to 15-50
                
                // Generate objects in this cluster
                for (let i = 0; i < objectsPerCluster; i++) {
                    // Random angle and distance from cluster center
                    const angle = Math.random() * Math.PI * 2;
                    // Minimum distance to ensure objects aren't too close together
                    const minDistance = clusterRadius * 0.2; // At least 20% of radius
                    const distance = minDistance + Math.random() * (clusterRadius - minDistance);
                    
                    // Calculate position
                    const x = clusterCenterX + Math.cos(angle) * distance;
                    const z = clusterCenterZ + Math.sin(angle) * distance;
                    
                    // Make sure position is within chunk bounds
                    if (x >= worldX && x < worldX + chunkSize && z >= worldZ && z < worldZ + chunkSize) {
                        // Random object type from zone types - weighted to create more natural groupings
                        let objectType;
                        
                        // Make sure we have valid environment types
                        if (!zoneDensity.environmentTypes || zoneDensity.environmentTypes.length === 0) {
                            console.warn(`No environment types defined for zone ${zoneType}`);
                            continue;
                        }
                        
                        // 70% chance to use the same object type for the cluster
                        if (c % 3 === 0 && i > 0) {
                            // Use a consistent object type for this cluster
                            objectType = zoneDensity.environmentTypes[
                                c % zoneDensity.environmentTypes.length
                            ];
                        } else {
                            // Random object type
                            objectType = zoneDensity.environmentTypes[
                                Math.floor(Math.random() * zoneDensity.environmentTypes.length)
                            ];
                        }
                        
                        // Random scale with less variation for better performance
                        const scale = 0.5 + Math.random() * 1.0; // Reduced from 0.3-2.3 to 0.5-1.5
                        
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
                    
                    // Make sure we have valid environment types
                    if (!zoneDensity.environmentTypes || zoneDensity.environmentTypes.length === 0) {
                        console.warn(`No environment types defined for zone ${zoneType}`);
                        continue;
                    }
                    
                    // Random object type from zone types
                    const objectType = zoneDensity.environmentTypes[
                        Math.floor(Math.random() * zoneDensity.environmentTypes.length)
                    ];
                    
                    // Random scale with less variation
                    const scale = 0.5 + Math.random() * 1.0; // Reduced from 0.3-2.3 to 0.5-1.5
                    
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
        } catch (error) {
            console.error(`Error generating environment objects for chunk ${chunkX},${chunkZ}:`, error);
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
            
            // Calculate number of structures based on density - but with reduced count
            const baseStructureCount = 1; // Reduced from 2 to 1 structure per chunk
            // 50% chance to generate any structures at all to improve performance
            if (Math.random() > 0.5) {
                return; // Skip structure generation for this chunk
            }
            
            // Generate at most 2 structures per chunk
            const structureCount = Math.random() < zoneDensity.structures ? 
                Math.min(2, Math.floor(baseStructureCount + Math.random() * 2)) : 1;
            
            console.debug(`Generating ${structureCount} structures for chunk ${chunkX},${chunkZ} (${zoneType})`);
            
            // Create a village with a reduced 5% chance (down from 15%) if this is a suitable zone
            const createVillage = Math.random() < 0.05 && 
                (zoneType === 'Forest' || zoneType === 'Magical' || zoneType === 'Mountain');
            
            if (createVillage) {
                // Place village near center of chunk
                const villageX = worldX + chunkSize * 0.5;
                const villageZ = worldZ + chunkSize * 0.5;
                
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
                    
                    for (let i = 0; i < buildingCount; i++) {
                        // Position buildings in a circle around the village with increased spacing
                        const angle = (i / buildingCount) * Math.PI * 2;
                        // Increase distance by 5x for more spacing
                        const distance = (15 + Math.random() * 10) * 5; // Increased from 15-25 to 75-125
                        
                        const buildingX = villageX + Math.cos(angle) * distance;
                        const buildingZ = villageZ + Math.sin(angle) * distance;
                        
                        // Make sure building is within chunk bounds
                        if (buildingX >= worldX && buildingX < worldX + chunkSize && 
                            buildingZ >= worldZ && buildingZ < worldZ + chunkSize) {
                            
                            // Create a house or tower
                            const buildingType = Math.random() < 0.7 ? 'house' : 'tower';
                            let building = null;
                            
                            if (buildingType === 'house') {
                                // Smaller buildings for better performance
                                const width = 3 + Math.random() * 2; // Reduced from 3-7 to 3-5
                                const depth = 3 + Math.random() * 2; // Reduced from 3-7 to 3-5
                                const height = 2 + Math.random() * 1; // Reduced from 2-5 to 2-3
                                building = this.structureManager.createBuilding(buildingX, buildingZ, width, depth, height);
                            } else {
                                building = this.structureManager.createTower(buildingX, buildingZ);
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
            } else {
                // Generate individual structures
                for (let i = 0; i < structureCount; i++) {
                    // Random position within chunk (but not too close to edges)
                    const margin = chunkSize * 0.1; // 10% margin
                    const x = worldX + margin + Math.random() * (chunkSize - 2 * margin);
                    const z = worldZ + margin + Math.random() * (chunkSize - 2 * margin);
                    
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
        } catch (error) {
            console.error(`Error generating structures for chunk ${chunkX},${chunkZ}:`, error);
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
        if (this.environmentManager && this.environmentManager.updateForPlayer) {
            this.environmentManager.updateForPlayer(playerPosition, effectiveDrawDistance);
        }
        
        // ENHANCED: Generate procedural content for chunks around the player
        // This ensures both environment objects and structures are generated
        if (this.dynamicWorldEnabled) {
            // Set initialTerrainCreated to true after first update
            // This allows structures to be generated in subsequent updates
            if (!this.initialTerrainCreated) {
                console.debug("Initial terrain creation complete, enabling structure generation");
                this.initialTerrainCreated = true;
            }
            
            // Reduced content generation distance for better performance
            const contentGenDistance = 3; // Reduced from 4 to 3 chunks in each direction
            
            // Generate content in a spiral pattern starting from player's position
            // This ensures closer chunks are generated first
            const spiralCoords = [];
            
            // Generate spiral coordinates
            for (let layer = 0; layer <= contentGenDistance; layer++) {
                if (layer === 0) {
                    // Center point (player's chunk)
                    spiralCoords.push([playerChunkX, playerChunkZ]);
                } else {
                    // Top edge (left to right)
                    for (let i = -layer; i <= layer; i++) {
                        spiralCoords.push([playerChunkX + i, playerChunkZ - layer]);
                    }
                    // Right edge (top to bottom)
                    for (let i = -layer + 1; i <= layer; i++) {
                        spiralCoords.push([playerChunkX + layer, playerChunkZ + i]);
                    }
                    // Bottom edge (right to left)
                    for (let i = layer - 1; i >= -layer; i--) {
                        spiralCoords.push([playerChunkX + i, playerChunkZ + layer]);
                    }
                    // Left edge (bottom to top)
                    for (let i = layer - 1; i >= -layer + 1; i--) {
                        spiralCoords.push([playerChunkX - layer, playerChunkZ + i]);
                    }
                }
            }
            
            // Generate content for chunks in spiral order - but limit how many we process per frame
            // This prevents freezing by spreading the work across multiple frames
            const maxChunksPerFrame = 3; // Process at most 3 chunks per frame
            let chunksProcessed = 0;
            
            for (const [x, z] of spiralCoords) {
                // Only process a limited number of chunks per frame
                if (chunksProcessed >= maxChunksPerFrame) break;
                
                // Skip if already generated
                const chunkKey = `${x},${z}`;
                if (this.generatedChunks.has(chunkKey)) continue;
                
                // Generate content for this chunk
                this.generateChunkContent(x, z);
                chunksProcessed++;
            }
            
            // Update current zone type based on player position
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
                    this.generateZoneLandmark(playerPosition, newZoneType);
                }
            }
        }
        
        // Update lighting, fog, and other world systems
        this.updateWorldSystems(playerPosition, effectiveDrawDistance);
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
                generatedChunks: Array.from(this.generatedChunks),
                currentZoneType: this.currentZoneType
            },
            settings: {
                dynamicWorldEnabled: this.dynamicWorldEnabled,
                environmentDensity: this.environmentDensity,
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
                
            this.environmentDensity = worldState.settings.environmentDensity !== undefined ? 
                worldState.settings.environmentDensity : this.environmentDensity;
                
            this.zoneSize = worldState.settings.zoneSize !== undefined ? 
                worldState.settings.zoneSize : this.zoneSize;
            
            if (this.environmentManager && this.environmentManager.setDensity) {
                this.environmentManager.setDensity(this.environmentDensity);
            }
        }
        
        // Load procedural generation data if available
        if (worldState.procedural) {
            this.generatedChunks = new Set(worldState.procedural.generatedChunks || []);
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
    
    // ============================================================================
    // DYNAMIC GENERATION DEBUG AND TEST METHODS
    // ============================================================================
    
    /**
     * Test dynamic generation with minimal objects to identify freezing cause
     */
    testDynamicGeneration() {
        console.log('🧪 Testing dynamic generation...');
        
        try {
            // Test 1: Check if generators can be initialized
            console.log('📋 Test 1: Initializing generators...');
            this.initializeDynamicGenerators();
            
            setTimeout(() => {
                // Test 2: Try generating just one object
                console.log('📋 Test 2: Generating single object...');
                if (this.dynamicEnvironmentGenerator) {
                    try {
                        const objects = this.dynamicEnvironmentGenerator.generateEnvironmentObjects(
                            new THREE.Vector3(0, 0, 0),
                            5, // Very small radius
                            'FOREST',
                            0.1 // Very low density
                        );
                        console.log(`✅ Generated ${objects.length} objects successfully`);
                    } catch (error) {
                        console.error('❌ Error in object generation:', error);
                    }
                } else {
                    console.error('❌ Environment generator not available');
                }
                
                // Test 3: Check memory usage
                console.log('📋 Test 3: Memory check...');
                if (performance.memory) {
                    console.log(`🧠 Memory: ${Math.round(performance.memory.usedJSHeapSize / 1024 / 1024)}MB used`);
                }
                
                console.log('✅ Basic test complete');
            }, 500);
            
        } catch (error) {
            console.error('❌ Error in test:', error);
        }
    }
    
    /**
     * Emergency stop for freezing situations
     */
    emergencyStop() {
        console.log('🚨 Emergency stop activated');
        
        // Clear all dynamic content
        if (this.dynamicEnvironmentGenerator) {
            this.dynamicEnvironmentGenerator.clear();
        }
        if (this.dynamicStructureGenerator) {
            this.dynamicStructureGenerator.clear();
        }
        
        // Reset settings to minimal
        this.dynamicGenerationSettings = {
            environmentDensity: 0.1,
            structureDensity: 0.05,
            enableClusters: false,
            enableSpecialFeatures: false,
            useThematicAreas: false
        };
        
        console.log('✅ Emergency stop complete');
    }
    
    // ============================================================================
    // DYNAMIC GENERATION METHODS
    // ============================================================================
    
    /**
     * Generate a complete diverse area with all types of objects (SAFE VERSION)
     * @param {THREE.Vector3} center - Center of area to generate
     * @param {number} radius - Radius of area
     * @param {string} biome - Biome type
     * @param {boolean} batch - Use batched generation to prevent freezing
     * @returns {Object} - Generated area info
     */
    generateDiverseArea(center, radius = 50, biome = 'FOREST', batch = true) {
        if (!this.dynamicEnvironmentGenerator || !this.dynamicStructureGenerator) {
            console.warn('🚫 Dynamic generators not initialized yet. Call initializeDynamicGenerators() first.');
            return null;
        }

        // Safety checks to prevent freeze
        if (radius > 100) {
            console.warn('⚠️ Large radius detected, capping at 100 to prevent freeze');
            radius = 100;
        }

        console.log(`🌍 Generating diverse ${biome} area at (${center.x}, ${center.z}) with radius ${radius}`);
        
        if (batch) {
            return this.generateDiverseAreaBatched(center, radius, biome);
        }
        
        try {
            // Generate environment objects with safety limits
            const safeEnvironmentDensity = Math.min(this.dynamicGenerationSettings.environmentDensity, 0.5);
            const environmentObjects = this.dynamicEnvironmentGenerator.generateEnvironmentObjects(
                center,
                radius,
                biome,
                safeEnvironmentDensity
            );
            
            console.log(`🌱 Generated ${environmentObjects.length} environment objects:`);
            this.logObjectStats(environmentObjects);
            
            // Generate a small settlement with safety limits
            const settlementCenter = new THREE.Vector3(
                center.x + (Math.random() - 0.5) * radius * 0.3, // Smaller offset
                center.y,
                center.z + (Math.random() - 0.5) * radius * 0.3
            );
            
            const settlementPattern = this.selectSettlementPattern(biome);
            const safeStructureDensity = Math.min(this.dynamicGenerationSettings.structureDensity, 0.2);
            const structures = this.dynamicStructureGenerator.generateSettlement(
                settlementCenter,
                Math.min(radius * 0.2, 20), // Cap settlement size
                biome,
                settlementPattern,
                safeStructureDensity
            );
            
            console.log(`🏘️ Generated ${structures.length} structures in ${settlementPattern} pattern`);
            this.logStructureStats(structures);
            
            // Skip clusters for now to prevent freezing
            if (this.dynamicGenerationSettings.enableClusters && structures.length < 10) {
                console.log('⚠️ Skipping clusters - too many objects already generated');
            }
            
            return {
                environmentObjects,
                structures,
                biome,
                center,
                radius
            };
        } catch (error) {
            console.error('❌ Error generating diverse area:', error);
            return null;
        }
    }
    
    /**
     * Generate area in batches to prevent freezing
     */
    generateDiverseAreaBatched(center, radius, biome) {
        console.log('🔄 Using batched generation to prevent freezing...');
        
        const result = {
            environmentObjects: [],
            structures: [],
            biome,
            center,
            radius
        };
        
        // Generate in smaller chunks over time
        const chunkSize = 20;
        const chunks = Math.ceil(radius / chunkSize);
        let currentChunk = 0;
        
        const generateChunk = () => {
            if (currentChunk >= chunks) {
                console.log('✅ Batched generation complete');
                return;
            }
            
            const chunkCenter = new THREE.Vector3(
                center.x + (currentChunk - chunks/2) * chunkSize,
                center.y,
                center.z
            );
            
            try {
                // Generate small batch of objects
                const objects = this.dynamicEnvironmentGenerator.generateEnvironmentObjects(
                    chunkCenter,
                    chunkSize,
                    biome,
                    0.2 // Very low density per chunk
                );
                
                result.environmentObjects.push(...objects);
                console.log(`📦 Chunk ${currentChunk + 1}/${chunks}: Generated ${objects.length} objects`);
                
                currentChunk++;
                setTimeout(generateChunk, 50); // Wait 50ms between chunks
            } catch (error) {
                console.error('❌ Error in batched generation:', error);
            }
        };
        
        generateChunk();
        return result;
    }
    
    /**
     * Generate multiple diverse biome areas
     * @returns {Array} - Array of generated areas
     */
    generateMultipleBiomes() {
        if (!this.dynamicEnvironmentGenerator || !this.dynamicStructureGenerator) {
            console.warn('🚫 Dynamic generators not initialized yet');
            return [];
        }

        const biomes = ['FOREST', 'MOUNTAINS', 'DESERT', 'SWAMP', 'RUINS'];
        const areas = [];
        
        biomes.forEach((biome, index) => {
            const angle = (index / biomes.length) * Math.PI * 2;
            const distance = 100;
            const center = new THREE.Vector3(
                Math.cos(angle) * distance,
                0,
                Math.sin(angle) * distance
            );
            
            const area = this.generateDiverseArea(center, 60, biome);
            if (area) {
                areas.push(area);
            }
        });
        
        console.log(`🌍 Generated ${areas.length} diverse biome areas`);
        return areas;
    }
    
    /**
     * Generate themed area (e.g., magical forest, haunted ruins, etc.)
     * @param {THREE.Vector3} center - Center position
     * @param {string} theme - Theme name
     * @param {number} radius - Area radius
     * @returns {Object} - Generated themed area
     */
    generateThemedArea(center, theme, radius = 40) {
        if (!this.dynamicEnvironmentGenerator || !this.dynamicStructureGenerator) {
            console.warn('🚫 Dynamic generators not initialized yet');
            return null;
        }

        console.log(`🎨 Generating ${theme} themed area`);
        
        switch (theme) {
            case 'magical_forest':
                return this.generateMagicalForest(center, radius);
            case 'haunted_ruins':
                return this.generateHauntedRuins(center, radius);
            case 'mountain_village':
                return this.generateMountainVillage(center, radius);
            case 'desert_oasis':
                return this.generateDesertOasis(center, radius);
            case 'swamp_mystery':
                return this.generateSwampMystery(center, radius);
            default:
                return this.generateDiverseArea(center, radius);
        }
    }
    
    /**
     * Generate magical forest theme
     */
    generateMagicalForest(center, radius) {
        // High density of magical objects and glowing features
        const objects = this.dynamicEnvironmentGenerator.generateEnvironmentObjects(
            center, radius, 'FOREST', 1.5
        );
        
        // Generate multiple fairy circles and magical groves
        for (let i = 0; i < 3; i++) {
            const clusterCenter = new THREE.Vector3(
                center.x + (Math.random() - 0.5) * radius * 0.6,
                center.y,
                center.z + (Math.random() - 0.5) * radius * 0.6
            );
            this.dynamicEnvironmentGenerator.generateCluster(clusterCenter, 'magical_grove', 5);
        }
        
        // Small mystical settlement
        const structures = this.dynamicStructureGenerator.generateSettlement(
            center, radius * 0.2, 'FOREST', 'CIRCULAR', 0.5
        );
        
        return { objects, structures, theme: 'magical_forest' };
    }
    
    /**
     * Generate haunted ruins theme
     */
    generateHauntedRuins(center, radius) {
        const objects = this.dynamicEnvironmentGenerator.generateEnvironmentObjects(
            center, radius, 'RUINS', 1.0
        );
        
        const structures = this.dynamicStructureGenerator.generateSettlement(
            center, radius * 0.4, 'RUINS', 'SCATTERED', 0.8
        );
        
        return { objects, structures, theme: 'haunted_ruins' };
    }
    
    /**
     * Generate mountain village theme
     */
    generateMountainVillage(center, radius) {
        const objects = this.dynamicEnvironmentGenerator.generateEnvironmentObjects(
            center, radius, 'MOUNTAINS', 0.8
        );
        
        const structures = this.dynamicStructureGenerator.generateSettlement(
            center, radius * 0.3, 'MOUNTAINS', 'LINEAR', 1.0
        );
        
        return { objects, structures, theme: 'mountain_village' };
    }
    
    /**
     * Generate desert oasis theme
     */
    generateDesertOasis(center, radius) {
        const objects = this.dynamicEnvironmentGenerator.generateEnvironmentObjects(
            center, radius, 'DESERT', 1.2
        );
        
        const structures = this.dynamicStructureGenerator.generateSettlement(
            center, radius * 0.25, 'DESERT', 'CIRCULAR', 0.6
        );
        
        return { objects, structures, theme: 'desert_oasis' };
    }
    
    /**
     * Generate swamp mystery theme
     */
    generateSwampMystery(center, radius) {
        const objects = this.dynamicEnvironmentGenerator.generateEnvironmentObjects(
            center, radius, 'SWAMP', 1.3
        );
        
        const structures = this.dynamicStructureGenerator.generateSettlement(
            center, radius * 0.2, 'SWAMP', 'SCATTERED', 0.4
        );
        
        return { objects, structures, theme: 'swamp_mystery' };
    }
    
    /**
     * Generate interesting clusters of objects
     */
    generateInterestingClusters(center, radius, biome) {
        const clusterTypes = [
            'mushroom_patch',
            'rock_formation',
            'flower_field',
            'magical_grove'
        ];
        
        // Generate 2-4 clusters per area
        const clusterCount = 2 + Math.floor(Math.random() * 3);
        
        for (let i = 0; i < clusterCount; i++) {
            const clusterType = clusterTypes[Math.floor(Math.random() * clusterTypes.length)];
            const clusterCenter = new THREE.Vector3(
                center.x + (Math.random() - 0.5) * radius * 0.8,
                center.y,
                center.z + (Math.random() - 0.5) * radius * 0.8
            );
            
            const objectCount = 3 + Math.floor(Math.random() * 8);
            const clusterObjects = this.dynamicEnvironmentGenerator.generateCluster(
                clusterCenter,
                clusterType,
                objectCount
            );
            
            console.log(`🎯 Generated ${clusterType} cluster with ${clusterObjects.length} objects`);
        }
    }
    
    /**
     * Select appropriate settlement pattern for biome
     */
    selectSettlementPattern(biome) {
        const patterns = {
            FOREST: ['ORGANIC', 'CLUSTERED'],
            MOUNTAINS: ['LINEAR', 'ORGANIC'],
            DESERT: ['CIRCULAR', 'CLUSTERED'],
            SWAMP: ['SCATTERED', 'LINEAR'],
            RUINS: ['SCATTERED', 'CIRCULAR']
        };
        
        const biomePatterns = patterns[biome] || patterns.FOREST;
        return biomePatterns[Math.floor(Math.random() * biomePatterns.length)];
    }
    
    /**
     * Log statistics about generated objects
     */
    logObjectStats(objects) {
        const stats = {};
        objects.forEach(obj => {
            stats[obj.type] = (stats[obj.type] || 0) + 1;
        });
        
        Object.entries(stats).forEach(([type, count]) => {
            console.log(`  • ${type}: ${count}`);
        });
    }
    
    /**
     * Log statistics about generated structures
     */
    logStructureStats(structures) {
        const stats = {};
        structures.forEach(structure => {
            stats[structure.type] = (stats[structure.type] || 0) + 1;
        });
        
        Object.entries(stats).forEach(([type, count]) => {
            console.log(`  • ${type}: ${count}`);
        });
    }
    
    /**
     * Update dynamic generation settings
     */
    updateDynamicGenerationSettings(newSettings) {
        this.dynamicGenerationSettings = { ...this.dynamicGenerationSettings, ...newSettings };
        console.log('📝 Updated dynamic generation settings:', this.dynamicGenerationSettings);
    }
    
    /**
     * Clear all dynamically generated content
     */
    clearDynamicContent() {
        if (this.dynamicEnvironmentGenerator) {
            this.dynamicEnvironmentGenerator.clear();
        }
        if (this.dynamicStructureGenerator) {
            this.dynamicStructureGenerator.clear();
        }
        console.log('🧹 Cleared all dynamic content');
    }
    
    /**
     * Get all generated content for minimap/debugging
     */
    getAllDynamicContent() {
        const content = {
            environmentObjects: [],
            structures: [],
            vegetation: [],
            rocks: [],
            magicalObjects: []
        };
        
        if (this.dynamicEnvironmentGenerator) {
            content.environmentObjects = this.dynamicEnvironmentGenerator.getAllObjects();
            content.vegetation = this.dynamicEnvironmentGenerator.getVegetation();
            content.rocks = this.dynamicEnvironmentGenerator.getRocks();
            content.magicalObjects = this.dynamicEnvironmentGenerator.getMagicalObjects();
        }
        
        if (this.dynamicStructureGenerator) {
            content.structures = this.dynamicStructureGenerator.getAllStructures();
        }
        
        return content;
    }
    
    /**
     * Enhanced chunk generation with dynamic system (SAFE VERSION)
     */
    generateDynamicChunkContent(chunkX, chunkZ) {
        const chunkKey = `${chunkX},${chunkZ}`;
        
        // Skip if already generated
        if (this.generatedChunks.has(chunkKey)) {
            return;
        }
        
        // SAFETY: Don't use dynamic generation for chunks to prevent freezing
        console.debug('⚠️ Skipping dynamic chunk generation to prevent freezing, using legacy method');
        return this.generateLegacyChunkContent(chunkX, chunkZ);
        
        // TODO: Enable this when dynamic generation is more stable
        /*
        // Check if dynamic generators are available
        if (!this.dynamicEnvironmentGenerator || !this.dynamicStructureGenerator) {
            console.debug('Dynamic generators not ready, falling back to standard generation');
            return this.generateLegacyChunkContent(chunkX, chunkZ);
        }
        
        console.debug(`🎯 Generating dynamic content for chunk ${chunkKey}`);
        
        // Calculate world coordinates for this chunk
        const worldX = chunkX * this.terrainManager.terrainChunkSize;
        const worldZ = chunkZ * this.terrainManager.terrainChunkSize;
        const chunkCenter = new THREE.Vector3(
            worldX + this.terrainManager.terrainChunkSize / 2,
            0,
            worldZ + this.terrainManager.terrainChunkSize / 2
        );
        
        // Determine zone type for this chunk
        const zoneType = this.getZoneTypeAt(worldX, worldZ).toUpperCase();
        const chunkRadius = Math.min(this.terrainManager.terrainChunkSize / 2, 25); // Cap chunk radius
        
        try {
            // Generate very few environment objects using dynamic system
            const safeEnvironmentDensity = Math.min(this.dynamicGenerationSettings.environmentDensity * 0.1, 0.05);
            const environmentObjects = this.dynamicEnvironmentGenerator.generateEnvironmentObjects(
                chunkCenter,
                chunkRadius,
                zoneType,
                safeEnvironmentDensity // Much lower density for chunks
            );
            
            // Cap the number of objects per chunk
            if (environmentObjects.length > 5) {
                environmentObjects.splice(5); // Remove excess objects
            }
            
            console.debug(`Generated ${environmentObjects.length} dynamic environment objects for chunk ${chunkKey}`);
            
            // Very rarely generate structures in chunks
            if (Math.random() < 0.02) { // Only 2% chance for structures in chunk
                const safeStructureDensity = Math.min(this.dynamicGenerationSettings.structureDensity * 0.1, 0.02);
                const structures = this.dynamicStructureGenerator.generateSettlement(
                    chunkCenter,
                    Math.min(chunkRadius * 0.3, 10), // Very small settlements
                    zoneType,
                    'SCATTERED',
                    safeStructureDensity
                );
                
                // Cap structures per chunk
                if (structures.length > 2) {
                    structures.splice(2);
                }
                
                console.debug(`Generated ${structures.length} structures for chunk ${chunkKey}`);
            }
            
            // Mark chunk as generated
            this.generatedChunks.add(chunkKey);
        } catch (error) {
            console.error(`Error generating dynamic content for chunk ${chunkKey}:`, error);
            // Fall back to standard generation
            this.generateLegacyChunkContent(chunkX, chunkZ);
        }
        */
    }
    
    /**
     * Legacy chunk generation (safe fallback)
     */
    generateLegacyChunkContent(chunkX, chunkZ) {
        // This is the original method body moved to a separate function
        const chunkKey = `${chunkX},${chunkZ}`;
        
        // Skip if already generated
        if (this.generatedChunks.has(chunkKey)) {
            return;
        }
        
        console.debug(`Generating content for chunk ${chunkKey} (legacy method)`);
        
        // Calculate world coordinates for this chunk
        const worldX = chunkX * this.terrainManager.terrainChunkSize;
        const worldZ = chunkZ * this.terrainManager.terrainChunkSize;
        
        // Determine zone type for this chunk
        const zoneType = this.getZoneTypeAt(worldX, worldZ);
        const zoneDensity = this.zoneDensities[zoneType];
        
        if (!zoneDensity) {
            console.warn(`Unknown zone type: ${zoneType}`);
            return;
        }
        
        try {
            // Generate environment objects with heavily reduced density for better performance
            const reducedDensity = { ...zoneDensity };
            reducedDensity.environment = zoneDensity.environment * 0.3; // Reduce environment density by 70%
            reducedDensity.structures = zoneDensity.structures * 0.2; // Reduce structure probability by 80%
            
            // Generate environment objects
            this.generateEnvironmentObjectsForChunk(chunkX, chunkZ, zoneType, reducedDensity);
            
            // Generate structures - but only if this is not the initial loading
            // This helps prevent freezing during initial load
            if (this.initialTerrainCreated && Math.random() < 0.1) { // Only 10% chance
                this.generateStructuresForChunk(chunkX, chunkZ, zoneType, reducedDensity);
            }
            
            // Mark chunk as generated
            this.generatedChunks.add(chunkKey);
        } catch (error) {
            console.error(`Error generating content for chunk ${chunkKey}:`, error);
            // Still mark as generated to prevent repeated attempts that might cause freezing
            this.generatedChunks.add(chunkKey);
        }
    }
}