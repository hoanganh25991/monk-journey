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
        // Call the base class animations
        super.updateAnimations(delta);
        
        // Necromancer specific animations
        const time = Date.now() * 0.001; // Convert to seconds
        
        if (this.modelGroup) {
            // Fix head orientation - ensure head stays upright regardless of model group rotation
            const head = this.modelGroup.children[1]; // Head is the 2nd child
            if (head) {
                // Compensate for model group rotation to keep head upright in world coordinates
                // Since head rotation is relative to modelGroup, we need to counter-rotate
                head.rotation.x = -this.modelGroup.rotation.x;
                head.rotation.y = -this.modelGroup.rotation.y;
                head.rotation.z = -this.modelGroup.rotation.z;
            }
            
            // Get the staff and orb
            const staff = this.modelGroup.children[3]; // Staff is the 4th child
            const orb = this.modelGroup.children[4]; // Orb is the 5th child
            
            // Animate the orb pulsing
            if (orb) {
                const pulseFactor = 1.0 + Math.sin(time * 2.0) * 0.2;
                orb.scale.set(pulseFactor, pulseFactor, pulseFactor);
                orb.material.emissiveIntensity = 0.5 + Math.sin(time * 3.0) * 0.3;
            }
            
            // Attack animation - raise staff and make orb glow brighter
            if (this.enemy.state.isAttacking && staff && orb) {
                // Raise the staff during attack
                staff.rotation.z = Math.PI / 12 + Math.sin(time * 8.0) * 0.3;
                
                // Make the orb glow brighter during attack
                orb.material.emissiveIntensity = 1.0 + Math.sin(time * 10.0) * 0.5;
                
                // Scale the orb up and down rapidly during attack
                const attackPulse = 1.0 + Math.sin(time * 15.0) * 0.5;
                orb.scale.set(attackPulse, attackPulse, attackPulse);
                
                // Create a slight movement of the hood during attack
                const hood = this.modelGroup.children[2]; // Hood is the 3rd child
                if (hood) {
                    hood.rotation.x = Math.PI + Math.sin(time * 8.0) * 0.1; // Keep inverted but add slight movement
                }
            }
            
            // Animate floating skulls for necromancer lord
            if (this.enemy.type === 'necromancer_lord') {
                // Start from index 5 (after the orb) for the floating skulls
                for (let i = 5; i < 8; i++) {
                    const skull = this.modelGroup.children[i];
                    if (skull) {
                        // Calculate the base angle for this skull
                        const baseAngle = ((i - 5) / 3) * Math.PI * 2;
                        const angle = baseAngle + time * 0.5;
                        
                        // Make skulls orbit around the necromancer
                        skull.position.x = Math.cos(angle) * 0.8;
                        skull.position.z = Math.sin(angle) * 0.8;
                        skull.position.y = 1.5 + Math.sin(time * 2.0 + baseAngle) * 0.2;
                        
                        // During attack, make skulls move more aggressively
                        if (this.enemy.state.isAttacking) {
                            skull.position.x = Math.cos(angle) * (0.8 + Math.sin(time * 8.0) * 0.3);
                            skull.position.z = Math.sin(angle) * (0.8 + Math.sin(time * 8.0) * 0.3);
                            skull.rotation.y = time * 10.0;
                        } else {
                            skull.rotation.y = time * 2.0;
                        }
                    }
                }
            }
        }
    }
}