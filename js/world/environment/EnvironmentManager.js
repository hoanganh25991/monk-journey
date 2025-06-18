import * as THREE from 'three';
import { Tree } from './Tree.js';
import { Rock } from './Rock.js';
import { Bush } from './Bush.js';
import { Flower } from './Flower.js';
import { TallGrass } from './TallGrass.js';
import { AncientTree } from './AncientTree.js';
import { EnvironmentFactory } from './EnvironmentFactory.js';
import { ENVIRONMENT_OBJECTS, ENVIRONMENT_CATEGORIES } from '../../config/map/environment.js';

/**
 * Manages environment objects like trees, rocks, bushes, etc.
 * Simplified to focus only on loading environment objects from map data
 */
export class EnvironmentManager {
    constructor(scene, MapManager, game = null) {
        this.scene = scene;
        this.MapManager = MapManager;
        this.game = game;
        
        // Initialize the environment factory
        this.environmentFactory = new EnvironmentFactory(scene, MapManager);
        
        // Environment object collections
        this.environmentObjects = []; // Global list of all environment objects
        this.environmentObjectsByChunk = {}; // Objects organized by chunk
        
        // Environment generation settings
        this.environmentDensity = 1.0; // Default density factor (0.0 to 1.0)
        this.visibleChunks = {}; // Track which chunks are currently visible
        
        // Get environment object types from factory and add traditional types
        const factoryTypes = this.environmentFactory.getRegisteredTypes ? 
            this.environmentFactory.getRegisteredTypes() : [];
        
        // Get all environment object types from the constants
        const configTypes = Object.values(ENVIRONMENT_OBJECTS);
        
        // Combine both sets of types, removing duplicates
        this.environmentObjectTypes = [...new Set([...configTypes, ...factoryTypes])];
        
        // For minimap functionality
        this.trees = [];
        this.rocks = [];
        this.bushes = [];
        this.flowers = [];
        this.tallGrass = [];
        this.ancientTrees = [];
        this.smallPlants = [];
        this.fallenLogs = [];
        this.mushrooms = [];
        this.rockFormations = [];
        this.shrines = [];
        this.stumps = [];
        this.waterfalls = [];
        this.crystalFormations = [];
        this.mosses = [];
    }

    /**
     * Initialize the environment manager
     */
    init() {
        console.debug('Environment manager initialized');
    }

    /**
     * Load environment objects from map data
     * @param {Array} environmentData - Array of environment object data from map
     */
    loadFromMapData(environmentData) {
        if (!environmentData || !Array.isArray(environmentData)) {
            console.warn('No environment data provided to load');
            return;
        }

        console.debug(`Loading ${environmentData.length} environment objects from map data`);

        // Clear existing environment objects
        this.clear();

        environmentData.forEach(envData => {
            if (envData.position && envData.type) {
                const object = this.createEnvironmentObject(
                    envData.type, 
                    envData.position.x, 
                    envData.position.z,
                    envData.scale || 1.0
                );

                if (object) {
                    // Apply rotation if specified
                    if (envData.rotation !== undefined) {
                        object.rotation.y = envData.rotation;
                    }
                    
                    // Add to environment objects
                    this.environmentObjects.push({
                        type: envData.type,
                        object: object,
                        position: new THREE.Vector3(
                            envData.position.x, 
                            envData.position.y || 0, 
                            envData.position.z
                        ),
                        scale: envData.scale || 1.0,
                        id: envData.id,
                        groupId: envData.groupId
                    });
                    
                    // Add to type-specific collections for minimap
                    this.addToTypeCollection(envData.type, object);
                }
            }
        });

        console.debug(`Successfully loaded ${this.environmentObjects.length} environment objects`);
    }
    
    /**
     * Add object to the appropriate type-specific collection
     * @param {string} type - Type of environment object
     * @param {THREE.Object3D} object - The object to add
     */
    addToTypeCollection(type, object) {
        // First check for exact type matches
        switch (type) {
            case ENVIRONMENT_OBJECTS.TREE:
                this.trees.push(object);
                break;
            case ENVIRONMENT_OBJECTS.ROCK:
                this.rocks.push(object);
                break;
            case ENVIRONMENT_OBJECTS.BUSH:
                this.bushes.push(object);
                break;
            case ENVIRONMENT_OBJECTS.FLOWER:
                this.flowers.push(object);
                break;
            case ENVIRONMENT_OBJECTS.TALL_GRASS:
                this.tallGrass.push(object);
                break;
            case ENVIRONMENT_OBJECTS.ANCIENT_TREE:
                this.ancientTrees.push(object);
                break;
            case ENVIRONMENT_OBJECTS.SMALL_PLANT:
                this.smallPlants.push(object);
                break;
            case ENVIRONMENT_OBJECTS.FALLEN_LOG:
                this.fallenLogs.push(object);
                break;
            case ENVIRONMENT_OBJECTS.MUSHROOM:
                this.mushrooms.push(object);
                break;
            case ENVIRONMENT_OBJECTS.ROCK_FORMATION:
                this.rockFormations.push(object);
                break;
            case ENVIRONMENT_OBJECTS.SHRINE:
            case ENVIRONMENT_OBJECTS.FOREST_SHRINE:
            case ENVIRONMENT_OBJECTS.DESERT_SHRINE:
                this.shrines.push(object);
                break;
            case ENVIRONMENT_OBJECTS.STUMP:
                this.stumps.push(object);
                break;
            case ENVIRONMENT_OBJECTS.WATERFALL:
                this.waterfalls.push(object);
                break;
            case ENVIRONMENT_OBJECTS.CRYSTAL_FORMATION:
            case ENVIRONMENT_OBJECTS.SMALL_CRYSTAL:
                this.crystalFormations.push(object);
                break;
            case ENVIRONMENT_OBJECTS.MOSS:
                this.mosses.push(object);
                break;
            case ENVIRONMENT_OBJECTS.MAGICAL_FLOWER:
                this.flowers.push(object);
                break;
            case ENVIRONMENT_OBJECTS.STONE_CIRCLE:
                this.shrines.push(object);
                break;
            case ENVIRONMENT_OBJECTS.MOUNTAIN_PASS:
                this.rockFormations.push(object);
                break;
            default:
                // For types without a specific collection, categorize by type
                this.categorizeByType(type, object);
                break;
        }
    }
    
    /**
     * Categorize an object by its type using the environment categories
     * @param {string} type - Type of environment object
     * @param {THREE.Object3D} object - The object to add
     */
    categorizeByType(type, object) {
        // Check if the type belongs to any category
        if (ENVIRONMENT_CATEGORIES.VEGETATION.includes(type)) {
            // For vegetation types, add to appropriate collection based on subtype
            if (type.includes('tree')) {
                this.trees.push(object);
            } else if (type.includes('bush')) {
                this.bushes.push(object);
            } else if (type.includes('flower')) {
                this.flowers.push(object);
            } else if (type.includes('grass')) {
                this.tallGrass.push(object);
            } else {
                this.smallPlants.push(object);
            }
        } else if (ENVIRONMENT_CATEGORIES.ROCKS.includes(type)) {
            if (type.includes('formation')) {
                this.rockFormations.push(object);
            } else {
                this.rocks.push(object);
            }
        } else if (ENVIRONMENT_CATEGORIES.FUNGI.includes(type)) {
            this.mushrooms.push(object);
        } else if (ENVIRONMENT_CATEGORIES.WATER.includes(type)) {
            if (type.includes('waterfall')) {
                this.waterfalls.push(object);
            }
        } else if (ENVIRONMENT_CATEGORIES.STRUCTURES.includes(type)) {
            this.shrines.push(object);
        } else if (ENVIRONMENT_CATEGORIES.MAGICAL.includes(type)) {
            if (type.includes('crystal')) {
                this.crystalFormations.push(object);
            }
        }
    }
    
    /**
     * Create an environment object using the factory
     * @param {string} type - Type of environment object
     * @param {number} x - X coordinate
     * @param {number} z - Z coordinate
     * @param {number} scale - Scale factor
     * @returns {THREE.Object3D} - The created object
     */
    createEnvironmentObject(type, x, z, scale = 1.0) {
        let object = null;
        
        // Check if type is valid
        if (!type) {
            console.warn('Invalid environment object type: undefined or null');
            return null;
        }
        
        // Use the terrain height at this position
        const y = this.MapManager.getTerrainHeight(x, z);
        
        // Create a position object with the correct terrain height
        const position = new THREE.Vector3(x, y, z);
        
        try {
            // Special handling for tree_cluster
            if (type === ENVIRONMENT_OBJECTS.TREE_CLUSTER) {
                // Create a data object for the tree cluster
                const clusterData = {
                    position: { x, y, z },
                    centerPosition: { x, y, z },
                    // For a single tree cluster, we'll just use the position as the only tree
                    positions: [{ x, y, z }],
                    options: {
                        minSize: scale * 0.8,
                        maxSize: scale * 1.2
                    }
                };
                
                // Create the tree cluster using the factory
                object = this.environmentFactory.create(type, position, scale, clusterData);
            }
            // Try to create the object using the factory first
            else if (this.environmentFactory.canCreate(type)) {
                object = this.environmentFactory.create(type, position, scale);
            } else {
                // Fall back to direct creation for traditional types
                switch (type) {
                    case ENVIRONMENT_OBJECTS.TREE:
                        const tree = new Tree();
                        object = tree.createMesh();
                        break;
                    case ENVIRONMENT_OBJECTS.ROCK:
                        const rock = new Rock();
                        object = rock.createMesh();
                        break;
                    case ENVIRONMENT_OBJECTS.BUSH:
                        const bush = new Bush();
                        object = bush.createMesh();
                        break;
                    case ENVIRONMENT_OBJECTS.FLOWER:
                        const flower = new Flower();
                        object = flower.createMesh();
                        break;
                    case ENVIRONMENT_OBJECTS.TALL_GRASS:
                        const tallGrass = new TallGrass();
                        object = tallGrass.createMesh();
                        break;
                    case ENVIRONMENT_OBJECTS.ANCIENT_TREE:
                        const ancientTree = new AncientTree();
                        object = ancientTree.createMesh();
                        break;
                    default:
                        console.warn(`Unknown environment object type: ${type}`);
                        return null;
                }
            }
        } catch (error) {
            console.error(`Error creating environment object of type ${type}:`, error);
            return null;
        }
        
        if (object) {
            // Position the object on the terrain (only for traditional objects)
            // Factory-created objects already have their position set
            if (!this.environmentFactory.canCreate(type)) {
                object.position.set(x, y, z);
            }
            
            // Apply scale (only if not already applied by factory)
            if (!this.environmentFactory.canCreate(type)) {
                object.scale.set(scale, scale, scale);
            }
            
            // Apply LOD if available and appropriate for this object type
            // Skip LOD for very small objects or objects that don't benefit from it
            const skipLodTypes = [
                ENVIRONMENT_OBJECTS.FLOWER, 
                ENVIRONMENT_OBJECTS.TALL_GRASS, 
                ENVIRONMENT_OBJECTS.SMALL_MUSHROOM, 
                ENVIRONMENT_OBJECTS.SMALL_PLANT
            ];
            if (this.MapManager.lodManager && !skipLodTypes.includes(type) && scale > 0.5) {
                // Apply LOD to the object
                object = this.MapManager.lodManager.applyLOD(object, type, position);
            }
            
            // Add to scene (only if not already added by factory)
            if (object.parent === null) {
                this.scene.add(object);
            }
        }
        
        return object;
    }
    
    /**
     * Clear all environment objects
     */
    clear() {
        // Remove all environment objects from the scene
        this.environmentObjects.forEach(info => {
            if (info.object && info.object.parent) {
                this.scene.remove(info.object);
            }
            
            // Dispose of geometries and materials to free memory
            if (info.object) {
                if (info.object.traverse) {
                    info.object.traverse(obj => {
                        if (obj.geometry) {
                            obj.geometry.dispose();
                        }
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
        });
        
        // Reset environment collections
        this.environmentObjects = [];
        this.trees = [];
        this.rocks = [];
        this.bushes = [];
        this.flowers = [];
        this.tallGrass = [];
        this.ancientTrees = [];
        this.smallPlants = [];
        this.fallenLogs = [];
        this.mushrooms = [];
        this.rockFormations = [];
        this.shrines = [];
        this.stumps = [];
        this.waterfalls = [];
        this.crystalFormations = [];
        this.mosses = [];
        
        console.debug("All environment objects cleared");
    }
    
    /**
     * Save environment state
     * @returns {object} - The saved environment state
     */
    save() {
        return {
            objects: this.environmentObjects.map(info => ({
                type: info.type,
                position: {
                    x: info.position.x,
                    y: info.position.y,
                    z: info.position.z
                },
                scale: info.scale,
                id: info.id,
                groupId: info.groupId,
                rotation: info.object ? info.object.rotation.y : 0
            }))
        };
    }
    
    /**
     * Load environment state
     * @param {object} environmentState - The environment state to load
     */
    load(environmentState) {
        if (!environmentState || !environmentState.objects) return;
        
        // Load environment objects from saved state
        this.loadFromMapData(environmentState.objects);
    }
    
    /**
     * Remove environment objects for a specific chunk
     * @param {string} chunkKey - The chunk key
     * @param {boolean} disposeResources - Whether to dispose of geometries and materials
     */
    removeChunkObjects(chunkKey, disposeResources = false) {
        // Remove environment objects from scene
        if (this.environmentObjectsByChunk[chunkKey]) {
            this.environmentObjectsByChunk[chunkKey].forEach(item => {
                if (item.object) {
                    // Remove from scene if it's in the scene
                    if (item.object.parent) {
                        this.scene.remove(item.object);
                    }
                    
                    // Remove from global tracking array
                    const index = this.environmentObjects.findIndex(obj => obj.object === item.object);
                    if (index !== -1) {
                        this.environmentObjects.splice(index, 1);
                    }
                    
                    // Remove from type-specific collections
                    this.removeFromTypeCollections(item.object);
                    
                    // Dispose of geometries and materials if requested
                    if (disposeResources) {
                        if (item.object.geometry) {
                            item.object.geometry.dispose();
                        }
                        
                        if (item.object.material) {
                            // Handle both single materials and material arrays
                            if (Array.isArray(item.object.material)) {
                                item.object.material.forEach(material => {
                                    if (material.map) material.map.dispose();
                                    material.dispose();
                                });
                            } else {
                                if (item.object.material.map) item.object.material.map.dispose();
                                item.object.material.dispose();
                            }
                        }
                        
                        // Handle child objects if any
                        if (item.object.children && item.object.children.length > 0) {
                            item.object.children.forEach(child => {
                                if (child.geometry) child.geometry.dispose();
                                if (child.material) {
                                    if (Array.isArray(child.material)) {
                                        child.material.forEach(material => {
                                            if (material.map) material.map.dispose();
                                            material.dispose();
                                        });
                                    } else {
                                        if (child.material.map) child.material.map.dispose();
                                        child.material.dispose();
                                    }
                                }
                            });
                        }
                    }
                }
            });
            
            // If disposing resources, remove the chunk data completely
            if (disposeResources) {
                delete this.environmentObjectsByChunk[chunkKey];
                console.debug(`Disposed environment objects for chunk ${chunkKey}`);
            }
        }
        
        // Remove the chunk from the visible chunks
        delete this.visibleChunks[chunkKey];
    }
    
    /**
     * Remove an object from all type-specific collections
     * @param {THREE.Object3D} object - The object to remove
     */
    removeFromTypeCollections(object) {
        // Helper function to remove from array
        const removeFromArray = (array) => {
            const index = array.indexOf(object);
            if (index !== -1) {
                array.splice(index, 1);
            }
        };
        
        // Remove from all type-specific collections
        removeFromArray(this.trees);
        removeFromArray(this.rocks);
        removeFromArray(this.bushes);
        removeFromArray(this.flowers);
        removeFromArray(this.tallGrass);
        removeFromArray(this.ancientTrees);
        removeFromArray(this.smallPlants);
        removeFromArray(this.fallenLogs);
        removeFromArray(this.mushrooms);
        removeFromArray(this.rockFormations);
        removeFromArray(this.shrines);
        removeFromArray(this.stumps);
        removeFromArray(this.waterfalls);
        removeFromArray(this.crystalFormations);
        removeFromArray(this.mosses);
    }
    
    /**
     * Load environment objects for a chunk from saved data
     * @param {number} chunkX - X chunk coordinate
     * @param {number} chunkZ - Z chunk coordinate
     * @param {Array} environmentObjects - Array of environment object data
     */
    loadEnvironmentObjectsForChunk(chunkX, chunkZ, environmentObjects) {
        const chunkKey = `${chunkX},${chunkZ}`;
        
        // Skip if already loaded
        if (this.environmentObjects[chunkKey]) {
            return;
        }
        
        // Create objects from saved data
        const objects = [];
        
        for (const objData of environmentObjects) {
            // Create the object based on saved type and position
            let object;
            const x = objData.position.x;
            const z = objData.position.z;
            const size = objData.size || 1;
            
            // Create the object using the factory
            object = this.createEnvironmentObject(objData.type, x, z, size, objData.data);
            
            if (object) {
                // Store object with its type and position for persistence
                objects.push({
                    type: objData.type,
                    object: object,
                    position: new THREE.Vector3(x, this.MapManager.getTerrainHeight(x, z), z)
                });
            }
        }
        
        // Store environment objects for this chunk
        this.environmentObjects[chunkKey] = objects;
    }
    
    /**
     * Get the zone type at a specific position
     * @param {number} x - X coordinate
     * @param {number} z - Z coordinate
     * @returns {string} - The zone type (Forest, Desert, etc.)
     */
    getZoneTypeAt(x, z) {
        // Use the map manager to get the zone at this position
        if (this.MapManager && this.MapManager.getZoneAt) {
            const position = new THREE.Vector3(x, 0, z);
            const zone = this.MapManager.getZoneAt(position);
            if (zone) {
                return zone.name;
            }
        }
        
        // Default to Forest if no zone found
        return 'Forest';
    }
    
    /**
     * Create an environment object using the factory
     * @param {string} type - The type of environment object to create
     * @param {number} x - X coordinate
     * @param {number} z - Z coordinate
     * @param {number} size - Size of the object (optional)
     * @param {boolean} offscreenCreation - Whether this is being created offscreen (don't add to scene yet)
     * @param {Object} data - Additional data for complex objects (optional)
     * @returns {THREE.Object3D} - The created environment object
     */
    createEnvironmentObject(type, x, z, size = 1, offscreenCreation = false, data = null) {
        // Create position object with terrain height
        const position = new THREE.Vector3(
            x, 
            this.MapManager.getTerrainHeight(x, z), 
            z
        );
        
        // Check if the factory supports this type
        if (!this.environmentFactory.hasType(type)) {
            console.warn(`Environment type ${type} not registered in factory`);
            return null;
        }
        
        // Create the object using the factory
        const object = this.environmentFactory.create(type, position, size, data);
        
        if (object) {
            // If this is an offscreen creation, don't add to tracking arrays or scene
            if (offscreenCreation) {
                // Just set the position and return the object
                object.position.copy(position);
                return object;
            }
            
            // Add to the appropriate tracking array if it exists
            const trackingArrayName = this.getTrackingArrayName(type);
            if (this[trackingArrayName]) {
                this[trackingArrayName].push(object);
            }
            
            return object;
        }
        
        return null;
    }
    
    /**
     * Get the name of the tracking array for a given environment object type
     * @param {string} type - The type of environment object
     * @returns {string} - The name of the tracking array
     */
    getTrackingArrayName(type) {
        // Convert type to camelCase for array name (e.g., 'crystal_formation' -> 'crystalFormations')
        const parts = type.split('_');
        const camelCase = parts.map((part, index) => {
            if (index === 0) return part;
            return part.charAt(0).toUpperCase() + part.slice(1);
        }).join('');
        
        // Add 's' for plural
        return camelCase + 's';
    }

    /**
     * Update environment objects based on player position
     * @param {THREE.Vector3} playerPosition - The player's current position
     * @param {number} drawDistanceMultiplier - Multiplier for draw distance (0.0 to 1.0)
     */
    updateForPlayer(playerPosition, drawDistanceMultiplier = 1.0) {
        // Skip if no player position
        if (!playerPosition) return;
        
        // Calculate which chunk the player is in
        const chunkSize = this.MapManager.terrainManager.terrainChunkSize || 64;
        const playerChunkX = Math.floor(playerPosition.x / chunkSize);
        const playerChunkZ = Math.floor(playerPosition.z / chunkSize);
        
        // Calculate effective view distance based on multiplier
        // Increased base view distance from 3 to 5 for better preloading
        const baseViewDistance = 5; // Increased base view distance in chunks
        const effectiveViewDistance = Math.max(2, Math.floor(baseViewDistance * drawDistanceMultiplier));
        
        // Get player movement direction if available
        let directionX = 0;
        let directionZ = 0;
        
        if (this.MapManager.lastPlayerPosition) {
            // Calculate movement direction
            const moveX = playerPosition.x - this.MapManager.lastPlayerPosition.x;
            const moveZ = playerPosition.z - this.MapManager.lastPlayerPosition.z;
            
            // Normalize direction
            const length = Math.sqrt(moveX * moveX + moveZ * moveZ);
            if (length > 0.001) {
                directionX = moveX / length;
                directionZ = moveZ / length;
            }
        }
        
        // Update visible chunks
        const currentChunks = new Set();
        
        // Generate chunks around player position with emphasis on movement direction
        for (let x = playerChunkX - effectiveViewDistance; x <= playerChunkX + effectiveViewDistance; x++) {
            for (let z = playerChunkZ - effectiveViewDistance; z <= playerChunkZ + effectiveViewDistance; z++) {
                const chunkKey = `${x},${z}`;
                currentChunks.add(chunkKey);
                
                // Mark chunk as visible
                if (!this.visibleChunks[chunkKey]) {
                    this.visibleChunks[chunkKey] = true;
                }
            }
        }
        
        // Add extra chunks in the direction of movement (look ahead)
        if (Math.abs(directionX) > 0.001 || Math.abs(directionZ) > 0.001) {
            // Look ahead distance (in chunks)
            const lookAheadDistance = 3;
            
            // Calculate target chunk in movement direction
            const targetChunkX = Math.floor(playerChunkX + directionX * lookAheadDistance);
            const targetChunkZ = Math.floor(playerChunkZ + directionZ * lookAheadDistance);
            
            // Add chunks in a smaller radius around the target position
            const targetRadius = 2;
            for (let x = targetChunkX - targetRadius; x <= targetChunkX + targetRadius; x++) {
                for (let z = targetChunkZ - targetRadius; z <= targetChunkZ + targetRadius; z++) {
                    const chunkKey = `${x},${z}`;
                    currentChunks.add(chunkKey);
                    
                    // Mark chunk as visible
                    if (!this.visibleChunks[chunkKey]) {
                        this.visibleChunks[chunkKey] = true;
                    }
                }
            }
        }
        
        // Clean up distant chunks that are no longer visible
        const chunksToRemove = [];
        for (const chunkKey in this.visibleChunks) {
            if (!currentChunks.has(chunkKey)) {
                chunksToRemove.push(chunkKey);
            }
        }
        
        // Remove distant chunks
        chunksToRemove.forEach(chunkKey => {
            this.removeChunkObjects(chunkKey, true); // Dispose resources for distant chunks
        });
        
        // Update visibility of environment objects based on distance
        this.updateObjectVisibility(playerPosition, drawDistanceMultiplier);
    }
    
    /**
     * Update visibility of environment objects based on player distance
     * @param {THREE.Vector3} playerPosition - The player's current position
     * @param {number} drawDistanceMultiplier - Multiplier for draw distance
     */
    updateObjectVisibility(playerPosition, drawDistanceMultiplier = 1.0) {
        const maxDistance = 100 * drawDistanceMultiplier; // Maximum visible distance
        const maxDistanceSquared = maxDistance * maxDistance; // Use squared distance for performance
        
        // Update visibility for all environment objects
        this.environmentObjects.forEach(envObj => {
            if (envObj.object && envObj.position) {
                const distanceSquared = playerPosition.distanceToSquared(envObj.position);
                const shouldBeVisible = distanceSquared <= maxDistanceSquared;
                
                // Update visibility if it has changed
                if (envObj.object.visible !== shouldBeVisible) {
                    envObj.object.visible = shouldBeVisible;
                }
            }
        });
    }

    /**
     * Set the density of environment objects
     * @param {number} density - Density factor (0.0 to 1.0)
     */
    setDensity(density) {
        // Clamp density between 0 and 1
        this.environmentDensity = Math.max(0, Math.min(1, density));
        console.debug(`Environment density set to ${this.environmentDensity}`);
    }
    
    /**
     * Generate environment objects for a chunk
     * @param {number} chunkX - Chunk X coordinate
     * @param {number} chunkZ - Chunk Z coordinate
     * @param {string|boolean} zoneType - Type of zone (Forest, Desert, etc.) or boolean flag for data-only generation
     * @param {object} zoneDensity - Density configuration for the zone
     */
    generateEnvironmentForChunk(chunkX, chunkZ, zoneType, zoneDensity) {
        // Handle the case when zoneType is a boolean (data-only flag)
        const dataOnly = typeof zoneType === 'boolean' ? zoneType : false;
        
        // If zoneType is not provided or is a boolean, get it from the map manager
        if (!zoneType || typeof zoneType === 'boolean') {
            // Calculate world coordinates for this chunk
            const chunkSize = this.MapManager.terrainManager.terrainChunkSize;
            const worldX = chunkX * chunkSize;
            const worldZ = chunkZ * chunkSize;
            
            // Get zone type from the map manager
            if (this.MapManager && this.MapManager.generationManager) {
                zoneType = this.MapManager.generationManager.getZoneTypeAt(worldX, worldZ);
            } else {
                // Default to Forest if we can't determine zone type
                zoneType = 'Forest';
            }
            
            // Get zone density from the map manager
            if (this.MapManager && this.MapManager.zoneDensities) {
                zoneDensity = this.MapManager.zoneDensities[zoneType];
            }
        }
        
        // Skip if no zone density is provided
        if (!zoneDensity) {
            console.warn(`No zone density provided for zone type: ${zoneType}`);
            return;
        }
        
        // Calculate world coordinates for this chunk
        const chunkSize = this.MapManager.terrainManager.terrainChunkSize;
        const worldX = chunkX * chunkSize;
        const worldZ = chunkZ * chunkSize;
        
        // Create a unique key for this chunk
        const chunkKey = `${chunkX},${chunkZ}`;
        
        // Skip if we've already generated objects for this chunk
        if (this.environmentObjectsByChunk[chunkKey]) {
            return;
        }
        
        // If this is a data-only call, just mark the chunk as processed and return
        if (dataOnly) {
            this.environmentObjectsByChunk[chunkKey] = [];
            return;
        }
        
        console.debug(`Generating environment for chunk ${chunkKey} (${zoneType})`);
        
        // Initialize array for this chunk
        this.environmentObjectsByChunk[chunkKey] = [];
        
        // Get environment types for this zone
        const environmentTypes = zoneDensity.environmentTypes || [];
        if (environmentTypes.length === 0) {
            console.warn(`No environment types defined for zone: ${zoneType}`);
            return;
        }
        
        // Calculate number of objects to create based on density
        // Apply the environment density setting as a multiplier
        const baseCount = 10; // Base number of objects per chunk
        const densityFactor = zoneDensity.environment || 1.0;
        const count = Math.floor(baseCount * densityFactor * this.environmentDensity * this.MapManager.mapManagerScale);
        
        // Generate random environment objects
        for (let i = 0; i < count; i++) {
            // Choose a random position within the chunk
            const offsetX = Math.random() * chunkSize;
            const offsetZ = Math.random() * chunkSize;
            const x = worldX + offsetX;
            const z = worldZ + offsetZ;
            
            // Choose a random environment type for this zone
            const typeIndex = Math.floor(Math.random() * environmentTypes.length);
            const type = environmentTypes[typeIndex];
            
            // Random scale variation
            const scale = 0.7 + Math.random() * 0.6;
            
            // Create the environment object
            const object = this.createEnvironmentObject(type, x, z, scale);
            
            if (object) {
                // Create object info
                const objectInfo = {
                    type: type,
                    object: object,
                    position: new THREE.Vector3(x, this.MapManager.getTerrainHeight(x, z), z),
                    scale: scale,
                    chunkKey: chunkKey
                };
                
                // Add to environment objects for this chunk
                this.environmentObjectsByChunk[chunkKey].push(objectInfo);
                
                // Add to global environment objects array for tracking
                this.environmentObjects.push(objectInfo);
                
                // Add to type-specific collections for minimap
                this.addToTypeCollection(type, object);
            }
        }
        
        console.debug(`Created ${this.environmentObjectsByChunk[chunkKey].length} environment objects for chunk ${chunkKey}`);
    }
    
    /**
     * Clear all environment objects
     */
    clear() {
        // Remove all environment objects from the scene
        this.environmentObjects.forEach(item => {
            if (item.object && item.object.parent) {
                this.scene.remove(item.object);
            }
        });
        
        // Reset collections
        this.environmentObjects = [];
        this.environmentObjectsByChunk = {};
        this.visibleChunks = {};
        
        // Reset tracking arrays
        this.trees = [];
        this.rocks = [];
        this.bushes = [];
        this.flowers = [];
        this.tallGrass = [];
        this.ancientTrees = [];
        this.smallPlants = [];
        this.fallenLogs = [];
        this.mushrooms = [];
        this.rockFormations = [];
        this.shrines = [];
        this.stumps = [];
        this.waterfalls = [];
        this.crystalFormations = [];
        this.mosses = [];
        
        console.debug("All environment objects cleared");
    }
}