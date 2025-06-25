import * as THREE from 'three';
import { EnemyModel } from './EnemyModel.js';

export class ZombieModel extends EnemyModel {
    constructor(enemy, modelGroup) {
        super(enemy, modelGroup);
    }
    
    createModel() {
        // Create body (slightly hunched box)
        const bodyGeometry = new THREE.BoxGeometry(0.8, 1, 0.4);
        const bodyMaterial = new THREE.MeshStandardMaterial({ color: this.enemy.color });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.5;
        body.rotation.x = 0.2;
        body.castShadow = true;
        
        this.modelGroup.add(body);
        
        // Create head (deformed sphere)
        const headGeometry = new THREE.SphereGeometry(0.25, 16, 16);
        const headMaterial = new THREE.MeshStandardMaterial({ color: this.enemy.color });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 1.2;
        head.position.z = 0.1;
        head.scale.set(1, 0.9, 1.1);
        head.castShadow = true;
        
        this.modelGroup.add(head);
        
        // Create arms (uneven cylinders)
        const leftArmGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.9, 8);
        const rightArmGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.7, 8);
        const armMaterial = new THREE.MeshStandardMaterial({ color: this.enemy.color });
        
        // Left arm (longer)
        const leftArm = new THREE.Mesh(leftArmGeometry, armMaterial);
        leftArm.position.set(-0.5, 0.6, 0);
        leftArm.rotation.z = Math.PI / 3;
        leftArm.castShadow = true;
        
        this.modelGroup.add(leftArm);
        
        // Right arm (shorter)
        const rightArm = new THREE.Mesh(rightArmGeometry, armMaterial);
        rightArm.position.set(0.5, 0.6, 0);
        rightArm.rotation.z = -Math.PI / 4;
        rightArm.castShadow = true;
        
        this.modelGroup.add(rightArm);
        
        // Create legs (uneven cylinders)
        const leftLegGeometry = new THREE.CylinderGeometry(0.12, 0.12, 0.6, 8);
        const rightLegGeometry = new THREE.CylinderGeometry(0.12, 0.1, 0.5, 8);
        const legMaterial = new THREE.MeshStandardMaterial({ color: this.enemy.color });
        
        // Left leg (normal)
        const leftLeg = new THREE.Mesh(leftLegGeometry, legMaterial);
        leftLeg.position.set(-0.25, 0, 0);
        leftLeg.castShadow = true;
        
        this.modelGroup.add(leftLeg);
        
        // Right leg (shorter)
        const rightLeg = new THREE.Mesh(rightLegGeometry, legMaterial);
        rightLeg.position.set(0.25, -0.05, 0);
        rightLeg.castShadow = true;
        
        this.modelGroup.add(rightLeg);
        
        // Add some torn clothes
        const clothGeometry = new THREE.BoxGeometry(0.9, 0.4, 0.5);
        const clothMaterial = new THREE.MeshStandardMaterial({ color: 0x554433 });
        const cloth = new THREE.Mesh(clothGeometry, clothMaterial);
        cloth.position.y = 0.7;
        cloth.castShadow = true;
        
        this.modelGroup.add(cloth);
    }
    
    updateAnimations(delta) {
        // Call the base class animations
        super.updateAnimations(delta);
        
        // Zombie-specific animations
        if (this.modelGroup) {
            const time = Date.now() * 0.001; // Convert to seconds
            
            // IMPORTANT: Do not modify this.modelGroup.position.y!
            // The Y position is managed by the Enemy class for proper terrain positioning.
            
            // Add a shambling effect when moving
            if (this.enemy.state.isMoving) {
                // Slight side-to-side movement for shambling effect
                this.modelGroup.rotation.z = Math.sin(time * 2.0) * 0.05;
                
                // Slight forward lean when moving
                this.modelGroup.rotation.x = 0.1;
            } else {
                // Reset rotation when not moving
                this.modelGroup.rotation.z = 0;
                this.modelGroup.rotation.x = 0;
            }
        }
    }
}