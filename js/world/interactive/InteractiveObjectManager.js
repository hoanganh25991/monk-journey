import * as THREE from 'three';
import { TreasureChest } from './TreasureChest.js';
import { QuestMarker } from './QuestMarker.js';
import { BossSpawnPoint } from './BossSpawnPoint.js';

/**
 * Manages interactive objects in the world
 * 
 * This class is responsible for loading, positioning, and managing interactive objects.
 * Simplified to focus only on loading interactive objects from map data.
 */
export class InteractiveObjectManager {
    constructor(scene, worldManager, game = null) {
        this.scene = scene;
        this.worldManager = worldManager;
        this.game = game;
        
        // Interactive object collections
        this.interactiveObjects = [];
    }
    
    /**
     * Set the game reference
     * @param {Game} game - The game instance
     */
    setGame(game) {
        this.game = game;
    }
    
    /**
     * Initialize the interactive object system
     * @param {boolean} createDefaultObjects - Whether to create default objects (default: false)
     */
    init(createDefaultObjects = false) {
        if (createDefaultObjects) {
            this.createDefaultInteractiveObjects();
        }
        console.debug('Interactive objects initialized');
    }
    
    /**
     * Interact with an interactive object
     * This method is kept for backward compatibility but now always delegates to the centralized system
     * @param {Object} interactiveObject - The interactive object to interact with
     */
    interactWithObject(interactiveObject) {
        if (this.game && this.game.interactionSystem) {
            this.game.interactionSystem.handleTouchInteraction(interactiveObject);
        } else {
            console.warn('Interaction system not available, interaction cannot be processed');
        }
    }
    
    /**
     * Load interactive objects from map data
     * @param {Array} interactiveData - Array of interactive object data from map
     */
    loadFromMapData(interactiveData) {
        if (!interactiveData || !Array.isArray(interactiveData)) {
            console.warn('No interactive object data provided to load');
            return;
        }
        
        console.debug(`Loading ${interactiveData.length} interactive objects from map data`);
        
        // Clear existing interactive objects
        this.clear();
        
        interactiveData.forEach(objData => {
            if (objData.position && objData.type) {
                switch (objData.type) {
                    case 'chest':
                        this.createTreasureChest(
                            objData.position.x, 
                            objData.position.z,
                            objData.isOpen
                        );
                        break;
                    case 'quest':
                        this.createQuestMarker(
                            objData.position.x, 
                            objData.position.z, 
                            objData.name || 'Quest'
                        );
                        break;
                    case 'boss_spawn':
                        this.createBossSpawnPoint(
                            objData.position.x, 
                            objData.position.z, 
                            objData.bossType || 'generic_boss'
                        );
                        break;
                    default:
                        console.warn(`Unknown interactive object type: ${objData.type}`);
                }
            }
        });
        
        console.debug(`Successfully loaded ${this.interactiveObjects.length} interactive objects`);
    }
    
    /**
     * Create default interactive objects (for backward compatibility)
     */
    createDefaultInteractiveObjects() {
        // Create treasure chests
        this.createTreasureChest(10, 10);
        this.createTreasureChest(-15, 5);
        this.createTreasureChest(5, -15);
        
        // Create quest markers
        this.createQuestMarker(25, 15, 'Main Quest');
        this.createQuestMarker(-10, -20, 'Side Quest');
        this.createQuestMarker(15, -5, 'Exploration');
    }
    
    /**
     * Create a treasure chest at the specified position
     * @param {number} x - X coordinate
     * @param {number} z - Z coordinate
     * @param {boolean} isOpen - Whether the chest is already open
     * @returns {THREE.Group} - The treasure chest group
     */
    createTreasureChest(x, z, isOpen = false) {
        const chest = new TreasureChest();
        const chestGroup = chest.createMesh();
        
        // Position chest on terrain
        const y = this.worldManager.getTerrainHeight(x, z);
        chestGroup.position.set(x, y, z);
        
        // Add to scene
        this.scene.add(chestGroup);
        
        // If the chest should be open, call open() method
        if (isOpen) {
            chest.open();
        }
        
        // Add to interactive objects
        this.interactiveObjects.push({
            type: 'chest',
            mesh: chestGroup,
            position: new THREE.Vector3(x, y, z),
            interactionRadius: 2,
            isOpen: isOpen,
            onInteract: () => {
                // Open chest animation and give reward
                if (!chest.isOpen) {
                    // Open the chest
                    chest.open();
                    
                    // Mark as open in our tracking object
                    const interactiveObj = this.interactiveObjects.find(obj => obj.mesh === chestGroup);
                    if (interactiveObj) {
                        interactiveObj.isOpen = true;
                    }
                    
                    // Return some reward
                    return {
                        type: 'treasure',
                        item: {
                            name: 'Gold',
                            amount: Math.floor(Math.random() * 100) + 50
                        }
                    };
                }
                return null;
            }
        });
        
        return chestGroup;
    }
    
    /**
     * Create a quest marker at the specified position
     * @param {number} x - X coordinate
     * @param {number} z - Z coordinate
     * @param {string} questName - Name of the quest
     * @returns {THREE.Group} - The quest marker group
     */
    createQuestMarker(x, z, questName) {
        const questMarker = new QuestMarker(questName, this.game);
        const markerGroup = questMarker.createMesh();
        
        // Position marker on terrain
        markerGroup.position.set(x, this.worldManager.getTerrainHeight(x, z), z);
        
        // Add to scene
        this.scene.add(markerGroup);
        
        // Add to interactive objects
        this.interactiveObjects.push({
            type: 'quest',
            name: questName,
            mesh: markerGroup,
            position: new THREE.Vector3(x, this.worldManager.getTerrainHeight(x, z), z),
            interactionRadius: 3,
            onInteract: () => {
                // Return quest information
                return {
                    type: 'quest',
                    quest: {
                        name: questName,
                        description: `This is the ${questName}. Complete it to earn rewards!`,
                        objective: 'Defeat 5 enemies',
                        reward: {
                            experience: 100,
                            gold: 200
                        }
                    }
                };
            }
        });
        
        return markerGroup;
    }
    
    /**
     * Create a boss spawn point at the specified position
     * @param {number} x - X coordinate
     * @param {number} z - Z coordinate
     * @param {string} bossType - Type of boss
     * @returns {THREE.Group} - The boss spawn point group
     */
    createBossSpawnPoint(x, z, bossType) {
        const bossSpawn = new BossSpawnPoint(bossType);
        const markerGroup = bossSpawn.createMesh();
        
        // Position marker on terrain
        markerGroup.position.set(x, this.worldManager.getTerrainHeight(x, z), z);
        
        // Add to scene
        this.scene.add(markerGroup);
        
        // Add to interactive objects
        this.interactiveObjects.push({
            type: 'boss_spawn',
            name: `${bossType} Spawn`,
            mesh: markerGroup,
            position: new THREE.Vector3(x, this.worldManager.getTerrainHeight(x, z), z),
            interactionRadius: 5,
            bossType: bossType,
            onInteract: () => {
                // Return boss spawn information
                return {
                    type: 'boss_spawn',
                    bossType: bossType,
                    message: `You have awakened the ${bossType.replace('_', ' ')}!`
                };
            }
        });
        
        return markerGroup;
    }
    
    /**
     * Get interactive objects near a specific position
     * @param {THREE.Vector3} position - The position to check
     * @param {number} radius - The radius to check
     * @returns {Array} - Array of interactive objects within the radius
     */
    getObjectsNear(position, radius) {
        return this.interactiveObjects.filter(obj => {
            const distance = position.distanceTo(obj.position);
            return distance <= (radius + obj.interactionRadius);
        });
    }
    
    /**
     * Get all interactive objects
     * @returns {Array} - Array of all interactive objects
     */
    getInteractiveObjects() {
        return this.interactiveObjects;
    }
    
    /**
     * Get an interactive object by its mesh
     * @param {THREE.Object3D} mesh - The mesh to find the interactive object for
     * @returns {Object|null} - The interactive object or null if not found
     */
    getInteractiveObjectByMesh(mesh) {
        return this.interactiveObjects.find(obj => obj.mesh === mesh);
    }
    
    /**
     * Generate interactive object at a specific position - ADDED FOR SAMPLE COMPATIBILITY
     * @param {THREE.Vector3} position - Position to generate interactive object at
     */
    generateInteractiveAtPosition(position) {
        // Simple interactive object generation for random world generation
        const interactiveTypes = ['treasure_chest', 'quest_marker'];
        const randomType = interactiveTypes[Math.floor(Math.random() * interactiveTypes.length)];
        
        if (randomType === 'treasure_chest') {
            this.createTreasureChest(position.x, position.z);
        } else if (randomType === 'quest_marker') {
            const questNames = ['Forest Quest', 'Mountain Quest', 'Desert Quest'];
            const randomQuest = questNames[Math.floor(Math.random() * questNames.length)];
            this.createQuestMarker(position.x, position.z, randomQuest);
        }
        
        console.debug(`Generated random ${randomType} at (${position.x.toFixed(1)}, ${position.z.toFixed(1)})`);
    }
    
    /**
     * Clean up distant interactive objects - ADDED FOR SAMPLE COMPATIBILITY
     * @param {THREE.Vector3} playerPosition - Player position
     * @param {number} maxDistance - Maximum distance to keep objects
     */
    cleanupDistantObjects(playerPosition, maxDistance) {
        const objectsToRemove = [];
        
        // Find objects that are too far away
        this.interactiveObjects.forEach((objectInfo, index) => {
            if (objectInfo.position && playerPosition) {
                const distance = objectInfo.position.distanceTo(playerPosition);
                if (distance > maxDistance) {
                    objectsToRemove.push(index);
                }
            }
        });
        
        // Remove distant objects
        objectsToRemove.reverse().forEach(index => {
            const objectInfo = this.interactiveObjects[index];
            
            // Remove from scene
            if (objectInfo.mesh && objectInfo.mesh.parent) {
                this.scene.remove(objectInfo.mesh);
            }
            
            // Dispose of resources
            if (objectInfo.mesh) {
                if (objectInfo.mesh.traverse) {
                    objectInfo.mesh.traverse(obj => {
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
            
            // Remove from array
            this.interactiveObjects.splice(index, 1);
        });
        
        if (objectsToRemove.length > 0) {
            console.debug(`Cleaned up ${objectsToRemove.length} distant interactive objects`);
        }
    }
    
    /**
     * Update interactive objects for player position - ADDED FOR SAMPLE COMPATIBILITY
     * @param {THREE.Vector3} playerPosition - Player position
     * @param {number} drawDistanceMultiplier - Draw distance multiplier
     */
    updateForPlayer(playerPosition, drawDistanceMultiplier = 1.0) {
        // This method can be used for LOD updates or other player-based updates
        // For now, it's a placeholder for compatibility
        
        // Could implement visibility culling based on distance
        // Could implement interaction radius updates
        // Could implement dynamic object loading/unloading
    }
    
    /**
     * Clear all interactive objects
     */
    clear() {
        // Remove all interactive objects from the scene
        this.interactiveObjects.forEach(obj => {
            if (obj.mesh && obj.mesh.parent) {
                this.scene.remove(obj.mesh);
            }
        });
        
        // Reset collection
        this.interactiveObjects = [];
    }
    
    // Save and load methods have been removed as they are no longer needed
    // World is generated in-memory and not saved/loaded
}