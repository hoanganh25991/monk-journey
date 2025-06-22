import * as THREE from 'three';

/**
 * Interface for enemy models
 * This class defines the contract that all enemy model implementations must follow
 */
export class EnemyModel {
    /**
     * Create a new enemy model
     * @param {Object} enemy - The enemy instance this model belongs to
     * @param {THREE.Group} modelGroup - The THREE.js group to add model parts to
     */
    constructor(enemy, modelGroup) {
        this.enemy = enemy;
        this.modelGroup = modelGroup;
        
        // Ensure child classes implement required methods
        if (this.constructor === EnemyModel) {
            throw new Error("EnemyModel is an abstract class and cannot be instantiated directly");
        }
    }
    
    /**
     * Create the 3D model for this enemy type
     * Must be implemented by all subclasses
     */
    createModel() {
        throw new Error("Method 'createModel()' must be implemented by subclass");
    }
    
    /**
     * Load a 3D model from a GLB file (for future implementation)
     * @param {string} path - Path to the GLB file
     * @returns {Promise} - Promise that resolves when the model is loaded
     */
    async loadFromGLB(path) {
        // This is a placeholder for future implementation
        // Will be used to load models from GLB files
        console.debug(`Loading model from ${path} - not yet implemented`);
        return Promise.resolve();
    }
    
    /**
     * Update model animations
     * @param {number} delta - Time since last update in seconds
     * 
     * IMPORTANT: Do not modify this.modelGroup.rotation.y in subclasses!
     * The Y rotation (facing direction) is managed by the Enemy class to ensure
     * enemies face the player correctly. Only modify individual child rotations
     * or X/Z rotations of the model group for animations.
     */
    updateAnimations(delta) {
        // Default implementation for basic animations
        // This will be called if a subclass doesn't override it
        
        if (!this.modelGroup || !this.enemy) return;
        
        // Only animate if the enemy is moving or attacking
        if (this.enemy.state.isMoving) {
            this.animateMovement(delta);
        }
        
        if (this.enemy.state.isAttacking) {
            this.animateAttack(delta);
        }
    }
    
    /**
     * Animate enemy movement
     * @param {number} delta - Time since last update in seconds
     */
    animateMovement(delta) {
        if (!this.modelGroup) return;
        
        // Walking animation
        const walkSpeed = 5;
        const walkAmplitude = 0.1;
        
        // Animate legs
        if (this.modelGroup.children.length >= 6) {
            const leftLeg = this.modelGroup.children[4];
            const rightLeg = this.modelGroup.children[5];
            
            if (leftLeg && leftLeg.position) {
                leftLeg.position.z = Math.sin(Date.now() * 0.01 * walkSpeed) * walkAmplitude;
            }
            
            if (rightLeg && rightLeg.position) {
                rightLeg.position.z = -Math.sin(Date.now() * 0.01 * walkSpeed) * walkAmplitude;
            }
        }
        
        // Animate arms
        if (this.modelGroup.children.length >= 4) {
            const leftArm = this.modelGroup.children[2];
            const rightArm = this.modelGroup.children[3];
            
            if (leftArm && leftArm.rotation) {
                leftArm.rotation.x = Math.sin(Date.now() * 0.01 * walkSpeed) * 0.2;
            }
            
            if (rightArm && rightArm.rotation) {
                rightArm.rotation.x = -Math.sin(Date.now() * 0.01 * walkSpeed) * 0.2;
            }
        }
    }
    
    /**
     * Animate enemy attack
     * @param {number} delta - Time since last update in seconds
     */
    animateAttack(delta) {
        if (!this.modelGroup) return;
        
        // Simple attack animation
        if (this.modelGroup.children.length >= 4) {
            const rightArm = this.modelGroup.children[3];
            
            if (rightArm && rightArm.rotation) {
                rightArm.rotation.x = Math.sin(Date.now() * 0.02) * 0.5;
            }
        }
    }
}