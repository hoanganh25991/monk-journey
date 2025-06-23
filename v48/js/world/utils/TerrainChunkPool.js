import * as THREE from 'three';
import { ObjectPool } from './ObjectPool.js';

/**
 * Specialized object pool for terrain chunks
 * Manages pools for different zone types
 */
export class TerrainChunkPool {
    constructor(scene) {
        this.scene = scene;
        
        // Create pools for each zone type
        this.pools = {};
        
        // Track active chunks for performance monitoring
        this.activeChunks = 0;
        
        // Initialize with common zone types
        this.initializePoolForZone('Terrant');
        this.initializePoolForZone('Forest');
        this.initializePoolForZone('Desert');
        this.initializePoolForZone('Mountain');
    }
    
    /**
     * Initialize a pool for a specific zone type
     * @param {string} zoneType - The zone type
     */
    initializePoolForZone(zoneType) {
        this.pools[zoneType] = new ObjectPool(
            // Factory function
            () => {
                // Create a basic terrain mesh
                const geometry = new THREE.PlaneGeometry(1, 1, 16, 16);
                const material = new THREE.MeshStandardMaterial({
                    vertexColors: true,
                    roughness: 0.8,
                    metalness: 0.2
                });
                
                const terrain = new THREE.Mesh(geometry, material);
                terrain.rotation.x = -Math.PI / 2;
                terrain.visible = false; // Start invisible
                terrain.receiveShadow = true;
                terrain.castShadow = true;
                
                // Add to scene
                this.scene.add(terrain);
                
                return terrain;
            },
            // Reset function
            (terrain) => {
                terrain.visible = false;
                terrain.position.set(0, 0, 0);
                terrain.scale.set(1, 1, 1);
                
                // Clear any vertex colors
                if (terrain.geometry.attributes.color) {
                    const colors = terrain.geometry.attributes.color.array;
                    for (let i = 0; i < colors.length; i++) {
                        colors[i] = 1.0; // Reset to white
                    }
                    terrain.geometry.attributes.color.needsUpdate = true;
                }
                
                // Clear user data
                terrain.userData = {};
            },
            // Initial size
            5 // Start with 5 pre-created chunks per zone
        );
    }
    
    /**
     * Get a terrain chunk from the pool
     * @param {string} zoneType - The zone type
     * @param {THREE.PlaneGeometry} geometry - The geometry to use
     * @param {THREE.Material} material - The material to use
     * @returns {THREE.Mesh} - The terrain chunk
     */
    get(zoneType) {
        // If pool doesn't exist for this zone, create it
        if (!this.pools[zoneType]) {
            this.initializePoolForZone(zoneType);
        }
        
        // Get chunk from pool
        const chunk = this.pools[zoneType].get();
        
        // Make visible and track
        chunk.visible = true;
        this.activeChunks++;
        
        return chunk;
    }
    
    /**
     * Return a terrain chunk to the pool
     * @param {string} zoneType - The zone type
     * @param {THREE.Mesh} chunk - The chunk to return to the pool
     */
    release(zoneType, chunk) {
        // If pool doesn't exist, create it
        if (!this.pools[zoneType]) {
            this.initializePoolForZone(zoneType);
        }
        
        // Return to pool
        this.pools[zoneType].release(chunk);
        
        // Update tracking
        this.activeChunks--;
    }
    
    /**
     * Get statistics about the pool usage
     * @returns {Object} - Pool statistics
     */
    getStats() {
        const stats = {
            activeChunks: this.activeChunks,
            poolSizes: {}
        };
        
        // Get pool sizes
        for (const zoneType in this.pools) {
            stats.poolSizes[zoneType] = this.pools[zoneType].size();
        }
        
        return stats;
    }
    
    /**
     * Clear all pools
     */
    clear() {
        for (const zoneType in this.pools) {
            // Get all chunks from the pool
            const pool = this.pools[zoneType];
            const chunks = [];
            
            // Empty the pool
            while (pool.size() > 0) {
                chunks.push(pool.get());
            }
            
            // Remove all chunks from the scene
            for (const chunk of chunks) {
                if (chunk.parent) {
                    this.scene.remove(chunk);
                }
            }
            
            // Clear the pool
            pool.clear();
        }
        
        // Reset active chunk count
        this.activeChunks = 0;
    }
}