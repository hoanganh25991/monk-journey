import * as THREE from 'three';
import { EnemyModel } from './EnemyModel.js';

export class ShadowBeastModel extends EnemyModel {
    constructor(enemy, modelGroup) {
        super(enemy, modelGroup);
    }
    
    createModel() {
        // Create body (dark, amorphous shape)
        const bodyGeometry = new THREE.SphereGeometry(0.8, 16, 16);
        const bodyMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x000000,
            roughness: 1.0,
            metalness: 0.0,
            transparent: true,
            opacity: 0.8
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.8;
        body.scale.set(1, 0.8, 1.2);
        body.castShadow = true;
        
        this.modelGroup.add(body);
        
        // Create head (part of the amorphous shape)
        const headGeometry = new THREE.SphereGeometry(0.5, 16, 16);
        const headMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x000000,
            roughness: 1.0,
            metalness: 0.0,
            transparent: true,
            opacity: 0.8
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 1.5;
        head.castShadow = true;
        
        this.modelGroup.add(head);
        
        // Create glowing eyes
        const eyeGeometry = new THREE.SphereGeometry(0.1, 8, 8);
        const eyeMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xff0000,
            emissive: 0xff0000,
            emissiveIntensity: 1.0
        });
        
        // Left eye
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.2, 1.6, 0.3);
        
        this.modelGroup.add(leftEye);
        
        // Right eye
        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.2, 1.6, 0.3);
        
        this.modelGroup.add(rightEye);
        
        // Create tendrils/arms
        const tendrilGeometry = new THREE.CylinderGeometry(0.1, 0.05, 1.2, 8);
        const tendrilMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x000000,
            roughness: 1.0,
            metalness: 0.0,
            transparent: true,
            opacity: 0.7
        });
        
        // Create 4 tendrils
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2;
            const tendril = new THREE.Mesh(tendrilGeometry, tendrilMaterial);
            tendril.position.set(
                Math.cos(angle) * 0.5,
                0.8,
                Math.sin(angle) * 0.5
            );
            tendril.rotation.x = Math.PI / 2;
            tendril.rotation.z = angle;
            tendril.castShadow = true;
            
            this.modelGroup.add(tendril);
        }
        
        // Create shadow aura
        const auraGeometry = new THREE.RingGeometry(1, 1.5, 32);
        const auraMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x000000,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
        });
        const aura = new THREE.Mesh(auraGeometry, auraMaterial);
        aura.rotation.x = -Math.PI / 2;
        aura.position.y = 0.1;
        
        this.modelGroup.add(aura);
    }
    
    updateAnimations(delta) {
        // Shadow beast specific animations
        // For example, pulsating shadow aura or moving tendrils
    }
}