import { ObjectPool } from './ObjectPool.js';
import { Tree } from '../environment/Tree.js';
import { Rock } from '../environment/Rock.js';
import { Bush } from '../environment/Bush.js';
import { Flower } from '../environment/Flower.js';
import * as THREE from 'three';

/**
 * Specialized object pool for environment objects
 * Manages pools for different types of environment objects (trees, rocks, bushes, flowers)
 * with zone-specific variants
 */
export class EnvironmentObjectPool {
    constructor(scene) {
        this.scene = scene;
        
        // Create pools for each object type and zone combination
        this.pools = {};
        
        // Track active objects for performance monitoring
        this.activeObjects = {
            tree: 0,
            rock: 0,
            bush: 0,
            flower: 0
        };
        
        // Initialize with common zone types
        this.initializePoolsForZone('Forest');
        this.initializePoolsForZone('Desert');
        this.initializePoolsForZone('Mountain');
        this.initializePoolsForZone('Terrant');
    }
    
    /**
     * Initialize pools for a specific zone type
     * @param {string} zoneType - The zone type
     */
    initializePoolsForZone(zoneType) {
        // Tree pool for this zone
        this.pools[`tree_${zoneType}`] = new ObjectPool(
            // Factory function
            () => {
                const tree = new Tree(zoneType);
                const treeGroup = tree.createMesh();
                treeGroup.visible = false; // Start invisible
                this.scene.add(treeGroup);
                return treeGroup;
            },
            // Reset function
            (treeGroup) => {
                treeGroup.visible = false;
                treeGroup.position.set(0, 0, 0);
                treeGroup.rotation.set(0, 0, 0);
                treeGroup.scale.set(1, 1, 1);
            },
            // Initial size
            5 // Start with 5 pre-created trees per zone
        );
        
        // Rock pool for this zone
        this.pools[`rock_${zoneType}`] = new ObjectPool(
            // Factory function
            () => {
                const rock = new Rock(zoneType);
                const rockGroup = rock.createMesh();
                rockGroup.visible = false; // Start invisible
                this.scene.add(rockGroup);
                return rockGroup;
            },
            // Reset function
            (rockGroup) => {
                rockGroup.visible = false;
                rockGroup.position.set(0, 0, 0);
                rockGroup.rotation.set(0, 0, 0);
                rockGroup.scale.set(1, 1, 1);
            },
            // Initial size
            8 // Start with 8 pre-created rocks per zone
        );
        
        // Bush pool
        this.pools[`bush_${zoneType}`] = new ObjectPool(
            // Factory function
            () => {
                const bush = new Bush();
                const bushGroup = bush.createMesh();
                bushGroup.visible = false; // Start invisible
                this.scene.add(bushGroup);
                return bushGroup;
            },
            // Reset function
            (bushGroup) => {
                bushGroup.visible = false;
                bushGroup.position.set(0, 0, 0);
                bushGroup.rotation.set(0, 0, 0);
                bushGroup.scale.set(1, 1, 1);
            },
            // Initial size
            10 // Start with 10 pre-created bushes per zone
        );
        
        // Flower pool
        this.pools[`flower_${zoneType}`] = new ObjectPool(
            // Factory function
            () => {
                const flower = new Flower();
                const flowerGroup = flower.createMesh();
                flowerGroup.visible = false; // Start invisible
                this.scene.add(flowerGroup);
                return flowerGroup;
            },
            // Reset function
            (flowerGroup) => {
                flowerGroup.visible = false;
                flowerGroup.position.set(0, 0, 0);
                flowerGroup.rotation.set(0, 0, 0);
                flowerGroup.scale.set(1, 1, 1);
            },
            // Initial size
            15 // Start with 15 pre-created flowers per zone
        );
    }
    
    /**
     * Get an object from the pool
     * @param {string} type - The object type (tree, rock, bush, flower)
     * @param {string} zoneType - The zone type
     * @returns {THREE.Group} - The object from the pool
     */
    get(type, zoneType = 'Forest') {
        const poolKey = `${type}_${zoneType}`;
        
        // If pool doesn't exist for this zone, create it
        if (!this.pools[poolKey]) {
            this.initializePoolsForZone(zoneType);
        }
        
        // Get object from pool
        const object = this.pools[poolKey].get();
        
        // Make visible and track
        object.visible = true;
        this.activeObjects[type]++;
        
        return object;
    }
    
    /**
     * Return an object to the pool
     * @param {string} type - The object type (tree, rock, bush, flower)
     * @param {string} zoneType - The zone type
     * @param {THREE.Group} object - The object to return to the pool
     */
    release(type, zoneType, object) {
        const poolKey = `${type}_${zoneType}`;
        
        // If pool doesn't exist, create it
        if (!this.pools[poolKey]) {
            this.initializePoolsForZone(zoneType);
        }
        
        // Return to pool
        this.pools[poolKey].release(object);
        
        // Update tracking
        this.activeObjects[type]--;
    }
    
    /**
     * Get statistics about the pool usage
     * @returns {Object} - Pool statistics
     */
    getStats() {
        const stats = {
            active: { ...this.activeObjects },
            poolSizes: {}
        };
        
        // Get pool sizes
        for (const poolKey in this.pools) {
            stats.poolSizes[poolKey] = this.pools[poolKey].size();
        }
        
        return stats;
    }
    
    /**
     * Clear all pools
     */
    clear() {
        for (const poolKey in this.pools) {
            // Get all objects from the pool
            const pool = this.pools[poolKey];
            const objects = [];
            
            // Empty the pool
            while (pool.size() > 0) {
                objects.push(pool.get());
            }
            
            // Remove all objects from the scene
            for (const object of objects) {
                if (object.parent) {
                    this.scene.remove(object);
                }
            }
            
            // Clear the pool
            pool.clear();
        }
        
        // Reset active object counts
        for (const type in this.activeObjects) {
            this.activeObjects[type] = 0;
        }
    }
}