import * as THREE from 'three';
import { ExplodingPalmEffect } from '../../ExplodingPalmEffect.js';

/**
 * Effect for the Path of the Present variant of Exploding Palm
 * Creates a fiery explosion that deals high damage and leaves a burning area
 * Visual style: Intense fire and ember particles
 */
export class PathOfThePresentEffect extends ExplodingPalmEffect {
    constructor(skill) {
        super(skill);
        
        // Variant-specific properties
        this.burnDuration = 4; // Duration of burn effect in seconds
        this.burnDamagePerSecond = this.skill.damage * 0.25; // 25% of base damage per second
        this.explosionRadius = 2.5; // Radius of the fire explosion
        this.burnAreaRadius = 3; // Radius of the burning area
        this.burnAreaDuration = 6; // Duration of the burning area in seconds
        
        // Visual properties
        this.fireColor = new THREE.Color(0xff6600); // Orange for fire
        this.emberColor = new THREE.Color(0xff9900); // Bright orange for embers
        this.fireParticles = [];
        this.burnAreaEffect = null;
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
        
        // Apply burn effect
        this.applyBurnEffect(enemy);
        
        // Create visual effect
        const position = enemy.getPosition();
        this.createHitEffect(position);
        
        // Create fire explosion
        if (position) {
            this.createFireExplosion(position);
            
            // Create burning area
            this.createBurningArea(position);
        }
    }
    
    /**
     * Apply a burn effect to an enemy
     * @param {Enemy} enemy - The enemy to apply the burn effect to
     */
    applyBurnEffect(enemy) {
        // Add a status effect to the enemy
        if (enemy.addStatusEffect) {
            enemy.addStatusEffect({
                name: 'Path of the Present',
                type: 'burn',
                duration: this.burnDuration,
                tickInterval: 0.5, // Apply damage every 0.5 seconds
                onTick: (enemy, deltaTime) => {
                    // IMPORTANT: THIS CHECKED BY COLLISIONMANAGER
                    // Apply burn damage
                    // const burnDamage = this.burnDamagePerSecond * deltaTime;
                    // enemy.takeDamage(burnDamage);
                    
                    // Create fire effect on enemy
                    if (Math.random() < deltaTime * 2) {
                        const position = enemy.getPosition();
                        if (position) {
                            this.createFireEffect(position);
                        }
                    }
                },
                onApply: (enemy) => {
                    // Create fire aura
                    this.createFireAura(enemy);
                }
            });
        }
    }
    
    /**
     * Create a fire aura around a burning enemy
     * @param {Enemy} enemy - The enemy to create the aura around
     */
    createFireAura(enemy) {
        if (!enemy || !this.skill.game.scene) return;
        
        const enemyPosition = enemy.getPosition();
        if (!enemyPosition) return;
        
        // Create fire particles around the enemy
        const particleCount = 30;
        const particleGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        
        for (let i = 0; i < particleCount; i++) {
            // Random position around the enemy
            const radius = 0.7 + Math.random() * 0.3;
            const angle = Math.random() * Math.PI * 2;
            const height = Math.random() * 2;
            
            positions[i * 3] = Math.cos(angle) * radius;
            positions[i * 3 + 1] = height;
            positions[i * 3 + 2] = Math.sin(angle) * radius;
            
            // Fire color with variations
            const colorVariation = 0.8 + Math.random() * 0.2;
            if (Math.random() < 0.7) {
                // Fire color
                colors[i * 3] = this.fireColor.r * colorVariation;
                colors[i * 3 + 1] = this.fireColor.g * colorVariation;
                colors[i * 3 + 2] = this.fireColor.b * colorVariation;
            } else {
                // Ember color
                colors[i * 3] = this.emberColor.r * colorVariation;
                colors[i * 3 + 1] = this.emberColor.g * colorVariation;
                colors[i * 3 + 2] = this.emberColor.b * colorVariation;
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
        
        // Position at enemy
        particles.position.copy(enemyPosition);
        
        // Add to scene
        this.skill.game.scene.add(particles);
        
        // Store for animation and cleanup
        const fireParticleData = {
            particles,
            geometry: particleGeometry,
            material: particleMaterial,
            enemy,
            creationTime: this.skill.game.time.getElapsedTime()
        };
        
        this.fireParticles.push(fireParticleData);
        
        // Update fire particles
        this.updateFireParticles();
    }
    
    /**
     * Update and remove expired fire particles
     */
    updateFireParticles() {
        const currentTime = this.skill.game.time.getElapsedTime();
        const activeFireParticles = [];
        
        for (let i = 0; i < this.fireParticles.length; i++) {
            const particleData = this.fireParticles[i];
            const age = currentTime - particleData.creationTime;
            
            if (age < this.burnDuration) {
                // Still active, update position to follow enemy
                const enemyPosition = particleData.enemy.getPosition();
                if (enemyPosition) {
                    particleData.particles.position.copy(enemyPosition);
                }
                
                // Animate particles
                const positions = particleData.geometry.attributes.position.array;
                const count = positions.length / 3;
                
                for (let j = 0; j < count; j++) {
                    // Move upward
                    positions[j * 3 + 1] += (0.5 + Math.random() * 0.5) * (this.skill.game.deltaTime || 0.016);
                    
                    // Add some random horizontal movement
                    positions[j * 3] += (Math.random() - 0.5) * 0.1;
                    positions[j * 3 + 2] += (Math.random() - 0.5) * 0.1;
                    
                    // Reset particles that go too high
                    if (positions[j * 3 + 1] > 2 || Math.random() < 0.05) {
                        const radius = 0.7 + Math.random() * 0.3;
                        const angle = Math.random() * Math.PI * 2;
                        
                        positions[j * 3] = Math.cos(angle) * radius;
                        positions[j * 3 + 1] = Math.random() * 0.5;
                        positions[j * 3 + 2] = Math.sin(angle) * radius;
                    }
                }
                
                particleData.geometry.attributes.position.needsUpdate = true;
                
                activeFireParticles.push(particleData);
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
        
        // Update the list of active fire particles
        this.fireParticles = activeFireParticles;
        
        // Continue updating if there are still active particles
        if (this.fireParticles.length > 0) {
            requestAnimationFrame(() => this.updateFireParticles());
        }
    }
    
    /**
     * Create a fire explosion at the specified position
     * @param {THREE.Vector3} position - The position to create the explosion at
     */
    createFireExplosion(position) {
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
                // enemy.takeDamage(this.skill.damage * 0.5);
                
                // Apply burn effect
                this.applyBurnEffect(enemy);
            });
        }
        
        // Create visual explosion effect
        
        // 1. Fire ring
        const ringGeometry = new THREE.RingGeometry(0.1, this.explosionRadius, 32);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: this.fireColor,
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
        
        // 2. Fire particles
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
            
            // Fire color with variations
            const colorVariation = 0.8 + Math.random() * 0.2;
            if (Math.random() < 0.7) {
                // Fire color
                colors[i * 3] = this.fireColor.r * colorVariation;
                colors[i * 3 + 1] = this.fireColor.g * colorVariation;
                colors[i * 3 + 2] = this.fireColor.b * colorVariation;
            } else {
                // Ember color
                colors[i * 3] = this.emberColor.r * colorVariation;
                colors[i * 3 + 1] = this.emberColor.g * colorVariation;
                colors[i * 3 + 2] = this.emberColor.b * colorVariation;
            }
            
            // Random sizes
            sizes[i] = 0.1 + Math.random() * 0.3;
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
        
        // Animate the explosion
        const startTime = this.skill.game.time.getElapsedTime();
        const duration = 1.5; // 1.5 seconds
        
        const updateExplosion = () => {
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
                
                // Remove from update loop
                this.skill.game.removeFromUpdateList(updateExplosion);
                return;
            }
            
            // Expand and fade ring
            ring.scale.set(1 + t, 1 + t, 1);
            ringMaterial.opacity = 0.7 * (1 - t);
            
            // Animate fire particles
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
                const speed = 2 + Math.random() * 2;
                positions[i * 3] += dirX * speed * (this.skill.game.deltaTime || 0.016);
                positions[i * 3 + 1] += (dirY * speed + 1) * (this.skill.game.deltaTime || 0.016); // Extra upward movement
                positions[i * 3 + 2] += dirZ * speed * (this.skill.game.deltaTime || 0.016);
            }
            
            particleGeometry.attributes.position.needsUpdate = true;
            
            // Fade out particles
            particleMaterial.opacity = 0.8 * (1 - t);
        };
        
        // Add to update loop
        this.skill.game.addToUpdateList(updateExplosion);
    }
    
    /**
     * Create a burning area at the specified position
     * @param {THREE.Vector3} position - The position to create the burning area at
     */
    createBurningArea(position) {
        if (!position || !this.skill.game.scene) return;
        
        // Create a group to hold all burning area effects
        const burnAreaGroup = new THREE.Group();
        burnAreaGroup.position.copy(position);
        
        // 1. Ground fire effect
        const groundGeometry = new THREE.CircleGeometry(this.burnAreaRadius, 32);
        const groundMaterial = new THREE.MeshBasicMaterial({
            color: this.fireColor,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending
        });
        
        const groundFire = new THREE.Mesh(groundGeometry, groundMaterial);
        groundFire.rotation.x = -Math.PI / 2; // Lay flat
        groundFire.position.y = 0.05; // Just above ground
        
        burnAreaGroup.add(groundFire);
        
        // 2. Fire particles
        const particleCount = 100;
        const particleGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        
        for (let i = 0; i < particleCount; i++) {
            // Random position within radius
            const radius = Math.random() * this.burnAreaRadius;
            const angle = Math.random() * Math.PI * 2;
            
            positions[i * 3] = Math.cos(angle) * radius;
            positions[i * 3 + 1] = Math.random() * 0.5; // Start low to the ground
            positions[i * 3 + 2] = Math.sin(angle) * radius;
            
            // Fire color with variations
            const colorVariation = 0.8 + Math.random() * 0.2;
            if (Math.random() < 0.7) {
                // Fire color
                colors[i * 3] = this.fireColor.r * colorVariation;
                colors[i * 3 + 1] = this.fireColor.g * colorVariation;
                colors[i * 3 + 2] = this.fireColor.b * colorVariation;
            } else {
                // Ember color
                colors[i * 3] = this.emberColor.r * colorVariation;
                colors[i * 3 + 1] = this.emberColor.g * colorVariation;
                colors[i * 3 + 2] = this.emberColor.b * colorVariation;
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
            opacity: 0.7,
            vertexColors: true,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true
        });
        
        const fireParticles = new THREE.Points(particleGeometry, particleMaterial);
        burnAreaGroup.add(fireParticles);
        
        // Add to scene
        this.skill.game.scene.add(burnAreaGroup);
        
        // Store for animation and cleanup
        this.burnAreaEffect = {
            group: burnAreaGroup,
            groundFire: {
                mesh: groundFire,
                material: groundMaterial,
                geometry: groundGeometry
            },
            fireParticles: {
                points: fireParticles,
                material: particleMaterial,
                geometry: particleGeometry,
                positions: positions
            },
            creationTime: this.skill.game.time.getElapsedTime()
        };
        
        // Set up damage over time for enemies in the area
        const applyBurnAreaDamage = () => {
            if (!this.skill.game.enemyManager) return;
            
            const enemies = this.skill.game.enemyManager.getEnemiesNearPosition(
                position,
                this.burnAreaRadius
            );
            
            enemies.forEach(enemy => {
                // IMPORTANT: THIS CHECKED BY COLLISIONMANAGER
                // Apply damage
                // enemy.takeDamage(this.burnDamagePerSecond * (this.skill.game.deltaTime || 0.016));
                
                // Chance to apply burn effect
                if (Math.random() < 0.1) {
                    this.applyBurnEffect(enemy);
                }
            });
        };
        
        // Animate the burning area
        const updateBurningArea = () => {
            const currentTime = this.skill.game.time.getElapsedTime();
            const elapsed = currentTime - this.burnAreaEffect.creationTime;
            
            // Remove when duration is over
            if (elapsed >= this.burnAreaDuration) {
                this.skill.game.scene.remove(burnAreaGroup);
                
                // Dispose resources
                groundMaterial.dispose();
                groundGeometry.dispose();
                particleMaterial.dispose();
                particleGeometry.dispose();
                
                // Clear reference
                this.burnAreaEffect = null;
                
                // Remove from update loop
                this.skill.game.removeFromUpdateList(updateBurningArea);
                this.skill.game.removeFromUpdateList(applyBurnAreaDamage);
                return;
            }
            
            // Fade out near the end
            if (elapsed > this.burnAreaDuration - 2) {
                const fadeT = (elapsed - (this.burnAreaDuration - 2)) / 2;
                groundMaterial.opacity = 0.3 * (1 - fadeT);
                particleMaterial.opacity = 0.7 * (1 - fadeT);
            }
            
            // Animate fire particles
            const positions = this.burnAreaEffect.fireParticles.positions;
            const count = positions.length / 3;
            
            for (let i = 0; i < count; i++) {
                // Move upward
                positions[i * 3 + 1] += (0.5 + Math.random() * 0.5) * (this.skill.game.deltaTime || 0.016);
                
                // Add some random horizontal movement
                positions[i * 3] += (Math.random() - 0.5) * 0.05;
                positions[i * 3 + 2] += (Math.random() - 0.5) * 0.05;
                
                // Reset particles that go too high
                if (positions[i * 3 + 1] > 1.5 || Math.random() < 0.02) {
                    const radius = Math.random() * this.burnAreaRadius;
                    const angle = Math.random() * Math.PI * 2;
                    
                    positions[i * 3] = Math.cos(angle) * radius;
                    positions[i * 3 + 1] = Math.random() * 0.2;
                    positions[i * 3 + 2] = Math.sin(angle) * radius;
                }
            }
            
            particleGeometry.attributes.position.needsUpdate = true;
            
            // Pulse ground fire
            const pulseScale = 1 + 0.1 * Math.sin(elapsed * 5);
            groundFire.scale.set(pulseScale, pulseScale, 1);
            
            // Apply damage to enemies in the area
            applyBurnAreaDamage();
        };
        
        // Add to update loop
        this.skill.game.addToUpdateList(updateBurningArea);
    }
    
    /**
     * Create a fire effect at the specified position
     * @param {THREE.Vector3} position - The position to create the effect at
     */
    createFireEffect(position) {
        if (!position || !this.skill.game.scene) return;
        
        // Create a small fire burst
        const particleCount = 10;
        const particleGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        
        for (let i = 0; i < particleCount; i++) {
            // Start at position
            positions[i * 3] = position.x + (Math.random() - 0.5) * 0.3;
            positions[i * 3 + 1] = position.y + Math.random() * 0.5;
            positions[i * 3 + 2] = position.z + (Math.random() - 0.5) * 0.3;
            
            // Fire color with variations
            const colorVariation = 0.8 + Math.random() * 0.2;
            if (Math.random() < 0.7) {
                // Fire color
                colors[i * 3] = this.fireColor.r * colorVariation;
                colors[i * 3 + 1] = this.fireColor.g * colorVariation;
                colors[i * 3 + 2] = this.fireColor.b * colorVariation;
            } else {
                // Ember color
                colors[i * 3] = this.emberColor.r * colorVariation;
                colors[i * 3 + 1] = this.emberColor.g * colorVariation;
                colors[i * 3 + 2] = this.emberColor.b * colorVariation;
            }
            
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
        
        // Animate the fire
        const startTime = this.skill.game.time.getElapsedTime();
        const duration = 0.5; // 0.5 seconds
        
        const updateFire = () => {
            const currentTime = this.skill.game.time.getElapsedTime();
            const elapsed = currentTime - startTime;
            const t = elapsed / duration;
            
            if (t >= 1) {
                // Animation complete, remove particles
                this.skill.game.scene.remove(particles);
                particleGeometry.dispose();
                particleMaterial.dispose();
                
                // Remove from update loop
                this.skill.game.removeFromUpdateList(updateFire);
                return;
            }
            
            // Move particles upward
            const positions = particleGeometry.attributes.position.array;
            
            for (let i = 0; i < particleCount; i++) {
                // Move upward
                positions[i * 3 + 1] += (0.5 + Math.random() * 0.5) * (this.skill.game.deltaTime || 0.016);
                
                // Add some random horizontal movement
                positions[i * 3] += (Math.random() - 0.5) * 0.05;
                positions[i * 3 + 2] += (Math.random() - 0.5) * 0.05;
            }
            
            particleGeometry.attributes.position.needsUpdate = true;
            
            // Fade out
            particleMaterial.opacity = 0.8 * (1 - t);
        };
        
        // Add to update loop
        this.skill.game.addToUpdateList(updateFire);
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
        
        // Add additional fire burst effect
        this.createFireBurstEffect(position);
    }
    
    /**
     * Create a fire burst effect at the specified position
     * @param {THREE.Vector3} position - The position to create the effect at
     */
    createFireBurstEffect(position) {
        if (!position || !this.skill.game.scene) return;
        
        // Create a burst of fire particles
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
            
            // Fire color with variations
            const colorVariation = 0.8 + Math.random() * 0.2;
            if (Math.random() < 0.7) {
                // Fire color
                colors[i * 3] = this.fireColor.r * colorVariation;
                colors[i * 3 + 1] = this.fireColor.g * colorVariation;
                colors[i * 3 + 2] = this.fireColor.b * colorVariation;
            } else {
                // Ember color
                colors[i * 3] = this.emberColor.r * colorVariation;
                colors[i * 3 + 1] = this.emberColor.g * colorVariation;
                colors[i * 3 + 2] = this.emberColor.b * colorVariation;
            }
            
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
                const speed = 2;
                positions[i * 3] += dirX * speed * (this.skill.game.deltaTime || 0.016);
                positions[i * 3 + 1] += (dirY * speed + 1) * (this.skill.game.deltaTime || 0.016); // Extra upward movement
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
        
        // Clean up fire particles
        this.fireParticles.forEach(particleData => {
            if (this.skill.game.scene) {
                this.skill.game.scene.remove(particleData.particles);
            }
            
            particleData.geometry.dispose();
            particleData.material.dispose();
        });
        
        this.fireParticles = [];
        
        // Clean up burn area effect
        if (this.burnAreaEffect) {
            if (this.skill.game.scene) {
                this.skill.game.scene.remove(this.burnAreaEffect.group);
            }
            
            this.burnAreaEffect.groundFire.material.dispose();
            this.burnAreaEffect.groundFire.geometry.dispose();
            this.burnAreaEffect.fireParticles.material.dispose();
            this.burnAreaEffect.fireParticles.geometry.dispose();
            
            this.burnAreaEffect = null;
        }
    }
}