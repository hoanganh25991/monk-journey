import * as THREE from 'three';
import { SevenSidedStrikeEffect } from '../../SevenSidedStrikeEffect.js';

/**
 * Specialized effect for Seven-Sided Strike - Sustained Assault variant
 * Increases the number of strikes and duration
 */
export class SustainedAssaultEffect extends SevenSidedStrikeEffect {
    constructor(skill) {
        super(skill);
        // Override base properties for this variant
        this.extraStrikes = 3; // Additional strikes beyond the base 7
    }

    /**
     * Override the base method to create a specialized effect
     * @param {THREE.Group} effectGroup - Group to add the effect to
     * @param {THREE.Vector3} position - Starting position
     * @param {THREE.Vector3} direction - Direction to face
     * @private
     */
    _createSevenSidedStrikeEffect(effectGroup, position, direction) {
        // Temporarily modify the skill to have more hits
        const originalHits = this.skill.hits;
        this.skill.hits = originalHits + this.extraStrikes;
        
        // Call the parent method to create the base effect with more strike points
        super._createSevenSidedStrikeEffect(effectGroup, position, direction);
        
        // Restore original hits value
        this.skill.hits = originalHits;
        
        // Modify the effect for Sustained Assault variant
        if (this.sevenSidedStrikeState) {
            // Adjust strike duration to maintain overall skill duration
            this.sevenSidedStrikeState.strikeDuration = this.skill.duration / (originalHits + this.extraStrikes) / 5;
            
            // Add trail effects between strike points
            this._createTrailEffects(effectGroup);
        }
        
        // Change the vortex color to a more intense version of the skill color
        if (this.sevenSidedStrikeState && this.sevenSidedStrikeState.vortex) {
            // Create a brighter version of the skill color
            const color = new THREE.Color(this.skill.color);
            color.multiplyScalar(1.5); // Make it brighter
            this.sevenSidedStrikeState.vortex.material.color = color;
        }
    }
    
    /**
     * Create trail effects between strike points
     * @param {THREE.Group} effectGroup - Group to add the effects to
     * @private
     */
    _createTrailEffects(effectGroup) {
        const trailGroup = new THREE.Group();
        
        // Create trails between adjacent strike points
        const points = this.sevenSidedStrikeState.strikePoints;
        for (let i = 0; i < points.length; i++) {
            const startPoint = points[i].position;
            const endPoint = points[(i + 1) % points.length].position;
            
            // Create a curved path between points
            const controlPoint = new THREE.Vector3(
                (startPoint.x + endPoint.x) / 2,
                0.5 + Math.random() * 0.5, // Random height
                (startPoint.z + endPoint.z) / 2
            );
            
            // Create a quadratic curve
            const curve = new THREE.QuadraticBezierCurve3(
                startPoint.clone(),
                controlPoint,
                endPoint.clone()
            );
            
            // Create a tube along the curve
            const tubeGeometry = new THREE.TubeGeometry(curve, 20, 0.05, 8, false);
            const tubeMaterial = new THREE.MeshBasicMaterial({
                color: this.skill.color,
                transparent: true,
                opacity: 0.3
            });
            
            const tube = new THREE.Mesh(tubeGeometry, tubeMaterial);
            tube.userData = {
                isTrail: true,
                startIndex: i,
                endIndex: (i + 1) % points.length,
                opacity: 0.3
            };
            
            trailGroup.add(tube);
        }
        
        // Add the trail group to the effect group
        effectGroup.add(trailGroup);
        
        // Store reference to trail group
        this.sevenSidedStrikeState.trailGroup = trailGroup;
    }
    
    /**
     * Override the update method to add custom behavior
     * @param {number} delta - Time since last update in seconds
     * @private
     */
    _updateSevenSidedStrikeEffect(delta) {
        // Call the parent method to update the base effect
        super._updateSevenSidedStrikeEffect(delta);
        
        // Update trail effects
        if (this.sevenSidedStrikeState && this.sevenSidedStrikeState.trailGroup) {
            const trailGroup = this.sevenSidedStrikeState.trailGroup;
            
            // Calculate which trails should be visible based on current strike
            const currentStrike = this.sevenSidedStrikeState.currentStrike;
            
            for (let i = 0; i < trailGroup.children.length; i++) {
                const trail = trailGroup.children[i];
                if (trail.userData && trail.userData.isTrail) {
                    // Make trails pulse based on elapsed time
                    const pulseFrequency = 2.0;
                    const pulseAmount = 0.2;
                    const baseOpacity = trail.userData.opacity;
                    
                    trail.material.opacity = baseOpacity + 
                        Math.sin(this.elapsedTime * pulseFrequency) * pulseAmount;
                    
                    // Highlight the trail connected to the current strike point
                    if (trail.userData.startIndex === currentStrike || 
                        trail.userData.endIndex === currentStrike) {
                        trail.material.opacity = 0.7;
                        trail.material.color.set(0xffffff); // Highlight color
                    } else {
                        trail.material.color.set(this.skill.color);
                    }
                }
            }
        }
    }
}