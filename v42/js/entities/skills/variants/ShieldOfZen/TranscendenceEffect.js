import * as THREE from 'three';
import { ShieldOfZenEffect } from '../../ShieldOfZenEffect.js';

/**
 * Specialized effect for Shield of Zen - Transcendence variant
 * Creates a shield that allows the player to phase through enemies and obstacles
 */
export class TranscendenceEffect extends ShieldOfZenEffect {
    constructor(skill) {
        super(skill);
        // Override base properties for this variant
        this.damageReduction = 0.15; // 15% damage reduction
        this.damageReflection = 0; // No damage reflection
        this.phaseThrough = true; // Can phase through enemies and obstacles
        this.speedBoost = 0.3; // 30% movement speed boost
    }

    /**
     * Override the base method to create a specialized effect
     * @param {THREE.Group} effectGroup - Group to add the effect to
     * @param {THREE.Vector3} position - Player position
     * @param {THREE.Vector3} direction - Player direction
     * @private
     */
    _createShieldOfZenEffect(effectGroup, position, direction) {
        // Call the parent method to create the base effect
        super._createShieldOfZenEffect(effectGroup, position, direction);
        
        // Create transcendence effect
        this._createTranscendenceEffect(effectGroup);
    }
    
    /**
     * Create a transcendence effect
     * @param {THREE.Group} effectGroup - Group to add the effect to
     * @private
     */
    _createTranscendenceEffect(effectGroup) {
        // Create aura group
        const auraGroup = new THREE.Group();
        
        // Create transcendence shield using sphere geometry
        const shieldGeometry = new THREE.SphereGeometry(2.2, 32, 32);
        const shieldMaterial = new THREE.MeshStandardMaterial({
            color: 0x88ccff, // Light blue
            transparent: true,
            opacity: 0.2,
            emissive: 0x88ccff,
            emissiveIntensity: 0.3,
            side: THREE.DoubleSide,
            wireframe: true
        });
        
        const shield = new THREE.Mesh(shieldGeometry, shieldMaterial);
        auraGroup.add(shield);
        
        // Create inner shield
        const innerShieldGeometry = new THREE.SphereGeometry(2.0, 16, 16);
        const innerShieldMaterial = new THREE.MeshStandardMaterial({
            color: 0xaaddff,
            transparent: true,
            opacity: 0.1,
            side: THREE.DoubleSide
        });
        
        const innerShield = new THREE.Mesh(innerShieldGeometry, innerShieldMaterial);
        auraGroup.add(innerShield);
        
        // Create ethereal particles
        const particleCount = 40;
        const particles = [];
        
        for (let i = 0; i < particleCount; i++) {
            const particleSize = 0.05 + Math.random() * 0.1;
            const particleGeometry = new THREE.SphereGeometry(particleSize, 8, 8);
            const particleMaterial = new THREE.MeshBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.5 + Math.random() * 0.3
            });
            
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            
            // Position randomly inside shield
            const phi = Math.random() * Math.PI * 2;
            const theta = Math.random() * Math.PI;
            const radius = Math.random() * 2.0;
            
            particle.position.set(
                radius * Math.sin(theta) * Math.cos(phi),
                radius * Math.sin(theta) * Math.sin(phi),
                radius * Math.cos(theta)
            );
            
            // Store animation data
            particle.userData = {
                initialPos: particle.position.clone(),
                speed: 0.2 + Math.random() * 0.3,
                direction: new THREE.Vector3(
                    Math.random() - 0.5,
                    Math.random() - 0.5,
                    Math.random() - 0.5
                ).normalize(),
                distance: 0.3 + Math.random() * 0.7
            };
            
            auraGroup.add(particle);
            particles.push(particle);
        }
        
        // Create phase trail effect
        const trailGeometry = new THREE.PlaneGeometry(1, 2);
        const trailMaterial = new THREE.MeshBasicMaterial({
            color: 0x88ccff,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
        });
        
        const trail = new THREE.Mesh(trailGeometry, trailMaterial);
        trail.rotation.x = -Math.PI / 2; // Lay flat
        trail.position.z = -1; // Behind player
        trail.visible = false; // Hide initially
        
        auraGroup.add(trail);
        
        // Add aura group to effect group
        effectGroup.add(auraGroup);
        
        // Store references
        this.aura = auraGroup;
        this.shield = shield;
        this.innerShield = innerShield;
        this.particles = particles;
        this.trail = trail;
        this.lastPlayerPosition = null;
        this.isMoving = false;
    }
    
    /**
     * Override the update method to add custom behavior
     * @param {number} delta - Time since last update in seconds
     * @private
     */
    _updateShieldOfZenEffect(delta) {
        // Call the parent method to update the base effect
        super._updateShieldOfZenEffect(delta);
        
        // Update transcendence shield
        if (this.shield) {
            // Rotate shield slowly
            this.shield.rotation.y += 0.1 * delta;
            this.shield.rotation.x += 0.05 * delta;
            
            // Pulse shield opacity
            this.shield.material.opacity = 0.1 + 0.1 * Math.sin(this.elapsedTime * 1.0);
        }
        
        // Update inner shield
        if (this.innerShield) {
            // Rotate in opposite direction
            this.innerShield.rotation.y -= 0.08 * delta;
            this.innerShield.rotation.x -= 0.04 * delta;
            
            // Pulse inner shield
            const scale = 0.9 + 0.1 * Math.sin(this.elapsedTime * 0.8);
            this.innerShield.scale.set(scale, scale, scale);
        }
        
        // Update ethereal particles
        if (this.particles) {
            for (const particle of this.particles) {
                if (particle.userData) {
                    // Move particle in its direction
                    const moveAmount = particle.userData.speed * delta;
                    particle.position.add(particle.userData.direction.clone().multiplyScalar(moveAmount));
                    
                    // If particle moves too far from initial position, reverse direction
                    const distance = particle.position.distanceTo(particle.userData.initialPos);
                    if (distance > particle.userData.distance) {
                        particle.userData.direction.multiplyScalar(-1);
                    }
                    
                    // Fade particles based on distance from center
                    const distanceFromCenter = particle.position.length();
                    if (distanceFromCenter > 2.0) {
                        particle.material.opacity = Math.max(0, 0.8 - (distanceFromCenter - 2.0) * 2);
                    } else {
                        particle.material.opacity = 0.5 + 0.3 * Math.sin(this.elapsedTime * 2 + particle.userData.speed * 10);
                    }
                }
            }
        }
        
        // Update phase trail
        if (this.trail && this.skill.game && this.skill.game.player) {
            const player = this.skill.game.player;
            const currentPosition = player.movement.getPosition().clone();
            
            // Check if player is moving
            if (this.lastPlayerPosition) {
                const moveDistance = currentPosition.distanceTo(this.lastPlayerPosition);
                this.isMoving = moveDistance > 0.01;
            }
            
            // Update last position
            this.lastPlayerPosition = currentPosition.clone();
            
            // Show trail when moving
            this.trail.visible = this.isMoving;
            
            if (this.isMoving) {
                // Get player direction
                const playerRotation = player.movement.getRotation();
                const playerDirection = new THREE.Vector3(
                    Math.sin(playerRotation.y),
                    0,
                    Math.cos(playerRotation.y)
                );
                
                // Position trail behind player
                this.trail.position.copy(playerDirection.clone().multiplyScalar(-1));
                
                // Rotate trail to face player direction
                this.trail.rotation.z = -playerRotation.y;
                
                // Scale trail based on speed
                const speedScale = 1.0 + player.movement.getCurrentSpeed() * 0.2;
                this.trail.scale.set(speedScale, speedScale * 2, 1);
                
                // Adjust opacity based on speed
                this.trail.material.opacity = 0.2 + player.movement.getCurrentSpeed() * 0.1;
            }
        }
        
        // Apply phase through effect
        if (this.phaseThrough && this.skill.game && this.skill.game.player) {
            const player = this.skill.game.player;
            
            // Set player to phase through mode
            player.phaseThrough = true;
            
            // Apply speed boost
            if (this.speedBoost > 0) {
                player.movement.applySpeedBoost(this.speedBoost);
            }
            
            // Make player slightly transparent
            if (player.model) {
                player.model.traverse(child => {
                    if (child.isMesh && child.material) {
                        // Make sure material is set to transparent
                        child.material.transparent = true;
                        
                        // Set opacity
                        child.material.opacity = 0.7;
                    }
                });
            }
        }
    }
    
    /**
     * Enhanced dispose method to properly clean up all resources
     * Overrides the base class dispose method with more thorough cleanup
     */
    dispose() {
        // Remove phase through effect from player
        if (this.phaseThrough && this.skill.game && this.skill.game.player) {
            const player = this.skill.game.player;
            
            // Remove phase through mode
            player.phaseThrough = false;
            
            // Remove speed boost
            if (this.speedBoost > 0) {
                player.movement.removeSpeedBoost(this.speedBoost);
            }
            
            // Restore player opacity
            if (player.model) {
                player.model.traverse(child => {
                    if (child.isMesh && child.material) {
                        child.material.opacity = 1.0;
                    }
                });
            }
        }
        
        // Call parent dispose method
        super.dispose();
    }
}