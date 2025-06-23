import * as THREE from 'three';
import { SkillEffect } from './SkillEffect.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

/**
 * Specialized effect for Flying Dragon skill
 */
export class FlyingDragonEffect extends SkillEffect {
    // Static property to store the preloaded dragon model
    static dragonModel = null;
    
    /**
     * Preload the Flying Dragon model to avoid loading it at runtime
     * @returns {Promise} - Promise that resolves when the model is loaded
     */
    static preloadModel() {
        return new Promise((resolve, reject) => {
            if (FlyingDragonEffect.dragonModel) {
                console.debug('Flying Dragon model already preloaded');
                resolve(FlyingDragonEffect.dragonModel);
                return;
            }
            
            console.debug('Preloading Flying Dragon model...');
            // Create and configure Draco loader
            const dracoLoader = new DRACOLoader();
            dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
            dracoLoader.setDecoderConfig({ type: 'js' }); // Use JavaScript decoder for compatibility
            
            // Create GLTFLoader and set the Draco loader
            const loader = new GLTFLoader();
            loader.setDRACOLoader(dracoLoader);
            
            loader.load('assets/effects/flying-dragon.glb', 
                (gltf) => {
                    console.debug('Flying Dragon model preloaded successfully');
                    FlyingDragonEffect.dragonModel = gltf.scene.clone();
                    resolve(FlyingDragonEffect.dragonModel);
                },
                (xhr) => {
                    console.debug(`Flying Dragon model ${(xhr.loaded / xhr.total * 100)}% preloaded`);
                },
                (error) => {
                    console.error('Error preloading Flying Dragon model:', error);
                    reject(error);
                }
            );
        });
    }
    constructor(skill) {
        super(skill);
        this.flightSpeed = skill.flightSpeed; // Units per second
        this.initialPosition = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        this.distanceTraveled = 0;
        this.kickCount = 0;
        this.maxKicks = 10; // Number of kicks to perform
        this.kickInterval = 0.3; // Time between kicks
        this.timeSinceLastKick = 0;
        this.radius = skill.radius || 5;
    }

    /**
     * Create a Flying Dragon effect
     * @param {THREE.Vector3} position - Starting position
     * @param {THREE.Vector3} direction - Direction to travel
     * @returns {THREE.Group} - The created effect
     */
    create(position, direction) {
        position = position.clone();
        // position.y -= 3.0;
        // Create a group for the effect
        const effectGroup = new THREE.Group();
        
        // Store initial position and direction for movement
        this.initialPosition.copy(position);
        this.direction.copy(direction);
        this.distanceTraveled = 0;
        this.kickCount = 0;
        this.timeSinceLastKick = 0;
        
        // Create the Flying Dragon effect
        this.createFlyingDragonEffect(effectGroup);
        
        // Position effect
        effectGroup.position.copy(position);
        effectGroup.rotation.y = Math.atan2(direction.x, direction.z);
        
        // Store effect
        this.effect = effectGroup;
        this.isActive = true;
        
        return effectGroup;
    }

    /**
     * Create the Flying Dragon special effect
     * @param {THREE.Group} effectGroup - Group to add the effect to
     * @private
     */
    createFlyingDragonEffect(effectGroup) {
        // Create dragon model group
        const dragonGroup = new THREE.Group();
        
        // Clone the preloaded model to avoid modifying the original
        const dragonModel = FlyingDragonEffect.dragonModel.clone();
        
        // Apply transparent materials to all meshes in the model
        dragonModel.traverse((child) => {
            if (child.isMesh) {
                // Store the original material for reference if needed
                child.userData.originalMaterial = child.material;
                
                // Create a new material that preserves the original texture but adds transparency
                const transparentMaterial = child.material.clone();
                
                // Apply skill color as a tint while keeping the texture
                transparentMaterial.transparent = true;
                transparentMaterial.opacity = 0.7;
                
                // Apply color tint if skill has a color
                if (this.skill.color) {
                    transparentMaterial.color = new THREE.Color(this.skill.color);
                    transparentMaterial.emissive = new THREE.Color(this.skill.color);
                    transparentMaterial.emissiveIntensity = 1.5;
                }
                
                // Apply our modified material
                child.material = transparentMaterial;
            }
        });
        
        // Add the model to the group
        dragonGroup.add(dragonModel);
        
        // Scale the model appropriately
        const scale = this.radius; // Adjust scale as needed for the model
        dragonModel.scale.set(scale, scale, scale);
        
        // Create energy particles around the dragon
        const particleCount = 30;
        const particles = [];
        
        for (let i = 0; i < particleCount; i++) {
            // Random position around the dragon
            const angle = Math.random() * Math.PI * 2;
            const radius = 0.5 + Math.random() * 1.0;
            const height = (Math.random() * 3) - 1.5;
            
            // Create particle
            const particleSize = 0.05 + Math.random() * 0.1;
            const particleGeometry = new THREE.SphereGeometry(particleSize, 8, 8);
            const particleMaterial = new THREE.MeshStandardMaterial({
                transparent: true,
                opacity: 0.7 + Math.random() * 0.3
            });
            
            // Apply color if skill has one, otherwise use default
            if (this.skill.color) {
                particleMaterial.color = new THREE.Color(this.skill.color);
                particleMaterial.emissive = new THREE.Color(this.skill.color);
                particleMaterial.emissiveIntensity = 2;
            } else {
                particleMaterial.color = new THREE.Color(0xff6600);
                particleMaterial.emissive = new THREE.Color(0xff6600);
                particleMaterial.emissiveIntensity = 2;
            }
            
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            particle.position.set(
                Math.cos(angle) * radius,
                height,
                Math.sin(angle) * radius
            );
            
            // Store animation data
            particle.userData = {
                initialPos: particle.position.clone(),
                speed: 0.5 + Math.random() * 1.5,
                direction: new THREE.Vector3(
                    Math.random() * 2 - 1,
                    Math.random() * 2 - 1,
                    Math.random() * 2 - 1
                ).normalize()
            };
            
            dragonGroup.add(particle);
            particles.push(particle);
        }
        
        // Create kick effect (initially hidden)
        const kickGroup = new THREE.Group();
        kickGroup.visible = false;
        
        // Create kick energy wave
        const kickWaveGeometry = new THREE.CylinderGeometry(0, 1.5, 2, 8);
        const kickWaveMaterial = new THREE.MeshStandardMaterial({
            transparent: true,
            opacity: 0.7,
            side: THREE.DoubleSide
        });
        
        // Apply color if skill has one, otherwise use default
        if (this.skill.color) {
            kickWaveMaterial.color = new THREE.Color(this.skill.color);
            kickWaveMaterial.emissive = new THREE.Color(this.skill.color);
            kickWaveMaterial.emissiveIntensity = 2;
        } else {
            kickWaveMaterial.color = new THREE.Color(0xff6600);
            kickWaveMaterial.emissive = new THREE.Color(0xff6600);
            kickWaveMaterial.emissiveIntensity = 2;
        }
        
        const kickWave = new THREE.Mesh(kickWaveGeometry, kickWaveMaterial);
        kickWave.rotation.x = Math.PI / 2;
        kickGroup.add(kickWave);
        
        // Add the groups to the effect group
        effectGroup.add(dragonGroup);
        effectGroup.add(kickGroup);
        
        // Store animation state
        this.dragonState = {
            dragonGroup: dragonGroup,
            kickGroup: kickGroup,
            particles: particles,
            phase: 'rising', // 'rising', 'kicking', 'descending'
            height: 0,
            maxHeight: 0.1, // Maximum height to rise
            kicksPerformed: 0
        };
    }

    /**
     * Update the Flying Dragon effect
     * @param {number} delta - Time since last update in seconds
     */
    update(delta) {
        if (!this.isActive || !this.effect) return;
        
        this.elapsedTime += delta;
        this.timeSinceLastKick += delta;
        
        // Check if effect has expired
        if (this.elapsedTime >= this.skill.duration) {
            this.isActive = false;
            this.dispose();
            return;
        }
        
        // Move forward
        const moveDistance = this.flightSpeed * delta;
        this.effect.position.x += this.direction.x * moveDistance;
        this.effect.position.z += this.direction.z * moveDistance;
        
        // IMPORTANT: Update the skill's position property to match the effect's position
        this.skill.position.copy(this.effect.position);
        
        // Update distance traveled
        this.distanceTraveled += moveDistance;
        
        this.updateFlyingDragonEffect(delta);
    }

    /**
     * Update the Flying Dragon special effect
     * @param {number} delta - Time since last update in seconds
     * @private
     */
    updateFlyingDragonEffect(delta) {
        if (!this.dragonState) return;
        
        const { dragonGroup, kickGroup, particles, phase } = this.dragonState;
        
        // Update dragon flight animation based on phase
        switch (phase) {
            case 'rising':
                // Rise up to maximum height
                this.dragonState.height += delta;
                this.effect.position.y = this.initialPosition.y + this.dragonState.height;
                
                // Transition to kicking phase when max height is reached
                if (this.dragonState.height >= this.dragonState.maxHeight) {
                    this.dragonState.phase = 'kicking';
                }
                break;
                
            case 'kicking':
                // Perform kicks at intervals
                if (this.timeSinceLastKick >= this.kickInterval && this.kickCount < this.maxKicks) {
                    this.performKick();
                    this.timeSinceLastKick = 0;
                    this.kickCount++;
                    this.dragonState.kicksPerformed++;
                }
                
                // Transition to descending phase after all kicks
                if (this.dragonState.kicksPerformed >= this.maxKicks) {
                    this.dragonState.phase = 'descending';
                }
                break;
                
            case 'descending':
                // Descend back to ground
                this.dragonState.height -= delta * 5;
                this.effect.position.y = this.initialPosition.y + Math.max(0, this.dragonState.height);
                
                // End effect when reaching ground
                if (this.dragonState.height <= 0) {
                    this.isActive = false;
                }
                break;
        }
        
        // Animate dragon model
        if (dragonGroup) {
            // Rotate the dragon model
            // dragonGroup.rotation.y += delta * 2;
            
            // Find the actual model in the group (first child)
            const model = dragonGroup.children.find(child => child.isObject3D && !child.isMesh);
            if (model) {
                // Add subtle floating motion
                model.position.y = Math.sin(this.elapsedTime * 2) * 0.1;
                
                // Add subtle scale pulsing
                const pulseScale = this.radius + 0.05 * Math.sin(this.elapsedTime * 3);
                model.scale.set(pulseScale, pulseScale, pulseScale);
                
                // Update material opacity for pulsing effect
                model.traverse(child => {
                    if (child.isMesh && child.material) {
                        // Ensure material is set to transparent
                        child.material.transparent = true;
                        // Apply pulsing opacity
                        child.material.opacity = 0.7 + 0.2 * Math.sin(this.elapsedTime * 2);
                    }
                });
            }
        }
        
        // Animate particles
        for (const particle of particles) {
            if (particle.userData) {
                const initialPos = particle.userData.initialPos;
                const speed = particle.userData.speed;
                const direction = particle.userData.direction;
                
                // Oscillate position
                particle.position.set(
                    initialPos.x + Math.sin(this.elapsedTime * speed) * direction.x * 0.3,
                    initialPos.y + Math.sin(this.elapsedTime * speed) * direction.y * 0.3,
                    initialPos.z + Math.sin(this.elapsedTime * speed) * direction.z * 0.3
                );
            }
        }
        
        // Animate kick effect
        if (kickGroup && kickGroup.visible) {
            // Expand and fade kick wave
            const kickWave = kickGroup.children[0];
            if (kickWave) {
                kickWave.scale.x += delta * 3;
                kickWave.scale.y += delta * 3;
                kickWave.scale.z += delta * 3;
                
                if (kickWave.material) {
                    kickWave.material.opacity -= delta * 2;
                    
                    // Hide kick when fully faded
                    if (kickWave.material.opacity <= 0) {
                        kickGroup.visible = false;
                        // Reset kick wave for next use
                        kickWave.scale.set(1, 1, 1);
                        kickWave.material.opacity = 0.7;
                    }
                }
            }
        }
    }
    
    /**
     * Perform a kick animation
     * @private
     */
    performKick() {
        if (!this.dragonState || !this.dragonState.kickGroup) return;
        
        const kickGroup = this.dragonState.kickGroup;
        
        // Position kick effect in front of the dragon
        kickGroup.position.set(0, 0, -2);
        
        // Show kick effect
        kickGroup.visible = true;
        
        // Reset kick wave
        const kickWave = kickGroup.children[0];
        if (kickWave) {
            kickWave.scale.set(1, 1, 1);
            if (kickWave.material) {
                kickWave.material.opacity = 0.7;
            }
        }
        
        // Trigger animation on the model
        if (this.dragonState.dragonGroup) {
            const model = this.dragonState.dragonGroup.children.find(child => child.isObject3D && !child.isMesh);
            if (model) {
                // Add a quick "kick" animation - a forward motion followed by return
                // This is a simple animation since we don't have access to the model's animations
                model.position.z -= 0.5; // Move forward
                
                // Return to original position after a short delay
                setTimeout(() => {
                    if (model && this.isActive) {
                        model.position.z += 0.5;
                    }
                }, 150);
            }
        }
    }

    /**
     * Dispose of the effect and clean up resources
     */
    dispose() {
        if (!this.effect) return;
        
        // Clean up Flying Dragon specific resources
        if (this.dragonState) {
            // Clear particle references
            if (this.dragonState.particles) {
                this.dragonState.particles.length = 0;
            }
            
            // Recursively dispose of geometries and materials
            this.effect.traverse(child => {
                // Dispose of geometries
                if (child.geometry) {
                    child.geometry.dispose();
                }
                
                // Dispose of materials
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(material => {
                            // Dispose of any textures
                            if (material.map) material.map.dispose();
                            if (material.normalMap) material.normalMap.dispose();
                            if (material.specularMap) material.specularMap.dispose();
                            if (material.emissiveMap) material.emissiveMap.dispose();
                            
                            // Dispose of the material itself
                            material.dispose();
                        });
                    } else {
                        // Dispose of any textures
                        if (child.material.map) child.material.map.dispose();
                        if (child.material.normalMap) child.material.normalMap.dispose();
                        if (child.material.specularMap) child.material.specularMap.dispose();
                        if (child.material.emissiveMap) child.material.emissiveMap.dispose();
                        
                        // Dispose of the material itself
                        child.material.dispose();
                    }
                }
                
                // Clear any userData
                if (child.userData) {
                    child.userData = {};
                }
            });
            
            // Clear dragon state
            this.dragonState = null;
        }
        
        // Call parent dispose method to clean up the rest
        super.dispose();
    }
    
    /**
     * Reset the effect to its initial state
     */
    reset() {
        // Call the dispose method to clean up resources
        this.dispose();
        
        // Reset state variables
        this.isActive = false;
        this.elapsedTime = 0;
        this.distanceTraveled = 0;
        this.kickCount = 0;
        this.timeSinceLastKick = 0;
        this.initialPosition.set(0, 0, 0);
        this.direction.set(0, 0, 0);
    }
}