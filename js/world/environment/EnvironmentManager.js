import * as THREE from 'three';
import { Tree } from './Tree.js';
import { Rock } from './Rock.js';
import { Bush } from './Bush.js';
import { Flower } from './Flower.js';
import { RandomGenerator } from '../utils/RandomGenerator.js';

/**
 * Manages environment objects like trees, rocks, bushes, etc.
 */
export class EnvironmentManager {
    constructor(scene, worldManager) {
        this.scene = scene;
        this.worldManager = worldManager;
        this.game = null;
        
        // Environment object collections
        this.environmentObjects = {}; // Store environment objects by chunk key
        this.visibleChunks = {}; // Store currently visible chunks
        
        // Environment object types and densities
        this.environmentObjectTypes = ['tree', 'rock', 'bush', 'flower'];
        this.environmentObjectDensity = {
            'tree': 0.0005,
            'rock': 0.0008,
            'bush': 0.001,
            'flower': 0.002
        };
        
        // Chunk properties
        this.chunkSize = 50; // Size of each environment chunk
        
        // For save/load functionality
        this.savedEnvironmentObjects = null;
    }
    
    /**
     * Set the game reference
     * @param {Game} game - The game instance
     */
    setGame(game) {
        this.game = game;
    }
    
    /**
     * Update environment objects based on player position
     * @param {THREE.Vector3} playerPosition - The player's current position
     * @param {number} drawDistanceMultiplier - Multiplier for draw distance
     */
    updateForPlayer(playerPosition, drawDistanceMultiplier = 1.0) {
        // Get the chunk coordinates for the player's position
        const chunkX = Math.floor(playerPosition.x / this.chunkSize);
        const chunkZ = Math.floor(playerPosition.z / this.chunkSize);
        
        // Update visible chunks
        this.updateVisibleChunks(chunkX, chunkZ, drawDistanceMultiplier);
    }
    
    /**
     * Update visible environment chunks based on player position
     * @param {number} centerX - Center X chunk coordinate
     * @param {number} centerZ - Center Z chunk coordinate
     * @param {number} drawDistanceMultiplier - Multiplier for draw distance
     */
    updateVisibleChunks(centerX, centerZ, drawDistanceMultiplier = 1.0) {
        // Track which chunks should be visible
        const newVisibleChunks = {};
        
        // Adjust view distance based on performance
        const viewDistance = Math.max(1, Math.floor(3 * drawDistanceMultiplier));
        
        // Generate or update chunks in render distance
        for (let x = centerX - viewDistance; x <= centerX + viewDistance; x++) {
            for (let z = centerZ - viewDistance; z <= centerZ + viewDistance; z++) {
                const chunkKey = `${x},${z}`;
                newVisibleChunks[chunkKey] = true;
                
                // If this chunk doesn't exist yet, create it
                if (!this.visibleChunks[chunkKey]) {
                    this.generateEnvironmentObjects(x, z);
                }
            }
        }
        
        // Remove objects from chunks that are no longer visible
        for (const chunkKey in this.visibleChunks) {
            if (!newVisibleChunks[chunkKey]) {
                this.removeChunkObjects(chunkKey);
            }
        }
        
        // Update the visible chunks
        this.visibleChunks = newVisibleChunks;
    }
    
    /**
     * Generate environment objects for a specific chunk
     * @param {number} chunkX - X chunk coordinate
     * @param {number} chunkZ - Z chunk coordinate
     */
    generateEnvironmentObjects(chunkX, chunkZ) {
        const chunkKey = `${chunkX},${chunkZ}`;
        const environmentObjects = [];
        
        // Check if we have saved environment objects for this chunk
        if (this.savedEnvironmentObjects && this.savedEnvironmentObjects[chunkKey]) {
            // Restore saved environment objects
            const savedObjects = this.savedEnvironmentObjects[chunkKey];
            
            for (const savedObj of savedObjects) {
                // Create the object based on saved type and position
                let object;
                const x = savedObj.position.x;
                const z = savedObj.position.z;
                
                switch (savedObj.type) {
                    case 'tree':
                        object = this.createTree(x, z);
                        break;
                    case 'rock':
                        object = this.createRock(x, z);
                        break;
                    case 'bush':
                        object = this.createBush(x, z);
                        break;
                    case 'flower':
                        object = this.createFlower(x, z);
                        break;
                }
                
                if (object) {
                    // Store object with its type and position for persistence
                    environmentObjects.push({
                        type: savedObj.type,
                        object: object,
                        position: new THREE.Vector3(x, this.worldManager.getTerrainHeight(x, z), z)
                    });
                }
            }
        } else {
            // Generate new environment objects
            // Calculate world coordinates for this chunk
            const worldX = chunkX * this.chunkSize;
            const worldZ = chunkZ * this.chunkSize;
            
            // Seed the random number generator based on chunk coordinates for consistency
            const random = RandomGenerator.seededRandom(`${chunkX},${chunkZ}`);
            
            // Generate environment objects for each type
            for (const objectType of this.environmentObjectTypes) {
                // Determine number of objects to generate based on density
                const density = this.environmentObjectDensity[objectType];
                const numObjects = Math.floor(this.chunkSize * this.chunkSize * density);
                
                for (let i = 0; i < numObjects; i++) {
                    // Random position within the chunk
                    const x = worldX + random() * this.chunkSize;
                    const z = worldZ + random() * this.chunkSize;
                    
                    // Create the object based on type
                    let object;
                    switch (objectType) {
                        case 'tree':
                            object = this.createTree(x, z);
                            break;
                        case 'rock':
                            object = this.createRock(x, z);
                            break;
                        case 'bush':
                            object = this.createBush(x, z);
                            break;
                        case 'flower':
                            object = this.createFlower(x, z);
                            break;
                    }
                    
                    if (object) {
                        // Store object with its type and position for persistence
                        environmentObjects.push({
                            type: objectType,
                            object: object,
                            position: new THREE.Vector3(x, this.worldManager.getTerrainHeight(x, z), z)
                        });
                    }
                }
            }
        }
        
        // Store environment objects for this chunk
        this.environmentObjects[chunkKey] = environmentObjects;
    }
    
    /**
     * Remove environment objects for a specific chunk
     * @param {string} chunkKey - The chunk key
     */
    removeChunkObjects(chunkKey) {
        // Remove environment objects from scene but keep their data
        if (this.environmentObjects[chunkKey]) {
            this.environmentObjects[chunkKey].forEach(item => {
                if (item.object && item.object.parent) {
                    this.scene.remove(item.object);
                }
            });
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
            
            switch (objData.type) {
                case 'tree':
                    object = this.createTree(x, z);
                    break;
                case 'rock':
                    object = this.createRock(x, z);
                    break;
                case 'bush':
                    object = this.createBush(x, z);
                    break;
                case 'flower':
                    object = this.createFlower(x, z);
                    break;
            }
            
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
     * Create a tree at the specified position
     * @param {number} x - X coordinate
     * @param {number} z - Z coordinate
     * @returns {THREE.Group} - The tree group
     */
    createTree(x, z) {
        const tree = new Tree();
        const treeGroup = tree.createMesh();
        
        // Position tree on terrain
        treeGroup.position.set(x, this.worldManager.getTerrainHeight(x, z), z);
        
        // Add to scene
        this.scene.add(treeGroup);
        
        return treeGroup;
    }
    
    /**
     * Create a rock at the specified position
     * @param {number} x - X coordinate
     * @param {number} z - Z coordinate
     * @returns {THREE.Group} - The rock group
     */
    createRock(x, z) {
        const rock = new Rock();
        const rockGroup = rock.createMesh();
        
        // Position rock on terrain
        rockGroup.position.set(x, this.worldManager.getTerrainHeight(x, z), z);
        
        // Add to scene
        this.scene.add(rockGroup);
        
        return rockGroup;
    }
    
    /**
     * Create a bush at the specified position
     * @param {number} x - X coordinate
     * @param {number} z - Z coordinate
     * @returns {THREE.Group} - The bush group
     */
    createBush(x, z) {
        const bush = new Bush();
        const bushGroup = bush.createMesh();
        
        // Position bush on terrain
        bushGroup.position.set(x, this.worldManager.getTerrainHeight(x, z), z);
        
        // Add to scene
        this.scene.add(bushGroup);
        
        return bushGroup;
    }
    
    /**
     * Create a flower at the specified position
     * @param {number} x - X coordinate
     * @param {number} z - Z coordinate
     * @returns {THREE.Group} - The flower group
     */
    createFlower(x, z) {
        const flower = new Flower();
        const flowerGroup = flower.createMesh();
        
        // Position flower on terrain
        flowerGroup.position.set(x, this.worldManager.getTerrainHeight(x, z), z);
        
        // Add to scene
        this.scene.add(flowerGroup);
        
        return flowerGroup;
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
    }
    
    /**
     * Save environment state
     * @returns {object} - The saved environment state
     */
    save() {
        const environmentState = {
            objects: {}
        };
        
        // Save environment objects
        for (const chunkKey in this.environmentObjects) {
            environmentState.objects[chunkKey] = this.environmentObjects[chunkKey].map(item => ({
                type: item.type,
                position: {
                    x: item.position.x,
                    y: item.position.y,
                    z: item.position.z
                }
            }));
        }
        
        return environmentState;
    }
    
    /**
     * Load environment state
     * @param {object} environmentState - The environment state to load
     */
    load(environmentState) {
        if (!environmentState || !environmentState.objects) return;
        
        this.savedEnvironmentObjects = environmentState.objects;
    }
}