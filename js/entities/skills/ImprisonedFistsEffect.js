/**
 * ImprisonedFistsEffect.js
 * Implements the Imprisoned Fists skill effect from Diablo Immortal
 * A powerful strike that locks enemies in place, preventing them from moving
 * Now with auto-aiming functionality to target the nearest enemy
 * The skill applies lock effect to enemies hit during travel
 */

import * as THREE from 'three';
import { SkillEffect } from './SkillEffect.js';

export class ImprisonedFistsEffect extends SkillEffect {
    constructor(skill) {
        super(skill);
        
        // Movement properties
        this.moveSpeed = skill.moveSpeed || 50; // Speed at which the effect moves (default 50)
        this.lockDuration = skill.lockDuration || 2;
        this.radius = skill.radius || 5;
        this.targetPosition = null; // Position to move towards
        
        // Effect lifetime
        this.remainingDuration = this.effectDuration; // Remaining time for the effect
        
        // Movement tracking
        this.hasReachedTarget = false; // Flag to track if the effect has reached its target
        
        // Visual effects
        this.particleSystem = null; // Particle system for visual effect
        this.particleDirection = null; // Store the direction for particle movement
        this.groundIndicator = null; // Visual indicator on the ground
        this.startPosition = null; // Starting position for ground indicator
        this.lockEffects = [];
        this.targetedEnemies = [];
    }
    
    /**
     * Create the effect mesh/group
     * @param {THREE.Vector3} position - Position to create the effect at
     * @param {THREE.Vector3} direction - Direction the effect should face
     * @returns {THREE.Group} - The created effect
     */
    create(position, direction) {
        // Create a group to hold the effect
        const effectGroup = new THREE.Group();
        
        // Create the main effect mesh - cylinder
        const size = this.radius / 12.5;
        const geometry = new THREE.CylinderGeometry(size, size, this.radius, 12);
        geometry.rotateX(Math.PI / 2); // Rotate to align with direction
        
        const material = new THREE.MeshBasicMaterial({
            color: 0x00ffff, // Cyan color for the effect
            transparent: true,
            opacity: 0.9
        });
        
        const beam = new THREE.Mesh(geometry, material);
        effectGroup.add(beam);
        
        // Create particle system for the effect
        const particleCount = 25;
        const particleGeometry = new THREE.BufferGeometry();
        
        // Create particle positions
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        
        const color = new THREE.Color(0x00ffff);
        
        for (let i = 0; i < particleCount; i++) {
            // Random position along the beam with rotation around the cylinder
            const distance = Math.random() * 5; // Length of the beam
            const angle = Math.random() * Math.PI * 2; // Random angle around the cylinder
            const radius = this.radius / 12.5; // Cylinder radius
            
            // Position particles in a spiral pattern around the cylinder
            positions[i * 3] = Math.cos(angle) * radius;     // X position (rotated around cylinder)
            positions[i * 3 + 1] = Math.sin(angle) * radius; // Y position (rotated around cylinder)
            positions[i * 3 + 2] = distance;                 // Z position (along the beam)
            
            // Color (cyan with slight variations)
            colors[i * 3] = color.r * (0.8 + Math.random() * 0.2);
            colors[i * 3 + 1] = color.g * (0.8 + Math.random() * 0.2);
            colors[i * 3 + 2] = color.b * (0.8 + Math.random() * 0.2);
            
            // Size - increased for better visibility without texture
            sizes[i] = 0.2 + Math.random() * 0.3;
        }
        
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        // Create particle material without texture
        const particleMaterial = new THREE.PointsMaterial({
            size: 0.3,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true
        });
        
        this.particleSystem = new THREE.Points(particleGeometry, particleMaterial);
        effectGroup.add(this.particleSystem);
        
        // Create a ground indicator
        let width = (this.skill && isFinite(this.skill.radius)) ? this.skill.radius : 5; // Width equals the skill's radius with validation
        let initialLength = 0.1; // Initial length is small, will grow dynamically
        
        // Validate dimensions
        if (!isFinite(width) || width <= 0) {
            console.warn('ImprisonedFistsEffect: Invalid width for PlaneGeometry:', width);
            width = 5;
        }
        if (!isFinite(initialLength) || initialLength <= 0) {
            console.warn('ImprisonedFistsEffect: Invalid initial length for PlaneGeometry:', initialLength);
            initialLength = 0.1;
        }
        
        // Create material for the ground indicator
        const indicatorMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
        });
        
        // Create initial geometry with validated parameters
        const indicatorGeometry = new THREE.PlaneGeometry(width, initialLength);
        
        // Create the mesh
        this.groundIndicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
        
        // Store the starting position for calculating the length
        this.startPosition = position.clone();
        
        // Position the indicator at the starting position
        this.groundIndicator.position.copy(position);
        
        // Initialize with identity rotation
        this.groundIndicator.rotation.set(0, 0, 0);
        
        // Add ground indicator to scene
        if (this.skill.game && this.skill.game.scene) {
            this.skill.game.scene.add(this.groundIndicator);
        }
        
        // Position the effect
        effectGroup.position.copy(position);
        
        // Store the original direction for reference
        this.originalDirection = direction.clone();
        
        // Set target position based on direction
        if (direction && direction.lengthSq() > 0) {
            this.targetPosition = new THREE.Vector3()
                .copy(direction)
                .normalize()
                .multiplyScalar(this.skill.range || 20)
                .add(position);
                
            // Create horizontal direction (XZ plane only)
            const xzDirection = new THREE.Vector3(direction.x, 0, direction.z).normalize();
            
            // Create a level target point and orient the effect
            const levelTarget = new THREE.Vector3(
                position.x + xzDirection.x,
                position.y,
                position.z + xzDirection.z
            );
            effectGroup.lookAt(levelTarget);
            
            console.debug(`Orienting in direction: (${direction.x.toFixed(2)}, ${direction.y.toFixed(2)}, ${direction.z.toFixed(2)})`);
            
            // Update ground indicator initial position
            this.updateGroundIndicator(position);
        }
        
        // Store the effect
        this.effect = effectGroup;
        this.isActive = true;
        
        return effectGroup;
    }

    /**
     * Update the ground indicator to show the path of the skill effect
     * @param {THREE.Vector3} currentPosition - Current position of the skill effect
     */
    updateGroundIndicator(currentPosition) {
        if (!this.groundIndicator || !this.startPosition || !this.effect) return;
        
        // Get the direction from the effect's orientation
        const effectDirection = new THREE.Vector3(0, 0, -1); // Forward direction in local space
        effectDirection.applyQuaternion(this.effect.quaternion); // Transform to world space
        effectDirection.normalize();
        
        // Calculate the distance from start to current position
        const distance = this.startPosition.distanceTo(currentPosition);
        
        // Calculate the midpoint between start and current position
        const midpoint = new THREE.Vector3().addVectors(this.startPosition, currentPosition).multiplyScalar(0.5);
        
        // Get terrain height at midpoint if available
        let terrainHeight = 0.1; // Default slight offset from ground
        if (this.skill.game && this.skill.game.world) {
            terrainHeight = this.skill.game.world.getTerrainHeight(midpoint.x, midpoint.z) + 0.1;
        }
        
        // Update the ground indicator's position to be at the midpoint
        midpoint.y = terrainHeight; // Set the correct height above terrain
        this.groundIndicator.position.copy(midpoint);
        
        // Get terrain height at the current position for better ground alignment
        if (this.skill.game && this.skill.game.world) {
            // Update the terrain height at the current position
            const currentTerrainHeight = this.skill.game.world.getTerrainHeight(currentPosition.x, currentPosition.z) + 0.1;
            
            // This ensures the indicator follows the terrain height at the current position
            if (Math.abs(terrainHeight - currentTerrainHeight) > 0.5) {
                console.debug(`Terrain height change: ${terrainHeight.toFixed(2)} to ${currentTerrainHeight.toFixed(2)}`);
            }
        }
        
        // Update the geometry to match the new length
        // Dispose of the old geometry to prevent memory leaks
        if (this.groundIndicator.geometry) {
            this.groundIndicator.geometry.dispose();
        }
        
        // Create a new geometry with the updated length
        let width = (this.skill && isFinite(this.skill.radius)) ? this.skill.radius : 5; // Width equals the skill's radius
        const cylinderLength = 5; // Length of the cylinder beam
        // Length increases as the skill moves, plus half the cylinder length to cover the beam
        let length = Math.max(0.1, distance + (cylinderLength / 2));
        
        // Validate dimensions
        if (!isFinite(width) || width <= 0) {
            console.warn('ImprisonedFistsEffect: Invalid width for updated PlaneGeometry:', width);
            width = 5;
        }
        if (!isFinite(length) || length <= 0) {
            console.warn('ImprisonedFistsEffect: Invalid length for updated PlaneGeometry:', length);
            length = 0.1;
        }
        
        const newGeometry = new THREE.PlaneGeometry(width, length);
        this.groundIndicator.geometry = newGeometry;
        
        // Apply rotation to ensure the indicator is flat on the ground and aligned with direction
        
        // 1. Calculate the angle in the XZ plane based on the effect's direction
        const angle = Math.atan2(effectDirection.x, effectDirection.z);
        
        // 2. Reset rotation and apply in the correct sequence
        this.groundIndicator.quaternion.identity(); // Reset to identity quaternion
        
        // 3. Create and apply the combined rotation in one step
        // First flat on ground (X rotation), then aligned with direction (Y rotation)
        const flatRotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2);
        const directionRotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), angle);
        this.groundIndicator.quaternion.multiplyQuaternions(directionRotation, flatRotation);
        
        // Log minimal debug info
        console.debug(`Ground Indicator - Angle: ${(angle * 180 / Math.PI).toFixed(2)}°`)
    }

    /**
     * Create a visual lock effect for an enemy
     * @param {Enemy} enemy - The enemy to create a lock effect for
     */
    createLockEffect(enemy) {
        const enemyPosition = enemy.getPosition();
        
        // Get enemy size to scale the ring appropriately
        // const enemySize = enemy.size || 1.5; // Default size if not available
        
        // Create a ring effect around the enemy
        const ringGeometry = new THREE.RingGeometry(1, 1.2 + 0.3, 32);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.9, // Increased opacity for better visibility
            depthWrite: false // Ensures the ring renders on top of terrain
        });
        
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.position.copy(enemyPosition);
        ring.position.y = 0.2; // Slightly higher above ground for better visibility
        ring.rotation.x = Math.PI / 2; // Lay flat
        
        // Add to scene
        if (this.skill.game && this.skill.game.scene) {
            this.skill.game.scene.add(ring);
            
            // Store for cleanup
            this.lockEffects.push(ring);
        }
    }
    
    /**
     * Update the effect
     * @param {number} delta - Time since last update in seconds
     */
    update(delta) {
        super.update(delta);
        if (!this.isActive || !this.effect) return;

        // Move the effect towards the target if movement is not complete
        const currentPosition = this.effect.position.clone();
        const distanceToTarget = currentPosition.distanceTo(this.targetPosition);
        const direction = new THREE.Vector3().subVectors(this.targetPosition, currentPosition).normalize();
        const moveDistance = Math.min(this.moveSpeed * delta, distanceToTarget);
        const newPosition = new THREE.Vector3().copy(currentPosition).add(
            direction.multiplyScalar(moveDistance)
        );
        this.effect.position.copy(newPosition);

        // Update particle system
        if (this.particleSystem) {
            const positions = this.particleSystem.geometry.attributes.position.array;
            
            // Store the particle system's world direction for consistent movement
            if (!this.particleDirection) {
                // Get the forward direction in world space
                this.particleDirection = new THREE.Vector3();
                this.effect.getWorldDirection(this.particleDirection);
                this.particleDirection.multiplyScalar(-1); // Invert if needed based on your coordinate system
            }
            
            for (let i = 0; i < positions.length; i += 3) {
                // Move particles along the beam in local space
                positions[i + 2] += delta * 5; // Increased speed for better visibility
                
                // Reset particles that reach the end
                if (positions[i + 2] > 5) {
                    positions[i + 2] = 0;
                    
                    // Create a new position around the cylinder
                    const angle = Math.random() * Math.PI * 2; // Random angle around the cylinder
                    const radius = 0.4; // Cylinder radius
                    
                    // Position particles in a spiral pattern around the cylinder
                    positions[i] = Math.cos(angle) * radius;     // X position (rotated around cylinder)
                    positions[i + 1] = Math.sin(angle) * radius; // Y position (rotated around cylinder)
                }
            }
            
            this.particleSystem.geometry.attributes.position.needsUpdate = true;
        }
        
        // Update ground indicator to show the path of the skill effect
        if (this.groundIndicator && this.effect && this.isActive) {
            // Update the ground indicator to match the effect's current position
            this.updateGroundIndicator(this.effect.position);
        }
        
        // Update locked enemies
        for (let i = this.targetedEnemies.length - 1; i >= 0; i--) {
            const targetData = this.targetedEnemies[i];
            
            // Skip if enemy is dead or no longer exists
            if (!targetData.enemy || targetData.enemy.isDead()) {
                this.targetedEnemies.splice(i, 1);
                continue;
            }
            
            // Update lock time
            targetData.lockTime -= delta;
            
            // Keep enemy in place while locked
            if (targetData.lockTime > 0) {
                targetData.enemy.setPosition(
                    targetData.originalPosition.x,
                    targetData.originalPosition.y,
                    targetData.originalPosition.z
                );
                // Apply damage over time (25% of initial damage per second)
                const dotDamage = (this.skill.damage * 0.25) * delta;
                targetData.enemy.takeDamage(dotDamage);
            } else {
                // Lock expired, remove from array
                this.targetedEnemies.splice(i, 1);
            }
        }
        
        // Get enemies within the ground rectangle area
        const nearbyEnemies = this.skill.game.enemyManager.getEnemiesNearPosition(currentPosition, this.radius);
        
        // Check each enemy
        for (const enemy of nearbyEnemies) {
            // Skip dead enemies or already targeted enemies
            if (enemy.isDead()) continue;
            
            // Check if this enemy is already locked
            const alreadyLocked = this.targetedEnemies.some(target => target.enemy === enemy);
            if (alreadyLocked) continue;

            const originalPosition = enemy.getPosition().clone();
            this.createLockEffect(enemy);

            // Lock the enemy immediately
            this.targetedEnemies.push({
                enemy: enemy,
                lockTime: this.lockDuration,
                originalPosition: originalPosition,
            });

            // Apply damage immediately
            enemy.takeDamage(this.skill.damage);
            
            // Immediately freeze the enemy in place
            enemy.setPosition(
                originalPosition.x,
                originalPosition.y,
                originalPosition.z
            );

            // Apply a stun effect if the enemy has that capability
            if (typeof enemy.stun === 'function') {
                enemy.stun(this.lockDuration);
            }

            // Play impact sound
            if (this.skill.game && this.skill.game.audioManager && this.skill.sounds) {
                this.skill.game.audioManager.playSound(this.skill.sounds.impact);
            }
            console.debug(`Locked enemy during travel: ${enemy.id || 'unknown'}`);
        }
    }
    
    /**
     * Dispose of the effect and clean up resources
     */
    dispose() {
        // Clean up lock effects
        this.lockEffects.forEach(effect => {
            if (effect.parent) {
                effect.parent.remove(effect);
            }
            
            if (effect.geometry) {
                effect.geometry.dispose();
            }
            
            if (effect.material) {
                effect.material.dispose();
            }
        });
        
        // Clean up ground indicator
        if (this.groundIndicator) {
            if (this.groundIndicator.parent) {
                this.groundIndicator.parent.remove(this.groundIndicator);
            }
            
            if (this.groundIndicator.geometry) {
                this.groundIndicator.geometry.dispose();
            }
            
            if (this.groundIndicator.material) {
                this.groundIndicator.material.dispose();
            }
            
            this.groundIndicator = null;
        }
        
        this.lockEffects = [];
        this.targetedEnemies = [];
        
        // Call parent dispose method
        super.dispose();
    }
    
    /**
     * Reset the effect to its initial state
     */
    reset() {
        // Clean up any existing effects
        this.dispose();
        
        // Reset state variables
        this.hasAutoAimed = false;
        this.targetedEnemies = [];
        this.lockEffects = [];
        this.particleSystem = null;
        this.particleDirection = null;
        this.targetEnemy = null;
        this.targetPosition = null;
        this.movementComplete = false;
        
        // Reset duration
        this.remainingDuration = this.effectDuration;
        
        // Call parent reset method
        super.reset();
    }
}