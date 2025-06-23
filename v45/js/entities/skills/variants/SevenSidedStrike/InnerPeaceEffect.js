import * as THREE from 'three';
import { SevenSidedStrikeEffect } from '../../SevenSidedStrikeEffect.js';

/**
 * Specialized effect for Seven-Sided Strike - Inner Peace variant
 * Creates a more controlled, meditative version with healing properties
 */
export class InnerPeaceEffect extends SevenSidedStrikeEffect {
    constructor(skill) {
        super(skill);
        // Override base properties for this variant
        this.healingFactor = 0.05; // 5% healing per strike
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
        
        // Modify the effect for Inner Peace variant
        if (this.sevenSidedStrikeState) {
            // Change the strike pattern to be more symmetrical and balanced
            const radius = this.skill.radius || 5;
            
            // Reposition strike points in a perfect heptagon
            for (let i = 0; i < this.sevenSidedStrikeState.strikePoints.length; i++) {
                const point = this.sevenSidedStrikeState.strikePoints[i];
                const angle = (i / 7) * Math.PI * 2;
                
                // Update position to perfect circle
                point.position.x = Math.cos(angle) * radius;
                point.position.z = Math.sin(angle) * radius;
                
                // Update marker position
                if (point.mesh) {
                    point.mesh.position.set(point.position.x, 0.1, point.position.z);
                    point.mesh.material.color.set(0x00ffaa); // Healing green color
                }
                
                // Add healing aura to each strike point
                const healingAura = this._createHealingAura();
                healingAura.position.copy(point.position);
                healingAura.position.y += 0.1; // Slightly above ground
                healingAura.visible = false; // Hide initially
                
                // Store the healing aura in the point data
                point.healingAura = healingAura;
                effectGroup.add(healingAura);
            }
            
            // Change the vortex to a healing color
            if (this.sevenSidedStrikeState.vortex) {
                this.sevenSidedStrikeState.vortex.material.color.set(0x00ffaa); // Healing green
                this.sevenSidedStrikeState.vortex.userData.rotationSpeed *= 0.5; // Slower, more peaceful rotation
                
                // Add meditation symbol in the center
                const symbolGeometry = new THREE.CircleGeometry(1, 32);
                const symbolMaterial = new THREE.MeshBasicMaterial({
                    color: 0xffffff,
                    transparent: true,
                    opacity: 0.7,
                    side: THREE.DoubleSide
                });
                
                const symbol = new THREE.Mesh(symbolGeometry, symbolMaterial);
                symbol.rotation.x = -Math.PI / 2; // Lay flat
                symbol.position.y = -2.45; // Just above the vortex
                
                // Create lotus pattern on the symbol
                const lotusGeometry = new THREE.RingGeometry(0.3, 0.9, 8, 8, 0, Math.PI * 2);
                const lotusMaterial = new THREE.MeshBasicMaterial({
                    color: 0x00ffaa,
                    transparent: true,
                    opacity: 0.9,
                    side: THREE.DoubleSide
                });
                
                const lotus = new THREE.Mesh(lotusGeometry, lotusMaterial);
                lotus.rotation.x = -Math.PI / 2; // Lay flat
                lotus.position.y = -2.44; // Just above the symbol
                
                effectGroup.add(symbol);
                effectGroup.add(lotus);
                
                this.sevenSidedStrikeState.meditationSymbol = symbol;
                this.sevenSidedStrikeState.lotus = lotus;
            }
            
            // Add a central healing beam
            const beamGeometry = new THREE.CylinderGeometry(0.2, 0.2, 5, 16);
            const beamMaterial = new THREE.MeshBasicMaterial({
                color: 0x00ffaa,
                transparent: true,
                opacity: 0.5
            });
            
            const beam = new THREE.Mesh(beamGeometry, beamMaterial);
            beam.position.y = 2.5; // Position above the ground
            beam.rotation.x = Math.PI / 2; // Orient vertically
            
            effectGroup.add(beam);
            this.sevenSidedStrikeState.healingBeam = beam;
        }
    }
    
    /**
     * Create a healing aura for the strike points
     * @returns {THREE.Group} - The created healing aura
     * @private
     */
    _createHealingAura() {
        const auraGroup = new THREE.Group();
        
        // Create main aura circle
        const auraGeometry = new THREE.CircleGeometry(0.7, 32);
        const auraMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ffaa, // Healing green
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide
        });
        
        const aura = new THREE.Mesh(auraGeometry, auraMaterial);
        aura.rotation.x = -Math.PI / 2; // Lay flat
        auraGroup.add(aura);
        
        // Create healing particles
        const particleCount = 12;
        for (let i = 0; i < particleCount; i++) {
            const particleSize = 0.05 + Math.random() * 0.1;
            const particleGeometry = new THREE.SphereGeometry(particleSize, 8, 8);
            const particleMaterial = new THREE.MeshBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.7
            });
            
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            
            // Random position around aura
            const angle = Math.random() * Math.PI * 2;
            const radius = 0.3 + Math.random() * 0.4;
            particle.position.set(
                Math.cos(angle) * radius,
                Math.random() * 0.5,
                Math.sin(angle) * radius
            );
            
            // Store animation data
            particle.userData = {
                initialPos: particle.position.clone(),
                speed: 0.5 + Math.random() * 1.5,
                phase: Math.random() * Math.PI * 2
            };
            
            auraGroup.add(particle);
        }
        
        return auraGroup;
    }
    
    /**
     * Override the update method to add custom behavior
     * @param {number} delta - Time since last update in seconds
     * @private
     */
    _updateSevenSidedStrikeEffect(delta) {
        // Call the parent method to update the base effect
        super._updateSevenSidedStrikeEffect(delta);
        
        // Update healing effects
        if (this.sevenSidedStrikeState) {
            // Update meditation symbol
            if (this.sevenSidedStrikeState.meditationSymbol) {
                const symbol = this.sevenSidedStrikeState.meditationSymbol;
                // Gentle pulsing
                const scale = 1.0 + 0.1 * Math.sin(this.elapsedTime * 2);
                symbol.scale.set(scale, scale, 1);
            }
            
            // Update lotus
            if (this.sevenSidedStrikeState.lotus) {
                const lotus = this.sevenSidedStrikeState.lotus;
                // Slow rotation
                lotus.rotation.z += 0.2 * delta;
            }
            
            // Update healing beam
            if (this.sevenSidedStrikeState.healingBeam) {
                const beam = this.sevenSidedStrikeState.healingBeam;
                // Pulse opacity
                beam.material.opacity = 0.3 + 0.2 * Math.sin(this.elapsedTime * 3);
            }
            
            // Update healing auras at strike points
            for (const point of this.sevenSidedStrikeState.strikePoints) {
                if (point.healingAura && point.visited) {
                    // Show healing aura when point is visited
                    point.healingAura.visible = true;
                    
                    // Store the time when this point was visited
                    if (!point.visitedTime) {
                        point.visitedTime = this.elapsedTime;
                    }
                    
                    // Animate aura
                    const aura = point.healingAura.children[0];
                    if (aura) {
                        // Pulse the aura size
                        const age = this.elapsedTime - point.visitedTime;
                        const auraScale = 1.0 + 0.3 * Math.sin(age * 5);
                        aura.scale.set(auraScale, auraScale, 1);
                        
                        // Fade out over time
                        if (age > 1.0) {
                            aura.material.opacity = Math.max(0, 0.5 - (age - 1.0) * 0.5);
                        }
                    }
                    
                    // Animate particles
                    for (let i = 1; i < point.healingAura.children.length; i++) {
                        const particle = point.healingAura.children[i];
                        if (particle.userData) {
                            // Make particles float upward in a spiral
                            const initialPos = particle.userData.initialPos;
                            const speed = particle.userData.speed;
                            const phase = particle.userData.phase;
                            const age = this.elapsedTime - point.visitedTime;
                            
                            // Spiral upward motion
                            const spiralRadius = initialPos.length() * (1 - Math.min(1, age * 0.5));
                            const angle = age * speed + phase;
                            
                            particle.position.set(
                                Math.cos(angle) * spiralRadius,
                                initialPos.y + age * 0.5,
                                Math.sin(angle) * spiralRadius
                            );
                            
                            // Fade out over time
                            if (age > 0.8) {
                                particle.material.opacity = Math.max(0, 0.7 - (age - 0.8) * 0.7);
                            }
                        }
                    }
                    
                    // Apply healing effect when a new strike occurs
                    if (point.justVisited && this.skill.game && this.skill.game.player) {
                        // Apply healing to the player
                        const player = this.skill.game.player;
                        const healAmount = player.stats.maxHealth * this.healingFactor;
                        player.heal(healAmount);
                        
                        // Show healing notification
                        if (player.game && player.game.hudManager) {
                            player.game.hudManager.showNotification(`Inner Peace heals for ${Math.round(healAmount)}`);
                        }
                        
                        // Mark as processed
                        point.justVisited = false;
                    }
                }
            }
        }
    }
}