import * as THREE from 'three';
import { ExplodingPalmEffect } from '../../ExplodingPalmEffect.js';

/**
 * Effect for the Bleeding Palm variant of Exploding Palm
 * Creates a palm strike that causes enemies to bleed over time
 * Visual style: Blood droplets and crimson energy
 */
export class BleedingPalmEffect extends ExplodingPalmEffect {
    constructor(skill) {
        super(skill);
        
        // Variant-specific properties
        this.bleedingEffect = true;
        this.bleedingDamage = skill.damage * 0.2; // 20% of base damage per tick
        this.bleedingTickRate = 0.5; // Bleed every 0.5 seconds
        this.bleedingDuration = 5; // 5 seconds of bleeding
        
        // Visual properties
        this.bloodDroplets = [];
        this.bloodColor = new THREE.Color(0xaa0000); // Dark red
    }

    /**
     * Create the Bleeding Palm effect
     * @param {THREE.Vector3} position - Position to create the effect at
     * @param {THREE.Vector3} direction - Direction the effect should face
     * @returns {THREE.Group} - The created effect
     */
    create(position, direction) {
        // Create base effect first
        const effectGroup = super.create(position, direction);
        
        // Change the color of the base effect to blood color
        effectGroup.traverse(child => {
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(mat => {
                        mat.color = this.bloodColor.clone();
                    });
                } else {
                    child.material.color = this.bloodColor.clone();
                }
            }
        });
        
        // Add blood droplets
        this.addBloodDroplets(effectGroup);
        
        // Add blood trail
        this.addBloodTrail(effectGroup, direction);
        
        return effectGroup;
    }
    
    /**
     * Add blood droplets to the effect
     * @param {THREE.Group} group - The group to add blood droplets to
     */
    addBloodDroplets(group) {
        const dropletCount = 20;
        
        // Create droplet geometry
        const dropletGeometry = new THREE.SphereGeometry(0.05, 8, 8);
        const dropletMaterial = new THREE.MeshBasicMaterial({
            color: this.bloodColor,
            transparent: true,
            opacity: 0.8
        });
        
        for (let i = 0; i < dropletCount; i++) {
            const droplet = new THREE.Mesh(dropletGeometry, dropletMaterial.clone());
            
            // Random position near the center
            droplet.position.x = (Math.random() - 0.5) * 0.5;
            droplet.position.y = Math.random() * 0.5;
            droplet.position.z = (Math.random() - 0.5) * 0.5;
            
            // Store initial position for animation
            droplet.userData.initialPosition = droplet.position.clone();
            
            // Random velocity
            droplet.userData.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                Math.random() * 2,
                (Math.random() - 0.5) * 2
            );
            
            // Random size
            const scale = 0.5 + Math.random() * 1.5;
            droplet.scale.set(scale, scale, scale);
            
            group.add(droplet);
            this.bloodDroplets.push(droplet);
        }
    }
    
    /**
     * Add a blood trail to the effect
     * @param {THREE.Group} group - The group to add the blood trail to
     * @param {THREE.Vector3} direction - Direction the effect should face
     */
    addBloodTrail(group, direction) {
        // Create a trail that follows the direction of the palm strike
        const trailLength = 1.5;
        const trailWidth = 0.3;
        
        // Create a custom geometry for the trail
        const trailGeometry = new THREE.BufferGeometry();
        const vertices = [];
        const indices = [];
        const uvs = [];
        
        // Create a trail that tapers off
        const segments = 10;
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const width = trailWidth * (1 - t);
            const length = t * trailLength;
            
            // Calculate position along the direction
            const pos = new THREE.Vector3().copy(direction).multiplyScalar(length);
            
            // Add vertices for both sides of the trail
            vertices.push(
                pos.x + width, pos.y, pos.z + width,
                pos.x - width, pos.y, pos.z - width
            );
            
            // Add UVs
            uvs.push(
                t, 0,
                t, 1
            );
            
            // Add indices for triangles (except for the last segment)
            if (i < segments) {
                const baseIndex = i * 2;
                indices.push(
                    baseIndex, baseIndex + 1, baseIndex + 2,
                    baseIndex + 1, baseIndex + 3, baseIndex + 2
                );
            }
        }
        
        // Set attributes
        trailGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        trailGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
        trailGeometry.setIndex(indices);
        
        // Create material
        const trailMaterial = new THREE.MeshBasicMaterial({
            color: this.bloodColor,
            transparent: true,
            opacity: 0.6,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending
        });
        
        // Create mesh
        const trail = new THREE.Mesh(trailGeometry, trailMaterial);
        
        // Rotate to face the direction
        trail.lookAt(direction);
        
        group.add(trail);
    }
    
    /**
     * Update the Bleeding Palm effect
     * @param {number} delta - Time since last update in seconds
     */
    update(delta) {
        super.update(delta);
        
        if (this.isActive && this.effect) {
            // Animate blood droplets
            this.bloodDroplets.forEach(droplet => {
                // Apply gravity
                droplet.userData.velocity.y -= delta * 9.8;
                
                // Update position
                droplet.position.x += droplet.userData.velocity.x * delta;
                droplet.position.y += droplet.userData.velocity.y * delta;
                droplet.position.z += droplet.userData.velocity.z * delta;
                
                // Fade out over time
                droplet.material.opacity -= delta * 0.5;
                
                // Remove if it falls below the ground or fades out
                if (droplet.position.y < 0 || droplet.material.opacity <= 0) {
                    // Reset to initial position with new velocity
                    droplet.position.copy(droplet.userData.initialPosition);
                    droplet.userData.velocity = new THREE.Vector3(
                        (Math.random() - 0.5) * 2,
                        Math.random() * 2,
                        (Math.random() - 0.5) * 2
                    );
                    droplet.material.opacity = 0.8;
                }
            });
        }
    }
    
    /**
     * Apply bleeding effect to an enemy
     * @param {Enemy} enemy - The enemy to apply the effect to
     */
    applyBleedingEffect(enemy) {
        if (!enemy || !this.bleedingEffect) return;
        
        // Apply bleeding status effect
        if (enemy.addStatusEffect) {
            const bleedingEffect = {
                type: 'bleeding',
                duration: this.bleedingDuration,
                tickRate: this.bleedingTickRate,
                damagePerTick: this.bleedingDamage,
                source: 'Bleeding Palm'
            };
            
            enemy.addStatusEffect(bleedingEffect);
            
            // Create a visual effect for the bleeding
            this.createBleedingVisualEffect(enemy);
        }
    }
    
    /**
     * Create a visual effect for the bleeding status
     * @param {Enemy} enemy - The enemy to create the effect on
     */
    createBleedingVisualEffect(enemy) {
        if (!enemy || !this.skill.game) return;
        
        // Create blood particles that drip from the enemy
        const particleCount = 10;
        const particleGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        
        // Get enemy position
        const enemyPosition = enemy.getPosition();
        
        // Initialize particles at the enemy position
        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = enemyPosition.x + (Math.random() - 0.5) * 0.5;
            positions[i * 3 + 1] = enemyPosition.y + Math.random() * enemy.height;
            positions[i * 3 + 2] = enemyPosition.z + (Math.random() - 0.5) * 0.5;
        }
        
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const particleMaterial = new THREE.PointsMaterial({
            color: this.bloodColor,
            size: 0.1,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });
        
        const particles = new THREE.Points(particleGeometry, particleMaterial);
        
        // Add to scene
        this.skill.game.scene.add(particles);
        
        // Animate the particles
        const velocities = [];
        for (let i = 0; i < particleCount; i++) {
            velocities.push({
                x: (Math.random() - 0.5) * 0.2,
                y: -Math.random() * 0.5 - 0.5,
                z: (Math.random() - 0.5) * 0.2
            });
        }
        
        let elapsed = 0;
        const duration = 2; // 2 seconds
        
        const animate = () => {
            const delta = 1/60; // Assume 60fps
            elapsed += delta;
            
            // Update particle positions
            const positions = particles.geometry.attributes.position.array;
            
            for (let i = 0; i < particleCount; i++) {
                // Apply velocity
                positions[i * 3] += velocities[i].x;
                positions[i * 3 + 1] += velocities[i].y;
                positions[i * 3 + 2] += velocities[i].z;
                
                // Apply gravity
                velocities[i].y -= delta * 0.5;
            }
            
            particles.geometry.attributes.position.needsUpdate = true;
            
            // Fade out
            particles.material.opacity = 0.8 * (1 - elapsed / duration);
            
            if (elapsed < duration) {
                requestAnimationFrame(animate);
            } else {
                // Remove particles
                this.skill.game.scene.remove(particles);
                particles.geometry.dispose();
                particles.material.dispose();
            }
        };
        
        animate();
    }
    
    /**
     * Override the damage application to add bleeding effect
     * @param {Enemy} enemy - The enemy to damage
     * @param {number} amount - The amount of damage to deal
     */
    applyDamage(enemy, amount) {
        // Apply base damage
        super.applyDamage(enemy, amount);
        
        // Apply bleeding effect
        this.applyBleedingEffect(enemy);
    }
    
    /**
     * Dispose of the effect and clean up resources
     */
    dispose() {
        // Clear arrays
        this.bloodDroplets = [];
        
        // Call parent dispose
        super.dispose();
    }
}