import * as THREE from 'three';
import { ExplodingPalmEffect } from '../../ExplodingPalmEffect.js';

/**
 * Effect for the Breath of Incense variant of Exploding Palm
 * Creates a concussive blast that stuns enemies and deals area damage
 * Visual style: Golden energy with smoke-like particles
 */
export class BreathOfIncenseEffect extends ExplodingPalmEffect {
    constructor(skill) {
        super(skill);
        
        // Variant-specific properties
        this.stunDuration = 2; // Duration of stun effect in seconds
        this.blastRadius = 3; // Radius of the concussive blast
        this.areaDamage = this.skill.damage * 0.4; // 40% of base damage for area effect
        
        // Visual properties
        this.incenseColor = new THREE.Color(0xffcc66); // Golden color for incense
        this.smokeParticles = null;
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
        
        // // Create concussive blast
        // const position = enemy.getPosition();
        // if (position) {
        //     this.createConcussiveBlast(position);
        // }
        
        // Create visual effect
        this.createHitEffect(position);
    }
    
    /**
     * Create a concussive blast at the specified position
     * @param {THREE.Vector3} position - The position to create the blast at
     */
    createConcussiveBlast(position) {
        if (!position || !this.skill.game.scene) return;
        
        // Apply damage and stun to enemies in blast radius
        if (this.skill.game.enemyManager) {
            const enemies = this.skill.game.enemyManager.getEnemiesNearPosition(
                position,
                this.blastRadius
            );
            
            enemies.forEach(enemy => {
                // IMPORTANT: THIS CHECKED BY COLLISIONMANAGER
                // Apply area damage
                // enemy.takeDamage(this.areaDamage);
                
                // Apply stun effect
                if (enemy.addStatusEffect) {
                    enemy.addStatusEffect({
                        name: 'Breath of Incense',
                        type: 'stun',
                        duration: this.stunDuration,
                        onApply: (enemy) => {
                            // Stun the enemy
                            enemy.stun(this.stunDuration);
                            
                            // Create incense aura
                            this.createIncenseAura(enemy);
                        }
                    });
                }
            });
        }
        
        // Create visual blast effect
        
        // 1. Blast ring
        const ringGeometry = new THREE.RingGeometry(0.1, this.blastRadius, 32);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: this.incenseColor,
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
        
        // 2. Smoke particles
        const particleCount = 50;
        const particleGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        
        for (let i = 0; i < particleCount; i++) {
            // Start at center
            positions[i * 3] = position.x;
            positions[i * 3 + 1] = position.y + 0.2; // Slightly above ground
            positions[i * 3 + 2] = position.z;
            
            // Golden color with variations
            const colorVariation = 0.8 + Math.random() * 0.2;
            colors[i * 3] = this.incenseColor.r * colorVariation;
            colors[i * 3 + 1] = this.incenseColor.g * colorVariation;
            colors[i * 3 + 2] = this.incenseColor.b * colorVariation;
            
            // Random sizes
            sizes[i] = 0.2 + Math.random() * 0.3;
        }
        
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        const particleMaterial = new THREE.PointsMaterial({
            size: 0.3,
            transparent: true,
            opacity: 0.6,
            vertexColors: true,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true
        });
        
        const particles = new THREE.Points(particleGeometry, particleMaterial);
        
        // Add to scene
        this.skill.game.scene.add(particles);
        
        // Store for animation
        this.smokeParticles = particles;
        
        // Animate the blast
        const startTime = this.skill.game.time.getElapsedTime();
        const duration = 2; // 2 seconds
        
        const updateBlast = () => {
            const currentTime = this.skill.game.time.getElapsedTime();
            const elapsed = currentTime - startTime;
            const t = elapsed / duration;
            
            if (t >= 1) {
                // Animation complete, remove effects
                this.skill.game.scene.remove(ring);
                this.skill.game.scene.remove(particles);
                
                // Dispose resources
                ringGeometry.dispose();
                ringMaterial.dispose();
                particleGeometry.dispose();
                particleMaterial.dispose();
                
                // Clear reference
                this.smokeParticles = null;
                
                // Remove from update loop
                this.skill.game.removeFromUpdateList(updateBlast);
                return;
            }
            
            // Expand and fade ring
            ring.scale.set(1 + t, 1 + t, 1);
            ringMaterial.opacity = 0.7 * (1 - t);
            
            // Animate smoke particles
            const positions = particleGeometry.attributes.position.array;
            
            for (let i = 0; i < particleCount; i++) {
                // Calculate direction from center
                const dx = positions[i * 3] - position.x;
                const dy = positions[i * 3 + 1] - position.y;
                const dz = positions[i * 3 + 2] - position.z;
                
                // Normalize direction
                const length = Math.sqrt(dx * dx + dy * dy + dz * dz);
                const dirX = length > 0 ? dx / length : Math.random() - 0.5;
                const dirY = length > 0 ? dy / length : Math.random();
                const dirZ = length > 0 ? dz / length : Math.random() - 0.5;
                
                // Move outward and upward
                const speed = 1 + Math.random();
                positions[i * 3] += dirX * speed * (this.skill.game.deltaTime || 0.016);
                positions[i * 3 + 1] += (dirY * speed + 0.5) * (this.skill.game.deltaTime || 0.016); // Extra upward movement
                positions[i * 3 + 2] += dirZ * speed * (this.skill.game.deltaTime || 0.016);
            }
            
            particleGeometry.attributes.position.needsUpdate = true;
            
            // Fade out particles
            particleMaterial.opacity = 0.6 * (1 - t);
            
            // Increase particle size over time (smoke spreading)
            particleMaterial.size = 0.3 * (1 + t);
        };
        
        // Add to update loop
        this.skill.game.addToUpdateList(updateBlast);
    }
    
    /**
     * Create an incense aura around a stunned enemy
     * @param {Enemy} enemy - The enemy to create the aura around
     */
    createIncenseAura(enemy) {
        if (!enemy || !this.skill.game.scene) return;
        
        const enemyPosition = enemy.getPosition();
        if (!enemyPosition) return;
        
        // Create incense smoke particles around the enemy
        const particleCount = 20;
        const particleGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        
        for (let i = 0; i < particleCount; i++) {
            // Random position near the enemy
            const radius = 0.5 + Math.random() * 0.5;
            const angle = Math.random() * Math.PI * 2;
            
            positions[i * 3] = Math.cos(angle) * radius;
            positions[i * 3 + 1] = Math.random() * 2; // Varied height
            positions[i * 3 + 2] = Math.sin(angle) * radius;
            
            // Golden color with variations
            const colorVariation = 0.8 + Math.random() * 0.2;
            colors[i * 3] = this.incenseColor.r * colorVariation;
            colors[i * 3 + 1] = this.incenseColor.g * colorVariation;
            colors[i * 3 + 2] = this.incenseColor.b * colorVariation;
            
            // Random sizes
            sizes[i] = 0.1 + Math.random() * 0.2;
        }
        
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        const particleMaterial = new THREE.PointsMaterial({
            size: 0.2,
            transparent: true,
            opacity: 0.5,
            vertexColors: true,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true
        });
        
        const particles = new THREE.Points(particleGeometry, particleMaterial);
        
        // Position at enemy
        particles.position.copy(enemyPosition);
        
        // Add to scene
        this.skill.game.scene.add(particles);
        
        // Animate the incense aura
        const startTime = this.skill.game.time.getElapsedTime();
        
        const updateIncenseAura = () => {
            const currentTime = this.skill.game.time.getElapsedTime();
            const elapsed = currentTime - startTime;
            
            // Remove when stun duration is over
            if (elapsed >= this.stunDuration) {
                this.skill.game.scene.remove(particles);
                particleGeometry.dispose();
                particleMaterial.dispose();
                
                // Remove from update loop
                this.skill.game.removeFromUpdateList(updateIncenseAura);
                return;
            }
            
            // Update enemy position
            const newPosition = enemy.getPosition();
            if (newPosition) {
                particles.position.copy(newPosition);
            }
            
            // Animate particles
            const positions = particleGeometry.attributes.position.array;
            
            for (let i = 0; i < particleCount; i++) {
                // Spiral upward movement
                const x = positions[i * 3];
                const y = positions[i * 3 + 1];
                const z = positions[i * 3 + 2];
                
                const angle = Math.atan2(z, x);
                const distance = Math.sqrt(x * x + z * z);
                
                // Rotate around and move upward
                const newAngle = angle + (this.skill.game.deltaTime || 0.016) * 2;
                
                positions[i * 3] = Math.cos(newAngle) * distance;
                positions[i * 3 + 1] = y + (this.skill.game.deltaTime || 0.016) * 0.5;
                positions[i * 3 + 2] = Math.sin(newAngle) * distance;
                
                // Reset particles that go too high
                if (y > 3 || Math.random() < 0.01) {
                    const newRadius = 0.5 + Math.random() * 0.5;
                    const newAngle = Math.random() * Math.PI * 2;
                    
                    positions[i * 3] = Math.cos(newAngle) * newRadius;
                    positions[i * 3 + 1] = Math.random() * 0.5;
                    positions[i * 3 + 2] = Math.sin(newAngle) * newRadius;
                }
            }
            
            particleGeometry.attributes.position.needsUpdate = true;
        };
        
        // Add to update loop
        this.skill.game.addToUpdateList(updateIncenseAura);
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
        
        // Add additional incense burst effect
        this.createIncenseBurstEffect(position);
    }
    
    /**
     * Create an incense burst effect at the specified position
     * @param {THREE.Vector3} position - The position to create the effect at
     */
    createIncenseBurstEffect(position) {
        if (!position || !this.skill.game.scene) return;
        
        // Create a burst of incense particles
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
            
            // Golden color with variations
            const colorVariation = 0.8 + Math.random() * 0.2;
            colors[i * 3] = this.incenseColor.r * colorVariation;
            colors[i * 3 + 1] = this.incenseColor.g * colorVariation;
            colors[i * 3 + 2] = this.incenseColor.b * colorVariation;
            
            // Random sizes
            sizes[i] = 0.1 + Math.random() * 0.1;
        }
        
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        const particleMaterial = new THREE.PointsMaterial({
            size: 0.1,
            transparent: true,
            opacity: 0.7,
            vertexColors: true,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true
        });
        
        const particles = new THREE.Points(particleGeometry, particleMaterial);
        
        // Add to scene
        this.skill.game.scene.add(particles);
        
        // Animate the burst
        const startTime = this.skill.game.time.getElapsedTime();
        const duration = 0.8; // 0.8 seconds
        
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
                const speed = 1.5;
                positions[i * 3] += dirX * speed * (this.skill.game.deltaTime || 0.016);
                positions[i * 3 + 1] += (dirY * speed + 1) * (this.skill.game.deltaTime || 0.016); // Extra upward movement
                positions[i * 3 + 2] += dirZ * speed * (this.skill.game.deltaTime || 0.016);
            }
            
            particleGeometry.attributes.position.needsUpdate = true;
            
            // Fade out
            particleMaterial.opacity = 0.7 * (1 - t);
        };
        
        // Add to update loop
        this.skill.game.addToUpdateList(updateBurst);
    }
    
    /**
     * Clean up resources when the effect is destroyed
     */
    destroy() {
        super.destroy();
        
        // Clean up smoke particles
        if (this.smokeParticles && this.skill.game.scene) {
            this.skill.game.scene.remove(this.smokeParticles);
            
            if (this.smokeParticles.geometry) {
                this.smokeParticles.geometry.dispose();
            }
            
            if (this.smokeParticles.material) {
                this.smokeParticles.material.dispose();
            }
            
            this.smokeParticles = null;
        }
    }
}