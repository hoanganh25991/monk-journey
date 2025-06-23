import * as THREE from 'three';
import { FlyingKickEffect } from '../../FlyingKickEffect.js';

/**
 * Effect for the Shadow Kick variant of Flying Kick
 * Leaves a shadow clone that continues to attack enemies for a short duration
 * Visual style: Dark, shadowy figure with trailing particles
 */
export class ShadowKickEffect extends FlyingKickEffect {
    constructor(skill) {
        super(skill);
        
        // Variant-specific properties
        this.shadowCloneDuration = 3; // Duration the shadow clone remains active
        this.shadowCloneAttackInterval = 0.5; // Time between clone attacks
        this.shadowCloneDamageMultiplier = 0.5; // Clone deals 50% of original damage
        
        // Visual properties
        this.shadowClone = null;
        this.shadowParticles = null;
        this.shadowColor = new THREE.Color(0x220033);
        this.lastCloneAttackTime = 0;
        this.cloneCreated = false;
    }

    /**
     * Create the Shadow Kick effect
     * @param {THREE.Vector3} position - Position to create the effect at
     * @param {THREE.Vector3} direction - Direction the effect should face
     * @returns {THREE.Group} - The created effect
     */
    create(position, direction) {
        // Create base effect first
        const effectGroup = super.create(position, direction);
        
        // Add shadow trail
        this.addShadowTrail(effectGroup);
        
        // Change the color of the base effect to be more shadowy
        effectGroup.traverse(child => {
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(mat => {
                        mat.color.lerp(this.shadowColor, 0.7);
                    });
                } else {
                    child.material.color.lerp(this.shadowColor, 0.7);
                }
            }
        });
        
        return effectGroup;
    }
    
    /**
     * Add shadow trail to the effect
     * @param {THREE.Group} group - The group to add the trail to
     */
    addShadowTrail(group) {
        // Create shadow particles
        const particleCount = 100;
        const particleGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        
        for (let i = 0; i < particleCount; i++) {
            // Random position within a small area behind the monk
            positions[i * 3] = (Math.random() - 0.5) * 1;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 1;
            positions[i * 3 + 2] = -Math.random() * 3;
            
            // Random sizes
            sizes[i] = 0.05 + Math.random() * 0.1;
        }
        
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        // Create particle material
        const particleMaterial = new THREE.PointsMaterial({
            color: this.shadowColor,
            size: 0.1,
            transparent: true,
            opacity: 0.7,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true
        });
        
        // Create particle system
        const particles = new THREE.Points(particleGeometry, particleMaterial);
        group.add(particles);
        
        // Store for animation
        this.shadowParticles = particles;
    }
    
    /**
     * Create a shadow clone at the current position
     */
    createShadowClone() {
        if (!this.effect || this.cloneCreated) return;
        
        // Create a copy of the monk model for the shadow clone
        // For simplicity, we'll use a simple mesh as a placeholder
        const cloneGeometry = new THREE.BoxGeometry(0.5, 1.5, 0.5);
        const cloneMaterial = new THREE.MeshBasicMaterial({
            color: this.shadowColor,
            transparent: true,
            opacity: 0.7
        });
        
        const clone = new THREE.Mesh(cloneGeometry, cloneMaterial);
        clone.position.copy(this.position);
        
        // Add to scene rather than effect group so it stays in place
        if (this.game && this.game.scene) {
            this.game.scene.add(clone);
            
            // Store for animation and cleanup
            this.shadowClone = clone;
            this.cloneCreated = true;
            
            // Store creation time
            this.shadowClone.userData.creationTime = this.elapsedTime;
            
            // Add shadow particles to the clone
            this.addCloneParticles(clone);
        }
    }
    
    /**
     * Add particles to the shadow clone
     * @param {THREE.Object3D} clone - The clone to add particles to
     */
    addCloneParticles(clone) {
        const particleCount = 50;
        const particleGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount; i++) {
            // Random position around the clone
            positions[i * 3] = (Math.random() - 0.5) * 1;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 1.5;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 1;
        }
        
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const particleMaterial = new THREE.PointsMaterial({
            color: this.shadowColor,
            size: 0.1,
            transparent: true,
            opacity: 0.5,
            blending: THREE.AdditiveBlending
        });
        
        const particles = new THREE.Points(particleGeometry, particleMaterial);
        clone.add(particles);
        
        // Store in userData for animation
        clone.userData.particles = particles;
    }
    
    /**
     * Make the shadow clone attack nearby enemies
     */
    shadowCloneAttack() {
        if (!this.shadowClone || !this.game || !this.game.enemyManager) return;
        
        // Get enemies in range of the clone
        const enemies = this.game.enemyManager.getEnemiesInRadius(
            this.shadowClone.position,
            this.skill.radius
        );
        
        // Attack each enemy
        enemies.forEach(enemy => {
            if (!enemy) return;
            
            // IMPORTANT: THIS CHECKED BY COLLISIONMANAGER
            // Apply damage with reduced multiplier
            // const damage = this.skill.damage * this.shadowCloneDamageMultiplier;
            // enemy.takeDamage(damage);
            
            // Visual feedback for the attack
            this.createCloneAttackEffect(this.shadowClone.position, enemy.position);
        });
        
        // Update last attack time
        this.lastCloneAttackTime = this.elapsedTime;
    }
    
    /**
     * Create a visual effect for the clone's attack
     * @param {THREE.Vector3} startPos - Starting position of the attack
     * @param {THREE.Vector3} endPos - Target position of the attack
     */
    createCloneAttackEffect(startPos, endPos) {
        if (!this.game || !this.game.scene) return;
        
        // Create a line between the clone and the enemy
        const lineGeometry = new THREE.BufferGeometry().setFromPoints([
            startPos,
            endPos
        ]);
        
        const lineMaterial = new THREE.LineBasicMaterial({
            color: this.shadowColor,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });
        
        const line = new THREE.Line(lineGeometry, lineMaterial);
        this.game.scene.add(line);
        
        // Store creation time for removal
        line.userData.creationTime = this.elapsedTime;
        
        // Add to a list for cleanup
        if (!this.attackLines) this.attackLines = [];
        this.attackLines.push(line);
    }
    
    /**
     * Update the Shadow Kick effect
     * @param {number} delta - Time since last update in seconds
     */
    update(delta) {
        super.update(delta);
        
        if (this.isActive) {
            // Create shadow clone when the kick is halfway through
            if (!this.cloneCreated && this.elapsedTime >= this.skill.duration * 0.5) {
                this.createShadowClone();
            }
            
            // Update shadow particles
            if (this.shadowParticles && this.shadowParticles.geometry) {
                const positions = this.shadowParticles.geometry.attributes.position.array;
                const count = positions.length / 3;
                
                for (let i = 0; i < count; i++) {
                    // Move particles backward
                    positions[i * 3 + 2] -= delta * 2;
                    
                    // If particle goes too far back, reset it
                    if (positions[i * 3 + 2] < -5) {
                        positions[i * 3 + 2] = -Math.random() * 2;
                    }
                }
                
                this.shadowParticles.geometry.attributes.position.needsUpdate = true;
            }
            
            // Update shadow clone
            if (this.shadowClone) {
                const cloneAge = this.elapsedTime - this.shadowClone.userData.creationTime;
                
                // Check if clone should be removed
                if (cloneAge >= this.shadowCloneDuration) {
                    // Remove clone
                    if (this.game && this.game.scene) {
                        this.game.scene.remove(this.shadowClone);
                    }
                    this.shadowClone = null;
                } else {
                    // Make clone attack periodically
                    if (this.elapsedTime - this.lastCloneAttackTime >= this.shadowCloneAttackInterval) {
                        this.shadowCloneAttack();
                    }
                    
                    // Fade out clone as it ages
                    const fadeRatio = 1 - (cloneAge / this.shadowCloneDuration);
                    if (this.shadowClone.material) {
                        this.shadowClone.material.opacity = 0.7 * fadeRatio;
                    }
                    
                    // Animate clone particles
                    if (this.shadowClone.userData.particles) {
                        const particles = this.shadowClone.userData.particles;
                        if (particles.geometry && particles.geometry.attributes.position) {
                            const positions = particles.geometry.attributes.position.array;
                            const count = positions.length / 3;
                            
                            for (let i = 0; i < count; i++) {
                                // Random movement
                                positions[i * 3] += (Math.random() - 0.5) * 0.1;
                                positions[i * 3 + 1] += (Math.random() - 0.5) * 0.1;
                                positions[i * 3 + 2] += (Math.random() - 0.5) * 0.1;
                            }
                            
                            particles.geometry.attributes.position.needsUpdate = true;
                        }
                        
                        // Update opacity
                        if (particles.material) {
                            particles.material.opacity = 0.5 * fadeRatio;
                        }
                    }
                }
            }
            
            // Update attack lines
            if (this.attackLines) {
                for (let i = this.attackLines.length - 1; i >= 0; i--) {
                    const line = this.attackLines[i];
                    const lineAge = this.elapsedTime - line.userData.creationTime;
                    
                    // Remove lines after 0.3 seconds
                    if (lineAge >= 0.3) {
                        if (this.game && this.game.scene) {
                            this.game.scene.remove(line);
                        }
                        if (line.geometry) line.geometry.dispose();
                        if (line.material) line.material.dispose();
                        this.attackLines.splice(i, 1);
                    } else {
                        // Fade out
                        if (line.material) {
                            line.material.opacity = 0.8 * (1 - lineAge / 0.3);
                        }
                    }
                }
            }
        }
    }
    
    /**
     * Dispose of the effect and clean up resources
     */
    dispose() {
        // Clean up shadow clone
        if (this.shadowClone) {
            if (this.game && this.game.scene) {
                this.game.scene.remove(this.shadowClone);
            }
            if (this.shadowClone.geometry) this.shadowClone.geometry.dispose();
            if (this.shadowClone.material) this.shadowClone.material.dispose();
            this.shadowClone = null;
        }
        
        // Clean up attack lines
        if (this.attackLines) {
            this.attackLines.forEach(line => {
                if (this.game && this.game.scene) {
                    this.game.scene.remove(line);
                }
                if (line.geometry) line.geometry.dispose();
                if (line.material) line.material.dispose();
            });
            this.attackLines = [];
        }
        
        // Clean up shadow particles
        this.shadowParticles = null;
        
        // Reset flags
        this.cloneCreated = false;
        
        // Call parent dispose
        super.dispose();
    }
}