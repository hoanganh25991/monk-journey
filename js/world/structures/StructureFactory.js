import * as THREE from 'three';

// Import structure configuration
import { STRUCTURE_OBJECTS, STRUCTURE_PROPERTIES } from '../../config/structure.js';

// Import structure classes
import { Building } from './Building.js';
import { Tower } from './Tower.js';
import { Ruins } from './Ruins.js';
import { DarkSanctum } from './DarkSanctum.js';
import { Mountain } from './Mountain.js';
import { Bridge } from './Bridge.js';
import { Village } from './Village.js';

/**
 * Structure Factory - Creates structure objects based on type
 * Centralizes structure object creation and provides a registry for all types
 */
export class StructureFactory {
    constructor(scene, worldManager) {
        this.scene = scene;
        this.worldManager = worldManager;
        this.registry = new Map();
        
        // Register all structure creators
        this.registerStructures();
    }
    
    /**
     * Get the zone type at the specified position
     * @param {number} x - X coordinate
     * @param {number} z - Z coordinate
     * @returns {string} - The zone type
     */
    getZoneTypeAt(x, z) {
        try {
            // Use the world manager to get the zone at this position
            if (this.worldManager && this.worldManager.zoneManager) {
                // Calculate which chunk this position is in
                const terrainChunkSize = this.worldManager.terrainManager.terrainChunkSize;
                const chunkX = Math.floor(x / terrainChunkSize);
                const chunkZ = Math.floor(z / terrainChunkSize);
                
                // Try to get zone type from the zone manager's chunk cache
                const zoneType = this.worldManager.zoneManager.getZoneTypeForChunk(chunkX, chunkZ);
                if (zoneType) {
                    return zoneType;
                }
            }
            
            // If we can't get a zone type, return a default
            return 'Forest';
        } catch (error) {
            console.warn('Error getting zone type:', error);
            return 'Forest';
        }
    }
    
    /**
     * Register all structure creators
     */
    registerStructures() {
        // Register building structures
        this.register(STRUCTURE_OBJECTS.HOUSE, (x, z, width = 5, depth = 5, height = 3, style = 'house') => {
            const zoneType = this.getZoneTypeAt(x, z);
            const building = new Building(zoneType, width, depth, height, style);
            const buildingGroup = building.createMesh();
            
            // Position building on terrain
            buildingGroup.position.set(x, this.worldManager.getTerrainHeight(x, z), z);
            
            // Add to scene
            this.scene.add(buildingGroup);
            
            return buildingGroup;
        });
        
        // Register tower structures
        this.register(STRUCTURE_OBJECTS.TOWER, (x, z) => {
            const zoneType = this.getZoneTypeAt(x, z);
            const tower = new Tower(zoneType);
            const towerGroup = tower.createMesh();
            
            // Position tower on terrain
            towerGroup.position.set(x, this.worldManager.getTerrainHeight(x, z), z);
            
            // Add to scene
            this.scene.add(towerGroup);
            
            return towerGroup;
        });
        
        // Register ruins structures
        this.register(STRUCTURE_OBJECTS.RUINS, (x, z) => {
            const ruins = new Ruins();
            const ruinsGroup = ruins.createMesh();
            
            // Position ruins on terrain
            ruinsGroup.position.set(x, this.worldManager.getTerrainHeight(x, z), z);
            
            // Add to scene
            this.scene.add(ruinsGroup);
            
            return ruinsGroup;
        });
        
        // Register dark sanctum structures
        this.register(STRUCTURE_OBJECTS.DARK_SANCTUM, (x, z) => {
            const darkSanctum = new DarkSanctum();
            const sanctumGroup = darkSanctum.createMesh();
            
            // Position sanctum on terrain
            sanctumGroup.position.set(x, this.worldManager.getTerrainHeight(x, z), z);
            
            // Add to scene
            this.scene.add(sanctumGroup);
            
            // Add a boss spawn point
            if (this.worldManager && this.worldManager.interactiveManager) {
                this.worldManager.interactiveManager.createBossSpawnPoint(x, z, 'necromancer_lord');
            }
            
            return sanctumGroup;
        });
        
        // Register mountain structures
        this.register(STRUCTURE_OBJECTS.MOUNTAIN, (x, z, scale = 1) => {
            const zoneType = this.getZoneTypeAt(x, z);
            const mountain = new Mountain(zoneType);
            const mountainGroup = mountain.createMesh();
            
            // Apply scale factor for natural variation
            if (scale !== 1.0) {
                mountainGroup.scale.set(scale, scale * 0.8, scale);
            }
            
            // Add some random rotation for natural look
            mountainGroup.rotation.y = Math.random() * Math.PI * 2;
            
            // Position mountain on terrain
            mountainGroup.position.set(x, this.worldManager.getTerrainHeight(x, z), z);
            
            // Add to scene
            this.scene.add(mountainGroup);
            
            return mountainGroup;
        });
        
        // Register bridge structures
        this.register(STRUCTURE_OBJECTS.BRIDGE, (x, z) => {
            const zoneType = this.getZoneTypeAt(x, z);
            const bridge = new Bridge(zoneType);
            const bridgeGroup = bridge.createMesh();
            
            // Position bridge on terrain
            bridgeGroup.position.set(x, this.worldManager.getTerrainHeight(x, z), z);
            
            // Randomly rotate the bridge
            bridgeGroup.rotation.y = Math.random() * Math.PI;
            
            // Add to scene
            this.scene.add(bridgeGroup);
            
            return bridgeGroup;
        });
        
        // Register village structures
        this.register(STRUCTURE_OBJECTS.VILLAGE, (x, z) => {
            const zoneType = this.getZoneTypeAt(x, z);
            const village = new Village(zoneType);
            const villageGroup = village.createMesh();
            
            // Position village on terrain
            villageGroup.position.set(x, this.worldManager.getTerrainHeight(x, z), z);
            
            // Add to scene
            this.scene.add(villageGroup);
            
            // Add interactive objects like NPCs and treasure chests
            if (this.worldManager && this.worldManager.interactiveManager) {
                // Add a treasure chest
                const chestX = x + (Math.random() * 10 - 5);
                const chestZ = z + (Math.random() * 10 - 5);
                this.worldManager.interactiveManager.createTreasureChest(chestX, chestZ);
                
                // Add quest marker
                const questX = x + (Math.random() * 10 - 5);
                const questZ = z + (Math.random() * 10 - 5);
                this.worldManager.interactiveManager.createQuestMarker(questX, questZ);
            }
            
            return villageGroup;
        });
        
        // Register building variants as building types with different styles
        this.register(STRUCTURE_OBJECTS.TAVERN, (x, z) => {
            const props = STRUCTURE_PROPERTIES[STRUCTURE_OBJECTS.TAVERN];
            const zoneType = this.getZoneTypeAt(x, z);
            const building = new Building(zoneType, props.width, props.depth, props.height, 'tavern');
            const buildingGroup = building.createMesh();
            
            // Position building on terrain
            buildingGroup.position.set(x, this.worldManager.getTerrainHeight(x, z), z);
            
            // Add to scene
            this.scene.add(buildingGroup);
            
            return buildingGroup;
        });
        
        this.register(STRUCTURE_OBJECTS.TEMPLE, (x, z) => {
            const props = STRUCTURE_PROPERTIES[STRUCTURE_OBJECTS.TEMPLE];
            const zoneType = this.getZoneTypeAt(x, z);
            const building = new Building(zoneType, props.width, props.depth, props.height, 'temple');
            const buildingGroup = building.createMesh();
            
            // Position building on terrain
            buildingGroup.position.set(x, this.worldManager.getTerrainHeight(x, z), z);
            
            // Add to scene
            this.scene.add(buildingGroup);
            
            return buildingGroup;
        });
        
        this.register(STRUCTURE_OBJECTS.SHOP, (x, z) => {
            const props = STRUCTURE_PROPERTIES[STRUCTURE_OBJECTS.SHOP];
            const zoneType = this.getZoneTypeAt(x, z);
            const building = new Building(zoneType, props.width, props.depth, props.height, 'shop');
            const buildingGroup = building.createMesh();
            
            // Position building on terrain
            buildingGroup.position.set(x, this.worldManager.getTerrainHeight(x, z), z);
            
            // Add to scene
            this.scene.add(buildingGroup);
            
            return buildingGroup;
        });
        
        this.register(STRUCTURE_OBJECTS.FORTRESS, (x, z) => {
            const props = STRUCTURE_PROPERTIES[STRUCTURE_OBJECTS.FORTRESS];
            const zoneType = this.getZoneTypeAt(x, z);
            const building = new Building(zoneType, props.width, props.depth, props.height, 'fortress');
            const buildingGroup = building.createMesh();
            
            // Position building on terrain
            buildingGroup.position.set(x, this.worldManager.getTerrainHeight(x, z), z);
            
            // Add to scene
            this.scene.add(buildingGroup);
            
            return buildingGroup;
        });
        
        this.register(STRUCTURE_OBJECTS.ALTAR, (x, z) => {
            const props = STRUCTURE_PROPERTIES[STRUCTURE_OBJECTS.ALTAR];
            const zoneType = this.getZoneTypeAt(x, z);
            const building = new Building(zoneType, props.width, props.depth, props.height, 'altar');
            const buildingGroup = building.createMesh();
            
            // Position building on terrain
            buildingGroup.position.set(x, this.worldManager.getTerrainHeight(x, z), z);
            
            // Add to scene
            this.scene.add(buildingGroup);
            
            return buildingGroup;
        });
    }
    
    /**
     * Register a structure creator function
     * @param {string} type - The structure type
     * @param {Function} creatorFn - The function that creates the structure
     */
    register(type, creatorFn) {
        this.registry.set(type, creatorFn);
    }
    
    /**
     * Create a structure of the specified type
     * @param {string} type - The structure type
     * @param {Object} params - Parameters for structure creation
     * @returns {Object} - The created structure
     */
    createStructure(type, params = {}) {
        const creator = this.registry.get(type);
        
        if (!creator) {
            console.warn(`No creator registered for structure type: ${type}`);
            return null;
        }
        
        // Extract common parameters
        const { x, z, width, depth, height, style, scale } = params;
        
        // Call the creator function with appropriate parameters
        if (type === STRUCTURE_OBJECTS.HOUSE || 
            type === STRUCTURE_OBJECTS.TAVERN || 
            type === STRUCTURE_OBJECTS.TEMPLE || 
            type === STRUCTURE_OBJECTS.SHOP || 
            type === STRUCTURE_OBJECTS.FORTRESS || 
            type === STRUCTURE_OBJECTS.ALTAR) {
            return creator(x, z, width, depth, height, style);
        } else if (type === STRUCTURE_OBJECTS.MOUNTAIN) {
            return creator(x, z, scale);
        } else {
            return creator(x, z);
        }
    }
    
    /**
     * Get default properties for a structure type
     * @param {string} type - The structure type
     * @returns {Object} - The default properties
     */
    getDefaultProperties(type) {
        return STRUCTURE_PROPERTIES[type] || {};
    }
}