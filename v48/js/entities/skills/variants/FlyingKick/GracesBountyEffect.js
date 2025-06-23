import * as THREE from 'three';
import { FlyingKickEffect } from '../../FlyingKickEffect.js';

/**
 * Effect for the Grace's Bounty variant of Flying Kick
 * Creates a spinning kick effect that can hit multiple enemies
 * Visual style: Green energy with spiral patterns
 */
export class GracesBountyEffect extends FlyingKickEffect {
    constructor(skill) {
        super(skill);
        
        // Variant-specific properties
        this.spinRadius = 3; // Radius of the spin effect
        this.spinDuration = 0.8; // Duration of the spin in seconds
        this.hitEnemies = new Set(); // Track enemies that have been hit
        
        // Visual properties
        this.graceColor = new THREE.Color(0x66cc66); // Green for grace
        this.spiralParticles = null;
        this.spinTrail = null;
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
        
        // Clear hit enemies set
        this.hitEnemies.clear();
        
        // Modify base effect colors
        if (effectObject.trail) {
            effectObject.trail.traverse(child => {
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(mat => {
                            mat.color = this.graceColor.clone();
                        });
                    } else {
                        child.material.color = this.graceColor.clone();
                    }
                }
            });
        }
        
        // Add spin trail effect
        this.addSpinTrailEffect(effectObject);
        
        // Add spiral particles
        this.addSpiralParticles(effectObject);
        
        // Store target position for spin effect
        effectObject.spinTargetPosition = targetPosition.clone();
        // Use clock instead of time for getting elapsed time
        effectObject.spinStartTime = this.skill.game && this.skill.game.clock ? this.skill.game.clock.getElapsedTime() : 0;
        effectObject.isSpinning = false;
        
        return effectObject;
    }
    
    /**
     * Add spin trail effect to the flying kick
     * @param {Object} effectObject - The effect object to add trail to
     */
    addSpinTrailEffect(effectObject) {
        if (!effectObject.player || !this.skill.game.scene) return;
        
        // Create a circular trail for the spin
        const trailPoints = [];
        const segments = 32;
        
        for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            trailPoints.push(new THREE.Vector3(
                Math.cos(angle) * this.spinRadius,
                0.5, // Height
                Math.sin(angle) * this.spinRadius
            ));
        }
        
        const trailGeometry = new THREE.BufferGeometry().setFromPoints(trailPoints);
        const trailMaterial = new THREE.LineBasicMaterial({
            color: this.graceColor,
            transparent: true,
            opacity: 0,
            blending: THREE.AdditiveBlending
        });
        
        const trail = new THREE.Line(trailGeometry, trailMaterial);
        
        // Add to scene (not to player, as it should stay in place during spin)
        this.skill.game.scene.add(trail);
        
        // Store for animation
        this.spinTrail = {
            line: trail,
            material: trailMaterial,
            geometry: trailGeometry
        };
    }
    
    /**
     * Add spiral particles to the effect
     * @param {Object} effectObject - The effect object to add particles to
     */
    addSpiralParticles(effectObject) {
        if (!effectObject.player || !this.skill.game.scene) return;
        
        // Create spiral particles
        const particleCount = 100;
        const particleGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        
        for (let i = 0; i < particleCount; i++) {
            // Start at player position
            positions[i * 3] = 0;
            positions[i * 3 + 1] = 0.5; // Slightly above player
            positions[i * 3 + 2] = 0;
            
            // Grace color with variations
            const colorVariation = 0.8 + Math.random() * 0.2;
            colors[i * 3] = this.graceColor.r * colorVariation;
            colors[i * 3 + 1] = this.graceColor.g * colorVariation;
            colors[i * 3 + 2] = this.graceColor.b * colorVariation;
            
            // Random sizes
            sizes[i] = 0.05 + Math.random() * 0.1;
        }
        
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        const particleMaterial = new THREE.PointsMaterial({
            size: 0.1,
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
        this.spiralParticles = {
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
        
        // Check if effectObject is defined before accessing its properties
        if (!effectObject) {
            return;
        }
        
        // Check if we've reached the target and should start spinning
        if (effectObject.progress >= 1 && !effectObject.isSpinning) {
            effectObject.isSpinning = true;
            effectObject.spinStartTime = this.skill.game && this.skill.game.clock ? this.skill.game.clock.getElapsedTime() : 0;
            
            // Position spin trail at target
            if (this.spinTrail && this.spinTrail.line) {
                this.spinTrail.line.position.copy(effectObject.spinTargetPosition);
                this.spinTrail.material.opacity = 0.7;
            }
        }
        
        // Update spin effect if spinning
        if (effectObject.isSpinning) {
            this.updateSpinEffect(delta, effectObject);
        }
        
        // Update spiral particles
        this.updateSpiralParticles(delta, effectObject);
    }
    
    /**
     * Update the spin effect
     * @param {number} delta - Time since last update in seconds
     * @param {Object} effectObject - The effect object to update
     */
    updateSpinEffect(delta, effectObject) {
        if (!effectObject) return;
        
        const currentTime = this.skill.game && this.skill.game.clock ? this.skill.game.clock.getElapsedTime() : 0;
        const spinElapsed = currentTime - effectObject.spinStartTime;
        const spinProgress = Math.min(spinElapsed / this.spinDuration, 1);
        
        // Position player in a circle around the target
        if (effectObject.player && effectObject.spinTargetPosition) {
            const angle = spinProgress * Math.PI * 4; // Two full rotations
            
            const x = effectObject.spinTargetPosition.x + Math.cos(angle) * this.spinRadius;
            const z = effectObject.spinTargetPosition.z + Math.sin(angle) * this.spinRadius;
            
            effectObject.player.position.set(x, effectObject.player.position.y, z);
            
            // Rotate player to face center
            effectObject.player.lookAt(
                effectObject.spinTargetPosition.x,
                effectObject.player.position.y,
                effectObject.spinTargetPosition.z
            );
        }
        
        // Check for enemies in spin radius
        if (this.skill.game.enemyManager) {
            const enemies = this.skill.game.enemyManager.getEnemiesNearPosition(
                effectObject.spinTargetPosition,
                this.spinRadius + 1 // Slightly larger than visual radius
            );
            
            enemies.forEach(enemy => {
                // Skip enemies we've already hit
                if (this.hitEnemies.has(enemy.id)) return;
                
                // Calculate distance from player to enemy
                const enemyPosition = enemy.getPosition();
                if (!enemyPosition || !effectObject.player) return;
                
                const dx = enemyPosition.x - effectObject.player.position.x;
                const dz = enemyPosition.z - effectObject.player.position.z;
                const distance = Math.sqrt(dx * dx + dz * dz);
                
                // If close enough, hit the enemy
                if (distance < 1.5) {
                    // IMPORTANT: THIS CHECKED BY COLLISIONMANAGER
                    // Apply damage
                    // const damage = this.calculateDamage(enemy);
                    // enemy.takeDamage(damage);
                    
                    // Create impact effect
                    this.createImpactEffect(enemyPosition);
                    
                    // Mark as hit
                    this.hitEnemies.add(enemy.id);
                }
            });
        }
        
        // Fade out spin trail at the end
        if (spinProgress > 0.7 && this.spinTrail) {
            const fadeOut = (spinProgress - 0.7) / 0.3;
            this.spinTrail.material.opacity = 0.7 * (1 - fadeOut);
        }
        
        // End the effect when spin is complete
        if (spinProgress >= 1) {
            effectObject.complete = true;
        }
    }
    
    /**
     * Update the spiral particles
     * @param {number} delta - Time since last update in seconds
     * @param {Object} effectObject - The effect object to update
     */
    updateSpiralParticles(delta, effectObject) {
        if (!this.spiralParticles || !effectObject) return;
        
        // Get progress of the kick or spin
        let progress = effectObject.progress || 0;
        
        // If spinning, use spin progress
        if (effectObject.isSpinning) {
            const currentTime = this.skill.game && this.skill.game.clock ? this.skill.game.clock.getElapsedTime() : 0;
            const spinElapsed = currentTime - effectObject.spinStartTime;
            progress = Math.min(spinElapsed / this.spinDuration, 1);
        }
        
        // Animate particles based on progress
        const positions = this.spiralParticles.positions;
        const count = positions.length / 3;
        
        for (let i = 0; i < count; i++) {
            // Calculate current position
            const x = positions[i * 3];
            const y = positions[i * 3 + 1];
            const z = positions[i * 3 + 2];
            
            if (effectObject.isSpinning) {
                // During spin, create spiral patterns
                const angle = (i / count) * Math.PI * 2 + (this.skill.game && this.skill.game.clock ? this.skill.game.clock.getElapsedTime() : 0) * 5;
                const radius = 0.5 + (i / count) * 2;
                
                if (Math.random() < 0.1) {
                    positions[i * 3] = Math.cos(angle) * radius * Math.random();
                    positions[i * 3 + 1] = 0.5 + Math.random() * 0.5;
                    positions[i * 3 + 2] = Math.sin(angle) * radius * Math.random();
                } else {
                    // Add some random movement
                    positions[i * 3] += (Math.random() - 0.5) * 0.1;
                    positions[i * 3 + 1] += (Math.random() - 0.5) * 0.05;
                    positions[i * 3 + 2] += (Math.random() - 0.5) * 0.1;
                }
            } else {
                // During flight, trail behind player
                if (Math.random() < 0.1) {
                    // Occasionally reset to player position
                    positions[i * 3] = 0;
                    positions[i * 3 + 1] = 0.5 + Math.random() * 0.5;
                    positions[i * 3 + 2] = 0;
                } else {
                    // Add some random movement
                    positions[i * 3] += (Math.random() - 0.5) * 0.1;
                    positions[i * 3 + 1] += (Math.random() - 0.5) * 0.05;
                    positions[i * 3 + 2] += (Math.random() - 0.5) * 0.1;
                }
            }
        }
        
        this.spiralParticles.geometry.attributes.position.needsUpdate = true;
        
        // Fade out particles near the end
        if ((effectObject.isSpinning && progress > 0.7) || 
            (!effectObject.isSpinning && progress > 0.7)) {
            const fadeOut = (progress - 0.7) * 3.33; // 0 to 1
            this.spiralParticles.material.opacity = 0.8 * (1 - fadeOut);
        }
    }
    
    /**
     * Clean up the effect
     * @param {Object} effectObject - The effect object to clean up
     * @override
     */
    cleanup(effectObject) {
        super.cleanup(effectObject);
        
        // Clean up spin trail
        if (this.spinTrail && this.skill.game && this.skill.game.scene) {
            this.skill.game.scene.remove(this.spinTrail.line);
            this.spinTrail.geometry.dispose();
            this.spinTrail.material.dispose();
            this.spinTrail = null;
        }
        
        // Clean up spiral particles
        if (this.spiralParticles && effectObject && effectObject.player) {
            effectObject.player.remove(this.spiralParticles.points);
            this.spiralParticles.geometry.dispose();
            this.spiralParticles.material.dispose();
            this.spiralParticles = null;
        }
        
        // Clear hit enemies set
        this.hitEnemies.clear();
    }
    
    /**
     * Create impact effect when the kick hits
     * @param {THREE.Vector3} position - The position of the impact
     * @override
     */
    createImpactEffect(position) {
        super.createImpactEffect(position);
        
        // Add additional grace impact effect
        this.createGraceImpactEffect(position);
    }
    
    /**
     * Create a grace-themed impact effect
     * @param {THREE.Vector3} position - The position to create the effect at
     */
    createGraceImpactEffect(position) {
        if (!position || !this.skill.game.scene) return;
        
        // Create a spiral burst
        const particleCount = 30;
        const particleGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        
        for (let i = 0; i < particleCount; i++) {
            // Start at impact position
            positions[i * 3] = position.x;
            positions[i * 3 + 1] = position.y + 0.5; // Slightly above ground
            positions[i * 3 + 2] = position.z;
            
            // Grace color with variations
            const colorVariation = 0.8 + Math.random() * 0.2;
            colors[i * 3] = this.graceColor.r * colorVariation;
            colors[i * 3 + 1] = this.graceColor.g * colorVariation;
            colors[i * 3 + 2] = this.graceColor.b * colorVariation;
            
            // Random sizes
            sizes[i] = 0.05 + Math.random() * 0.1;
        }
        
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        const particleMaterial = new THREE.PointsMaterial({
            size: 0.1,
            transparent: true,
            opacity: 0.8,
            vertexColors: true,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true
        });
        
        const particles = new THREE.Points(particleGeometry, particleMaterial);
        
        // Add to scene
        this.skill.game.scene.add(particles);
        
        // Create a spiral ring
        const ringGeometry = new THREE.RingGeometry(0.1, 1.5, 32);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: this.graceColor,
            transparent: true,
            opacity: 0.7,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending
        });
        
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.position.copy(position);
        ring.position.y += 0.1; // Slightly above ground
        ring.rotation.x = Math.PI / 2; // Lay flat
        
        // Add to scene
        this.skill.game.scene.add(ring);
        
        // Animate the impact effect
        const startTime = this.skill.game && this.skill.game.clock ? this.skill.game.clock.getElapsedTime() : 0;
        const duration = 0.8; // 0.8 seconds
        
        const updateImpact = () => {
            const currentTime = this.skill.game && this.skill.game.clock ? this.skill.game.clock.getElapsedTime() : 0;
            const elapsed = currentTime - startTime;
            const t = elapsed / duration;
            
            if (t >= 1) {
                // Animation complete, remove effects
                this.skill.game.scene.remove(particles);
                this.skill.game.scene.remove(ring);
                
                // Dispose resources
                particleGeometry.dispose();
                particleMaterial.dispose();
                ringGeometry.dispose();
                ringMaterial.dispose();
                
                // Remove from update loop
                this.skill.game.removeFromUpdateList(updateImpact);
                return;
            }
            
            // Move particles in a spiral pattern
            const positions = particleGeometry.attributes.position.array;
            
            for (let i = 0; i < particleCount; i++) {
                // Calculate direction from center
                const dx = positions[i * 3] - position.x;
                const dy = positions[i * 3 + 1] - position.y - 0.5;
                const dz = positions[i * 3 + 2] - position.z;
                
                // Calculate distance and angle
                const distance = Math.sqrt(dx * dx + dz * dz);
                const angle = Math.atan2(dz, dx) + delta * 5; // Rotate around
                
                // Increase distance
                const newDistance = distance + delta * 2;
                
                // Update position
                positions[i * 3] = position.x + Math.cos(angle) * newDistance;
                positions[i * 3 + 1] += (Math.random() - 0.3) * 0.1; // Slight vertical movement
                positions[i * 3 + 2] = position.z + Math.sin(angle) * newDistance;
            }
            
            particleGeometry.attributes.position.needsUpdate = true;
            
            // Rotate and expand ring
            ring.rotation.z += delta * 3;
            ring.scale.set(1 + t * 2, 1 + t * 2, 1);
            
            // Fade out
            particleMaterial.opacity = 0.8 * (1 - t);
            ringMaterial.opacity = 0.7 * (1 - t);
        };
        
        // Add to update loop
        this.skill.game.addToUpdateList(updateImpact);
    }
}