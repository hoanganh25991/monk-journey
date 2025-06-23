import * as THREE from 'three';
import { EnemyModel } from './EnemyModel.js';

export class DemonModel extends EnemyModel {
    constructor(enemy, modelGroup) {
        super(enemy, modelGroup);
    }
    
    createModel() {
        // Create body (muscular box)
        const bodyGeometry = new THREE.BoxGeometry(1, 1.2, 0.6);
        const bodyMaterial = new THREE.MeshStandardMaterial({ color: this.enemy.color });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.6;
        body.castShadow = true;
        
        this.modelGroup.add(body);
        
        // Create head (horned sphere)
        const headGeometry = new THREE.SphereGeometry(0.3, 16, 16);
        const headMaterial = new THREE.MeshStandardMaterial({ color: this.enemy.color });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 1.5;
        head.castShadow = true;
        
        this.modelGroup.add(head);
        
        // Create horns
        const hornGeometry = new THREE.ConeGeometry(0.1, 0.4, 8);
        const hornMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
        
        // Left horn
        const leftHorn = new THREE.Mesh(hornGeometry, hornMaterial);
        leftHorn.position.set(-0.2, 1.7, 0);
        leftHorn.rotation.z = -Math.PI / 6;
        leftHorn.castShadow = true;
        
        this.modelGroup.add(leftHorn);
        
        // Right horn
        const rightHorn = new THREE.Mesh(hornGeometry, hornMaterial);
        rightHorn.position.set(0.2, 1.7, 0);
        rightHorn.rotation.z = Math.PI / 6;
        rightHorn.castShadow = true;
        
        this.modelGroup.add(rightHorn);
        
        // Create arms (muscular cylinders)
        const armGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.8, 8);
        const armMaterial = new THREE.MeshStandardMaterial({ color: this.enemy.color });
        
        // Left arm
        const leftArm = new THREE.Mesh(armGeometry, armMaterial);
        leftArm.position.set(-0.6, 0.6, 0);
        leftArm.rotation.z = Math.PI / 6;
        leftArm.castShadow = true;
        
        this.modelGroup.add(leftArm);
        
        // Right arm
        const rightArm = new THREE.Mesh(armGeometry, armMaterial);
        rightArm.position.set(0.6, 0.6, 0);
        rightArm.rotation.z = -Math.PI / 6;
        rightArm.castShadow = true;
        
        this.modelGroup.add(rightArm);
        
        // Create legs (muscular cylinders)
        const legGeometry = new THREE.CylinderGeometry(0.2, 0.15, 0.6, 8);
        const legMaterial = new THREE.MeshStandardMaterial({ color: this.enemy.color });
        
        // Left leg
        const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
        leftLeg.position.set(-0.3, 0, 0);
        leftLeg.castShadow = true;
        
        this.modelGroup.add(leftLeg);
        
        // Right leg
        const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
        rightLeg.position.set(0.3, 0, 0);
        rightLeg.castShadow = true;
        
        this.modelGroup.add(rightLeg);
        
        // Add wings for demon lord
        if (this.enemy.type === 'demon_lord') {
            // Create wings
            const wingGeometry = new THREE.BoxGeometry(1, 0.1, 1.5);
            const wingMaterial = new THREE.MeshStandardMaterial({ color: 0x550000 });
            
            // Left wing
            const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
            leftWing.position.set(-0.8, 0.8, 0);
            leftWing.rotation.y = Math.PI / 4;
            leftWing.rotation.x = Math.PI / 6;
            leftWing.castShadow = true;
            
            this.modelGroup.add(leftWing);
            
            // Right wing
            const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
            rightWing.position.set(0.8, 0.8, 0);
            rightWing.rotation.y = -Math.PI / 4;
            rightWing.rotation.x = Math.PI / 6;
            rightWing.castShadow = true;
            
            this.modelGroup.add(rightWing);
            
            // Create weapon (trident)
            const tridentHandleGeometry = new THREE.CylinderGeometry(0.05, 0.05, 1.5, 8);
            const tridentHandleMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
            const tridentHandle = new THREE.Mesh(tridentHandleGeometry, tridentHandleMaterial);
            tridentHandle.position.set(0.8, 0.6, 0);
            tridentHandle.rotation.z = -Math.PI / 2;
            tridentHandle.castShadow = true;
            
            this.modelGroup.add(tridentHandle);
            
            // Create trident prongs
            const prongGeometry = new THREE.ConeGeometry(0.05, 0.3, 8);
            const prongMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
            
            // Middle prong
            const middleProng = new THREE.Mesh(prongGeometry, prongMaterial);
            middleProng.position.set(1.5, 0.6, 0);
            middleProng.rotation.z = -Math.PI / 2;
            middleProng.castShadow = true;
            
            this.modelGroup.add(middleProng);
            
            // Top prong
            const topProng = new THREE.Mesh(prongGeometry, prongMaterial);
            topProng.position.set(1.5, 0.7, 0);
            topProng.rotation.z = -Math.PI / 2;
            topProng.castShadow = true;
            
            this.modelGroup.add(topProng);
            
            // Bottom prong
            const bottomProng = new THREE.Mesh(prongGeometry, prongMaterial);
            bottomProng.position.set(1.5, 0.5, 0);
            bottomProng.rotation.z = -Math.PI / 2;
            bottomProng.castShadow = true;
            
            this.modelGroup.add(bottomProng);
        }
    }
    
    updateAnimations(delta) {
        // Implement demon-specific animations here if needed
    }
}