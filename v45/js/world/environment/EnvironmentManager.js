import * as THREE from 'three';
import { Tree } from './Tree.js';
import { Rock } from './Rock.js';
import { Bush } from './Bush.js';
import { Flower } from './Flower.js';
import { RandomGenerator } from '../utils/RandomGenerator.js';

/**
 * Manages environment objects like trees, rocks, bushes, etc.
 * Fully randomized with natural grouping of similar objects
 */
export class EnvironmentManager {
    constructor(scene, worldManager, game = null) {
        this.scene = scene;
        this.worldManager = worldManager;
        this.game = game;
        
        // Environment object collections
        this.environmentObjects = []; // Simple array to track all environment objects
        this.visibleChunks = {}; // Empty object for compatibility with old system
        
        // Environment object types (no longer using config)
        this.environmentObjectTypes = ['tree', 'rock', 'bush', 'flower'];
        
        // For minimap functionality
        this.trees = [];
        this.rocks = [];
        this.bushes = [];
        this.flowers = [];
        
        // Last player position for distance tracking
        this.lastPlayerPosition = new THREE.Vector3(0, 0, 0);
        this.minDistanceForNewObject = 30; // Reduced from 50 to generate more objects
        this.lastObjectTime = 0;
        this.objectCooldown = 1000; // Reduced from 2000ms to 1000ms for more frequent generation
        
        // Natural grouping settings
        this.groupingProbabilities = {
            'tree': 0.9,   // Increased from 80% to 90% chance that trees will be in groups
            'rock': 0.6,   // 60% chance that rocks will be in groups
            'bush': 0.7,   // 70% chance that bushes will be in groups
            'flower': 0.9   // 90% chance that flowers will be in groups
        };
        
        this.groupSizes = {
            'tree': { min: 10, max: 30 },   // Increased from 6-24 to 10-30 for more visible tree groups
            'rock': { min: 2, max: 6 },     // Rocks come in groups of 2-6
            'bush': { min: 3, max: 10 },    // Increased from 2-8 to 3-10
            'flower': { min: 5, max: 15 }   // Flowers come in groups of 5-15
        };
        
        // Group spread determines how tightly packed the groups are
        this.groupSpread = {
            'tree': 12,     // Increased from 8 to 12 to spread trees more
            'rock': 5,      // Rocks spread up to 5 units from center
            'bush': 6,      // Bushes spread up to 6 units from center
            'flower': 4     // Flowers spread up to 4 units from center
        };
        
        // Create some initial environment objects
        this.createInitialEnvironment();
    }
    
    /**
     * Create initial environment objects around the starting area
     */
    createInitialEnvironment() {
        // Create a larger forest near the starting position (3x more trees)
        for (let i = 0; i < 30; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = 10 + Math.random() * 30;
            const x = Math.cos(angle) * distance;
            const z = Math.sin(angle) * distance;
            
            const tree = this.createTree(x, z);
            if (tree) {
                this.environmentObjects.push({
                    type: 'tree',
                    object: tree,
                    position: new THREE.Vector3(x, 0, z)
                });
                this.trees.push(tree);
            }
        }
        
        // Add some rocks
        for (let i = 0; i < 8; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = 15 + Math.random() * 20;
            const x = Math.cos(angle) * distance;
            const z = Math.sin(angle) * distance;
            
            const rock = this.createRock(x, z);
            if (rock) {
                this.environmentObjects.push({
                    type: 'rock',
                    object: rock,
                    position: new THREE.Vector3(x, 0, z)
                });
                this.rocks.push(rock);
            }
        }
        
        console.debug("Initial environment objects created");
    }
    
    /**
     * Update environment objects based on player position
     * @param {THREE.Vector3} playerPosition - The player's current position
     * @param {number} drawDistanceMultiplier - Multiplier for draw distance (not used in simplified version)
     */
    updateForPlayer(playerPosition, drawDistanceMultiplier = 1.0) {
        // Check if player has moved far enough to generate a new random object
        this.checkForRandomObject(playerPosition);
    }
    
    /**
     * Check if player has moved far enough to generate a new random environment object
     * @param {THREE.Vector3} playerPosition - Current player position
     */
    checkForRandomObject(playerPosition) {
        // Calculate distance moved since last object
        const distanceMoved = playerPosition.distanceTo(this.lastPlayerPosition);
        const currentTime = Date.now();
        const timeSinceLastObject = currentTime - this.lastObjectTime;
        
        // Only generate a new object if player has moved far enough and enough time has passed
        if (distanceMoved >= this.minDistanceForNewObject && timeSinceLastObject >= this.objectCooldown) {
            // Update last position and time
            this.lastPlayerPosition.copy(playerPosition);
            this.lastObjectTime = currentTime;
            
            // 40% chance to generate an object when conditions are met
            this.generateRandomObject(playerPosition);
            return true;
        }
        
        return false;
    }
    
    /**
     * Generate a random environment object or group near the player
     * @param {THREE.Vector3} playerPosition - Current player position
     */
    generateRandomObject(playerPosition) {
        // Choose a random object type with higher probability for trees
        // 60% chance for trees, 40% chance for other object types
        const randomValue = Math.random();
        let randomType;
        
        if (randomValue < 0.6) {
            // 60% chance to generate a tree
            randomType = 'tree';
        } else {
            // 40% chance to generate other object types
            const otherTypes = this.environmentObjectTypes.filter(type => type !== 'tree');
            randomType = otherTypes[Math.floor(Math.random() * otherTypes.length)];
        }
        
        // Generate a position that's visible but not too close to the player
        // Random angle and distance between 30-100 units from player
        const angle = Math.random() * Math.PI * 2;
        const distance = 30 + Math.random() * 70;
        
        const centerX = playerPosition.x + Math.cos(angle) * distance;
        const centerZ = playerPosition.z + Math.sin(angle) * distance;
        
        // Determine if we should create a group or a single object
        const createGroup = Math.random() < this.groupingProbabilities[randomType];
        
        if (createGroup) {
            // Create a group of objects
            const groupSize = Math.floor(
                this.groupSizes[randomType].min + 
                Math.random() * (this.groupSizes[randomType].max - this.groupSizes[randomType].min)
            );
            
            const spread = this.groupSpread[randomType];
            const groupObjects = [];
            
            console.debug(`Generating a group of ${groupSize} ${randomType}s at (${centerX.toFixed(1)}, ${centerZ.toFixed(1)})`);
            
            // Create objects in a natural-looking group pattern
            for (let i = 0; i < groupSize; i++) {
                // For natural grouping, use a combination of random and patterned placement
                let objectX, objectZ;
                
                if (i === 0) {
                    // First object at center
                    objectX = centerX;
                    objectZ = centerZ;
                } else {
                    // Subsequent objects in a natural pattern
                    // Use polar coordinates for more natural grouping
                    const groupAngle = Math.random() * Math.PI * 2;
                    
                    // Distance from center increases slightly with each object
                    // but with some randomness for natural look
                    const groupDistance = Math.random() * spread * (i / groupSize + 0.3);
                    
                    objectX = centerX + Math.cos(groupAngle) * groupDistance;
                    objectZ = centerZ + Math.sin(groupAngle) * groupDistance;
                }
                
                // Create the object
                let object = null;
                
                switch (randomType) {
                    case 'tree':
                        // Vary tree sizes slightly within a group for natural look
                        const scaleFactor = 0.8 + Math.random() * 0.4; // 0.8 to 1.2
                        object = this.createTree(objectX, objectZ, null, scaleFactor);
                        if (object) this.trees.push(object);
                        break;
                    case 'rock':
                        object = this.createRock(objectX, objectZ);
                        if (object) this.rocks.push(object);
                        break;
                    case 'bush':
                        object = this.createBush(objectX, objectZ);
                        if (object) this.bushes.push(object);
                        break;
                    case 'flower':
                        object = this.createFlower(objectX, objectZ);
                        if (object) this.flowers.push(object);
                        break;
                }
                
                if (object) {
                    // Add to environment objects array for tracking
                    this.environmentObjects.push({
                        type: randomType,
                        object: object,
                        position: new THREE.Vector3(objectX, 0, objectZ),
                        groupId: `group_${Date.now()}_${randomType}` // Track group membership
                    });
                    
                    groupObjects.push(object);
                }
            }
            
            console.debug(`Created group of ${groupObjects.length} ${randomType}s`);
        } else {
            // Create a single object
            let object = null;
            
            switch (randomType) {
                case 'tree':
                    object = this.createTree(centerX, centerZ);
                    if (object) this.trees.push(object);
                    break;
                case 'rock':
                    object = this.createRock(centerX, centerZ);
                    if (object) this.rocks.push(object);
                    break;
                case 'bush':
                    object = this.createBush(centerX, centerZ);
                    if (object) this.bushes.push(object);
                    break;
                case 'flower':
                    object = this.createFlower(centerX, centerZ);
                    if (object) this.flowers.push(object);
                    break;
            }
            
            if (object) {
                console.debug(`Generated single ${randomType} at (${centerX.toFixed(1)}, ${centerZ.toFixed(1)})`);
                
                // Add to environment objects array for tracking
                this.environmentObjects.push({
                    type: randomType,
                    object: object,
                    position: new THREE.Vector3(centerX, 0, centerZ)
                });
            }
        }
        
        // Limit the number of environment objects to prevent memory issues
        // Increased limit to account for groups and higher generation rate
        const maxObjects = 500; // Increased from 150 to 500 to accommodate more trees
        if (this.environmentObjects.length > maxObjects) {
            // Remove oldest objects
            const objectsToRemove = this.environmentObjects.length - maxObjects;
            for (let i = 0; i < objectsToRemove; i++) {
                const oldestObject = this.environmentObjects.shift();
                if (oldestObject && oldestObject.object && oldestObject.object.parent) {
                    this.scene.remove(oldestObject.object);
                    
                    // Also remove from type-specific arrays
                    switch (oldestObject.type) {
                        case 'tree':
                            this.trees = this.trees.filter(t => t !== oldestObject.object);
                            break;
                        case 'rock':
                            this.rocks = this.rocks.filter(r => r !== oldestObject.object);
                            break;
                        case 'bush':
                            this.bushes = this.bushes.filter(b => b !== oldestObject.object);
                            break;
                        case 'flower':
                            this.flowers = this.flowers.filter(f => f !== oldestObject.object);
                            break;
                    }
                }
            }
        }
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
                
                // Get zone type for the position
                const zoneType = this.getZoneTypeAt(x, z);
                
                switch (savedObj.type) {
                    case 'tree':
                        object = this.createTree(x, z, zoneType);
                        break;
                    case 'rock':
                        object = this.createRock(x, z, zoneType);
                        break;
                    case 'bush':
                        object = this.createBush(x, z, zoneType);
                        break;
                    case 'flower':
                        object = this.createFlower(x, z, zoneType);
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
                    
                    // Get zone type for the position
                    const zoneType = this.getZoneTypeAt(x, z);
                    
                    // Create the object based on type
                    let object;
                    switch (objectType) {
                        case 'tree':
                            object = this.createTree(x, z, zoneType);
                            break;
                        case 'rock':
                            object = this.createRock(x, z, zoneType);
                            break;
                        case 'bush':
                            object = this.createBush(x, z, zoneType);
                            break;
                        case 'flower':
                            object = this.createFlower(x, z, zoneType);
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
     * Create a tree at the specified position
     * @param {number} x - X coordinate
     * @param {number} z - Z coordinate
     * @param {string} zoneType - The type of zone (Forest, Desert, etc.)
     * @param {number} scaleFactor - Optional scale factor for natural variation
     * @returns {THREE.Group} - The tree group
     */
    createTree(x, z, zoneType = 'Forest', scaleFactor = 1.0) {
        const tree = new Tree(zoneType);
        const treeGroup = tree.createMesh();
        
        // Apply scale factor for natural variation
        if (scaleFactor !== 1.0) {
            treeGroup.scale.set(scaleFactor, scaleFactor, scaleFactor);
        }
        
        // Add some random rotation for natural look
        treeGroup.rotation.y = Math.random() * Math.PI * 2;
        
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
     * @param {string} zoneType - The type of zone (Forest, Desert, etc.)
     * @returns {THREE.Group} - The rock group
     */
    createRock(x, z, zoneType = 'Forest') {
        const rock = new Rock(zoneType);
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
    
    /**
     * Update the collections of environment objects for the minimap
     * This should be called before accessing the collections
     */
    updateEnvironmentCollections() {
        // Clear existing collections
        this.trees = [];
        this.rocks = [];
        this.bushes = [];
        this.flowers = [];
        
        // Populate collections from visible chunks
        for (const chunkKey in this.visibleChunks) {
            if (this.environmentObjects[chunkKey]) {
                this.environmentObjects[chunkKey].forEach(item => {
                    switch (item.type) {
                        case 'tree':
                            this.trees.push({
                                position: item.position
                            });
                            break;
                        case 'rock':
                            this.rocks.push({
                                position: item.position
                            });
                            break;
                        case 'bush':
                            this.bushes.push({
                                position: item.position
                            });
                            break;
                        case 'flower':
                            this.flowers.push({
                                position: item.position
                            });
                            break;
                    }
                });
            }
        }
        
        // Add some sample water bodies if none exist
        if (this.waterBodies.length === 0) {
            // Add a small lake
            this.waterBodies.push({
                position: new THREE.Vector3(20, 0, 20),
                size: 10
            });
            
            // Add a river
            for (let i = -50; i <= 50; i += 5) {
                this.waterBodies.push({
                    position: new THREE.Vector3(i, 0, i * 0.5),
                    size: 3
                });
            }
        }
        
        // Add some sample paths if none exist
        if (this.paths.length === 0) {
            // Add a path from origin to positive x
            for (let i = 0; i < 50; i += 5) {
                const currentPos = new THREE.Vector3(i, 0, 0);
                const nextPos = new THREE.Vector3(i + 5, 0, 0);
                
                this.paths.push({
                    position: currentPos,
                    nextPoint: nextPos
                });
            }
            
            // Add a curved path
            for (let i = 0; i < 10; i++) {
                const angle = i * Math.PI / 5;
                const currentPos = new THREE.Vector3(
                    30 * Math.cos(angle), 
                    0, 
                    30 * Math.sin(angle)
                );
                
                const nextAngle = (i + 1) * Math.PI / 5;
                const nextPos = new THREE.Vector3(
                    30 * Math.cos(nextAngle), 
                    0, 
                    30 * Math.sin(nextAngle)
                );
                
                this.paths.push({
                    position: currentPos,
                    nextPoint: nextPos
                });
            }
        }
    }
}