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