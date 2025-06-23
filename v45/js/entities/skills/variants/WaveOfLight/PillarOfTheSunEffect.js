import * as THREE from 'three';
import { WaveOfLightEffect } from '../../WaveOfLightEffect.js';

/**
 * Effect for the Pillar of the Sun variant of Wave of Light
 * Creates a powerful beam of light that deals high damage
 * Visual style: Intense golden light with sun-like particles
 */
export class PillarOfTheSunEffect extends WaveOfLightEffect {
    constructor(skill) {
        super(skill);
        
        // Variant-specific properties
        this.damageMultiplier = 1.5; // 50% increased damage
        this.beamWidth = 2; // Width of the beam
        this.beamLength = 15; // Length of the beam
        this.beamDuration = 2; // Duration of the beam in seconds
        
        // Visual properties
        this.sunColor = new THREE.Color(0xffcc00); // Golden yellow for sun
        this.beamColor = new THREE.Color(0xffffaa); // Bright yellow for beam
        this.pillarEffect = null;
        this.sunParticles = null;
    }
    
    /**
     * Calculate damage for the effect
     * @param {Enemy} enemy - The enemy to calculate damage for
     * @returns {number} - The calculated damage
     * @override
     */
    calculateDamage(enemy) {
        return super.calculateDamage(enemy) * this.damageMultiplier;
    }
    
    /**
     * Create the effect
     * @param {THREE.Vector3} position - The position to create the effect at
     * @param {THREE.Vector3} direction - The direction of the effect
     * @returns {Object} - The created effect object
     * @override
     */
    create(position, direction) {
        // Create base effect
        const effectObject = super.create(position, direction);
        
        // Add pillar effect
        this.createPillarEffect(position, direction);
        
        // Add sun particles
        this.createSunParticles(position);
        
        return effectObject;
    }
    
    /**
     * Create the pillar effect
     * @param {THREE.Vector3} position - The position to create the effect at
     * @param {THREE.Vector3} direction - The direction of the effect
     */
    createPillarEffect(position, direction) {
        if (!position || !direction || !this.skill.game.scene) return;
        
        // Create a group to hold all pillar elements
        const pillarGroup = new THREE.Group();
        pillarGroup.position.copy(position);
        
        // Adjust height to be slightly above ground
        pillarGroup.position.y += 0.5;
        
        // Create the main beam
        const beamGeometry = new THREE.CylinderGeometry(
            this.beamWidth / 2, // Top radius
            this.beamWidth / 2, // Bottom radius
            this.beamLength, // Height
            16, // Radial segments
            4, // Height segments
            true // Open-ended
        );
        
        const beamMaterial = new THREE.MeshBasicMaterial({
            color: this.beamColor,
            transparent: true,
            opacity: 0.7,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending
        });
        
        const beam = new THREE.Mesh(beamGeometry, beamMaterial);
        
        // Rotate to align with direction
        beam.rotation.x = Math.PI / 2;
        
        // Position so one end is at the origin
        beam.position.z = this.beamLength / 2;
        
        // Rotate to match direction
        const targetQuaternion = new THREE.Quaternion();
        const up = new THREE.Vector3(0, 1, 0);
        targetQuaternion.setFromUnitVectors(up, direction.normalize());
        pillarGroup.quaternion.copy(targetQuaternion);
        
        // Add beam to group
        pillarGroup.add(beam);
        
        // Create outer glow
        const glowGeometry = new THREE.CylinderGeometry(
            this.beamWidth, // Top radius (wider than beam)
            this.beamWidth, // Bottom radius
            this.beamLength,
            16,
            4,
            true
        );
        
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: this.sunColor,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending
        });
        
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        
        // Position like the beam
        glow.rotation.x = Math.PI / 2;
        glow.position.z = this.beamLength / 2;
        
        // Add glow to group
        pillarGroup.add(glow);
        
        // Create base flare
        const flareGeometry = new THREE.CircleGeometry(this.beamWidth * 1.5, 32);
        const flareMaterial = new THREE.MeshBasicMaterial({
            color: this.sunColor,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending
        });
        
        const flare = new THREE.Mesh(flareGeometry, flareMaterial);
        
        // Position at the base of the beam
        flare.rotation.x = Math.PI / 2;
        
        // Add flare to group
        pillarGroup.add(flare);
        
        // Add to scene
        this.skill.game.scene.add(pillarGroup);
        
        // Store for animation and cleanup
        this.pillarEffect = {
            group: pillarGroup,
            beam: {
                mesh: beam,
                material: beamMaterial,
                geometry: beamGeometry
            },
            glow: {
                mesh: glow,
                material: glowMaterial,
                geometry: glowGeometry
            },
            flare: {
                mesh: flare,
                material: flareMaterial,
                geometry: flareGeometry
            },
            position: position.clone(),
            direction: direction.clone(),
            creationTime: this.skill.game.time.getElapsedTime()
        };
        
        // Set up damage over time for enemies in the beam
        this.applyBeamDamage();
    }
    
    /**
     * Create sun particles around the pillar base
     * @param {THREE.Vector3} position - The position to create the particles at
     */
    createSunParticles(position) {
        if (!position || !this.skill.game.scene) return;
        
        // Create sun particles
        const particleCount = 100;
        const particleGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        
        for (let i = 0; i < particleCount; i++) {
            // Random position around the base
            const radius = Math.random() * this.beamWidth * 2;
            const angle = Math.random() * Math.PI * 2;
            
            positions[i * 3] = position.x + Math.cos(angle) * radius;
            positions[i * 3 + 1] = position.y + Math.random() * 2; // Varied height
            positions[i * 3 + 2] = position.z + Math.sin(angle) * radius;
            
            // Sun color with variations
            const colorVariation = 0.8 + Math.random() * 0.2;
            colors[i * 3] = this.sunColor.r * colorVariation;
            colors[i * 3 + 1] = this.sunColor.g * colorVariation;
            colors[i * 3 + 2] = this.sunColor.b * colorVariation;
            
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
        
        // Add to scene
        this.skill.game.scene.add(particles);
        
        // Store for animation and cleanup
        this.sunParticles = {
            points: particles,
            geometry: particleGeometry,
            material: particleMaterial,
            positions: positions,
            creationTime: this.skill.game.time.getElapsedTime()
        };
    }
    
    /**
     * Apply damage to enemies in the beam
     */
    applyBeamDamage() {
        if (!this.pillarEffect || !this.skill.game.enemyManager) return;
        
        // Create a ray for collision detection
        const origin = this.pillarEffect.position.clone();
        const direction = this.pillarEffect.direction.clone().normalize();
        
        // Get enemies that might be in the beam
        const potentialEnemies = this.skill.game.enemyManager.getAllEnemies();
        
        potentialEnemies.forEach(enemy => {
            const enemyPosition = enemy.getPosition();
            if (!enemyPosition) return;
            
            // Calculate vector from origin to enemy
            const toEnemy = enemyPosition.clone().sub(origin);
            
            // Project onto beam direction
            const projection = toEnemy.dot(direction);
            
            // Check if enemy is in front of beam and within beam length
            if (projection > 0 && projection < this.beamLength) {
                // Calculate closest point on beam axis to enemy
                const closestPoint = origin.clone().add(direction.clone().multiplyScalar(projection));
                
                // Calculate distance from enemy to beam axis
                const distance = enemyPosition.distanceTo(closestPoint);
                
                // Check if enemy is within beam width
                if (distance < this.beamWidth / 2 + 0.5) { // Add a small margin
                    // IMPORTANT: THIS CHECKED BY COLLISIONMANAGER
                    // Apply damage
                    // const damage = this.calculateDamage(enemy) * (this.skill.game.deltaTime || 0.016) * 2;
                    // enemy.takeDamage(damage);
                    
                    // Create hit effect
                    if (Math.random() < 0.1) {
                        this.createHitEffect(enemyPosition);
                    }
                }
            }
        });
        
        // Continue applying damage while beam is active
        const currentTime = this.skill.game.time.getElapsedTime();
        const elapsed = currentTime - this.pillarEffect.creationTime;
        
        if (elapsed < this.beamDuration) {
            // Schedule next damage application
            setTimeout(() => this.applyBeamDamage(), 100);
        }
    }
    
    /**
     * Update the effect
     * @param {number} delta - Time since last update in seconds
     * @override
     */
    update(delta) {
        super.update(delta);
        
        // Update pillar effect
        this.updatePillarEffect(delta);
        
        // Update sun particles
        this.updateSunParticles(delta);
    }
    
    /**
     * Update the pillar effect
     * @param {number} delta - Time since last update in seconds
     */
    updatePillarEffect(delta) {
        if (!this.pillarEffect) return;
        
        const currentTime = this.skill.game.time.getElapsedTime();
        const elapsed = currentTime - this.pillarEffect.creationTime;
        
        // Remove when duration is over
        if (elapsed >= this.beamDuration) {
            this.cleanup();
            return;
        }
        
        // Fade in at the start
        if (elapsed < 0.3) {
            const fadeIn = elapsed / 0.3;
            this.pillarEffect.beam.material.opacity = 0.7 * fadeIn;
            this.pillarEffect.glow.material.opacity = 0.3 * fadeIn;
            this.pillarEffect.flare.material.opacity = 0.8 * fadeIn;
        }
        // Fade out near the end
        else if (elapsed > this.beamDuration - 0.5) {
            const fadeOut = (elapsed - (this.beamDuration - 0.5)) / 0.5;
            this.pillarEffect.beam.material.opacity = 0.7 * (1 - fadeOut);
            this.pillarEffect.glow.material.opacity = 0.3 * (1 - fadeOut);
            this.pillarEffect.flare.material.opacity = 0.8 * (1 - fadeOut);
        }
        
        // Pulse the beam
        const pulseScale = 1 + 0.1 * Math.sin(elapsed * 10);
        this.pillarEffect.beam.mesh.scale.x = pulseScale;
        this.pillarEffect.beam.mesh.scale.y = pulseScale;
        
        // Rotate the glow
        this.pillarEffect.glow.mesh.rotation.z += delta * 0.5;
        
        // Pulse the flare
        const flareScale = 1 + 0.2 * Math.sin(elapsed * 5);
        this.pillarEffect.flare.mesh.scale.set(flareScale, flareScale, 1);
    }
    
    /**
     * Update the sun particles
     * @param {number} delta - Time since last update in seconds
     */
    updateSunParticles(delta) {
        if (!this.sunParticles) return;
        
        const currentTime = this.skill.game.time.getElapsedTime();
        const elapsed = currentTime - this.sunParticles.creationTime;
        
        // Remove when duration is over
        if (elapsed >= this.beamDuration) {
            if (this.skill.game.scene) {
                this.skill.game.scene.remove(this.sunParticles.points);
            }
            
            this.sunParticles.geometry.dispose();
            this.sunParticles.material.dispose();
            this.sunParticles = null;
            return;
        }
        
        // Animate particles
        const positions = this.sunParticles.positions;
        const count = positions.length / 3;
        
        for (let i = 0; i < count; i++) {
            // Move upward and outward
            const x = positions[i * 3];
            const y = positions[i * 3 + 1];
            const z = positions[i * 3 + 2];
            
            // Calculate direction from pillar base
            const dx = x - this.pillarEffect.position.x;
            const dz = z - this.pillarEffect.position.z;
            
            // Normalize direction
            const distance = Math.sqrt(dx * dx + dz * dz);
            const dirX = distance > 0 ? dx / distance : Math.random() - 0.5;
            const dirZ = distance > 0 ? dz / distance : Math.random() - 0.5;
            
            // Move outward and upward
            positions[i * 3] += dirX * 0.05;
            positions[i * 3 + 1] += 0.5 * delta; // Upward movement
            positions[i * 3 + 2] += dirZ * 0.05;
            
            // Reset particles that go too high
            if (y > this.pillarEffect.position.y + 3 || Math.random() < 0.01) {
                const radius = Math.random() * this.beamWidth * 1.5;
                const angle = Math.random() * Math.PI * 2;
                
                positions[i * 3] = this.pillarEffect.position.x + Math.cos(angle) * radius;
                positions[i * 3 + 1] = this.pillarEffect.position.y + Math.random() * 0.5;
                positions[i * 3 + 2] = this.pillarEffect.position.z + Math.sin(angle) * radius;
            }
        }
        
        this.sunParticles.geometry.attributes.position.needsUpdate = true;
        
        // Fade out particles near the end
        if (elapsed > this.beamDuration - 0.5) {
            const fadeOut = (elapsed - (this.beamDuration - 0.5)) / 0.5;
            this.sunParticles.material.opacity = 0.8 * (1 - fadeOut);
        }
    }
    
    /**
     * Create a hit effect at the specified position
     * @param {THREE.Vector3} position - The position to create the effect at
     */
    createHitEffect(position) {
        if (!position || !this.skill.game.scene) return;
        
        // Create a burst of sun particles
        const particleCount = 20;
        const particleGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        
        for (let i = 0; i < particleCount; i++) {
            // Start at hit position
            positions[i * 3] = position.x;
            positions[i * 3 + 1] = position.y;
            positions[i * 3 + 2] = position.z;
            
            // Sun color with variations
            const colorVariation = 0.8 + Math.random() * 0.2;
            colors[i * 3] = this.sunColor.r * colorVariation;
            colors[i * 3 + 1] = this.sunColor.g * colorVariation;
            colors[i * 3 + 2] = this.sunColor.b * colorVariation;
            
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
        
        // Animate the hit effect
        const startTime = this.skill.game.time.getElapsedTime();
        const duration = 0.5; // 0.5 seconds
        
        const updateHit = () => {
            const currentTime = this.skill.game.time.getElapsedTime();
            const elapsed = currentTime - startTime;
            const t = elapsed / duration;
            
            if (t >= 1) {
                // Animation complete, remove particles
                this.skill.game.scene.remove(particles);
                particleGeometry.dispose();
                particleMaterial.dispose();
                
                // Remove from update loop
                this.skill.game.removeFromUpdateList(updateHit);
                return;
            }
            
            // Move particles outward
            const positions = particleGeometry.attributes.position.array;
            
            for (let i = 0; i < particleCount; i++) {
                // Calculate direction from center
                const dx = positions[i * 3] - position.x;
                const dy = positions[i * 3 + 1] - position.y;
                const dz = positions[i * 3 + 2] - position.z;
                
                // Normalize direction
                const length = Math.sqrt(dx * dx + dy * dy + dz * dz);
                const dirX = length > 0 ? dx / length : Math.random() - 0.5;
                const dirY = length > 0 ? dy / length : Math.random() - 0.5;
                const dirZ = length > 0 ? dz / length : Math.random() - 0.5;
                
                // Move outward
                const speed = 1;
                positions[i * 3] += dirX * speed * (this.skill.game.deltaTime || 0.016);
                positions[i * 3 + 1] += dirY * speed * (this.skill.game.deltaTime || 0.016);
                positions[i * 3 + 2] += dirZ * speed * (this.skill.game.deltaTime || 0.016);
            }
            
            particleGeometry.attributes.position.needsUpdate = true;
            
            // Fade out
            particleMaterial.opacity = 0.8 * (1 - t);
        };
        
        // Add to update loop
        this.skill.game.addToUpdateList(updateHit);
    }
    
    /**
     * Clean up resources when the effect is destroyed
     * @override
     */
    cleanup() {
        super.cleanup();
        
        // Clean up pillar effect
        if (this.pillarEffect) {
            if (this.skill.game.scene) {
                this.skill.game.scene.remove(this.pillarEffect.group);
            }
            
            this.pillarEffect.beam.geometry.dispose();
            this.pillarEffect.beam.material.dispose();
            this.pillarEffect.glow.geometry.dispose();
            this.pillarEffect.glow.material.dispose();
            this.pillarEffect.flare.geometry.dispose();
            this.pillarEffect.flare.material.dispose();
            
            this.pillarEffect = null;
        }
        
        // Clean up sun particles
        if (this.sunParticles) {
            if (this.skill.game.scene) {
                this.skill.game.scene.remove(this.sunParticles.points);
            }
            
            this.sunParticles.geometry.dispose();
            this.sunParticles.material.dispose();
            this.sunParticles = null;
        }
    }
}