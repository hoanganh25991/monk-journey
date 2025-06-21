import * as THREE from 'three';
import { SkillEffect } from './SkillEffect.js';

/**
 * Specialized effect for Flying Kick skill
 */
export class FlyingKickEffect extends SkillEffect {
    constructor(skill) {
        super(skill);
        // Simple configuration parameters:
        // 1. kickSpeed: Units traveled per second
        this.kickSpeed = skill.kickSpeed || 20; 
        // 2. range: Maximum distance the kick can travel
        this.range = skill.range || 200;
        // 3. duration: Maximum time the effect can last (in seconds)
        this.maxDuration = skill.duration || 5;
        
        this.initialPosition = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        this.distanceTraveled = 0;
    }

    /**
     * Create a Flying Kick effect
     * @param {THREE.Vector3} position - Starting position
     * @param {THREE.Vector3} direction - Direction to travel
     * @returns {THREE.Group} - The created effect
     */
    create(position, direction) {
        position.y -= 2.04;
        // Create a group for the effect
        const effectGroup = new THREE.Group();
        
        // Store initial position and direction for movement
        this.initialPosition.copy(position);
        this.direction.copy(direction);
        this.distanceTraveled = 0;
        
        // Create the Flying Kick effect
        this.createFlyingKickEffect(effectGroup);
        
        // Position effect
        effectGroup.position.copy(position);
        effectGroup.rotation.y = Math.atan2(direction.x, direction.z);
        
        // Store effect
        this.effect = effectGroup;
        this.isActive = true;
        
        return effectGroup;
    }

    /**
     * Create the Flying Kick special effect
     * @param {THREE.Group} effectGroup - Group to add the effect to
     * @private
     */
    createFlyingKickEffect(effectGroup) {
        // Create kick trail
        const trailGroup = new THREE.Group();
        
        // Create main energy trail
        const trailGeometry = new THREE.CylinderGeometry(0.5, 0.2, 3, 8);
        const trailMaterial = new THREE.MeshStandardMaterial({
            color: this.skill.color || 0x00ffff,
            emissive: this.skill.color || 0x00ffff,
            emissiveIntensity: 1.5,
            transparent: true,
            opacity: 0.7,
            side: THREE.DoubleSide
        });
        
        const trail = new THREE.Mesh(trailGeometry, trailMaterial);
        trail.rotation.x = Math.PI / 2;
        trailGroup.add(trail);
        
        // Create kick impact point (at the front of the trail)
        const impactGeometry = new THREE.SphereGeometry(0.7, 16, 16);
        const impactMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            emissive: this.skill.color || 0x00ffff,
            emissiveIntensity: 2,
            transparent: true,
            opacity: 0.9
        });
        
        const impact = new THREE.Mesh(impactGeometry, impactMaterial);
        impact.position.z = -1.5;
        trailGroup.add(impact);
        
        // Create energy rings around the impact point
        const ringCount = 3;
        for (let i = 0; i < ringCount; i++) {
            const ringGeometry = new THREE.TorusGeometry(0.8 + (i * 0.3), 0.1, 8, 16);
            const ringMaterial = new THREE.MeshStandardMaterial({
                color: this.skill.color || 0x00ffff,
                emissive: this.skill.color || 0x00ffff,
                emissiveIntensity: 1.5 - (i * 0.3),
                transparent: true,
                opacity: 0.8 - (i * 0.2)
            });
            
            const ring = new THREE.Mesh(ringGeometry, ringMaterial);
            ring.position.z = -1.5;
            
            // Store animation data
            ring.userData = {
                rotationSpeed: 2 - (i * 0.5),
                pulseSpeed: 1 + (i * 0.3)
            };
            
            trailGroup.add(ring);
        }
        
        // Create energy particles along the trail
        const particleCount = 20;
        const particles = [];
        
        for (let i = 0; i < particleCount; i++) {
            // Position along the trail
            const zPos = -1.5 + (i / particleCount) * 3;
            const angle = Math.random() * Math.PI * 2;
            const radius = 0.3 + Math.random() * 0.3;
            
            // Create particle
            const particleSize = 0.05 + Math.random() * 0.1;
            const particleGeometry = new THREE.SphereGeometry(particleSize, 8, 8);
            const particleMaterial = new THREE.MeshStandardMaterial({
                color: this.skill.color || 0x00ffff,
                emissive: this.skill.color || 0x00ffff,
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
            
            trailGroup.add(particle);
            particles.push(particle);
        }
        
        // Add the trail group to the effect group
        effectGroup.add(trailGroup);
        
        // Store animation state
        this.kickState = {
            trailGroup: trailGroup,
            particles: particles,
            rings: trailGroup.children.filter(child => 
                child.geometry && child.geometry.type === 'TorusGeometry'
            )
        };
    }

    /**
     * Update the Flying Kick effect
     * @param {number} delta - Time since last update in seconds
     */
    update(delta) {
        if (!this.isActive || !this.effect) return;
        
        this.elapsedTime += delta;
        
        // Simple termination conditions:
        // 1. Effect has reached maximum distance (range)
        // 2. Effect has lasted for maximum duration
        // Whichever happens first will end the effect
        if (this.distanceTraveled >= this.range || this.elapsedTime >= this.maxDuration) {
            this.isActive = false;
            this.dispose();
            return;
        }
        
        // Move forward
        const moveDistance = this.kickSpeed * delta;
        this.effect.position.x += this.direction.x * moveDistance;
        this.effect.position.z += this.direction.z * moveDistance;
        
        // IMPORTANT: Update the skill's position property to match the effect's position
        this.skill.position.copy(this.effect.position);
        
        // Update distance traveled
        this.distanceTraveled += moveDistance;
        
        this.updateFlyingKickEffect(delta);
    }

    /**
     * Update the Flying Kick special effect
     * @param {number} delta - Time since last update in seconds
     * @private
     */
    updateFlyingKickEffect(delta) {
        if (!this.kickState) return;
        
        const { particles, rings } = this.kickState;
        
        // Animate particles
        for (const particle of particles) {
            if (particle.userData) {
                const initialPos = particle.userData.initialPos;
                const speed = particle.userData.speed;
                const direction = particle.userData.direction;
                
                // Oscillate position
                particle.position.set(
                    initialPos.x + Math.sin(this.elapsedTime * speed) * direction.x * 0.2,
                    initialPos.y + Math.sin(this.elapsedTime * speed) * direction.y * 0.2,
                    initialPos.z
                );
            }
        }
        
        // Animate rings
        for (const ring of rings) {
            if (ring.userData) {
                // Rotate rings
                ring.rotation.x += delta * ring.userData.rotationSpeed;
                ring.rotation.y += delta * ring.userData.rotationSpeed * 0.7;
                
                // Pulse rings
                const pulseScale = 1 + Math.sin(this.elapsedTime * ring.userData.pulseSpeed) * 0.2;
                ring.scale.set(pulseScale, pulseScale, 1);
            }
        }
        
        // Simple opacity calculation:
        // - Calculate progress as percentage of either distance or time (whichever is greater)
        // - Fade out during the last 30% of the effect
        const distanceProgress = this.distanceTraveled / this.range;
        const timeProgress = this.elapsedTime / this.maxDuration;
        
        // Use the greater of the two progress values
        const progress = Math.max(distanceProgress, timeProgress);
        
        // Full opacity until 70% complete, then fade out
        const trailOpacity = progress < 0.7 ? 1.0 : 1.0 - ((progress - 0.7) / 0.3);
        
        // Apply opacity to all trail elements
        this.effect.traverse(child => {
            if (child.material && child.material.opacity !== undefined) {
                // Preserve relative opacity differences
                const baseOpacity = child.material.userData?.baseOpacity || child.material.opacity;
                if (!child.material.userData) {
                    child.material.userData = { baseOpacity };
                }
                
                child.material.opacity = baseOpacity * trailOpacity;
            }
        });
    }

    /**
     * Dispose of the effect and clean up resources
     */
    dispose() {
        if (!this.effect) return;
        
        // Clean up Flying Kick specific resources
        if (this.kickState) {
            // Clear particle references
            if (this.kickState.particles) {
                this.kickState.particles.length = 0;
            }
            
            // Clear ring references
            if (this.kickState.rings) {
                this.kickState.rings.length = 0;
            }
            
            // Clear kick state
            this.kickState = null;
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
    }
}