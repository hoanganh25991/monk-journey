import { ObjectPool } from '../world/utils/ObjectPool.js';
import * as THREE from 'three';
import GeometryFactory from '../utils/GeometryFactory.js';

/**
 * Specialized object pool for visual effects
 * Manages pools for different types of effects (projectiles, spells, impacts, etc.)
 * Optimized for performance with proper shadow handling
 */
export class EffectObjectPool {
    constructor(scene) {
        this.scene = scene;
        
        // Create pools for each effect type
        this.pools = {};
        
        // Track active effects for performance monitoring
        this.activeEffects = {};
        
        // Shadow settings
        this.shadowsEnabled = true;
        this.shadowQuality = 'medium'; // 'none', 'low', 'medium', 'high'
        
        // Performance tracking
        this.lastUpdateTime = 0;
        this.updateInterval = 100; // ms
        this.activeEffectCount = 0;
        
        // Initialize common effect types
        this.initializeCommonEffects();
    }
    
    /**
     * Set shadow settings for all effects
     * @param {boolean} enabled - Whether shadows are enabled
     * @param {string} quality - Shadow quality ('none', 'low', 'medium', 'high')
     */
    setShadowSettings(enabled, quality = 'medium') {
        this.shadowsEnabled = enabled;
        this.shadowQuality = quality;
    }
    
    /**
     * Initialize pools for common effect types
     */
    initializeCommonEffects() {
        // Projectile effects
        this.initializePool('projectile_fireball');
        this.initializePool('projectile_ice');
        this.initializePool('projectile_arrow');
        
        // Impact effects
        this.initializePool('impact_explosion');
        this.initializePool('impact_frost');
        
        // Area effects
        this.initializePool('area_fire');
        this.initializePool('area_poison');
    }
    
    /**
     * Initialize a pool for a specific effect type
     * @param {string} effectType - The effect type
     */
    initializePool(effectType) {
        // Skip if pool already exists
        if (this.pools[effectType]) {
            return;
        }
        
        // Initialize tracking counter
        this.activeEffects[effectType] = 0;
        
        // Create effect factory based on type
        let factory, reset, initialSize;
        
        // Set up factory, reset function, and initial size based on effect type
        if (effectType.startsWith('projectile_')) {
            [factory, reset, initialSize] = this.createProjectilePool(effectType);
        } else if (effectType.startsWith('impact_')) {
            [factory, reset, initialSize] = this.createImpactPool(effectType);
        } else if (effectType.startsWith('area_')) {
            [factory, reset, initialSize] = this.createAreaPool(effectType);
        } else {
            // Default effect
            [factory, reset, initialSize] = this.createDefaultPool(effectType);
        }
        
        // Create the pool
        this.pools[effectType] = new ObjectPool(factory, reset, initialSize);
    }
    
    /**
     * Create a projectile effect pool
     * @param {string} effectType - The effect type
     * @returns {Array} - [factory, reset, initialSize]
     */
    createProjectilePool(effectType) {
        // Determine projectile color based on type
        let color;
        switch (effectType) {
            case 'projectile_fireball':
                color = 0xff4400;
                break;
            case 'projectile_ice':
                color = 0x44aaff;
                break;
            case 'projectile_arrow':
                color = 0x885522;
                break;
            default:
                color = 0xffffff;
        }
        
        // Factory function
        const factory = () => {
            // Create projectile group
            const group = new THREE.Group();
            group.visible = false;
            
            // Create projectile mesh with proper material for shadows
            const mesh = new THREE.Mesh(
                GeometryFactory.createSphereGeometry(0.2, 8, 8),
                new THREE.MeshStandardMaterial({ 
                    color: color,
                    emissive: color,
                    emissiveIntensity: 0.5,
                    roughness: 0.3,
                    metalness: 0.2
                })
            );
            
            // Configure shadow casting based on settings
            mesh.castShadow = this.shadowsEnabled;
            mesh.receiveShadow = false; // Projectiles don't receive shadows
            
            // Add mesh to group
            group.add(mesh);
            
            // Add trail effect with improved material
            const trail = new THREE.Mesh(
                GeometryFactory.createCylinderGeometry(0.05, 0.15, 0.5, 8),
                new THREE.MeshStandardMaterial({ 
                    color: color, 
                    transparent: true, 
                    opacity: 0.6,
                    emissive: color,
                    emissiveIntensity: 0.3,
                    roughness: 0.5
                })
            );
            
            // Configure trail shadow casting
            trail.castShadow = false; // Trails don't cast shadows for performance
            trail.receiveShadow = false;
            
            // Position trail
            trail.rotation.x = Math.PI / 2;
            trail.position.z = -0.3;
            group.add(trail);
            
            // Add light source for high-quality effects
            if (this.shadowQuality === 'high') {
                const light = new THREE.PointLight(color, 1, 2);
                light.intensity = 0.8;
                light.castShadow = false; // Point lights are expensive for shadows
                group.add(light);
                group.userData.hasLight = true;
            }
            
            // Add to scene
            this.scene.add(group);
            
            // Add metadata
            group.userData = {
                type: effectType,
                isEffect: true,
                isProjectile: true,
                creationTime: Date.now(),
                meshes: [mesh, trail] // Store references to meshes for easy access
            };
            
            return group;
        };
        
        // Reset function
        const reset = (group) => {
            group.visible = false;
            group.position.set(0, 0, 0);
            group.rotation.set(0, 0, 0);
            group.userData.creationTime = Date.now();
            
            // Reset any animations or timers
            if (group.userData.animationId) {
                cancelAnimationFrame(group.userData.animationId);
                group.userData.animationId = null;
            }
            
            // Update shadow settings based on current configuration
            if (group.userData.meshes) {
                group.userData.meshes.forEach(mesh => {
                    if (mesh.isMesh) {
                        mesh.castShadow = this.shadowsEnabled && 
                            (this.shadowQuality !== 'none') && 
                            !mesh.material.transparent;
                    }
                });
            }
            
            // Reset any lights
            if (group.userData.hasLight) {
                for (let i = 0; i < group.children.length; i++) {
                    const child = group.children[i];
                    if (child.isLight) {
                        child.intensity = 0.8;
                    }
                }
            }
        };
        
        // Initial size - projectiles need more instances
        const initialSize = 15; // Increased from 10 to reduce allocation during gameplay
        
        return [factory, reset, initialSize];
    }
    
    /**
     * Create an impact effect pool
     * @param {string} effectType - The effect type
     * @returns {Array} - [factory, reset, initialSize]
     */
    createImpactPool(effectType) {
        // Determine impact color based on type
        let color;
        switch (effectType) {
            case 'impact_explosion':
                color = 0xff6600;
                break;
            case 'impact_frost':
                color = 0x88ccff;
                break;
            default:
                color = 0xffffff;
        }
        
        // Factory function
        const factory = () => {
            // Create impact group
            const group = new THREE.Group();
            group.visible = false;
            
            // Create impact mesh (simple particle system placeholder)
            for (let i = 0; i < 8; i++) {
                const particle = new THREE.Mesh(
                    GeometryFactory.createSphereGeometry(0.1, 4, 4),
                    new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.8 })
                );
                
                // Random position within impact radius
                const angle = Math.random() * Math.PI * 2;
                const radius = Math.random() * 0.5;
                particle.position.set(
                    Math.cos(angle) * radius,
                    Math.random() * 0.5,
                    Math.sin(angle) * radius
                );
                
                group.add(particle);
            }
            
            // Add to scene
            this.scene.add(group);
            
            // Add metadata
            group.userData = {
                type: effectType,
                isEffect: true,
                isImpact: true,
                creationTime: Date.now()
            };
            
            return group;
        };
        
        // Reset function
        const reset = (group) => {
            group.visible = false;
            group.position.set(0, 0, 0);
            group.userData.creationTime = Date.now();
            
            // Reset any animations or timers
            if (group.userData.animationId) {
                cancelAnimationFrame(group.userData.animationId);
                group.userData.animationId = null;
            }
            
            // Reset all particles
            group.children.forEach(particle => {
                particle.scale.set(1, 1, 1);
                particle.material.opacity = 0.8;
            });
        };
        
        // Initial size
        const initialSize = 5;
        
        return [factory, reset, initialSize];
    }
    
    /**
     * Create an area effect pool
     * @param {string} effectType - The effect type
     * @returns {Array} - [factory, reset, initialSize]
     */
    createAreaPool(effectType) {
        // Determine area effect color based on type
        let color;
        switch (effectType) {
            case 'area_fire':
                color = 0xff3300;
                break;
            case 'area_poison':
                color = 0x66ff00;
                break;
            default:
                color = 0xffffff;
        }
        
        // Factory function
        const factory = () => {
            // Create area effect group
            const group = new THREE.Group();
            group.visible = false;
            
            // Create area effect mesh
            const mesh = new THREE.Mesh(
                new THREE.CircleGeometry(1.5, 16),
                new THREE.MeshBasicMaterial({ 
                    color: color, 
                    transparent: true, 
                    opacity: 0.4,
                    side: THREE.DoubleSide
                })
            );
            mesh.rotation.x = -Math.PI / 2; // Lay flat on ground
            mesh.position.y = 0.05; // Slightly above ground
            group.add(mesh);
            
            // Add particles for effect
            for (let i = 0; i < 12; i++) {
                const particle = new THREE.Mesh(
                    GeometryFactory.createSphereGeometry(0.1, 4, 4),
                    new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.6 })
                );
                
                // Random position within area
                const angle = Math.random() * Math.PI * 2;
                const radius = Math.random() * 1.3;
                particle.position.set(
                    Math.cos(angle) * radius,
                    Math.random() * 0.5 + 0.1,
                    Math.sin(angle) * radius
                );
                
                group.add(particle);
            }
            
            // Add to scene
            this.scene.add(group);
            
            // Add metadata
            group.userData = {
                type: effectType,
                isEffect: true,
                isArea: true,
                creationTime: Date.now()
            };
            
            return group;
        };
        
        // Reset function
        const reset = (group) => {
            group.visible = false;
            group.position.set(0, 0, 0);
            group.rotation.set(0, 0, 0);
            group.userData.creationTime = Date.now();
            
            // Reset any animations or timers
            if (group.userData.animationId) {
                cancelAnimationFrame(group.userData.animationId);
                group.userData.animationId = null;
            }
            
            // Reset all particles
            for (let i = 1; i < group.children.length; i++) {
                const particle = group.children[i];
                particle.scale.set(1, 1, 1);
                particle.material.opacity = 0.6;
            }
        };
        
        // Initial size
        const initialSize = 3;
        
        return [factory, reset, initialSize];
    }
    
    /**
     * Create a default effect pool
     * @param {string} effectType - The effect type
     * @returns {Array} - [factory, reset, initialSize]
     */
    createDefaultPool(effectType) {
        // Factory function
        const factory = () => {
            // Create effect group
            const group = new THREE.Group();
            group.visible = false;
            
            // Create simple effect mesh
            const mesh = new THREE.Mesh(
                GeometryFactory.createSphereGeometry(0.3, 8, 8),
                new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 })
            );
            group.add(mesh);
            
            // Add to scene
            this.scene.add(group);
            
            // Add metadata
            group.userData = {
                type: effectType,
                isEffect: true,
                creationTime: Date.now()
            };
            
            return group;
        };
        
        // Reset function
        const reset = (group) => {
            group.visible = false;
            group.position.set(0, 0, 0);
            group.rotation.set(0, 0, 0);
            group.userData.creationTime = Date.now();
            
            // Reset any animations or timers
            if (group.userData.animationId) {
                cancelAnimationFrame(group.userData.animationId);
                group.userData.animationId = null;
            }
        };
        
        // Initial size
        const initialSize = 3;
        
        return [factory, reset, initialSize];
    }
    
    /**
     * Get an effect from the pool
     * @param {string} effectType - The effect type
     * @param {Object} config - Configuration for the effect (optional)
     * @returns {THREE.Group} - The effect from the pool
     */
    get(effectType, config = {}) {
        // If pool doesn't exist for this type, create it
        if (!this.pools[effectType]) {
            this.initializePool(effectType);
        }
        
        // Get effect from pool - activeObjects tracking is now handled by the pool
        const effect = this.pools[effectType].get();
        
        // Apply configuration
        if (config.position) {
            effect.position.copy(config.position);
            
            // FIXED: Round position to nearest 0.1 unit to prevent shadow jittering
            // This is critical for stable shadows that align with objects
            if (this.shadowsEnabled && config.snapShadowPosition !== false) {
                effect.position.x = Math.round(effect.position.x * 10) / 10;
                effect.position.y = Math.round(effect.position.y * 10) / 10;
                effect.position.z = Math.round(effect.position.z * 10) / 10;
            }
        }
        
        if (config.rotation) {
            effect.rotation.copy(config.rotation);
        }
        
        if (config.scale) {
            if (typeof config.scale === 'number') {
                effect.scale.set(config.scale, config.scale, config.scale);
            } else {
                effect.scale.copy(config.scale);
            }
        }
        
        // Apply shadow settings based on current configuration
        this.applyShadowSettings(effect, config);
        
        // Make visible
        effect.visible = true;
        
        // Set up auto-release if duration is specified
        if (config.duration) {
            // Store the timeout ID so we can clear it if needed
            effect.userData.releaseTimeoutId = setTimeout(() => {
                this.release(effectType, effect);
            }, config.duration);
        }
        
        return effect;
    }
    
    /**
     * Apply shadow settings to an effect
     * @param {THREE.Group} effect - The effect to apply settings to
     * @param {Object} config - Configuration for the effect
     */
    applyShadowSettings(effect, config = {}) {
        // Skip if shadows are disabled globally
        if (!this.shadowsEnabled || this.shadowQuality === 'none') {
            this.disableShadowsForEffect(effect);
            return;
        }
        
        // Allow per-effect shadow override
        const castShadow = config.castShadow !== undefined ? config.castShadow : true;
        
        // Apply shadow settings to all meshes in the effect
        effect.traverse(object => {
            if (object.isMesh) {
                // Only opaque objects cast shadows for performance
                const isTransparent = object.material && object.material.transparent;
                
                // Set shadow properties
                object.castShadow = castShadow && !isTransparent;
                object.receiveShadow = false; // Effects typically don't receive shadows
                
                // Optimize shadow rendering for small objects
                if (object.castShadow && this.shadowQuality !== 'high') {
                    // Skip shadow casting for very small objects
                    const boundingBox = new THREE.Box3().setFromObject(object);
                    const size = boundingBox.getSize(new THREE.Vector3());
                    const maxDimension = Math.max(size.x, size.y, size.z);
                    
                    if (maxDimension < 0.1) {
                        object.castShadow = false;
                    }
                }
            }
        });
    }
    
    /**
     * Disable shadows for an effect
     * @param {THREE.Group} effect - The effect to disable shadows for
     */
    disableShadowsForEffect(effect) {
        effect.traverse(object => {
            if (object.isMesh) {
                object.castShadow = false;
                object.receiveShadow = false;
            }
        });
    }
    
    /**
     * Return an effect to the pool
     * @param {string} effectType - The effect type
     * @param {THREE.Group} effect - The effect to return to the pool
     */
    release(effectType, effect) {
        // If pool doesn't exist for this type, create it
        if (!this.pools[effectType]) {
            this.initializePool(effectType);
        }
        
        // Clear any pending release timeout
        if (effect.userData && effect.userData.releaseTimeoutId) {
            clearTimeout(effect.userData.releaseTimeoutId);
            effect.userData.releaseTimeoutId = null;
        }
        
        // Return to pool - activeObjects tracking is now handled by the pool
        this.pools[effectType].release(effect);
    }
    
    /**
     * Get statistics about the pool usage
     * @returns {Object} - Pool statistics
     */
    getStats() {
        const stats = {
            active: { ...this.activeEffects },
            poolSizes: {}
        };
        
        // Get pool sizes
        for (const poolKey in this.pools) {
            stats.poolSizes[poolKey] = this.pools[poolKey].size();
        }
        
        return stats;
    }
    
    /**
     * Clear all pools or a specific pool
     * @param {string} effectType - The effect type (optional)
     */
    clear(effectType) {
        if (effectType && this.pools[effectType]) {
            const pool = this.pools[effectType];
            
            // First, release all active objects
            const activeObjects = [...pool.activeObjects]; // Create a copy to avoid modification during iteration
            activeObjects.forEach(object => {
                // Clear any pending timeouts
                if (object.userData && object.userData.releaseTimeoutId) {
                    clearTimeout(object.userData.releaseTimeoutId);
                    object.userData.releaseTimeoutId = null;
                }
                
                // Make invisible
                object.visible = false;
                
                // Return to pool
                pool.release(object);
            });
            
            // Now get all objects from the pool and remove from scene
            const objects = [];
            while (pool.size() > 0) {
                objects.push(pool.get());
            }
            
            // Remove all objects from the scene
            objects.forEach(object => {
                if (object.parent) {
                    this.scene.remove(object);
                }
                
                // Dispose of geometries and materials to prevent memory leaks
                if (object.children) {
                    object.children.forEach(child => {
                        if (child.geometry) {
                            child.geometry.dispose();
                        }
                        if (child.material) {
                            if (Array.isArray(child.material)) {
                                child.material.forEach(mat => {
                                    if (mat.map) mat.map.dispose();
                                    mat.dispose();
                                });
                            } else {
                                if (child.material.map) child.material.map.dispose();
                                child.material.dispose();
                            }
                        }
                    });
                }
            });
            
            // Clear the pool
            pool.clear();
            
            // Reset active effect count
            this.activeEffects[effectType] = 0;
        } else if (!effectType) {
            // Clear all pools
            for (const poolKey in this.pools) {
                this.clear(poolKey);
            }
            
            // Reset total active count
            this.activeEffectCount = 0;
        }
    }
    
    /**
     * Update shadow settings for all active effects
     * This should be called when shadow settings change
     */
    updateAllShadowSettings() {
        // Update all active effects in all pools
        for (const effectType in this.pools) {
            const pool = this.pools[effectType];
            
            // Use the new applyToActive method to update all active objects
            pool.applyToActive(obj => {
                this.applyShadowSettings(obj);
            });
        }
        
        console.debug(`Updated shadow settings for effect pools. Shadows enabled: ${this.shadowsEnabled}, Quality: ${this.shadowQuality}`);
    }
    
    /**
     * Update all effects in the scene
     * @param {number} deltaTime - Time since last update
     */
    update(deltaTime) {
        // Performance monitoring
        const now = Date.now();
        if (now - this.lastUpdateTime > this.updateInterval) {
            this.lastUpdateTime = now;
            
            // Calculate total active effects
            let totalActive = 0;
            for (const effectType in this.pools) {
                const pool = this.pools[effectType];
                const activeCount = pool.activeCount();
                this.activeEffects[effectType] = activeCount;
                totalActive += activeCount;
            }
            
            this.activeEffectCount = totalActive;
            
            // Log active effect count if it's high
            if (this.activeEffectCount > 100) {
                console.warn(`High effect count: ${this.activeEffectCount} active effects`);
                this.cleanupOldEffects();
            }
        }
    }
    
    /**
     * Clean up effects that might have been forgotten
     * This helps prevent memory leaks during movement
     */
    cleanupOldEffects() {
        const now = Date.now();
        const maxAge = 10000; // 10 seconds max lifetime for effects
        
        for (const effectType in this.pools) {
            const pool = this.pools[effectType];
            
            // Apply cleanup to all active objects
            pool.applyToActive(effect => {
                // Check if effect has been active too long
                if (effect.userData && effect.userData.creationTime) {
                    const age = now - effect.userData.creationTime;
                    if (age > maxAge) {
                        console.debug(`Cleaning up old ${effectType} effect (age: ${age}ms)`);
                        this.release(effectType, effect);
                    }
                }
            });
        }
    }
}