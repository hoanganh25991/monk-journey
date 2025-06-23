import * as THREE from 'three';
import { SkillEffect } from './SkillEffect.js';

/**
 * Specialized effect for Wave of Light skill
 */
export class WaveOfLightEffect extends SkillEffect {
    
    /**
     * @param {import("../skills/Skill.js").Skill} skill 
     */
    constructor(skill) {
        super(skill);
        this.waveSpeed = 10; // Units per second
        this.waveWidth = 3.0;
        this.waveHeight = 1.5;
        this.initialPosition = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        this.distanceTraveled = 0;
        this.bellCreated = false;
        
        // Get radius from skill or set default
        this.radius = skill && skill.radius ? skill.radius : 2.0;
        this.color = skill && skill.color ? skill.color : 0xffffff;
        this.range = skill && skill.range ? skill.range : 10.0;
    }

    /**
     * Create a Wave of Light effect
     * @param {THREE.Vector3} position - Starting position
     * @param {THREE.Vector3} direction - Direction to travel
     * @returns {THREE.Group} - The created effect
     */
    create(position, direction) {
        // Clone the position to avoid modifying the original vector
        // Create a group for the effect
        const effectGroup = new THREE.Group();
        
        // Store initial position and direction for movement
        this.initialPosition.copy(position);
        this.direction.copy(direction);
        this.distanceTraveled = 0;
        
        // Create the Wave of Light effect (bell)
        this.createWaveEffect(effectGroup);
        
        // Note: We don't need to position the effect here anymore
        // as createWaveEffect will position it at either the enemy or hero position
        // But we still need to set the rotation
        effectGroup.rotation.y = Math.atan2(direction.x, direction.z);
        
        // Store effect
        this.effect = effectGroup;
        this.isActive = true;
        
        return effectGroup;
    }

    /**
     * Create the bell effect for Wave of Light
     * @param {THREE.Group} effectGroup - Group to add the effect to
     * @private
     */
    createWaveEffect(effectGroup) {
        // Ensure radius is valid
        const safeRadius = isNaN(this.radius) || this.radius <= 0 ? 2.0 : this.radius;
        
        // Configuration for bell size and appearance
        const config = {
            bellSizeMultiplier: safeRadius / 5,  // Adjust this value to change the overall bell size
            bellHeight: 8,            // Height above the ground
            bellColor: 0xFFD700,      // Gold color for the bell
            bellOpacity: 0.9,         // Bell transparency
            bellMetalness: 0.8,       // Bell metallic appearance
            bellRoughness: 0.2,       // Bell surface roughness
            strikerColor: 0xAA7722    // Color of the striker inside the bell
        };
        
        // Create the bell - using a combination of shapes to form a bell
        const bellGroup = new THREE.Group();
        
        // Apply size multiplier to all dimensions
        const bellTopRadius = 1.2 * config.bellSizeMultiplier;
        const bellBottomRadius = 2 * config.bellSizeMultiplier;
        const bellHeight = 2.5 * config.bellSizeMultiplier;
        const bellRimRadius = 2 * config.bellSizeMultiplier;
        const bellRimThickness = 0.2 * config.bellSizeMultiplier;
        const strikerRadius = 0.3 * config.bellSizeMultiplier;
        
        // Bell top (dome)
        const bellTopGeometry = new THREE.SphereGeometry(bellTopRadius, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
        const bellMaterial = new THREE.MeshStandardMaterial({
            color: config.bellColor,
            metalness: config.bellMetalness,
            roughness: config.bellRoughness,
            transparent: true,
            opacity: config.bellOpacity
        });
        
        const bellTop = new THREE.Mesh(bellTopGeometry, bellMaterial);
        bellTop.position.y = bellHeight;
        bellGroup.add(bellTop);
        
        // Bell body (inverted cone)
        const bellBodyGeometry = new THREE.CylinderGeometry(bellTopRadius, bellBottomRadius, bellHeight, 16, 1, true);
        const bellBody = new THREE.Mesh(bellBodyGeometry, bellMaterial);
        bellBody.position.y = bellHeight/2;
        bellGroup.add(bellBody);
        
        // Bell rim (torus)
        const bellRimGeometry = new THREE.TorusGeometry(bellRimRadius, bellRimThickness, 16, 32);
        const bellRim = new THREE.Mesh(bellRimGeometry, bellMaterial);
        bellRim.position.y = 0;
        bellRim.rotation.x = Math.PI / 2;
        bellGroup.add(bellRim);
        
        // Bell striker (small sphere inside)
        const strikerGeometry = new THREE.SphereGeometry(strikerRadius, 8, 8);
        const strikerMaterial = new THREE.MeshStandardMaterial({
            color: config.strikerColor,
            metalness: 0.5,
            roughness: 0.5
        });
        
        const striker = new THREE.Mesh(strikerGeometry, strikerMaterial);
        striker.position.y = bellHeight * 0.32; // Position striker proportionally to bell size
        bellGroup.add(striker);
        
        // Position the bell above the player
        bellGroup.position.y = config.bellHeight;
        
        // Add bell to effect group
        effectGroup.add(bellGroup);
        
        // Create impact area (circle on the ground)
        // Ensure we have valid values for radius calculation
        const safeMultiplier = isNaN(config.bellSizeMultiplier) || config.bellSizeMultiplier <= 0 ? 0.4 : config.bellSizeMultiplier;
        const impactRadius = safeRadius * safeMultiplier; // Scale impact area with bell size
        const safeImpactRadius = isNaN(impactRadius) || impactRadius <= 0 ? 1.0 : impactRadius;
        
        const impactGeometry = new THREE.CircleGeometry(safeImpactRadius, 32);
        const impactMaterial = new THREE.MeshBasicMaterial({
            color: this.color || 0xffffff, // Ensure color is valid
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
        });
        
        const impactArea = new THREE.Mesh(impactGeometry, impactMaterial);
        impactArea.rotation.x = -Math.PI / 2;
        impactArea.position.y = 0.05;
        
        // Add impact area to effect group
        effectGroup.add(impactArea);
        
        // Create light rays emanating from impact point
        const rayCount = 8;
        for (let i = 0; i < rayCount; i++) {
            const angle = (i / rayCount) * Math.PI * 2;
            
            // Use the already validated safe radius
            const rayThickness = Math.max(0.1, 0.2 * safeMultiplier); // Ensure positive thickness
            const rayGeometry = new THREE.BoxGeometry(rayThickness, rayThickness, safeImpactRadius);
            const rayMaterial = new THREE.MeshBasicMaterial({
                color: this.color || 0xffffff, // Ensure color is valid
                transparent: true,
                opacity: 0.5
            });
            
            const ray = new THREE.Mesh(rayGeometry, rayMaterial);
            ray.position.set(
                Math.cos(angle) * (safeImpactRadius / 2),
                0.2,
                Math.sin(angle) * (safeImpactRadius / 2)
            );
            
            ray.rotation.y = angle;
            
            effectGroup.add(ray);
        }
        
        // Create particles for visual effect
        const safeParticleMultiplier = Math.max(0.1, safeMultiplier);
        const particleCount = Math.max(5, Math.floor(30 * safeParticleMultiplier)); // Ensure at least 5 particles
        
        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2;
            const radius = Math.random() * safeImpactRadius;
            
            const particleSize = Math.max(0.05, 0.1 * safeParticleMultiplier); // Ensure minimum size
            const particleGeometry = new THREE.SphereGeometry(particleSize, 8, 8);
            const particleMaterial = new THREE.MeshBasicMaterial({
                color: this.color || 0xffffff, // Ensure color is valid
                transparent: true,
                opacity: 0.7
            });
            
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            particle.position.set(
                Math.cos(angle) * radius,
                Math.random() * 0.5,
                Math.sin(angle) * radius
            );
            
            effectGroup.add(particle);
        }
        
        // Check if we have a game reference and can find a target enemy
        let targetPosition = this.initialPosition.clone();
        targetPosition.y -= 3.0;
        
        if (this.skill.game && this.skill.game.enemyManager) {
            // Try to find the nearest enemy within the skill's range
            const nearestEnemy = this.skill.game.enemyManager.findNearestEnemy(this.initialPosition, this.range);

            if (nearestEnemy) {
                // Get enemy position
                const enemyPosition = nearestEnemy.getPosition();
                // Calculate target position (at the enemy's location)
                targetPosition = enemyPosition.clone();
                targetPosition.y -= 0.3;
                console.debug(`Wave of Light targeting enemy at position: ${targetPosition.x}, ${targetPosition.z}`);
            } else {
                // If no enemy found, use hero position
                targetPosition = this.initialPosition.clone();
                targetPosition.y -= 2.8;
                console.debug('No enemy in range for Wave of Light, casting at hero position');
            }
        }

        // Move the effect group to the target position
        effectGroup.position.copy(targetPosition);
        
        // Store animation state with configuration and target position
        this.bellState = {
            phase: 'descending', // 'descending', 'impact', 'ascending'
            initialHeight: config.bellHeight,
            impactTime: 0,
            config: config, // Store config for use in update method
            targetPosition: targetPosition // Store the target position if an enemy was found
        };
        
        return effectGroup;
    }

    /**
     * Update the Wave of Light effect
     * @param {number} delta - Time since last update in seconds
     */
    update(delta) {
        if (!this.isActive || !this.effect) return;
        
        try {
            this.elapsedTime += delta;
            
            // Check if effect has expired
            if (this.elapsedTime >= this.skill.duration) {
                this.isActive = false;
                this.dispose(); // Properly dispose of the effect when it expires
                return;
            }
            
            // Update the Wave of Light effect
            this.updateWaveEffect(delta);
            
            // IMPORTANT: Update the skill's position property to match the effect's position
            // This is crucial for collision detection in CollisionManager
            this.skill.position.copy(this.effect.position);
        } catch (error) {
            console.error(`Error updating effect: ${error.message}`);

            // Mark as inactive to prevent further errors
            this.isActive = false;
        }
    }

    /**
     * Update the bell animation for Wave of Light
     * @param {number} delta - Time since last update in seconds
     * @private
     */
    updateWaveEffect(delta) {
        // Get bell group (first child of effect group)
        const bellGroup = this.effect.children[0];
        
        // Get impact area (second child of effect group)
        const impactArea = this.effect.children[1];
        
        // Get config from bell state
        const config = this.bellState.config || {
            bellSizeMultiplier: 2.0,
            bellHeight: 8
        };
        
        // Animation phases for the bell
        switch (this.bellState.phase) {
            case 'descending':
                // Bell descends from the sky
                const descentSpeed = 15 * Math.sqrt(config.bellSizeMultiplier); // Scale speed with bell size
                bellGroup.position.y -= descentSpeed * delta;
                
                // When bell reaches near ground level, switch to impact phase
                const groundClearance = 0.5 * config.bellSizeMultiplier;
                if (bellGroup.position.y <= groundClearance) {
                    bellGroup.position.y = groundClearance; // Ensure bell doesn't go below ground
                    this.bellState.phase = 'impact';
                    this.bellState.impactTime = 0;
                    
                    // Play bell ring sound
                    if (this.skill && this.skill.game && this.skill.game.audioManager) {
                        this.skill.playSound('impact');
                    }
                    
                    // Make impact area visible and expand it
                    impactArea.material.opacity = 0.7;
                    impactArea.scale.set(0.1, 0.1, 0.1); // Start small
                }
                break;
                
            case 'impact':
                // Bell impact phase - create shockwave and visual effects
                this.bellState.impactTime += delta;
                
                // Expand impact area - scale with bell size
                const expansionSpeed = 5 * Math.sqrt(config.bellSizeMultiplier);
                const maxScale = 1.5 * config.bellSizeMultiplier;
                const currentScale = Math.min(this.bellState.impactTime * expansionSpeed, maxScale);
                impactArea.scale.set(currentScale, currentScale, currentScale);
                
                // Fade impact area as it expands
                impactArea.material.opacity = 0.7 * (1 - (currentScale / maxScale));
                
                // Bell vibrates during impact
                const vibrationAmount = 0.1 * config.bellSizeMultiplier;
                bellGroup.position.x = Math.sin(this.bellState.impactTime * 30) * vibrationAmount;
                bellGroup.position.z = Math.cos(this.bellState.impactTime * 25) * vibrationAmount;
                
                // After impact time, switch to ascending phase
                if (this.bellState.impactTime > 1.0) {
                    this.bellState.phase = 'ascending';
                }
                break;
                
            case 'ascending':
                // Bell ascends back to the sky
                const ascentSpeed = 10 * Math.sqrt(config.bellSizeMultiplier); // Scale speed with bell size
                bellGroup.position.y += ascentSpeed * delta;
                
                // Fade out bell as it ascends
                bellGroup.traverse(child => {
                    if (child.material && child.material.opacity !== undefined) {
                        child.material.opacity = Math.max(0, child.material.opacity - delta);
                    }
                });
                
                // When bell reaches its initial height or becomes invisible, end the effect
                if (bellGroup.position.y >= this.bellState.initialHeight || 
                    bellGroup.children[0].material.opacity <= 0.05) {
                    // The effect will be removed in the next update cycle when duration is checked
                }
                break;
        }
        
        // Animate light rays and particles
        for (let i = 2; i < this.effect.children.length; i++) {
            const child = this.effect.children[i];
            
            // Animate light rays (box geometries)
            if (child.geometry && child.geometry.type === 'BoxGeometry') {
                // Pulse opacity based on impact phase
                if (this.bellState.phase === 'impact') {
                    child.material.opacity = 0.5 + 0.3 * Math.sin(this.bellState.impactTime * 10);
                    
                    // Extend rays during impact
                    const pulseScale = 1.0 + 0.3 * Math.sin(this.bellState.impactTime * 5);
                    child.scale.z = pulseScale;
                } else if (this.bellState.phase === 'ascending') {
                    // Fade out rays during ascent
                    child.material.opacity = Math.max(0, child.material.opacity - delta * 0.5);
                }
            }
            
            // Animate particles (sphere geometries)
            if (child.geometry && child.geometry.type === 'SphereGeometry' && child !== bellGroup.children[0]) {
                if (this.bellState.phase === 'impact') {
                    // Move particles outward during impact
                    const direction = new THREE.Vector3(
                        child.position.x,
                        0,
                        child.position.z
                    ).normalize();
                    
                    const moveSpeed = 2 * config.bellSizeMultiplier * delta;
                    child.position.x += direction.x * moveSpeed;
                    child.position.z += direction.z * moveSpeed;
                    
                    // Bounce particles
                    child.position.y = Math.abs(Math.sin(this.bellState.impactTime * 5 + i)) * 0.5;
                    
                    // Fade particles based on distance from center
                    const distanceFromCenter = Math.sqrt(
                        child.position.x * child.position.x + 
                        child.position.z * child.position.z
                    );
                    
                    // Ensure radius is valid (same as in createWaveEffect method)
                    const safeRadius = isNaN(this.radius) || this.radius <= 0 ? 2.0 : this.radius;
                    
                    child.material.opacity = Math.max(0, 0.7 - (distanceFromCenter / (impactArea.scale.x * safeRadius)));
                } else if (this.bellState.phase === 'ascending') {
                    // Fade out particles during ascent
                    child.material.opacity = Math.max(0, child.material.opacity - delta);
                }
            }
        }
    }

    /**
     * Enhanced dispose method to properly clean up all resources
     * Overrides the base class dispose method with more thorough cleanup
     */
    dispose() {
        if (!this.effect) return;
        
        // Clean up Wave of Light specific resources
        if (this.bellState) {
            // Clear bell state
            this.bellState = null;
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
        
        // Remove from parent
        if (this.effect.parent) {
            this.effect.parent.remove(this.effect);
        }
        
        // Clear references
        this.effect = null;
        this.isActive = false;
        this.distanceTraveled = 0;
        this.initialPosition.set(0, 0, 0);
        this.direction.set(0, 0, 0);
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
        this.bellCreated = false;
    }
}