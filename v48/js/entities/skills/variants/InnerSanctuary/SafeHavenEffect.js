import * as THREE from 'three';
import { InnerSanctuaryEffect } from '../../InnerSanctuaryEffect.js';

/**
 * Effect for the Safe Haven variant of Inner Sanctuary
 * Increases the duration of the sanctuary and provides a shield to allies when they enter
 * Visual style: Teal/blue sanctuary with protective shield bubbles and energy barriers
 */
export class SafeHavenEffect extends InnerSanctuaryEffect {
    constructor(skill) {
        super(skill);
        
        // Variant-specific properties
        this.durationMultiplier = 1.5; // 50% longer duration
        this.shieldAmount = 30; // Shield amount provided
        this.shieldDuration = 5; // Shield duration in seconds
        this.shieldedEntities = new Set(); // Track entities that have received shields
        
        // Apply duration multiplier
        this.skill.duration *= this.durationMultiplier;
        
        // Visual properties
        this.shieldBubbles = [];
        this.energyBarriers = [];
        this.protectionSymbols = [];
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
        
        // Modify the base sanctuary colors to teal/blue
        this._modifySanctuaryColors(sanctuaryGroup);
        
        // Add shield bubbles
        this._addShieldBubbles(sanctuaryGroup);
        
        // Add energy barriers
        this._addEnergyBarriers(sanctuaryGroup);
        
        // Add protection symbols
        this._addProtectionSymbols(sanctuaryGroup);
    }
    
    /**
     * Modify the sanctuary colors to teal/blue
     * @param {THREE.Group} sanctuaryGroup - The sanctuary group to modify
     * @private
     */
    _modifySanctuaryColors(sanctuaryGroup) {
        // Define the safe haven color (teal/blue)
        const safeHavenColor = new THREE.Color(0x00cccc);
        
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
                            mat.color.set(safeHavenColor);
                            mat.emissive.set(safeHavenColor);
                        });
                    } else {
                        child.material.color.set(safeHavenColor);
                        child.material.emissive.set(safeHavenColor);
                    }
                }
            }
        });
    }
    
    /**
     * Add shield bubbles to the sanctuary
     * @param {THREE.Group} sanctuaryGroup - The sanctuary group to add bubbles to
     * @private
     */
    _addShieldBubbles(sanctuaryGroup) {
        const baseRadius = this.skill.radius || 5;
        const bubbleCount = 5;
        
        for (let i = 0; i < bubbleCount; i++) {
            // Random position within the sanctuary
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * baseRadius * 0.7;
            const height = 0.5 + Math.random() * 1.5;
            
            // Create a shield bubble
            const bubbleSize = 0.3 + Math.random() * 0.4;
            const bubbleGeometry = new THREE.SphereGeometry(bubbleSize, 16, 16);
            const bubbleMaterial = new THREE.MeshBasicMaterial({
                color: 0x00ffff,
                transparent: true,
                opacity: 0.6,
                blending: THREE.AdditiveBlending
            });
            
            const bubble = new THREE.Mesh(bubbleGeometry, bubbleMaterial);
            
            // Position bubble
            bubble.position.set(
                Math.cos(angle) * radius,
                height,
                Math.sin(angle) * radius
            );
            
            // Store animation data
            bubble.userData = {
                initialY: bubble.position.y,
                floatSpeed: 0.3 + Math.random() * 0.3,
                floatOffset: Math.random() * Math.PI * 2,
                orbitRadius: radius,
                orbitAngle: angle,
                orbitSpeed: 0.1 + Math.random() * 0.2
            };
            
            sanctuaryGroup.add(bubble);
            this.shieldBubbles.push(bubble);
        }
    }
    
    /**
     * Add energy barriers to the sanctuary
     * @param {THREE.Group} sanctuaryGroup - The sanctuary group to add barriers to
     * @private
     */
    _addEnergyBarriers(sanctuaryGroup) {
        const baseRadius = this.skill.radius || 5;
        
        // Create a dome barrier
        const domeGeometry = new THREE.SphereGeometry(baseRadius, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2);
        const domeMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide,
            wireframe: true
        });
        
        const dome = new THREE.Mesh(domeGeometry, domeMaterial);
        dome.position.y = 0; // At ground level
        
        // Store animation data
        dome.userData = {
            pulseSpeed: 0.2,
            rotationSpeed: 0.05
        };
        
        sanctuaryGroup.add(dome);
        this.energyBarriers.push(dome);
        
        // Create a second dome (inner)
        const innerDomeGeometry = new THREE.SphereGeometry(baseRadius * 0.9, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2);
        const innerDomeMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.2,
            side: THREE.DoubleSide,
            wireframe: true
        });
        
        const innerDome = new THREE.Mesh(innerDomeGeometry, innerDomeMaterial);
        innerDome.position.y = 0; // At ground level
        
        // Store animation data
        innerDome.userData = {
            pulseSpeed: 0.3,
            rotationSpeed: -0.07 // Rotate in opposite direction
        };
        
        sanctuaryGroup.add(innerDome);
        this.energyBarriers.push(innerDome);
        
        // Create horizontal rings
        const ringCount = 3;
        
        for (let i = 0; i < ringCount; i++) {
            const height = 0.5 + (i * 1.0); // Stacked at different heights
            const ringRadius = baseRadius * (1.0 - (i * 0.1)); // Decreasing radius with height
            
            const ringGeometry = new THREE.RingGeometry(ringRadius - 0.1, ringRadius, 64);
            const ringMaterial = new THREE.MeshBasicMaterial({
                color: 0x00ffff,
                transparent: true,
                opacity: 0.5 - (i * 0.1),
                side: THREE.DoubleSide,
                blending: THREE.AdditiveBlending
            });
            
            const ring = new THREE.Mesh(ringGeometry, ringMaterial);
            ring.position.y = height;
            ring.rotation.x = -Math.PI / 2; // Lay flat
            
            // Store animation data
            ring.userData = {
                rotationSpeed: 0.1 * (i % 2 === 0 ? 1 : -1), // Alternate rotation direction
                pulseSpeed: 0.2 + (i * 0.1)
            };
            
            sanctuaryGroup.add(ring);
            this.energyBarriers.push(ring);
        }
    }
    
    /**
     * Add protection symbols to the sanctuary
     * @param {THREE.Group} sanctuaryGroup - The sanctuary group to add symbols to
     * @private
     */
    _addProtectionSymbols(sanctuaryGroup) {
        const baseRadius = this.skill.radius || 5;
        const symbolCount = 4;
        
        for (let i = 0; i < symbolCount; i++) {
            const angle = (i / symbolCount) * Math.PI * 2;
            const symbolRadius = baseRadius * 0.6;
            
            // Create a protection symbol
            const symbolGeometry = new THREE.PlaneGeometry(1.2, 1.2);
            const symbolMaterial = new THREE.MeshBasicMaterial({
                color: 0x00ffff,
                transparent: true,
                opacity: 0.8,
                side: THREE.DoubleSide,
                blending: THREE.AdditiveBlending
            });
            
            const symbol = new THREE.Mesh(symbolGeometry, symbolMaterial);
            
            // Position symbol
            symbol.position.set(
                Math.cos(angle) * symbolRadius,
                1.0, // Hover above ground
                Math.sin(angle) * symbolRadius
            );
            
            // Rotate symbol to face center
            symbol.lookAt(new THREE.Vector3(0, symbol.position.y, 0));
            
            // Store animation data
            symbol.userData = {
                initialY: symbol.position.y,
                floatSpeed: 0.4 + Math.random() * 0.2,
                rotationSpeed: 0.2 + Math.random() * 0.2,
                pulseSpeed: 0.3 + Math.random() * 0.3
            };
            
            sanctuaryGroup.add(symbol);
            this.protectionSymbols.push(symbol);
        }
    }
    
    /**
     * Update the Inner Sanctuary effect
     * @param {number} delta - Time since last update in seconds
     * @private
     */
    _updateInnerSanctuaryEffect(delta) {
        // Call the parent method to update the base sanctuary
        super._updateInnerSanctuaryEffect(delta);
        
        // Update shield bubbles
        this.shieldBubbles.forEach(bubble => {
            const userData = bubble.userData;
            
            // Floating animation
            bubble.position.y = userData.initialY + 
                Math.sin(this.elapsedTime * userData.floatSpeed + userData.floatOffset) * 0.3;
            
            // Orbit animation
            const newAngle = userData.orbitAngle + userData.orbitSpeed * delta;
            bubble.position.x = Math.cos(newAngle) * userData.orbitRadius;
            bubble.position.z = Math.sin(newAngle) * userData.orbitRadius;
            userData.orbitAngle = newAngle;
            
            // Pulse opacity
            bubble.material.opacity = 0.4 + Math.sin(this.elapsedTime * 0.5) * 0.2;
        });
        
        // Update energy barriers
        this.energyBarriers.forEach(barrier => {
            // Rotate the barrier
            if (barrier.userData.rotationSpeed) {
                if (barrier.rotation.y !== undefined) {
                    barrier.rotation.y += barrier.userData.rotationSpeed * delta;
                }
            }
            
            // Pulse the barrier
            if (barrier.userData.pulseSpeed) {
                const pulseScale = 1.0 + 0.05 * Math.sin(this.elapsedTime * barrier.userData.pulseSpeed);
                barrier.scale.set(pulseScale, pulseScale, pulseScale);
            }
        });
        
        // Update protection symbols
        this.protectionSymbols.forEach(symbol => {
            // Floating animation
            symbol.position.y = symbol.userData.initialY + 
                Math.sin(this.elapsedTime * symbol.userData.floatSpeed) * 0.2;
            
            // Rotation animation
            symbol.rotation.z += symbol.userData.rotationSpeed * delta;
            
            // Pulse scale
            const pulseScale = 1.0 + 0.1 * Math.sin(this.elapsedTime * symbol.userData.pulseSpeed);
            symbol.scale.set(pulseScale, pulseScale, pulseScale);
        });
        
        // Check for entities entering the sanctuary to apply shields
        this._checkForShieldApplication();
    }
    
    /**
     * Check for entities entering the sanctuary to apply shields
     * @private
     */
    _checkForShieldApplication() {
        if (!this.skill.game) return;
        
        // Get the sanctuary position
        const sanctuaryPosition = this.effect.position.clone();
        const radius = this.skill.radius || 5;
        
        // Check player
        const player = this.skill.game.player;
        if (player && player.stats && player.getPosition) {
            const playerPosition = player.getPosition();
            const distance = playerPosition.distanceTo(sanctuaryPosition);
            
            // If player is within radius and hasn't been shielded yet
            if (distance <= radius && !this.shieldedEntities.has('player')) {
                // Apply shield to player
                this._applyShield(player);
                this.shieldedEntities.add('player');
                
                // Create shield visual effect
                this._createShieldVisualEffect(playerPosition);
            }
        }
        
        // TODO: Check allies when ally system is implemented
    }
    
    /**
     * Apply a shield to an entity
     * @param {Object} entity - The entity to shield (player or ally)
     * @private
     */
    _applyShield(entity) {
        if (entity.stats && entity.stats.addShield) {
            // Apply shield
            entity.stats.addShield(this.shieldAmount, this.shieldDuration);
            
            // Show notification if available
            if (this.skill.game.hudManager && this.skill.game.hudManager.showNotification) {
                this.skill.game.hudManager.showNotification(`Shield applied: ${this.shieldAmount} for ${this.shieldDuration}s`);
            }
        }
    }
    
    /**
     * Create a shield visual effect at a position
     * @param {THREE.Vector3} position - Position to create the effect at
     * @private
     */
    _createShieldVisualEffect(position) {
        if (!this.skill.game || !this.skill.game.scene) return;
        
        // Create a shield bubble effect
        const bubbleGeometry = new THREE.SphereGeometry(1.0, 16, 16);
        const bubbleMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending
        });
        
        const bubble = new THREE.Mesh(bubbleGeometry, bubbleMaterial);
        bubble.position.copy(position);
        
        // Store animation data
        bubble.userData = {
            creationTime: this.elapsedTime,
            duration: 1.0, // Duration of the effect
            maxScale: 1.5 // Maximum scale
        };
        
        // Add to scene
        this.skill.game.scene.add(bubble);
        
        // Animate and remove the bubble
        const animateBubble = () => {
            if (!this.skill.game || !this.skill.game.scene) return;
            
            const age = this.elapsedTime - bubble.userData.creationTime;
            const progress = Math.min(1.0, age / bubble.userData.duration);
            
            // Scale up and fade out
            const scale = 1.0 + (bubble.userData.maxScale - 1.0) * progress;
            bubble.scale.set(scale, scale, scale);
            
            // Fade out
            bubble.material.opacity = 0.8 * (1 - progress);
            
            // Remove when complete
            if (progress >= 1.0) {
                this.skill.game.scene.remove(bubble);
                bubble.geometry.dispose();
                bubble.material.dispose();
            } else {
                // Continue animation in the next frame
                requestAnimationFrame(animateBubble);
            }
        };
        
        // Start the animation
        animateBubble();
    }
    
    /**
     * Dispose of the effect and clean up resources
     */
    dispose() {
        // Clean up shield bubbles
        this.shieldBubbles = [];
        
        // Clean up energy barriers
        this.energyBarriers = [];
        
        // Clean up protection symbols
        this.protectionSymbols = [];
        
        // Clear shielded entities set
        this.shieldedEntities.clear();
        
        // Call parent dispose
        super.dispose();
    }
}