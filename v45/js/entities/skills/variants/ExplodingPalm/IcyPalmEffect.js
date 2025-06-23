import * as THREE from 'three';
import { ExplodingPalmEffect } from '../../ExplodingPalmEffect.js';

/**
 * Effect for the Icy Palm variant of Exploding Palm
 * Creates a palm strike that slows enemies
 * Visual style: Ice crystals and frost effects
 */
export class IcyPalmEffect extends ExplodingPalmEffect {
    constructor(skill) {
        super(skill);
        
        // Variant-specific properties
        this.slowEffect = true;
        this.slowAmount = 0.5; // 50% slow
        this.slowDuration = 3; // 3 seconds slow
        
        // Visual properties
        this.iceCrystals = [];
        this.frostParticles = null;
        this.iceColor = new THREE.Color(0x88ccff); // Light blue
    }

    /**
     * Create the Icy Palm effect
     * @param {THREE.Vector3} position - Position to create the effect at
     * @param {THREE.Vector3} direction - Direction the effect should face
     * @returns {THREE.Group} - The created effect
     */
    create(position, direction) {
        // Create base effect first
        const effectGroup = super.create(position, direction);
        
        // Change the color of the base effect to ice color
        effectGroup.traverse(child => {
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(mat => {
                        mat.color = this.iceColor.clone();
                    });
                } else {
                    child.material.color = this.iceColor.clone();
                }
            }
        });
        
        // Add ice crystals
        this.addIceCrystals(effectGroup, direction);
        
        // Add frost particles
        this.addFrostParticles(effectGroup, direction);
        
        // Add frost trail
        this.addFrostTrail(effectGroup, direction);
        
        return effectGroup;
    }
    
    /**
     * Add ice crystals to the effect
     * @param {THREE.Group} group - The group to add ice crystals to
     * @param {THREE.Vector3} direction - Direction the effect should face
     */
    addIceCrystals(group, direction) {
        const crystalCount = 5;
        
        for (let i = 0; i < crystalCount; i++) {
            // Create an ice crystal
            const crystal = this.createIceCrystal();
            
            // Position along the direction
            const distance = 0.5 + i * 0.2;
            crystal.position.copy(direction.clone().multiplyScalar(distance));
            
            // Add some random offset
            crystal.position.x += (Math.random() - 0.5) * 0.3;
            crystal.position.y += (Math.random() - 0.5) * 0.3;
            crystal.position.z += (Math.random() - 0.5) * 0.3;
            
            // Random rotation
            crystal.rotation.x = Math.random() * Math.PI * 2;
            crystal.rotation.y = Math.random() * Math.PI * 2;
            crystal.rotation.z = Math.random() * Math.PI * 2;
            
            // Random scale
            const scale = 0.5 + Math.random() * 0.5;
            crystal.scale.set(scale, scale, scale);
            
            group.add(crystal);
            this.iceCrystals.push(crystal);
        }
    }
    
    /**
     * Create a stylized ice crystal using simple geometries
     * @returns {THREE.Group} - The created ice crystal
     */
    createIceCrystal() {
        const crystalGroup = new THREE.Group();
        
        // Create main crystal shape
        const crystalGeometry = new THREE.ConeGeometry(0.1, 0.3, 5);
        const crystalMaterial = new THREE.MeshBasicMaterial({
            color: this.iceColor,
            transparent: true,
            opacity: 0.7,
            blending: THREE.AdditiveBlending
        });
        
        const crystal = new THREE.Mesh(crystalGeometry, crystalMaterial);
        crystal.rotation.x = Math.PI; // Point upward
        crystalGroup.add(crystal);
        
        // Add a smaller crystal on top
        const topCrystalGeometry = new THREE.ConeGeometry(0.05, 0.2, 5);
        const topCrystal = new THREE.Mesh(topCrystalGeometry, crystalMaterial.clone());
        topCrystal.position.y = 0.25;
        topCrystal.rotation.x = Math.PI; // Point upward
        crystalGroup.add(topCrystal);
        
        // Add some small crystal shards
        const shardCount = 3;
        for (let i = 0; i < shardCount; i++) {
            const shardGeometry = new THREE.BoxGeometry(0.05, 0.15, 0.05);
            const shardMaterial = crystalMaterial.clone();
            shardMaterial.opacity = 0.6;
            
            const shard = new THREE.Mesh(shardGeometry, shardMaterial);
            
            // Position around the main crystal
            const angle = (i / shardCount) * Math.PI * 2;
            shard.position.x = Math.cos(angle) * 0.08;
            shard.position.z = Math.sin(angle) * 0.08;
            shard.position.y = 0.1;
            
            // Rotate outward
            shard.rotation.x = Math.PI / 6;
            shard.rotation.y = angle;
            
            crystalGroup.add(shard);
        }
        
        return crystalGroup;
    }
    
    /**
     * Add frost particles to the effect
     * @param {THREE.Group} group - The group to add frost particles to
     * @param {THREE.Vector3} direction - Direction the effect should face
     */
    addFrostParticles(group, direction) {
        const particleCount = 30;
        
        // Create particle geometry
        const particleGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        
        // Position particles along the direction
        for (let i = 0; i < particleCount; i++) {
            // Random position near the direction vector
            const distance = Math.random() * 1.5;
            const offset = new THREE.Vector3(
                (Math.random() - 0.5) * 0.5,
                (Math.random() - 0.5) * 0.5,
                (Math.random() - 0.5) * 0.5
            );
            
            const pos = direction.clone().multiplyScalar(distance).add(offset);
            
            positions[i * 3] = pos.x;
            positions[i * 3 + 1] = pos.y;
            positions[i * 3 + 2] = pos.z;
            
            // Random sizes
            sizes[i] = 0.05 + Math.random() * 0.05;
        }
        
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        // Create particle material
        const particleMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.1,
            transparent: true,
            opacity: 0.7,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true
        });
        
        // Create particles
        const particles = new THREE.Points(particleGeometry, particleMaterial);
        group.add(particles);
        
        // Store for animation
        this.frostParticles = particles;
    }
    
    /**
     * Add a frost trail to the effect
     * @param {THREE.Group} group - The group to add the frost trail to
     * @param {THREE.Vector3} direction - Direction the effect should face
     */
    addFrostTrail(group, direction) {
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
            color: this.iceColor,
            transparent: true,
            opacity: 0.5,
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
     * Update the Icy Palm effect
     * @param {number} delta - Time since last update in seconds
     */
    update(delta) {
        super.update(delta);
        
        if (this.isActive && this.effect) {
            // Animate ice crystals
            this.iceCrystals.forEach(crystal => {
                // Rotate slowly
                crystal.rotation.y += delta * 0.5;
                
                // Pulse size
                const pulseFactor = 1 + 0.1 * Math.sin(this.elapsedTime * 5);
                crystal.scale.set(
                    crystal.scale.x * pulseFactor,
                    crystal.scale.y * pulseFactor,
                    crystal.scale.z * pulseFactor
                );
                
                // Fade out over time
                crystal.traverse(child => {
                    if (child.material) {
                        child.material.opacity -= delta * 0.2;
                    }
                });
            });
            
            // Animate frost particles
            if (this.frostParticles && this.frostParticles.geometry) {
                const positions = this.frostParticles.geometry.attributes.position.array;
                const count = positions.length / 3;
                
                for (let i = 0; i < count; i++) {
                    // Add some random movement
                    positions[i * 3] += (Math.random() - 0.5) * 0.01;
                    positions[i * 3 + 1] += (Math.random() - 0.5) * 0.01;
                    positions[i * 3 + 2] += (Math.random() - 0.5) * 0.01;
                }
                
                this.frostParticles.geometry.attributes.position.needsUpdate = true;
                
                // Fade out
                this.frostParticles.material.opacity -= delta * 0.2;
            }
        }
    }
    
    /**
     * Apply slow effect to an enemy
     * @param {Enemy} enemy - The enemy to apply the effect to
     */
    applySlowEffect(enemy) {
        if (!enemy || !this.slowEffect) return;
        
        // Apply slow status effect
        if (enemy.addStatusEffect) {
            enemy.addStatusEffect('slow', this.slowDuration, this.slowAmount);
            
            // Create a visual effect for the slow
            this.createSlowVisualEffect(enemy);
        }
    }
    
    /**
     * Create a visual effect for the slow status
     * @param {Enemy} enemy - The enemy to create the effect on
     */
    createSlowVisualEffect(enemy) {
        if (!enemy || !this.skill.game) return;
        
        // Create frost particles around the enemy
        const particleCount = 20;
        const particleGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        
        // Get enemy position
        const enemyPosition = enemy.getPosition();
        const enemyRadius = enemy.radius || 0.5;
        
        // Initialize particles around the enemy
        for (let i = 0; i < particleCount; i++) {
            // Random position on the surface of the enemy
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            
            positions[i * 3] = enemyPosition.x + Math.sin(phi) * Math.cos(theta) * enemyRadius;
            positions[i * 3 + 1] = enemyPosition.y + Math.cos(phi) * enemyRadius;
            positions[i * 3 + 2] = enemyPosition.z + Math.sin(phi) * Math.sin(theta) * enemyRadius;
        }
        
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const particleMaterial = new THREE.PointsMaterial({
            color: this.iceColor,
            size: 0.1,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });
        
        const particles = new THREE.Points(particleGeometry, particleMaterial);
        
        // Add to scene
        this.skill.game.scene.add(particles);
        
        // Create a frost aura around the enemy
        const auraGeometry = new THREE.SphereGeometry(enemyRadius + 0.1, 16, 16);
        const auraMaterial = new THREE.MeshBasicMaterial({
            color: this.iceColor,
            transparent: true,
            opacity: 0.2,
            side: THREE.DoubleSide,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        
        const aura = new THREE.Mesh(auraGeometry, auraMaterial);
        aura.position.copy(enemyPosition);
        
        // Add to scene
        this.skill.game.scene.add(aura);
        
        // Animate the frost effect
        let elapsed = 0;
        const duration = this.slowDuration;
        
        const animate = () => {
            const delta = 1/60; // Assume 60fps
            elapsed += delta;
            
            // Update particle positions to follow the enemy
            if (enemy.getPosition) {
                const newPosition = enemy.getPosition();
                
                // Update aura position
                aura.position.copy(newPosition);
                
                // Update particles
                const positions = particles.geometry.attributes.position.array;
                
                for (let i = 0; i < particleCount; i++) {
                    // Random position on the surface of the enemy
                    const theta = Math.random() * Math.PI * 2;
                    const phi = Math.random() * Math.PI;
                    
                    positions[i * 3] = newPosition.x + Math.sin(phi) * Math.cos(theta) * enemyRadius;
                    positions[i * 3 + 1] = newPosition.y + Math.cos(phi) * enemyRadius;
                    positions[i * 3 + 2] = newPosition.z + Math.sin(phi) * Math.sin(theta) * enemyRadius;
                }
                
                particles.geometry.attributes.position.needsUpdate = true;
            }
            
            // Pulse the aura
            const pulseFactor = 1 + 0.1 * Math.sin(elapsed * 5);
            aura.scale.set(pulseFactor, pulseFactor, pulseFactor);
            
            // Fade out near the end
            if (elapsed > duration * 0.7) {
                const fadeRatio = 1 - (elapsed - duration * 0.7) / (duration * 0.3);
                particles.material.opacity = 0.8 * fadeRatio;
                aura.material.opacity = 0.2 * fadeRatio;
            }
            
            if (elapsed < duration) {
                requestAnimationFrame(animate);
            } else {
                // Remove effects
                this.skill.game.scene.remove(particles);
                this.skill.game.scene.remove(aura);
                particles.geometry.dispose();
                particles.material.dispose();
                aura.geometry.dispose();
                aura.material.dispose();
            }
        };
        
        animate();
    }
    
    /**
     * Override the damage application to add slow effect
     * @param {Enemy} enemy - The enemy to damage
     * @param {number} amount - The amount of damage to deal
     */
    applyDamage(enemy, amount) {
        // Apply base damage
        super.applyDamage(enemy, amount);
        
        // Apply slow effect
        this.applySlowEffect(enemy);
    }
    
    /**
     * Dispose of the effect and clean up resources
     */
    dispose() {
        // Clear arrays
        this.iceCrystals = [];
        this.frostParticles = null;
        
        // Call parent dispose
        super.dispose();
    }
}