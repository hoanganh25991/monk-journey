import * as THREE from 'three';
import { EnemyModel } from './EnemyModel.js';

/**
 * Model for Swamp Horror enemy type
 * Creates a grotesque, amorphous creature with tentacles and a slimy appearance
 */
export class SwampHorrorModel extends EnemyModel {
    constructor(enemy, modelGroup) {
        super(enemy, modelGroup);
        
        // Store animation properties
        this.animationTime = 0;
        this.tentacles = [];
        
        // Create the model after initializing properties
        this.createModel();
    }
    
    createModel() {
        // Create main body (irregular, lumpy shape)
        const bodyGeometry = new THREE.SphereGeometry(0.6, 8, 8);
        const bodyMaterial = new THREE.MeshStandardMaterial({ 
            color: this.enemy.color || 0x2a623d, // Dark swamp green if no color specified
            roughness: 0.9,
            metalness: 0.2,
            transparent: true,
            opacity: 0.9
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.6;
        
        // Add lumps to make it look irregular
        body.scale.set(1.2, 0.9, 1.0);
        body.castShadow = true;
        
        this.modelGroup.add(body);
        
        // Create "head" (not really a head, more like a protrusion)
        const headGeometry = new THREE.SphereGeometry(0.4, 8, 8);
        const headMaterial = new THREE.MeshStandardMaterial({ 
            color: this.enemy.color || 0x2a623d,
            roughness: 0.9,
            metalness: 0.2,
            transparent: true,
            opacity: 0.9
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 1.0;
        head.position.z = 0.3;
        head.scale.set(0.8, 0.7, 1.1);
        head.castShadow = true;
        
        this.modelGroup.add(head);
        
        // Create glowing eyes
        this.createEyes(head);
        
        // Create multiple tentacles
        this.createTentacles();
        
        // Create slimy drips
        this.createSlimeEffects();
        
        // Create base/lower body (like it's emerging from the swamp)
        this.createBase();
    }
    
    /**
     * Create glowing eyes for the horror
     */
    createEyes(head) {
        // Create two glowing eyes
        const eyeGeometry = new THREE.SphereGeometry(0.08, 8, 8);
        const eyeMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xff3300,
            emissive: 0xff3300,
            emissiveIntensity: 0.8
        });
        
        // Left eye
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.15, 0.1, 0.3);
        head.add(leftEye);
        
        // Right eye
        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.15, 0.1, 0.3);
        head.add(rightEye);
    }
    
    /**
     * Create multiple tentacles around the body
     */
    createTentacles() {
        // Create 6-8 tentacles of varying lengths and positions
        const tentacleCount = 7;
        
        for (let i = 0; i < tentacleCount; i++) {
            const angle = (i / tentacleCount) * Math.PI * 2;
            const radius = 0.5;
            
            // Create a curved tentacle using a tube geometry
            const tentacleCurve = new THREE.CubicBezierCurve3(
                new THREE.Vector3(Math.sin(angle) * radius, 0.6, Math.cos(angle) * radius),
                new THREE.Vector3(Math.sin(angle) * (radius + 0.3), 0.4, Math.cos(angle) * (radius + 0.3)),
                new THREE.Vector3(Math.sin(angle) * (radius + 0.5), 0.2, Math.cos(angle) * (radius + 0.5)),
                new THREE.Vector3(Math.sin(angle) * (radius + 0.7), 0.0, Math.cos(angle) * (radius + 0.7))
            );
            
            const tentacleGeometry = new THREE.TubeGeometry(tentacleCurve, 12, 0.08 - (i % 3) * 0.02, 8, false);
            const tentacleMaterial = new THREE.MeshStandardMaterial({ 
                color: this.enemy.color || 0x2a623d,
                roughness: 0.9,
                metalness: 0.2,
                transparent: true,
                opacity: 0.9
            });
            
            const tentacle = new THREE.Mesh(tentacleGeometry, tentacleMaterial);
            tentacle.castShadow = true;
            
            // Store the tentacle and its original curve for animation
            tentacle.userData = { 
                angle: angle,
                radius: radius,
                originalCurve: tentacleCurve,
                index: i
            };
            
            this.tentacles.push(tentacle);
            this.modelGroup.add(tentacle);
        }
    }
    
    /**
     * Create slimy drip effects
     */
    createSlimeEffects() {
        // Create dripping slime particles
        const slimeCount = 10;
        const slimeGeometry = new THREE.SphereGeometry(0.05, 6, 6);
        const slimeMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x4a9e5d,
            transparent: true,
            opacity: 0.7
        });
        
        for (let i = 0; i < slimeCount; i++) {
            const slime = new THREE.Mesh(slimeGeometry, slimeMaterial);
            
            // Random position around the body
            const angle = Math.random() * Math.PI * 2;
            const radius = 0.3 + Math.random() * 0.4;
            const height = Math.random() * 1.0;
            
            slime.position.set(
                Math.sin(angle) * radius,
                height,
                Math.cos(angle) * radius
            );
            
            // Store original position for animation
            slime.userData = { 
                originalY: height,
                speed: 0.2 + Math.random() * 0.3,
                size: 0.03 + Math.random() * 0.04
            };
            
            this.modelGroup.add(slime);
        }
    }
    
    /**
     * Create base/lower body
     */
    createBase() {
        // Create a wider base like it's emerging from the swamp
        const baseGeometry = new THREE.CylinderGeometry(0.8, 0.9, 0.3, 8);
        const baseMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x1a4a2d, // Darker green
            roughness: 1.0,
            metalness: 0.0,
            transparent: true,
            opacity: 0.8
        });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = 0.15;
        base.castShadow = true;
        
        this.modelGroup.add(base);
        
        // Create "swamp water" effect around the base
        const waterGeometry = new THREE.CircleGeometry(1.2, 16);
        const waterMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x2d6e4a,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide
        });
        const water = new THREE.Mesh(waterGeometry, waterMaterial);
        water.rotation.x = -Math.PI / 2; // Lay flat
        water.position.y = 0.01; // Just above ground
        water.receiveShadow = true;
        
        this.modelGroup.add(water);
    }
    
    updateAnimations(delta) {
        // Update animation time
        this.animationTime += delta;
        const time = this.animationTime;
        
        if (this.modelGroup) {
            // Pulsating body effect
            const body = this.modelGroup.children[0];
            const head = this.modelGroup.children[1];
            
            if (body) {
                const pulseFactor = 1.0 + Math.sin(time * 2.0) * 0.05;
                body.scale.set(1.2 * pulseFactor, 0.9 * pulseFactor, 1.0 * pulseFactor);
            }
            
            if (head) {
                const headPulse = 1.0 + Math.sin(time * 2.5) * 0.05;
                head.scale.set(0.8 * headPulse, 0.7 * headPulse, 1.1 * headPulse);
                
                // Make eyes glow more intensely when attacking
                if (this.enemy.state.isAttacking) {
                    if (head.children[0] && head.children[0].material) {
                        head.children[0].material.emissiveIntensity = 1.0 + Math.sin(time * 10.0) * 0.5;
                    }
                    if (head.children[1] && head.children[1].material) {
                        head.children[1].material.emissiveIntensity = 1.0 + Math.sin(time * 10.0) * 0.5;
                    }
                } else {
                    if (head.children[0] && head.children[0].material) {
                        head.children[0].material.emissiveIntensity = 0.8 + Math.sin(time * 3.0) * 0.2;
                    }
                    if (head.children[1] && head.children[1].material) {
                        head.children[1].material.emissiveIntensity = 0.8 + Math.sin(time * 3.0) * 0.2;
                    }
                }
            }
            
            // Animate tentacles
            for (let i = 0; i < this.tentacles.length; i++) {
                const tentacle = this.tentacles[i];
                if (tentacle && tentacle.userData) {
                    const { angle, radius, index } = tentacle.userData;
                    
                    // Different animation based on whether the enemy is attacking or not
                    if (this.enemy.state.isAttacking) {
                        // More aggressive tentacle movement during attack
                        const attackSpeed = 5.0 + index * 0.5;
                        const attackAmplitude = 0.3;
                        
                        // Create a new curve for the tentacle with animated control points
                        const newCurve = new THREE.CubicBezierCurve3(
                            new THREE.Vector3(Math.sin(angle) * radius, 0.6, Math.cos(angle) * radius),
                            new THREE.Vector3(
                                Math.sin(angle + Math.sin(time * attackSpeed) * 0.5) * (radius + 0.3), 
                                0.4, 
                                Math.cos(angle + Math.sin(time * attackSpeed) * 0.5) * (radius + 0.3)
                            ),
                            new THREE.Vector3(
                                Math.sin(angle + Math.sin(time * attackSpeed) * 0.8) * (radius + 0.5), 
                                0.2 + Math.sin(time * attackSpeed) * 0.2, 
                                Math.cos(angle + Math.sin(time * attackSpeed) * 0.8) * (radius + 0.5)
                            ),
                            new THREE.Vector3(
                                Math.sin(angle + Math.sin(time * attackSpeed) * 1.0) * (radius + 0.7 + attackAmplitude), 
                                0.0 + Math.sin(time * attackSpeed) * 0.3, 
                                Math.cos(angle + Math.sin(time * attackSpeed) * 1.0) * (radius + 0.7 + attackAmplitude)
                            )
                        );
                        
                        // Update the tentacle geometry
                        const newGeometry = new THREE.TubeGeometry(newCurve, 12, 0.08 - (index % 3) * 0.02, 8, false);
                        tentacle.geometry.dispose();
                        tentacle.geometry = newGeometry;
                    } else {
                        // Gentle swaying motion when not attacking
                        const swaySpeed = 1.0 + index * 0.2;
                        
                        // Create a new curve for the tentacle with animated control points
                        const newCurve = new THREE.CubicBezierCurve3(
                            new THREE.Vector3(Math.sin(angle) * radius, 0.6, Math.cos(angle) * radius),
                            new THREE.Vector3(
                                Math.sin(angle + Math.sin(time * swaySpeed) * 0.2) * (radius + 0.3), 
                                0.4, 
                                Math.cos(angle + Math.sin(time * swaySpeed) * 0.2) * (radius + 0.3)
                            ),
                            new THREE.Vector3(
                                Math.sin(angle + Math.sin(time * swaySpeed) * 0.3) * (radius + 0.5), 
                                0.2 + Math.sin(time * swaySpeed) * 0.1, 
                                Math.cos(angle + Math.sin(time * swaySpeed) * 0.3) * (radius + 0.5)
                            ),
                            new THREE.Vector3(
                                Math.sin(angle + Math.sin(time * swaySpeed) * 0.4) * (radius + 0.7), 
                                0.0 + Math.sin(time * swaySpeed) * 0.15, 
                                Math.cos(angle + Math.sin(time * swaySpeed) * 0.4) * (radius + 0.7)
                            )
                        );
                        
                        // Update the tentacle geometry
                        const newGeometry = new THREE.TubeGeometry(newCurve, 12, 0.08 - (index % 3) * 0.02, 8, false);
                        tentacle.geometry.dispose();
                        tentacle.geometry = newGeometry;
                    }
                }
            }
            
            // Animate slime drips
            const slimeStartIndex = 2 + this.tentacles.length; // Body, head, then tentacles
            for (let i = slimeStartIndex; i < this.modelGroup.children.length - 2; i++) { // Exclude base and water
                const slime = this.modelGroup.children[i];
                if (slime && slime.userData) {
                    // Move slime downward
                    slime.position.y -= slime.userData.speed * delta;
                    
                    // If it's too low, reset to original position
                    if (slime.position.y < 0.05) {
                        slime.position.y = slime.userData.originalY;
                        
                        // Randomize horizontal position for next drip
                        const angle = Math.random() * Math.PI * 2;
                        const radius = 0.3 + Math.random() * 0.4;
                        
                        slime.position.x = Math.sin(angle) * radius;
                        slime.position.z = Math.cos(angle) * radius;
                    }
                    
                    // Scale based on position (smaller as it falls)
                    const scaleFactor = Math.max(0.5, slime.position.y / slime.userData.originalY);
                    const size = slime.userData.size * scaleFactor;
                    slime.scale.set(size, size, size);
                }
            }
            
            // Animate the swamp water
            const water = this.modelGroup.children[this.modelGroup.children.length - 1];
            if (water) {
                // Gentle ripple effect
                const rippleFactor = 1.0 + Math.sin(time * 1.5) * 0.05;
                water.scale.set(rippleFactor, 1, rippleFactor);
                
                // Rotate slowly
                water.rotation.y += delta * 0.2;
            }
        }
        
        // Call the base class animations for basic movement
        super.updateAnimations(delta);
    }
}