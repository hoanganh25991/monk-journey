import * as THREE from 'three';
import { SkillEffect } from './SkillEffect.js';

/**
 * Specialized effect for Deadly Reach skill
 * Implements a projectile-based energy beam that extends rapidly toward enemies
 * Now with auto-targeting to the nearest enemy
 */
export class DeadlyReachEffect extends SkillEffect {
    constructor(skill) {
        super(skill);
        this.projectileSpeed = skill.projectileSpeed || 15; // Units per second
        this.initialPosition = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        this.distanceTraveled = 0;
        this.maxDistance = skill.range || 10; // Maximum distance to travel
        this.beamLength = 2; // Fixed beam length
        this.targetEnemy = null; // Reference to the targeted enemy
        this.hasHitEnemy = false; // Track if the effect has hit an enemy
    }

    /**
     * Create a Deadly Reach effect
     * @param {THREE.Vector3} position - Starting position
     * @param {THREE.Vector3} direction - Direction to shoot
     * @returns {THREE.Group} - The created effect
     */
    create(position, direction) {
        position = position.clone();
        position.y -= 0.5;
        // Create a group for the effect
        const effectGroup = new THREE.Group();
        
        // Store initial position for movement
        this.initialPosition.copy(position);
        this.distanceTraveled = 0;
        
        // Find the nearest enemy and target it
        this.findAndTargetNearestEnemy(position, direction);
        
        // Create the Deadly Reach effect
        this.createDeadlyReachEffect(effectGroup);
        
        // Position effect
        effectGroup.position.copy(position);
        effectGroup.rotation.y = Math.atan2(this.direction.x, this.direction.z);
        
        // Store effect
        this.effect = effectGroup;
        this.isActive = true;
        
        return effectGroup;
    }
    
    /**
     * Find the nearest enemy and set the direction toward it
     * @param {THREE.Vector3} position - Starting position
     * @param {THREE.Vector3} defaultDirection - Default direction if no enemy is found
     * @private
     */
    findAndTargetNearestEnemy(position, defaultDirection) {
        // Default to the provided direction
        this.direction.copy(defaultDirection);
        
        // Try to get the game instance and enemy manager
        if (!this.skill.game || !this.skill.game.enemyManager) {
            console.debug("No game or enemy manager available for auto-targeting");
            return;
        }
        
        // Find the nearest enemy within range
        const enemyManager = this.skill.game.enemyManager;
        const nearestEnemy = enemyManager.findNearestEnemy(position, this.maxDistance);
        
        if (nearestEnemy) {
            // Store reference to the targeted enemy
            this.targetEnemy = nearestEnemy;
            
            // Get enemy position
            const enemyPosition = nearestEnemy.getPosition();
            
            // Calculate direction to enemy
            const directionToEnemy = new THREE.Vector3()
                .subVectors(enemyPosition, position)
                .normalize();
            
            // Update direction
            this.direction.copy(directionToEnemy);
            
            console.debug(`Auto-targeted enemy: ${nearestEnemy.type} at distance: ${position.distanceTo(enemyPosition)}`);
        } else {
            console.debug("No enemy found within range for auto-targeting");
        }
    }

    /**
     * Create the Deadly Reach special effect
     * @param {THREE.Group} effectGroup - Group to add the effect to
     * @private
     */
    createDeadlyReachEffect(effectGroup) {
        // Create projectile group
        const projectileGroup = new THREE.Group();
        
        // Create main energy beam
        const beamGeometry = new THREE.CylinderGeometry(0.15, 0.15, this.beamLength, 8);
        beamGeometry.rotateX(Math.PI / 2); // Rotate to point forward
        
        const beamMaterial = new THREE.MeshStandardMaterial({
            color: this.skill.color || 0xffcc00,
            emissive: this.skill.color || 0xffcc00,
            emissiveIntensity: 1.5,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });
        
        const beam = new THREE.Mesh(beamGeometry, beamMaterial);
        beam.position.z = -this.beamLength / 2; // Center the beam
        projectileGroup.add(beam);
        
        // Create impact point at the front of the beam
        const impactGeometry = new THREE.SphereGeometry(0.3, 16, 16);
        const impactMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            emissive: this.skill.color || 0xffcc00,
            emissiveIntensity: 2,
            transparent: true,
            opacity: 0.9
        });
        
        const impact = new THREE.Mesh(impactGeometry, impactMaterial);
        impact.position.z = -this.beamLength; // Position at the front of the beam
        projectileGroup.add(impact);
        
        // Create energy rings around the beam
        const ringCount = 5;
        const rings = [];
        
        for (let i = 0; i < ringCount; i++) {
            const ringGeometry = new THREE.TorusGeometry(0.25, 0.05, 8, 16);
            const ringMaterial = new THREE.MeshStandardMaterial({
                color: this.skill.color || 0xffcc00,
                emissive: this.skill.color || 0xffcc00,
                emissiveIntensity: 1.5,
                transparent: true,
                opacity: 0.7
            });
            
            const ring = new THREE.Mesh(ringGeometry, ringMaterial);
            // Position rings along the beam
            const position = (i / (ringCount - 1)) * -this.beamLength;
            ring.position.z = position;
            ring.rotation.x = Math.PI / 2;
            
            // Store animation data
            ring.userData = {
                rotationSpeed: 3 + (i * 0.5),
                pulseSpeed: 2 + (i * 0.3)
            };
            
            projectileGroup.add(ring);
            rings.push(ring);
        }
        
        // Create trailing particles
        const particleCount = 15;
        const particles = [];
        
        for (let i = 0; i < particleCount; i++) {
            // Random position around the beam
            const angle = Math.random() * Math.PI * 2;
            const radius = 0.1 + Math.random() * 0.2;
            const zPos = -(Math.random() * this.beamLength);
            
            // Create particle
            const particleSize = 0.05 + Math.random() * 0.1;
            const particleGeometry = new THREE.SphereGeometry(particleSize, 8, 8);
            const particleMaterial = new THREE.MeshStandardMaterial({
                color: this.skill.color || 0xffcc00,
                emissive: this.skill.color || 0xffcc00,
                emissiveIntensity: 2,
                transparent: true,
                opacity: 0.7 + Math.random() * 0.3
            });
            
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            particle.position.set(
                Math.cos(angle) * radius,
                Math.sin(angle) * radius,
                zPos
            );
            
            // Store animation data
            particle.userData = {
                initialPos: particle.position.clone(),
                speed: 0.5 + Math.random() * 1.5,
                direction: new THREE.Vector3(
                    Math.random() * 2 - 1,
                    Math.random() * 2 - 1,
                    0
                ).normalize()
            };
            
            projectileGroup.add(particle);
            particles.push(particle);
        }
        
        // Add the projectile group to the effect group
        effectGroup.add(projectileGroup);
        
        // Store animation state
        this.projectileState = {
            beam: beam,
            impact: impact,
            rings: rings,
            particles: particles,
            projectileGroup: projectileGroup
        };
    }

    /**
     * Update the Deadly Reach effect
     * @param {number} delta - Time since last update in seconds
     */
    update(delta) {
        if (!this.isActive || !this.effect) return;
        
        this.elapsedTime += delta;
        
        // Check if effect has expired or reached max distance
        if (this.elapsedTime >= this.skill.duration || this.distanceTraveled >= this.maxDistance) {
            this.isActive = false;
            this.dispose();
            return;
        }
        
        // Move projectile forward
        const moveDistance = this.projectileSpeed * delta;
        this.effect.position.x += this.direction.x * moveDistance;
        this.effect.position.z += this.direction.z * moveDistance;
        
        // Update rotation to match current direction
        this.effect.rotation.y = Math.atan2(this.direction.x, this.direction.z);
        
        // IMPORTANT: Update the skill's position property to match the effect's position
        this.skill.position.copy(this.effect.position);
        
        // Update distance traveled
        this.distanceTraveled += moveDistance;
        
        this.updateDeadlyReachEffect(delta);
    }

    /**
     * Update the Deadly Reach special effect
     * @param {number} delta - Time since last update in seconds
     * @private
     */
    updateDeadlyReachEffect(delta) {
        if (!this.projectileState) return;
        
        const { impact, rings, particles } = this.projectileState;
        
        // Animate rings
        for (const ring of rings) {
            if (ring.userData) {
                // Rotate rings
                ring.rotation.z += delta * ring.userData.rotationSpeed;
                
                // Pulse rings
                const pulseScale = 1 + Math.sin(this.elapsedTime * ring.userData.pulseSpeed) * 0.2;
                ring.scale.set(pulseScale, pulseScale, 1);
            }
        }
        
        // Animate particles
        for (const particle of particles) {
            if (particle.userData) {
                const initialPos = particle.userData.initialPos;
                const speed = particle.userData.speed;
                const direction = particle.userData.direction;
                
                // Oscillate position
                particle.position.set(
                    initialPos.x + Math.sin(this.elapsedTime * speed) * direction.x * 0.1,
                    initialPos.y + Math.sin(this.elapsedTime * speed) * direction.y * 0.1,
                    initialPos.z
                );
            }
        }
        
        // Pulse impact point
        if (impact) {
            const pulseScale = 1 + Math.sin(this.elapsedTime * 5) * 0.3;
            impact.scale.set(pulseScale, pulseScale, pulseScale);
        }
        
        // Adjust opacity based on distance traveled
        const progressRatio = this.distanceTraveled / this.maxDistance;
        if (progressRatio > 0.8) {
            // Start fading out when near the end of travel
            const fadeOutFactor = 1 - ((progressRatio - 0.8) * 5); // 0.8 to 1.0 maps to 1.0 to 0.0
            
            // Apply fade to all materials
            this.effect.traverse(child => {
                if (child.material && child.material.opacity !== undefined) {
                    // Store original opacity if not already stored
                    if (child.userData.originalOpacity === undefined) {
                        child.userData.originalOpacity = child.material.opacity;
                    }
                    
                    // Apply fade
                    child.material.opacity = child.userData.originalOpacity * fadeOutFactor;
                }
            });
        }
    }

    /**
     * Dispose of the effect and clean up resources
     */
    dispose() {
        if (!this.effect) return;
        
        // Clean up Deadly Reach specific resources
        if (this.projectileState) {
            // Clear ring references
            if (this.projectileState.rings) {
                this.projectileState.rings.length = 0;
            }
            
            // Clear particle references
            if (this.projectileState.particles) {
                this.projectileState.particles.length = 0;
            }
            
            // Clear projectile state
            this.projectileState = null;
        }
        
        // Call parent dispose method to clean up the rest
        super.dispose();
    }
    
    /**
     * Reset the effect to its initial state
     */
    reset() {
        // Call the dispose method to clean up resources
        this.dispose();
        
        // Reset state variables
        this.isActive = false;
        this.elapsedTime = 0;
        this.distanceTraveled = 0;
        this.initialPosition.set(0, 0, 0);
        this.direction.set(0, 0, 0);
        this.targetEnemy = null; // Clear the targeted enemy reference
    }
}