import * as THREE from 'three';
import { EnemyModel } from './EnemyModel.js';

export class FrostMonarchModel extends EnemyModel {
    constructor(enemy, modelGroup) {
        super(enemy, modelGroup);
    }
    
    createModel() {
        // Create body (regal ice body, larger than titan)
        const bodyGeometry = new THREE.BoxGeometry(1.8, 2.5, 1.2);
        const bodyMaterial = new THREE.MeshStandardMaterial({ 
            color: this.enemy.color,
            roughness: 0.2,
            metalness: 0.9,
            transparent: true,
            opacity: 0.95
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 1.25;
        body.castShadow = true;
        
        this.modelGroup.add(body);
        
        // Create head (crystalline crown structure)
        const headGeometry = new THREE.DodecahedronGeometry(0.7, 1);
        const headMaterial = new THREE.MeshStandardMaterial({ 
            color: this.enemy.color,
            roughness: 0.1,
            metalness: 1.0,
            transparent: true,
            opacity: 0.9
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 3;
        head.castShadow = true;
        
        this.modelGroup.add(head);
        
        // Create royal ice crown
        const crownGeometry = new THREE.CylinderGeometry(0.8, 0.9, 0.5, 12);
        const crownMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xffffff,
            roughness: 0.1,
            metalness: 1.0,
            transparent: true,
            opacity: 0.8
        });
        const crown = new THREE.Mesh(crownGeometry, crownMaterial);
        crown.position.y = 3.4;
        crown.castShadow = true;
        
        this.modelGroup.add(crown);
        
        // Create elaborate crown spikes (more than titan)
        const spikeGeometry = new THREE.ConeGeometry(0.15, 1.2, 8);
        const spikeMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xaaddff,
            roughness: 0.1,
            metalness: 1.0,
            emissive: 0x004477,
            emissiveIntensity: 0.3
        });
        
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const crownSpike = new THREE.Mesh(spikeGeometry, spikeMaterial);
            crownSpike.position.set(
                Math.cos(angle) * 0.8,
                3.8,
                Math.sin(angle) * 0.8
            );
            crownSpike.rotation.x = Math.PI / 2;
            crownSpike.rotation.z = -angle;
            crownSpike.castShadow = true;
            
            this.modelGroup.add(crownSpike);
        }
        
        // Create royal shoulder pauldrons
        const pauldronGeometry = new THREE.SphereGeometry(0.4, 16, 16);
        const pauldronMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xffffff,
            roughness: 0.2,
            metalness: 0.9,
            transparent: true,
            opacity: 0.8
        });
        
        // Left pauldron
        const leftPauldron = new THREE.Mesh(pauldronGeometry, pauldronMaterial);
        leftPauldron.position.set(-1.2, 2.2, 0);
        leftPauldron.scale.set(1, 0.8, 1);
        leftPauldron.castShadow = true;
        
        this.modelGroup.add(leftPauldron);
        
        // Right pauldron
        const rightPauldron = new THREE.Mesh(pauldronGeometry, pauldronMaterial);
        rightPauldron.position.set(1.2, 2.2, 0);
        rightPauldron.scale.set(1, 0.8, 1);
        rightPauldron.castShadow = true;
        
        this.modelGroup.add(rightPauldron);
        
        // Create arms (more elegant than titan)
        const armGeometry = new THREE.CylinderGeometry(0.3, 0.2, 1.5, 12);
        const armMaterial = new THREE.MeshStandardMaterial({ 
            color: this.enemy.color,
            roughness: 0.2,
            metalness: 0.9,
            transparent: true,
            opacity: 0.95
        });
        
        // Left arm
        const leftArm = new THREE.Mesh(armGeometry, armMaterial);
        leftArm.position.set(-1.2, 1.5, 0);
        leftArm.rotation.z = Math.PI / 6;
        leftArm.castShadow = true;
        
        this.modelGroup.add(leftArm);
        
        // Right arm
        const rightArm = new THREE.Mesh(armGeometry, armMaterial);
        rightArm.position.set(1.2, 1.5, 0);
        rightArm.rotation.z = -Math.PI / 6;
        rightArm.castShadow = true;
        
        this.modelGroup.add(rightArm);
        
        // Create legs (royal pillars)
        const legGeometry = new THREE.CylinderGeometry(0.35, 0.25, 1.2, 12);
        const legMaterial = new THREE.MeshStandardMaterial({ 
            color: this.enemy.color,
            roughness: 0.3,
            metalness: 0.8,
            transparent: true,
            opacity: 0.95
        });
        
        // Left leg
        const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
        leftLeg.position.set(-0.6, 0.1, 0);
        leftLeg.castShadow = true;
        
        this.modelGroup.add(leftLeg);
        
        // Right leg
        const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
        rightLeg.position.set(0.6, 0.1, 0);
        rightLeg.castShadow = true;
        
        this.modelGroup.add(rightLeg);
        
        // Create royal scepter (more elaborate than titan's staff)
        const scepterGeometry = new THREE.CylinderGeometry(0.08, 0.08, 3, 12);
        const scepterMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xffffff,
            roughness: 0.1,
            metalness: 1.0,
            emissive: 0x002244,
            emissiveIntensity: 0.2
        });
        const scepter = new THREE.Mesh(scepterGeometry, scepterMaterial);
        scepter.position.set(1.5, 1.5, 0);
        scepter.rotation.z = -Math.PI / 2;
        scepter.castShadow = true;
        
        this.modelGroup.add(scepter);
        
        // Create ornate scepter head
        const scepterHeadGeometry = new THREE.OctahedronGeometry(0.4, 2);
        const scepterHeadMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x88ddff,
            roughness: 0.05,
            metalness: 1.0,
            transparent: true,
            opacity: 0.9,
            emissive: 0x0066aa,
            emissiveIntensity: 0.5
        });
        const scepterHead = new THREE.Mesh(scepterHeadGeometry, scepterHeadMaterial);
        scepterHead.position.set(2.8, 1.5, 0);
        scepterHead.castShadow = true;
        
        this.modelGroup.add(scepterHead);
        
        // Create ice cape
        const capeGeometry = new THREE.PlaneGeometry(1.5, 2);
        const capeMaterial = new THREE.MeshStandardMaterial({
            color: 0x99ccff,
            transparent: true,
            opacity: 0.7,
            side: THREE.DoubleSide,
            roughness: 0.3,
            metalness: 0.5
        });
        const cape = new THREE.Mesh(capeGeometry, capeMaterial);
        cape.position.set(0, 1.25, -0.8);
        cape.rotation.x = Math.PI / 12;
        
        this.modelGroup.add(cape);
        
        // Add royal frost aura particles (more elaborate than titan)
        const particleCount = 30;
        const particleGeometry = new THREE.SphereGeometry(0.08, 8, 8);
        const particleMaterial = new THREE.MeshBasicMaterial({
            color: 0xbbddff,
            transparent: true,
            opacity: 0.7
        });
        
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = 1.2 + Math.random() * 0.8;
            const height = Math.random() * 3 + 0.5;
            
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            particle.position.set(
                Math.cos(angle) * radius,
                height,
                Math.sin(angle) * radius
            );
            particle.scale.set(
                Math.random() * 0.8 + 0.6,
                Math.random() * 0.8 + 0.6,
                Math.random() * 0.8 + 0.6
            );
            
            this.modelGroup.add(particle);
        }
        
        // Add glowing eyes
        const eyeGeometry = new THREE.SphereGeometry(0.12, 8, 8);
        const eyeMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x88ddff,
            emissive: 0x88ddff,
            emissiveIntensity: 1.0
        });
        
        // Left eye
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.25, 3, 0.35);
        
        this.modelGroup.add(leftEye);
        
        // Right eye
        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.25, 3, 0.35);
        
        this.modelGroup.add(rightEye);
    }
    
    updateAnimations(delta) {
        // Implement frost monarch-specific animations here if needed
        // For example, rotating the scepter crystal or animating the royal frost particles
        super.updateAnimations(delta);
    }
}