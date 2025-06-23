import * as THREE from 'three';
import { SevenSidedStrikeEffect } from '../../SevenSidedStrikeEffect.js';

/**
 * Specialized effect for Seven-Sided Strike - Shadow Assault variant
 * Creates shadow clones that perform additional strikes
 */
export class ShadowAssaultEffect extends SevenSidedStrikeEffect {
    constructor(skill) {
        super(skill);
        // Override base properties for this variant
        this.shadowCloneCount = 2; // Number of shadow clones to create
    }

    /**
     * Override the base method to create a specialized effect
     * @param {THREE.Group} effectGroup - Group to add the effect to
     * @param {THREE.Vector3} position - Starting position
     * @param {THREE.Vector3} direction - Direction to face
     * @private
     */
    _createSevenSidedStrikeEffect(effectGroup, position, direction) {
        // Call the parent method to create the base effect
        super._createSevenSidedStrikeEffect(effectGroup, position, direction);
        
        // Modify the effect for Shadow Assault variant
        if (this.sevenSidedStrikeState) {
            // Create shadow clones
            this.shadowClones = [];
            
            for (let i = 0; i < this.shadowCloneCount; i++) {
                // Clone the monk template
                const shadowMonk = this.sevenSidedStrikeState.monkTemplate.clone();
                
                // Apply shadow material to all meshes in the clone
                shadowMonk.traverse(child => {
                    if (child.isMesh && child.material) {
                        // Create shadow material
                        const shadowMaterial = new THREE.MeshBasicMaterial({
                            color: 0x000000,
                            transparent: true,
                            opacity: 0.7
                        });
                        
                        // Store original material
                        child.userData.originalMaterial = child.material;
                        
                        // Apply shadow material
                        child.material = shadowMaterial;
                    }
                });
                
                // Position shadow clone at a random strike point
                const randomPointIndex = Math.floor(Math.random() * this.sevenSidedStrikeState.strikePoints.length);
                const randomPoint = this.sevenSidedStrikeState.strikePoints[randomPointIndex];
                
                shadowMonk.position.copy(randomPoint.position);
                shadowMonk.position.y = 0; // On the ground
                
                // Face toward center
                const direction = new THREE.Vector3();
                // Use effectGroup's position instead of this.effect which might not be set yet
                direction.subVectors(effectGroup.position, randomPoint.position).normalize();
                shadowMonk.rotation.y = Math.atan2(direction.x, direction.z);
                
                // Store data
                shadowMonk.userData = {
                    isClone: true,
                    index: i,
                    active: true,
                    age: 0,
                    maxAge: this.sevenSidedStrikeState.strikeDuration * 8,
                    currentTarget: randomPointIndex,
                    nextTarget: null
                };
                
                shadowMonk.visible = true;
                effectGroup.add(shadowMonk);
                
                this.shadowClones.push(shadowMonk);
            }
            
            // Change the vortex color to dark shadow
            if (this.sevenSidedStrikeState.vortex) {
                this.sevenSidedStrikeState.vortex.material.color.set(0x222222);
                
                // Add shadow effect to vortex
                const shadowGeometry = new THREE.CircleGeometry(2.5, 32);
                const shadowMaterial = new THREE.MeshBasicMaterial({
                    color: 0x000000,
                    transparent: true,
                    opacity: 0.5,
                    side: THREE.DoubleSide
                });
                
                const shadowCircle = new THREE.Mesh(shadowGeometry, shadowMaterial);
                shadowCircle.rotation.x = -Math.PI / 2; // Lay flat
                shadowCircle.position.y = -2.49; // Just below the vortex
                
                effectGroup.add(shadowCircle);
                this.sevenSidedStrikeState.shadowCircle = shadowCircle;
            }
            
            // Add shadow trails for clones
            this.shadowTrails = [];
            for (let i = 0; i < this.shadowCloneCount; i++) {
                const trailGeometry = new THREE.PlaneGeometry(0.5, 2);
                const trailMaterial = new THREE.MeshBasicMaterial({
                    color: 0x000000,
                    transparent: true,
                    opacity: 0.5,
                    side: THREE.DoubleSide
                });
                
                const trail = new THREE.Mesh(trailGeometry, trailMaterial);
                trail.rotation.x = -Math.PI / 2; // Lay flat
                trail.visible = false;
                
                effectGroup.add(trail);
                this.shadowTrails.push(trail);
            }
        }
    }
    
    /**
     * Override the update method to add custom behavior
     * @param {number} delta - Time since last update in seconds
     * @private
     */
    _updateSevenSidedStrikeEffect(delta) {
        // Call the parent method to update the base effect
        super._updateSevenSidedStrikeEffect(delta);
        
        // Make sure we have the effect initialized
        if (!this.effect) return;
        
        // Update shadow clones
        if (this.sevenSidedStrikeState && this.shadowClones) {
            // Update shadow circle
            if (this.sevenSidedStrikeState.shadowCircle) {
                const shadowCircle = this.sevenSidedStrikeState.shadowCircle;
                // Pulse opacity
                shadowCircle.material.opacity = 0.3 + 0.2 * Math.sin(this.elapsedTime * 2);
            }
            
            // Update each shadow clone
            for (let i = 0; i < this.shadowClones.length; i++) {
                const clone = this.shadowClones[i];
                const trail = this.shadowTrails[i];
                
                if (clone.userData && clone.userData.active) {
                    // Update age
                    clone.userData.age += delta;
                    
                    // Check if clone should move to a new target
                    if (clone.userData.nextTarget === null && 
                        clone.userData.age > this.sevenSidedStrikeState.strikeDuration * 0.5) {
                        
                        // Choose a new target point
                        let newTargetIndex;
                        do {
                            newTargetIndex = Math.floor(Math.random() * this.sevenSidedStrikeState.strikePoints.length);
                        } while (newTargetIndex === clone.userData.currentTarget);
                        
                        clone.userData.nextTarget = newTargetIndex;
                        
                        // Show trail
                        if (trail) {
                            trail.visible = true;
                            
                            // Position trail between current and next position
                            const currentPoint = this.sevenSidedStrikeState.strikePoints[clone.userData.currentTarget].position;
                            const nextPoint = this.sevenSidedStrikeState.strikePoints[newTargetIndex].position;
                            
                            // Calculate midpoint and direction
                            const midpoint = new THREE.Vector3().addVectors(currentPoint, nextPoint).multiplyScalar(0.5);
                            const direction = new THREE.Vector3().subVectors(nextPoint, currentPoint);
                            const length = direction.length();
                            
                            // Position and scale trail
                            trail.position.copy(midpoint);
                            trail.position.y = 0.1;
                            trail.scale.set(1, length / 2, 1);
                            
                            // Rotate trail to face direction
                            trail.rotation.z = Math.atan2(direction.z, direction.x);
                        }
                    }
                    
                    // If clone has a target to move to
                    if (clone.userData.nextTarget !== null) {
                        const targetPoint = this.sevenSidedStrikeState.strikePoints[clone.userData.nextTarget].position;
                        const moveSpeed = 20; // Fast teleport speed
                        
                        // Move toward target
                        const direction = new THREE.Vector3().subVectors(targetPoint, clone.position).normalize();
                        clone.position.add(direction.multiplyScalar(moveSpeed * delta));
                        
                        // Rotate to face movement direction
                        clone.rotation.y = Math.atan2(direction.x, direction.z);
                        
                        // Check if reached target
                        const distanceToTarget = clone.position.distanceTo(targetPoint);
                        if (distanceToTarget < 0.5) {
                            // Arrived at target
                            clone.position.copy(targetPoint);
                            clone.userData.currentTarget = clone.userData.nextTarget;
                            clone.userData.nextTarget = null;
                            clone.userData.age = 0; // Reset age for new position
                            
                            // Hide trail
                            if (trail) {
                                trail.visible = false;
                            }
                            
                            // Create shadow strike effect
                            this._createShadowStrikeEffect(clone.position.clone());
                        }
                    }
                    
                    // Fade clone in and out
                    clone.traverse(child => {
                        if (child.isMesh && child.material) {
                            // Fade in at start
                            if (clone.userData.age < 0.2) {
                                child.material.opacity = clone.userData.age / 0.2 * 0.7;
                            }
                            // Fade out at end
                            else if (clone.userData.age > clone.userData.maxAge - 0.3) {
                                child.material.opacity = Math.max(0, 0.7 - (clone.userData.age - (clone.userData.maxAge - 0.3)) / 0.3 * 0.7);
                            }
                            // Normal opacity
                            else {
                                child.material.opacity = 0.7;
                            }
                        }
                    });
                }
            }
        }
    }
    
    /**
     * Create a shadow strike effect at the given position
     * @param {THREE.Vector3} position - Position to create the effect
     * @private
     */
    _createShadowStrikeEffect(position) {
        if (!this.effect) return;
        
        // Create a flash effect at the strike point
        const flashGeometry = new THREE.SphereGeometry(0.7, 16, 16);
        const flashMaterial = new THREE.MeshBasicMaterial({
            color: 0x000000,
            transparent: true,
            opacity: 1.0
        });
        
        const flash = new THREE.Mesh(flashGeometry, flashMaterial);
        flash.position.copy(position);
        flash.position.y = 0.5;
        flash.scale.set(0.1, 0.1, 0.1);
        
        // Store animation data
        flash.userData = {
            age: 0,
            maxAge: 0.3,
            isFlash: true
        };
        
        // Make sure this.effect exists before using it
        if (this.effect) {
            this.effect.add(flash);
            
            // Make sure sevenSidedStrikeState exists and has flashEffects array
            if (this.sevenSidedStrikeState && this.sevenSidedStrikeState.flashEffects) {
                this.sevenSidedStrikeState.flashEffects.push(flash);
            }
        }
        
        // Apply damage to enemies at this position if game reference exists
        if (this.skill.game && this.skill.game.enemyManager) {
            const damageRadius = 1.5;
            const enemies = this.skill.game.enemyManager.getEnemiesInRadius(position, damageRadius);
            
            for (const enemy of enemies) {
                // IMPORTANT: THIS CHECKED BY COLLISIONMANAGER
                // Apply damage (50% of normal strike damage)
                // const damage = this.skill.damage * 0.5;
                // enemy.takeDamage(damage, this.skill.damageType);
                
                // Apply shadow effect to enemy
                enemy.applyStatusEffect('slowed', 1.0, 0.5); // 50% slow for 1 second
            }
        }
    }
}