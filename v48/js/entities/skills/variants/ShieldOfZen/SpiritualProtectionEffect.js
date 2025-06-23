import * as THREE from 'three';
import { ShieldOfZenEffect } from '../../ShieldOfZenEffect.js';

/**
 * Specialized effect for Shield of Zen - Spiritual Protection variant
 * Creates a shield that provides immunity to status effects
 */
export class SpiritualProtectionEffect extends ShieldOfZenEffect {
    constructor(skill) {
        super(skill);
        // Override base properties for this variant
        this.damageReduction = 0.25; // 25% damage reduction
        this.statusImmunity = true; // Immunity to status effects
        this.healOverTime = 0.01; // 1% healing per second
    }

    /**
     * Override the base method to create a specialized effect
     * @param {THREE.Group} effectGroup - Group to add the effect to
     * @param {THREE.Vector3} position - Player position
     * @param {THREE.Vector3} direction - Player direction
     * @private
     */
    _createShieldOfZenEffect(effectGroup, position, direction) {
        // Call the parent method to create the base effect
        super._createShieldOfZenEffect(effectGroup, position, direction);
        
        // Create spiritual protection effect
        this._createSpiritualProtection(effectGroup);
    }
    
    /**
     * Create a spiritual protection effect
     * @param {THREE.Group} effectGroup - Group to add the effect to
     * @private
     */
    _createSpiritualProtection(effectGroup) {
        // Create aura group
        const auraGroup = new THREE.Group();
        
        // Create spiritual shield using sphere geometry
        const shieldGeometry = new THREE.SphereGeometry(2.2, 32, 32);
        const shieldMaterial = new THREE.MeshStandardMaterial({
            color: 0xffeeaa, // Warm golden light
            transparent: true,
            opacity: 0.3,
            emissive: 0xffeeaa,
            emissiveIntensity: 0.5,
            side: THREE.DoubleSide
        });
        
        const shield = new THREE.Mesh(shieldGeometry, shieldMaterial);
        auraGroup.add(shield);
        
        // Create spiritual symbols floating around the shield
        const symbolCount = 8;
        const symbols = [];
        
        for (let i = 0; i < symbolCount; i++) {
            // Create symbol using custom geometry
            const symbolGroup = new THREE.Group();
            
            // Create a lotus symbol
            const petalCount = 8;
            const petalRadius = 0.15;
            const centerRadius = 0.05;
            
            // Create center of lotus
            const centerGeometry = new THREE.CircleGeometry(centerRadius, 16);
            const centerMaterial = new THREE.MeshBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.9,
                side: THREE.DoubleSide
            });
            
            const center = new THREE.Mesh(centerGeometry, centerMaterial);
            center.rotation.x = -Math.PI / 2; // Lay flat
            symbolGroup.add(center);
            
            // Create petals
            for (let j = 0; j < petalCount; j++) {
                const angle = (j / petalCount) * Math.PI * 2;
                
                const petalGeometry = new THREE.CircleGeometry(petalRadius, 8, 0, Math.PI / 4);
                const petalMaterial = new THREE.MeshBasicMaterial({
                    color: 0xffeeaa,
                    transparent: true,
                    opacity: 0.8,
                    side: THREE.DoubleSide
                });
                
                const petal = new THREE.Mesh(petalGeometry, petalMaterial);
                petal.position.set(
                    Math.cos(angle) * (centerRadius + petalRadius / 2),
                    0,
                    Math.sin(angle) * (centerRadius + petalRadius / 2)
                );
                petal.rotation.x = -Math.PI / 2; // Lay flat
                petal.rotation.z = angle;
                
                symbolGroup.add(petal);
            }
            
            // Position symbol around shield
            const phi = (i / symbolCount) * Math.PI * 2;
            const theta = Math.PI / 2; // Position around equator
            const radius = 2.2;
            
            symbolGroup.position.set(
                radius * Math.sin(theta) * Math.cos(phi),
                radius * Math.sin(theta) * Math.sin(phi),
                radius * Math.cos(theta)
            );
            
            // Orient symbol to face outward
            symbolGroup.lookAt(symbolGroup.position.clone().multiplyScalar(2));
            
            // Store orbit data
            symbolGroup.userData = {
                orbitRadius: radius,
                orbitSpeed: 0.2,
                orbitAxis: new THREE.Vector3(0, 1, 0),
                initialPosition: symbolGroup.position.clone(),
                rotationSpeed: 0.5 + Math.random() * 0.5
            };
            
            auraGroup.add(symbolGroup);
            symbols.push(symbolGroup);
        }
        
        // Create healing particles
        const particleCount = 15;
        const particles = [];
        
        for (let i = 0; i < particleCount; i++) {
            const particleSize = 0.05 + Math.random() * 0.1;
            const particleGeometry = new THREE.SphereGeometry(particleSize, 8, 8);
            const particleMaterial = new THREE.MeshBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.7
            });
            
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            
            // Position randomly inside shield
            const phi = Math.random() * Math.PI * 2;
            const theta = Math.random() * Math.PI;
            const radius = Math.random() * 2.0;
            
            particle.position.set(
                radius * Math.sin(theta) * Math.cos(phi),
                radius * Math.sin(theta) * Math.sin(phi),
                radius * Math.cos(theta)
            );
            
            // Store animation data
            particle.userData = {
                speed: 0.5 + Math.random() * 1.0,
                direction: new THREE.Vector3(
                    Math.random() - 0.5,
                    Math.random() - 0.5,
                    Math.random() - 0.5
                ).normalize(),
                distance: 0.5 + Math.random() * 1.0
            };
            
            auraGroup.add(particle);
            particles.push(particle);
        }
        
        // Add aura group to effect group
        effectGroup.add(auraGroup);
        
        // Store references
        this.aura = auraGroup;
        this.shield = shield;
        this.symbols = symbols;
        this.particles = particles;
        this.healTimer = 0;
    }
    
    /**
     * Override the update method to add custom behavior
     * @param {number} delta - Time since last update in seconds
     * @private
     */
    _updateShieldOfZenEffect(delta) {
        // Call the parent method to update the base effect
        super._updateShieldOfZenEffect(delta);
        
        // Update spiritual shield
        if (this.shield) {
            // Pulse shield opacity
            this.shield.material.opacity = 0.2 + 0.1 * Math.sin(this.elapsedTime * 1.0);
            this.shield.material.emissiveIntensity = 0.3 + 0.2 * Math.sin(this.elapsedTime * 1.0);
        }
        
        // Update spiritual symbols
        if (this.symbols) {
            for (const symbol of this.symbols) {
                if (symbol.userData) {
                    // Orbit around player
                    const axis = symbol.userData.orbitAxis;
                    const angle = symbol.userData.orbitSpeed * delta;
                    
                    // Apply rotation around the orbit axis
                    const rotationMatrix = new THREE.Matrix4().makeRotationAxis(axis, angle);
                    symbol.position.applyMatrix4(rotationMatrix);
                    
                    // Rotate symbol
                    symbol.rotation.z += symbol.userData.rotationSpeed * delta;
                    
                    // Make symbol face outward
                    symbol.lookAt(symbol.position.clone().multiplyScalar(2));
                }
            }
        }
        
        // Update healing particles
        if (this.particles) {
            for (const particle of this.particles) {
                if (particle.userData) {
                    // Move particle in its direction
                    const moveAmount = particle.userData.speed * delta;
                    particle.position.add(particle.userData.direction.clone().multiplyScalar(moveAmount));
                    
                    // If particle moves too far, reset it
                    if (particle.position.length() > 2.0) {
                        // Reset to a random position near the center
                        const phi = Math.random() * Math.PI * 2;
                        const theta = Math.random() * Math.PI;
                        const radius = Math.random() * 0.5;
                        
                        particle.position.set(
                            radius * Math.sin(theta) * Math.cos(phi),
                            radius * Math.sin(theta) * Math.sin(phi),
                            radius * Math.cos(theta)
                        );
                        
                        // New random direction
                        particle.userData.direction = new THREE.Vector3(
                            Math.random() - 0.5,
                            Math.random() - 0.5,
                            Math.random() - 0.5
                        ).normalize();
                    }
                }
            }
        }
        
        // Apply healing over time
        if (this.healOverTime > 0 && this.skill.game && this.skill.game.player) {
            this.healTimer += delta;
            
            // Heal every second
            if (this.healTimer >= 1.0) {
                const player = this.skill.game.player;
                const healAmount = player.stats.maxHealth * this.healOverTime;
                
                // Apply healing
                player.heal(healAmount);
                
                // Reset timer
                this.healTimer -= 1.0;
                
                // Create healing effect
                this._createHealingEffect();
            }
        }
        
        // Apply status immunity
        if (this.statusImmunity && this.skill.game && this.skill.game.player) {
            const player = this.skill.game.player;
            
            // Clear any negative status effects
            player.clearNegativeStatusEffects();
            
            // Prevent new status effects
            player.statusImmunity = true;
        }
    }
    
    /**
     * Create a healing effect
     * @private
     */
    _createHealingEffect() {
        if (!this.effect) return;
        
        // Create healing particles that rise up
        const particleCount = 5;
        
        for (let i = 0; i < particleCount; i++) {
            const particleSize = 0.1 + Math.random() * 0.1;
            const particleGeometry = new THREE.SphereGeometry(particleSize, 8, 8);
            const particleMaterial = new THREE.MeshBasicMaterial({
                color: 0xffeeaa,
                transparent: true,
                opacity: 0.7
            });
            
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            
            // Random position around player
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 1.0;
            particle.position.set(
                Math.cos(angle) * radius,
                0.1,
                Math.sin(angle) * radius
            );
            
            // Store animation data
            particle.userData = {
                age: 0,
                maxAge: 1.0 + Math.random() * 0.5,
                speed: 0.5 + Math.random() * 0.5,
                isHealingParticle: true
            };
            
            this.effect.add(particle);
            
            // Add to a list for cleanup
            if (!this.healingParticles) {
                this.healingParticles = [];
            }
            this.healingParticles.push(particle);
        }
    }
    
    /**
     * Override the update method to add custom behavior
     * @param {number} delta - Time since last update in seconds
     */
    update(delta) {
        // Call parent update method
        super.update(delta);
        
        // Update healing particles
        if (this.healingParticles) {
            for (let i = this.healingParticles.length - 1; i >= 0; i--) {
                const particle = this.healingParticles[i];
                
                if (particle.userData && particle.userData.isHealingParticle) {
                    // Update age
                    particle.userData.age += delta;
                    
                    // Move upward
                    particle.position.y += particle.userData.speed * delta;
                    
                    // Fade out over time
                    if (particle.userData.age > particle.userData.maxAge * 0.5) {
                        particle.material.opacity = Math.max(0, 0.7 - (particle.userData.age - particle.userData.maxAge * 0.5) / (particle.userData.maxAge * 0.5) * 0.7);
                    }
                    
                    // Remove if expired
                    if (particle.userData.age >= particle.userData.maxAge) {
                        // Remove from scene
                        if (particle.parent) {
                            particle.parent.remove(particle);
                        }
                        
                        // Dispose of resources
                        if (particle.geometry) particle.geometry.dispose();
                        if (particle.material) particle.material.dispose();
                        
                        // Remove from array
                        this.healingParticles.splice(i, 1);
                    }
                }
            }
        }
    }
    
    /**
     * Enhanced dispose method to properly clean up all resources
     * Overrides the base class dispose method with more thorough cleanup
     */
    dispose() {
        // Clear healing particles
        if (this.healingParticles) {
            for (const particle of this.healingParticles) {
                if (particle.parent) {
                    particle.parent.remove(particle);
                }
                
                if (particle.geometry) particle.geometry.dispose();
                if (particle.material) particle.material.dispose();
            }
            this.healingParticles.length = 0;
        }
        
        // Clear symbols
        if (this.symbols) {
            this.symbols.length = 0;
        }
        
        // Remove status immunity from player
        if (this.statusImmunity && this.skill.game && this.skill.game.player) {
            this.skill.game.player.statusImmunity = false;
        }
        
        // Call parent dispose method
        super.dispose();
    }
}