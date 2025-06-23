import * as THREE from 'three';
import { FlyingKickEffect } from '../../FlyingKickEffect.js';

/**
 * Effect for the Blazing Kick variant of Flying Kick
 * Adds fire damage to the kick, leaving a trail of flames that burns enemies over time
 * Visual style: Fire particles and flame trail
 */
export class BlazingKickEffect extends FlyingKickEffect {
    constructor(skill) {
        super(skill);
        
        // Variant-specific properties
        this.fireTrail = true;
        this.trailDuration = 3; // 3 seconds trail duration
        this.trailDamage = skill.damage * 0.1; // 10% of base damage per tick
        this.burnTickRate = 0.5; // Apply burn damage every 0.5 seconds
        
        // Visual properties
        this.fireParticles = null;
        this.flameTrail = [];
        this.fireColor = new THREE.Color(0xff6600);
        this.lastTrailTime = 0;
        this.trailInterval = 0.1; // Time between trail segments
    }

    /**
     * Create the Blazing Kick effect
     * @param {THREE.Vector3} position - Position to create the effect at
     * @param {THREE.Vector3} direction - Direction the effect should face
     * @returns {THREE.Group} - The created effect
     */
    create(position, direction) {
        // Create base effect first
        const effectGroup = super.create(position, direction);
        
        // Add fire particles
        this.addFireParticles(effectGroup);
        
        // Change the color of the base effect to be more fiery
        effectGroup.traverse(child => {
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(mat => {
                        mat.color.lerp(this.fireColor, 0.5);
                        mat.emissive = this.fireColor.clone().multiplyScalar(0.3);
                    });
                } else {
                    child.material.color.lerp(this.fireColor, 0.5);
                    if (child.material.emissive) {
                        child.material.emissive = this.fireColor.clone().multiplyScalar(0.3);
                    }
                }
            }
        });
        
        return effectGroup;
    }
    
    /**
     * Add fire particles to the effect
     * @param {THREE.Group} group - The group to add particles to
     */
    addFireParticles(group) {
        const particleCount = 100;
        const particleGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        
        // Create a gradient of fire colors
        const colorBase = new THREE.Color(0xff6600);
        const colorTip = new THREE.Color(0xffcc00);
        
        for (let i = 0; i < particleCount; i++) {
            // Random position around the monk
            positions[i * 3] = (Math.random() - 0.5) * 1;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 1;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 1;
            
            // Random sizes
            sizes[i] = 0.1 + Math.random() * 0.2;
            
            // Color gradient from orange to yellow
            const colorMix = Math.random();
            const particleColor = colorBase.clone().lerp(colorTip, colorMix);
            colors[i * 3] = particleColor.r;
            colors[i * 3 + 1] = particleColor.g;
            colors[i * 3 + 2] = particleColor.b;
        }
        
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        // Create particle material
        const particleMaterial = new THREE.PointsMaterial({
            size: 0.2,
            transparent: true,
            opacity: 0.8,
            vertexColors: true,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true
        });
        
        // Create particle system
        const particles = new THREE.Points(particleGeometry, particleMaterial);
        group.add(particles);
        
        // Store for animation
        this.fireParticles = particles;
    }
    
    /**
     * Create a flame trail segment at the current position
     */
    createFlameTrailSegment() {
        if (!this.effect || !this.game || !this.game.scene) return;
        
        // Create a flame mesh
        const flameGeometry = new THREE.SphereGeometry(0.5, 8, 8);
        const flameMaterial = new THREE.MeshBasicMaterial({
            color: this.fireColor,
            transparent: true,
            opacity: 0.7,
            blending: THREE.AdditiveBlending
        });
        
        const flame = new THREE.Mesh(flameGeometry, flameMaterial);
        flame.position.copy(this.position);
        flame.scale.set(1, 1.5, 1); // Elongate vertically
        
        // Add to scene rather than effect group so it stays in place
        this.game.scene.add(flame);
        
        // Store creation time and initial properties
        flame.userData.creationTime = this.elapsedTime;
        flame.userData.initialScale = flame.scale.clone();
        
        // Add to trail array for tracking
        this.flameTrail.push(flame);
        
        // Update last trail time
        this.lastTrailTime = this.elapsedTime;
    }
    
    /**
     * Update the Blazing Kick effect
     * @param {number} delta - Time since last update in seconds
     */
    update(delta) {
        super.update(delta);
        
        if (this.isActive) {
            // Create flame trail segments periodically
            if (this.fireTrail && this.elapsedTime - this.lastTrailTime >= this.trailInterval) {
                this.createFlameTrailSegment();
            }
            
            // Update fire particles
            if (this.fireParticles && this.fireParticles.geometry) {
                const positions = this.fireParticles.geometry.attributes.position.array;
                const count = positions.length / 3;
                
                for (let i = 0; i < count; i++) {
                    // Random movement to simulate flickering
                    positions[i * 3] += (Math.random() - 0.5) * 0.1;
                    positions[i * 3 + 1] += (Math.random() - 0.5) * 0.1 + 0.05; // Tendency to rise
                    positions[i * 3 + 2] += (Math.random() - 0.5) * 0.1;
                    
                    // Keep particles close to the monk
                    const distance = Math.sqrt(
                        positions[i * 3] * positions[i * 3] +
                        positions[i * 3 + 1] * positions[i * 3 + 1] +
                        positions[i * 3 + 2] * positions[i * 3 + 2]
                    );
                    
                    if (distance > 1.5) {
                        // Reset particle position
                        positions[i * 3] = (Math.random() - 0.5) * 1;
                        positions[i * 3 + 1] = (Math.random() - 0.5) * 1;
                        positions[i * 3 + 2] = (Math.random() - 0.5) * 1;
                    }
                }
                
                this.fireParticles.geometry.attributes.position.needsUpdate = true;
            }
            
            // Update flame trail
            for (let i = this.flameTrail.length - 1; i >= 0; i--) {
                const flame = this.flameTrail[i];
                const flameAge = this.elapsedTime - flame.userData.creationTime;
                
                if (flameAge >= this.trailDuration) {
                    // Remove old flames
                    if (this.game && this.game.scene) {
                        this.game.scene.remove(flame);
                    }
                    if (flame.geometry) flame.geometry.dispose();
                    if (flame.material) flame.material.dispose();
                    this.flameTrail.splice(i, 1);
                } else {
                    // Animate flames - grow initially, then shrink
                    const lifeRatio = flameAge / this.trailDuration;
                    let scaleMultiplier;
                    
                    if (lifeRatio < 0.2) {
                        // Grow phase
                        scaleMultiplier = 1 + lifeRatio * 2;
                    } else {
                        // Shrink phase
                        scaleMultiplier = 1.4 - (lifeRatio - 0.2) * 1.4 / 0.8;
                    }
                    
                    flame.scale.set(
                        flame.userData.initialScale.x * scaleMultiplier,
                        flame.userData.initialScale.y * scaleMultiplier,
                        flame.userData.initialScale.z * scaleMultiplier
                    );
                    
                    // Fade out
                    flame.material.opacity = 0.7 * (1 - lifeRatio);
                    
                    // Apply damage to enemies in range of the flame
                    if (flameAge % this.burnTickRate < delta && this.game && this.game.enemyManager) {
                        const enemies = this.game.enemyManager.getEnemiesInRadius(
                            flame.position,
                            flame.scale.x
                        );
                        
                        enemies.forEach(enemy => {
                            // IMPORTANT: THIS CHECKED BY COLLISIONMANAGER
                            // enemy.takeDamage(this.trailDamage);
                            
                            // Apply burn status effect if available
                            if (enemy.addStatusEffect) {
                                enemy.addStatusEffect('burn', 1.0); // 1 second burn
                            }
                        });
                    }
                }
            }
        }
    }
    
    /**
     * Override damage application to include burn effect
     * @param {Enemy} enemy - The enemy to damage
     * @param {number} amount - The amount of damage to deal
     */
    applyDamage(enemy, amount) {
        // Apply base damage
        super.applyDamage(enemy, amount);
        
        // Apply burn effect
        if (enemy && enemy.addStatusEffect) {
            enemy.addStatusEffect('burn', 2.0); // 2 second burn
        }
    }
    
    /**
     * Dispose of the effect and clean up resources
     */
    dispose() {
        // Clean up flame trail
        this.flameTrail.forEach(flame => {
            if (this.game && this.game.scene) {
                this.game.scene.remove(flame);
            }
            if (flame.geometry) flame.geometry.dispose();
            if (flame.material) flame.material.dispose();
        });
        this.flameTrail = [];
        
        // Clean up fire particles
        this.fireParticles = null;
        
        // Call parent dispose
        super.dispose();
    }
}