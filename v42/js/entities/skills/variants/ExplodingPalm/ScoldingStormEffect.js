import * as THREE from 'three';
import { ExplodingPalmEffect } from '../../ExplodingPalmEffect.js';

/**
 * Effect for the Scolding Storm variant of Exploding Palm
 * Applies a freezing effect that slows enemies and creates an icy explosion
 * Visual style: Icy blue energy with frost particles
 */
export class ScoldingStormEffect extends ExplodingPalmEffect {
    constructor(skill) {
        super(skill);
        
        // Variant-specific properties
        this.freezeDuration = 3; // Duration of freeze effect in seconds
        this.slowFactor = 0.3; // Enemies move at 30% speed when affected
        this.explosionRadius = 2; // Radius of the ice explosion
        this.explosionDamage = this.skill.damage * 0.5; // 50% of base damage for explosion
        
        // Visual properties
        this.iceColor = new THREE.Color(0x88ccff); // Light blue for ice
        this.frostParticles = [];
    }
    
    /**
     * Apply the effect to an enemy
     * @param {Enemy} enemy - The enemy to apply the effect to
     * @override
     */
    applyToEnemy(enemy) {
        // IMPORTANT: THIS CHECKED BY COLLISIONMANAGER
        // Apply base damage
        // const damage = this.calculateDamage(enemy);
        // enemy.takeDamage(damage);
        
        // Apply freeze effect
        this.applyFreezeEffect(enemy);
        
        // Create visual effect
        this.createHitEffect(enemy.getPosition());
        
        // Create ice explosion after a delay
        setTimeout(() => {
            const position = enemy.getPosition();
            if (position) {
                this.createIceExplosion(position);
            }
        }, 1000); // 1 second delay
    }
    
    /**
     * Apply a freeze effect to an enemy
     * @param {Enemy} enemy - The enemy to apply the freeze effect to
     */
    applyFreezeEffect(enemy) {
        // Add a status effect to the enemy
        if (enemy.addStatusEffect) {
            enemy.addStatusEffect({
                name: 'Scolding Storm',
                type: 'freeze',
                duration: this.freezeDuration,
                onApply: (enemy) => {
                    // Slow the enemy
                    enemy.applySpeedModifier('scolding-storm', this.slowFactor);
                    
                    // Create frost aura
                    this.createFrostAura(enemy);
                },
                onRemove: (enemy) => {
                    // Remove slow effect
                    enemy.removeSpeedModifier('scolding-storm');
                }
            });
        }
    }
    
    /**
     * Create a frost aura around a frozen enemy
     * @param {Enemy} enemy - The enemy to create the aura around
     */
    createFrostAura(enemy) {
        if (!enemy || !this.skill.game.scene) return;
        
        const enemyPosition = enemy.getPosition();
        if (!enemyPosition) return;
        
        // Create frost particles around the enemy
        const particleCount = 30;
        const particleGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        
        for (let i = 0; i < particleCount; i++) {
            // Random position in a sphere around the enemy
            const radius = 1 + Math.random() * 0.5;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            
            positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta) * 0.5 + 1; // Centered at enemy height
            positions[i * 3 + 2] = radius * Math.cos(phi);
            
            // Ice blue color with variations
            const colorVariation = 0.8 + Math.random() * 0.2;
            colors[i * 3] = this.iceColor.r * colorVariation;
            colors[i * 3 + 1] = this.iceColor.g * colorVariation;
            colors[i * 3 + 2] = this.iceColor.b * colorVariation;
            
            // Random sizes
            sizes[i] = 0.05 + Math.random() * 0.1;
        }
        
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        const particleMaterial = new THREE.PointsMaterial({
            size: 0.1,
            transparent: true,
            opacity: 0.6,
            vertexColors: true,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true
        });
        
        const particles = new THREE.Points(particleGeometry, particleMaterial);
        
        // Position at enemy
        particles.position.copy(enemyPosition);
        
        // Add to scene
        this.skill.game.scene.add(particles);
        
        // Store for animation and cleanup
        const frostParticleData = {
            particles,
            geometry: particleGeometry,
            material: particleMaterial,
            enemy,
            creationTime: this.skill.game.time.getElapsedTime()
        };
        
        this.frostParticles.push(frostParticleData);
        
        // Update frost particles
        this.updateFrostParticles();
    }
    
    /**
     * Update and remove expired frost particles
     */
    updateFrostParticles() {
        const currentTime = this.skill.game.time.getElapsedTime();
        const activeFrostParticles = [];
        
        for (let i = 0; i < this.frostParticles.length; i++) {
            const particleData = this.frostParticles[i];
            const age = currentTime - particleData.creationTime;
            
            if (age < this.freezeDuration) {
                // Still active, update position to follow enemy
                const enemyPosition = particleData.enemy.getPosition();
                if (enemyPosition) {
                    particleData.particles.position.copy(enemyPosition);
                }
                
                // Animate particles
                const positions = particleData.geometry.attributes.position.array;
                const count = positions.length / 3;
                
                for (let j = 0; j < count; j++) {
                    // Slight random movement
                    positions[j * 3] += (Math.random() - 0.5) * 0.02;
                    positions[j * 3 + 1] += (Math.random() - 0.5) * 0.02;
                    positions[j * 3 + 2] += (Math.random() - 0.5) * 0.02;
                }
                
                particleData.geometry.attributes.position.needsUpdate = true;
                
                // Pulse opacity
                particleData.material.opacity = 0.4 + 0.2 * Math.sin(age * 5);
                
                activeFrostParticles.push(particleData);
            } else {
                // Expired, remove from scene
                if (this.skill.game.scene) {
                    this.skill.game.scene.remove(particleData.particles);
                }
                
                // Dispose resources
                particleData.geometry.dispose();
                particleData.material.dispose();
            }
        }
        
        // Update the list of active frost particles
        this.frostParticles = activeFrostParticles;
        
        // Continue updating if there are still active particles
        if (this.frostParticles.length > 0) {
            requestAnimationFrame(() => this.updateFrostParticles());
        }
    }
    
    /**
     * Create an ice explosion at the specified position
     * @param {THREE.Vector3} position - The position to create the explosion at
     */
    createIceExplosion(position) {
        if (!position || !this.skill.game.scene) return;
        
        // Apply damage to enemies in explosion radius
        if (this.skill.game.enemyManager) {
            const enemies = this.skill.game.enemyManager.getEnemiesNearPosition(
                position,
                this.explosionRadius
            );
            
            enemies.forEach(enemy => {
                // IMPORTANT: THIS CHECKED BY COLLISIONMANAGER
                // Apply explosion damage
                // enemy.takeDamage(this.explosionDamage);
                
                // Apply freeze effect with shorter duration
                if (enemy.addStatusEffect) {
                    enemy.addStatusEffect({
                        name: 'Scolding Storm Explosion',
                        type: 'freeze',
                        duration: this.freezeDuration / 2,
                        onApply: (enemy) => {
                            // Slow the enemy
                            enemy.applySpeedModifier('scolding-storm-explosion', this.slowFactor);
                        },
                        onRemove: (enemy) => {
                            // Remove slow effect
                            enemy.removeSpeedModifier('scolding-storm-explosion');
                        }
                    });
                }
            });
        }
        
        // Create visual explosion effect
        
        // 1. Ice shards
        const shardCount = 20;
        const shardGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(shardCount * 3);
        const colors = new Float32Array(shardCount * 3);
        const sizes = new Float32Array(shardCount);
        
        for (let i = 0; i < shardCount; i++) {
            // Start at center
            positions[i * 3] = position.x;
            positions[i * 3 + 1] = position.y + 0.5; // Slightly above ground
            positions[i * 3 + 2] = position.z;
            
            // Ice blue color with variations
            const colorVariation = 0.8 + Math.random() * 0.2;
            colors[i * 3] = this.iceColor.r * colorVariation;
            colors[i * 3 + 1] = this.iceColor.g * colorVariation;
            colors[i * 3 + 2] = this.iceColor.b * colorVariation;
            
            // Random sizes
            sizes[i] = 0.1 + Math.random() * 0.2;
        }
        
        shardGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        shardGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        shardGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        const shardMaterial = new THREE.PointsMaterial({
            size: 0.2,
            transparent: true,
            opacity: 0.8,
            vertexColors: true,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true
        });
        
        const shards = new THREE.Points(shardGeometry, shardMaterial);
        
        // Add to scene
        this.skill.game.scene.add(shards);
        
        // 2. Frost ring
        const ringGeometry = new THREE.RingGeometry(0.1, this.explosionRadius, 32);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: this.iceColor,
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
        
        // 3. Frost mist
        const mistCount = 50;
        const mistGeometry = new THREE.BufferGeometry();
        const mistPositions = new Float32Array(mistCount * 3);
        const mistColors = new Float32Array(mistCount * 3);
        const mistSizes = new Float32Array(mistCount);
        
        for (let i = 0; i < mistCount; i++) {
            // Random position within explosion radius
            const radius = Math.random() * this.explosionRadius;
            const angle = Math.random() * Math.PI * 2;
            
            mistPositions[i * 3] = position.x + Math.cos(angle) * radius;
            mistPositions[i * 3 + 1] = position.y + Math.random() * 0.5; // Low to the ground
            mistPositions[i * 3 + 2] = position.z + Math.sin(angle) * radius;
            
            // Ice blue color with variations (more white)
            const colorVariation = 0.8 + Math.random() * 0.2;
            mistColors[i * 3] = Math.min(1, this.iceColor.r * 1.5) * colorVariation;
            mistColors[i * 3 + 1] = Math.min(1, this.iceColor.g * 1.5) * colorVariation;
            mistColors[i * 3 + 2] = Math.min(1, this.iceColor.b * 1.5) * colorVariation;
            
            // Random sizes
            mistSizes[i] = 0.2 + Math.random() * 0.3;
        }
        
        mistGeometry.setAttribute('position', new THREE.BufferAttribute(mistPositions, 3));
        mistGeometry.setAttribute('color', new THREE.BufferAttribute(mistColors, 3));
        mistGeometry.setAttribute('size', new THREE.BufferAttribute(mistSizes, 1));
        
        const mistMaterial = new THREE.PointsMaterial({
            size: 0.3,
            transparent: true,
            opacity: 0.5,
            vertexColors: true,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true
        });
        
        const mist = new THREE.Points(mistGeometry, mistMaterial);
        
        // Add to scene
        this.skill.game.scene.add(mist);
        
        // Animate the explosion
        const startTime = this.skill.game.time.getElapsedTime();
        const duration = 1.5; // 1.5 seconds
        
        const updateExplosion = () => {
            const currentTime = this.skill.game.time.getElapsedTime();
            const elapsed = currentTime - startTime;
            const t = elapsed / duration;
            
            if (t >= 1) {
                // Animation complete, remove effects
                this.skill.game.scene.remove(shards);
                this.skill.game.scene.remove(ring);
                this.skill.game.scene.remove(mist);
                
                // Dispose resources
                shardGeometry.dispose();
                shardMaterial.dispose();
                ringGeometry.dispose();
                ringMaterial.dispose();
                mistGeometry.dispose();
                mistMaterial.dispose();
                
                // Remove from update loop
                this.skill.game.removeFromUpdateList(updateExplosion);
                return;
            }
            
            // Animate ice shards - fly outward
            const shardPositions = shardGeometry.attributes.position.array;
            
            for (let i = 0; i < shardCount; i++) {
                // Calculate direction from center
                const dx = shardPositions[i * 3] - position.x;
                const dy = shardPositions[i * 3 + 1] - position.y;
                const dz = shardPositions[i * 3 + 2] - position.z;
                
                // Normalize direction
                const length = Math.sqrt(dx * dx + dy * dy + dz * dz);
                const dirX = length > 0 ? dx / length : Math.random() - 0.5;
                const dirY = length > 0 ? dy / length : Math.random() + 0.5; // Mostly upward
                const dirZ = length > 0 ? dz / length : Math.random() - 0.5;
                
                // Move outward
                const speed = 3 + Math.random() * 2;
                shardPositions[i * 3] += dirX * speed * (this.skill.game.deltaTime || 0.016);
                shardPositions[i * 3 + 1] += dirY * speed * (this.skill.game.deltaTime || 0.016);
                shardPositions[i * 3 + 2] += dirZ * speed * (this.skill.game.deltaTime || 0.016);
                
                // Apply gravity
                shardPositions[i * 3 + 1] -= 9.8 * Math.pow(t, 2) * (this.skill.game.deltaTime || 0.016);
            }
            
            shardGeometry.attributes.position.needsUpdate = true;
            
            // Fade out shards
            if (t > 0.5) {
                shardMaterial.opacity = 0.8 * (1 - (t - 0.5) / 0.5);
            }
            
            // Expand and fade ring
            ring.scale.set(t * 1.5, t * 1.5, 1);
            ringMaterial.opacity = 0.7 * (1 - t);
            
            // Animate mist - expand and fade
            mist.scale.set(1 + t * 0.5, 1 + t * 0.3, 1 + t * 0.5);
            mistMaterial.opacity = 0.5 * (1 - t);
        };
        
        // Add to update loop
        this.skill.game.addToUpdateList(updateExplosion);
    }
    
    /**
     * Create a hit effect at the specified position
     * @param {THREE.Vector3} position - The position to create the effect at
     * @override
     */
    createHitEffect(position) {
        if (!position || !this.skill.game.scene) return;
        
        // Create base hit effect
        super.createHitEffect(position);
        
        // Add additional frost burst effect
        this.createFrostBurstEffect(position);
    }
    
    /**
     * Create a frost burst effect at the specified position
     * @param {THREE.Vector3} position - The position to create the effect at
     */
    createFrostBurstEffect(position) {
        if (!position || !this.skill.game.scene) return;
        
        // Create frost particles
        const particleCount = 20;
        const particleGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        
        for (let i = 0; i < particleCount; i++) {
            // Start at hit position
            positions[i * 3] = position.x;
            positions[i * 3 + 1] = position.y + 0.5; // Slightly above ground
            positions[i * 3 + 2] = position.z;
            
            // Ice blue color with variations
            const colorVariation = 0.8 + Math.random() * 0.2;
            colors[i * 3] = this.iceColor.r * colorVariation;
            colors[i * 3 + 1] = this.iceColor.g * colorVariation;
            colors[i * 3 + 2] = this.iceColor.b * colorVariation;
            
            // Random sizes
            sizes[i] = 0.1 + Math.random() * 0.1;
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
        
        // Animate the burst
        const startTime = this.skill.game.time.getElapsedTime();
        const duration = 0.5; // 0.5 seconds
        
        const updateBurst = () => {
            const currentTime = this.skill.game.time.getElapsedTime();
            const elapsed = currentTime - startTime;
            const t = elapsed / duration;
            
            if (t >= 1) {
                // Animation complete, remove particles
                this.skill.game.scene.remove(particles);
                particleGeometry.dispose();
                particleMaterial.dispose();
                
                // Remove from update loop
                this.skill.game.removeFromUpdateList(updateBurst);
                return;
            }
            
            // Move particles outward
            const positions = particleGeometry.attributes.position.array;
            
            for (let i = 0; i < particleCount; i++) {
                // Calculate direction from center
                const dx = positions[i * 3] - position.x;
                const dy = positions[i * 3 + 1] - position.y - 0.5;
                const dz = positions[i * 3 + 2] - position.z;
                
                // Normalize direction
                const length = Math.sqrt(dx * dx + dy * dy + dz * dz);
                const dirX = length > 0 ? dx / length : Math.random() - 0.5;
                const dirY = length > 0 ? dy / length : Math.random();
                const dirZ = length > 0 ? dz / length : Math.random() - 0.5;
                
                // Move outward
                const speed = 2;
                positions[i * 3] += dirX * speed * (this.skill.game.deltaTime || 0.016);
                positions[i * 3 + 1] += dirY * speed * (this.skill.game.deltaTime || 0.016);
                positions[i * 3 + 2] += dirZ * speed * (this.skill.game.deltaTime || 0.016);
            }
            
            particleGeometry.attributes.position.needsUpdate = true;
            
            // Fade out
            particleMaterial.opacity = 0.8 * (1 - t);
        };
        
        // Add to update loop
        this.skill.game.addToUpdateList(updateBurst);
    }
    
    /**
     * Clean up resources when the effect is destroyed
     */
    destroy() {
        super.destroy();
        
        // Clean up frost particles
        this.frostParticles.forEach(particleData => {
            if (this.skill.game.scene) {
                this.skill.game.scene.remove(particleData.particles);
            }
            
            particleData.geometry.dispose();
            particleData.material.dispose();
        });
        
        this.frostParticles = [];
    }
}