import * as THREE from 'three';
import { EnemyModel } from './EnemyModel.js';

/**
 * Model for Molten Behemoth enemy type
 * Creates a massive, lava-infused rock creature with glowing cracks and molten core
 */
export class MoltenBehemothModel extends EnemyModel {
    constructor(enemy, modelGroup) {
        super(enemy, modelGroup);
        this.particles = [];
        this.createModel();
    }
    
    createModel() {
        // Create main body (large, rocky structure)
        const bodyGeometry = new THREE.BoxGeometry(2.0, 2.0, 1.5);
        const bodyMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x333333,
            roughness: 1.0,
            metalness: 0.2
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 1.0;
        body.castShadow = true;
        
        this.modelGroup.add(body);
        
        // Create head (irregular rocky shape)
        const headGeometry = new THREE.DodecahedronGeometry(0.9, 1);
        const headMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x333333,
            roughness: 1.0,
            metalness: 0.2
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 2.5;
        head.castShadow = true;
        
        this.modelGroup.add(head);
        
        // Create molten core (glowing sphere inside the body)
        const coreGeometry = new THREE.SphereGeometry(0.8, 16, 16);
        const coreMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xff3300,
            emissive: 0xff3300,
            emissiveIntensity: 0.8,
            transparent: true,
            opacity: 0.9
        });
        const core = new THREE.Mesh(coreGeometry, coreMaterial);
        core.position.y = 1.0;
        
        this.modelGroup.add(core);
        
        // Create glowing cracks throughout the body
        this.createLavaCracks();
        
        // Create arms (massive, rocky cylinders)
        const armGeometry = new THREE.CylinderGeometry(0.4, 0.5, 1.5, 8);
        const armMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x333333,
            roughness: 1.0,
            metalness: 0.2
        });
        
        // Left arm
        const leftArm = new THREE.Mesh(armGeometry, armMaterial);
        leftArm.position.set(-1.3, 1.2, 0);
        leftArm.rotation.z = Math.PI / 2.5;
        leftArm.castShadow = true;
        
        this.modelGroup.add(leftArm);
        
        // Right arm
        const rightArm = new THREE.Mesh(armGeometry, armMaterial);
        rightArm.position.set(1.3, 1.2, 0);
        rightArm.rotation.z = -Math.PI / 2.5;
        rightArm.castShadow = true;
        
        this.modelGroup.add(rightArm);
        
        // Create fists (large, rocky spheres)
        const fistGeometry = new THREE.DodecahedronGeometry(0.6, 1);
        const fistMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x333333,
            roughness: 1.0,
            metalness: 0.2
        });
        
        // Left fist
        const leftFist = new THREE.Mesh(fistGeometry, fistMaterial);
        leftFist.position.set(-2.2, 0.9, 0);
        leftFist.castShadow = true;
        
        this.modelGroup.add(leftFist);
        
        // Right fist
        const rightFist = new THREE.Mesh(fistGeometry, fistMaterial);
        rightFist.position.set(2.2, 0.9, 0);
        rightFist.castShadow = true;
        
        this.modelGroup.add(rightFist);
        
        // Create legs (thick, rocky cylinders)
        const legGeometry = new THREE.CylinderGeometry(0.4, 0.5, 1.0, 8);
        const legMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x333333,
            roughness: 1.0,
            metalness: 0.2
        });
        
        // Left leg
        const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
        leftLeg.position.set(-0.7, 0, 0);
        leftLeg.castShadow = true;
        
        this.modelGroup.add(leftLeg);
        
        // Right leg
        const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
        rightLeg.position.set(0.7, 0, 0);
        rightLeg.castShadow = true;
        
        this.modelGroup.add(rightLeg);
        
        // Add glowing eyes
        const eyeGeometry = new THREE.SphereGeometry(0.15, 8, 8);
        const eyeMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xff3300,
            emissive: 0xff3300,
            emissiveIntensity: 1.0
        });
        
        // Left eye
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.3, 2.6, 0.6);
        
        this.modelGroup.add(leftEye);
        
        // Right eye
        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.3, 2.6, 0.6);
        
        this.modelGroup.add(rightEye);
        
        // Create lava particles
        this.createLavaParticles();
    }
    
    /**
     * Create glowing lava cracks throughout the body
     */
    createLavaCracks() {
        const crackMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xff3300,
            emissive: 0xff3300,
            emissiveIntensity: 1.0
        });
        
        // Vertical cracks on body
        for (let i = 0; i < 5; i++) {
            const angle = (i / 5) * Math.PI * 2;
            const radius = 0.9;
            
            const crackGeometry = new THREE.BoxGeometry(0.1, 1.8, 0.1);
            const crack = new THREE.Mesh(crackGeometry, crackMaterial);
            
            crack.position.set(
                Math.sin(angle) * radius,
                1.0,
                Math.cos(angle) * radius
            );
            
            crack.rotation.y = angle;
            
            this.modelGroup.add(crack);
        }
        
        // Cracks on head
        for (let i = 0; i < 3; i++) {
            const angle = (i / 3) * Math.PI * 2;
            const radius = 0.5;
            
            const crackGeometry = new THREE.BoxGeometry(0.08, 0.7, 0.08);
            const crack = new THREE.Mesh(crackGeometry, crackMaterial);
            
            crack.position.set(
                Math.sin(angle) * radius,
                2.5,
                Math.cos(angle) * radius
            );
            
            crack.rotation.y = angle;
            
            this.modelGroup.add(crack);
        }
    }
    
    /**
     * Create lava particles that emanate from the behemoth
     */
    createLavaParticles() {
        const particleCount = 30;
        const particleGeometry = new THREE.SphereGeometry(0.08, 8, 8);
        const particleMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xff6600,
            emissive: 0xff6600,
            emissiveIntensity: 1.0,
            transparent: true,
            opacity: 0.8
        });
        
        for (let i = 0; i < particleCount; i++) {
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            
            // Random position around the body
            const angle = Math.random() * Math.PI * 2;
            const radius = 1.0 + Math.random() * 0.5;
            const height = 0.5 + Math.random() * 2.0;
            
            particle.position.set(
                Math.sin(angle) * radius,
                height,
                Math.cos(angle) * radius
            );
            
            // Store velocity for animation
            particle.userData = {
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 0.02,
                    0.01 + Math.random() * 0.03,
                    (Math.random() - 0.5) * 0.02
                ),
                age: Math.random() * 2.0,
                maxAge: 2.0 + Math.random() * 1.0
            };
            
            this.particles.push(particle);
            this.modelGroup.add(particle);
        }
    }
    
    updateAnimations(delta) {
        // Call parent class animations for basic movement
        super.updateAnimations(delta);
        
        // Pulsating core and cracks
        if (this.modelGroup && this.modelGroup.children.length > 0) {
            const time = Date.now() * 0.001; // Convert to seconds
            const core = this.modelGroup.children[2]; // The molten core
            
            if (core) {
                // Pulsate the core
                const pulseFactor = 1.0 + Math.sin(time * 2.0) * 0.2;
                core.scale.set(pulseFactor, pulseFactor, pulseFactor);
                
                // Adjust core intensity
                if (core.material) {
                    core.material.emissiveIntensity = 0.7 + Math.sin(time * 3.0) * 0.3;
                }
            }
            
            // Pulsate the cracks (starting from index 12, which is where cracks begin)
            for (let i = 12; i < 20; i++) {
                if (this.modelGroup.children[i]) {
                    const crack = this.modelGroup.children[i];
                    if (crack.material) {
                        crack.material.emissiveIntensity = 0.7 + Math.sin(time * 3.0 + i * 0.2) * 0.3;
                    }
                }
            }
            
            // Pulsate the eyes
            const leftEye = this.modelGroup.children[10];
            const rightEye = this.modelGroup.children[11];
            
            if (leftEye && leftEye.material) {
                leftEye.material.emissiveIntensity = 0.7 + Math.sin(time * 4.0) * 0.3;
            }
            
            if (rightEye && rightEye.material) {
                rightEye.material.emissiveIntensity = 0.7 + Math.sin(time * 4.0) * 0.3;
            }
        }
        
        // Update lava particles
        for (let i = 0; i < this.particles.length; i++) {
            const particle = this.particles[i];
            const userData = particle.userData;
            
            // Update particle position
            particle.position.add(userData.velocity);
            
            // Age the particle
            userData.age += delta;
            
            // If particle is too old, reset it
            if (userData.age > userData.maxAge) {
                // Reset position
                const angle = Math.random() * Math.PI * 2;
                const radius = 1.0 + Math.random() * 0.5;
                
                particle.position.set(
                    Math.sin(angle) * radius,
                    0.5 + Math.random() * 1.5,
                    Math.cos(angle) * radius
                );
                
                // Reset velocity
                userData.velocity.set(
                    (Math.random() - 0.5) * 0.02,
                    0.01 + Math.random() * 0.03,
                    (Math.random() - 0.5) * 0.02
                );
                
                // Reset age
                userData.age = 0;
            }
            
            // Fade out as the particle ages
            const opacity = 1.0 - (userData.age / userData.maxAge);
            if (particle.material) {
                particle.material.opacity = opacity * 0.8;
            }
            
            // Scale down as the particle rises
            const scale = 1.0 - (userData.age / userData.maxAge) * 0.5;
            particle.scale.set(scale, scale, scale);
        }
        
        // Add a slight sway to the entire model to simulate breathing
        if (this.modelGroup) {
            const time = Date.now() * 0.001;
            this.modelGroup.rotation.x = Math.sin(time * 0.5) * 0.05;
        }
    }
}