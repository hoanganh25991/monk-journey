import { ObjectPool } from '../../world/utils/ObjectPool.js';
import { Enemy } from '../Enemy.js';
import { EnemyModelFactory } from '../enemies/models/EnemyModelFactory.js';
import * as THREE from 'three';

/**
 * Specialized object pool for enemy objects
 * Manages pools for different types of enemies to improve performance
 * and reduce memory usage by reusing enemy objects
 */
export class EnemyObjectPool {
    constructor(scene, player) {
        this.scene = scene;
        this.player = player;
        
        // Create pools for each enemy type
        this.pools = {};
        
        // Track active enemies for performance monitoring
        this.activeEnemies = {};
        
        // Initialize with common enemy types
        this.initializePoolsForType('skeleton');
        this.initializePoolsForType('zombie');
        this.initializePoolsForType('demon');
        this.initializePoolsForType('shadow_beast');
    }
    
    /**
     * Initialize pools for a specific enemy type
     * @param {string} enemyType - The enemy type
     */
    initializePoolsForType(enemyType) {
        // Skip if pool already exists
        if (this.pools[enemyType]) {
            return;
        }
        
        // Initialize tracking counter
        this.activeEnemies[enemyType] = 0;
        
        // Create enemy pool for this type
        this.pools[enemyType] = new ObjectPool(
            // Factory function
            () => {
                // Create a basic enemy configuration
                const config = {
                    type: enemyType,
                    name: enemyType.charAt(0).toUpperCase() + enemyType.slice(1).replace('_', ' ')
                };
                
                // Create the enemy
                const enemy = new Enemy(this.scene, this.player, config);
                
                // The modelGroup will be created in enemy.createModel()
                // We don't need to create it here anymore
                
                return enemy;
            },
            // Reset function
            (enemy) => {
                // Reset enemy state
                enemy.health = enemy.maxHealth;
                enemy.state = {
                    isMoving: false,
                    isAttacking: false,
                    isDead: false,
                    attackCooldown: 0,
                    isKnockedBack: false,
                    knockbackEndTime: 0,
                    isAggressive: false,
                    aggressionEndTime: 0,
                    isEnraged: false
                };
                
                // Reset position and visibility
                if (enemy.modelGroup) {
                    enemy.modelGroup.visible = false;
                    enemy.modelGroup.position.set(0, 0, 0);
                    enemy.modelGroup.rotation.set(0, 0, 0);
                }
                
                // Reset position
                enemy.position = new THREE.Vector3(0, 0, 0);
            },
            // Initial size - start with a few pre-created enemies per type
            3
        );
    }
    
    /**
     * Get an enemy from the pool
     * @param {string} type - The enemy type
     * @param {Object} config - Configuration for the enemy
     * @returns {Enemy} - The enemy from the pool
     */
    get(type, config = {}) {
        // If pool doesn't exist for this type, create it
        if (!this.pools[type]) {
            this.initializePoolsForType(type);
        }
        
        // Get enemy from pool
        const enemy = this.pools[type].get();
        
        // Apply configuration
        Object.assign(enemy, {
            type: config.type || type,
            name: config.name || (type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')),
            health: config.health || 50,
            maxHealth: config.health || 50,
            damage: config.damage || 10,
            speed: config.speed || 3,
            attackRange: config.attackRange || 1.5,
            attackSpeed: config.attackSpeed || 1.5,
            experienceValue: config.experienceValue || 20,
            color: config.color || 0xcccccc,
            scale: config.scale || 1,
            isBoss: config.isBoss || false
        });
        
        // Apply behavior settings
        enemy.applyBehaviorSettings();
        
        // Initialize or reinitialize the model if needed
        if (!enemy.model || !enemy.modelGroup) {
            // Initialize the enemy (this will create the model)
            enemy.init();
        }
        
        // Make visible and track
        if (enemy.modelGroup) {
            enemy.modelGroup.visible = true;
        }
        
        // Track active enemies
        this.activeEnemies[type]++;
        
        return enemy;
    }
    
    /**
     * Return an enemy to the pool
     * @param {Enemy} enemy - The enemy to return to the pool
     */
    release(enemy) {
        if (!enemy) return;
        
        const type = enemy.type;
        
        // If pool doesn't exist for this type, create it
        if (!this.pools[type]) {
            this.initializePoolsForType(type);
        }
        
        // Return to pool
        this.pools[type].release(enemy);
        
        // Update tracking
        this.activeEnemies[type]--;
    }
    
    /**
     * Get statistics about the pool usage
     * @returns {Object} - Pool statistics
     */
    getStats() {
        const stats = {
            active: { ...this.activeEnemies },
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
            for (const enemy of objects) {
                if (enemy.modelGroup && enemy.modelGroup.parent) {
                    this.scene.remove(enemy.modelGroup);
                }
            }
            
            // Clear the pool
            pool.clear();
        }
        
        // Reset active enemy counts
        for (const type in this.activeEnemies) {
            this.activeEnemies[type] = 0;
        }
    }
}