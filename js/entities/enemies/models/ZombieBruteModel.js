import * as THREE from 'three';
import { ZombieModel } from './ZombieModel.js';

/**
 * Model for Zombie Brute enemy type
 * Extends the base ZombieModel with larger size and more bulk
 */
export class ZombieBruteModel extends ZombieModel {
    constructor(enemy, modelGroup) {
        super(enemy, modelGroup);
    }
    
    createModel() {
        // Create body (larger box)
        const bodyGeometry = new THREE.BoxGeometry(1.2, 1.5, 1);
        const bodyMaterial = new THREE.MeshStandardMaterial({ 
            color: this.enemy.color,
            roughness: 0.9,
            metalness: 0.1
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.75;
        body.castShadow = true;
        
        this.modelGroup.add(body);
        
        // Create head (larger, misshapen sphere)
        const headGeometry = new THREE.SphereGeometry(0.4, 16, 16);
        const headMaterial = new THREE.MeshStandardMaterial({ 
            color: this.enemy.color,
            roughness: 0.9,
            metalness: 0.1
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 1.8;
        head.scale.set(1.2, 0.9, 1);
        head.castShadow = true;
        
        this.modelGroup.add(head);
        
        // Create arms (thick cylinders)
        const armGeometry = new THREE.CylinderGeometry(0.2, 0.25, 1.2, 8);
        const armMaterial = new THREE.MeshStandardMaterial({ 
            color: this.enemy.color,
            roughness: 0.9,
            metalness: 0.1
        });
        
        // Left arm (longer)
        const leftArm = new THREE.Mesh(armGeometry, armMaterial);
        leftArm.position.set(-0.8, 0.7, 0);
        leftArm.rotation.z = Math.PI / 3;
        leftArm.castShadow = true;
        
        this.modelGroup.add(leftArm);
        
        // Right arm (longer)
        const rightArm = new THREE.Mesh(armGeometry, armMaterial);
        rightArm.position.set(0.8, 0.7, 0);
        rightArm.rotation.z = -Math.PI / 3;
        rightArm.castShadow = true;
        
        this.modelGroup.add(rightArm);
        
        // Create legs (thick cylinders)
        const legGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.8, 8);
        const legMaterial = new THREE.MeshStandardMaterial({ 
            color: this.enemy.color,
            roughness: 0.9,
            metalness: 0.1
        });
        
        // Left leg
        const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
        leftLeg.position.set(-0.4, -0.15, 0);
        leftLeg.castShadow = true;
        
        this.modelGroup.add(leftLeg);
        
        // Right leg
        const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
        rightLeg.position.set(0.4, -0.15, 0);
        rightLeg.castShadow = true;
        
        this.modelGroup.add(rightLeg);
        
        // Add torn clothes/flesh details
        this.addGoreDetails();
        
        // Add glowing eyes
        this.addGlowingEyes();
    }
    
    /**
     * Add gore and torn flesh details to the zombie brute
     */
    addGoreDetails() {
        // Add exposed ribs on one side
        const ribGeometry = new THREE.BoxGeometry(0.4, 0.6, 0.1);
        const ribMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xf0e0d0,
            roughness: 0.7,
            metalness: 0.3
        });
        const ribs = new THREE.Mesh(ribGeometry, ribMaterial);
        ribs.position.set(0.4, 0.8, 0.5);
        ribs.castShadow = true;
        
        this.modelGroup.add(ribs);
        
        // Add blood/gore texture
        const goreGeometry = new THREE.SphereGeometry(0.2, 8, 8);
        const goreMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x990000,
            roughness: 0.9,
            metalness: 0.2,
            emissive: 0x330000
        });
        
        // Add gore to chest
        const chestGore = new THREE.Mesh(goreGeometry, goreMaterial);
        chestGore.position.set(0.4, 0.8, 0.55);
        chestGore.scale.set(1, 1.5, 0.5);
        
        this.modelGroup.add(chestGore);
        
        // Add gore to arm
        const armGore = new THREE.Mesh(goreGeometry, goreMaterial);
        armGore.position.set(-0.6, 0.5, 0.2);
        armGore.scale.set(0.7, 0.7, 0.5);
        
        this.modelGroup.add(armGore);
    }
    
    /**
     * Add glowing eyes to the zombie brute
     */
    addGlowingEyes() {
        const eyeGeometry = new THREE.SphereGeometry(0.08, 8, 8);
        const eyeMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x00ff00,
            emissive: 0x00ff00,
            emissiveIntensity: 0.8
        });
        
        // Left eye
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.15, 1.85, 0.35);
        
        this.modelGroup.add(leftEye);
        
        // Right eye
        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.15, 1.85, 0.35);
        
        this.modelGroup.add(rightEye);
    }
    
    updateAnimations(delta) {
        // Call the parent class animations first
        super.updateAnimations(delta);
        
        // Implement zombie brute specific animations
        const time = Date.now() * 0.001; // Convert to seconds
        
        // Make the zombie brute sway more heavily
        if (this.modelGroup) {
            // Slow, heavy swaying motion (only X and Z rotation, Y rotation handled by Enemy class)
            this.modelGroup.rotation.x = Math.sin(time * 0.3) * 0.08;
            this.modelGroup.rotation.z = Math.cos(time * 0.25) * 0.12;
            
            // Breathing-like motion with minimum height to stay above ground
            // Calculate breathing motion
            const breathingMotion = Math.sin(time * 0.7) * 0.05;
            // Apply breathing motion but ensure minimum height of 0.1 (slightly higher than regular zombies)
            this.modelGroup.position.y = Math.max(0.1, breathingMotion + 0.1);
            
            // Arms swinging
            if (this.modelGroup.children.length > 3) {
                const leftArm = this.modelGroup.children[2];
                const rightArm = this.modelGroup.children[3];
                
                if (leftArm && rightArm) {
                    leftArm.rotation.z = Math.PI / 3 + Math.sin(time * 0.5) * 0.2;
                    rightArm.rotation.z = -Math.PI / 3 + Math.sin(time * 0.5) * 0.2;
                }
            }
        }
    }
}