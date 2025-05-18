import * as THREE from 'three';
import { EnemyModel } from './EnemyModel.js';

export class NecromancerModel extends EnemyModel {
    constructor(enemy, modelGroup) {
        super(enemy, modelGroup);
    }
    
    createModel() {
        // Create body (robed figure)
        const bodyGeometry = new THREE.CylinderGeometry(0.4, 0.6, 1.8, 8);
        const bodyMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x330033,
            roughness: 0.9,
            metalness: 0.1
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.9;
        body.castShadow = true;
        
        this.modelGroup.add(body);
        
        // Create head (skull-like)
        const headGeometry = new THREE.SphereGeometry(0.3, 16, 16);
        const headMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xdddddd,
            roughness: 0.8,
            metalness: 0.2
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 1.9;
        head.castShadow = true;
        
        this.modelGroup.add(head);
        
        // Create hood
        const hoodGeometry = new THREE.ConeGeometry(0.4, 0.5, 8);
        const hoodMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x330033,
            roughness: 0.9,
            metalness: 0.1
        });
        const hood = new THREE.Mesh(hoodGeometry, hoodMaterial);
        hood.position.y = 2.1;
        hood.rotation.x = Math.PI;
        hood.castShadow = true;
        
        this.modelGroup.add(hood);
        
        // Create staff
        const staffGeometry = new THREE.CylinderGeometry(0.05, 0.05, 2, 8);
        const staffMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x553311,
            roughness: 0.8,
            metalness: 0.2
        });
        const staff = new THREE.Mesh(staffGeometry, staffMaterial);
        staff.position.set(0.6, 1.0, 0);
        staff.rotation.z = Math.PI / 12;
        staff.castShadow = true;
        
        this.modelGroup.add(staff);
        
        // Create staff orb
        const orbGeometry = new THREE.SphereGeometry(0.2, 16, 16);
        const orbMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x9900cc,
            roughness: 0.2,
            metalness: 0.8,
            emissive: 0x330066,
            emissiveIntensity: 0.5
        });
        const orb = new THREE.Mesh(orbGeometry, orbMaterial);
        orb.position.set(0.6, 2.0, 0);
        orb.castShadow = true;
        
        this.modelGroup.add(orb);
        
        // Add necromancer lord specific elements
        if (this.enemy.type === 'necromancer_lord') {
            // Create floating skulls
            const skullGeometry = new THREE.SphereGeometry(0.15, 16, 16);
            const skullMaterial = new THREE.MeshStandardMaterial({ 
                color: 0xdddddd,
                roughness: 0.8,
                metalness: 0.2
            });
            
            // Create 3 floating skulls
            for (let i = 0; i < 3; i++) {
                const angle = (i / 3) * Math.PI * 2;
                const skull = new THREE.Mesh(skullGeometry, skullMaterial);
                skull.position.set(
                    Math.cos(angle) * 0.8,
                    1.5,
                    Math.sin(angle) * 0.8
                );
                skull.castShadow = true;
                
                this.modelGroup.add(skull);
            }
            
            // Create larger staff orb
            orb.scale.set(1.5, 1.5, 1.5);
            orb.material.emissiveIntensity = 0.8;
            
            // Create aura
            const auraGeometry = new THREE.RingGeometry(1, 1.1, 32);
            const auraMaterial = new THREE.MeshBasicMaterial({ 
                color: 0x9900cc,
                transparent: true,
                opacity: 0.5,
                side: THREE.DoubleSide
            });
            const aura = new THREE.Mesh(auraGeometry, auraMaterial);
            aura.rotation.x = -Math.PI / 2;
            aura.position.y = 0.1;
            
            this.modelGroup.add(aura);
        }
    }
    
    updateAnimations(delta) {
        // Necromancer specific animations
        // For example, floating skulls or glowing orb
    }
}