import * as THREE from 'three';
import { ImprisonedFistsEffect } from '../../ImprisonedFistsEffect.js';

/**
 * Effect for the Fiery Chains variant of Imprisoned Fists
 * Adds fire damage to the strike, burning enemies over time
 * Visual style: Glowing red/orange chains with fire particles
 */
export class FieryChainsEffect extends ImprisonedFistsEffect {
    constructor(skill) {
        super(skill);
        
        // Variant-specific properties
        this.burnDuration = 5; // 5 seconds of burn
        this.burnDamagePerSecond = 8; // Burn damage per second
        this.burnDamageInterval = 0.5; // Apply burn damage every 0.5 seconds
        this.lastBurnDamageTime = 0;
        
        // Visual properties
        this.fireParticles = [];
        this.fireEmbers = [];
        this.flameIntensity = 1.0; // Controls the intensity of the flame effect
    }

    /**
     * Create the Fiery Chains effect
     * @param {THREE.Vector3} position - Position to create the effect at
     * @param {THREE.Vector3} direction - Direction the effect should face
     * @returns {THREE.Group} - The created effect
     */
    create(position, direction) {
        // Create base effect first
        const effectGroup = super.create(position, direction);
        
        // Modify the base effect color to fiery orange/red
        effectGroup.children.forEach(child => {
            if (child.material) {
                if (child instanceof THREE.Mesh) {
                    child.material.color.set(0xff6600); // Fiery orange color
                }
            }
        });
        
        // Modify particle system colors to fiery colors
        if (this.particleSystem) {
            const colors = this.particleSystem.geometry.attributes.color.array;
            const color = new THREE.Color(0xff6600); // Fiery orange color
            
            for (let i = 0; i < colors.length / 3; i++) {
                colors[i * 3] = color.r * (0.8 + Math.random() * 0.2);
                colors[i * 3 + 1] = color.g * (0.8 + Math.random() * 0.2);
                colors[i * 3 + 2] = color.b * (0.8 + Math.random() * 0.2);
            }
            
            this.particleSystem.geometry.attributes.color.needsUpdate = true;
        }
        
        // Modify ground indicator color
        if (this.groundIndicator) {
            this.groundIndicator.material.color.set(0xff6600); // Fiery orange color
        }
        
        // Add fire particles
        this.addFireParticles(effectGroup);
        
        return effectGroup;
    }
    
    /**
     * Add fire particles to the effect
     * @param {THREE.Group} group - The group to add fire particles to
     */
    addFireParticles(group) {
        const particleCount = 60;
        const particleGeometry = new THREE.BufferGeometry();
        
        // Create particle positions
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        
        // Create a range of fire colors from yellow to red
        const fireColors = [
            new THREE.Color(0xffff00), // Yellow
            new THREE.Color(0xffaa00), // Orange
            new THREE.Color(0xff6600), // Dark orange
            new THREE.Color(0xff0000)  // Red
        ];
        
        for (let i = 0; i < particleCount; i++) {
            // Random position around the beam
            const distance = Math.random() * 5; // Length of the beam
            const angle = Math.random() * Math.PI * 2; // Random angle around the beam
            const radius = (this.radius / 10) * (1 + Math.random()); // Vary the radius
            
            // Position particles in a cloud around the beam
            positions[i * 3] = Math.cos(angle) * radius;
            positions[i * 3 + 1] = Math.sin(angle) * radius;
            positions[i * 3 + 2] = distance;
            
            // Random fire color
            const colorIndex = Math.floor(Math.random() * fireColors.length);
            const color = fireColors[colorIndex];
            
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;
            
            // Size - larger for fire particles
            sizes[i] = 0.15 + Math.random() * 0.25;
        }
        
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        // Create particle material
        const particleMaterial = new THREE.PointsMaterial({
            size: 0.25,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true
        });
        
        const fireParticleSystem = new THREE.Points(particleGeometry, particleMaterial);
        group.add(fireParticleSystem);
        
        // Store for animation
        this.fireParticles.push(fireParticleSystem);
    }
    
    /**
     * Create a visual lock effect for an enemy with fire effects
     * @param {Enemy} enemy - The enemy to create a lock effect for
     */
    createLockEffect(enemy) {
        // Call the parent method to create the base lock effect
        super.createLockEffect(enemy);
        
        const enemyPosition = enemy.getPosition();
        
        // Create fire embers around the enemy
        const emberCount = 8 + Math.floor(Math.random() * 5); // 8-12 embers
        
        for (let i = 0; i < emberCount; i++) {
            // Create a fire ember using a small sphere
            const radius = 0.1 + Math.random() * 0.1; // Radius between 0.1 and 0.2
            
            const emberGeometry = new THREE.SphereGeometry(radius, 8, 8);
            
            // Random fire color
            const colors = [0xffff00, 0xffaa00, 0xff6600, 0xff0000];
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            const emberMaterial = new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: 0.8,
                blending: THREE.AdditiveBlending
            });
            
            const ember = new THREE.Mesh(emberGeometry, emberMaterial);
            
            // Position around the enemy
            const angle = (i / emberCount) * Math.PI * 2;
            const distance = 0.8 + Math.random() * 0.4; // Distance from enemy center
            
            ember.position.set(
                enemyPosition.x + Math.cos(angle) * distance,
                enemyPosition.y + (Math.random() * 0.5), // Vary height
                enemyPosition.z + Math.sin(angle) * distance
            );
            
            // Store initial position and movement properties for animation
            ember.userData = {
                initialY: ember.position.y,
                floatSpeed: 0.5 + Math.random() * 1.0,
                floatOffset: Math.random() * Math.PI * 2,
                scaleSpeed: 0.5 + Math.random() * 1.0,
                scaleOffset: Math.random() * Math.PI * 2
            };
            
            // Add to scene
            if (this.skill.game && this.skill.game.scene) {
                this.skill.game.scene.add(ember);
                
                // Store for cleanup and animation
                this.fireEmbers.push(ember);
            }
        }
        
        // Apply burn effect to the enemy
        this.applyBurnEffect(enemy);
    }
    
    /**
     * Apply burn effect to an enemy
     * @param {Enemy} enemy - The enemy to burn
     */
    applyBurnEffect(enemy) {
        // Apply burn status effect to the enemy
        if (enemy.addStatusEffect) {
            enemy.addStatusEffect({
                type: 'burn',
                duration: this.burnDuration,
                source: 'FieryChains',
                // Apply burn damage over time
                onTick: (delta) => {
                    this.lastBurnDamageTime += delta;
                    if (this.lastBurnDamageTime >= this.burnDamageInterval) {
                        // IMPORTANT: THIS CHECKED BY COLLISIONMANAGER
                        // const damage = this.burnDamagePerSecond * this.burnDamageInterval;
                        // enemy.takeDamage(damage);
                        this.lastBurnDamageTime = 0;
                        
                        // Create a fire damage visual effect
                        this.createFireDamageEffect(enemy.getPosition());
                    }
                }
            });
        }
    }
    
    /**
     * Create a fire damage visual effect
     * @param {THREE.Vector3} position - Position to create the effect at
     */
    createFireDamageEffect(position) {
        // Create a burst of fire particles
        const particleCount = 15;
        const particleGeometry = new THREE.BufferGeometry();
        
        // Create particle positions
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        
        // Create a range of fire colors
        const fireColors = [
            new THREE.Color(0xffff00), // Yellow
            new THREE.Color(0xffaa00), // Orange
            new THREE.Color(0xff6600), // Dark orange
            new THREE.Color(0xff0000)  // Red
        ];
        
        for (let i = 0; i < particleCount; i++) {
            // Random position in a sphere
            const radius = 0.3 + Math.random() * 0.3;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            
            positions[i * 3] = position.x + radius * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = position.y + radius * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = position.z + radius * Math.cos(phi);
            
            // Random fire color
            const colorIndex = Math.floor(Math.random() * fireColors.length);
            const color = fireColors[colorIndex];
            
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;
        }
        
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        // Create particle material
        const particleMaterial = new THREE.PointsMaterial({
            size: 0.25,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });
        
        const particles = new THREE.Points(particleGeometry, particleMaterial);
        
        // Add to scene
        if (this.skill.game && this.skill.game.scene) {
            this.skill.game.scene.add(particles);
            
            // Remove after a short duration
            setTimeout(() => {
                if (this.skill.game && this.skill.game.scene) {
                    this.skill.game.scene.remove(particles);
                    particleGeometry.dispose();
                    particleMaterial.dispose();
                }
            }, 600); // 0.6 seconds
        }
    }
    
    /**
     * Update the Fiery Chains effect
     * @param {number} delta - Time since last update in seconds
     */
    update(delta) {
        super.update(delta);
        
        if (this.isActive && this.effect) {
            // Animate fire particles
            this.fireParticles.forEach(particles => {
                const positions = particles.geometry.attributes.position.array;
                const colors = particles.geometry.attributes.color.array;
                const count = positions.length / 3;
                
                for (let i = 0; i < count; i++) {
                    // Rising movement for fire particles
                    const x = positions[i * 3];
                    const y = positions[i * 3 + 1];
                    const z = positions[i * 3 + 2];
                    
                    // Add some random movement to simulate flickering
                    positions[i * 3] = x + (Math.random() - 0.5) * delta * 0.5;
                    positions[i * 3 + 1] = y + (Math.random() - 0.5) * delta * 0.5;
                    
                    // Move particles along the beam with some randomness
                    positions[i * 3 + 2] = z + (Math.random() - 0.3) * delta * 2;
                    
                    // Reset particles that move too far
                    if (z < 0 || z > 5) {
                        positions[i * 3 + 2] = Math.random() * 5;
                        
                        // Also reset x and y to maintain the beam shape
                        const angle = Math.random() * Math.PI * 2;
                        const radius = (this.radius / 10) * (1 + Math.random());
                        positions[i * 3] = Math.cos(angle) * radius;
                        positions[i * 3 + 1] = Math.sin(angle) * radius;
                    }
                    
                    // Fade colors from yellow to red based on position
                    // This creates the effect of cooling embers
                    const normalizedZ = z / 5; // 0 to 1 based on position along beam
                    
                    // Yellow (1,1,0) to red (1,0,0)
                    colors[i * 3] = 1.0; // Red always 1
                    colors[i * 3 + 1] = Math.max(0, 1.0 - normalizedZ); // Green fades out
                    colors[i * 3 + 2] = 0; // Blue always 0
                }
                
                particles.geometry.attributes.position.needsUpdate = true;
                particles.geometry.attributes.color.needsUpdate = true;
            });
            
            // Animate fire embers
            this.fireEmbers.forEach(ember => {
                const time = this.elapsedTime;
                const userData = ember.userData;
                
                // Floating animation
                if (userData.initialY !== undefined) {
                    ember.position.y = userData.initialY + 
                        Math.sin(time * userData.floatSpeed + userData.floatOffset) * 0.2;
                }
                
                // Pulsing size animation
                const scale = 0.8 + (Math.sin(time * userData.scaleSpeed + userData.scaleOffset) * 0.2);
                ember.scale.set(scale, scale, scale);
                
                // Flickering opacity
                if (ember.material) {
                    ember.material.opacity = 0.6 + Math.random() * 0.4;
                }
            });
        }
    }
    
    /**
     * Dispose of the effect and clean up resources
     */
    dispose() {
        // Clean up fire particles
        this.fireParticles = [];
        
        // Clean up fire embers
        this.fireEmbers.forEach(ember => {
            if (this.skill.game && this.skill.game.scene) {
                this.skill.game.scene.remove(ember);
                if (ember.geometry) ember.geometry.dispose();
                if (ember.material) ember.material.dispose();
            }
        });
        this.fireEmbers = [];
        
        // Call parent dispose
        super.dispose();
    }
}