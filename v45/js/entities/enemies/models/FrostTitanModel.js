import * as THREE from 'three';
import { EnemyModel } from './EnemyModel.js';

export class FrostTitanModel extends EnemyModel {
    constructor(enemy, modelGroup) {
        super(enemy, modelGroup);
    }
    
    createModel() {
        // Create body (massive ice body)
        const bodyGeometry = new THREE.BoxGeometry(1.5, 2, 1);
        const bodyMaterial = new THREE.MeshStandardMaterial({ 
            color: this.enemy.color,
            roughness: 0.3,
            metalness: 0.8,
            transparent: true,
            opacity: 0.9
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 1;
        body.castShadow = true;
        
        this.modelGroup.add(body);
        
        // Create head (crystalline structure)
        const headGeometry = new THREE.DodecahedronGeometry(0.6, 1);
        const headMaterial = new THREE.MeshStandardMaterial({ 
            color: this.enemy.color,
            roughness: 0.2,
            metalness: 0.9,
            transparent: true,
            opacity: 0.8
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 2.5;
        head.castShadow = true;
        
        this.modelGroup.add(head);
        
        // Create ice spikes on shoulders
        const spikeGeometry = new THREE.ConeGeometry(0.2, 0.8, 8);
        const spikeMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xffffff,
            roughness: 0.2,
            metalness: 0.9
        });
        
        // Left shoulder spike
        const leftSpike = new THREE.Mesh(spikeGeometry, spikeMaterial);
        leftSpike.position.set(-0.9, 2, 0);
        leftSpike.rotation.z = -Math.PI / 6;
        leftSpike.castShadow = true;
        
        this.modelGroup.add(leftSpike);
        
        // Right shoulder spike
        const rightSpike = new THREE.Mesh(spikeGeometry, spikeMaterial);
        rightSpike.position.set(0.9, 2, 0);
        rightSpike.rotation.z = Math.PI / 6;
        rightSpike.castShadow = true;
        
        this.modelGroup.add(rightSpike);
        
        // Create arms (crystalline structures)
        const armGeometry = new THREE.CylinderGeometry(0.25, 0.15, 1.2, 8);
        const armMaterial = new THREE.MeshStandardMaterial({ 
            color: this.enemy.color,
            roughness: 0.3,
            metalness: 0.8,
            transparent: true,
            opacity: 0.9
        });
        
        // Left arm
        const leftArm = new THREE.Mesh(armGeometry, armMaterial);
        leftArm.position.set(-0.9, 1.2, 0);
        leftArm.rotation.z = Math.PI / 8;
        leftArm.castShadow = true;
        
        this.modelGroup.add(leftArm);
        
        // Right arm
        const rightArm = new THREE.Mesh(armGeometry, armMaterial);
        rightArm.position.set(0.9, 1.2, 0);
        rightArm.rotation.z = -Math.PI / 8;
        rightArm.castShadow = true;
        
        this.modelGroup.add(rightArm);
        
        // Create legs (thick ice pillars)
        const legGeometry = new THREE.CylinderGeometry(0.3, 0.2, 1, 8);
        const legMaterial = new THREE.MeshStandardMaterial({ 
            color: this.enemy.color,
            roughness: 0.4,
            metalness: 0.7,
            transparent: true,
            opacity: 0.9
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
        
        // Create ice crown
        const crownGeometry = new THREE.CylinderGeometry(0.6, 0.7, 0.3, 8);
        const crownMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xffffff,
            roughness: 0.2,
            metalness: 0.9,
            transparent: true,
            opacity: 0.7
        });
        const crown = new THREE.Mesh(crownGeometry, crownMaterial);
        crown.position.y = 2.9;
        crown.castShadow = true;
        
        this.modelGroup.add(crown);
        
        // Create ice spikes on crown
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const crownSpike = new THREE.Mesh(spikeGeometry, spikeMaterial);
            crownSpike.scale.set(0.5, 0.5, 0.5);
            crownSpike.position.set(
                Math.cos(angle) * 0.6,
                3.1,
                Math.sin(angle) * 0.6
            );
            crownSpike.rotation.x = Math.PI / 2;
            crownSpike.rotation.z = -angle;
            crownSpike.castShadow = true;
            
            this.modelGroup.add(crownSpike);
        }
        
        // Create ice weapon (staff)
        const staffGeometry = new THREE.CylinderGeometry(0.05, 0.05, 2.5, 8);
        const staffMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xffffff,
            roughness: 0.2,
            metalness: 0.9
        });
        const staff = new THREE.Mesh(staffGeometry, staffMaterial);
        staff.position.set(1.2, 1.2, 0);
        staff.rotation.z = -Math.PI / 2;
        staff.castShadow = true;
        
        this.modelGroup.add(staff);
        
        // Create ice crystal at the end of staff
        const crystalGeometry = new THREE.OctahedronGeometry(0.3, 1);
        const crystalMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x88ccff,
            roughness: 0.1,
            metalness: 1.0,
            transparent: true,
            opacity: 0.8
        });
        const crystal = new THREE.Mesh(crystalGeometry, crystalMaterial);
        crystal.position.set(2.3, 1.2, 0);
        crystal.castShadow = true;
        
        this.modelGroup.add(crystal);
        
        // Add particle effects for frost aura
        const particleCount = 20;
        const particleGeometry = new THREE.SphereGeometry(0.1, 8, 8);
        const particleMaterial = new THREE.MeshBasicMaterial({
            color: 0xaaddff,
            transparent: true,
            opacity: 0.6
        });
        
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = 1 + Math.random() * 0.5;
            const height = Math.random() * 2;
            
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            particle.position.set(
                Math.cos(angle) * radius,
                height,
                Math.sin(angle) * radius
            );
            particle.scale.set(
                Math.random() * 0.5 + 0.5,
                Math.random() * 0.5 + 0.5,
                Math.random() * 0.5 + 0.5
            );
            
            this.modelGroup.add(particle);
        }
    }
    
    updateAnimations(delta) {
        // Implement frost titan-specific animations here if needed
        // For example, rotating the ice crystal or animating the frost particles
    }
}