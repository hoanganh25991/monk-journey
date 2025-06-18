import * as THREE from 'three';

// Import structure configuration
import { STRUCTURE_TYPES, STRUCTURE_PROPERTIES } from '../../config/map/structure.js';

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
    constructor(scene, MapManager) {
        this.scene = scene;
        this.MapManager = MapManager;
        this.registry = new Map();
        
        // Register all structure creators
        this.registerStructureCreators();
    }
    
    /**
     * Register all structure creators
     */
    registerStructureCreators() {
        // Register basic structures
        this.register(STRUCTURE_TYPES.HOUSE, (position, options = {}) => {
            const width = options.width || STRUCTURE_PROPERTIES[STRUCTURE_TYPES.HOUSE].width;
            const depth = options.depth || STRUCTURE_PROPERTIES[STRUCTURE_TYPES.HOUSE].depth;
            const height = options.height || STRUCTURE_PROPERTIES[STRUCTURE_TYPES.HOUSE].height;
            
            const building = new Building(this.scene, this.MapManager);
            return building.createMesh(position.x, position.z, width, depth, height);
        });
        
        this.register(STRUCTURE_TYPES.TOWER, (position, options = {}) => {
            const tower = new Tower(this.scene, this.MapManager);
            return tower.createMesh(position.x, position.z);
        });
        
        this.register(STRUCTURE_TYPES.RUINS, (position, options = {}) => {
            const ruins = new Ruins(this.scene, this.MapManager);
            return ruins.createMesh(position.x, position.z);
        });
        
        this.register(STRUCTURE_TYPES.DARK_SANCTUM, (position, options = {}) => {
            const darkSanctum = new DarkSanctum(this.scene, this.MapManager);
            return darkSanctum.createMesh(position.x, position.z);
        });
        
        this.register(STRUCTURE_TYPES.MOUNTAIN, (position, options = {}) => {
            const mountain = new Mountain(this.scene, this.MapManager);
            return mountain.createMesh(position.x, position.z);
        });
        
        this.register(STRUCTURE_TYPES.BRIDGE, (position, options = {}) => {
            const bridge = new Bridge(this.scene, this.MapManager);
            return bridge.createMesh(position.x, position.z);
        });
        
        this.register(STRUCTURE_TYPES.VILLAGE, (position, options = {}) => {
            const village = new Village(this.scene, this.MapManager);
            return village.createMesh(position.x, position.z);
        });
        
        // Register special building types (all use Building class with different styles)
        this.register(STRUCTURE_TYPES.TAVERN, (position, options = {}) => {
            const width = options.width || STRUCTURE_PROPERTIES[STRUCTURE_TYPES.TAVERN].width;
            const depth = options.depth || STRUCTURE_PROPERTIES[STRUCTURE_TYPES.TAVERN].depth;
            const height = options.height || STRUCTURE_PROPERTIES[STRUCTURE_TYPES.TAVERN].height;
            
            const building = new Building(this.scene, this.MapManager);
            return building.createMesh(position.x, position.z, width, depth, height, STRUCTURE_TYPES.TAVERN);
        });
        
        this.register(STRUCTURE_TYPES.TEMPLE, (position, options = {}) => {
            const width = options.width || STRUCTURE_PROPERTIES[STRUCTURE_TYPES.TEMPLE].width;
            const depth = options.depth || STRUCTURE_PROPERTIES[STRUCTURE_TYPES.TEMPLE].depth;
            const height = options.height || STRUCTURE_PROPERTIES[STRUCTURE_TYPES.TEMPLE].height;
            
            const building = new Building(this.scene, this.MapManager);
            return building.createMesh(position.x, position.z, width, depth, height, STRUCTURE_TYPES.TEMPLE);
        });
        
        this.register(STRUCTURE_TYPES.SHOP, (position, options = {}) => {
            const width = options.width || STRUCTURE_PROPERTIES[STRUCTURE_TYPES.SHOP].width;
            const depth = options.depth || STRUCTURE_PROPERTIES[STRUCTURE_TYPES.SHOP].depth;
            const height = options.height || STRUCTURE_PROPERTIES[STRUCTURE_TYPES.SHOP].height;
            
            const building = new Building(this.scene, this.MapManager);
            return building.createMesh(position.x, position.z, width, depth, height, STRUCTURE_TYPES.SHOP);
        });
        
        this.register(STRUCTURE_TYPES.FORTRESS, (position, options = {}) => {
            const width = options.width || STRUCTURE_PROPERTIES[STRUCTURE_TYPES.FORTRESS].width;
            const depth = options.depth || STRUCTURE_PROPERTIES[STRUCTURE_TYPES.FORTRESS].depth;
            const height = options.height || STRUCTURE_PROPERTIES[STRUCTURE_TYPES.FORTRESS].height;
            
            const building = new Building(this.scene, this.MapManager);
            return building.createMesh(position.x, position.z, width, depth, height, STRUCTURE_TYPES.FORTRESS);
        });
        
        this.register(STRUCTURE_TYPES.ALTAR, (position, options = {}) => {
            const width = options.width || STRUCTURE_PROPERTIES[STRUCTURE_TYPES.ALTAR].width;
            const depth = options.depth || STRUCTURE_PROPERTIES[STRUCTURE_TYPES.ALTAR].depth;
            const height = options.height || STRUCTURE_PROPERTIES[STRUCTURE_TYPES.ALTAR].height;
            
            const building = new Building(this.scene, this.MapManager);
            return building.createMesh(position.x, position.z, width, depth, height, STRUCTURE_TYPES.ALTAR);
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
     * @param {THREE.Vector3} position - The position to place the structure
     * @param {Object} options - Additional options for the structure
     * @returns {THREE.Object3D} - The created structure
     */
    createStructure(type, position, options = {}) {
        // Check if we have a creator for this type
        if (!this.registry.has(type)) {
            console.warn(`No structure creator registered for type: ${type}`);
            return null;
        }
        
        // Get the creator function
        const creatorFn = this.registry.get(type);
        
        // Create the structure
        try {
            return creatorFn(position, options);
        } catch (error) {
            console.error(`Error creating structure of type ${type}:`, error);
            return null;
        }
    }
    
    /**
     * Get the default properties for a structure type
     * @param {string} type - The structure type
     * @returns {Object} - The default properties
     */
    getDefaultProperties(type) {
        return STRUCTURE_PROPERTIES[type] || {};
    }
    
    /**
     * Check if a structure type is registered
     * @param {string} type - The structure type
     * @returns {boolean} - True if the type is registered
     */
    hasType(type) {
        return this.registry.has(type);
    }
    
    /**
     * Get all registered structure types
     * @returns {Array<string>} - Array of registered structure types
     */
    getRegisteredTypes() {
        return Array.from(this.registry.keys());
    }
}