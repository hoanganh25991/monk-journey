import * as THREE from 'three';
import { FlyingKickEffect } from '../../FlyingKickEffect.js';

/**
 * Effect for the Cyclone Kick variant of Flying Kick
 * Creates a whirlwind effect that pulls in nearby enemies as you kick
 * Visual style: Swirling wind particles and vortex effect
 */
export class CycloneKickEffect extends FlyingKickEffect {
    constructor(skill) {
        super(skill);
        
        // Variant-specific properties
        this.pullEffect = true;
        this.pullForce = 10; // Force with which enemies are pulled
        this.pullRadius = this.skill.radius * 2; // Larger radius for pull effect
        
        // Visual properties
        this.windParticles = [];
        this.vortexMesh = null;
        this.rotationSpeed = 3.0; // Rotation speed for the vortex
    }

    /**
     * Create the Cyclone Kick effect
     * @param {THREE.Vector3} position - Position to create the effect at
     * @param {THREE.Vector3} direction - Direction the effect should face
     * @returns {THREE.Group} - The created effect
     */
    create(position, direction) {
        // Create base effect first
        const effectGroup = super.create(position, direction);
        
        // Add wind particles
        this.addWindParticles(effectGroup);
        
        // Add vortex effect
        this.addVortexEffect(effectGroup);
        
        return effectGroup;
    }
    
    /**
     * Add wind particles to the effect
     * @param {THREE.Group} group - The group to add particles to
     */
    addWindParticles(group) {
        const particleCount = 100;
        const particleGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        
        for (let i = 0; i < particleCount; i++) {
            // Random position within a cylinder around the monk
            const angle = Math.random() * Math.PI * 2;
            const radius = this.pullRadius * Math.random();
            const height = (Math.random() - 0.5) * 2; // Between -1 and 1
            
            positions[i * 3] = Math.cos(angle) * radius;
            positions[i * 3 + 1] = height;
            positions[i * 3 + 2] = Math.sin(angle) * radius;
            
            // Random sizes
            sizes[i] = 0.05 + Math.random() * 0.1;
        }
        
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        // Create particle material
        const particleMaterial = new THREE.PointsMaterial({
            color: 0xaaddff,
            size: 0.1,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true
        });
        
        // Create particle system
        const particles = new THREE.Points(particleGeometry, particleMaterial);
        group.add(particles);
        
        // Store for animation
        this.windParticles = particles;
    }
    
    /**
     * Add vortex effect to the group
     * @param {THREE.Group} group - The group to add the vortex to
     */
    addVortexEffect(group) {
        // Create a cone for the vortex
        const vortexGeometry = new THREE.ConeGeometry(this.pullRadius, this.pullRadius * 2, 32, 1, true);
        const vortexMaterial = new THREE.MeshBasicMaterial({
            color: 0x88ccff,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide,
            wireframe: true
        });
        
        const vortex = new THREE.Mesh(vortexGeometry, vortexMaterial);
        vortex.rotation.x = Math.PI; // Point the cone upward
        group.add(vortex);
        
        // Store for animation
        this.vortexMesh = vortex;
    }
    
    /**
     * Update the Cyclone Kick effect
     * @param {number} delta - Time since last update in seconds
     */
    update(delta) {
        super.update(delta);
        
        if (this.isActive && this.effect) {
            // Rotate the vortex
            if (this.vortexMesh) {
                this.vortexMesh.rotation.y += this.rotationSpeed * delta;
            }
            
            // Animate wind particles
            if (this.windParticles && this.windParticles.geometry) {
                const positions = this.windParticles.geometry.attributes.position.array;
                const count = positions.length / 3;
                
                for (let i = 0; i < count; i++) {
                    // Get current position
                    const x = positions[i * 3];
                    const y = positions[i * 3 + 1];
                    const z = positions[i * 3 + 2];
                    
                    // Calculate distance from center
                    const distance = Math.sqrt(x * x + z * z);
                    
                    // Calculate angle
                    const angle = Math.atan2(z, x);
                    
                    // Move particles in a spiral
                    const newAngle = angle + delta * (1.0 + (1.0 - distance / this.pullRadius) * 2.0);
                    const newDistance = distance * 0.98; // Slowly move inward
                    
                    positions[i * 3] = Math.cos(newAngle) * newDistance;
                    positions[i * 3 + 2] = Math.sin(newAngle) * newDistance;
                    
                    // If particle gets too close to center, reset it
                    if (newDistance < 0.2) {
                        const resetAngle = Math.random() * Math.PI * 2;
                        const resetRadius = this.pullRadius * 0.8 + Math.random() * this.pullRadius * 0.2;
                        
                        positions[i * 3] = Math.cos(resetAngle) * resetRadius;
                        positions[i * 3 + 2] = Math.sin(resetAngle) * resetRadius;
                    }
                }
                
                this.windParticles.geometry.attributes.position.needsUpdate = true;
            }
            
            // Apply pull effect to nearby enemies
            if (this.pullEffect && this.game) {
                this.applyPullEffect();
            }
        }
    }
    
    /**
     * Apply pull effect to nearby enemies
     */
    applyPullEffect() {
        if (!this.game || !this.game.enemyManager) return;
        
        const enemies = this.game.enemyManager.getEnemiesInRadius(
            this.position,
            this.pullRadius
        );
        
        enemies.forEach(enemy => {
            if (!enemy || !enemy.position) return;
            
            // Calculate direction to monk
            const direction = new THREE.Vector3()
                .subVectors(this.position, enemy.position)
                .normalize();
            
            // Apply pull force
            if (enemy.applyForce) {
                enemy.applyForce(
                    direction.multiplyScalar(this.pullForce * this.game.deltaTime)
                );
            }
        });
    }
    
    /**
     * Override damage application to include pull effect
     * @param {Enemy} enemy - The enemy to damage
     * @param {number} amount - The amount of damage to deal
     */
    applyDamage(enemy, amount) {
        // Apply base damage
        super.applyDamage(enemy, amount);
        
        // Apply pull effect (handled in update)
    }
    
    /**
     * Dispose of the effect and clean up resources
     */
    dispose() {
        // Clear references
        this.windParticles = null;
        this.vortexMesh = null;
        
        // Call parent dispose
        super.dispose();
    }
}