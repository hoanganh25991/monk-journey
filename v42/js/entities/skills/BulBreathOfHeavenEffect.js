import * as THREE from 'three';
import { BreathOfHeavenEffect } from './BreathOfHeavenEffect.js';
import { BleedingEffect } from './BleedingEffect.js';

/**
 * Effect for the Bul Breath Of Heavn skill
 * Creates a super-powered version of Breath of Heaven that applies 5x the speed boost
 * and creates multiple visual effects to represent the continuous casting
 */
export class BulBreathOfHeavenEffect extends BreathOfHeavenEffect {
    constructor(skill) {
        super(skill);
        
        // Override the healing rate to be faster
        this.healingRate = 0.15; // Heal every 0.15 seconds (twice as fast)
        
        // Store the original Breath of Heaven properties
        this.originalSpeedBoostMultiplier = 2; // Original is 2x
        this.originalSpeedBoostDuration = 5; // Original is 5 seconds
        
        // Use the enhanced values from the skill config
        this.speedBoostMultiplier = skill.speedBoostMultiplier || 10; // 10x speed (5x the original)
        this.speedBoostDuration = skill.speedBoostDuration || 10; // 10 seconds duration
        
        // Multiple effect instances
        this.effectInstances = [];
        this.instanceCount = 5; // Create 5 instances to represent 5x casting
        
        // Particle systems for the enhanced effect
        this.particleSystems = [];
        
        // Track if speed boost has been applied
        this.hasAppliedSpeedBoost = false;
    }

    /**
     * Create the Bul Breath Of Heavn effect
     * @param {THREE.Vector3} position - Position to create the effect at
     * @param {THREE.Vector3} direction - Direction the effect should face
     * @returns {THREE.Group} - The created effect
     */
    create(position, direction) {
        // Create the main effect group
        const effectGroup = new THREE.Group();
        
        // Create the base aura (similar to Breath of Heaven but larger)
        const auraGeometry = new THREE.SphereGeometry(this.skill.radius * 1.2, 64, 64);
        const auraMaterial = new THREE.MeshBasicMaterial({
            color: this.skill.color,
            transparent: true,
            opacity: 0.4,
            side: THREE.DoubleSide,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        
        const auraMesh = new THREE.Mesh(auraGeometry, auraMaterial);
        effectGroup.add(auraMesh);
        
        // Create multiple particle systems for a more intense effect
        this.createEnhancedParticles(effectGroup);
        
        // Create multiple effect instances that orbit around the player
        this.createEffectInstances(effectGroup, position);
        
        // Position effect at the player
        effectGroup.position.copy(position);
        
        // Store effect
        this.effect = effectGroup;
        this.isActive = true;
        
        // Play sound if game reference exists
        if (this.skill.game && this.skill.game.audioManager) {
            // Play the sound multiple times with slight delay to create an echo effect
            this.skill.game.audioManager.playSound(this.skill.sounds.cast);
            
            setTimeout(() => {
                if (this.isActive && this.skill.game && this.skill.game.audioManager) {
                    this.skill.game.audioManager.playSound(this.skill.sounds.cast, 0.8);
                }
            }, 150);
            
            setTimeout(() => {
                if (this.isActive && this.skill.game && this.skill.game.audioManager) {
                    this.skill.game.audioManager.playSound(this.skill.sounds.cast, 0.6);
                }
            }, 300);
        }
        
        // Apply the enhanced movement speed boost
        this.applyEnhancedMovementSpeedBoost();
        
        return effectGroup;
    }
    
    /**
     * Create enhanced particle systems for a more intense visual effect
     * @param {THREE.Group} effectGroup - The group to add particles to
     */
    createEnhancedParticles(effectGroup) {
        // Create multiple particle systems with different colors and behaviors
        const colors = [
            0x33ff00, // Green
            0x00ffff, // Cyan
            0xffff00, // Yellow
            0xff00ff, // Magenta
            0x00ff99  // Turquoise
        ];
        
        for (let i = 0; i < colors.length; i++) {
            const particleCount = 60;
            const particleGeometry = new THREE.BufferGeometry();
            const particlePositions = new Float32Array(particleCount * 3);
            
            for (let j = 0; j < particleCount; j++) {
                // Random positions within a sphere
                const radius = Math.random() * this.skill.radius;
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.random() * Math.PI;
                
                particlePositions[j * 3] = radius * Math.sin(phi) * Math.cos(theta);
                particlePositions[j * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
                particlePositions[j * 3 + 2] = radius * Math.cos(phi);
            }
            
            particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
            
            const particleMaterial = new THREE.PointsMaterial({
                color: colors[i],
                size: 0.25,
                transparent: true,
                opacity: 0.8,
                blending: THREE.AdditiveBlending
            });
            
            const particles = new THREE.Points(particleGeometry, particleMaterial);
            effectGroup.add(particles);
            
            // Store for animation
            this.particleSystems.push({
                particles: particles,
                speed: 0.2 + (i * 0.1), // Different speeds for each system
                rotationAxis: new THREE.Vector3(
                    Math.random() - 0.5,
                    Math.random() - 0.5,
                    Math.random() - 0.5
                ).normalize(),
                rotationSpeed: 0.2 + (Math.random() * 0.3)
            });
        }
    }
    
    /**
     * Create multiple effect instances that orbit around the player
     * @param {THREE.Group} effectGroup - The main effect group
     * @param {THREE.Vector3} position - The center position
     */
    createEffectInstances(effectGroup, position) {
        for (let i = 0; i < this.instanceCount; i++) {
            // Create a smaller version of the breath effect
            const instanceGeometry = new THREE.SphereGeometry(this.skill.radius * 0.4, 32, 32);
            const instanceMaterial = new THREE.MeshBasicMaterial({
                color: 0x33ff00,
                transparent: true,
                opacity: 0.6,
                side: THREE.DoubleSide,
                depthWrite: false,
                blending: THREE.AdditiveBlending
            });
            
            const instanceMesh = new THREE.Mesh(instanceGeometry, instanceMaterial);
            
            // Create a group for this instance
            const instanceGroup = new THREE.Group();
            instanceGroup.add(instanceMesh);
            
            // Add some particles to the instance
            const particleCount = 20;
            const particleGeometry = new THREE.BufferGeometry();
            const particlePositions = new Float32Array(particleCount * 3);
            
            for (let j = 0; j < particleCount; j++) {
                // Random positions within a smaller sphere
                const radius = Math.random() * (this.skill.radius * 0.3);
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.random() * Math.PI;
                
                particlePositions[j * 3] = radius * Math.sin(phi) * Math.cos(theta);
                particlePositions[j * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
                particlePositions[j * 3 + 2] = radius * Math.cos(phi);
            }
            
            particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
            
            const particleMaterial = new THREE.PointsMaterial({
                color: 0xffffff,
                size: 0.15,
                transparent: true,
                opacity: 0.7,
                blending: THREE.AdditiveBlending
            });
            
            const particles = new THREE.Points(particleGeometry, particleMaterial);
            instanceGroup.add(particles);
            
            // Position the instance at a distance from the center
            const angle = (i / this.instanceCount) * Math.PI * 2;
            const orbitRadius = this.skill.radius * 0.8;
            
            instanceGroup.position.set(
                Math.cos(angle) * orbitRadius,
                1 + (i * 0.5), // Stagger height
                Math.sin(angle) * orbitRadius
            );
            
            // Store orbit data for animation
            instanceGroup.userData = {
                orbitAngle: angle,
                orbitRadius: orbitRadius,
                orbitSpeed: 1.5 + (i * 0.2), // Different speeds
                verticalBobSpeed: 0.5 + (i * 0.1),
                verticalBobAmount: 0.3,
                initialY: instanceGroup.position.y
            };
            
            // Add to main effect group
            effectGroup.add(instanceGroup);
            
            // Store for animation
            this.effectInstances.push(instanceGroup);
        }
    }

    /**
     * Update the Bul Breath Of Heavn effect
     * @param {number} delta - Time since last update in seconds
     */
    update(delta) {
        if (this.isActive && this.effect) {
            // Call parent update for basic functionality
            super.update(delta);
            
            // Update position to follow player
            if (this.skill.game && this.skill.game.player) {
                const player = this.skill.game.player;
                if (player && player.getPosition) {
                    const playerPosition = player.getPosition();
                    if (playerPosition) {
                        // Make the main effect follow the player
                        this.effect.position.copy(playerPosition);
                    }
                }
            }
            
            // Animate the enhanced particle systems
            this.updateParticleSystems(delta);
            
            // Animate the orbiting effect instances
            this.updateEffectInstances(delta);
            
            // Apply healing effect at intervals
            this.lastHealTime += delta;
            if (this.lastHealTime >= this.healingRate) {
                this.applyHealingEffect();
                this.lastHealTime = 0;
            }
            
            // Only fade out at the very end of the effect
            if (this.elapsedTime > this.skill.duration * 0.8) {
                const fadeRatio = 1 - (this.elapsedTime - this.skill.duration * 0.8) / (this.skill.duration * 0.2);
                this.effect.traverse(child => {
                    if (child.material && child.material.opacity !== undefined) {
                        child.material.opacity = Math.max(0, child.material.opacity * fadeRatio);
                    }
                });
            }
        }
    }
    
    /**
     * Update the enhanced particle systems
     * @param {number} delta - Time since last update in seconds
     */
    updateParticleSystems(delta) {
        this.particleSystems.forEach(system => {
            const positions = system.particles.geometry.attributes.position.array;
            const count = positions.length / 3;
            
            // Rotate the entire particle system
            system.particles.rotateOnAxis(system.rotationAxis, system.rotationSpeed * delta);
            
            for (let i = 0; i < count; i++) {
                // Move particles outward with varying speeds
                const x = positions[i * 3];
                const y = positions[i * 3 + 1];
                const z = positions[i * 3 + 2];
                
                const length = Math.sqrt(x * x + y * y + z * z);
                const speed = system.speed * delta;
                
                // If particle is near the edge, reset it to the center
                if (length > this.skill.radius * 0.95) {
                    positions[i * 3] = (Math.random() - 0.5) * 0.5;
                    positions[i * 3 + 1] = (Math.random() - 0.5) * 0.5;
                    positions[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
                } else {
                    // Move outward
                    positions[i * 3] += (x / length) * speed;
                    positions[i * 3 + 1] += (y / length) * speed;
                    positions[i * 3 + 2] += (z / length) * speed;
                }
            }
            
            system.particles.geometry.attributes.position.needsUpdate = true;
        });
    }
    
    /**
     * Update the orbiting effect instances
     * @param {number} delta - Time since last update in seconds
     */
    updateEffectInstances(delta) {
        this.effectInstances.forEach(instance => {
            const userData = instance.userData;
            
            // Update orbit angle
            userData.orbitAngle += userData.orbitSpeed * delta;
            
            // Calculate new position
            const x = Math.cos(userData.orbitAngle) * userData.orbitRadius;
            const z = Math.sin(userData.orbitAngle) * userData.orbitRadius;
            
            // Add vertical bobbing motion
            const y = userData.initialY + 
                Math.sin(this.elapsedTime * userData.verticalBobSpeed) * 
                userData.verticalBobAmount;
            
            // Update position
            instance.position.set(x, y, z);
            
            // Make instance always face the center
            instance.lookAt(0, instance.position.y, 0);
            
            // Pulse the instance size
            const pulseFactor = 1 + 0.2 * Math.sin(this.elapsedTime * 3 + userData.orbitAngle);
            instance.scale.set(pulseFactor, pulseFactor, pulseFactor);
        });
    }
    
    /**
     * Apply the enhanced movement speed boost (5x the normal effect)
     */
    applyEnhancedMovementSpeedBoost() {
        if (!this.skill.game || !this.skill.game.player || this.hasAppliedSpeedBoost) return;
        
        const player = this.skill.game.player;
        if (player && player.stats) {
            // Apply the enhanced movement speed boost
            player.stats.addTemporaryBoost('movementSpeed', this.speedBoostMultiplier, this.speedBoostDuration);
            
            // Mark that we've applied the speed boost
            this.hasAppliedSpeedBoost = true;
            
            // Show a notification if available
            if (this.skill.game.hudManager && this.skill.game.hudManager.showNotification) {
                this.skill.game.hudManager.showNotification(`Movement speed increased by ${this.speedBoostMultiplier}x for ${this.speedBoostDuration} seconds!`);
            }
            
            // Create a more dramatic visual effect for the speed boost
            this.createEnhancedSpeedBoostEffect();
        }
    }
    
    /**
     * Create an enhanced visual effect for the speed boost
     */
    createEnhancedSpeedBoostEffect() {
        if (!this.skill.game || !this.skill.game.player) return;
        
        const player = this.skill.game.player;
        if (player && player.getPosition && this.effect) {
            const playerPosition = player.getPosition();
            if (playerPosition) {
                // Create multiple burst rings
                for (let i = 0; i < 5; i++) {
                    setTimeout(() => {
                        if (!this.isActive) return;
                        
                        // Create a burst effect
                        const burstGeometry = new THREE.RingGeometry(0.5, 2.5, 32);
                        const burstMaterial = new THREE.MeshBasicMaterial({
                            color: 0x00ffff, // Cyan color for speed boost
                            transparent: true,
                            opacity: 0.8,
                            side: THREE.DoubleSide,
                            depthWrite: false,
                            blending: THREE.AdditiveBlending
                        });
                        
                        const burst = new THREE.Mesh(burstGeometry, burstMaterial);
                        burst.position.y = 0.1;
                        burst.rotation.x = Math.PI / 2; // Lay flat
                        
                        // Add to effect
                        this.effect.add(burst);
                        
                        // Animate the burst
                        const startTime = this.elapsedTime;
                        const duration = 1.0;
                        
                        // Store animation data
                        burst.userData = {
                            startTime: startTime,
                            duration: duration,
                            startScale: 0.1,
                            endScale: 5.0
                        };
                        
                        // Start with small scale
                        burst.scale.set(burst.userData.startScale, burst.userData.startScale, burst.userData.startScale);
                        
                        // Add to animation list
                        this.healingPulses.push({
                            mesh: burst,
                            age: 0,
                            maxAge: duration,
                            update: (delta) => {
                                const age = burst.userData.age || 0;
                                burst.userData.age = age + delta;
                                
                                const progress = Math.min(1, burst.userData.age / burst.userData.duration);
                                const scale = burst.userData.startScale + (burst.userData.endScale - burst.userData.startScale) * progress;
                                
                                burst.scale.set(scale, scale, scale);
                                burst.material.opacity = 0.8 * (1 - progress);
                                
                                if (progress >= 1) {
                                    this.effect.remove(burst);
                                    burst.geometry.dispose();
                                    burst.material.dispose();
                                    return true; // Remove from update list
                                }
                                
                                return false;
                            }
                        });
                    }, i * 200); // Stagger the bursts
                }
                
                // Create a trail effect that follows the player
                this.createSpeedTrail();
            }
        }
    }
    
    /**
     * Create a speed trail effect that follows the player
     */
    createSpeedTrail() {
        // This would be implemented to create a trail behind the player as they move
        // For simplicity, we'll just add a placeholder for now
        console.debug('Speed trail effect would be created here');
    }
    
    /**
     * Apply healing effect to player and allies, damage to enemies
     * Enhanced version that applies more healing
     */
    applyHealingEffect() {
        // Call the parent method for basic functionality
        super.applyHealingEffect();
        
        // Add additional healing pulses for visual effect
        for (let i = 0; i < 2; i++) {
            setTimeout(() => {
                if (this.isActive) {
                    this.createHealingPulse();
                }
            }, 100 * (i + 1));
        }
    }
    
    /**
     * Create a more dramatic healing pulse effect
     */
    createHealingPulse() {
        // Create a more dramatic pulse than the parent class
        const pulseGeometry = new THREE.RingGeometry(0.1, 0.3, 32);
        const pulseMaterial = new THREE.MeshBasicMaterial({
            color: this.skill.color,
            transparent: true,
            opacity: 0.9,
            side: THREE.DoubleSide,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        
        const pulseMesh = new THREE.Mesh(pulseGeometry, pulseMaterial);
        pulseMesh.rotation.x = Math.PI / 2; // Lay flat
        pulseMesh.position.y = 0.1; // Slightly above ground
        
        this.effect.add(pulseMesh);
        
        // Store pulse for animation with enhanced properties
        this.healingPulses.push({
            mesh: pulseMesh,
            age: 0,
            maxAge: 1.5, // Longer duration
            scale: 0.1,
            targetScale: 8.0, // Larger final size
            update: (delta) => {
                const pulse = pulseMesh;
                const age = pulse.userData.age || 0;
                pulse.userData.age = age + delta;
                
                const progress = Math.min(1, pulse.userData.age / 1.5);
                const scale = 0.1 + (8.0 - 0.1) * progress;
                
                pulse.scale.set(scale, scale, scale);
                pulse.material.opacity = 0.9 * (1 - progress);
                
                if (progress >= 1) {
                    this.effect.remove(pulse);
                    pulse.geometry.dispose();
                    pulse.material.dispose();
                    return true; // Remove from update list
                }
                
                return false;
            }
        });
    }
    
    /**
     * Dispose of the effect and clean up resources
     */
    dispose() {
        // Clear effect instances
        this.effectInstances = [];
        
        // Clear particle systems
        this.particleSystems = [];
        
        // Call parent dispose for the main effect
        super.dispose();
    }
    
    /**
     * Reset the effect to its initial state
     */
    reset() {
        // Call parent reset for the main effect
        super.reset();
        
        // Reset effect instances
        this.effectInstances = [];
        
        // Reset particle systems
        this.particleSystems = [];
        
        // Reset speed boost flag
        this.hasAppliedSpeedBoost = false;
    }
}