import * as THREE from 'three';
import { InnerSanctuaryEffect } from '../../InnerSanctuaryEffect.js';

/**
 * Effect for the Circle of Wrath variant of Inner Sanctuary
 * Enemies within the sanctuary take damage over time
 * Visual style: Red/orange sanctuary with fire effects and damage runes
 */
export class CircleOfWrathEffect extends InnerSanctuaryEffect {
    constructor(skill) {
        super(skill);
        
        // Variant-specific properties
        this.damagePerSecond = 15; // Damage per second to enemies
        this.damageInterval = 0.5; // Apply damage every 0.5 seconds
        this.lastDamageTime = 0;
        
        // Visual properties
        this.fireEffects = [];
        this.damageRunes = [];
        this.wrathParticles = [];
    }

    /**
     * Create the Inner Sanctuary effect
     * @param {THREE.Group} effectGroup - Group to add the effect to
     * @param {THREE.Vector3} position - Player position
     * @private
     */
    _createInnerSanctuaryEffect(effectGroup, position) {
        // Call the parent method to create the base sanctuary
        super._createInnerSanctuaryEffect(effectGroup, position);
        
        // Get the sanctuary group (first child of effect group)
        const sanctuaryGroup = effectGroup.children[0];
        
        // Modify the base sanctuary colors to red/orange
        this._modifySanctuaryColors(sanctuaryGroup);
        
        // Add fire effects
        this._addFireEffects(sanctuaryGroup);
        
        // Add damage runes
        this._addDamageRunes(sanctuaryGroup);
        
        // Add wrath particles
        this._addWrathParticles(sanctuaryGroup);
    }
    
    /**
     * Modify the sanctuary colors to red/orange
     * @param {THREE.Group} sanctuaryGroup - The sanctuary group to modify
     * @private
     */
    _modifySanctuaryColors(sanctuaryGroup) {
        // Define the wrath color (red/orange)
        const wrathColor = new THREE.Color(0xff3300);
        
        // Traverse all children and modify materials
        sanctuaryGroup.traverse(child => {
            if (child.material) {
                // Check if it's a mesh
                if (child instanceof THREE.Mesh) {
                    // Clone the material to avoid affecting other instances
                    if (Array.isArray(child.material)) {
                        child.material = child.material.map(mat => mat.clone());
                    } else {
                        child.material = child.material.clone();
                    }
                    
                    // Modify the material color and emissive
                    if (Array.isArray(child.material)) {
                        child.material.forEach(mat => {
                            mat.color.set(wrathColor);
                            mat.emissive.set(wrathColor);
                        });
                    } else {
                        child.material.color.set(wrathColor);
                        child.material.emissive.set(wrathColor);
                    }
                }
            }
        });
    }
    
    /**
     * Add fire effects to the sanctuary
     * @param {THREE.Group} sanctuaryGroup - The sanctuary group to add fire to
     * @private
     */
    _addFireEffects(sanctuaryGroup) {
        const baseRadius = this.skill.radius || 5;
        const fireCount = 6;
        
        for (let i = 0; i < fireCount; i++) {
            const angle = (i / fireCount) * Math.PI * 2;
            const fireRadius = baseRadius * 0.8; // Near the edge
            
            // Create a fire effect using particle system
            const particleCount = 30;
            const particleGeometry = new THREE.BufferGeometry();
            
            // Create particle positions
            const positions = new Float32Array(particleCount * 3);
            const colors = new Float32Array(particleCount * 3);
            const sizes = new Float32Array(particleCount);
            
            // Create fire colors
            const fireColors = [
                new THREE.Color(0xffff00), // Yellow
                new THREE.Color(0xffaa00), // Orange
                new THREE.Color(0xff6600), // Dark orange
                new THREE.Color(0xff0000)  // Red
            ];
            
            for (let j = 0; j < particleCount; j++) {
                // Random position in a column
                const localRadius = 0.3 * Math.random();
                const localAngle = Math.random() * Math.PI * 2;
                const height = Math.random() * 2.0;
                
                // Position relative to fire center
                positions[j * 3] = Math.cos(localAngle) * localRadius;
                positions[j * 3 + 1] = height;
                positions[j * 3 + 2] = Math.sin(localAngle) * localRadius;
                
                // Random fire color
                const colorIndex = Math.floor(Math.random() * fireColors.length);
                const color = fireColors[colorIndex];
                
                colors[j * 3] = color.r;
                colors[j * 3 + 1] = color.g;
                colors[j * 3 + 2] = color.b;
                
                // Size - varied for fire particles
                sizes[j] = 0.1 + Math.random() * 0.2;
            }
            
            particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
            particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
            
            // Create particle material
            const particleMaterial = new THREE.PointsMaterial({
                size: 0.2,
                vertexColors: true,
                transparent: true,
                opacity: 0.8,
                blending: THREE.AdditiveBlending,
                sizeAttenuation: true
            });
            
            const fireParticleSystem = new THREE.Points(particleGeometry, particleMaterial);
            
            // Position fire
            fireParticleSystem.position.set(
                Math.cos(angle) * fireRadius,
                0.1, // Just above ground
                Math.sin(angle) * fireRadius
            );
            
            // Store animation data
            fireParticleSystem.userData = {
                initialPositions: positions.slice(), // Clone the positions array
                initialY: fireParticleSystem.position.y
            };
            
            sanctuaryGroup.add(fireParticleSystem);
            this.fireEffects.push(fireParticleSystem);
        }
    }
    
    /**
     * Add damage runes to the sanctuary
     * @param {THREE.Group} sanctuaryGroup - The sanctuary group to add runes to
     * @private
     */
    _addDamageRunes(sanctuaryGroup) {
        const baseRadius = this.skill.radius || 5;
        const runeCount = 5;
        
        for (let i = 0; i < runeCount; i++) {
            const angle = (i / runeCount) * Math.PI * 2;
            const runeRadius = baseRadius * 0.6; // Inside the sanctuary
            
            // Create a damage rune
            const runeGeometry = new THREE.PlaneGeometry(1.2, 1.2);
            const runeMaterial = new THREE.MeshBasicMaterial({
                color: 0xff0000,
                transparent: true,
                opacity: 0.9,
                side: THREE.DoubleSide,
                blending: THREE.AdditiveBlending
            });
            
            const rune = new THREE.Mesh(runeGeometry, runeMaterial);
            
            // Position rune
            rune.position.set(
                Math.cos(angle) * runeRadius,
                0.1, // Just above ground
                Math.sin(angle) * runeRadius
            );
            
            // Rotate rune to lay flat
            rune.rotation.x = -Math.PI / 2;
            
            // Store animation data
            rune.userData = {
                rotationSpeed: 0.3 + Math.random() * 0.3,
                pulseSpeed: 0.5 + Math.random() * 0.5,
                initialOpacity: 0.9
            };
            
            sanctuaryGroup.add(rune);
            this.damageRunes.push(rune);
        }
    }
    
    /**
     * Add wrath particles to the sanctuary
     * @param {THREE.Group} sanctuaryGroup - The sanctuary group to add particles to
     * @private
     */
    _addWrathParticles(sanctuaryGroup) {
        const baseRadius = this.skill.radius || 5;
        const particleCount = 100;
        const particleGeometry = new THREE.BufferGeometry();
        
        // Create particle positions
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        
        // Create wrath colors
        const wrathColors = [
            new THREE.Color(0xff0000), // Red
            new THREE.Color(0xff3300), // Orange-red
            new THREE.Color(0xff6600), // Orange
            new THREE.Color(0xffaa00)  // Yellow-orange
        ];
        
        for (let i = 0; i < particleCount; i++) {
            // Random position within the sanctuary
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * baseRadius * 0.9;
            const height = 0.1 + Math.random() * 2.0;
            
            positions[i * 3] = Math.cos(angle) * radius;
            positions[i * 3 + 1] = height;
            positions[i * 3 + 2] = Math.sin(angle) * radius;
            
            // Random wrath color
            const colorIndex = Math.floor(Math.random() * wrathColors.length);
            const color = wrathColors[colorIndex];
            
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;
            
            // Size - varied for wrath particles
            sizes[i] = 0.05 + Math.random() * 0.15;
        }
        
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        // Create particle material
        const particleMaterial = new THREE.PointsMaterial({
            size: 0.15,
            vertexColors: true,
            transparent: true,
            opacity: 0.7,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true
        });
        
        const wrathParticleSystem = new THREE.Points(particleGeometry, particleMaterial);
        sanctuaryGroup.add(wrathParticleSystem);
        
        // Store for animation
        this.wrathParticles.push({
            system: wrathParticleSystem,
            initialPositions: positions.slice() // Clone the positions array
        });
    }
    
    /**
     * Update the Inner Sanctuary effect
     * @param {number} delta - Time since last update in seconds
     * @private
     */
    _updateInnerSanctuaryEffect(delta) {
        // Call the parent method to update the base sanctuary
        super._updateInnerSanctuaryEffect(delta);
        
        // Update fire effects
        this.fireEffects.forEach(fire => {
            const positions = fire.geometry.attributes.position.array;
            const initialPositions = fire.userData.initialPositions;
            const count = positions.length / 3;
            
            for (let i = 0; i < count; i++) {
                // Get initial position
                const x0 = initialPositions[i * 3];
                const y0 = initialPositions[i * 3 + 1];
                const z0 = initialPositions[i * 3 + 2];
                
                // Rising movement for fire
                positions[i * 3] = x0 + (Math.random() - 0.5) * delta * 0.5;
                positions[i * 3 + 1] = y0 + delta * (1.0 + Math.random() * 0.5);
                positions[i * 3 + 2] = z0 + (Math.random() - 0.5) * delta * 0.5;
                
                // Reset particles that rise too high
                if (positions[i * 3 + 1] > 2.0) {
                    positions[i * 3] = x0;
                    positions[i * 3 + 1] = 0;
                    positions[i * 3 + 2] = z0;
                }
            }
            
            fire.geometry.attributes.position.needsUpdate = true;
        });
        
        // Update damage runes
        this.damageRunes.forEach(rune => {
            // Rotate the rune
            rune.rotation.z += rune.userData.rotationSpeed * delta;
            
            // Pulse opacity
            rune.material.opacity = rune.userData.initialOpacity + 
                0.1 * Math.sin(this.elapsedTime * rune.userData.pulseSpeed);
            
            // Pulse scale
            const pulseScale = 1.0 + 0.2 * Math.sin(this.elapsedTime * rune.userData.pulseSpeed);
            rune.scale.set(pulseScale, pulseScale, pulseScale);
        });
        
        // Update wrath particles
        this.wrathParticles.forEach(particleData => {
            const system = particleData.system;
            const positions = system.geometry.attributes.position.array;
            const count = positions.length / 3;
            
            for (let i = 0; i < count; i++) {
                // Swirling movement
                const x = positions[i * 3];
                const y = positions[i * 3 + 1];
                const z = positions[i * 3 + 2];
                
                // Calculate distance from center
                const distance = Math.sqrt(x * x + z * z);
                
                // Spiral movement
                const angle = Math.atan2(z, x) + delta * (0.5 + distance * 0.2);
                
                // Update position
                positions[i * 3] = Math.cos(angle) * distance;
                positions[i * 3 + 2] = Math.sin(angle) * distance;
                
                // Random vertical movement
                positions[i * 3 + 1] = y + (Math.random() - 0.4) * delta * 0.5;
                
                // Keep particles within bounds
                if (y < 0.1) positions[i * 3 + 1] = 0.1;
                if (y > 3.0) positions[i * 3 + 1] = 3.0;
            }
            
            system.geometry.attributes.position.needsUpdate = true;
        });
        
        // Apply damage to enemies at intervals
        this.lastDamageTime += delta;
        if (this.lastDamageTime >= this.damageInterval) {
            this.applyDamageEffect();
            this.lastDamageTime = 0;
        }
    }
    
    /**
     * Apply damage effect to enemies within the sanctuary
     */
    applyDamageEffect() {
        if (!this.skill.game || !this.skill.game.enemyManager) return;
        
        // Get the sanctuary position
        const sanctuaryPosition = this.effect.position.clone();
        const radius = this.skill.radius || 5;
        
        // Get enemies within the sanctuary radius
        const enemies = this.skill.game.enemyManager.getEnemiesNearPosition(
            sanctuaryPosition,
            radius
        );
        
        // Apply damage to each enemy
        enemies.forEach(enemy => {
            // IMPORTANT: THIS CHECKED BY COLLISIONMANAGER
            // const damage = this.damagePerSecond * this.damageInterval;
            // enemy.takeDamage(damage);
            
            // Create damage visual effect
            this.createDamageVisualEffect(enemy.getPosition());
        });
    }
    
    /**
     * Create a damage visual effect at a position
     * @param {THREE.Vector3} position - Position to create the effect at
     */
    createDamageVisualEffect(position) {
        if (!this.skill.game || !this.skill.game.scene) return;
        
        // Create a burst of fire particles
        const particleCount = 15;
        const particleGeometry = new THREE.BufferGeometry();
        
        // Create particle positions
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        
        // Create fire colors
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
            size: 0.2,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });
        
        const particles = new THREE.Points(particleGeometry, particleMaterial);
        
        // Add to scene
        this.skill.game.scene.add(particles);
        
        // Remove after a short duration
        setTimeout(() => {
            if (this.skill.game && this.skill.game.scene) {
                this.skill.game.scene.remove(particles);
                particleGeometry.dispose();
                particleMaterial.dispose();
            }
        }, 500); // 0.5 seconds
    }
    
    /**
     * Dispose of the effect and clean up resources
     */
    dispose() {
        // Clean up fire effects
        this.fireEffects = [];
        
        // Clean up damage runes
        this.damageRunes = [];
        
        // Clean up wrath particles
        this.wrathParticles = [];
        
        // Call parent dispose
        super.dispose();
    }
}