import * as THREE from 'three';
import { FlyingKickEffect } from '../../FlyingKickEffect.js';

/**
 * Effect for the Spokes of the Wheel variant of Flying Kick
 * Adds a temporary damage boost after using Flying Kick
 * Visual style: Wheel-like energy patterns that radiate outward
 */
export class SpokesOfTheWheelEffect extends FlyingKickEffect {
    constructor(skill) {
        super(skill);
        
        // Variant-specific properties
        this.damageBoostPercentage = 0.1; // 10% damage boost
        this.boostDuration = 5; // 5 seconds of damage boost
        this.boostActive = false;
        this.boostStartTime = 0;
        
        // Visual properties
        this.wheelSpokes = [];
        this.spokeCount = 8;
        this.wheelColor = new THREE.Color(0xffd700); // Golden color
        this.wheelRadius = 0.8;
        this.rotationSpeed = 1.5;
    }

    /**
     * Create the Spokes of the Wheel effect
     * @param {THREE.Vector3} position - Position to create the effect at
     * @param {THREE.Vector3} direction - Direction the effect should face
     * @returns {THREE.Group} - The created effect
     */
    create(position, direction) {
        // Create base effect first
        const effectGroup = super.create(position, direction);
        
        // Add wheel spokes effect
        this.addWheelSpokesEffect(effectGroup);
        
        // Change the color of the base effect to be more golden
        effectGroup.traverse(child => {
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(mat => {
                        mat.color.lerp(this.wheelColor, 0.5);
                        mat.emissive = this.wheelColor.clone().multiplyScalar(0.3);
                    });
                } else {
                    child.material.color.lerp(this.wheelColor, 0.5);
                    if (child.material.emissive) {
                        child.material.emissive = this.wheelColor.clone().multiplyScalar(0.3);
                    }
                }
            }
        });
        
        return effectGroup;
    }
    
    /**
     * Add wheel spokes effect to the effect group
     * @param {THREE.Group} group - The group to add the effect to
     */
    addWheelSpokesEffect(group) {
        // Create a group for the wheel spokes
        const wheelGroup = new THREE.Group();
        
        // Create spokes
        for (let i = 0; i < this.spokeCount; i++) {
            const angle = (i / this.spokeCount) * Math.PI * 2;
            
            // Create spoke geometry
            const spokeGeometry = new THREE.BoxGeometry(0.1, 0.1, this.wheelRadius * 2);
            const spokeMaterial = new THREE.MeshStandardMaterial({
                color: this.wheelColor,
                emissive: this.wheelColor,
                emissiveIntensity: 1.0,
                transparent: true,
                opacity: 0.8
            });
            
            const spoke = new THREE.Mesh(spokeGeometry, spokeMaterial);
            
            // Position and rotate spoke
            spoke.position.set(
                Math.sin(angle) * this.wheelRadius,
                Math.cos(angle) * this.wheelRadius,
                0
            );
            spoke.rotation.z = angle;
            
            // Add to wheel group
            wheelGroup.add(spoke);
            this.wheelSpokes.push(spoke);
        }
        
        // Create outer ring
        const ringGeometry = new THREE.TorusGeometry(this.wheelRadius, 0.1, 8, 32);
        const ringMaterial = new THREE.MeshStandardMaterial({
            color: this.wheelColor,
            emissive: this.wheelColor,
            emissiveIntensity: 1.0,
            transparent: true,
            opacity: 0.8
        });
        
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        wheelGroup.add(ring);
        
        // Create inner hub
        const hubGeometry = new THREE.SphereGeometry(0.3, 16, 16);
        const hubMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            emissive: this.wheelColor,
            emissiveIntensity: 1.5,
            transparent: true,
            opacity: 0.9
        });
        
        const hub = new THREE.Mesh(hubGeometry, hubMaterial);
        wheelGroup.add(hub);
        
        // Position wheel group at the front of the effect
        wheelGroup.position.z = -1.5;
        wheelGroup.rotation.y = Math.PI / 2;
        
        // Add wheel group to main effect group
        group.add(wheelGroup);
        
        // Store for animation
        this.wheelGroup = wheelGroup;
    }
    
    /**
     * Update the Spokes of the Wheel effect
     * @param {number} delta - Time since last update in seconds
     */
    update(delta) {
        super.update(delta);
        
        // Update wheel rotation
        if (this.wheelGroup) {
            this.wheelGroup.rotation.z += this.rotationSpeed * delta;
            
            // Pulse the wheel
            const pulseScale = 1 + Math.sin(this.elapsedTime * 3) * 0.1;
            this.wheelGroup.scale.set(pulseScale, pulseScale, 1);
        }
        
        // Check if the effect has ended and we need to apply the damage boost
        if (!this.isActive && !this.boostActive && this.elapsedTime > 0) {
            this.activateDamageBoost();
        }
        
        // Update damage boost duration
        if (this.boostActive) {
            const boostElapsedTime = this.elapsedTime - this.boostStartTime;
            
            if (boostElapsedTime >= this.boostDuration) {
                this.deactivateDamageBoost();
            } else {
                // Create visual feedback for active boost if player is available
                this.updateBoostVisuals(delta);
            }
        }
    }
    
    /**
     * Activate the damage boost effect
     */
    activateDamageBoost() {
        if (this.game && this.game.player) {
            // Store the boost start time
            this.boostStartTime = this.elapsedTime;
            this.boostActive = true;
            
            // Apply damage boost to player
            if (this.game.player.addDamageBoost) {
                this.game.player.addDamageBoost('spokesOfTheWheel', this.damageBoostPercentage, this.boostDuration);
            }
            
            // Create visual effect for boost activation
            this.createBoostActivationEffect();
            
            console.debug(`Activated Spokes of the Wheel damage boost: +${this.damageBoostPercentage * 100}% for ${this.boostDuration}s`);
        }
    }
    
    /**
     * Deactivate the damage boost effect
     */
    deactivateDamageBoost() {
        if (this.game && this.game.player && this.boostActive) {
            this.boostActive = false;
            
            // Remove damage boost from player
            if (this.game.player.removeDamageBoost) {
                this.game.player.removeDamageBoost('spokesOfTheWheel');
            }
            
            console.debug('Deactivated Spokes of the Wheel damage boost');
        }
    }
    
    /**
     * Create a visual effect when the boost is activated
     */
    createBoostActivationEffect() {
        if (!this.game || !this.game.player || !this.game.scene) return;
        
        // Create a burst of energy around the player
        const burstGeometry = new THREE.SphereGeometry(1, 16, 16);
        const burstMaterial = new THREE.MeshBasicMaterial({
            color: this.wheelColor,
            transparent: true,
            opacity: 0.7,
            side: THREE.DoubleSide
        });
        
        const burst = new THREE.Mesh(burstGeometry, burstMaterial);
        burst.position.copy(this.game.player.position);
        burst.position.y += 1; // Position at player's center
        burst.scale.set(0.1, 0.1, 0.1);
        
        this.game.scene.add(burst);
        
        // Animate the burst
        const expandDuration = 0.5; // seconds
        const expandScale = 5;
        
        // Store initial time
        burst.userData.creationTime = this.elapsedTime;
        burst.userData.expandDuration = expandDuration;
        burst.userData.expandScale = expandScale;
        
        // Add to tracked objects
        if (!this.boostVisuals) this.boostVisuals = [];
        this.boostVisuals.push(burst);
    }
    
    /**
     * Update visual effects for the active damage boost
     * @param {number} delta - Time since last update in seconds
     */
    updateBoostVisuals(delta) {
        if (!this.boostVisuals || !this.game) return;
        
        // Update existing boost visuals
        for (let i = this.boostVisuals.length - 1; i >= 0; i--) {
            const visual = this.boostVisuals[i];
            const age = this.elapsedTime - visual.userData.creationTime;
            
            if (age >= visual.userData.expandDuration) {
                // Remove completed visuals
                if (this.game.scene) {
                    this.game.scene.remove(visual);
                }
                if (visual.geometry) visual.geometry.dispose();
                if (visual.material) visual.material.dispose();
                this.boostVisuals.splice(i, 1);
            } else {
                // Animate expansion
                const progress = age / visual.userData.expandDuration;
                const currentScale = visual.userData.expandScale * progress;
                visual.scale.set(currentScale, currentScale, currentScale);
                
                // Fade out
                visual.material.opacity = 0.7 * (1 - progress);
            }
        }
        
        // Create periodic pulses around the player while boost is active
        const boostElapsedTime = this.elapsedTime - this.boostStartTime;
        const pulseInterval = 1.0; // Create a new pulse every second
        
        if (Math.floor(boostElapsedTime / pulseInterval) > 
            Math.floor((boostElapsedTime - delta) / pulseInterval)) {
            this.createBoostPulse();
        }
    }
    
    /**
     * Create a pulse effect around the player while boost is active
     */
    createBoostPulse() {
        if (!this.game || !this.game.player || !this.game.scene || !this.boostActive) return;
        
        // Create a ring pulse around the player
        const ringGeometry = new THREE.RingGeometry(0.5, 0.7, 32);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: this.wheelColor,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide
        });
        
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.position.copy(this.game.player.position);
        ring.position.y += 0.1; // Just above ground
        ring.rotation.x = -Math.PI / 2; // Lay flat
        
        this.game.scene.add(ring);
        
        // Animate the ring
        const expandDuration = 1.0; // seconds
        const expandScale = 8;
        
        // Store initial time
        ring.userData.creationTime = this.elapsedTime;
        ring.userData.expandDuration = expandDuration;
        ring.userData.expandScale = expandScale;
        
        // Add to tracked objects
        if (!this.boostVisuals) this.boostVisuals = [];
        this.boostVisuals.push(ring);
    }
    
    /**
     * Dispose of the effect and clean up resources
     */
    dispose() {
        // Clean up wheel spokes
        this.wheelSpokes = [];
        this.wheelGroup = null;
        
        // Clean up boost visuals
        if (this.boostVisuals) {
            this.boostVisuals.forEach(visual => {
                if (this.game && this.game.scene) {
                    this.game.scene.remove(visual);
                }
                if (visual.geometry) visual.geometry.dispose();
                if (visual.material) visual.material.dispose();
            });
            this.boostVisuals = [];
        }
        
        // Ensure damage boost is removed if effect is disposed before boost ends
        if (this.boostActive) {
            this.deactivateDamageBoost();
        }
        
        // Call parent dispose
        super.dispose();
    }
}