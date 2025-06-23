import * as THREE from 'three';
import { FlyingKickEffect } from '../../FlyingKickEffect.js';

/**
 * Effect for the Tiger's Flight variant of Flying Kick
 * Creates a fiery tiger-like visual effect with increased damage
 * Visual style: Orange and red energy with tiger-like patterns
 */
export class TigersFlightEffect extends FlyingKickEffect {
    constructor(skill) {
        super(skill);
        
        // Variant-specific properties
        this.damageMultiplier = 1.4; // 40% increased damage
        
        // Visual properties
        this.tigerColor = new THREE.Color(0xff6600); // Orange for tiger
        this.fireColor = new THREE.Color(0xff3300); // Red-orange for fire
        this.fireParticles = null;
        this.tigerAura = null;
    }
    
    /**
     * Calculate damage for the effect
     * @param {Enemy} enemy - The enemy to calculate damage for
     * @returns {number} - The calculated damage
     * @override
     */
    calculateDamage(enemy) {
        return super.calculateDamage(enemy) * this.damageMultiplier;
    }
    
    /**
     * Create the effect
     * @param {THREE.Vector3} startPosition - The starting position of the effect
     * @param {THREE.Vector3} targetPosition - The target position of the effect
     * @returns {Object} - The created effect object
     * @override
     */
    create(startPosition, targetPosition) {
        // Create base effect
        const effectObject = super.create(startPosition, targetPosition);
        
        // Modify base effect colors
        if (effectObject.trail) {
            effectObject.trail.traverse(child => {
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(mat => {
                            mat.color = this.tigerColor.clone();
                        });
                    } else {
                        child.material.color = this.tigerColor.clone();
                    }
                }
            });
        }
        
        // Add tiger aura effect
        this.addTigerAuraEffect(effectObject);
        
        // Add fire particles
        this.addFireParticles(effectObject);
        
        return effectObject;
    }
    
    /**
     * Add tiger aura effect to the flying kick
     * @param {Object} effectObject - The effect object to add aura to
     */
    addTigerAuraEffect(effectObject) {
        if (!effectObject.player || !this.skill.game.scene) return;
        
        // Create tiger aura geometry
        const auraGeometry = new THREE.SphereGeometry(1, 16, 12);
        
        // Create tiger aura material with tiger-like pattern
        const auraMaterial = new THREE.MeshBasicMaterial({
            color: this.tigerColor,
            transparent: true,
            opacity: 0.7,
            wireframe: true,
            blending: THREE.AdditiveBlending
        });
        
        // Create tiger aura mesh
        const aura = new THREE.Mesh(auraGeometry, auraMaterial);
        
        // Add to player
        effectObject.player.add(aura);
        
        // Create tiger stripes
        const stripesGroup = new THREE.Group();
        const stripeCount = 5;
        
        for (let i = 0; i < stripeCount; i++) {
            const stripeGeometry = new THREE.PlaneGeometry(1.5, 0.2);
            const stripeMaterial = new THREE.MeshBasicMaterial({
                color: this.fireColor,
                transparent: true,
                opacity: 0.8,
                side: THREE.DoubleSide,
                blending: THREE.AdditiveBlending
            });
            
            const stripe = new THREE.Mesh(stripeGeometry, stripeMaterial);
            
            // Position stripes around the player
            const angle = (i / stripeCount) * Math.PI * 2;
            stripe.position.set(
                Math.cos(angle) * 0.7,
                0.2 + i * 0.2,
                Math.sin(angle) * 0.7
            );
            
            // Rotate to face center
            stripe.lookAt(0, stripe.position.y, 0);
            
            stripesGroup.add(stripe);
        }
        
        // Add stripes to player
        effectObject.player.add(stripesGroup);
        
        // Store for animation
        this.tigerAura = {
            aura,
            auraMaterial,
            auraGeometry,
            stripesGroup,
            stripes: stripesGroup.children
        };
    }
    
    /**
     * Add fire particles to the effect
     * @param {Object} effectObject - The effect object to add particles to
     */
    addFireParticles(effectObject) {
        if (!effectObject.player || !this.skill.game.scene) return;
        
        // Create fire particles
        const particleCount = 50;
        const particleGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        
        for (let i = 0; i < particleCount; i++) {
            // Start at player position
            positions[i * 3] = 0;
            positions[i * 3 + 1] = 0.5; // Slightly above player
            positions[i * 3 + 2] = 0;
            
            // Fire color with variations
            const colorVariation = 0.8 + Math.random() * 0.2;
            if (Math.random() < 0.7) {
                // Tiger color
                colors[i * 3] = this.tigerColor.r * colorVariation;
                colors[i * 3 + 1] = this.tigerColor.g * colorVariation;
                colors[i * 3 + 2] = this.tigerColor.b * colorVariation;
            } else {
                // Fire color
                colors[i * 3] = this.fireColor.r * colorVariation;
                colors[i * 3 + 1] = this.fireColor.g * colorVariation;
                colors[i * 3 + 2] = this.fireColor.b * colorVariation;
            }
            
            // Random sizes
            sizes[i] = 0.1 + Math.random() * 0.2;
        }
        
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        const particleMaterial = new THREE.PointsMaterial({
            size: 0.2,
            transparent: true,
            opacity: 0.8,
            vertexColors: true,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true
        });
        
        const particles = new THREE.Points(particleGeometry, particleMaterial);
        
        // Add to player
        effectObject.player.add(particles);
        
        // Store for animation
        this.fireParticles = {
            points: particles,
            geometry: particleGeometry,
            material: particleMaterial,
            positions: positions
        };
    }
    
    /**
     * Update the effect
     * @param {number} delta - Time since last update in seconds
     * @param {Object} effectObject - The effect object to update
     * @override
     */
    update(delta, effectObject) {
        super.update(delta, effectObject);
        
        // Update tiger aura
        this.updateTigerAura(delta, effectObject);
        
        // Update fire particles
        this.updateFireParticles(delta, effectObject);
    }
    
    /**
     * Update the tiger aura
     * @param {number} delta - Time since last update in seconds
     * @param {Object} effectObject - The effect object to update
     */
    updateTigerAura(delta, effectObject) {
        if (!this.tigerAura) return;
        
        // Get progress of the kick
        const progress = effectObject.progress || 0;
        
        // Rotate aura
        this.tigerAura.aura.rotation.y += delta * 2;
        this.tigerAura.aura.rotation.x += delta * 1;
        
        // Pulse aura size
        const pulseScale = 1 + 0.2 * Math.sin(this.skill.game.time.getElapsedTime() * 10);
        this.tigerAura.aura.scale.set(pulseScale, pulseScale, pulseScale);
        
        // Animate tiger stripes
        this.tigerAura.stripes.forEach((stripe, index) => {
            // Rotate stripes
            stripe.rotation.z += delta * (1 + index * 0.2);
            
            // Pulse opacity
            if (stripe.material) {
                stripe.material.opacity = 0.6 + 0.4 * Math.sin(this.skill.game.time.getElapsedTime() * 5 + index);
            }
        });
        
        // Fade out near the end
        if (progress > 0.7) {
            const fadeOut = (progress - 0.7) * 3.33; // 0 to 1
            this.tigerAura.auraMaterial.opacity = 0.7 * (1 - fadeOut);
            
            this.tigerAura.stripes.forEach(stripe => {
                if (stripe.material) {
                    stripe.material.opacity *= (1 - fadeOut);
                }
            });
        }
    }
    
    /**
     * Update the fire particles
     * @param {number} delta - Time since last update in seconds
     * @param {Object} effectObject - The effect object to update
     */
    updateFireParticles(delta, effectObject) {
        if (!this.fireParticles) return;
        
        // Get progress of the kick
        const progress = effectObject.progress || 0;
        
        // Animate particles based on progress
        const positions = this.fireParticles.positions;
        const count = positions.length / 3;
        
        for (let i = 0; i < count; i++) {
            // Move upward and outward
            positions[i * 3] += (Math.random() - 0.5) * 0.2;
            positions[i * 3 + 1] += (0.5 + Math.random() * 0.5) * delta;
            positions[i * 3 + 2] += (Math.random() - 0.5) * 0.2;
            
            // Reset particles that go too far
            const distance = Math.sqrt(
                positions[i * 3] * positions[i * 3] +
                positions[i * 3 + 2] * positions[i * 3 + 2]
            );
            
            if (distance > 2 || positions[i * 3 + 1] > 3 || Math.random() < 0.05) {
                const angle = Math.random() * Math.PI * 2;
                const radius = Math.random() * 0.5;
                
                positions[i * 3] = Math.cos(angle) * radius;
                positions[i * 3 + 1] = Math.random() * 0.5;
                positions[i * 3 + 2] = Math.sin(angle) * radius;
            }
        }
        
        this.fireParticles.geometry.attributes.position.needsUpdate = true;
        
        // Fade out particles near the end
        if (progress > 0.7) {
            const fadeOut = (progress - 0.7) * 3.33; // 0 to 1
            this.fireParticles.material.opacity = 0.8 * (1 - fadeOut);
        }
    }
    
    /**
     * Clean up the effect
     * @param {Object} effectObject - The effect object to clean up
     * @override
     */
    cleanup(effectObject) {
        super.cleanup(effectObject);
        
        // Clean up tiger aura
        if (this.tigerAura && effectObject.player) {
            effectObject.player.remove(this.tigerAura.aura);
            effectObject.player.remove(this.tigerAura.stripesGroup);
            
            this.tigerAura.auraMaterial.dispose();
            this.tigerAura.auraGeometry.dispose();
            
            this.tigerAura.stripes.forEach(stripe => {
                if (stripe.material) stripe.material.dispose();
                if (stripe.geometry) stripe.geometry.dispose();
            });
            
            this.tigerAura = null;
        }
        
        // Clean up fire particles
        if (this.fireParticles && effectObject.player) {
            effectObject.player.remove(this.fireParticles.points);
            this.fireParticles.geometry.dispose();
            this.fireParticles.material.dispose();
            this.fireParticles = null;
        }
    }
    
    /**
     * Create impact effect when the kick hits
     * @param {THREE.Vector3} position - The position of the impact
     * @override
     */
    createImpactEffect(position) {
        super.createImpactEffect(position);
        
        // Add additional tiger impact effect
        this.createTigerImpactEffect(position);
    }
    
    /**
     * Create a tiger-themed impact effect
     * @param {THREE.Vector3} position - The position to create the effect at
     */
    createTigerImpactEffect(position) {
        if (!position || !this.skill.game.scene) return;
        
        // Create a fire explosion
        const particleCount = 50;
        const particleGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        
        for (let i = 0; i < particleCount; i++) {
            // Start at impact position
            positions[i * 3] = position.x;
            positions[i * 3 + 1] = position.y + 0.5; // Slightly above ground
            positions[i * 3 + 2] = position.z;
            
            // Fire color with variations
            const colorVariation = 0.8 + Math.random() * 0.2;
            if (Math.random() < 0.7) {
                // Tiger color
                colors[i * 3] = this.tigerColor.r * colorVariation;
                colors[i * 3 + 1] = this.tigerColor.g * colorVariation;
                colors[i * 3 + 2] = this.tigerColor.b * colorVariation;
            } else {
                // Fire color
                colors[i * 3] = this.fireColor.r * colorVariation;
                colors[i * 3 + 1] = this.fireColor.g * colorVariation;
                colors[i * 3 + 2] = this.fireColor.b * colorVariation;
            }
            
            // Random sizes
            sizes[i] = 0.1 + Math.random() * 0.2;
        }
        
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        const particleMaterial = new THREE.PointsMaterial({
            size: 0.2,
            transparent: true,
            opacity: 0.8,
            vertexColors: true,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true
        });
        
        const particles = new THREE.Points(particleGeometry, particleMaterial);
        
        // Add to scene
        this.skill.game.scene.add(particles);
        
        // Create tiger claw marks
        const clawGroup = new THREE.Group();
        
        // Create five claw marks
        for (let i = 0; i < 5; i++) {
            const clawGeometry = new THREE.PlaneGeometry(0.1, 1);
            const clawMaterial = new THREE.MeshBasicMaterial({
                color: this.fireColor,
                transparent: true,
                opacity: 0.9,
                side: THREE.DoubleSide,
                blending: THREE.AdditiveBlending
            });
            
            const claw = new THREE.Mesh(clawGeometry, clawMaterial);
            
            // Position claws in a fan pattern
            const angle = -Math.PI / 4 + (i / 4) * Math.PI / 2;
            claw.position.set(
                Math.cos(angle) * 0.5,
                0.1, // Just above ground
                Math.sin(angle) * 0.5
            );
            
            // Rotate to lay flat and align with angle
            claw.rotation.x = Math.PI / 2;
            claw.rotation.z = angle;
            
            clawGroup.add(claw);
        }
        
        // Position at impact
        clawGroup.position.copy(position);
        
        // Add to scene
        this.skill.game.scene.add(clawGroup);
        
        // Animate the impact effect
        const startTime = this.skill.game.time.getElapsedTime();
        const duration = 1; // 1 second
        
        const updateImpact = () => {
            const currentTime = this.skill.game.time.getElapsedTime();
            const elapsed = currentTime - startTime;
            const t = elapsed / duration;
            
            if (t >= 1) {
                // Animation complete, remove effects
                this.skill.game.scene.remove(particles);
                this.skill.game.scene.remove(clawGroup);
                
                // Dispose resources
                particleGeometry.dispose();
                particleMaterial.dispose();
                
                clawGroup.children.forEach(claw => {
                    if (claw.geometry) claw.geometry.dispose();
                    if (claw.material) claw.material.dispose();
                });
                
                // Remove from update loop
                this.skill.game.removeFromUpdateList(updateImpact);
                return;
            }
            
            // Move particles outward and upward
            const positions = particleGeometry.attributes.position.array;
            
            for (let i = 0; i < particleCount; i++) {
                // Calculate direction from center
                const dx = positions[i * 3] - position.x;
                const dy = positions[i * 3 + 1] - position.y - 0.5;
                const dz = positions[i * 3 + 2] - position.z;
                
                // Normalize direction
                const length = Math.sqrt(dx * dx + dy * dy + dz * dz);
                const dirX = length > 0 ? dx / length : Math.random() - 0.5;
                const dirY = length > 0 ? dy / length : Math.random() + 0.5; // Mostly upward
                const dirZ = length > 0 ? dz / length : Math.random() - 0.5;
                
                // Move outward and upward
                const speed = 2;
                positions[i * 3] += dirX * speed * (this.skill.game.deltaTime || 0.016);
                positions[i * 3 + 1] += (dirY * speed + 1) * (this.skill.game.deltaTime || 0.016); // Extra upward movement
                positions[i * 3 + 2] += dirZ * speed * (this.skill.game.deltaTime || 0.016);
            }
            
            particleGeometry.attributes.position.needsUpdate = true;
            
            // Expand claw marks
            clawGroup.scale.set(1 + t, 1 + t, 1 + t);
            
            // Fade out effects
            particleMaterial.opacity = 0.8 * (1 - t);
            
            clawGroup.children.forEach(claw => {
                if (claw.material) {
                    claw.material.opacity = 0.9 * (1 - t);
                }
            });
        };
        
        // Add to update loop
        this.skill.game.addToUpdateList(updateImpact);
    }
}