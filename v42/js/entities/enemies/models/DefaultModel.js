import * as THREE from 'three';
import { EnemyModel } from './EnemyModel.js';

export class DefaultModel extends EnemyModel {
    constructor(enemy, modelGroup) {
        super(enemy, modelGroup);
    }
    
    createModel() {
        // Create body (cube)
        const bodyGeometry = new THREE.BoxGeometry(0.8, 1, 0.8);
        const bodyMaterial = new THREE.MeshStandardMaterial({ color: this.enemy.color });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.5;
        body.castShadow = true;
        
        this.modelGroup.add(body);
        
        // Create head (sphere)
        const headGeometry = new THREE.SphereGeometry(0.3, 16, 16);
        const headMaterial = new THREE.MeshStandardMaterial({ color: this.enemy.color });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 1.3;
        head.castShadow = true;
        
        this.modelGroup.add(head);
        
        // Create limbs (cylinders)
        const limbGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.6, 8);
        const limbMaterial = new THREE.MeshStandardMaterial({ color: this.enemy.color });
        
        // Left arm
        const leftArm = new THREE.Mesh(limbGeometry, limbMaterial);
        leftArm.position.set(-0.5, 0.5, 0);
        leftArm.rotation.z = Math.PI / 2;
        leftArm.castShadow = true;
        
        this.modelGroup.add(leftArm);
        
        // Right arm
        const rightArm = new THREE.Mesh(limbGeometry, limbMaterial);
        rightArm.position.set(0.5, 0.5, 0);
        rightArm.rotation.z = -Math.PI / 2;
        rightArm.castShadow = true;
        
        this.modelGroup.add(rightArm);
        
        // Left leg
        const leftLeg = new THREE.Mesh(limbGeometry, limbMaterial);
        leftLeg.position.set(-0.3, -0.1, 0);
        leftLeg.castShadow = true;
        
        this.modelGroup.add(leftLeg);
        
        // Right leg
        const rightLeg = new THREE.Mesh(limbGeometry, limbMaterial);
        rightLeg.position.set(0.3, -0.1, 0);
        rightLeg.castShadow = true;
        
        this.modelGroup.add(rightLeg);
    }
    
    updateAnimations(delta) {
        // Use the base class animations
        super.updateAnimations(delta);
    }
}