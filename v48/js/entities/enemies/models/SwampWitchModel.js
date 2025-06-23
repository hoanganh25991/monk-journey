import * as THREE from 'three';
import { EnemyModel } from './EnemyModel.js';

/**
 * Model for Swamp Witch enemy type
 * Creates a hunched witch with staff and magical effects
 */
export class SwampWitchModel extends EnemyModel {
    constructor(enemy, modelGroup) {
        super(enemy, modelGroup);
        this.createModel();
    }
    
    createModel() {
        // Create body (hunched cylinder)
        const bodyGeometry = new THREE.CylinderGeometry(0.3, 0.4, 1.2, 8);
        const bodyMaterial = new THREE.MeshStandardMaterial({ 
            color: this.enemy.color,
            roughness: 0.9,
            metalness: 0.1
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.6;
        body.rotation.x = Math.PI * 0.1; // Slight hunch
        body.castShadow = true;
        
        this.modelGroup.add(body);
        
        // Create head (wrinkled sphere)
        const headGeometry = new THREE.SphereGeometry(0.25, 16, 16);
        const headMaterial = new THREE.MeshStandardMaterial({ 
            color: this.enemy.color,
            roughness: 1.0,
            metalness: 0.0
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 1.3;
        head.position.z = 0.1; // Slightly forward due to hunch
        head.castShadow = true;
        
        this.modelGroup.add(head);
        
        // Create witch hat
        this.createWitchHat(head);
        
        // Create arms
        this.createArms();
        
        // Create legs
        this.createLegs();
        
        // Create staff
        this.createStaff();
        
        // Create magical effect
        this.createMagicalEffect();
    }
    
    /**
     * Create a witch hat on top of the head
     */
    createWitchHat(head) {
        // Create cone for hat
        const hatGeometry = new THREE.ConeGeometry(0.3, 0.6, 8);
        const hatMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x222222,
            roughness: 0.9,
            metalness: 0.1
        });
        const hat = new THREE.Mesh(hatGeometry, hatMaterial);
        hat.position.y = 0.4;
        hat.castShadow = true;
        
        head.add(hat);
        
        // Create hat brim
        const brimGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.05, 16);
        const brimMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x222222,
            roughness: 0.9,
            metalness: 0.1
        });
        const brim = new THREE.Mesh(brimGeometry, brimMaterial);
        brim.position.y = 0.1;
        brim.castShadow = true;
        
        hat.add(brim);
    }
    
    /**
     * Create arms for the witch
     */
    createArms() {
        // Create left arm (thin and bony)
        const leftArmCurve = new THREE.CubicBezierCurve3(
            new THREE.Vector3(0, 1.0, 0),
            new THREE.Vector3(-0.3, 0.9, 0.1),
            new THREE.Vector3(-0.5, 0.7, 0.2),
            new THREE.Vector3(-0.7, 0.5, 0.3)
        );
        
        const leftArmGeometry = new THREE.TubeGeometry(leftArmCurve, 10, 0.05, 8, false);
        const armMaterial = new THREE.MeshStandardMaterial({ 
            color: this.enemy.color,
            roughness: 0.9,
            metalness: 0.1
        });
        const leftArm = new THREE.Mesh(leftArmGeometry, armMaterial);
        leftArm.castShadow = true;
        
        this.modelGroup.add(leftArm);
        
        // Create right arm (holding staff)
        const rightArmCurve = new THREE.CubicBezierCurve3(
            new THREE.Vector3(0, 1.0, 0),
            new THREE.Vector3(0.3, 0.8, 0.1),
            new THREE.Vector3(0.5, 0.6, 0.2),
            new THREE.Vector3(0.6, 0.4, 0.3)
        );
        
        const rightArmGeometry = new THREE.TubeGeometry(rightArmCurve, 10, 0.05, 8, false);
        const rightArm = new THREE.Mesh(rightArmGeometry, armMaterial);
        rightArm.castShadow = true;
        
        this.modelGroup.add(rightArm);
        
        // Create hands (small spheres)
        const handGeometry = new THREE.SphereGeometry(0.06, 8, 8);
        const handMaterial = new THREE.MeshStandardMaterial({ 
            color: this.enemy.color,
            roughness: 0.9,
            metalness: 0.1
        });
        
        // Left hand
        const leftHand = new THREE.Mesh(handGeometry, handMaterial);
        leftHand.position.set(-0.7, 0.5, 0.3);
        leftHand.castShadow = true;
        
        this.modelGroup.add(leftHand);
        
        // Right hand
        const rightHand = new THREE.Mesh(handGeometry, handMaterial);
        rightHand.position.set(0.6, 0.4, 0.3);
        rightHand.castShadow = true;
        
        this.modelGroup.add(rightHand);
    }
    
    /**
     * Create legs for the witch
     */
    createLegs() {
        // Create skirt/robe (cone)
        const robeGeometry = new THREE.ConeGeometry(0.5, 0.8, 8);
        const robeMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x222222,
            roughness: 0.9,
            metalness: 0.1
        });
        const robe = new THREE.Mesh(robeGeometry, robeMaterial);
        robe.position.y = 0.1;
        robe.rotation.x = -Math.PI * 0.1; // Align with hunched body
        robe.castShadow = true;
        
        this.modelGroup.add(robe);
    }
    
    /**
     * Create a staff for the witch
     */
    createStaff() {
        // Create staff pole
        const staffGeometry = new THREE.CylinderGeometry(0.03, 0.04, 1.5, 8);
        const staffMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x663300,
            roughness: 0.9,
            metalness: 0.1
        });
        const staff = new THREE.Mesh(staffGeometry, staffMaterial);
        staff.position.set(0.8, 0.75, 0.3);
        staff.rotation.z = Math.PI * 0.1;
        staff.castShadow = true;
        
        this.modelGroup.add(staff);
        
        // Create staff top (glowing orb)
        const orbGeometry = new THREE.SphereGeometry(0.12, 16, 16);
        const orbMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x00ff00,
            emissive: 0x00ff00,
            emissiveIntensity: 0.8,
            transparent: true,
            opacity: 0.9
        });
        const orb = new THREE.Mesh(orbGeometry, orbMaterial);
        orb.position.set(0.9, 1.5, 0.3);
        orb.castShadow = false;
        
        this.modelGroup.add(orb);
    }
    
    /**
     * Create magical effect around the witch
     */
    createMagicalEffect() {
        // Create a ring of particles
        const particleCount = 12;
        const particleGeometry = new THREE.SphereGeometry(0.05, 8, 8);
        const particleMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x00ff00,
            emissive: 0x00ff00,
            emissiveIntensity: 0.8,
            transparent: true,
            opacity: 0.7
        });
        
        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2;
            const radius = 0.6;
            
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            particle.position.set(
                Math.sin(angle) * radius,
                0.5,
                Math.cos(angle) * radius
            );
            
            // Store the original angle for animation
            particle.userData = { angle: angle };
            
            this.modelGroup.add(particle);
        }
    }
    
    updateAnimations(delta) {
        // Call the base class animations
        super.updateAnimations(delta);
        
        // Implement witch-specific animations
        const time = Date.now() * 0.001; // Convert to seconds
        
        if (this.modelGroup) {
            // Slight hovering motion
            this.modelGroup.position.y = Math.sin(time * 1.5) * 0.05;
            
            // Get references to important parts
            const staff = this.modelGroup.children[6]; // Staff is the 7th child
            const orb = this.modelGroup.children[7]; // Staff orb is the 8th child
            const rightArm = this.modelGroup.children[3]; // Right arm is the 4th child
            const rightHand = this.modelGroup.children[5]; // Right hand is the 6th child
            
            // Animate the staff orb
            if (orb) {
                // Pulse the orb
                const pulseFactor = 1.0 + Math.sin(time * 3.0) * 0.2;
                orb.scale.set(pulseFactor, pulseFactor, pulseFactor);
                
                // Change the orb's intensity
                orb.material.emissiveIntensity = 0.6 + Math.sin(time * 2.0) * 0.3;
            }
            
            // Attack animation - raise staff and cast spell
            if (this.enemy.state.isAttacking) {
                // Raise the staff during attack
                if (staff) {
                    staff.rotation.z = Math.PI * 0.1 + Math.sin(time * 10.0) * 0.2;
                    staff.position.y = 0.75 + Math.sin(time * 8.0) * 0.2;
                }
                
                // Make the orb glow brighter and pulse faster during attack
                if (orb) {
                    orb.material.emissiveIntensity = 1.0 + Math.sin(time * 15.0) * 0.5;
                    const attackPulse = 1.0 + Math.sin(time * 20.0) * 0.5;
                    orb.scale.set(attackPulse, attackPulse, attackPulse);
                    
                    // Move the orb position slightly during attack
                    orb.position.y = 1.5 + Math.sin(time * 12.0) * 0.2;
                }
                
                // Animate the right arm (staff arm) during attack
                if (rightArm && rightHand) {
                    // Create a more dramatic arm movement for casting
                    rightArm.rotation.x = Math.sin(time * 8.0) * 0.3;
                    rightHand.position.y = 0.4 + Math.sin(time * 8.0) * 0.1;
                }
                
                // Make particles move more aggressively during attack
                for (let i = 8; i < this.modelGroup.children.length; i++) {
                    const particle = this.modelGroup.children[i];
                    if (particle && particle.userData && particle.userData.angle !== undefined) {
                        // During attack, particles move outward as if being cast
                        const attackAngle = particle.userData.angle + time * 2.0;
                        const attackRadius = 0.6 + Math.sin(time * 8.0) * 0.5 + 0.5;
                        const attackHeight = 0.5 + Math.sin(time * 10.0 + particle.userData.angle) * 0.3;
                        
                        particle.position.set(
                            Math.sin(attackAngle) * attackRadius,
                            attackHeight,
                            Math.cos(attackAngle) * attackRadius
                        );
                        
                        // Particles pulse more dramatically during attack
                        const attackParticleScale = 1.0 + Math.sin(time * 15.0 + particle.userData.angle * 3.0) * 0.6;
                        particle.scale.set(attackParticleScale, attackParticleScale, attackParticleScale);
                        
                        // Make particles glow brighter during attack
                        if (particle.material) {
                            particle.material.emissiveIntensity = 0.8 + Math.sin(time * 12.0) * 0.5;
                        }
                    }
                }
            } else {
                // Normal idle animations for particles
                for (let i = 8; i < this.modelGroup.children.length; i++) {
                    const particle = this.modelGroup.children[i];
                    if (particle && particle.userData && particle.userData.angle !== undefined) {
                        // Rotate the particles around the witch
                        const angle = particle.userData.angle + time * 0.5;
                        const radius = 0.6 + Math.sin(time * 2.0 + particle.userData.angle) * 0.1;
                        const height = 0.5 + Math.sin(time * 3.0 + particle.userData.angle) * 0.2;
                        
                        particle.position.set(
                            Math.sin(angle) * radius,
                            height,
                            Math.cos(angle) * radius
                        );
                        
                        // Pulse the particles
                        const particleScale = 1.0 + Math.sin(time * 4.0 + particle.userData.angle * 2.0) * 0.3;
                        particle.scale.set(particleScale, particleScale, particleScale);
                        
                        // Reset particle glow
                        if (particle.material) {
                            particle.material.emissiveIntensity = 0.8;
                        }
                    }
                }
            }
        }
    }
}