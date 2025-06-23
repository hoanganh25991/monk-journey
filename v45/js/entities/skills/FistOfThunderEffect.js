import * as THREE from 'three';
import { SkillEffect } from './SkillEffect.js';

/**
 * Specialized effect for Fist of Thunder skill
 */
export class FistOfThunderEffect extends SkillEffect {
    constructor(skill) {
        super(skill);
        this.teleportState = null;
    }

    /**
     * Create a Fist of Thunder effect
     * @param {THREE.Vector3} position - Starting position
     * @param {THREE.Vector3} direction - Direction to teleport
     * @returns {THREE.Group} - The created effect
     */
    create(position, direction) {
        position = position.clone();
        position.y -= 0.45;
        // Create a group for the effect
        const effectGroup = new THREE.Group();
        
        // Create the Fist of Thunder effect
        this._createFistOfThunderEffect(effectGroup);
        
        // Position effect
        effectGroup.position.copy(position);
        
        // Store effect
        this.effect = effectGroup;
        this.isActive = true;
        
        return effectGroup;
    }

    /**
     * Create the Fist of Thunder special effect
     * @param {THREE.Group} effectGroup - Group to add the effect to
     * @private
     */
    _createFistOfThunderEffect(effectGroup) {
        // Create a lightning teleport effect
        const teleportGroup = new THREE.Group();
        
        // Create lightning trail effect
        const trailCount = 20;
        const trailSegments = [];
        
        // Create lightning segments
        for (let i = 0; i < trailCount; i++) {
            const segmentGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.5);
            const segmentMaterial = new THREE.MeshStandardMaterial({
                color: this.skill.color,
                emissive: this.skill.color,
                emissiveIntensity: 1.5,
                transparent: true,
                opacity: 0.8,
                depthWrite: false // Prevent hiding models behind the effect
            });
            
            const segment = new THREE.Mesh(segmentGeometry, segmentMaterial);
            
            // Random position around the player
            const angle = Math.random() * Math.PI * 2;
            const radius = 0.5 + Math.random() * 1.5;
            
            segment.position.set(
                Math.cos(angle) * radius,
                Math.random() * 2 - 1,
                Math.sin(angle) * radius
            );
            
            // Random rotation
            segment.rotation.x = Math.random() * Math.PI;
            segment.rotation.y = Math.random() * Math.PI;
            segment.rotation.z = Math.random() * Math.PI;
            
            // Store initial values for animation
            segment.userData = {
                initialPos: segment.position.clone(),
                initialRot: segment.rotation.clone(),
                speed: 0.5 + Math.random() * 1.5,
                direction: new THREE.Vector3(
                    Math.random() * 2 - 1,
                    Math.random() * 2 - 1,
                    Math.random() * 2 - 1
                ).normalize()
            };
            
            trailSegments.push(segment);
            teleportGroup.add(segment);
        }
        
        // Create central lightning core
        const coreGeometry = new THREE.SphereGeometry(0.5, 16, 16);
        const coreMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            emissive: this.skill.color,
            emissiveIntensity: 2,
            transparent: true,
            opacity: 0.8,
            depthWrite: false // Prevent hiding models behind the effect
        });
        
        const core = new THREE.Mesh(coreGeometry, coreMaterial);
        teleportGroup.add(core);
        
        // Create flash effect
        const flashGeometry = new THREE.SphereGeometry(1, 16, 16);
        const flashMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 1.0,
            depthWrite: false // Prevent hiding models behind the effect
        });
        
        const flash = new THREE.Mesh(flashGeometry, flashMaterial);
        teleportGroup.add(flash);
        
        // Add teleport group to effect group
        effectGroup.add(teleportGroup);
        
        // Store teleport state
        this.teleportState = {
            age: 0,
            phase: 'appearing', // 'appearing', 'stable', 'dissipating'
            trailSegments: trailSegments,
            flash: flash,
            core: core
        };
    }

    /**
     * Update the Fist of Thunder effect
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
        
        // IMPORTANT: Update the skill's position property to match the effect's position
        // This is crucial for collision detection in CollisionManager
        this.skill.position.copy(this.effect.position);
        
        // Update the Fist of Thunder effect
        this._updateFistOfThunderEffect(delta);
    }

    /**
     * Update the Fist of Thunder special effect
     * @param {number} delta - Time since last update in seconds
     * @private
     */
    _updateFistOfThunderEffect(delta) {
        // Get teleport group (first child of effect group)
        const teleportGroup = this.effect.children[0];
        
        // Update teleport state
        this.teleportState.age += delta;
        
        // Handle different phases of the teleport effect
        if (this.teleportState.phase === 'appearing') {
            // Scale up the effect during appearing phase
            const scale = Math.min(1.0, this.teleportState.age * 5); // Reach full size in 0.2 seconds
            teleportGroup.scale.set(scale, scale, scale);
            
            // Flash effect
            if (this.teleportState.flash) {
                this.teleportState.flash.material.opacity = Math.min(1.0, 2.0 - this.teleportState.age * 10);
                this.teleportState.flash.scale.set(1 + this.teleportState.age * 5, 1 + this.teleportState.age * 5, 1 + this.teleportState.age * 5);
            }
            
            // Transition to stable phase
            if (this.teleportState.age >= 0.2) {
                this.teleportState.phase = 'stable';
                this.teleportState.age = 0;
            }
        } else if (this.teleportState.phase === 'stable') {
            // Animate lightning segments during stable phase
            if (this.teleportState.trailSegments) {
                for (const segment of this.teleportState.trailSegments) {
                    if (segment.userData) {
                        // Oscillate position
                        const initialPos = segment.userData.initialPos;
                        const speed = segment.userData.speed;
                        const direction = segment.userData.direction;
                        
                        segment.position.set(
                            initialPos.x + Math.sin(this.teleportState.age * speed * 5) * direction.x * 0.3,
                            initialPos.y + Math.sin(this.teleportState.age * speed * 5) * direction.y * 0.3,
                            initialPos.z + Math.sin(this.teleportState.age * speed * 5) * direction.z * 0.3
                        );
                        
                        // Rotate
                        segment.rotation.x += delta * speed;
                        segment.rotation.y += delta * speed * 0.7;
                        segment.rotation.z += delta * speed * 0.5;
                    }
                }
            }
            
            // Pulse the flash
            if (this.teleportState.flash) {
                this.teleportState.flash.material.opacity = 0.2 + Math.sin(this.teleportState.age * 10) * 0.1;
            }
            
            // Pulse the core
            if (this.teleportState.core) {
                const pulseScale = 1 + Math.sin(this.teleportState.age * 15) * 0.2;
                this.teleportState.core.scale.set(pulseScale, pulseScale, pulseScale);
            }
            
            // Transition to dissipating phase near the end of duration
            if (this.elapsedTime >= this.skill.duration * 0.8) {
                this.teleportState.phase = 'dissipating';
                this.teleportState.age = 0;
            }
        } else if (this.teleportState.phase === 'dissipating') {
            // Scale down the effect during dissipating phase
            const scale = Math.max(0.0, 1.0 - (this.teleportState.age * 5)); // Shrink to nothing in 0.2 seconds
            teleportGroup.scale.set(scale, scale, scale);
            
            // Fade out all materials
            teleportGroup.traverse(child => {
                if (child.material && child.material.opacity) {
                    child.material.opacity = Math.max(0, child.material.opacity - delta * 5);
                }
            });
        }
        
        // NOTE: Enemy collision detection and damage application is now handled by CollisionManager
        // This effect only needs to update its position for the CollisionManager to detect collisions
    }

    /**
     * Override the base class createHitEffect to add lightning-specific effects
     * @param {THREE.Vector3} position - Position to create the hit effect
     */
    createHitEffect(position) {
        if (!position || !this.skill || !this.skill.game || !this.skill.game.scene) {
            console.warn('Cannot create hit effect: missing required references');
            return;
        }
        
        // Create a group for the hit effect
        const hitEffectGroup = new THREE.Group();
        
        // Create a lightning flash
        const flashGeometry = new THREE.SphereGeometry(0.5, 8, 8);
        const flashMaterial = new THREE.MeshBasicMaterial({
            color: this.skill.color || 0x00ffff, // Default to cyan for lightning
            transparent: true,
            opacity: 0.8,
            depthWrite: false
        });
        
        const flash = new THREE.Mesh(flashGeometry, flashMaterial);
        hitEffectGroup.add(flash);
        
        // Add lightning arcs
        const arcCount = 4;
        for (let i = 0; i < arcCount; i++) {
            const angle = (i / arcCount) * Math.PI * 2;
            
            // Create a small lightning arc
            const arcGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.5);
            const arcMaterial = new THREE.MeshBasicMaterial({
                color: this.skill.color || 0x00ffff,
                transparent: true,
                opacity: 0.7
            });
            
            const arc = new THREE.Mesh(arcGeometry, arcMaterial);
            arc.position.set(
                Math.cos(angle) * 0.3,
                0.2,
                Math.sin(angle) * 0.3
            );
            
            arc.rotation.y = angle;
            hitEffectGroup.add(arc);
        }
        
        // Position the hit effect
        hitEffectGroup.position.copy(position);
        hitEffectGroup.position.y += 1; // Position at enemy center
        
        // Add to scene
        this.skill.game.scene.add(hitEffectGroup);
        
        // Animate the hit effect
        let elapsedTime = 0;
        const duration = 0.3; // seconds
        
        const animate = (delta) => {
            elapsedTime += delta;
            
            // Scale flash
            const flashScale = 1.0 + (elapsedTime / duration);
            flash.scale.set(flashScale, flashScale, flashScale);
            flash.material.opacity = (1.0 - (elapsedTime / duration)) * 0.8;
            
            // Animate arcs
            for (let i = 1; i < hitEffectGroup.children.length; i++) {
                const arc = hitEffectGroup.children[i];
                arc.scale.z = 1.0 + Math.sin(elapsedTime * 20 + i) * 0.5;
                arc.material.opacity = (1.0 - (elapsedTime / duration)) * 0.7;
            }
            
            // Remove when animation is complete
            if (elapsedTime >= duration) {
                // Clean up
                hitEffectGroup.traverse(child => {
                    if (child.geometry) child.geometry.dispose();
                    if (child.material) {
                        if (Array.isArray(child.material)) {
                            child.material.forEach(m => m.dispose());
                        } else {
                            child.material.dispose();
                        }
                    }
                });
                
                this.skill.game.scene.remove(hitEffectGroup);
                return;
            }
            
            // Continue animation
            requestAnimationFrame(() => {
                animate(1/60); // Approximate delta if not provided by game loop
            });
        };
        
        // Start animation
        animate(1/60);
    }

    /**
     * Enhanced dispose method to properly clean up all resources
     * Overrides the base class dispose method with more thorough cleanup
     */
    dispose() {
        if (!this.effect) return;
        
        // Clean up Fist of Thunder specific resources
        if (this.teleportState) {
            // Clear trail segment references
            if (this.teleportState.trailSegments) {
                this.teleportState.trailSegments.length = 0;
            }
            
            // Clear references
            this.teleportState.flash = null;
            this.teleportState.core = null;
            
            // Clear teleport state
            this.teleportState = null;
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
                // If userData contains Vector3 objects, null them out
                if (child.userData.initialPos) {
                    child.userData.initialPos = null;
                }
                if (child.userData.initialRot) {
                    child.userData.initialRot = null;
                }
                if (child.userData.direction) {
                    child.userData.direction = null;
                }
                
                // Clear the userData object
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