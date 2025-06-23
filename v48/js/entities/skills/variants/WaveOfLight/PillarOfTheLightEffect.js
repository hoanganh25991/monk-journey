import * as THREE from 'three';
import { WaveOfLightEffect } from '../../WaveOfLightEffect.js';

/**
 * Specialized effect for Wave of Light - Pillar of the Light variant
 * Creates a sustained pillar of light that damages enemies over time
 */
export class PillarOfTheLightEffect extends WaveOfLightEffect {
    constructor(skill) {
        super(skill);
        // Override base properties for this variant
        this.pillarDuration = 5.0; // Duration of the pillar in seconds
        this.damageTickRate = 0.5; // Apply damage every 0.5 seconds
        this.damageTickTimer = 0;
    }

    /**
     * Override the base method to create a specialized effect
     * @param {THREE.Group} effectGroup - Group to add the effect to
     * @private
     */
    createWaveEffect(effectGroup) {
        // Call the parent method to create the base effect
        super.createWaveEffect(effectGroup);
        
        // Modify the effect for Pillar of the Light variant
        this._createPillarEffect(effectGroup);
    }
    
    /**
     * Create a pillar of light effect
     * @param {THREE.Group} effectGroup - Group to add the effect to
     * @private
     */
    _createPillarEffect(effectGroup) {
        // Create pillar group
        const pillarGroup = new THREE.Group();
        
        // Create main pillar beam
        const pillarHeight = 20;
        const pillarRadius = 1.0;
        const pillarGeometry = new THREE.CylinderGeometry(pillarRadius, pillarRadius, pillarHeight, 16);
        const pillarMaterial = new THREE.MeshBasicMaterial({
            color: this.skill.color || 0xffffff,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide
        });
        
        const pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
        pillar.position.y = pillarHeight / 2; // Position bottom at ground level
        pillarGroup.add(pillar);
        
        // Create inner beam
        const innerRadius = pillarRadius * 0.6;
        const innerGeometry = new THREE.CylinderGeometry(innerRadius, innerRadius, pillarHeight, 16);
        const innerMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.7,
            side: THREE.DoubleSide
        });
        
        const innerBeam = new THREE.Mesh(innerGeometry, innerMaterial);
        innerBeam.position.y = pillarHeight / 2;
        pillarGroup.add(innerBeam);
        
        // Create base circle
        const baseGeometry = new THREE.CircleGeometry(pillarRadius * 1.5, 32);
        const baseMaterial = new THREE.MeshBasicMaterial({
            color: this.skill.color || 0xffffff,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });
        
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.rotation.x = -Math.PI / 2; // Lay flat
        base.position.y = 0.05; // Just above ground
        pillarGroup.add(base);
        
        // Create energy particles
        const particleCount = 30;
        const particles = [];
        
        for (let i = 0; i < particleCount; i++) {
            const particleSize = 0.05 + Math.random() * 0.1;
            const particleGeometry = new THREE.SphereGeometry(particleSize, 8, 8);
            const particleMaterial = new THREE.MeshBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.7
            });
            
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            
            // Position randomly around pillar
            const angle = Math.random() * Math.PI * 2;
            const radius = pillarRadius * (0.5 + Math.random() * 0.8);
            const height = Math.random() * pillarHeight;
            
            particle.position.set(
                Math.cos(angle) * radius,
                height,
                Math.sin(angle) * radius
            );
            
            // Store animation data
            particle.userData = {
                orbitSpeed: 0.5 + Math.random() * 1.5,
                orbitRadius: radius,
                orbitAngle: angle,
                verticalSpeed: 0.5 + Math.random() * 1.5,
                initialHeight: height
            };
            
            pillarGroup.add(particle);
            particles.push(particle);
        }
        
        // Create light rays emanating from base
        const rayCount = 8;
        const rays = [];
        
        for (let i = 0; i < rayCount; i++) {
            const angle = (i / rayCount) * Math.PI * 2;
            const rayLength = pillarRadius * 2;
            const rayWidth = 0.2;
            
            const rayGeometry = new THREE.PlaneGeometry(rayWidth, rayLength);
            const rayMaterial = new THREE.MeshBasicMaterial({
                color: this.skill.color || 0xffffff,
                transparent: true,
                opacity: 0.5,
                side: THREE.DoubleSide
            });
            
            const ray = new THREE.Mesh(rayGeometry, rayMaterial);
            ray.position.set(
                Math.cos(angle) * rayLength / 2,
                0.1,
                Math.sin(angle) * rayLength / 2
            );
            ray.rotation.x = -Math.PI / 2; // Lay flat
            ray.rotation.z = angle;
            
            // Store animation data
            ray.userData = {
                rotationSpeed: 0.2,
                pulseSpeed: 1.0 + Math.random() * 0.5
            };
            
            pillarGroup.add(ray);
            rays.push(ray);
        }
        
        // Add pillar group to effect group
        effectGroup.add(pillarGroup);
        
        // Store references
        this.pillarGroup = pillarGroup;
        this.pillar = pillar;
        this.innerBeam = innerBeam;
        this.base = base;
        this.particles = particles;
        this.rays = rays;
        
        // Hide the bell (from parent class)
        if (effectGroup.children[0]) {
            effectGroup.children[0].visible = false;
        }
        
        // Modify bell state to use pillar behavior
        this.bellState = {
            phase: 'active', // Skip descending phase, go straight to active
            impactTime: 0,
            config: {
                bellHeight: 0 // Not used for pillar
            }
        };
    }
    
    /**
     * Override the update method to add custom behavior
     * @param {number} delta - Time since last update in seconds
     * @private
     */
    updateWaveEffect(delta) {
        // Skip parent update method to use our own behavior
        
        // Update pillar effect
        if (this.pillarGroup) {
            // Pulse pillar opacity
            if (this.pillar) {
                this.pillar.material.opacity = 0.4 + 0.2 * Math.sin(this.elapsedTime * 2);
            }
            
            // Pulse inner beam
            if (this.innerBeam) {
                this.innerBeam.material.opacity = 0.6 + 0.3 * Math.sin(this.elapsedTime * 3);
                
                // Rotate inner beam
                this.innerBeam.rotation.y += 1.0 * delta;
            }
            
            // Pulse base
            if (this.base) {
                this.base.material.opacity = 0.7 + 0.2 * Math.sin(this.elapsedTime * 2.5);
                
                // Rotate base
                this.base.rotation.z += 0.5 * delta;
            }
            
            // Update particles
            if (this.particles) {
                for (const particle of this.particles) {
                    if (particle.userData) {
                        // Orbit around pillar
                        const newAngle = particle.userData.orbitAngle + particle.userData.orbitSpeed * delta;
                        particle.userData.orbitAngle = newAngle;
                        
                        particle.position.x = Math.cos(newAngle) * particle.userData.orbitRadius;
                        particle.position.z = Math.sin(newAngle) * particle.userData.orbitRadius;
                        
                        // Move up and wrap around
                        particle.position.y += particle.userData.verticalSpeed * delta;
                        if (particle.position.y > 20) {
                            particle.position.y = 0;
                        }
                    }
                }
            }
            
            // Update rays
            if (this.rays) {
                for (const ray of this.rays) {
                    if (ray.userData) {
                        // Rotate ray
                        ray.rotation.z += ray.userData.rotationSpeed * delta;
                        
                        // Pulse ray opacity
                        ray.material.opacity = 0.3 + 0.3 * Math.sin(this.elapsedTime * ray.userData.pulseSpeed);
                    }
                }
            }
            
            // Apply damage over time
            this.damageTickTimer += delta;
            if (this.damageTickTimer >= this.damageTickRate) {
                this._applyDamageInRadius();
                this.damageTickTimer -= this.damageTickRate;
            }
        }
    }
    
    /**
     * Apply damage to enemies in the pillar radius
     * @private
     */
    _applyDamageInRadius() {
        if (!this.skill.game || !this.skill.game.enemyManager) return;
        
        const position = this.effect.position.clone();
        const damageRadius = 1.5; // Slightly larger than pillar visual radius
        
        // Get enemies in radius
        const enemies = this.skill.game.enemyManager.getEnemiesInRadius(position, damageRadius);
        
        for (const enemy of enemies) {
            // IMPORTANT: THIS CHECKED BY COLLISIONMANAGER
            // Apply damage (20% of skill damage per tick)
            // const damage = this.skill.damage * 0.2;
            // enemy.takeDamage(damage, this.skill.damageType);
            
            // Apply slow effect
            enemy.applyStatusEffect('slowed', 1.0, 0.3); // 30% slow for 1 second
            
            // Create damage number if HUD manager is available
            if (this.skill.game.hudManager) {
                this.skill.game.hudManager.createDamageNumber(damage, enemy.getPosition());
            }
        }
    }
    
    /**
     * Enhanced dispose method to properly clean up all resources
     * Overrides the base class dispose method with more thorough cleanup
     */
    dispose() {
        // Clear particle references
        if (this.particles) {
            this.particles.length = 0;
        }
        
        // Clear ray references
        if (this.rays) {
            this.rays.length = 0;
        }
        
        // Call parent dispose method
        super.dispose();
    }
}