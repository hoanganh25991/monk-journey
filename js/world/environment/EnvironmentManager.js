import * as THREE from 'three';
import { Tree } from './Tree.js';
import { Rock } from './Rock.js';
import { Bush } from './Bush.js';
import { Flower } from './Flower.js';
import { TallGrass } from './TallGrass.js';
import { AncientTree } from './AncientTree.js';
import { TreeCluster } from './TreeCluster.js';
import { EnvironmentFactory } from './EnvironmentFactory.js';

/**
 * Manages environment objects like trees, rocks, bushes, etc.
 * Simplified to focus only on loading environment objects from map data
 */
export class EnvironmentManager {
    constructor(scene, worldManager, game = null) {
        this.scene = scene;
        this.worldManager = worldManager;
        this.game = game;
        
        // Initialize the environment factory
        this.environmentFactory = new EnvironmentFactory(scene, worldManager);
        
        // Environment object collections
        this.environmentObjects = [];
        
        // Environment generation settings
        this.environmentDensity = 1.0; // Default density factor (0.0 to 1.0)
        this.visibleChunks = {}; // Track which chunks are currently visible
        
        // Get environment object types from factory and add traditional types
        const factoryTypes = this.environmentFactory.getRegisteredTypes ? 
            this.environmentFactory.getRegisteredTypes() : [];
        const traditionalTypes = [
            'tree', 'rock', 'bush', 'flower', 'tall_grass', 'ancient_tree', 'small_plant',
            'fallen_log', 'mushroom', 'rock_formation', 'shrine', 'stump', 'waterfall'
        ];
        
        // Combine both sets of types, removing duplicates
        this.environmentObjectTypes = [...new Set([...traditionalTypes, ...factoryTypes])];
        
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
        switch (type) {
            case 'tree':
                this.trees.push(object);
                break;
            case 'rock':
                this.rocks.push(object);
                break;
            case 'bush':
                this.bushes.push(object);
                break;
            case 'flower':
                this.flowers.push(object);
                break;
            case 'tall_grass':
                this.tallGrass.push(object);
                break;
            case 'ancient_tree':
                this.ancientTrees.push(object);
                break;
            case 'small_plant':
                this.smallPlants.push(object);
                break;
            case 'fallen_log':
                this.fallenLogs.push(object);
                break;
            case 'mushroom':
                this.mushrooms.push(object);
                break;
            case 'rock_formation':
                this.rockFormations.push(object);
                break;
            case 'shrine':
                this.shrines.push(object);
                break;
            case 'stump':
                this.stumps.push(object);
                break;
            case 'waterfall':
                this.waterfalls.push(object);
                break;
            case 'crystal_formation':
                this.crystalFormations.push(object);
                break;
            case 'moss':
                this.mosses.push(object);
                break;
            case 'small_crystal':
                this.crystalFormations.push(object);
                break;
            case 'magical_flower':
                this.flowers.push(object);
                break;
            case 'stone_circle':
                this.shrines.push(object);
                break;
            case 'mountain_pass':
                this.rockFormations.push(object);
                break;
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
        const y = this.worldManager.getTerrainHeight(x, z);
        
        // Create a position object with the correct terrain height
        const position = new THREE.Vector3(x, y, z);
        
        try {
            // Special handling for tree_cluster
            if (type === 'tree_cluster') {
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
                    case 'tree':
                        const tree = new Tree();
                        object = tree.createMesh();
                        break;
                    case 'rock':
                        const rock = new Rock();
                        object = rock.createMesh();
                        break;
                    case 'bush':
                        const bush = new Bush();
                        object = bush.createMesh();
                        break;
                    case 'flower':
                        const flower = new Flower();
                        object = flower.createMesh();
                        break;
                    case 'tall_grass':
                        const tallGrass = new TallGrass();
                        object = tallGrass.createMesh();
                        break;
                    case 'ancient_tree':
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
        if (this.environmentObjects[chunkKey]) {
            this.environmentObjects[chunkKey].forEach(item => {
                if (item.object) {
                    // Remove from scene if it's in the scene
                    if (item.object.parent) {
                        this.scene.remove(item.object);
                    }
                    
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
                delete this.environmentObjects[chunkKey];
                console.debug(`Disposed environment objects for chunk ${chunkKey}`);
            }
        }
        
        // Remove the chunk from the visible chunks
        delete this.visibleChunks[chunkKey];
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
                    position: new THREE.Vector3(x, this.worldManager.getTerrainHeight(x, z), z)
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
        // Use the world manager to get the zone at this position
        if (this.worldManager && this.worldManager.getZoneAt) {
            const position = new THREE.Vector3(x, 0, z);
            const zone = this.worldManager.getZoneAt(position);
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
     * @param {Object} data - Additional data for complex objects (optional)
     * @returns {THREE.Object3D} - The created environment object
     */
    createEnvironmentObject(type, x, z, size = 1, data = null) {
        // Create position object with terrain height
        const position = new THREE.Vector3(
            x, 
            this.worldManager.getTerrainHeight(x, z), 
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
        // Calculate which chunk the player is in
        const chunkSize = 64; // Default chunk size - can be made configurable
        const playerChunkX = Math.floor(playerPosition.x / chunkSize);
        const playerChunkZ = Math.floor(playerPosition.z / chunkSize);
        
        // Calculate effective view distance based on multiplier
        const baseViewDistance = 3; // Base view distance in chunks
        const effectiveViewDistance = Math.max(1, Math.floor(baseViewDistance * drawDistanceMultiplier));
        
        // Update visible chunks
        const currentChunks = new Set();
        
        // Generate chunks around player position
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
     * Clear all environment objects
     */
    clear() {
        // Remove all environment objects from the scene
        for (const chunkKey in this.environmentObjects) {
            this.environmentObjects[chunkKey].forEach(item => {
                if (item.object && item.object.parent) {
                    this.scene.remove(item.object);
                }
            });
        }
        
        // Reset collections
        this.environmentObjects = {};
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
    }
}