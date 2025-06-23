import * as THREE from 'three';
import { EnemyModel } from './EnemyModel.js';

export class InfernalGolemModel extends EnemyModel {
    constructor(enemy, modelGroup) {
        super(enemy, modelGroup);
    }
    
    createModel() {
        // Create body (large, rocky structure)
        const bodyGeometry = new THREE.BoxGeometry(1.5, 1.5, 1);
        const bodyMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x333333,
            roughness: 1.0,
            metalness: 0.2
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.75;
        body.castShadow = true;
        
        this.modelGroup.add(body);
        
        // Create head (smaller box)
        const headGeometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
        const headMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x333333,
            roughness: 1.0,
            metalness: 0.2
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 1.8;
        head.castShadow = true;
        
        this.modelGroup.add(head);
        
        // Create glowing cracks
        const crackGeometry = new THREE.BoxGeometry(0.1, 1.4, 0.1);
        const crackMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xff3300,
            emissive: 0xff3300,
            emissiveIntensity: 1.0
        });
        
        // Vertical crack
        const verticalCrack = new THREE.Mesh(crackGeometry, crackMaterial);
        verticalCrack.position.set(0, 0.75, 0.51);
        
        this.modelGroup.add(verticalCrack);
        
        // Horizontal crack
        const horizontalCrack = new THREE.Mesh(crackGeometry, crackMaterial);
        horizontalCrack.position.set(0, 0.75, 0.51);
        horizontalCrack.rotation.z = Math.PI / 2;
        
        this.modelGroup.add(horizontalCrack);
        
        // Create arms (large, rocky cylinders)
        const armGeometry = new THREE.CylinderGeometry(0.3, 0.3, 1.2, 8);
        const armMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x333333,
            roughness: 1.0,
            metalness: 0.2
        });
        
        // Left arm
        const leftArm = new THREE.Mesh(armGeometry, armMaterial);
        leftArm.position.set(-1.0, 0.9, 0);
        leftArm.rotation.z = Math.PI / 2;
        leftArm.castShadow = true;
        
        this.modelGroup.add(leftArm);
        
        // Right arm
        const rightArm = new THREE.Mesh(armGeometry, armMaterial);
        rightArm.position.set(1.0, 0.9, 0);
        rightArm.rotation.z = -Math.PI / 2;
        rightArm.castShadow = true;
        
        this.modelGroup.add(rightArm);
        
        // Create fists (large spheres)
        const fistGeometry = new THREE.SphereGeometry(0.4, 16, 16);
        const fistMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x333333,
            roughness: 1.0,
            metalness: 0.2
        });
        
        // Left fist
        const leftFist = new THREE.Mesh(fistGeometry, fistMaterial);
        leftFist.position.set(-1.8, 0.9, 0);
        leftFist.castShadow = true;
        
        this.modelGroup.add(leftFist);
        
        // Right fist
        const rightFist = new THREE.Mesh(fistGeometry, fistMaterial);
        rightFist.position.set(1.8, 0.9, 0);
        rightFist.castShadow = true;
        
        this.modelGroup.add(rightFist);
        
        // Create legs (thick cylinders)
        const legGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.8, 8);
        const legMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x333333,
            roughness: 1.0,
            metalness: 0.2
        });
        
        // Left leg
        const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
        leftLeg.position.set(-0.5, 0, 0);
        leftLeg.castShadow = true;
        
        this.modelGroup.add(leftLeg);
        
        // Right leg
        const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
        rightLeg.position.set(0.5, 0, 0);
        rightLeg.castShadow = true;
        
        this.modelGroup.add(rightLeg);
        
        // Add glowing eyes
        const eyeGeometry = new THREE.SphereGeometry(0.1, 8, 8);
        const eyeMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xff3300,
            emissive: 0xff3300,
            emissiveIntensity: 1.0
        });
        
        // Left eye
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.2, 1.8, 0.4);
        
        this.modelGroup.add(leftEye);
        
        // Right eye
        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.2, 1.8, 0.4);
        
        this.modelGroup.add(rightEye);
    }
    
    updateAnimations(delta) {
        // Infernal golem specific animations
        // For example, pulsating cracks or glowing eyes
    }
}