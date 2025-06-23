import * as THREE from 'three';
import { ExplodingPalmEffect } from '../../ExplodingPalmEffect.js';

/**
 * Effect for the Fiery Palm variant of Exploding Palm
 * Creates a fire-infused palm strike that adds fire damage to the explosion
 * Visual style: Flame particles and ember trails
 */
export class FieryPalmEffect extends ExplodingPalmEffect {
    constructor(skill) {
        super(skill);
        
        // Variant-specific properties
        this.fireDamage = true;
        this.fireDamageMultiplier = 1.3; // 30% more damage as fire
        
        // Visual properties
        this.fireParticles = null;
        this.embers = [];
        this.fireColor = new THREE.Color(0xff5500);
        this.emberColors = [
            new THREE.Color(0xff3300),
            new THREE.Color(0xff6600),
            new THREE.Color(0xff9900)
        ];
    }

    /**
     * Create the Fiery Palm effect
     * @param {THREE.Vector3} position - Position to create the effect at
     * @param {THREE.Vector3} direction - Direction the effect should face
     * @returns {THREE.Group} - The created effect
     */
    create(position, direction) {
        // Create base effect first
        const effectGroup = super.create(position, direction);
        
        // Change the color of the base effect to fire colors
        effectGroup.traverse(child => {
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(mat => {
                        mat.color = this.fireColor.clone();
                    });
                } else {
                    child.material.color = this.fireColor.clone();
                }
            }
        });
        
        // Add fire particles
        this.addFireParticles(effectGroup);
        
        // Add ember trails
        this.addEmberTrails(effectGroup);
        
        // Add flame hand
        this.addFlameHand(effectGroup);
        
        return effectGroup;
    }
    
    /**
     * Add fire particles to the effect
     * @param {THREE.Group} group - The group to add fire particles to
     */
    addFireParticles(group) {
        const particleCount = 100;
        
        // Create fire particle geometry
        const particleGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        
        // Create fire particles in a sphere
        for (let i = 0; i < particleCount; i++) {
            // Random position within a sphere
            const radius = Math.random() * this.skill.radius * 0.8;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            
            positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta) + 0.5; // Offset upward
            positions[i * 3 + 2] = radius * Math.cos(phi);
            
            // Random fire color (yellow to red)
            const colorFactor = Math.random();
            colors[i * 3] = 1.0; // Red always high
            colors[i * 3 + 1] = 0.3 + colorFactor * 0.7; // Green varies
            colors[i * 3 + 2] = colorFactor * 0.3; // Blue low
            
            // Random sizes
            sizes[i] = 0.1 + Math.random() * 0.2;
        }
        
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        // Create fire particle material
        const particleMaterial = new THREE.PointsMaterial({
            size: 0.2,
            transparent: true,
            opacity: 0.8,
            vertexColors: true,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true
        });
        
        // Create fire particles
        const fireParticles = new THREE.Points(particleGeometry, particleMaterial);
        group.add(fireParticles);
        
        // Store for animation
        this.fireParticles = fireParticles;
    }
    
    /**
     * Add ember trails to the effect
     * @param {THREE.Group} group - The group to add ember trails to
     */
    addEmberTrails(group) {
        const emberCount = 15;
        
        for (let i = 0; i < emberCount; i++) {
            // Create an ember
            const ember = this.createEmber();
            
            // Position randomly within the effect
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * this.skill.radius * 0.5;
            
            ember.position.x = Math.cos(angle) * radius;
            ember.position.z = Math.sin(angle) * radius;
            ember.position.y = Math.random() * 1.5;
            
            // Store initial position and movement data
            ember.userData.initialY = ember.position.y;
            ember.userData.speed = 0.5 + Math.random() * 1.0;
            ember.userData.angle = angle;
            ember.userData.radius = radius;
            
            group.add(ember);
            this.embers.push(ember);
        }
    }
    
    /**
     * Create a stylized ember using simple geometries
     * @returns {THREE.Group} - The created ember
     */
    createEmber() {
        const emberGroup = new THREE.Group();
        
        // Create ember core
        const coreGeometry = new THREE.SphereGeometry(0.05, 8, 8);
        const coreMaterial = new THREE.MeshBasicMaterial({
            color: this.emberColors[Math.floor(Math.random() * this.emberColors.length)],
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending
        });
        
        const core = new THREE.Mesh(coreGeometry, coreMaterial);
        emberGroup.add(core);
        
        // Add a glow effect
        const glowGeometry = new THREE.SphereGeometry(0.1, 8, 8);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0xff9900,
            transparent: true,
            opacity: 0.5,
            blending: THREE.AdditiveBlending
        });
        
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        emberGroup.add(glow);
        
        return emberGroup;
    }
    
    /**
     * Add a flame hand to the effect
     * @param {THREE.Group} group - The group to add the flame hand to
     */
    addFlameHand(group) {
        // Create a stylized hand shape using boxes
        const handGroup = new THREE.Group();
        
        // Palm
        const palmGeometry = new THREE.BoxGeometry(0.3, 0.1, 0.4);
        const palmMaterial = new THREE.MeshBasicMaterial({
            color: this.fireColor,
            transparent: true,
            opacity: 0.7,
            blending: THREE.AdditiveBlending
        });
        
        const palm = new THREE.Mesh(palmGeometry, palmMaterial);
        handGroup.add(palm);
        
        // Fingers
        const fingerCount = 5;
        const fingerPositions = [
            { x: -0.12, z: -0.15, length: 0.25, angle: -0.2 },
            { x: -0.04, z: -0.18, length: 0.3, angle: -0.1 },
            { x: 0.04, z: -0.18, length: 0.35, angle: 0 },
            { x: 0.12, z: -0.15, length: 0.3, angle: 0.1 },
            { x: 0.15, z: -0.05, length: 0.2, angle: 0.3 } // Thumb
        ];
        
        for (let i = 0; i < fingerCount; i++) {
            const pos = fingerPositions[i];
            const fingerGeometry = new THREE.BoxGeometry(0.06, 0.08, pos.length);
            const fingerMaterial = palmMaterial.clone();
            
            const finger = new THREE.Mesh(fingerGeometry, fingerMaterial);
            finger.position.x = pos.x;
            finger.position.z = pos.z - pos.length/2;
            finger.rotation.x = pos.angle;
            
            handGroup.add(finger);
        }
        
        // Position and rotate the hand
        handGroup.rotation.x = Math.PI / 2; // Palm facing down
        handGroup.position.y = 0.5;
        
        // Add to effect group
        group.add(handGroup);
        
        // Store for animation
        this.flameHand = handGroup;
    }
    
    /**
     * Update the Fiery Palm effect
     * @param {number} delta - Time since last update in seconds
     */
    update(delta) {
        super.update(delta);
        
        if (this.isActive && this.effect) {
            // Animate fire particles
            if (this.fireParticles && this.fireParticles.geometry) {
                const positions = this.fireParticles.geometry.attributes.position.array;
                const colors = this.fireParticles.geometry.attributes.color.array;
                const count = positions.length / 3;
                
                for (let i = 0; i < count; i++) {
                    // Get current position
                    const x = positions[i * 3];
                    const y = positions[i * 3 + 1];
                    const z = positions[i * 3 + 2];
                    
                    // Move upward with some randomness
                    positions[i * 3] += (Math.random() - 0.5) * 0.05;
                    positions[i * 3 + 1] += 0.5 * delta + Math.random() * 0.1;
                    positions[i * 3 + 2] += (Math.random() - 0.5) * 0.05;
                    
                    // Fade out particles as they rise
                    const newY = positions[i * 3 + 1];
                    if (newY > 2) {
                        // Reduce green and blue to make it more red as it rises
                        colors[i * 3 + 1] = Math.max(0, colors[i * 3 + 1] - 0.05);
                        colors[i * 3 + 2] = Math.max(0, colors[i * 3 + 2] - 0.05);
                        
                        // Reset particle if it gets too high
                        if (newY > 3 || Math.random() < 0.01) {
                            const radius = Math.random() * this.skill.radius * 0.5;
                            const theta = Math.random() * Math.PI * 2;
                            
                            positions[i * 3] = radius * Math.cos(theta);
                            positions[i * 3 + 1] = 0.1;
                            positions[i * 3 + 2] = radius * Math.sin(theta);
                            
                            // Reset color
                            const colorFactor = Math.random();
                            colors[i * 3] = 1.0;
                            colors[i * 3 + 1] = 0.3 + colorFactor * 0.7;
                            colors[i * 3 + 2] = colorFactor * 0.3;
                        }
                    }
                }
                
                this.fireParticles.geometry.attributes.position.needsUpdate = true;
                this.fireParticles.geometry.attributes.color.needsUpdate = true;
            }
            
            // Animate embers
            this.embers.forEach(ember => {
                const speed = ember.userData.speed || 1;
                
                // Move upward with some spiral
                ember.position.y += speed * delta;
                
                // Spiral outward
                const angle = ember.userData.angle + delta;
                const radius = ember.userData.radius + delta * 0.2;
                
                ember.position.x = Math.cos(angle) * radius;
                ember.position.z = Math.sin(angle) * radius;
                
                // Update stored values
                ember.userData.angle = angle;
                ember.userData.radius = radius;
                
                // Reset if too high
                if (ember.position.y > 3) {
                    const newAngle = Math.random() * Math.PI * 2;
                    const newRadius = Math.random() * this.skill.radius * 0.5;
                    
                    ember.position.x = Math.cos(newAngle) * newRadius;
                    ember.position.z = Math.sin(newAngle) * newRadius;
                    ember.position.y = 0.1;
                    
                    ember.userData.angle = newAngle;
                    ember.userData.radius = newRadius;
                }
                
                // Pulse the glow
                const glowPulse = 0.8 + Math.sin(this.elapsedTime * 5 + ember.userData.angle) * 0.2;
                ember.children[1].scale.set(glowPulse, glowPulse, glowPulse);
            });
            
            // Animate flame hand
            if (this.flameHand) {
                // Pulse the hand
                const pulseFactor = 1 + 0.1 * Math.sin(this.elapsedTime * 8);
                this.flameHand.scale.set(pulseFactor, pulseFactor, pulseFactor);
                
                // Rotate slightly
                this.flameHand.rotation.z += delta * 0.5;
            }
        }
    }
    
    /**
     * Override the damage application to add fire damage
     * @param {Enemy} enemy - The enemy to damage
     * @param {number} amount - The amount of damage to deal
     */
    applyDamage(enemy, amount) {
        if (this.fireDamage) {
            // Apply increased damage with fire component
            const fireDamage = amount * this.fireDamageMultiplier;
            super.applyDamage(enemy, fireDamage);
            
            // Apply fire status effect if the enemy supports it
            if (enemy.addStatusEffect) {
                enemy.addStatusEffect('burning', 3); // 3 seconds of burning
            }
        } else {
            // Apply normal damage
            super.applyDamage(enemy, amount);
        }
    }
    
    /**
     * Create explosion effect with fire elements
     * @param {THREE.Vector3} position - Position to create the explosion at
     */
    createExplosion(position) {
        // Create base explosion
        const explosion = super.createExplosion(position);
        
        // Add fire elements to the explosion
        if (explosion) {
            // Change explosion color to fire colors
            explosion.traverse(child => {
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(mat => {
                            mat.color = this.fireColor.clone();
                        });
                    } else {
                        child.material.color = this.fireColor.clone();
                    }
                }
            });
            
            // Add fire particles to explosion
            const particleCount = 50;
            const particleGeometry = new THREE.BufferGeometry();
            const positions = new Float32Array(particleCount * 3);
            
            for (let i = 0; i < particleCount; i++) {
                const angle = Math.random() * Math.PI * 2;
                const radius = Math.random() * this.skill.radius;
                
                positions[i * 3] = Math.cos(angle) * radius;
                positions[i * 3 + 1] = Math.random() * 2;
                positions[i * 3 + 2] = Math.sin(angle) * radius;
            }
            
            particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            
            const particleMaterial = new THREE.PointsMaterial({
                color: 0xff7700,
                size: 0.2,
                transparent: true,
                opacity: 0.8,
                blending: THREE.AdditiveBlending
            });
            
            const fireParticles = new THREE.Points(particleGeometry, particleMaterial);
            explosion.add(fireParticles);
        }
        
        return explosion;
    }
    
    /**
     * Dispose of the effect and clean up resources
     */
    dispose() {
        // Clear arrays
        this.embers = [];
        this.fireParticles = null;
        this.flameHand = null;
        
        // Call parent dispose
        super.dispose();
    }
}