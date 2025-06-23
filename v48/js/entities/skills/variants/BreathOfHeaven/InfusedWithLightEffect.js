import * as THREE from 'three';
import { BreathOfHeavenEffect } from '../../BreathOfHeavenEffect.js';

/**
 * Effect for the Infused with Light variant of Breath of Heaven
 * Grants a temporary damage boost to allies healed
 * Visual style: Glowing light particles with radiant beams
 */
export class InfusedWithLightEffect extends BreathOfHeavenEffect {
    constructor(skill) {
        super(skill);
        
        // Variant-specific properties
        this.damageBoostMultiplier = 1.25; // 25% damage boost
        this.damageBoostDuration = 5; // 5 seconds of damage boost
        
        // Visual properties
        this.lightBeams = [];
        this.rotationSpeed = 0.3; // Rotation speed for the beams
        this.lightColor = new THREE.Color(0xffffaa); // Warm light color
    }

    /**
     * Create the Infused with Light effect
     * @param {THREE.Vector3} position - Position to create the effect at
     * @param {THREE.Vector3} direction - Direction the effect should face
     * @returns {THREE.Group} - The created effect
     */
    create(position, direction) {
        // Create base effect first
        const effectGroup = super.create(position, direction);
        
        // Change the color of the base effect to light color
        effectGroup.traverse(child => {
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(mat => {
                        mat.color = this.lightColor.clone();
                    });
                } else {
                    child.material.color = this.lightColor.clone();
                }
            }
        });
        
        // Add light beams
        this.addLightBeams(effectGroup);
        
        // Add radiant particles
        this.addRadiantParticles(effectGroup);
        
        return effectGroup;
    }
    
    /**
     * Add light beams to the effect
     * @param {THREE.Group} group - The group to add light beams to
     */
    addLightBeams(group) {
        const beamCount = 6;
        const beamHeight = 3;
        
        for (let i = 0; i < beamCount; i++) {
            // Create a light beam
            const beamGeometry = new THREE.CylinderGeometry(0.1, 0.3, beamHeight, 8);
            const beamMaterial = new THREE.MeshBasicMaterial({
                color: this.lightColor,
                transparent: true,
                opacity: 0.6,
                side: THREE.DoubleSide,
                blending: THREE.AdditiveBlending
            });
            
            const beam = new THREE.Mesh(beamGeometry, beamMaterial);
            
            // Position around a circle
            const angle = (i / beamCount) * Math.PI * 2;
            const radius = this.skill.radius * 0.7;
            
            beam.position.x = Math.cos(angle) * radius;
            beam.position.z = Math.sin(angle) * radius;
            beam.position.y = beamHeight / 2; // Center vertically
            
            // Rotate to point outward and upward
            beam.rotation.x = Math.PI / 6; // Tilt upward
            beam.rotation.y = angle;
            
            // Store initial position for animation
            beam.userData.angle = angle;
            beam.userData.radius = radius;
            
            group.add(beam);
            this.lightBeams.push(beam);
        }
    }
    
    /**
     * Add radiant particles to the effect
     * @param {THREE.Group} group - The group to add radiant particles to
     */
    addRadiantParticles(group) {
        const particleCount = 100;
        
        // Create particle geometry
        const particleGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        
        // Create particles in a sphere
        for (let i = 0; i < particleCount; i++) {
            // Random position within a sphere
            const radius = Math.random() * this.skill.radius;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            
            positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = radius * Math.cos(phi);
            
            // Light color with slight variations
            const colorFactor = 0.8 + Math.random() * 0.2;
            colors[i * 3] = 1.0; // Red
            colors[i * 3 + 1] = 1.0; // Green
            colors[i * 3 + 2] = 0.7 * colorFactor; // Blue (slightly less to make it warm)
            
            // Random sizes
            sizes[i] = 0.1 + Math.random() * 0.2;
        }
        
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        // Create particle material
        const particleMaterial = new THREE.PointsMaterial({
            size: 0.2,
            transparent: true,
            opacity: 0.8,
            vertexColors: true,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true
        });
        
        // Create particles
        const particles = new THREE.Points(particleGeometry, particleMaterial);
        group.add(particles);
        
        // Store for animation
        this.radiantParticles = particles;
    }
    
    /**
     * Update the Infused with Light effect
     * @param {number} delta - Time since last update in seconds
     */
    update(delta) {
        super.update(delta);
        
        if (this.isActive && this.effect) {
            // Animate light beams
            this.lightBeams.forEach(beam => {
                const angle = beam.userData.angle + this.rotationSpeed * delta;
                const radius = beam.userData.radius;
                
                beam.position.x = Math.cos(angle) * radius;
                beam.position.z = Math.sin(angle) * radius;
                beam.rotation.y = angle;
                
                // Pulse the beams
                const pulseFactor = 1 + 0.2 * Math.sin(this.elapsedTime * 3 + beam.userData.angle);
                beam.scale.set(pulseFactor, 1, pulseFactor);
                
                // Update stored angle
                beam.userData.angle = angle;
            });
            
            // Animate radiant particles
            if (this.radiantParticles && this.radiantParticles.geometry) {
                const positions = this.radiantParticles.geometry.attributes.position.array;
                const count = positions.length / 3;
                
                for (let i = 0; i < count; i++) {
                    // Get current position
                    const x = positions[i * 3];
                    const y = positions[i * 3 + 1];
                    const z = positions[i * 3 + 2];
                    
                    // Calculate distance from center
                    const distance = Math.sqrt(x * x + y * y + z * z);
                    
                    // Move particles in a spiral pattern
                    const angle = Math.atan2(z, x) + delta * 0.5;
                    const newDistance = distance * (1 + Math.sin(this.elapsedTime * 2) * 0.05);
                    
                    positions[i * 3] = Math.cos(angle) * newDistance;
                    positions[i * 3 + 2] = Math.sin(angle) * newDistance;
                    
                    // Add some vertical movement
                    positions[i * 3 + 1] += Math.sin(this.elapsedTime * 3 + i * 0.1) * delta * 0.2;
                    
                    // Reset particles that go too far
                    if (newDistance > this.skill.radius * 1.2 || Math.random() < 0.01) {
                        const newRadius = Math.random() * this.skill.radius * 0.5;
                        const newTheta = Math.random() * Math.PI * 2;
                        const newPhi = Math.random() * Math.PI;
                        
                        positions[i * 3] = newRadius * Math.sin(newPhi) * Math.cos(newTheta);
                        positions[i * 3 + 1] = newRadius * Math.sin(newPhi) * Math.sin(newTheta);
                        positions[i * 3 + 2] = newRadius * Math.cos(newPhi);
                    }
                }
                
                this.radiantParticles.geometry.attributes.position.needsUpdate = true;
            }
        }
    }
    
    /**
     * Apply healing effect with damage boost
     */
    applyHealingEffect() {
        // Apply the base healing effect
        super.applyHealingEffect();
        
        // Apply damage boost to player and allies
        this.applyDamageBoost();
    }
    
    /**
     * Apply damage boost to player and allies
     */
    applyDamageBoost() {
        if (!this.skill.game || !this.skill.game.player) return;
        
        const player = this.skill.game.player;
        if (player && player.stats) {
            // Apply the damage boost
            player.stats.addTemporaryBoost('damage', this.damageBoostMultiplier, this.damageBoostDuration);
            
            // Show a notification if available
            if (this.skill.game.hudManager && this.skill.game.hudManager.showNotification) {
                this.skill.game.hudManager.showNotification(`Damage increased by 25% for ${this.damageBoostDuration} seconds!`);
            }
        }
        
        // TODO: Apply damage boost to allies when ally system is implemented
    }
    
    /**
     * Dispose of the effect and clean up resources
     */
    dispose() {
        // Clear light beams array
        this.lightBeams = [];
        this.radiantParticles = null;
        
        // Call parent dispose
        super.dispose();
    }
}