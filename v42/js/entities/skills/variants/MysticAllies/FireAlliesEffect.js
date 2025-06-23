import * as THREE from 'three';
import { MysticAllyEffect } from '../../MysticAllyEffect.js';

/**
 * Effect for the Fire Allies variant of Mystic Allies
 * Summons fiery spirit allies that deal fire damage and have a chance to burn enemies over time
 * Visual style: Red/orange allies with fire particles and flame effects
 */
export class FireAlliesEffect extends MysticAllyEffect {
    constructor(skill) {
        super(skill);
        
        // Variant-specific properties
        this.fireDamageMultiplier = 1.3; // 30% more damage
        this.burnChance = 0.3; // 30% chance to burn enemies
        this.burnDuration = 3; // 3 seconds of burn
        this.burnDamagePerSecond = 10; // Burn damage per second
        
        // Visual properties
        this.fireParticles = [];
        this.flameEffects = [];
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
        
        // Modify the summoning circle colors to fire colors
        this._modifySummoningColors(effectGroup);
        
        // Add fire particles
        this._addFireParticles(effectGroup);
        
        // Add flame effects
        this._addFlameEffects(effectGroup);
        
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
     * Modify the summoning circle colors to fire colors
     * @param {THREE.Group} effectGroup - The effect group to modify
     * @private
     */
    _modifySummoningColors(effectGroup) {
        // Define the fire color (orange/red)
        const fireColor = new THREE.Color(0xff6600);
        
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
                        
                        // Modify the material color and emissive
                        if (Array.isArray(child.material)) {
                            child.material.forEach(mat => {
                                mat.color.set(fireColor);
                                // Check if the material has an emissive property before setting it
                                if (mat.emissive !== undefined) {
                                    mat.emissive.set(fireColor);
                                }
                            });
                        } else {
                            child.material.color.set(fireColor);
                            // Check if the material has an emissive property before setting it
                            if (child.material.emissive !== undefined) {
                                child.material.emissive.set(fireColor);
                            }
                        }
                    }
                }
            });
        }
    }
    
    /**
     * Add fire particles to the effect
     * @param {THREE.Group} effectGroup - The effect group to add particles to
     * @private
     */
    _addFireParticles(effectGroup) {
        // Get the ally group (second child of effect group)
        if (effectGroup.children.length > 1) {
            const allyGroup = effectGroup.children[1];
            
            // Create fire particles
            const particleCount = 50;
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
            
            for (let i = 0; i < particleCount; i++) {
                // Random position around the ally
                const angle = Math.random() * Math.PI * 2;
                const radius = 0.5 + Math.random() * 0.5;
                const height = Math.random() * 2.0;
                
                positions[i * 3] = Math.cos(angle) * radius;
                positions[i * 3 + 1] = height;
                positions[i * 3 + 2] = Math.sin(angle) * radius;
                
                // Random fire color
                const colorIndex = Math.floor(Math.random() * fireColors.length);
                const color = fireColors[colorIndex];
                
                colors[i * 3] = color.r;
                colors[i * 3 + 1] = color.g;
                colors[i * 3 + 2] = color.b;
                
                // Size - varied for fire particles
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
                opacity: 0.0, // Start invisible, will be animated
                blending: THREE.AdditiveBlending,
                sizeAttenuation: true
            });
            
            const fireParticleSystem = new THREE.Points(particleGeometry, particleMaterial);
            allyGroup.add(fireParticleSystem);
            
            // Store for animation
            this.fireParticles.push({
                system: fireParticleSystem,
                initialPositions: positions.slice() // Clone the positions array
            });
        }
    }
    
    /**
     * Add flame effects to the effect
     * @param {THREE.Group} effectGroup - The effect group to add flames to
     * @private
     */
    _addFlameEffects(effectGroup) {
        // Get the ally group (second child of effect group)
        if (effectGroup.children.length > 1) {
            const allyGroup = effectGroup.children[1];
            
            // Create flame effects at key points (hands, feet, head)
            const flamePositions = [
                new THREE.Vector3(0, 1.7, 0), // Head
                new THREE.Vector3(0.4, 1.0, 0), // Right hand
                new THREE.Vector3(-0.4, 1.0, 0), // Left hand
                new THREE.Vector3(0.2, 0.1, 0), // Right foot
                new THREE.Vector3(-0.2, 0.1, 0) // Left foot
            ];
            
            flamePositions.forEach(position => {
                // Create a flame using cone geometry
                const flameHeight = 0.3 + Math.random() * 0.2;
                const flameRadius = 0.1 + Math.random() * 0.1;
                
                const flameGeometry = new THREE.ConeGeometry(flameRadius, flameHeight, 8);
                const flameMaterial = new THREE.MeshBasicMaterial({
                    color: 0xff6600,
                    transparent: true,
                    opacity: 0.0, // Start invisible, will be animated
                    blending: THREE.AdditiveBlending
                });
                
                const flame = new THREE.Mesh(flameGeometry, flameMaterial);
                
                // Position flame
                flame.position.copy(position);
                
                // Rotate flame to point upward
                flame.rotation.x = Math.PI;
                
                // Store animation data
                flame.userData = {
                    initialScale: new THREE.Vector3(1, 1, 1),
                    pulseSpeed: 0.5 + Math.random() * 1.0,
                    flickerSpeed: 0.8 + Math.random() * 1.2
                };
                
                allyGroup.add(flame);
                this.flameEffects.push(flame);
            });
        }
    }
    
    /**
     * Modify the ally model to have fire-themed appearance
     * @param {THREE.Object3D} model - The loaded ally model
     * @private
     */
    _modifyAllyModel(model) {
        if (!model) return;
        
        // Traverse the model and modify materials
        model.traverse(node => {
            if (node.isMesh) {
                // Create a new fire-themed material
                const fireMaterial = new THREE.MeshStandardMaterial({
                    color: 0xff6600, // Orange base color
                    transparent: true,
                    opacity: 0.0, // Start invisible, will be animated
                    emissive: 0xff3300, // Red-orange glow
                    emissiveIntensity: 0.7,
                    side: THREE.DoubleSide
                });
                
                // Apply the new material
                node.material = fireMaterial;
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
        
        // Update fire particles
        this.fireParticles.forEach(particleData => {
            const system = particleData.system;
            const initialPositions = particleData.initialPositions;
            
            // Fade in during the 'emerging' stage
            if (this.summonStage === 'emerging' || this.summonStage === 'complete') {
                system.material.opacity = Math.min(0.8, system.material.opacity + delta * 2);
                
                const positions = system.geometry.attributes.position.array;
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
                
                system.geometry.attributes.position.needsUpdate = true;
            }
        });
        
        // Update flame effects
        this.flameEffects.forEach(flame => {
            // Fade in during the 'emerging' stage
            if (this.summonStage === 'emerging' || this.summonStage === 'complete') {
                flame.material.opacity = Math.min(0.8, flame.material.opacity + delta * 2);
                
                // Flickering animation
                const flicker = 0.8 + Math.sin(this.elapsedTime * flame.userData.flickerSpeed) * 0.2;
                
                // Pulsing animation
                const pulse = 1.0 + Math.sin(this.elapsedTime * flame.userData.pulseSpeed) * 0.3;
                
                // Apply combined animation
                flame.scale.set(
                    flame.userData.initialScale.x * flicker,
                    flame.userData.initialScale.y * pulse,
                    flame.userData.initialScale.z * flicker
                );
            }
        });
        
        // Update the hero model if it's loaded
        if (this.heroModel) {
            this.heroModel.traverse(node => {
                if (node.isMesh && node.material) {
                    // Fade in during the 'emerging' stage
                    if (this.summonStage === 'emerging' || this.summonStage === 'complete') {
                        node.material.opacity = Math.min(0.7, node.material.opacity + delta * 1.5);
                        
                        // Pulsing emissive intensity
                        if (node.material.emissiveIntensity !== undefined) {
                            node.material.emissiveIntensity = 0.5 + Math.sin(this.elapsedTime * 2) * 0.2;
                        }
                    }
                }
            });
        }
    }
    
    /**
     * Apply damage to an enemy
     * @param {Enemy} enemy - The enemy to damage
     * @param {number} baseDamage - The base damage amount
     */
    applyDamage(enemy, baseDamage) {
        // IMPORTANT: THIS CHECKED BY COLLISIONMANAGER
        // Apply increased damage
        // const damage = baseDamage * this.fireDamageMultiplier;
        // enemy.takeDamage(damage);
        
        // Chance to apply burn effect
        if (Math.random() < this.burnChance) {
            this.applyBurnEffect(enemy);
        }
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
                source: 'FireAllies',
                // Apply burn damage over time
                onTick: (delta) => {
                    // IMPORTANT: THIS CHECKED BY COLLISIONMANAGER
                    // const damage = this.burnDamagePerSecond * delta;
                    // enemy.takeDamage(damage);
                    
                    // Create a fire damage visual effect
                    this.createFireDamageEffect(enemy.getPosition());
                }
            });
        }
    }
    
    /**
     * Create a fire damage visual effect
     * @param {THREE.Vector3} position - Position to create the effect at
     */
    createFireDamageEffect(position) {
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
        // Clean up fire particles
        this.fireParticles = [];
        
        // Clean up flame effects
        this.flameEffects = [];
        
        // Call parent dispose
        super.dispose();
    }
}