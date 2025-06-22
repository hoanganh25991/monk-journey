import * as THREE from 'three';
import { EnemyModel } from './EnemyModel.js';

export class SkeletonModel extends EnemyModel {
    constructor(enemy, modelGroup) {
        super(enemy, modelGroup);
    }
    
    createModel() {
        // Create body (thin box)
        const bodyGeometry = new THREE.BoxGeometry(0.6, 1.2, 0.3);
        const bodyMaterial = new THREE.MeshStandardMaterial({ color: this.enemy.color });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.6;
        body.castShadow = true;
        
        this.modelGroup.add(body);
        
        // Create head (skull-like sphere)
        const headGeometry = new THREE.SphereGeometry(0.25, 16, 16);
        const headMaterial = new THREE.MeshStandardMaterial({ color: this.enemy.color });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 1.4;
        head.scale.set(1, 1.2, 1);
        head.castShadow = true;
        
        this.modelGroup.add(head);
        
        // Create arms (thin cylinders)
        const armGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.8, 8);
        const armMaterial = new THREE.MeshStandardMaterial({ color: this.enemy.color });
        
        // Left arm
        const leftArm = new THREE.Mesh(armGeometry, armMaterial);
        leftArm.position.set(-0.4, 0.6, 0);
        leftArm.rotation.z = Math.PI / 4;
        leftArm.castShadow = true;
        
        this.modelGroup.add(leftArm);
        
        // Right arm
        const rightArm = new THREE.Mesh(armGeometry, armMaterial);
        rightArm.position.set(0.4, 0.6, 0);
        rightArm.rotation.z = -Math.PI / 4;
        rightArm.castShadow = true;
        
        this.modelGroup.add(rightArm);
        
        // Create legs (thin cylinders)
        const legGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.6, 8);
        const legMaterial = new THREE.MeshStandardMaterial({ color: this.enemy.color });
        
        // Left leg
        const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
        leftLeg.position.set(-0.2, 0, 0);
        leftLeg.castShadow = true;
        
        this.modelGroup.add(leftLeg);
        
        // Right leg
        const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
        rightLeg.position.set(0.2, 0, 0);
        rightLeg.castShadow = true;
        
        this.modelGroup.add(rightLeg);
        
        // Add weapon for skeleton king
        if (this.enemy.type === 'skeleton_king') {
            // Create crown
            const crownGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 8);
            const crownMaterial = new THREE.MeshStandardMaterial({ color: 0xffcc00 });
            const crown = new THREE.Mesh(crownGeometry, crownMaterial);
            crown.position.y = 1.6;
            crown.castShadow = true;
            
            this.modelGroup.add(crown);
            
            // Create sword
            const swordGeometry = new THREE.BoxGeometry(0.1, 1, 0.1);
            const swordMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 });
            const sword = new THREE.Mesh(swordGeometry, swordMaterial);
            sword.position.set(0.6, 0.6, 0);
            sword.castShadow = true;
            
            this.modelGroup.add(sword);
        }
    }
    
    updateAnimations(delta) {
        // Use the base class animations with some skeleton-specific adjustments
        super.updateAnimations(delta);
        
        const time = Date.now() * 0.001; // Convert to seconds
        
        // Add some additional skeleton-specific animations
        if (this.modelGroup) {
            // Idle animation - slight swaying when not moving or attacking
            // Note: Y rotation (facing direction) is handled by the Enemy class
            if (!this.enemy.state.isMoving && !this.enemy.state.isAttacking && this.modelGroup.children.length > 0) {
                const idleSpeed = 1.5;
                const idleAmplitude = 0.03;
                
                // Make the skeleton's body sway slightly when idle (X and Z rotation only)
                const body = this.modelGroup.children[0]; // Body is the first child
                if (body) {
                    body.rotation.x = Math.sin(time * idleSpeed) * idleAmplitude * 0.5;
                    body.rotation.z = Math.cos(time * idleSpeed * 0.7) * idleAmplitude * 0.3;
                }
            }
            
            // Skeleton King attack animation with sword
            if (this.enemy.type === 'skeleton_king' && this.enemy.state.isAttacking) {
                // Get the sword (should be the last child for skeleton king)
                const sword = this.modelGroup.children[this.modelGroup.children.length - 1];
                const rightArm = this.modelGroup.children[3]; // Right arm is the 4th child
                
                if (sword) {
                    // Calculate attack cycle (0 to 2π)
                    const attackCycle = (time * 8.0) % (2 * Math.PI);
                    
                    // Swing the sword in an arc
                    if (attackCycle < Math.PI) {
                        // Upswing phase
                        const upswingProgress = attackCycle / Math.PI;
                        
                        // Move sword up and back
                        sword.position.y = 0.6 + upswingProgress * 0.8;
                        sword.position.x = 0.6 - upswingProgress * 0.3;
                        
                        // Rotate sword for upswing
                        sword.rotation.z = -upswingProgress * Math.PI * 0.5;
                    } else {
                        // Downswing phase (faster and more aggressive)
                        const downswingProgress = (attackCycle - Math.PI) / Math.PI;
                        
                        // Move sword down and forward in a slashing motion
                        sword.position.y = 1.4 - downswingProgress * 1.2;
                        sword.position.x = 0.3 + downswingProgress * 0.5;
                        
                        // Rotate sword for downswing
                        sword.rotation.z = -Math.PI * 0.5 + downswingProgress * Math.PI * 0.7;
                    }
                    
                    // Animate the right arm to follow the sword
                    if (rightArm) {
                        if (attackCycle < Math.PI) {
                            // Raise arm during upswing
                            rightArm.rotation.z = -Math.PI / 4 - (attackCycle / Math.PI) * 0.5;
                            rightArm.position.y = 0.6 + (attackCycle / Math.PI) * 0.2;
                        } else {
                            // Lower arm during downswing
                            const downProgress = (attackCycle - Math.PI) / Math.PI;
                            rightArm.rotation.z = -Math.PI / 4 - 0.5 + downProgress * 0.7;
                            rightArm.position.y = 0.8 - downProgress * 0.2;
                        }
                    }
                }
            } else if (this.enemy.state.isAttacking) {
                // Regular skeleton attack animation (without sword)
                // Get the right arm for attack animation
                const rightArm = this.modelGroup.children[3]; // Right arm is the 4th child
                
                if (rightArm) {
                    // Simple punching motion
                    rightArm.rotation.z = -Math.PI / 4 + Math.sin(time * 8.0) * 0.5;
                    rightArm.rotation.x = Math.sin(time * 8.0) * 0.5;
                }
            }
        }
    }
}