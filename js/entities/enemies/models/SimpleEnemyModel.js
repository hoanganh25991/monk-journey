import * as THREE from 'three';
import { EnemyModel } from './EnemyModel.js';

/**
 * SimpleEnemyModel - A basic enemy model implementation
 * Reuses the createSimplePlaceholder function from EnemyPreview
 */
export class SimpleEnemyModel extends EnemyModel {
    constructor(enemy, modelGroup) {
        super(enemy, modelGroup);
        this.createModel();
    }
    
    /**
     * Create the 3D model for this enemy type
     * Implementation based on EnemyPreview.createSimplePlaceholder
     */
    createModel() {
        // Get enemy color or use default
        const enemyColor = this.enemy.color || 0xcccccc;
        
        // Create a body (cube)
        const bodyGeometry = new THREE.BoxGeometry(1, 1.5, 0.8);
        const bodyMaterial = new THREE.MeshStandardMaterial({ 
            color: enemyColor,
            roughness: 0.7,
            metalness: 0.3
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.75;
        body.castShadow = true;
        body.receiveShadow = true;
        this.modelGroup.add(body);
        
        // Create a head (sphere)
        const headGeometry = new THREE.SphereGeometry(0.4, 16, 16);
        const headMaterial = new THREE.MeshStandardMaterial({ 
            color: enemyColor,
            roughness: 0.7,
            metalness: 0.3
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 1.85;
        head.castShadow = true;
        head.receiveShadow = true;
        this.modelGroup.add(head);
        
        // Create arms
        const armGeometry = new THREE.BoxGeometry(0.3, 0.8, 0.3);
        const armMaterial = new THREE.MeshStandardMaterial({ 
            color: enemyColor,
            roughness: 0.7,
            metalness: 0.3
        });
        
        // Left arm
        const leftArm = new THREE.Mesh(armGeometry, armMaterial);
        leftArm.position.set(-0.65, 0.75, 0);
        leftArm.castShadow = true;
        leftArm.receiveShadow = true;
        this.modelGroup.add(leftArm);
        
        // Right arm
        const rightArm = new THREE.Mesh(armGeometry, armMaterial);
        rightArm.position.set(0.65, 0.75, 0);
        rightArm.castShadow = true;
        rightArm.receiveShadow = true;
        this.modelGroup.add(rightArm);
        
        // Create legs
        const legGeometry = new THREE.BoxGeometry(0.3, 0.8, 0.3);
        const legMaterial = new THREE.MeshStandardMaterial({ 
            color: enemyColor,
            roughness: 0.7,
            metalness: 0.3
        });
        
        // Left leg
        const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
        leftLeg.position.set(-0.3, -0.4, 0);
        leftLeg.castShadow = true;
        leftLeg.receiveShadow = true;
        this.modelGroup.add(leftLeg);
        
        // Right leg
        const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
        rightLeg.position.set(0.3, -0.4, 0);
        rightLeg.castShadow = true;
        rightLeg.receiveShadow = true;
        this.modelGroup.add(rightLeg);
        
        // Add eyes (for all enemies)
        const eyeGeometry = new THREE.SphereGeometry(0.08, 8, 8);
        const eyeMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xff0000,  // Red eyes for all enemies
            emissive: 0xff0000,
            emissiveIntensity: 0.5
        });
        
        // Left eye
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.15, 1.9, 0.3);
        this.modelGroup.add(leftEye);
        
        // Right eye
        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.15, 1.9, 0.3);
        this.modelGroup.add(rightEye);
        return this.modelGroup;
    }
    
    /**
     * Update model animations
     * @param {number} delta - Time since last update in seconds
     */
    updateAnimations(delta) {
        // Use the base class animations for movement and attack
        super.updateAnimations(delta);
        
        // Add simple bobbing and head movement animations
        if (this.modelGroup) {
            const time = Date.now() * 0.001; // Convert to seconds
            
            // IMPORTANT: Do not modify this.modelGroup.position.y!
            // The Y position is managed by the Enemy class for proper terrain positioning.
            // Only animate individual child elements or apply offsets to child positions.
            
            // Apply subtle whole-body bobbing by offsetting all children slightly
            // Only apply bobbing if not moving or attacking (to avoid conflicting animations)
            if (!this.enemy.state.isMoving && !this.enemy.state.isAttacking) {
                const bobbingOffset = Math.sin(time * 1.5) * 0.05; // Small bobbing motion
                
                // Apply bobbing to all children by adjusting their Y positions slightly
                for (let i = 0; i < this.modelGroup.children.length; i++) {
                    const child = this.modelGroup.children[i];
                    if (child && child.userData && child.userData.originalY !== undefined) {
                        // Use stored original Y position
                        child.position.y = child.userData.originalY + bobbingOffset;
                    } else if (child && child.position) {
                        // Store original Y position if not already stored
                        if (child.userData.originalY === undefined) {
                            child.userData.originalY = child.position.y;
                        }
                        child.position.y = child.userData.originalY + bobbingOffset;
                    }
                }
            } else {
                // When moving or attacking, reset children to their original positions
                for (let i = 0; i < this.modelGroup.children.length; i++) {
                    const child = this.modelGroup.children[i];
                    if (child && child.userData && child.userData.originalY !== undefined) {
                        child.position.y = child.userData.originalY;
                    }
                }
            }
            
            // Apply subtle head movement without affecting the main facing direction
            // The main Y rotation (facing direction) is handled by the Enemy class
            if (!this.enemy.state.isAttacking && this.modelGroup.children.length > 1) {
                // Only animate the head (second child) for subtle movement
                const head = this.modelGroup.children[1]; // Head is the second child
                if (head) {
                    // Subtle head bobbing and turning
                    head.rotation.x = Math.sin(time * 1.2) * 0.05; // Slight nod
                    head.rotation.y = Math.sin(time * 0.8) * 0.1;  // Slight head turn
                }
            }
        }
    }
}