import * as THREE from 'three';
import { SevenSidedStrikeEffect } from '../../SevenSidedStrikeEffect.js';

/**
 * Specialized effect for Seven-Sided Strike - Pandemonium variant
 * Creates chaotic, unpredictable strikes with teleportation effects
 */
export class PandemoniumEffect extends SevenSidedStrikeEffect {
    constructor(skill) {
        super(skill);
        // Override base properties for this variant
        this.chaosLevel = 0.8; // Level of chaos/randomness (0-1)
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
        
        // Modify the effect for Pandemonium variant
        if (this.sevenSidedStrikeState) {
            // Create chaotic strike pattern - randomize positions more
            for (const point of this.sevenSidedStrikeState.strikePoints) {
                // Add random offset to each strike point
                const randomAngle = Math.random() * Math.PI * 2;
                const randomRadius = Math.random() * this.skill.radius * 0.4;
                
                point.position.x += Math.cos(randomAngle) * randomRadius;
                point.position.z += Math.sin(randomAngle) * randomRadius;
                
                // Update the marker position to match
                if (point.mesh) {
                    point.mesh.position.set(point.position.x, 0.1, point.position.z);
                }
                
                // Add teleportation effect to each strike point
                const teleportEffect = this._createTeleportEffect();
                teleportEffect.position.copy(point.position);
                teleportEffect.position.y += 0.1; // Slightly above ground
                teleportEffect.visible = false; // Hide initially
                
                // Store the teleport effect in the point data
                point.teleportEffect = teleportEffect;
                effectGroup.add(teleportEffect);
            }
            
            // Change the vortex appearance to be more chaotic
            if (this.sevenSidedStrikeState.vortex) {
                // Make the vortex more distorted and chaotic
                this.sevenSidedStrikeState.vortex.material.color.set(0x9900ff); // Purple for chaos
                this.sevenSidedStrikeState.vortex.userData.rotationSpeed *= 2.5; // Faster rotation
                
                // Add distortion effect to vortex
                const distortionGeometry = new THREE.RingGeometry(0.3, 1.8, 32);
                const distortionMaterial = new THREE.MeshBasicMaterial({
                    color: 0x9900ff,
                    transparent: true,
                    opacity: 0.5,
                    side: THREE.DoubleSide
                });
                
                const distortion = new THREE.Mesh(distortionGeometry, distortionMaterial);
                distortion.rotation.x = -Math.PI / 2; // Lay flat
                distortion.position.y = -2.4; // Slightly above the main vortex
                
                // Store rotation data for animation
                distortion.userData = {
                    rotationSpeed: -3.0 // Rotate in opposite direction
                };
                
                effectGroup.add(distortion);
                this.sevenSidedStrikeState.distortionRing = distortion;
            }
        }
    }
    
    /**
     * Create a teleportation effect for the strike points
     * @returns {THREE.Group} - The created teleport effect
     * @private
     */
    _createTeleportEffect() {
        const teleportGroup = new THREE.Group();
        
        // Create portal ring
        const portalGeometry = new THREE.RingGeometry(0.3, 0.5, 24);
        const portalMaterial = new THREE.MeshBasicMaterial({
            color: 0x9900ff, // Purple
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });
        
        const portal = new THREE.Mesh(portalGeometry, portalMaterial);
        portal.rotation.x = -Math.PI / 2; // Lay flat
        teleportGroup.add(portal);
        
        // Create energy particles around the portal
        const particleCount = 15;
        for (let i = 0; i < particleCount; i++) {
            const particleSize = 0.05 + Math.random() * 0.1;
            const particleGeometry = new THREE.SphereGeometry(particleSize, 8, 8);
            const particleMaterial = new THREE.MeshBasicMaterial({
                color: 0xcc00ff,
                transparent: true,
                opacity: 0.7
            });
            
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            
            // Random position around portal
            const angle = Math.random() * Math.PI * 2;
            const radius = 0.4 + Math.random() * 0.3;
            particle.position.set(
                Math.cos(angle) * radius,
                Math.random() * 0.5,
                Math.sin(angle) * radius
            );
            
            // Store animation data
            particle.userData = {
                initialPos: particle.position.clone(),
                speed: 1 + Math.random() * 3,
                phase: Math.random() * Math.PI * 2
            };
            
            teleportGroup.add(particle);
        }
        
        return teleportGroup;
    }
    
    /**
     * Override the update method to add custom behavior
     * @param {number} delta - Time since last update in seconds
     * @private
     */
    _updateSevenSidedStrikeEffect(delta) {
        // Call the parent method to update the base effect
        super._updateSevenSidedStrikeEffect(delta);
        
        // Update teleport effects
        if (this.sevenSidedStrikeState) {
            // Update distortion ring
            if (this.sevenSidedStrikeState.distortionRing) {
                const ring = this.sevenSidedStrikeState.distortionRing;
                ring.rotation.z += ring.userData.rotationSpeed * delta;
                
                // Make the ring pulse
                const scale = 1.0 + 0.2 * Math.sin(this.elapsedTime * 5);
                ring.scale.set(scale, scale, 1);
            }
            
            // Update teleport effects at strike points
            for (const point of this.sevenSidedStrikeState.strikePoints) {
                if (point.teleportEffect && point.visited) {
                    // Show teleport effect when point is visited
                    point.teleportEffect.visible = true;
                    
                    // Store the time when this point was visited
                    if (!point.visitedTime) {
                        point.visitedTime = this.elapsedTime;
                    }
                    
                    // Animate portal
                    const portal = point.teleportEffect.children[0];
                    if (portal) {
                        // Rotate the portal
                        portal.rotation.z += 3.0 * delta;
                        
                        // Pulse the portal size
                        const age = this.elapsedTime - point.visitedTime;
                        const portalScale = 1.0 + 0.5 * Math.sin(age * 10);
                        portal.scale.set(portalScale, portalScale, 1);
                        
                        // Fade out over time
                        if (age > 0.3) {
                            portal.material.opacity = Math.max(0, 0.8 - (age - 0.3) * 2);
                        }
                    }
                    
                    // Animate particles
                    for (let i = 1; i < point.teleportEffect.children.length; i++) {
                        const particle = point.teleportEffect.children[i];
                        if (particle.userData) {
                            // Make particles orbit and pulse
                            const initialPos = particle.userData.initialPos;
                            const speed = particle.userData.speed;
                            const phase = particle.userData.phase;
                            const age = this.elapsedTime - point.visitedTime;
                            
                            // Spiral outward motion
                            const spiralRadius = initialPos.length() + age * 2;
                            const angle = age * speed + phase;
                            
                            particle.position.set(
                                Math.cos(angle) * spiralRadius,
                                initialPos.y + age * 0.5,
                                Math.sin(angle) * spiralRadius
                            );
                            
                            // Fade out over time
                            if (age > 0.2) {
                                particle.material.opacity = Math.max(0, 0.7 - (age - 0.2) * 1.5);
                            }
                        }
                    }
                }
            }
        }
    }
}