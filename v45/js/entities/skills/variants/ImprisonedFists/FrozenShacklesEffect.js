import * as THREE from 'three';
import { ImprisonedFistsEffect } from '../../ImprisonedFistsEffect.js';

/**
 * Effect for the Frozen Shackles variant of Imprisoned Fists
 * Freezes enemies, dealing cold damage over time
 * Visual style: Icy blue chains with frost particles
 */
export class FrozenShacklesEffect extends ImprisonedFistsEffect {
    constructor(skill) {
        super(skill);
        
        // Variant-specific properties
        this.freezeDuration = 4; // 4 seconds of freeze
        this.coldDamagePerSecond = 5; // Cold damage per second
        this.coldDamageInterval = 0.5; // Apply cold damage every 0.5 seconds
        this.lastColdDamageTime = 0;
        
        // Visual properties
        this.frostParticles = [];
        this.iceShards = [];
    }

    /**
     * Create the Frozen Shackles effect
     * @param {THREE.Vector3} position - Position to create the effect at
     * @param {THREE.Vector3} direction - Direction the effect should face
     * @returns {THREE.Group} - The created effect
     */
    create(position, direction) {
        // Create base effect first
        const effectGroup = super.create(position, direction);
        
        // Modify the base effect color to icy blue
        effectGroup.children.forEach(child => {
            if (child.material) {
                if (child instanceof THREE.Mesh) {
                    child.material.color.set(0x88ccff); // Icy blue color
                }
            }
        });
        
        // Modify particle system colors to icy blue
        if (this.particleSystem) {
            const colors = this.particleSystem.geometry.attributes.color.array;
            const color = new THREE.Color(0x88ccff); // Icy blue color
            
            for (let i = 0; i < colors.length / 3; i++) {
                colors[i * 3] = color.r * (0.8 + Math.random() * 0.2);
                colors[i * 3 + 1] = color.g * (0.8 + Math.random() * 0.2);
                colors[i * 3 + 2] = color.b * (0.8 + Math.random() * 0.2);
            }
            
            this.particleSystem.geometry.attributes.color.needsUpdate = true;
        }
        
        // Modify ground indicator color
        if (this.groundIndicator) {
            this.groundIndicator.material.color.set(0x88ccff); // Icy blue color
        }
        
        // Add frost particles
        this.addFrostParticles(effectGroup);
        
        return effectGroup;
    }
    
    /**
     * Add frost particles to the effect
     * @param {THREE.Group} group - The group to add frost particles to
     */
    addFrostParticles(group) {
        const particleCount = 50;
        const particleGeometry = new THREE.BufferGeometry();
        
        // Create particle positions
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        
        const color = new THREE.Color(0xccffff); // Light blue/white for frost
        
        for (let i = 0; i < particleCount; i++) {
            // Random position around the beam
            const distance = Math.random() * 5; // Length of the beam
            const angle = Math.random() * Math.PI * 2; // Random angle around the beam
            const radius = (this.radius / 10) * (1 + Math.random()); // Vary the radius
            
            // Position particles in a cloud around the beam
            positions[i * 3] = Math.cos(angle) * radius;
            positions[i * 3 + 1] = Math.sin(angle) * radius;
            positions[i * 3 + 2] = distance;
            
            // Color (light blue/white with variations)
            colors[i * 3] = color.r * (0.9 + Math.random() * 0.1);
            colors[i * 3 + 1] = color.g * (0.9 + Math.random() * 0.1);
            colors[i * 3 + 2] = color.b * (0.9 + Math.random() * 0.1);
            
            // Size - smaller for frost particles
            sizes[i] = 0.1 + Math.random() * 0.2;
        }
        
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        // Create particle material
        const particleMaterial = new THREE.PointsMaterial({
            size: 0.2,
            vertexColors: true,
            transparent: true,
            opacity: 0.7,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true
        });
        
        const frostParticleSystem = new THREE.Points(particleGeometry, particleMaterial);
        group.add(frostParticleSystem);
        
        // Store for animation
        this.frostParticles.push(frostParticleSystem);
    }
    
    /**
     * Create a visual lock effect for an enemy with ice shards
     * @param {Enemy} enemy - The enemy to create a lock effect for
     */
    createLockEffect(enemy) {
        // Call the parent method to create the base lock effect
        super.createLockEffect(enemy);
        
        const enemyPosition = enemy.getPosition();
        
        // Create ice shards around the enemy
        const shardCount = 5 + Math.floor(Math.random() * 3); // 5-7 shards
        
        for (let i = 0; i < shardCount; i++) {
            // Create an ice shard using a cone geometry
            const height = 0.5 + Math.random() * 0.5; // Height between 0.5 and 1.0
            const radius = 0.1 + Math.random() * 0.1; // Radius between 0.1 and 0.2
            
            const shardGeometry = new THREE.ConeGeometry(radius, height, 4); // 4-sided cone for shard look
            const shardMaterial = new THREE.MeshBasicMaterial({
                color: 0xaaddff, // Light blue for ice
                transparent: true,
                opacity: 0.8
            });
            
            const shard = new THREE.Mesh(shardGeometry, shardMaterial);
            
            // Position around the enemy
            const angle = (i / shardCount) * Math.PI * 2;
            const distance = 0.8 + Math.random() * 0.4; // Distance from enemy center
            
            shard.position.set(
                enemyPosition.x + Math.cos(angle) * distance,
                enemyPosition.y + (Math.random() * 0.5), // Vary height
                enemyPosition.z + Math.sin(angle) * distance
            );
            
            // Random rotation for variety
            shard.rotation.x = Math.random() * Math.PI;
            shard.rotation.y = Math.random() * Math.PI;
            shard.rotation.z = Math.random() * Math.PI;
            
            // Add to scene
            if (this.skill.game && this.skill.game.scene) {
                this.skill.game.scene.add(shard);
                
                // Store for cleanup
                this.iceShards.push(shard);
            }
        }
        
        // Apply freeze effect to the enemy
        this.applyFreezeEffect(enemy);
    }
    
    /**
     * Apply freeze effect to an enemy
     * @param {Enemy} enemy - The enemy to freeze
     */
    applyFreezeEffect(enemy) {
        // Apply freeze status effect to the enemy
        if (enemy.addStatusEffect) {
            enemy.addStatusEffect({
                type: 'freeze',
                duration: this.freezeDuration,
                source: 'FrozenShackles',
                // Apply cold damage over time
                onTick: (delta) => {
                    this.lastColdDamageTime += delta;
                    if (this.lastColdDamageTime >= this.coldDamageInterval) {
                        // IMPORTANT: THIS CHECKED BY COLLISIONMANAGER
                        // const damage = this.coldDamagePerSecond * this.coldDamageInterval;
                        // enemy.takeDamage(damage);
                        this.lastColdDamageTime = 0;
                        
                        // Create a frost damage visual effect
                        this.createFrostDamageEffect(enemy.getPosition());
                    }
                }
            });
        }
    }
    
    /**
     * Create a frost damage visual effect
     * @param {THREE.Vector3} position - Position to create the effect at
     */
    createFrostDamageEffect(position) {
        // Create a burst of frost particles
        const particleCount = 10;
        const particleGeometry = new THREE.BufferGeometry();
        
        // Create particle positions
        const positions = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount; i++) {
            // Random position in a sphere
            const radius = 0.3 + Math.random() * 0.3;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            
            positions[i * 3] = position.x + radius * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = position.y + radius * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = position.z + radius * Math.cos(phi);
        }
        
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        // Create particle material
        const particleMaterial = new THREE.PointsMaterial({
            color: 0xccffff,
            size: 0.2,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });
        
        const particles = new THREE.Points(particleGeometry, particleMaterial);
        
        // Add to scene
        if (this.skill.game && this.skill.game.scene) {
            this.skill.game.scene.add(particles);
            
            // Remove after a short duration
            setTimeout(() => {
                if (this.skill.game && this.skill.game.scene) {
                    this.skill.game.scene.remove(particles);
                    particleGeometry.dispose();
                    particleMaterial.dispose();
                }
            }, 500); // 0.5 seconds
        }
    }
    
    /**
     * Update the Frozen Shackles effect
     * @param {number} delta - Time since last update in seconds
     */
    update(delta) {
        super.update(delta);
        
        if (this.isActive && this.effect) {
            // Animate frost particles
            this.frostParticles.forEach(particles => {
                const positions = particles.geometry.attributes.position.array;
                const count = positions.length / 3;
                
                for (let i = 0; i < count; i++) {
                    // Swirl particles around
                    const x = positions[i * 3];
                    const y = positions[i * 3 + 1];
                    const z = positions[i * 3 + 2];
                    
                    // Rotate particles around the beam
                    const angle = Math.atan2(y, x) + (delta * (0.5 + Math.random() * 0.5));
                    const radius = Math.sqrt(x * x + y * y);
                    
                    positions[i * 3] = Math.cos(angle) * radius;
                    positions[i * 3 + 1] = Math.sin(angle) * radius;
                    
                    // Slight random movement in z direction
                    positions[i * 3 + 2] = z + (Math.random() - 0.5) * delta;
                    
                    // Reset particles that move too far
                    if (z < 0 || z > 5) {
                        positions[i * 3 + 2] = Math.random() * 5;
                    }
                }
                
                particles.geometry.attributes.position.needsUpdate = true;
            });
            
            // Animate ice shards
            this.iceShards.forEach(shard => {
                // Slight rotation for floating effect
                shard.rotation.x += delta * 0.2 * (Math.random() - 0.5);
                shard.rotation.y += delta * 0.2 * (Math.random() - 0.5);
                shard.rotation.z += delta * 0.2 * (Math.random() - 0.5);
            });
        }
    }
    
    /**
     * Dispose of the effect and clean up resources
     */
    dispose() {
        // Clean up frost particles
        this.frostParticles = [];
        
        // Clean up ice shards
        this.iceShards.forEach(shard => {
            if (this.skill.game && this.skill.game.scene) {
                this.skill.game.scene.remove(shard);
                if (shard.geometry) shard.geometry.dispose();
                if (shard.material) shard.material.dispose();
            }
        });
        this.iceShards = [];
        
        // Call parent dispose
        super.dispose();
    }
}