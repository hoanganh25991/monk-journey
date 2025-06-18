import * as THREE from 'three';

/**
 * Base class for all environment objects
 * Provides common functionality and structure
 */
export class EnvironmentObject {
    constructor(scene, MapManager, position, size, type) {
        this.scene = scene;
        this.MapManager = MapManager;
        this.position = position;
        this.size = size || 1;
        this.type = type;
        this.object = null;
    }
    
    /**
     * Create the environment object
     * @returns {THREE.Object3D} - The created object
     */
    create() {
        // To be implemented by subclasses
        console.warn('create() method not implemented in subclass');
        return null;
    }
    
    /**
     * Get terrain height at position
     * @param {number} x - X coordinate
     * @param {number} z - Z coordinate
     * @returns {number} - Terrain height
     */
    getTerrainHeight(x, z) {
        return this.MapManager.getTerrainHeight(x, z);
    }
    
    /**
     * Add object to scene
     * @param {THREE.Object3D} object - The object to add
     */
    addToScene(object) {
        if (object) {
            this.scene.add(object);
            this.object = object;
        }
    }
    
    /**
     * Remove object from scene
     */
    removeFromScene() {
        if (this.object && this.object.parent) {
            this.scene.remove(this.object);
        }
    }
    
    /**
     * Dispose of object resources
     */
    dispose() {
        if (this.object) {
            // Dispose of geometries
            if (this.object.geometry) {
                this.object.geometry.dispose();
            }
            
            // Dispose of materials
            if (this.object.material) {
                if (Array.isArray(this.object.material)) {
                    this.object.material.forEach(mat => mat.dispose());
                } else {
                    this.object.material.dispose();
                }
            }
            
            // Handle groups
            if (this.object.isGroup) {
                this.object.children.forEach(child => {
                    if (child.geometry) child.geometry.dispose();
                    if (child.material) {
                        if (Array.isArray(child.material)) {
                            child.material.forEach(mat => mat.dispose());
                        } else {
                            child.material.dispose();
                        }
                    }
                });
            }
            
            this.removeFromScene();
            this.object = null;
        }
    }
}