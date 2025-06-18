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
    constructor(scene, MapManager, game = null) {
        this.scene = scene;
        this.MapManager = MapManager;
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
        const y = this.MapManager.getTerrainHeight(x, z);
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
        const questMarker = new QuestMarker(questName);
        const markerGroup = questMarker.createMesh();
        
        // Position marker on terrain
        markerGroup.position.set(x, this.MapManager.getTerrainHeight(x, z), z);
        
        // Add to scene
        this.scene.add(markerGroup);
        
        // Add to interactive objects
        this.interactiveObjects.push({
            type: 'quest',
            name: questName,
            mesh: markerGroup,
            position: new THREE.Vector3(x, this.MapManager.getTerrainHeight(x, z), z),
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
        markerGroup.position.set(x, this.MapManager.getTerrainHeight(x, z), z);
        
        // Add to scene
        this.scene.add(markerGroup);
        
        // Add to interactive objects
        this.interactiveObjects.push({
            type: 'boss_spawn',
            name: `${bossType} Spawn`,
            mesh: markerGroup,
            position: new THREE.Vector3(x, this.MapManager.getTerrainHeight(x, z), z),
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
    
    /**
     * Save interactive object state
     * @returns {object} - The saved interactive object state
     */
    save() {
        return {
            objects: this.interactiveObjects.map(obj => ({
                type: obj.type,
                name: obj.name,
                position: {
                    x: obj.position.x,
                    y: obj.position.y,
                    z: obj.position.z
                },
                interactionRadius: obj.interactionRadius,
                isOpen: obj.isOpen,
                bossType: obj.bossType
            }))
        };
    }
    
    /**
     * Load interactive object state
     * @param {object} interactiveState - The interactive object state to load
     */
    load(interactiveState) {
        if (!interactiveState || !interactiveState.objects) return;
        
        // Clear existing objects
        this.clear();
        
        // Create objects from saved data
        interactiveState.objects.forEach(objData => {
            switch (objData.type) {
                case 'chest':
                    const chest = this.createTreasureChest(objData.position.x, objData.position.z);
                    if (objData.isOpen) {
                        // Find the interactive object and mark it as open
                        const interactiveObj = this.interactiveObjects.find(obj => obj.mesh === chest);
                        if (interactiveObj) {
                            interactiveObj.isOpen = true;
                            // Open the chest visually
                            const treasureChest = new TreasureChest();
                            treasureChest.open(chest);
                        }
                    }
                    break;
                case 'quest':
                    this.createQuestMarker(objData.position.x, objData.position.z, objData.name);
                    break;
                case 'boss_spawn':
                    this.createBossSpawnPoint(objData.position.x, objData.position.z, objData.bossType);
                    break;
            }
        });
    }
}