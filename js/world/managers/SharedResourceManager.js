import * as THREE from 'three';

/**
 * Manages shared resources across the game to reduce memory usage
 * Implements the Singleton pattern to ensure only one instance exists
 */
export class SharedResourceManager {
    constructor() {
        // Ensure singleton pattern
        if (SharedResourceManager.instance) {
            return SharedResourceManager.instance;
        }
        
        SharedResourceManager.instance = this;
        
        // Shared geometries
        this.geometries = new Map();
        
        // Shared materials
        this.materials = new Map();
        
        // Shared textures
        this.textures = new Map();
        
        // Reference counting for proper disposal
        this.referenceCount = new Map();
        
        // Track initialization state
        this.initialized = false;
    }
    
    /**
     * Initialize shared resources
     */
    init() {
        if (this.initialized) return;
        
        console.debug('Initializing shared resources');
        
        // Initialize common geometries
        this.initGeometries();
        
        // Initialize common materials
        this.initMaterials();
        
        this.initialized = true;
    }
    
    /**
     * Initialize common geometries
     * @private
     */
    initGeometries() {
        // Terrain geometries
        this.geometries.set('terrain_chunk', new THREE.PlaneGeometry(1, 1, 32, 32));
        
        // Environment object geometries
        this.geometries.set('tree_trunk', new THREE.CylinderGeometry(0.2, 0.3, 1.5, 8));
        this.geometries.set('tree_leaves', new THREE.SphereGeometry(1, 8, 6));
        this.geometries.set('rock', new THREE.DodecahedronGeometry(1, 0));
        this.geometries.set('bush', new THREE.SphereGeometry(0.5, 8, 6));
        this.geometries.set('grass', new THREE.PlaneGeometry(0.5, 0.5));
        
        // Initialize reference counts
        for (const key of this.geometries.keys()) {
            this.referenceCount.set(`geometry_${key}`, 0);
        }
    }
    
    /**
     * Initialize common materials
     * @private
     */
    initMaterials() {
        // Terrain materials
        this.materials.set('terrain_grass', new THREE.MeshStandardMaterial({ 
            color: 0x4a7023, 
            roughness: 0.8,
            metalness: 0.1
        }));
        
        this.materials.set('terrain_rock', new THREE.MeshStandardMaterial({ 
            color: 0x808080, 
            roughness: 0.9,
            metalness: 0.1
        }));
        
        this.materials.set('terrain_sand', new THREE.MeshStandardMaterial({ 
            color: 0xd2b48c, 
            roughness: 0.8,
            metalness: 0.1
        }));
        
        // Environment materials
        this.materials.set('tree_trunk', new THREE.MeshStandardMaterial({ 
            color: 0x8b4513, 
            roughness: 0.9,
            metalness: 0.1
        }));
        
        this.materials.set('tree_leaves', new THREE.MeshStandardMaterial({ 
            color: 0x2e8b57, 
            roughness: 0.8,
            metalness: 0.1
        }));
        
        this.materials.set('rock', new THREE.MeshStandardMaterial({ 
            color: 0x696969, 
            roughness: 0.9,
            metalness: 0.2
        }));
        
        this.materials.set('bush', new THREE.MeshStandardMaterial({ 
            color: 0x228b22, 
            roughness: 0.8,
            metalness: 0.1
        }));
        
        // Initialize reference counts
        for (const key of this.materials.keys()) {
            this.referenceCount.set(`material_${key}`, 0);
        }
    }
    
    /**
     * Get a shared geometry
     * @param {string} key - Geometry key
     * @returns {THREE.BufferGeometry} - Shared geometry
     */
    getGeometry(key) {
        if (!this.initialized) this.init();
        
        const geometry = this.geometries.get(key);
        if (geometry) {
            // Increment reference count
            const refKey = `geometry_${key}`;
            this.referenceCount.set(refKey, (this.referenceCount.get(refKey) || 0) + 1);
            return geometry;
        }
        
        console.warn(`Shared geometry '${key}' not found`);
        return null;
    }
    
    /**
     * Get a shared material
     * @param {string} key - Material key
     * @returns {THREE.Material} - Shared material
     */
    getMaterial(key) {
        if (!this.initialized) this.init();
        
        const material = this.materials.get(key);
        if (material) {
            // Increment reference count
            const refKey = `material_${key}`;
            this.referenceCount.set(refKey, (this.referenceCount.get(refKey) || 0) + 1);
            return material;
        }
        
        console.warn(`Shared material '${key}' not found`);
        return null;
    }
    
    /**
     * Release a reference to a shared geometry
     * @param {string} key - Geometry key
     */
    releaseGeometry(key) {
        const refKey = `geometry_${key}`;
        const count = this.referenceCount.get(refKey) || 0;
        
        if (count > 0) {
            this.referenceCount.set(refKey, count - 1);
        }
    }
    
    /**
     * Release a reference to a shared material
     * @param {string} key - Material key
     */
    releaseMaterial(key) {
        const refKey = `material_${key}`;
        const count = this.referenceCount.get(refKey) || 0;
        
        if (count > 0) {
            this.referenceCount.set(refKey, count - 1);
        }
    }
    
    /**
     * Dispose all shared resources
     */
    dispose() {
        console.debug('Disposing shared resources');
        
        // Dispose geometries
        for (const [key, geometry] of this.geometries.entries()) {
            geometry.dispose();
        }
        this.geometries.clear();
        
        // Dispose materials
        for (const [key, material] of this.materials.entries()) {
            if (material.map) material.map.dispose();
            material.dispose();
        }
        this.materials.clear();
        
        // Dispose textures
        for (const [key, texture] of this.textures.entries()) {
            texture.dispose();
        }
        this.textures.clear();
        
        // Clear reference counts
        this.referenceCount.clear();
        
        this.initialized = false;
    }
    
    /**
     * Get reference count statistics
     * @returns {Object} - Reference count statistics
     */
    getStats() {
        const stats = {
            geometries: {},
            materials: {},
            totalGeometries: this.geometries.size,
            totalMaterials: this.materials.size,
            totalTextures: this.textures.size
        };
        
        // Collect geometry stats
        for (const key of this.geometries.keys()) {
            const refKey = `geometry_${key}`;
            stats.geometries[key] = this.referenceCount.get(refKey) || 0;
        }
        
        // Collect material stats
        for (const key of this.materials.keys()) {
            const refKey = `material_${key}`;
            stats.materials[key] = this.referenceCount.get(refKey) || 0;
        }
        
        return stats;
    }
}

// Export a singleton instance
export const sharedResources = new SharedResourceManager();