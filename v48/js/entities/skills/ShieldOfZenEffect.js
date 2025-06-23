import * as THREE from 'three';
import { SkillEffect } from './SkillEffect.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

/**
 * Specialized effect for Shield of Zen skill
 * Creates energy rings around the player and a transparent Buddha figure behind them
 */
export class ShieldOfZenEffect extends SkillEffect {
    // Static property to store the preloaded Buddha model
    static buddhaModel = null;
    
    /**
     * Preload the Buddha model to avoid loading it at runtime
     * @returns {Promise} - Promise that resolves when the model is loaded
     */
    static preloadModel() {
        return new Promise((resolve, reject) => {
            if (ShieldOfZenEffect.buddhaModel) {
                console.debug('Buddha model already preloaded');
                resolve(ShieldOfZenEffect.buddhaModel);
                return;
            }
            
            console.debug('Preloading Buddha model...');
            // Create and configure Draco loader
            const dracoLoader = new DRACOLoader();
            dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
            dracoLoader.setDecoderConfig({ type: 'js' }); // Use JavaScript decoder for compatibility
            
            // Create GLTFLoader and set the Draco loader
            const loader = new GLTFLoader();
            loader.setDRACOLoader(dracoLoader);
            
            loader.load('assets/effects/buddha.glb', 
                (gltf) => {
                    console.debug('Buddha model preloaded successfully');
                    ShieldOfZenEffect.buddhaModel = gltf.scene.clone();
                    resolve(ShieldOfZenEffect.buddhaModel);
                },
                (xhr) => {
                    console.debug(`Buddha model ${(xhr.loaded / xhr.total * 100)}% preloaded`);
                },
                (error) => {
                    console.error('Error preloading Buddha model:', error);
                    reject(error);
                }
            );
        });
    }
    
    constructor(skill) {
        super(skill);
        this.rotationSpeed = 0.5; // Rotation speed in radians per second
        this.playerPosition = null;
        this.playerDirection = null;
        this.buddhaFigure = null;
        this.aura = null;
        this.particles = [];
        this.damageReduction = 0.3; // 30% damage reduction
        this.damageReflection = 0.1; // 10% damage reflection
        this.followPlayer = true; // Flag to make the effect follow the player
    }

    /**
     * Create a Shield of Zen effect
     * @param {THREE.Vector3} position - Player position
     * @param {THREE.Vector3} direction - Player direction
     * @returns {THREE.Group} - The created effect
     */
    create(position, direction) {
        // Create a group for the effect
        const effectGroup = new THREE.Group();
        
        // Store initial position and direction
        this.playerPosition = position.clone();
        this.playerDirection = direction.clone();
        
        // Create the Shield of Zen effect
        this._createShieldOfZenEffect(effectGroup, position, direction);
        
        // Position effect at player position
        effectGroup.position.copy(position);
        
        // Store effect
        this.effect = effectGroup;
        this.isActive = true;
        
        return effectGroup;
    }

    /**
     * Create the Shield of Zen effect
     * @param {THREE.Group} effectGroup - Group to add the effect to
     * @param {THREE.Vector3} position - Player position
     * @param {THREE.Vector3} direction - Player direction
     * @private
     */
    _createShieldOfZenEffect(effectGroup, position, direction) {
        // Create the Buddha figure behind the player
        this._createBuddhaFigure(effectGroup, direction);
    }

    /**
     * Create the Buddha figure behind the player
     * @param {THREE.Group} effectGroup - Group to add the Buddha to
     * @param {THREE.Vector3} direction - Player direction
     * @private
     */
    _createBuddhaFigure(effectGroup, direction) {
        const buddhaGroup = new THREE.Group();
        
        // Create a material for the Buddha model
        const buddhaMaterial = new THREE.MeshStandardMaterial({
            color: this.skill.color,
            transparent: true,
            opacity: 0.6,
            emissive: this.skill.color,
            emissiveIntensity: 0.8,
            depthWrite: false // Prevent hiding models behind the effect
        });
        
        // Use the preloaded Buddha model if available
        if (ShieldOfZenEffect.buddhaModel) {
            // Clone the preloaded model to avoid modifying the original
            const buddhaModel = ShieldOfZenEffect.buddhaModel.clone();
            
            // Apply the material to all meshes in the model
            buddhaModel.traverse((child) => {
                if (child.isMesh) {
                    // Store the original material for reference if needed
                    child.userData.originalMaterial = child.material;
                    
                    // Apply our custom material
                    child.material = buddhaMaterial.clone();
                }
            });
            
            // Add the model to the group
            buddhaGroup.add(buddhaModel);
            
            // Scale the model
            const scale = 9.0;
            buddhaModel.scale.set(scale, scale, scale);
            
            // Initial rotation to match player's direction exactly
            // We don't set rotation here as it will be handled in the update method
        } else {
            console.warn('Preloaded Buddha model not available, creating fallback');
            // Fallback to a simple placeholder if preloaded model is not available
            const buddhaGeometry = new THREE.BoxGeometry(2, 3, 0.5);
            const buddhaBox = new THREE.Mesh(buddhaGeometry, buddhaMaterial);
            buddhaGroup.add(buddhaBox);
        }
        
        // Position the Buddha at the same location as the player (hero inside Buddha)
        // Set position to origin (0,0,0) relative to effect group, which is already at player position
        buddhaGroup.position.set(0, 0, 0);
        
        // Add Buddha to effect group
        effectGroup.add(buddhaGroup);
        
        // Store reference to Buddha
        this.buddhaFigure = buddhaGroup;
    }

    /**
     * Update the Shield of Zen effect
     * @param {number} delta - Time since last update in seconds
     */
    update(delta) {
        if (!this.isActive || !this.effect) return;
        
        this.elapsedTime += delta;
        
        // Check if effect has expired
        if (this.elapsedTime >= this.skill.duration) {
            this.isActive = false;
            this.dispose(); // Properly dispose of the effect when it expires
            return;
        }
        
        // If we should follow the player, update the effect's position
        if (this.followPlayer && this.skill.game && this.skill.game.player) {
            // Get the current player position
            const player = this.skill.game.player;
            const currentPlayerPosition = player.movement.getPosition().clone();
            const currentPlayerRotation = player.movement.getRotation();
            
            // Calculate current player direction
            const currentPlayerDirection = new THREE.Vector3(
                Math.sin(currentPlayerRotation.y),
                0,
                Math.cos(currentPlayerRotation.y)
            );
            
            // Update our stored player position and direction
            this.playerPosition = currentPlayerPosition;
            this.playerDirection = currentPlayerDirection;
            
            // Update the effect's position to match the player's position
            this.effect.position.copy(currentPlayerPosition);
            
            // Update the Buddha figure's position relative to the player
            if (this.buddhaFigure) {
                // Position the Buddha at the same location as the player (hero inside Buddha)
                // Set position to origin (0,0,0) relative to effect group, which is at player position
                this.buddhaFigure.position.set(0, 0, 0);
                
                // Adjust y-position to place Buddha above the ground
                this.buddhaFigure.position.y += 1.2; // Raise the Buddha to be fully visible above ground
                
                // Make the Buddha have exactly the same direction look as the hero
                // We set the rotation directly from the player's rotation
                this.buddhaFigure.rotation.y = currentPlayerRotation.y;
            }
        }
        
        // IMPORTANT: Update the skill's position property to match the effect's position
        // This is crucial for collision detection in CollisionManager
        this.skill.position.copy(this.effect.position);
        
        // Update the Shield of Zen effect
        this._updateShieldOfZenEffect(delta);
    }

    /**
     * Update the Shield of Zen effect
     * @param {number} delta - Time since last update in seconds
     * @private
     */
    _updateShieldOfZenEffect(delta) {
        // Update aura rings
        if (this.aura) {
            for (let i = 0; i < this.aura.children.length; i++) { // No need to skip first child as sphere was removed
                const ring = this.aura.children[i];
                if (ring.userData && ring.userData.rotationAxis && ring.userData.rotationSpeed) {
                    // Rotate ring around its custom axis
                    const axis = ring.userData.rotationAxis;
                    const angle = ring.userData.rotationSpeed * delta;
                    
                    ring.rotateOnAxis(axis, angle);
                }
            }
        }
        
        // Update the Buddha figure (without rotating it)
        if (this.buddhaFigure) {
            // Make the Buddha figure pulse with a gentle glow
            // Base scale is now 9.0 (6x bigger) with a small pulsing effect that only goes upward
            const pulseScale = 9.0 + 5 * (1 + Math.sin(this.elapsedTime * 2)) / 2;
            this.buddhaFigure.children.forEach(child => {
                if (child.scale) {
                    child.scale.set(pulseScale / 3.0, pulseScale / 3.0, pulseScale / 3.0);
                }
            });
            
            // Adjust opacity based on elapsed time for a pulsing effect
            const opacity = 0.6 + 0.2 * Math.sin(this.elapsedTime * 1.5);
            this.buddhaFigure.children.forEach(child => {
                if (child.material) {
                    child.material.opacity = opacity;
                }
            });
        }
        
        // Update particles
        for (const particle of this.particles) {
            if (particle.userData) {
                // Orbit around initial position
                const axis = particle.userData.orbitAxis;
                const angle = particle.userData.orbitSpeed * delta;
                
                // Apply rotation around the orbit axis
                const rotationMatrix = new THREE.Matrix4().makeRotationAxis(axis, angle);
                particle.position.applyMatrix4(rotationMatrix);
                
                // Pulse opacity
                const opacity = 0.6 + 0.3 * Math.sin(this.elapsedTime * 2 + particle.userData.orbitSpeed * 10);
                particle.material.opacity = opacity;
            }
        }
    }

    /**
     * Enhanced dispose method to properly clean up all resources
     * Overrides the base class dispose method with more thorough cleanup
     */
    dispose() {
        if (!this.effect) return;
        
        // Clear particle references
        this.particles.length = 0;
        
        // Clear references to specific parts
        this.aura = null;
        this.buddhaFigure = null;
        
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
        
        // Remove from parent
        if (this.effect.parent) {
            this.effect.parent.remove(this.effect);
        }
        
        // Clear references
        this.effect = null;
        this.isActive = false;
        this.playerPosition = null;
    }
    
    /**
     * Override the reset method to properly clean up all resources
     */
    reset() {
        // Call the dispose method to clean up resources
        this.dispose();
        
        // Reset state variables
        this.isActive = false;
        this.elapsedTime = 0;
    }
}