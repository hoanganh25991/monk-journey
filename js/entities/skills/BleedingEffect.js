import * as THREE from 'three';
import { SkillEffect } from './SkillEffect.js';

/**
 * Specialized effect for bleeding/damage visualization
 * Replaces the DOM-based implementation with a Three.js implementation
 */
export class BleedingEffect extends SkillEffect {
    /**
     * Create a new BleedingEffect
     * @param {Object} config - Configuration object
     */
    constructor(config) {
        // Create a temporary skill object to pass to the parent constructor
        const tempSkill = {
            color: 0xff0000, // Default red color for blood
            duration: config.duration || 1.0, // Default duration of 1.5 seconds
            position: new THREE.Vector3(),
            damage: config.amount || 0
        };
        
        super(tempSkill);
        
        // Store additional configuration
        this.amount = config.amount || 0;
        this.isPlayerDamage = config.isPlayerDamage || false;
        this.particleCount = this.calculateParticleCount(this.amount);
        this.baseColor = this.calculateColor(this.amount);
        this.particles = [];
    }
    
    /**
     * Calculate the number of particles based on damage amount
     * @param {number} amount - Damage amount
     * @returns {number} - Number of particles to create
     * @private
     */
    calculateParticleCount(amount) {
        // Get performance manager if available to adjust particle count based on quality
        let performanceMultiplier = 1.0;
        if (this.skill.game && this.skill.game.performanceManager) {
            performanceMultiplier = this.skill.game.performanceManager.getParticleMultiplier();
        }
        
        const minParticles = 2;
        const maxParticles = 10; // Reduced from 15 to 10 for better performance
        
        // Calculate base particle count and apply performance multiplier
        const baseCount = Math.min(maxParticles, minParticles + Math.floor(amount / 15)); // Reduced particle density
        return Math.max(minParticles, Math.floor(baseCount * performanceMultiplier));
    }
    
    /**
     * Calculate the color based on damage amount
     * @param {number} amount - Damage amount
     * @returns {THREE.Color} - Color for the particles
     * @private
     */
    calculateColor(amount) {
        let color;
        if (amount < 10) {
            color = new THREE.Color(0x780000); // Dark red for low damage
        } else if (amount < 30) {
            color = new THREE.Color(0xb40000); // Medium red
        } else if (amount < 50) {
            color = new THREE.Color(0xdc0000); // Bright red
        } else {
            color = new THREE.Color(0xff1e1e); // Intense red with slight glow for high damage
        }
        return color;
    }
    
    /**
     * Create the bleeding effect
     * @param {THREE.Vector3} position - Position to create the effect at
     * @param {THREE.Vector3} direction - Direction is not used for this effect but required by interface
     * @returns {THREE.Group} - The created effect
     */
    create(position, direction) {
        position.y -= 2.04;
        // Create a group to hold all particles
        const effectGroup = new THREE.Group();
        
        // Position the effect
        effectGroup.position.copy(position);
        effectGroup.position.y += 1; // Raise slightly above the target
        
        // Create blood particles
        for (let i = 0; i < this.particleCount; i++) {
            // Create particle
            const particle = this.createParticle(i);
            effectGroup.add(particle);
            this.particles.push(particle);
        }
        
        // Create a flash effect for high damage
        if (this.amount > 100) {
            const flash = this.createFlashEffect();
            effectGroup.add(flash);
        }
        
        // Store the effect
        this.effect = effectGroup;
        this.isActive = true;
        
        return effectGroup;
    }
    
    // Static geometry for particle reuse
    static particleGeometry = null;
    
    /**
     * Create a single blood particle
     * @param {number} index - Particle index
     * @returns {THREE.Mesh} - The created particle
     * @private
     */
    createParticle(index) {
        // Randomize particle size based on damage
        const minSize = 0.03 * 5;
        const maxSize = 0.06 * 5 + (this.amount / 3000); // Reduced max size for better performance
        const size = minSize + Math.random() * (maxSize - minSize);
        
        // Create or reuse geometry
        if (!BleedingEffect.particleGeometry) {
            // Use lower polygon count (6,6 instead of 8,8)
            BleedingEffect.particleGeometry = new THREE.SphereGeometry(1, 6, 6);
        }
        
        // Randomize particle color slightly
        const colorVariation = 0.05; // Reduced from 0.1 for more consistent appearance
        const color = this.baseColor.clone();
        color.r = Math.max(0, Math.min(1, color.r + (Math.random() * colorVariation - colorVariation/2)));
        color.g = Math.max(0, Math.min(1, color.g + (Math.random() * colorVariation - colorVariation/2)));
        color.b = Math.max(0, Math.min(1, color.b + (Math.random() * colorVariation - colorVariation/2)));
        
        const material = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.8,
            depthWrite: false // Improve performance by not writing to depth buffer
        });
        
        // Create mesh with shared geometry
        const particle = new THREE.Mesh(BleedingEffect.particleGeometry, material);
        particle.scale.set(size, size, size); // Scale instead of creating new geometry
        
        // Randomize initial position with reduced spread
        const spread = 0.2 + (this.amount / 800); // Reduced spread for more focused effect
        particle.position.set(
            (Math.random() * spread * 2) - spread,
            (Math.random() * spread * 2) - spread,
            (Math.random() * spread * 2) - spread
        );
        
        // Store initial values and movement data for animation
        particle.userData = {
            velocity: new THREE.Vector3(
                (Math.random() - 0.5) * 1.5, // Reduced velocity range
                Math.random() * 1.5,         // Reduced upward velocity
                (Math.random() - 0.5) * 1.5  // Reduced velocity range
            ).normalize().multiplyScalar(0.4 + Math.random() * 1.2), // Reduced overall velocity
            gravity: 0.15 + Math.random() * 0.2, // Reduced gravity for slower fall
            lifetime: 0,
            maxLifetime: 0.4 + Math.random() * 0.6 // Shorter lifetime for better performance
        };
        
        return particle;
    }
    
    /**
     * Create a flash effect for high damage
     * @returns {THREE.Mesh} - The created flash effect
     * @private
     */
    createFlashEffect() {
        const geometry = new THREE.SphereGeometry(0.5, 16, 16);
        const material = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.3
        });
        
        const flash = new THREE.Mesh(geometry, material);
        
        // Store animation data
        flash.userData = {
            initialScale: 1,
            lifetime: 0,
            maxLifetime: 0.5
        };
        
        return flash;
    }
    
    /**
     * Update the bleeding effect
     * @param {number} delta - Time since last update in seconds
     */
    update(delta) {
        if (!this.isActive || !this.effect) return;
        
        this.elapsedTime += delta;
        
        // Check if effect has expired
        if (this.elapsedTime >= this.skill.duration) {
            this.isActive = false;
            return;
        }
        
        // Limit update frequency for better performance
        // Only update every other frame for low damage effects
        if (this.amount < 20 && this.elapsedTime % 0.033 < 0.016) {
            return;
        }
        
        // Update particles
        for (let i = 0; i < this.particles.length; i++) {
            const particle = this.particles[i];
            const data = particle.userData;
            
            // Update lifetime
            data.lifetime += delta;
            
            // Check if particle has exceeded its lifetime
            if (data.lifetime >= data.maxLifetime) {
                // Make particle invisible instead of updating it further
                if (particle.material) {
                    particle.material.opacity = 0;
                }
                continue;
            }
            
            // Apply velocity and gravity with optimized calculations
            particle.position.x += data.velocity.x * delta;
            particle.position.y += data.velocity.y * delta - (data.gravity * data.lifetime * delta * 8); // Reduced gravity multiplier
            particle.position.z += data.velocity.z * delta;
            
            // Fade out based on lifetime - only update opacity every few frames
            if (i % 2 === 0 || data.lifetime > data.maxLifetime * 0.7) {
                const lifeRatio = data.lifetime / data.maxLifetime;
                if (particle.material) {
                    particle.material.opacity = Math.max(0, 0.8 * (1 - lifeRatio));
                }
            }
        }
        
        // Update flash effect if it exists (first child of the effect group)
        const flash = this.effect.children.find(child => child.userData && child.userData.hasOwnProperty('initialScale'));
        if (flash) {
            const data = flash.userData;
            data.lifetime += delta;
            
            // Check if flash has exceeded its lifetime
            if (data.lifetime >= data.maxLifetime) {
                if (flash.material) {
                    flash.material.opacity = 0;
                }
                return;
            }
            
            // Scale up and fade out - simplified calculations
            const lifeRatio = data.lifetime / data.maxLifetime;
            const scale = data.initialScale + (lifeRatio * 2.5); // Reduced scale factor
            flash.scale.set(scale, scale, scale);
            
            if (flash.material) {
                flash.material.opacity = Math.max(0, 0.3 * (1 - lifeRatio));
            }
        }
    }
    
    /**
     * Dispose of the effect and clean up resources
     */
    dispose() {
        if (!this.effect) return;
        
        // Explicitly dispose of all particle materials
        for (let i = 0; i < this.particles.length; i++) {
            const particle = this.particles[i];
            if (particle.material) {
                particle.material.dispose();
                particle.material = null;
            }
        }
        
        // Clear particle references
        this.particles = [];
        
        // Call the parent dispose method to clean up resources
        super.dispose();
    }
    
    /**
     * Reset the effect to its initial state
     */
    reset() {
        // Explicitly dispose of all particle materials
        for (let i = 0; i < this.particles.length; i++) {
            const particle = this.particles[i];
            if (particle.material) {
                particle.material.dispose();
                particle.material = null;
            }
        }
        
        // Clear particle references
        this.particles = [];
        
        // Call the parent reset method
        super.reset();
    }
    
    /**
     * Static method to clean up shared resources
     * Should be called when the game is shutting down
     */
    static cleanupSharedResources() {
        if (BleedingEffect.particleGeometry) {
            BleedingEffect.particleGeometry.dispose();
            BleedingEffect.particleGeometry = null;
        }
    }
    
    /**
     * Create a bleeding hit effect when an enemy is hit by a skill
     * Overrides the parent createHitEffect method
     * @param {THREE.Vector3} position - Position to create the hit effect at
     */
    createHitEffect(position) {
        if (!position || !this.skill || !this.skill.game || !this.skill.game.scene) {
            console.warn('Cannot create bleeding hit effect: missing required references');
            return;
        }
        
        // Create a new bleeding effect with a smaller amount of blood
        // We use a smaller amount for skill hits to differentiate from direct damage
        const hitBleedingEffect = new BleedingEffect({
            amount: this.amount > 0 ? this.amount * 0.7 : 15, // Use 70% of original damage or default to 15
            duration: 0.8, // Shorter duration for hit effects
            isPlayerDamage: false // This is enemy damage
        });
        
        // Create the effect at the specified position
        // Adjust position slightly to avoid exact overlap with the main effect
        const adjustedPosition = position.clone();
        adjustedPosition.y += 0.2; // Raise slightly
        
        const effectGroup = hitBleedingEffect.create(adjustedPosition, new THREE.Vector3(0, 1, 0));
        
        // Add the effect to the scene
        this.skill.game.scene.add(effectGroup);
        
        // Add to the effects array for updates if we have access to the effects manager
        if (this.skill.game.effectsManager) {
            this.skill.game.effectsManager.effects.push(hitBleedingEffect);
        } else {
            // If we don't have access to the effects manager, we need to manually update and dispose
            let elapsedTime = 0;
            const duration = hitBleedingEffect.skill.duration;
            
            const updateEffect = (delta) => {
                elapsedTime += delta;
                
                // Update the effect
                hitBleedingEffect.update(delta);
                
                // Remove when animation is complete
                if (elapsedTime >= duration || !hitBleedingEffect.isActive) {
                    // Clean up
                    hitBleedingEffect.dispose();
                    return;
                }
                
                // Continue animation
                requestAnimationFrame(() => {
                    updateEffect(1/60); // Approximate delta if not provided by game loop
                });
            };
            
            // Start animation
            updateEffect(1/60);
        }
    }
}