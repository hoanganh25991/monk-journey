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
     * Create a level up effect in the 3D scene
     * @param {number} level - The new level
     * @param {Object} position - 3D position {x, y, z}, defaults to player position if not provided
     * @returns {Object|null} - The created level up effect or null if creation failed
     */
    createLevelUpEffect(level, position = null) {
        // Use player position if no position is provided
        if (!position && this.game && this.game.player) {
            position = this.game.player.model.getPosition();
        }
        
        // If still no position, use a default
        if (!position) {
            position = new THREE.Vector3(0, 1, 0);
        }
        
        // Create a group to hold all level up effect elements
        const group = new THREE.Group();
        
        // Create sprites for "LEVEL UP" text
        // Main sprite for "LEVEL"
        const levelSprite = new THREE.Sprite(
            new THREE.SpriteMaterial({
                color: 0xffcc00,
                transparent: true,
                opacity: 0.8
            })
        );
        levelSprite.scale.set(2, 0.7, 1);
        levelSprite.position.set(-0.8, 2, 0);
        group.add(levelSprite);
        
        // Sprite for level number
        const numberSprite = new THREE.Sprite(
            new THREE.SpriteMaterial({
                color: 0xffcc00,
                transparent: true,
                opacity: 0.8
            })
        );
        numberSprite.scale.set(1, 1, 1);
        numberSprite.position.set(0.8, 2, 0);
        group.add(numberSprite);
        
        // Create a ring effect
        const ringGeometry = new THREE.RingGeometry(1.5, 2, 32);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0xffcc00,
            transparent: true,
            opacity: 0.7,
            side: THREE.DoubleSide
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = Math.PI / 2; // Lay flat
        ring.position.y = 0.1; // Just above ground
        group.add(ring);
        
        // Create particles for the effect
        const particleCount = 50;
        const particleGeometry = new THREE.BufferGeometry();
        const particleMaterial = new THREE.PointsMaterial({
            color: 0xffcc00,
            size: 0.1,
            transparent: true,
            opacity: 0.8
        });
        
        // Create particle positions
        const positions = new Float32Array(particleCount * 3);
        const velocities = [];
        
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            // Start particles in a circle around the center
            const angle = Math.random() * Math.PI * 2;
            const radius = 0.5 + Math.random() * 1.0;
            
            positions[i3] = Math.cos(angle) * radius;     // x
            positions[i3 + 1] = 0.1;                      // y - start near ground
            positions[i3 + 2] = Math.sin(angle) * radius; // z
            
            // Store velocity for animation
            velocities.push({
                x: positions[i3] * 0.2,
                y: 0.5 + Math.random() * 1.0,
                z: positions[i3 + 2] * 0.2
            });
        }
        
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const particles = new THREE.Points(particleGeometry, particleMaterial);
        group.add(particles);
        
        // Position the group
        group.position.copy(position);
        
        // Create a custom effect object
        const levelUpEffect = {
            type: 'levelUp',
            group: group,
            isActive: true,
            isPaused: false,
            duration: 2.0, // 2 seconds duration
            elapsedTime: 0,
            level: level,
            levelSprite: levelSprite,
            numberSprite: numberSprite,
            ring: ring,
            particles: particles,
            particlePositions: positions,
            particleVelocities: velocities,
            
            // Update method for the level up effect
            update: function(delta) {
                // Update elapsed time
                this.elapsedTime += delta;
                
                // Animation based on elapsed time
                const progress = this.elapsedTime / this.duration;
                const fadeInOut = progress < 0.3 ? progress / 0.3 : 
                                 progress > 0.7 ? (1 - progress) / 0.3 : 
                                 1.0;
                
                // Update ring
                const ringScale = 1 + progress * 2;
                this.ring.scale.set(ringScale, ringScale, ringScale);
                ringMaterial.opacity = 0.7 * (1 - progress);
                
                // Update particles
                const positions = this.particlePositions;
                for (let i = 0; i < this.particleVelocities.length; i++) {
                    const i3 = i * 3;
                    const vel = this.particleVelocities[i];
                    
                    // Move particles upward and outward
                    positions[i3] += vel.x * delta;     // x
                    positions[i3 + 1] += vel.y * delta; // y
                    positions[i3 + 2] += vel.z * delta; // z
                }
                this.particles.geometry.attributes.position.needsUpdate = true;
                
                // Fade out particles
                this.particles.material.opacity = 0.8 * (1 - progress);
                
                // Update sprites
                this.levelSprite.material.opacity = fadeInOut;
                this.numberSprite.material.opacity = fadeInOut;
                
                // Float upward
                const floatY = 2 + progress * 0.5;
                this.levelSprite.position.y = floatY;
                this.numberSprite.position.y = floatY;
                
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
                
                // Dispose geometries and materials
                if (this.textMesh) {
                    this.textMesh.geometry.dispose();
                    this.textMesh.material.dispose();
                }
                
                this.tempSprite.material.dispose();
                this.ring.geometry.dispose();
                this.ring.material.dispose();
                this.particles.geometry.dispose();
                this.particles.material.dispose();
            }
        };
        
        // Try to load the font for better text (non-blocking)
        try {
            fontLoader.load('/assets/fonts/helvetiker_bold.typeface.json', (font) => {
                // If the effect is still active, replace the sprite with actual text
                if (levelUpEffect.isActive) {
                    // Create text for "LEVEL"
                    const levelTextGeo = new THREE.TextGeometry('LEVEL ' + level, {
                        font: font,
                        size: 0.3,
                        height: 0.05,
                        curveSegments: 12,
                        bevelEnabled: false
                    });
                    
                    levelTextGeo.computeBoundingBox();
                    const textWidth = levelTextGeo.boundingBox.max.x - levelTextGeo.boundingBox.min.x;
                    
                    const textMesh = new THREE.Mesh(levelTextGeo, textMaterial);
                    textMesh.position.set(-textWidth/2, 2, 0); // Center text
                    
                    // Remove the temporary sprite
                    group.remove(tempSprite);
                    
                    // Add the text mesh
                    group.add(textMesh);
                    levelUpEffect.textMesh = textMesh;
                }
            });
        } catch (error) {
            console.warn("Could not load font for level up effect:", error);
            // Continue with sprite as fallback
        }
        
        // Add the level up effect to the scene
        if (this.game && this.game.scene) {
            this.game.scene.add(group);
            
            // Add to the effects array for updates
            this.effects.push(levelUpEffect);
            
            // Play level up sound
            if (this.game.audioManager) {
                this.game.audioManager.playSound('levelUp');
            }
            
            return levelUpEffect;
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