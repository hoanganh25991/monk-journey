import * as THREE from 'three';
import { SkillEffect } from './SkillEffect.js';

/**
 * Specialized effect for Wave Strike skill
 */
export class WaveStrikeEffect extends SkillEffect {
    constructor(skill) {
        super(skill);
        this.projectileSpeed = 15; // Units per second
        this.initialPosition = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        this.distanceTraveled = 0;
    }

    /**
     * Create a Wave Strike projectile effect
     * @param {THREE.Vector3} position - Starting position
     * @param {THREE.Vector3} direction - Direction to travel
     * @returns {THREE.Group} - The created effect
     */
    create(position, direction) {
        console.debug('Wave Strike effect created - sound should have been played by Skill.createEffect()');
        // position.y -= 2.05;
        // Create a group for the effect
        const effectGroup = new THREE.Group();
        
        // Store initial position and direction for movement
        this.initialPosition.copy(position);
        this.direction.copy(direction);
        this.distanceTraveled = 0;
        
        // Create the Wave Strike effect
        this.createWaveStrikeEffect(effectGroup);
        
        // Position effect
        effectGroup.position.copy(position);
        effectGroup.rotation.y = Math.atan2(direction.x, direction.z);
        
        // Scale the effect based on skill radius
        // Default radius is likely 1, so we use that as the baseline
        const baseRadius = 3;
        // Ensure we have a valid radius value (default to baseRadius if undefined or 0)
        const skillRadius = (this.skill.radius && this.skill.radius > 0) ? this.skill.radius : baseRadius;
        const scaleFactor = skillRadius / baseRadius;
        
        // Apply scaling if radius is different from the default
        if (scaleFactor !== 1) {
            effectGroup.scale.set(scaleFactor, scaleFactor, scaleFactor);
        }
        
        // Store effect
        this.effect = effectGroup;
        this.isActive = true;
        
        return effectGroup;
    }

    /**
     * Create the Wave Strike special effect
     * @param {THREE.Group} effectGroup - Group to add the effect to
     * @private
     */
    createWaveStrikeEffect(effectGroup) {
        // Create main wave body - a curved plane
        const waveGroup = new THREE.Group();
        
        // Create the main wave shape using a torus segment
        // These are base dimensions that will be scaled by the skill.radius in the create method
        const waveWidth = 2.5;
        const waveHeight = 1.8;
        const waveDepth = 3.0;
        
        // Create the main wave body using a custom shape
        const waveGeometry = new THREE.TorusGeometry(waveWidth, waveHeight/2, 16, 32, Math.PI);
        const waveMaterial = new THREE.MeshStandardMaterial({
            color: this.skill.color,
            transparent: true,
            opacity: 0.7,
            metalness: 0.2,
            roughness: 0.3,
            side: THREE.DoubleSide,
            depthWrite: false // Prevent hiding models behind the effect
        });
        
        const wave = new THREE.Mesh(waveGeometry, waveMaterial);
        wave.rotation.x = Math.PI / 2;
        wave.rotation.y = Math.PI;
        wave.scale.z = 0.5;
        waveGroup.add(wave);
        
        // Add water droplets/particles around the wave
        const dropletCount = 25;
        for (let i = 0; i < dropletCount; i++) {
            // Random position around the wave
            const angle = (Math.random() * Math.PI) - (Math.PI/2);
            const radius = waveWidth * 0.8 * Math.random();
            const height = (Math.random() * waveHeight) - (waveHeight/2);
            
            // Create water droplet
            const dropletSize = 0.05 + (Math.random() * 0.15);
            const dropletGeometry = new THREE.SphereGeometry(dropletSize, 8, 8);
            const dropletMaterial = new THREE.MeshStandardMaterial({
                color: this.skill.color,
                transparent: true,
                opacity: 0.6 + (Math.random() * 0.4),
                metalness: 0.3,
                roughness: 0.2
            });
            
            const droplet = new THREE.Mesh(dropletGeometry, dropletMaterial);
            droplet.position.set(
                Math.cos(angle) * radius,
                height,
                Math.sin(angle) * radius
            );
            
            // Store initial position for animation
            droplet.userData = {
                initialPos: droplet.position.clone(),
                speed: 0.5 + (Math.random() * 1.5),
                direction: new THREE.Vector3(
                    (Math.random() * 2) - 1,
                    (Math.random() * 2) - 1,
                    (Math.random() * 2) - 1
                ).normalize()
            };
            
            waveGroup.add(droplet);
        }
        
        // Add foam/splash at the base of the wave
        const foamGeometry = new THREE.TorusGeometry(waveWidth * 0.9, 0.3, 16, 32, Math.PI);
        const foamMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.8,
            metalness: 0.1,
            roughness: 0.9
        });
        
        const foam = new THREE.Mesh(foamGeometry, foamMaterial);
        foam.rotation.x = Math.PI / 2;
        foam.rotation.y = Math.PI;
        foam.position.y = -waveHeight/2 + 0.1;
        foam.scale.z = 0.3;
        waveGroup.add(foam);
        
        // Add energy core in the center of the wave
        const coreGeometry = new THREE.SphereGeometry(0.4, 16, 16);
        const coreMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            emissive: this.skill.color,
            emissiveIntensity: 2,
            transparent: true,
            opacity: 0.9
        });
        
        const core = new THREE.Mesh(coreGeometry, coreMaterial);
        core.position.set(0, 0, 0);
        waveGroup.add(core);
        
        // Add energy tendrils emanating from the core
        const tendrilCount = 6;
        for (let i = 0; i < tendrilCount; i++) {
            const angle = (i / tendrilCount) * Math.PI;
            const tendrilGeometry = new THREE.CylinderGeometry(0.05, 0.02, waveWidth * 1.5, 8);
            const tendrilMaterial = new THREE.MeshStandardMaterial({
                color: this.skill.color,
                transparent: true,
                opacity: 0.6,
                emissive: this.skill.color,
                emissiveIntensity: 0.5
            });
            
            const tendril = new THREE.Mesh(tendrilGeometry, tendrilMaterial);
            tendril.position.set(
                Math.cos(angle) * (waveWidth * 0.3),
                Math.sin(angle) * (waveHeight * 0.3),
                0
            );
            tendril.rotation.z = angle + (Math.PI/2);
            
            // Store rotation data for animation
            tendril.userData = {
                rotationSpeed: 0.5 + (Math.random() * 1.5),
                initialAngle: angle
            };
            
            waveGroup.add(tendril);
        }
        
        // Add trailing wake behind the wave
        const wakeGeometry = new THREE.PlaneGeometry(waveWidth * 2, waveDepth * 1.5);
        const wakeMaterial = new THREE.MeshBasicMaterial({
            color: this.skill.color,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
        });
        
        const wake = new THREE.Mesh(wakeGeometry, wakeMaterial);
        wake.rotation.x = Math.PI / 2;
        wake.position.z = -waveDepth/2;
        wake.position.y = -0.1;
        waveGroup.add(wake);
        
        // Add the wave group to the effect group
        effectGroup.add(waveGroup);
        
        // Store animation state
        this.waveState = {
            phase: 'growing', // 'growing', 'stable', 'dissipating'
            age: 0,
            droplets: []
        };
        
        // Store droplet references for animation
        for (let i = 0; i < waveGroup.children.length; i++) {
            const child = waveGroup.children[i];
            if (child.userData && child.userData.initialPos) {
                this.waveState.droplets.push(child);
            }
        }
    }

    /**
     * Update the Wave Strike effect
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
        
        // Move projectile forward
        const moveDistance = this.projectileSpeed * delta;
        this.effect.position.x += this.direction.x * moveDistance;
        this.effect.position.z += this.direction.z * moveDistance;
        
        // IMPORTANT: Update the skill's position property to match the effect's position
        // This is crucial for collision detection in CollisionManager
        this.skill.position.copy(this.effect.position);
        
        // Update distance traveled
        this.distanceTraveled += moveDistance;
        
        this.updateWaveStrikeEffect(delta);
    }

    /**
     * Update the Wave Strike special effect
     * @param {number} delta - Time since last update in seconds
     * @private
     */
    updateWaveStrikeEffect(delta) {
        // Update wave state
        this.waveState.age += delta;
        
        // Get the wave group (first child of effect group)
        const waveGroup = this.effect.children[0];
        
        // Animate droplets
        for (const droplet of this.waveState.droplets) {
            if (droplet.userData) {
                const initialPos = droplet.userData.initialPos;
                const speed = droplet.userData.speed;
                const direction = droplet.userData.direction;
                
                // Oscillate position
                droplet.position.set(
                    initialPos.x + Math.sin(this.waveState.age * speed) * direction.x * 0.2,
                    initialPos.y + Math.sin(this.waveState.age * speed) * direction.y * 0.2,
                    initialPos.z + Math.sin(this.waveState.age * speed) * direction.z * 0.2
                );
            }
        }
        
        // Animate tendrils
        for (let i = 0; i < waveGroup.children.length; i++) {
            const child = waveGroup.children[i];
            if (child.userData && child.userData.rotationSpeed) {
                child.rotation.z = child.userData.initialAngle + (Math.PI/2) + (this.waveState.age * child.userData.rotationSpeed);
            }
        }
    }

    /**
     * Enhanced dispose method to properly clean up all resources
     * Overrides the base class dispose method with more thorough cleanup
     */
    dispose() {
        if (!this.effect) return;
        
        // Clean up Wave Strike specific resources
        if (this.waveState) {
            // Clear droplet references
            if (this.waveState.droplets) {
                this.waveState.droplets.length = 0;
            }
            
            // Clear wave state
            this.waveState = null;
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
        this.distanceTraveled = 0;
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
        this.distanceTraveled = 0;
        this.initialPosition.set(0, 0, 0);
        this.direction.set(0, 0, 0);
    }
}