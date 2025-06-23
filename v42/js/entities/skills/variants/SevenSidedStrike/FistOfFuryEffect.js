import * as THREE from 'three';
import { SevenSidedStrikeEffect } from '../../SevenSidedStrikeEffect.js';

/**
 * Specialized effect for Seven-Sided Strike - Fist of Fury variant
 * Increases attack speed and adds fire effects to each strike
 */
export class FistOfFuryEffect extends SevenSidedStrikeEffect {
    constructor(skill) {
        super(skill);
        // Override base properties for this variant
        this.projectileSpeed = 20; // Faster than base
    }

    /**
     * Override the base method to create a specialized effect
     * @param {THREE.Group} effectGroup - Group to add the effect to
     * @param {THREE.Vector3} position - Starting position
     * @param {THREE.Vector3} direction - Direction to face
     * @private
     */
    _createSevenSidedStrikeEffect(effectGroup, position, direction) {
        // Call the parent method to create the base effect
        super._createSevenSidedStrikeEffect(effectGroup, position, direction);
        
        // Modify the effect for Fist of Fury variant
        if (this.sevenSidedStrikeState) {
            // Increase strike speed
            this.sevenSidedStrikeState.strikeDuration *= 0.7; // 30% faster strikes
            
            // Add fire effects to each strike point
            for (const point of this.sevenSidedStrikeState.strikePoints) {
                // Create fire effect at each strike point
                const fireGroup = this._createFireEffect();
                fireGroup.position.copy(point.position);
                fireGroup.position.y += 0.1; // Slightly above ground
                fireGroup.visible = false; // Hide initially
                
                // Store the fire effect in the point data
                point.fireEffect = fireGroup;
                effectGroup.add(fireGroup);
            }
        }
        
        // Change the vortex color to fiery orange/red
        if (this.sevenSidedStrikeState && this.sevenSidedStrikeState.vortex) {
            this.sevenSidedStrikeState.vortex.material.color.set(0xff4400);
        }
    }
    
    /**
     * Create a fire effect for the strike points
     * @returns {THREE.Group} - The created fire effect
     * @private
     */
    _createFireEffect() {
        const fireGroup = new THREE.Group();
        
        // Create multiple flame particles
        const flameCount = 12;
        const flameColors = [0xff4400, 0xff7700, 0xffaa00];
        
        for (let i = 0; i < flameCount; i++) {
            const flameSize = 0.1 + Math.random() * 0.2;
            const flameGeometry = new THREE.SphereGeometry(flameSize, 8, 8);
            const flameMaterial = new THREE.MeshBasicMaterial({
                color: flameColors[Math.floor(Math.random() * flameColors.length)],
                transparent: true,
                opacity: 0.7
            });
            
            const flame = new THREE.Mesh(flameGeometry, flameMaterial);
            
            // Random position around center
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 0.3;
            flame.position.set(
                Math.cos(angle) * radius,
                Math.random() * 0.5,
                Math.sin(angle) * radius
            );
            
            // Store animation data
            flame.userData = {
                initialY: flame.position.y,
                speed: 1 + Math.random() * 2,
                phase: Math.random() * Math.PI * 2
            };
            
            fireGroup.add(flame);
        }
        
        return fireGroup;
    }
    
    /**
     * Override the update method to add custom behavior
     * @param {number} delta - Time since last update in seconds
     * @private
     */
    _updateSevenSidedStrikeEffect(delta) {
        // Call the parent method to update the base effect
        super._updateSevenSidedStrikeEffect(delta);
        
        // Update fire effects
        if (this.sevenSidedStrikeState) {
            for (const point of this.sevenSidedStrikeState.strikePoints) {
                if (point.fireEffect && point.visited) {
                    // Show fire effect when point is visited
                    point.fireEffect.visible = true;
                    
                    // Animate flames
                    for (let i = 0; i < point.fireEffect.children.length; i++) {
                        const flame = point.fireEffect.children[i];
                        if (flame.userData) {
                            // Make flames rise and flicker
                            flame.position.y = flame.userData.initialY + 
                                Math.sin(this.elapsedTime * flame.userData.speed + flame.userData.phase) * 0.2;
                            
                            // Fade out over time
                            const age = this.elapsedTime - (point.visitedTime || 0);
                            if (age > 0.5) {
                                flame.material.opacity = Math.max(0, 0.7 - (age - 0.5) * 0.5);
                            }
                        }
                    }
                }
            }
        }
    }
}