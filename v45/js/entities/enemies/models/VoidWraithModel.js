import * as THREE from 'three';
import { EnemyModel } from './EnemyModel.js';

/**
 * Model for Void Wraith enemy type
 * Creates a ghostly, ethereal being with void energy
 */
export class VoidWraithModel extends EnemyModel {
    constructor(enemy, modelGroup) {
        super(enemy, modelGroup);
        this.createModel();
    }
    
    createModel() {
        // Create main body (ethereal, semi-transparent)
        const bodyGeometry = new THREE.ConeGeometry(0.5, 1.8, 8);
        const bodyMaterial = new THREE.MeshStandardMaterial({ 
            color: this.enemy.color,
            emissive: this.enemy.color,
            emissiveIntensity: 0.3,
            transparent: true,
            opacity: 0.7,
            side: THREE.DoubleSide
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.9;
        body.castShadow = false; // Ethereal beings don't cast strong shadows
        
        this.modelGroup.add(body);
        
        // Create head (skull-like)
        this.createHead();
        
        // Create arms (wispy tendrils)
        this.createArms();
        
        // Create void energy core
        this.createVoidCore();
        
        // Create void particles
        this.createVoidParticles();
    }
    
    /**
     * Create a skull-like head for the wraith
     */
    createHead() {
        // Create skull (elongated sphere)
        const skullGeometry = new THREE.SphereGeometry(0.3, 16, 16);
        const skullMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xdddddd,
            emissive: 0x440088,
            emissiveIntensity: 0.2,
            transparent: true,
            opacity: 0.9
        });
        const skull = new THREE.Mesh(skullGeometry, skullMaterial);
        skull.position.y = 1.8;
        skull.scale.set(1, 1.2, 0.8);
        skull.castShadow = false;
        
        this.modelGroup.add(skull);
        
        // Create eye sockets (dark spheres)
        const eyeSocketGeometry = new THREE.SphereGeometry(0.08, 8, 8);
        const eyeSocketMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x000000,
            emissive: 0x440088,
            emissiveIntensity: 0.5
        });
        
        // Left eye socket
        const leftEyeSocket = new THREE.Mesh(eyeSocketGeometry, eyeSocketMaterial);
        leftEyeSocket.position.set(-0.1, 1.85, 0.2);
        
        this.modelGroup.add(leftEyeSocket);
        
        // Right eye socket
        const rightEyeSocket = new THREE.Mesh(eyeSocketGeometry, eyeSocketMaterial);
        rightEyeSocket.position.set(0.1, 1.85, 0.2);
        
        this.modelGroup.add(rightEyeSocket);
        
        // Create glowing eyes inside sockets
        const eyeGeometry = new THREE.SphereGeometry(0.04, 8, 8);
        const eyeMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x8800ff,
            emissive: 0x8800ff,
            emissiveIntensity: 1.0
        });
        
        // Left eye
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.1, 1.85, 0.22);
        
        this.modelGroup.add(leftEye);
        
        // Right eye
        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.1, 1.85, 0.22);
        
        this.modelGroup.add(rightEye);
    }
    
    /**
     * Create wispy, tendril-like arms for the wraith
     */
    createArms() {
        const armMaterial = new THREE.MeshStandardMaterial({ 
            color: this.enemy.color,
            emissive: this.enemy.color,
            emissiveIntensity: 0.3,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide
        });
        
        // Left arm (curved path)
        const leftArmCurve = new THREE.CubicBezierCurve3(
            new THREE.Vector3(0, 1.4, 0),
            new THREE.Vector3(-0.5, 1.2, 0.2),
            new THREE.Vector3(-0.8, 0.8, 0.3),
            new THREE.Vector3(-1.0, 0.5, 0.2)
        );
        
        const leftArmGeometry = new THREE.TubeGeometry(leftArmCurve, 20, 0.08, 8, false);
        const leftArm = new THREE.Mesh(leftArmGeometry, armMaterial);
        leftArm.castShadow = false;
        
        this.modelGroup.add(leftArm);
        
        // Right arm (curved path)
        const rightArmCurve = new THREE.CubicBezierCurve3(
            new THREE.Vector3(0, 1.4, 0),
            new THREE.Vector3(0.5, 1.2, 0.2),
            new THREE.Vector3(0.8, 0.8, 0.3),
            new THREE.Vector3(1.0, 0.5, 0.2)
        );
        
        const rightArmGeometry = new THREE.TubeGeometry(rightArmCurve, 20, 0.08, 8, false);
        const rightArm = new THREE.Mesh(rightArmGeometry, armMaterial);
        rightArm.castShadow = false;
        
        this.modelGroup.add(rightArm);
        
        // Create wispy hand effects
        this.createWispyHands();
    }
    
    /**
     * Create wispy, ethereal hands at the end of the arms
     */
    createWispyHands() {
        const handMaterial = new THREE.MeshStandardMaterial({ 
            color: this.enemy.color,
            emissive: this.enemy.color,
            emissiveIntensity: 0.5,
            transparent: true,
            opacity: 0.4,
            side: THREE.DoubleSide
        });
        
        // Left hand (several small, thin cones)
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI;
            const fingerGeometry = new THREE.ConeGeometry(0.03, 0.2, 4);
            const finger = new THREE.Mesh(fingerGeometry, handMaterial);
            
            finger.position.set(
                -1.0 + Math.cos(angle) * 0.1,
                0.5 + Math.sin(angle) * 0.1,
                0.2
            );
            
            finger.rotation.set(
                Math.PI / 2,
                0,
                angle
            );
            
            this.modelGroup.add(finger);
        }
        
        // Right hand (several small, thin cones)
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI;
            const fingerGeometry = new THREE.ConeGeometry(0.03, 0.2, 4);
            const finger = new THREE.Mesh(fingerGeometry, handMaterial);
            
            finger.position.set(
                1.0 + Math.cos(angle + Math.PI) * 0.1,
                0.5 + Math.sin(angle) * 0.1,
                0.2
            );
            
            finger.rotation.set(
                Math.PI / 2,
                0,
                angle + Math.PI
            );
            
            this.modelGroup.add(finger);
        }
    }
    
    /**
     * Create a void energy core in the center of the wraith
     */
    createVoidCore() {
        const coreGeometry = new THREE.SphereGeometry(0.2, 16, 16);
        const coreMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x8800ff,
            emissive: 0x8800ff,
            emissiveIntensity: 1.0,
            transparent: true,
            opacity: 0.9
        });
        const core = new THREE.Mesh(coreGeometry, coreMaterial);
        core.position.y = 1.2;
        
        this.modelGroup.add(core);
        
        // Add outer glow
        const glowGeometry = new THREE.SphereGeometry(0.3, 16, 16);
        const glowMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x8800ff,
            emissive: 0x8800ff,
            emissiveIntensity: 0.5,
            transparent: true,
            opacity: 0.5
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.position.y = 1.2;
        
        this.modelGroup.add(glow);
    }
    
    /**
     * Create void particles around the wraith
     */
    createVoidParticles() {
        const particleCount = 15;
        const particleGeometry = new THREE.SphereGeometry(0.03, 8, 8);
        const particleMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x8800ff,
            emissive: 0x8800ff,
            emissiveIntensity: 1.0,
            transparent: true,
            opacity: 0.8
        });
        
        for (let i = 0; i < particleCount; i++) {
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            
            // Random position around the wraith
            const angle = Math.random() * Math.PI * 2;
            const radius = 0.3 + Math.random() * 0.7;
            const height = 0.5 + Math.random() * 1.5;
            
            particle.position.set(
                Math.sin(angle) * radius,
                height,
                Math.cos(angle) * radius
            );
            
            // Store original position and animation parameters
            particle.userData = {
                originalPosition: particle.position.clone(),
                speed: 0.5 + Math.random() * 1.0,
                offset: Math.random() * Math.PI * 2
            };
            
            this.modelGroup.add(particle);
        }
    }
    
    updateAnimations(delta) {
        // Implement wraith-specific animations
        const time = Date.now() * 0.001; // Convert to seconds
        
        if (this.modelGroup) {
            // Hovering motion
            this.modelGroup.position.y = Math.sin(time * 0.8) * 0.1;
            
            // Slight rotation
            this.modelGroup.rotation.y = Math.sin(time * 0.3) * 0.1;
            
            // Animate the void core
            const core = this.modelGroup.children[6]; // Void core
            const glow = this.modelGroup.children[7]; // Outer glow
            
            if (core && glow) {
                // Pulse the core
                const corePulse = 1.0 + Math.sin(time * 3.0) * 0.2;
                core.scale.set(corePulse, corePulse, corePulse);
                
                // Pulse the glow more dramatically
                const glowPulse = 1.0 + Math.sin(time * 2.0) * 0.3;
                glow.scale.set(glowPulse, glowPulse, glowPulse);
                
                // Change the emissive intensity
                core.material.emissiveIntensity = 0.8 + Math.sin(time * 4.0) * 0.2;
                glow.material.emissiveIntensity = 0.4 + Math.sin(time * 3.0) * 0.3;
            }
            
            // Animate the void particles
            for (let i = 8; i < this.modelGroup.children.length; i++) {
                const particle = this.modelGroup.children[i];
                if (particle && particle.userData && particle.userData.originalPosition) {
                    const originalPos = particle.userData.originalPosition;
                    const speed = particle.userData.speed;
                    const offset = particle.userData.offset;
                    
                    // Orbit around the original position
                    particle.position.set(
                        originalPos.x + Math.sin(time * speed + offset) * 0.2,
                        originalPos.y + Math.cos(time * speed + offset) * 0.1,
                        originalPos.z + Math.sin(time * speed * 0.7 + offset) * 0.2
                    );
                    
                    // Pulse the particles
                    const particleScale = 1.0 + Math.sin(time * 5.0 + offset * 3.0) * 0.3;
                    particle.scale.set(particleScale, particleScale, particleScale);
                    
                    // Fade in and out
                    particle.material.opacity = 0.5 + Math.sin(time * 3.0 + offset * 2.0) * 0.3;
                }
            }
            
            // Animate the wispy hands
            for (let i = 0; i < 8; i++) {
                // Fingers start at index 8
                const finger = this.modelGroup.children[i + 8];
                if (finger) {
                    // Wiggle the fingers
                    finger.rotation.z += Math.sin(time * 3.0 + i * 0.5) * 0.01;
                }
            }
        }
    }
}