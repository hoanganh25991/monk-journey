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
     * Create a countdown effect in the 3D scene
     * @param {number} countdownStart - Starting countdown number (e.g., 3)
     * @param {function} onComplete - Callback when countdown reaches 0
     * @param {Object} position - 3D position {x, y, z}, defaults to player position if not provided
     * @returns {Object|null} - The created countdown effect or null if creation failed
     */
    createCountdownEffect(countdownStart = 3, onComplete = null, position = null) {
        // Use player position if no position is provided
        if (!position && this.game && this.game.player) {
            position = this.game.player.model.getPosition();
        }
        
        // If still no position, use a default
        if (!position) {
            position = new THREE.Vector3(0, 1, 0);
        }
        
        // Create a group to hold all countdown effect elements
        const group = new THREE.Group();
        
        // Store countdown state
        let currentCount = countdownStart;
        let timeElapsed = 0;
        const countdownInterval = 1.0; // 1 second per count
        
        // Create a canvas-based text for the countdown
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 256;
        
        // Function to update the countdown text
        const updateCountdownText = (count) => {
            // Clear canvas
            context.clearRect(0, 0, canvas.width, canvas.height);
            
            // Set text properties
            context.font = 'bold 120px Arial';
            context.fillStyle = count <= 1 ? '#ff4444' : '#ffaa00'; // Red for 1, orange for others
            context.strokeStyle = '#000000';
            context.lineWidth = 4;
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            
            // Draw text with outline
            const text = count.toString();
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            
            context.strokeText(text, centerX, centerY);
            context.fillText(text, centerX, centerY);
        };
        
        // Initial text
        updateCountdownText(currentCount);
        
        // Create texture and material
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        
        const material = new THREE.SpriteMaterial({ 
            map: texture, 
            transparent: true,
            alphaTest: 0.1
        });
        
        // Create sprite
        const sprite = new THREE.Sprite(material);
        sprite.position.set(position.x, position.y + 2.5, position.z);
        sprite.scale.set(2, 2, 1);
        
        group.add(sprite);
        
        // Position the group
        group.position.copy(position);
        
        // Countdown effect object with update method
        const countdownEffect = {
            group: group,
            sprite: sprite,
            material: material,
            texture: texture,
            canvas: canvas,
            context: context,
            finished: false,
            timeElapsed: 0,
            currentCount: currentCount,
            countdownInterval: countdownInterval,
            onComplete: onComplete,
            game: this.game, // Store reference to game
            
            // Update method for the countdown effect
            update: function(delta) {
                if (this.finished) return false;
                
                this.timeElapsed += delta;
                
                // Check if it's time to update the countdown
                const expectedCount = Math.max(0, countdownStart - Math.floor(this.timeElapsed / this.countdownInterval));
                
                if (expectedCount !== this.currentCount) {
                    this.currentCount = expectedCount;
                    
                    if (this.currentCount > 0) {
                        // Update the countdown display
                        updateCountdownText(this.currentCount);
                        this.texture.needsUpdate = true;
                        
                        // Add a pulse animation
                        const pulseScale = 1 + Math.sin(this.timeElapsed * 10) * 0.1;
                        this.sprite.scale.set(2 * pulseScale, 2 * pulseScale, 1);
                        
                        // Play countdown sound (if available)
                        if (this.game && this.game.audioManager) {
                            this.game.audioManager.playSound('click'); // or another appropriate sound
                        }
                    } else {
                        // Countdown finished
                        this.finished = true;
                        
                        // Call completion callback
                        if (this.onComplete) {
                            this.onComplete();
                        }
                        
                        // Start fade out animation
                        let fadeTime = 0;
                        const fadeOutDuration = 0.5;
                        const fadeOut = () => {
                            fadeTime += 0.016; // Approximate 60fps
                            const alpha = Math.max(0, 1 - (fadeTime / fadeOutDuration));
                            this.material.opacity = alpha;
                            
                            if (alpha > 0) {
                                requestAnimationFrame(fadeOut);
                            }
                        };
                        fadeOut();
                        
                        return false; // Remove this effect
                    }
                }
                
                return true; // Continue updating
            },
            
            // Cleanup method
            dispose: function() {
                if (this.texture) {
                    this.texture.dispose();
                }
                if (this.material) {
                    this.material.dispose();
                }
            }
        };
        
        // Add the countdown effect to the scene
        if (this.game && this.game.scene) {
            this.game.scene.add(group);
            
            // Add to the effects array for updates
            this.effects.push(countdownEffect);
            
            return countdownEffect;
        }
        
        return null;
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