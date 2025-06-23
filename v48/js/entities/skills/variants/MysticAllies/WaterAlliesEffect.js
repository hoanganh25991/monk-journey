import * as THREE from 'three';
import { MysticAllyEffect } from '../../MysticAllyEffect.js';
import { BleedingEffect } from '../../BleedingEffect.js';

/**
 * Effect for the Water Allies variant of Mystic Allies
 * Summons water spirit allies that heal you and your allies over time
 * Visual style: Blue/cyan allies with water particles and flowing effects
 */
export class WaterAlliesEffect extends MysticAllyEffect {
    constructor(skill) {
        super(skill);
        
        // Variant-specific properties
        this.healingPerSecond = 10; // Healing per second
        this.healingInterval = 1.0; // Apply healing every second
        this.healingRadius = 5.0; // Radius of healing effect
        this.lastHealTime = 0;
        
        // Visual properties
        this.waterParticles = [];
        this.waterEffects = [];
    }

    /**
     * Create the Mystic Ally effect
     * @param {THREE.Group} effectGroup - Group to add the effect to
     * @param {THREE.Vector3} position - Summoning position
     * @param {THREE.Vector3} direction - Direction the summon should face
     * @private
     */
    _createMysticAllyEffect(effectGroup, position, direction) {
        // Call the parent method to create the base ally
        super._createMysticAllyEffect(effectGroup, position, direction);
        
        // Modify the summoning circle colors to water colors
        this._modifySummoningColors(effectGroup);
        
        // Add water particles
        this._addWaterParticles(effectGroup);
        
        // Add water effects
        this._addWaterEffects(effectGroup);
        
        // Store reference to the ally group for later modification
        // The ally group is the second child of the effect group
        if (effectGroup.children.length > 1) {
            const allyGroup = effectGroup.children[1];
            
            // Store a reference to modify the ally when the model is loaded
            this.mysticAllyState = {
                ...this.mysticAllyState,
                allyGroup: allyGroup,
                onModelLoaded: (model) => {
                    this._modifyAllyModel(model);
                }
            };
        }
    }
    
    /**
     * Modify the summoning circle colors to water colors
     * @param {THREE.Group} effectGroup - The effect group to modify
     * @private
     */
    _modifySummoningColors(effectGroup) {
        // Define the water color (blue/cyan)
        const waterColor = new THREE.Color(0x00aaff);
        
        // Get the summoning group (first child of effect group)
        if (effectGroup.children.length > 0) {
            const summoningGroup = effectGroup.children[0];
            
            // Traverse all children and modify materials
            summoningGroup.traverse(child => {
                if (child.material) {
                    // Check if it's a mesh
                    if (child instanceof THREE.Mesh) {
                        // Clone the material to avoid affecting other instances
                        if (Array.isArray(child.material)) {
                            child.material = child.material.map(mat => mat.clone());
                        } else {
                            child.material = child.material.clone();
                        }
                        
                        // Modify the material color and emissive (with safety checks)
                        if (Array.isArray(child.material)) {
                            child.material.forEach(mat => {
                                if (mat && mat.color) {
                                    mat.color.set(waterColor);
                                }
                                if (mat && mat.emissive) {
                                    mat.emissive.set(waterColor);
                                }
                            });
                        } else if (child.material) {
                            if (child.material.color) {
                                child.material.color.set(waterColor);
                            }
                            if (child.material.emissive) {
                                child.material.emissive.set(waterColor);
                            }
                        }
                    }
                }
            });
        }
    }
    
    /**
     * Add water particles to the effect
     * @param {THREE.Group} effectGroup - The effect group to add particles to
     * @private
     */
    _addWaterParticles(effectGroup) {
        // Get the ally group (second child of effect group)
        if (effectGroup.children.length > 1) {
            const allyGroup = effectGroup.children[1];
            
            // Create water particles
            const particleCount = 60;
            const particleGeometry = new THREE.BufferGeometry();
            
            // Create particle positions
            const positions = new Float32Array(particleCount * 3);
            const colors = new Float32Array(particleCount * 3);
            const sizes = new Float32Array(particleCount);
            
            // Create water colors
            const waterColors = [
                new THREE.Color(0x00ffff), // Cyan
                new THREE.Color(0x00aaff), // Light blue
                new THREE.Color(0x0088ff), // Blue
                new THREE.Color(0x66ccff)  // Sky blue
            ];
            
            for (let i = 0; i < particleCount; i++) {
                // Random position around the ally
                const angle = Math.random() * Math.PI * 2;
                const radius = 0.5 + Math.random() * 0.5;
                const height = Math.random() * 2.0;
                
                positions[i * 3] = Math.cos(angle) * radius;
                positions[i * 3 + 1] = height;
                positions[i * 3 + 2] = Math.sin(angle) * radius;
                
                // Random water color
                const colorIndex = Math.floor(Math.random() * waterColors.length);
                const color = waterColors[colorIndex];
                
                colors[i * 3] = color.r;
                colors[i * 3 + 1] = color.g;
                colors[i * 3 + 2] = color.b;
                
                // Size - varied for water particles
                sizes[i] = 0.08 + Math.random() * 0.15;
            }
            
            particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
            particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
            
            // Create particle material
            const particleMaterial = new THREE.PointsMaterial({
                size: 0.15,
                vertexColors: true,
                transparent: true,
                opacity: 0.0, // Start invisible, will be animated
                blending: THREE.AdditiveBlending,
                sizeAttenuation: true
            });
            
            const waterParticleSystem = new THREE.Points(particleGeometry, particleMaterial);
            allyGroup.add(waterParticleSystem);
            
            // Store for animation
            this.waterParticles.push({
                system: waterParticleSystem,
                initialPositions: positions.slice() // Clone the positions array
            });
        }
    }
    
    /**
     * Add water effects to the effect
     * @param {THREE.Group} effectGroup - The effect group to add water effects to
     * @private
     */
    _addWaterEffects(effectGroup) {
        // Get the ally group (second child of effect group)
        if (effectGroup.children.length > 1) {
            const allyGroup = effectGroup.children[1];
            
            // Create flowing water effects
            const waterFlowCount = 3;
            
            for (let i = 0; i < waterFlowCount; i++) {
                // Create a curved path for the water flow
                const curve = this._generateWaterFlowCurve();
                
                // Create geometry from the curve
                const tubeGeometry = new THREE.TubeGeometry(
                    curve,
                    20,         // tubularSegments
                    0.05,       // radius
                    8,          // radialSegments
                    false       // closed
                );
                
                // Create material for the water flow
                const tubeMaterial = new THREE.MeshBasicMaterial({
                    color: 0x00aaff,
                    transparent: true,
                    opacity: 0.0, // Start invisible, will be animated
                    side: THREE.DoubleSide,
                    blending: THREE.AdditiveBlending
                });
                
                // Create the water flow mesh
                const waterFlow = new THREE.Mesh(tubeGeometry, tubeMaterial);
                
                // Position around the ally
                const angle = (i / waterFlowCount) * Math.PI * 2;
                waterFlow.position.set(
                    Math.cos(angle) * 0.3,
                    0.5,
                    Math.sin(angle) * 0.3
                );
                
                // Random rotation for variety
                waterFlow.rotation.x = Math.random() * Math.PI;
                waterFlow.rotation.y = Math.random() * Math.PI;
                waterFlow.rotation.z = Math.random() * Math.PI;
                
                // Store animation data
                waterFlow.userData = {
                    curve: curve,
                    regenerateTime: 1.0 + Math.random() * 1.0,
                    timeRemaining: 1.0 + Math.random() * 1.0
                };
                
                allyGroup.add(waterFlow);
                this.waterEffects.push(waterFlow);
            }
            
            // Create a healing aura
            const auraGeometry = new THREE.RingGeometry(1.8, 2.0, 32);
            const auraMaterial = new THREE.MeshBasicMaterial({
                color: 0x00aaff,
                transparent: true,
                opacity: 0.0, // Start invisible, will be animated
                side: THREE.DoubleSide,
                blending: THREE.AdditiveBlending
            });
            
            const aura = new THREE.Mesh(auraGeometry, auraMaterial);
            aura.rotation.x = -Math.PI / 2; // Lay flat
            aura.position.y = 0.1; // Just above ground
            
            // Store animation data
            aura.userData = {
                pulseSpeed: 0.5,
                rotationSpeed: 0.2
            };
            
            allyGroup.add(aura);
            this.waterEffects.push(aura);
        }
    }
    
    /**
     * Generate a curve for a water flow
     * @returns {THREE.CatmullRomCurve3} - The generated curve
     * @private
     */
    _generateWaterFlowCurve() {
        // Create points for the curve
        const points = [];
        const segmentCount = 8;
        const length = 1.0 + Math.random() * 1.0; // Length between 1.0 and 2.0
        
        // Generate a flowing path
        for (let i = 0; i < segmentCount; i++) {
            const t = i / segmentCount;
            const angle = t * Math.PI * 4; // Two full rotations
            
            // Spiral radius increases with t
            const radius = 0.1 + t * 0.3;
            
            // Position along the path
            const z = t * length;
            
            // Spiral coordinates with some randomness
            const x = Math.cos(angle) * radius + (Math.random() - 0.5) * 0.1;
            const y = Math.sin(angle) * radius + (Math.random() - 0.5) * 0.1;
            
            points.push(new THREE.Vector3(x, y, z));
        }
        
        // Create a smooth curve through the points
        return new THREE.CatmullRomCurve3(points);
    }
    
    /**
     * Modify the ally model to have water-themed appearance
     * @param {THREE.Object3D} model - The loaded ally model
     * @private
     */
    _modifyAllyModel(model) {
        if (!model) return;
        
        // Traverse the model and modify materials
        model.traverse(node => {
            if (node.isMesh) {
                // Create a new water-themed material
                const waterMaterial = new THREE.MeshStandardMaterial({
                    color: 0x00aaff, // Blue base color
                    transparent: true,
                    opacity: 0.0, // Start invisible, will be animated
                    emissive: 0x0088ff, // Blue glow
                    emissiveIntensity: 0.7,
                    side: THREE.DoubleSide
                });
                
                // Apply the new material
                node.material = waterMaterial;
            }
        });
    }
    
    /**
     * Update the Mystic Ally effect
     * @param {number} delta - Time since last update in seconds
     */
    update(delta) {
        // Call the parent method to update the base effect
        super.update(delta);
        
        // Update water particles
        this.waterParticles.forEach(particleData => {
            const system = particleData.system;
            const initialPositions = particleData.initialPositions;
            
            // Fade in during the 'emerging' stage
            if (this.summonStage === 'emerging' || this.summonStage === 'complete') {
                system.material.opacity = Math.min(0.7, system.material.opacity + delta * 1.5);
                
                const positions = system.geometry.attributes.position.array;
                const count = positions.length / 3;
                
                for (let i = 0; i < count; i++) {
                    // Check if initialPositions exists and has enough elements
                    if (!initialPositions || i * 3 + 2 >= initialPositions.length) {
                        continue; // Skip this iteration if data is missing
                    }
                    
                    // Get initial position
                    const x0 = initialPositions[i * 3];
                    const y0 = initialPositions[i * 3 + 1];
                    const z0 = initialPositions[i * 3 + 2];
                    
                    // Calculate distance from center
                    const distance = Math.sqrt(x0 * x0 + z0 * z0);
                    
                    // Flowing movement for water
                    const angle = Math.atan2(z0, x0) + delta * (0.3 + distance * 0.2);
                    
                    // Update position with flowing motion
                    positions[i * 3] = Math.cos(angle) * distance;
                    positions[i * 3 + 2] = Math.sin(angle) * distance;
                    
                    // Gentle vertical movement
                    positions[i * 3 + 1] = y0 + Math.sin(this.elapsedTime + i * 0.1) * delta * 0.5;
                    
                    // Keep particles within bounds
                    if (positions[i * 3 + 1] < 0) positions[i * 3 + 1] = 0;
                    if (positions[i * 3 + 1] > 2.0) positions[i * 3 + 1] = 2.0;
                }
                
                system.geometry.attributes.position.needsUpdate = true;
            }
        });
        
        // Update water effects
        this.waterEffects.forEach(effect => {
            // Fade in during the 'emerging' stage
            if (this.summonStage === 'emerging' || this.summonStage === 'complete') {
                effect.material.opacity = Math.min(0.7, effect.material.opacity + delta * 1.5);
                
                // Handle water flows
                if (effect.userData.curve) {
                    effect.userData.timeRemaining -= delta;
                    
                    // Regenerate the water flow path periodically
                    if (effect.userData.timeRemaining <= 0) {
                        // Generate new path
                        const newCurve = this._generateWaterFlowCurve();
                        
                        // Update the geometry
                        effect.geometry.dispose();
                        effect.geometry = new THREE.TubeGeometry(
                            newCurve,
                            20,         // tubularSegments
                            0.05,       // radius
                            8,          // radialSegments
                            false       // closed
                        );
                        
                        // Reset timer
                        effect.userData.timeRemaining = effect.userData.regenerateTime;
                        effect.userData.curve = newCurve;
                    }
                }
                
                // Handle healing aura
                if (effect.geometry instanceof THREE.RingGeometry) {
                    // Rotate the aura
                    effect.rotation.z += effect.userData.rotationSpeed * delta;
                    
                    // Pulse the aura
                    const pulseScale = 1.0 + 0.2 * Math.sin(this.elapsedTime * effect.userData.pulseSpeed);
                    effect.scale.set(pulseScale, pulseScale, pulseScale);
                }
            }
        });
        
        // Update the hero model if it's loaded
        if (this.heroModel) {
            this.heroModel.traverse(node => {
                if (node.isMesh && node.material) {
                    // Fade in during the 'emerging' stage
                    if (this.summonStage === 'emerging' || this.summonStage === 'complete') {
                        node.material.opacity = Math.min(0.6, node.material.opacity + delta * 1.5);
                        
                        // Pulsing emissive intensity
                        if (node.material.emissiveIntensity !== undefined) {
                            node.material.emissiveIntensity = 0.5 + Math.sin(this.elapsedTime * 1.5) * 0.2;
                        }
                    }
                }
            });
        }
        
        // Apply healing at intervals when the ally is fully summoned
        if (this.summonStage === 'complete') {
            this.lastHealTime += delta;
            if (this.lastHealTime >= this.healingInterval) {
                this.applyHealingEffect();
                this.lastHealTime = 0;
            }
        }
    }
    
    /**
     * Apply healing effect to player and allies
     */
    applyHealingEffect() {
        if (!this.skill.game) return;
        
        // Get the ally position
        const allyPosition = this.effect.position.clone();
        
        // Heal the player if within radius
        const player = this.skill.game.player;
        if (player && player.stats && player.getPosition) {
            const playerPosition = player.getPosition();
            const distance = playerPosition.distanceTo(allyPosition);
            
            if (distance <= this.healingRadius) {
                // Apply healing
                const healAmount = this.healingPerSecond * this.healingInterval;
                player.stats.heal(healAmount);
                
                // Create healing visual effect
                this.createHealingVisualEffect(playerPosition);
            }
        }
        
        // TODO: Heal allies when ally system is implemented
        
        // Create a healing pulse at the ally position
        this.createHealingPulse(allyPosition);
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
        
        // Use the bleeding effect with blue color for healing
        const healEffect = new BleedingEffect({
            amount: this.healingPerSecond * this.healingInterval,
            duration: 1.5,
            isPlayerDamage: false,
            color: 0x00aaff // Blue for water healing
        });
        
        // Create and add the effect to the scene
        const effectGroup = healEffect.create(healPosition, new THREE.Vector3(0, 1, 0));
        this.skill.game.scene.add(effectGroup);
        
        // Add to effects manager for updates
        this.skill.game.effectsManager.effects.push(healEffect);
    }
    
    /**
     * Create a healing pulse at a position
     * @param {THREE.Vector3} position - Position to create the pulse at
     */
    createHealingPulse(position) {
        if (!this.skill.game || !this.skill.game.scene) return;
        
        // Create a ring geometry for the pulse
        const ringGeometry = new THREE.RingGeometry(0.1, 0.2, 32);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0x00aaff, // Blue
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
            maxRadius: this.healingRadius,
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
        // Clean up water particles
        this.waterParticles = [];
        
        // Clean up water effects
        this.waterEffects = [];
        
        // Call parent dispose
        super.dispose();
    }
}