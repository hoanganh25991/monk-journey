import * as THREE from 'three';
import { BreathOfHeavenEffect } from '../../BreathOfHeavenEffect.js';

/**
 * Effect for the Radiant Breath variant of Breath of Heaven
 * Creates a blinding aura that heals allies and blinds enemies
 * Visual style: Intense light rays and pulsing brightness
 */
export class RadiantBreathEffect extends BreathOfHeavenEffect {
    constructor(skill) {
        super(skill);
        
        // Variant-specific properties
        this.blindEffect = true;
        this.blindDuration = 3; // 3 seconds of blindness
        
        // Visual properties
        this.lightRays = [];
        this.pulseSpeed = 1.5; // Speed of light pulsing
    }

    /**
     * Create the Radiant Breath effect
     * @param {THREE.Vector3} position - Position to create the effect at
     * @param {THREE.Vector3} direction - Direction the effect should face
     * @returns {THREE.Group} - The created effect
     */
    create(position, direction) {
        // Create base effect first
        const effectGroup = super.create(position, direction);
        
        // Change the base aura to be more intense
        const baseAura = effectGroup.children[0];
        baseAura.material.color = new THREE.Color(0xffffcc); // Yellowish-white
        baseAura.material.opacity = 0.5; // More visible
        
        // Add light rays
        this.addLightRays(effectGroup);
        
        // Add central light source
        this.addCentralLight(effectGroup);
        
        return effectGroup;
    }
    
    /**
     * Add light rays to the effect
     * @param {THREE.Group} group - The group to add light rays to
     */
    addLightRays(group) {
        const rayCount = 12;
        const baseRadius = this.skill.radius;
        
        for (let i = 0; i < rayCount; i++) {
            // Create a light ray
            const ray = this.createLightRay();
            
            // Position around a circle
            const angle = (i / rayCount) * Math.PI * 2;
            ray.position.x = Math.cos(angle) * (baseRadius * 0.3);
            ray.position.z = Math.sin(angle) * (baseRadius * 0.3);
            ray.position.y = 0.5;
            
            // Rotate to point outward
            ray.rotation.y = angle;
            
            // Store initial angle for animation
            ray.userData.angle = angle;
            ray.userData.pulseOffset = Math.random() * Math.PI * 2;
            
            group.add(ray);
            this.lightRays.push(ray);
        }
    }
    
    /**
     * Create a stylized light ray using simple geometries
     * @returns {THREE.Group} - The created light ray
     */
    createLightRay() {
        const rayGroup = new THREE.Group();
        
        // Create the main ray using a scaled box
        const rayGeometry = new THREE.BoxGeometry(0.1, 0.2, this.skill.radius);
        const rayMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffdd,
            transparent: true,
            opacity: 0.7,
            blending: THREE.AdditiveBlending
        });
        
        const ray = new THREE.Mesh(rayGeometry, rayMaterial);
        ray.position.z = this.skill.radius / 2; // Center the ray
        rayGroup.add(ray);
        
        // Add a glow effect at the base
        const glowGeometry = new THREE.SphereGeometry(0.2, 8, 8);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffaa,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });
        
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        rayGroup.add(glow);
        
        return rayGroup;
    }
    
    /**
     * Add a central light source to the effect
     * @param {THREE.Group} group - The group to add the central light to
     */
    addCentralLight(group) {
        // Create a bright sphere in the center
        const lightGeometry = new THREE.SphereGeometry(0.5, 16, 16);
        const lightMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending
        });
        
        const light = new THREE.Mesh(lightGeometry, lightMaterial);
        light.position.y = 1;
        
        group.add(light);
        
        // Store for animation
        this.centralLight = light;
    }
    
    /**
     * Update the Radiant Breath effect
     * @param {number} delta - Time since last update in seconds
     */
    update(delta) {
        super.update(delta);
        
        if (this.isActive && this.effect) {
            // Pulse the central light
            if (this.centralLight) {
                const pulseFactor = 1 + 0.3 * Math.sin(this.elapsedTime * this.pulseSpeed * 2);
                this.centralLight.scale.set(pulseFactor, pulseFactor, pulseFactor);
                
                // Also pulse the opacity
                this.centralLight.material.opacity = 0.7 + 0.3 * Math.sin(this.elapsedTime * this.pulseSpeed * 3);
            }
            
            // Animate light rays
            this.lightRays.forEach(ray => {
                const angle = ray.userData.angle || 0;
                const pulseOffset = ray.userData.pulseOffset || 0;
                
                // Rotate the rays slowly
                ray.rotation.y = angle + this.elapsedTime * 0.2;
                
                // Pulse the ray length
                const pulseFactor = 1 + 0.2 * Math.sin(this.elapsedTime * this.pulseSpeed + pulseOffset);
                ray.children[0].scale.z = pulseFactor;
                
                // Pulse the glow
                ray.children[1].scale.set(pulseFactor, pulseFactor, pulseFactor);
            });
        }
    }
    
    /**
     * Apply healing and blinding effects
     */
    applyHealingEffect() {
        // Call parent method to apply healing
        super.applyHealingEffect();
        
        // Apply blinding effect to enemies
        if (this.blindEffect && this.skill.game && this.skill.game.enemyManager) {
            const damagePosition = this.effect.position.clone();
            
            const enemies = this.skill.game.enemyManager.getEnemiesNearPosition(
                damagePosition,
                this.skill.radius
            );
            
            enemies.forEach(enemy => {
                // Apply blind status effect if enemy has the method
                if (enemy.addStatusEffect) {
                    enemy.addStatusEffect('blind', this.blindDuration);
                }
            });
        }
    }
    
    /**
     * Dispose of the effect and clean up resources
     */
    dispose() {
        // Clear light rays array
        this.lightRays = [];
        this.centralLight = null;
        
        // Call parent dispose
        super.dispose();
    }
}