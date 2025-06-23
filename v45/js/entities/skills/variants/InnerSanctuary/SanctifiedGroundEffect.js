import * as THREE from 'three';
import { InnerSanctuaryEffect } from '../../InnerSanctuaryEffect.js';
import { BleedingEffect } from '../../BleedingEffect.js';

/**
 * Effect for the Sanctified Ground variant of Inner Sanctuary
 * The sanctuary heals allies over time while they remain within its bounds
 * Visual style: Golden/white sanctuary with healing runes and light beams
 */
export class SanctifiedGroundEffect extends InnerSanctuaryEffect {
    constructor(skill) {
        super(skill);
        
        // Variant-specific properties
        this.healingPerSecond = 10; // Amount of healing per second
        this.healingInterval = 1.0; // Apply healing every second
        this.lastHealTime = 0;
        
        // Visual properties
        this.healingRunes = [];
        this.healingBeams = [];
        this.healingParticles = [];
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
        
        // Modify the base sanctuary colors to golden/white
        this._modifySanctuaryColors(sanctuaryGroup);
        
        // Add healing runes
        this._addHealingRunes(sanctuaryGroup);
        
        // Add healing beams
        this._addHealingBeams(sanctuaryGroup);
        
        // Add healing particles
        this._addHealingParticles(sanctuaryGroup);
    }
    
    /**
     * Modify the sanctuary colors to golden/white
     * @param {THREE.Group} sanctuaryGroup - The sanctuary group to modify
     * @private
     */
    _modifySanctuaryColors(sanctuaryGroup) {
        // Define the healing color (golden)
        const healingColor = new THREE.Color(0xffdd88);
        
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
                            mat.color.set(healingColor);
                            mat.emissive.set(healingColor);
                        });
                    } else {
                        child.material.color.set(healingColor);
                        child.material.emissive.set(healingColor);
                    }
                }
            }
        });
    }
    
    /**
     * Add healing runes to the sanctuary
     * @param {THREE.Group} sanctuaryGroup - The sanctuary group to add runes to
     * @private
     */
    _addHealingRunes(sanctuaryGroup) {
        const baseRadius = this.skill.radius || 5;
        const runeCount = 4;
        
        for (let i = 0; i < runeCount; i++) {
            const angle = (i / runeCount) * Math.PI * 2;
            const runeRadius = baseRadius * 0.7;
            
            // Create a healing rune
            const runeGeometry = new THREE.PlaneGeometry(1.2, 1.2);
            const runeMaterial = new THREE.MeshBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.9,
                side: THREE.DoubleSide,
                blending: THREE.AdditiveBlending
            });
            
            const rune = new THREE.Mesh(runeGeometry, runeMaterial);
            
            // Position rune
            rune.position.set(
                Math.cos(angle) * runeRadius,
                0.2, // Hover above ground
                Math.sin(angle) * runeRadius
            );
            
            // Rotate rune to lay flat
            rune.rotation.x = -Math.PI / 2;
            
            // Store animation data
            rune.userData = {
                initialY: rune.position.y,
                pulseSpeed: 0.8 + Math.random() * 0.4,
                rotationSpeed: 0.2 + Math.random() * 0.3
            };
            
            sanctuaryGroup.add(rune);
            this.healingRunes.push(rune);
        }
    }
    
    /**
     * Add healing beams to the sanctuary
     * @param {THREE.Group} sanctuaryGroup - The sanctuary group to add beams to
     * @private
     */
    _addHealingBeams(sanctuaryGroup) {
        const baseRadius = this.skill.radius || 5;
        const beamCount = 3;
        
        for (let i = 0; i < beamCount; i++) {
            const angle = (i / beamCount) * Math.PI * 2;
            const beamRadius = baseRadius * 0.5;
            
            // Create a healing beam
            const beamHeight = 3.0 + Math.random() * 2.0;
            const beamGeometry = new THREE.CylinderGeometry(0.1, 0.3, beamHeight, 8);
            const beamMaterial = new THREE.MeshBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.6,
                blending: THREE.AdditiveBlending
            });
            
            const beam = new THREE.Mesh(beamGeometry, beamMaterial);
            
            // Position beam
            beam.position.set(
                Math.cos(angle) * beamRadius,
                beamHeight / 2, // Half height above ground
                Math.sin(angle) * beamRadius
            );
            
            // Store animation data
            beam.userData = {
                initialHeight: beamHeight,
                pulseSpeed: 0.5 + Math.random() * 0.5,
                initialOpacity: 0.6,
                fadeSpeed: 0.3 + Math.random() * 0.3
            };
            
            sanctuaryGroup.add(beam);
            this.healingBeams.push(beam);
        }
    }
    
    /**
     * Add healing particles to the sanctuary
     * @param {THREE.Group} sanctuaryGroup - The sanctuary group to add particles to
     * @private
     */
    _addHealingParticles(sanctuaryGroup) {
        const baseRadius = this.skill.radius || 5;
        const particleCount = 50;
        const particleGeometry = new THREE.BufferGeometry();
        
        // Create particle positions
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        
        // Create healing colors
        const healingColors = [
            new THREE.Color(0xffffff), // White
            new THREE.Color(0xffffcc), // Pale yellow
            new THREE.Color(0xffdd88), // Golden
            new THREE.Color(0xffcc66)  // Amber
        ];
        
        for (let i = 0; i < particleCount; i++) {
            // Random position within the sanctuary
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * baseRadius * 0.9;
            const height = 0.1 + Math.random() * 2.0;
            
            positions[i * 3] = Math.cos(angle) * radius;
            positions[i * 3 + 1] = height;
            positions[i * 3 + 2] = Math.sin(angle) * radius;
            
            // Random healing color
            const colorIndex = Math.floor(Math.random() * healingColors.length);
            const color = healingColors[colorIndex];
            
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;
            
            // Size - varied for healing particles
            sizes[i] = 0.1 + Math.random() * 0.2;
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
        
        const healingParticleSystem = new THREE.Points(particleGeometry, particleMaterial);
        sanctuaryGroup.add(healingParticleSystem);
        
        // Store for animation
        this.healingParticles.push({
            system: healingParticleSystem,
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
        
        // Update healing runes
        this.healingRunes.forEach(rune => {
            // Rotate the rune
            rune.rotation.z += rune.userData.rotationSpeed * delta;
            
            // Pulse the rune
            const pulseScale = 1.0 + 0.2 * Math.sin(this.elapsedTime * rune.userData.pulseSpeed);
            rune.scale.set(pulseScale, pulseScale, pulseScale);
            
            // Float the rune up and down
            rune.position.y = rune.userData.initialY + 
                0.1 * Math.sin(this.elapsedTime * 0.5 + rune.userData.pulseSpeed);
        });
        
        // Update healing beams
        this.healingBeams.forEach(beam => {
            // Pulse the beam height
            const heightScale = 1.0 + 0.15 * Math.sin(this.elapsedTime * beam.userData.pulseSpeed);
            const newHeight = beam.userData.initialHeight * heightScale;
            
            // Update the geometry
            beam.geometry.dispose();
            beam.geometry = new THREE.CylinderGeometry(0.1, 0.3, newHeight, 8);
            
            // Update position to keep the bottom at ground level
            beam.position.y = newHeight / 2;
            
            // Pulse opacity
            beam.material.opacity = beam.userData.initialOpacity + 
                0.2 * Math.sin(this.elapsedTime * beam.userData.fadeSpeed);
        });
        
        // Update healing particles
        this.healingParticles.forEach(particleData => {
            const system = particleData.system;
            const initialPositions = particleData.initialPositions;
            const positions = system.geometry.attributes.position.array;
            const count = positions.length / 3;
            
            for (let i = 0; i < count; i++) {
                // Get initial position
                const x0 = initialPositions[i * 3];
                const y0 = initialPositions[i * 3 + 1];
                const z0 = initialPositions[i * 3 + 2];
                
                // Calculate distance from center
                const distance = Math.sqrt(x0 * x0 + z0 * z0);
                
                // Spiral movement
                const angle = Math.atan2(z0, x0) + delta * (0.2 + distance * 0.1);
                const radius = distance;
                
                // Update position
                positions[i * 3] = Math.cos(angle) * radius;
                positions[i * 3 + 2] = Math.sin(angle) * radius;
                
                // Rising movement
                positions[i * 3 + 1] = y0 + Math.sin(this.elapsedTime + i * 0.1) * 0.2;
                
                // Reset particles that rise too high
                if (positions[i * 3 + 1] > 3.0) {
                    positions[i * 3 + 1] = 0.1;
                }
            }
            
            system.geometry.attributes.position.needsUpdate = true;
        });
        
        // Apply healing effect at intervals
        this.lastHealTime += delta;
        if (this.lastHealTime >= this.healingInterval) {
            this.applyHealingEffect();
            this.lastHealTime = 0;
        }
    }
    
    /**
     * Apply healing effect to player and allies within the sanctuary
     */
    applyHealingEffect() {
        if (!this.skill.game) return;
        
        // Get the sanctuary position
        const sanctuaryPosition = this.effect.position.clone();
        const radius = this.skill.radius || 5;
        
        // Heal the player if within radius
        const player = this.skill.game.player;
        if (player && player.stats && player.getPosition) {
            const playerPosition = player.getPosition();
            const distance = playerPosition.distanceTo(sanctuaryPosition);
            
            if (distance <= radius) {
                // Apply healing
                const healAmount = this.healingPerSecond * this.healingInterval;
                player.stats.heal(healAmount);
                
                // Create healing visual effect
                this.createHealingVisualEffect(playerPosition);
            }
        }
        
        // TODO: Heal allies when ally system is implemented
        // For now, we'll just create a healing pulse at the sanctuary center
        this.createHealingPulse(sanctuaryPosition);
    }
    
    /**
     * Create a healing visual effect at a position
     * @param {THREE.Vector3} position - Position to create the effect at
     */
    createHealingVisualEffect(position) {
        if (!this.skill.game || !this.skill.game.effectsManager) return;
        
        // Create a position slightly above the target
        const healPosition = new THREE.Vector3(
            position.x,
            position.y + 2,
            position.z
        );
        
        // Use the bleeding effect with golden color for healing
        const healEffect = new BleedingEffect({
            amount: this.healingPerSecond * this.healingInterval,
            duration: 1.5,
            isPlayerDamage: false,
            color: 0xffdd88 // Golden for healing
        });
        
        // Create and add the effect to the scene
        const effectGroup = healEffect.create(healPosition, new THREE.Vector3(0, 1, 0));
        this.skill.game.scene.add(effectGroup);
        
        // Add to effects manager for updates
        this.skill.game.effectsManager.effects.push(healEffect);
    }
    
    /**
     * Create a healing pulse at the sanctuary center
     * @param {THREE.Vector3} position - Position to create the pulse at
     */
    createHealingPulse(position) {
        if (!this.skill.game || !this.skill.game.scene) return;
        
        // Create a ring geometry for the pulse
        const radius = this.skill.radius || 5;
        const ringGeometry = new THREE.RingGeometry(0.1, 0.2, 32);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0xffdd88, // Golden
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending
        });
        
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.position.copy(position);
        ring.position.y += 0.1; // Slightly above ground
        ring.rotation.x = Math.PI / 2; // Lay flat
        
        // Store initial creation time for animation
        ring.userData = {
            creationTime: this.elapsedTime,
            maxRadius: radius,
            duration: 1.0 // Duration of the pulse expansion
        };
        
        // Add to scene
        this.skill.game.scene.add(ring);
        
        // Animate and remove the pulse
        const animatePulse = () => {
            if (!this.skill.game || !this.skill.game.scene) return;
            
            const age = this.elapsedTime - ring.userData.creationTime;
            const progress = Math.min(1.0, age / ring.userData.duration);
            
            // Expand the ring
            const currentRadius = progress * ring.userData.maxRadius;
            
            // Update the geometry
            if (ring.geometry) {
                ring.geometry.dispose();
            }
            ring.geometry = new THREE.RingGeometry(
                currentRadius - 0.1,
                currentRadius,
                32
            );
            
            // Fade out as it expands
            ring.material.opacity = 0.8 * (1 - progress);
            
            // Remove when complete
            if (progress >= 1.0) {
                this.skill.game.scene.remove(ring);
                ring.geometry.dispose();
                ring.material.dispose();
            } else {
                // Continue animation in the next frame
                requestAnimationFrame(animatePulse);
            }
        };
        
        // Start the animation
        animatePulse();
    }
    
    /**
     * Dispose of the effect and clean up resources
     */
    dispose() {
        // Clean up healing runes
        this.healingRunes = [];
        
        // Clean up healing beams
        this.healingBeams = [];
        
        // Clean up healing particles
        this.healingParticles = [];
        
        // Call parent dispose
        super.dispose();
    }
}