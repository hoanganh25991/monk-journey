import * as THREE from 'three';
import { BleedingEffect } from './entities/skills/BleedingEffect.js';
import { SkillEffectFactory } from './entities/skills/SkillEffectFactory.js';

/**
 * EffectsManager
 * Manages all visual effects in the game
 */
export class EffectsManager {
    /**
     * Create a new EffectsManager
     * @param {Object} game - Reference to the game instance
     */
    constructor(game) {
        this.game = game;
        this.effects = [];
    }
    
    /**
     * Initialize the EffectsManager
     * @returns {Promise<boolean>} - Promise that resolves when initialization is complete
     */
    async init() {
        console.debug("Initializing EffectsManager...");
        
        try {
            // Preload skill effect models and resources
            await SkillEffectFactory.initialize();
            console.debug("SkillEffectFactory initialized successfully");
            
            return true;
        } catch (error) {
            console.error("Error initializing EffectsManager:", error);
            // Continue even if preloading fails - effects will use fallbacks
            return true;
        }
    }
    
    /**
     * Update all effects
     * @param {number} delta - Time since last update in seconds
     */
    update(delta) {
        // Skip updates if game is paused
        if (this.game && this.game.isPaused) {
            return;
        }
        
        // Update and remove inactive effects
        for (let i = this.effects.length - 1; i >= 0; i--) {
            const effect = this.effects[i];
            
            // Skip paused effects
            if (effect.isPaused) {
                continue;
            }
            
            // Update the effect
            effect.update(delta);
            
            // Remove inactive effects
            if (!effect.isActive) {
                effect.dispose();
                this.effects.splice(i, 1);
            }
        }
    }
    
    /**
     * Create a bleeding effect at the given position
     * @param {number} amount - Damage amount
     * @param {Object} position - 3D position {x, y, z}
     * @param {boolean} isPlayerDamage - Whether the damage was caused to the player (true) or by the player (false)
     * @returns {BleedingEffect|null} - The created bleeding effect or null if creation failed
     */
    createBleedingEffect(amount, position, isPlayerDamage = false) {
        // Create a new bleeding effect
        const bleedingEffect = new BleedingEffect({
            amount: amount,
            duration: 1.5, // 1.5 seconds duration
            isPlayerDamage: isPlayerDamage
        });
        
        // Create the effect at the specified position
        const effectGroup = bleedingEffect.create(position, new THREE.Vector3(0, 1, 0));
        
        // Add the effect to the scene
        if (this.game && this.game.scene) {
            this.game.scene.add(effectGroup);
            
            // Add to the effects array for updates
            this.effects.push(bleedingEffect);
            
            return bleedingEffect;
        }
        
        return null;
    }
    
    /**
     * Pause all active effects
     * Used when the game is paused
     */
    pause() {
        console.debug(`Pausing ${this.effects.length} effects`);
        
        for (const effect of this.effects) {
            // Set a paused flag on the effect
            effect.isPaused = true;
            
            // Pause any animations or particle systems
            if (effect.particleSystem) {
                effect.particleSystem.pause();
            }
            
            // Pause any animation mixers
            if (effect.mixer) {
                effect.mixer.timeScale = 0;
            }
        }
    }
    
    /**
     * Resume all paused effects
     * Used when the game is resumed
     */
    resume() {
        console.debug(`Resuming ${this.effects.length} effects`);
        
        for (const effect of this.effects) {
            // Clear the paused flag
            effect.isPaused = false;
            
            // Resume any animations or particle systems
            if (effect.particleSystem) {
                effect.particleSystem.play();
            }
            
            // Resume any animation mixers
            if (effect.mixer) {
                effect.mixer.timeScale = 1;
            }
        }
    }
    
    /**
     * Create a shield effect around the player to indicate invulnerability
     * @param {Object} position - 3D position {x, y, z}
     * @returns {Object|null} - The created shield effect or null if creation failed
     */
    createShieldEffect(position) {
        // Check if shield effect already exists
        const existingShield = this.effects.find(effect => effect.type === 'shield');
        if (existingShield) {
            // Update position of existing shield
            if (existingShield.group) {
                existingShield.group.position.copy(position);
            }
            return existingShield;
        }
        
        // Create a shield effect using a simple sphere with transparent material
        const geometry = new THREE.SphereGeometry(1.2, 16, 16);
        const material = new THREE.MeshBasicMaterial({
            color: 0x3399ff,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
        });
        
        const sphere = new THREE.Mesh(geometry, material);
        const group = new THREE.Group();
        group.add(sphere);
        
        // Position the shield
        group.position.copy(position);
        
        // Create a custom effect object
        const shieldEffect = {
            type: 'shield',
            group: group,
            isActive: true,
            isPaused: false,
            duration: 3.0, // 3 seconds duration
            elapsedTime: 0,
            
            // Update method for the shield effect
            update: function(delta) {
                // Update elapsed time
                this.elapsedTime += delta;
                
                // Pulse the shield
                const scale = 1.0 + 0.1 * Math.sin(this.elapsedTime * 5);
                sphere.scale.set(scale, scale, scale);
                
                // Rotate the shield
                sphere.rotation.y += delta * 0.5;
                sphere.rotation.x += delta * 0.3;
                
                // Pulse opacity
                material.opacity = 0.3 + 0.1 * Math.sin(this.elapsedTime * 3);
                
                // Check if effect has expired
                if (this.elapsedTime >= this.duration) {
                    this.isActive = false;
                }
            },
            
            // Dispose method to clean up resources
            dispose: function() {
                if (this.group && this.group.parent) {
                    this.group.parent.remove(this.group);
                }
                geometry.dispose();
                material.dispose();
            }
        };
        
        // Add the shield to the scene
        if (this.game && this.game.scene) {
            this.game.scene.add(group);
            
            // Add to the effects array for updates
            this.effects.push(shieldEffect);
            
            return shieldEffect;
        }
        
        return null;
    }
    
    /**
     * Remove the shield effect
     */
    removeShieldEffect() {
        // Find the shield effect
        const shieldIndex = this.effects.findIndex(effect => effect.type === 'shield');
        
        if (shieldIndex >= 0) {
            // Get the shield effect
            const shieldEffect = this.effects[shieldIndex];
            
            // Dispose the effect
            shieldEffect.dispose();
            
            // Remove from the effects array
            this.effects.splice(shieldIndex, 1);
        }
    }
    
    /**
     * Create a defense boost effect around the player
     * @param {Object} position - 3D position {x, y, z}
     * @returns {Object|null} - The created defense boost effect or null if creation failed
     */
    createDefenseBoostEffect(position) {
        // Check if defense boost effect already exists
        const existingEffect = this.effects.find(effect => effect.type === 'defenseBoost');
        if (existingEffect) {
            // Update position of existing effect
            if (existingEffect.group) {
                existingEffect.group.position.copy(position);
            }
            return existingEffect;
        }
        
        // Create a defense boost effect using a simple sphere with transparent material
        const geometry = new THREE.SphereGeometry(1.2, 16, 16);
        const material = new THREE.MeshBasicMaterial({
            color: 0xffaa00, // Orange-yellow color for defense boost
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
        });
        
        const sphere = new THREE.Mesh(geometry, material);
        const group = new THREE.Group();
        group.add(sphere);
        
        // Position the effect
        group.position.copy(position);
        
        // Create a custom effect object
        const defenseBoostEffect = {
            type: 'defenseBoost',
            group: group,
            isActive: true,
            isPaused: false,
            duration: 3.0, // 3 seconds duration
            elapsedTime: 0,
            
            // Update method for the defense boost effect
            update: function(delta) {
                // Update elapsed time
                this.elapsedTime += delta;
                
                // Pulse the effect
                const scale = 1.0 + 0.1 * Math.sin(this.elapsedTime * 5);
                sphere.scale.set(scale, scale, scale);
                
                // Rotate the effect
                sphere.rotation.y += delta * 0.5;
                sphere.rotation.x += delta * 0.3;
                
                // Pulse opacity
                material.opacity = 0.3 + 0.1 * Math.sin(this.elapsedTime * 3);
                
                // Check if effect has expired
                if (this.elapsedTime >= this.duration) {
                    this.isActive = false;
                }
            },
            
            // Dispose method to clean up resources
            dispose: function() {
                if (this.group && this.group.parent) {
                    this.group.parent.remove(this.group);
                }
                geometry.dispose();
                material.dispose();
            }
        };
        
        // Add the effect to the scene
        if (this.game && this.game.scene) {
            this.game.scene.add(group);
            
            // Add to the effects array for updates
            this.effects.push(defenseBoostEffect);
            
            return defenseBoostEffect;
        }
        
        return null;
    }
    
    /**
     * Remove the defense boost effect
     */
    removeDefenseBoostEffect() {
        // Find the defense boost effect
        const effectIndex = this.effects.findIndex(effect => effect.type === 'defenseBoost');
        
        if (effectIndex >= 0) {
            // Get the effect
            const effect = this.effects[effectIndex];
            
            // Dispose the effect
            effect.dispose();
            
            // Remove from the effects array
            this.effects.splice(effectIndex, 1);
        }
    }
    
    /**
     * Create a freeze effect around the player
     * @param {Object} position - 3D position {x, y, z}
     * @returns {Object|null} - The created freeze effect or null if creation failed
     */
    createFreezeEffect(position) {
        // Check if freeze effect already exists
        const existingEffect = this.effects.find(effect => effect.type === 'freeze');
        if (existingEffect) {
            // Update position of existing effect
            if (existingEffect.group) {
                existingEffect.group.position.copy(position);
            }
            return existingEffect;
        }
        
        // Create a freeze effect using ice-like crystals around the player
        const group = new THREE.Group();
        
        // Create multiple ice crystal shapes
        const crystalGeometry = new THREE.ConeGeometry(0.1, 0.4, 6);
        const iceMaterial = new THREE.MeshBasicMaterial({
            color: 0x88ccff, // Light blue ice color
            transparent: true,
            opacity: 0.7,
            side: THREE.DoubleSide
        });
        
        // Create several ice crystals around the player
        for (let i = 0; i < 8; i++) {
            const crystal = new THREE.Mesh(crystalGeometry, iceMaterial);
            
            // Position crystals in a circle around the player
            const angle = (i / 8) * Math.PI * 2;
            const radius = 1.0;
            crystal.position.x = Math.cos(angle) * radius;
            crystal.position.z = Math.sin(angle) * radius;
            crystal.position.y = Math.random() * 0.5; // Random height variation
            
            // Random rotation for each crystal
            crystal.rotation.x = Math.random() * Math.PI;
            crystal.rotation.z = Math.random() * Math.PI;
            
            group.add(crystal);
        }
        
        // Add a central ice sphere
        const sphereGeometry = new THREE.SphereGeometry(1.1, 16, 16);
        const sphereMaterial = new THREE.MeshBasicMaterial({
            color: 0xaaddff, // Lighter blue for the sphere
            transparent: true,
            opacity: 0.2,
            side: THREE.DoubleSide
        });
        
        const iceSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        group.add(iceSphere);
        
        // Position the effect
        group.position.copy(position);
        
        // Create a custom effect object
        const freezeEffect = {
            type: 'freeze',
            group: group,
            isActive: true,
            isPaused: false,
            duration: 3.0, // 3 seconds duration
            elapsedTime: 0,
            crystals: group.children.filter(child => child.geometry === crystalGeometry),
            iceSphere: iceSphere,
            
            // Update method for the freeze effect
            update: function(delta) {
                // Update elapsed time
                this.elapsedTime += delta;
                
                // Rotate the ice crystals
                this.crystals.forEach((crystal, index) => {
                    crystal.rotation.y += delta * (0.5 + index * 0.1);
                    crystal.position.y = 0.2 + 0.1 * Math.sin(this.elapsedTime * 2 + index);
                });
                
                // Pulse the ice sphere
                const scale = 1.0 + 0.05 * Math.sin(this.elapsedTime * 4);
                this.iceSphere.scale.set(scale, scale, scale);
                
                // Pulse opacity of the sphere
                sphereMaterial.opacity = 0.2 + 0.1 * Math.sin(this.elapsedTime * 3);
                
                // Check if effect has expired
                if (this.elapsedTime >= this.duration) {
                    this.isActive = false;
                }
            },
            
            // Dispose method to clean up resources
            dispose: function() {
                if (this.group && this.group.parent) {
                    this.group.parent.remove(this.group);
                }
                crystalGeometry.dispose();
                iceMaterial.dispose();
                sphereGeometry.dispose();
                sphereMaterial.dispose();
            }
        };
        
        // Add the effect to the scene
        if (this.game && this.game.scene) {
            this.game.scene.add(group);
            
            // Add to the effects array for updates
            this.effects.push(freezeEffect);
            
            return freezeEffect;
        }
        
        return null;
    }
    
    /**
     * Remove the freeze effect
     */
    removeFreezeEffect() {
        // Find the freeze effect
        const effectIndex = this.effects.findIndex(effect => effect.type === 'freeze');
        
        if (effectIndex >= 0) {
            // Get the effect
            const effect = this.effects[effectIndex];
            
            // Dispose the effect
            effect.dispose();
            
            // Remove from the effects array
            this.effects.splice(effectIndex, 1);
        }
    }
    
    /**
     * Get all active effects
     * @returns {Array} - Array of active effects
     */
    getActiveEffects() {
        return this.effects;
    }
    
    /**
     * Clean up all effects
     * Should be called when changing scenes or shutting down the game
     */
    cleanupEffects() {
        // Clean up Three.js effects
        for (const effect of this.effects) {
            effect.dispose();
        }
        this.effects = [];
        
        // Clean up shared resources
        if (typeof BleedingEffect.cleanupSharedResources === 'function') {
            BleedingEffect.cleanupSharedResources();
        }
        
        // Force a garbage collection hint
        if (window.gc) {
            try {
                window.gc();
                console.debug("Manual garbage collection triggered after effects cleanup");
            } catch (e) {
                // Ignore if not available
            }
        }
    }
}