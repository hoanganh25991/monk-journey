import * as THREE from 'three';
import { WaveStrikeEffect } from '../../WaveStrikeEffect.js';

/**
 * Specialized effect for Wave Strike - Tidal Wave variant
 * Creates a larger wave that pushes enemies back
 */
export class TidalWaveEffect extends WaveStrikeEffect {
    constructor(skill) {
        super(skill);
        // Override base properties for this variant
        this.waveWidth = 5.0; // Wider wave
        this.waveHeight = 2.5; // Taller wave
        this.knockbackForce = 5.0; // Force of knockback
    }

    /**
     * Override the base method to create a specialized effect
     * @param {THREE.Group} effectGroup - Group to add the effect to
     * @private
     */
    createWaveStrikeEffect(effectGroup) {
        // Call the parent method to create the base effect
        super.createWaveStrikeEffect(effectGroup);
        
        // Modify the effect for Tidal Wave variant
        this._enhanceWaveEffect(effectGroup);
    }
    
    /**
     * Enhance the wave effect for tidal wave variant
     * @param {THREE.Group} effectGroup - Group to add the effect to
     * @private
     */
    _enhanceWaveEffect(effectGroup) {
        // Get the wave group (first child of effect group)
        const waveGroup = effectGroup.children[0];
        
        if (waveGroup) {
            // Scale up the wave
            waveGroup.scale.set(2.0, 1.5, 1.5);
            
            // Modify wave appearance
            waveGroup.traverse(child => {
                if (child.isMesh && child.material) {
                    // Change color to deeper blue
                    if (child.material.color) {
                        child.material.color.set(0x0066aa);
                    }
                    
                    // Increase opacity
                    if (child.material.transparent) {
                        child.material.opacity = Math.min(1.0, child.material.opacity * 1.3);
                    }
                }
            });
            
            // Add foam particles
            const foamCount = 30;
            const foamParticles = [];
            
            for (let i = 0; i < foamCount; i++) {
                const foamSize = 0.1 + Math.random() * 0.2;
                const foamGeometry = new THREE.SphereGeometry(foamSize, 8, 8);
                const foamMaterial = new THREE.MeshBasicMaterial({
                    color: 0xffffff,
                    transparent: true,
                    opacity: 0.7
                });
                
                const foam = new THREE.Mesh(foamGeometry, foamMaterial);
                
                // Random position around wave
                const angle = (Math.random() * Math.PI) - (Math.PI/2);
                const radius = this.waveWidth * 0.8 * Math.random();
                const height = (Math.random() * this.waveHeight) - (this.waveHeight/2);
                
                foam.position.set(
                    Math.cos(angle) * radius,
                    height,
                    Math.sin(angle) * radius
                );
                
                // Store animation data
                foam.userData = {
                    initialPos: foam.position.clone(),
                    speed: 1 + Math.random() * 2,
                    direction: new THREE.Vector3(
                        Math.random() - 0.5,
                        Math.random() * 0.5,
                        Math.random() - 0.5
                    ).normalize(),
                    isFoam: true
                };
                
                waveGroup.add(foam);
                foamParticles.push(foam);
            }
            
            // Store reference
            this.foamParticles = foamParticles;
        }
        
        // Add splash effect behind the wave
        const splashGroup = new THREE.Group();
        
        // Create splash particles
        const splashCount = 20;
        const splashParticles = [];
        
        for (let i = 0; i < splashCount; i++) {
            const splashSize = 0.1 + Math.random() * 0.3;
            const splashGeometry = new THREE.SphereGeometry(splashSize, 8, 8);
            const splashMaterial = new THREE.MeshBasicMaterial({
                color: 0x88ccff,
                transparent: true,
                opacity: 0.6
            });
            
            const splash = new THREE.Mesh(splashGeometry, splashMaterial);
            
            // Position behind the wave
            splash.position.set(
                (Math.random() - 0.5) * this.waveWidth,
                Math.random() * 1.0,
                -this.waveWidth * 0.5 - Math.random() * 1.0
            );
            
            // Store animation data
            splash.userData = {
                initialPos: splash.position.clone(),
                speed: 2 + Math.random() * 3,
                direction: new THREE.Vector3(
                    (Math.random() - 0.5) * 0.5,
                    1.0 + Math.random() * 1.0,
                    -1.0 - Math.random() * 1.0
                ).normalize(),
                gravity: 9.8,
                age: 0,
                maxAge: 1.0 + Math.random() * 0.5,
                isSplash: true
            };
            
            splashGroup.add(splash);
            splashParticles.push(splash);
        }
        
        // Add splash group to effect group
        effectGroup.add(splashGroup);
        
        // Store reference
        this.splashGroup = splashGroup;
        this.splashParticles = splashParticles;
        
        // Create collision detection box
        const collisionGeometry = new THREE.BoxGeometry(this.waveWidth, this.waveHeight, 2.0);
        const collisionMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0.0, // Invisible
            wireframe: true
        });
        
        const collisionBox = new THREE.Mesh(collisionGeometry, collisionMaterial);
        collisionBox.position.set(0, this.waveHeight / 2, 0);
        
        effectGroup.add(collisionBox);
        
        // Store reference
        this.collisionBox = collisionBox;
        this.lastCollisionCheck = 0;
        this.collisionCheckInterval = 0.1; // Check every 0.1 seconds
        this.hitEnemies = new Set(); // Track enemies that have been hit
    }
    
    /**
     * Override the update method to add custom behavior
     * @param {number} delta - Time since last update in seconds
     * @private
     */
    updateWaveStrikeEffect(delta) {
        // Call the parent method to update the base effect
        super.updateWaveStrikeEffect(delta);
        
        // Update foam particles
        if (this.foamParticles) {
            for (const foam of this.foamParticles) {
                if (foam.userData && foam.userData.isFoam) {
                    // Move foam
                    const moveAmount = foam.userData.speed * delta;
                    foam.position.add(foam.userData.direction.clone().multiplyScalar(moveAmount));
                    
                    // Reset if moved too far from initial position
                    const distance = foam.position.distanceTo(foam.userData.initialPos);
                    if (distance > 1.0) {
                        foam.position.copy(foam.userData.initialPos);
                    }
                }
            }
        }
        
        // Update splash particles
        if (this.splashParticles) {
            for (let i = this.splashParticles.length - 1; i >= 0; i--) {
                const splash = this.splashParticles[i];
                
                if (splash.userData && splash.userData.isSplash) {
                    // Update age
                    splash.userData.age += delta;
                    
                    // Apply gravity
                    splash.userData.direction.y -= splash.userData.gravity * delta;
                    
                    // Move splash
                    const moveAmount = splash.userData.speed * delta;
                    splash.position.add(splash.userData.direction.clone().multiplyScalar(moveAmount));
                    
                    // Fade out over time
                    const progress = splash.userData.age / splash.userData.maxAge;
                    splash.material.opacity = Math.max(0, 0.6 - progress * 0.6);
                    
                    // Reset if expired
                    if (splash.userData.age >= splash.userData.maxAge) {
                        // Reset position
                        splash.position.set(
                            (Math.random() - 0.5) * this.waveWidth,
                            Math.random() * 1.0,
                            -this.waveWidth * 0.5 - Math.random() * 1.0
                        );
                        
                        // Reset direction
                        splash.userData.direction = new THREE.Vector3(
                            (Math.random() - 0.5) * 0.5,
                            1.0 + Math.random() * 1.0,
                            -1.0 - Math.random() * 1.0
                        ).normalize();
                        
                        // Reset age
                        splash.userData.age = 0;
                        splash.userData.maxAge = 1.0 + Math.random() * 0.5;
                        
                        // Reset opacity
                        splash.material.opacity = 0.6;
                    }
                }
            }
        }
        
        // Check for collisions with enemies
        this.lastCollisionCheck += delta;
        if (this.lastCollisionCheck >= this.collisionCheckInterval) {
            this._checkCollisions();
            this.lastCollisionCheck = 0;
        }
    }
    
    /**
     * Check for collisions with enemies
     * @private
     */
    _checkCollisions() {
        if (!this.skill.game || !this.skill.game.enemyManager || !this.collisionBox) return;
        
        // Get collision box world position
        const boxPosition = new THREE.Vector3();
        this.collisionBox.getWorldPosition(boxPosition);
        
        // Get collision box dimensions
        const boxSize = new THREE.Vector3();
        this.collisionBox.geometry.computeBoundingBox();
        this.collisionBox.geometry.boundingBox.getSize(boxSize);
        
        // Scale by the object's scale
        boxSize.multiply(this.collisionBox.scale);
        
        // Get collision box rotation
        const boxRotation = this.effect.rotation.y;
        
        // Get enemies - safely handle different API patterns
        let enemies = [];
        if (this.skill.game.enemyManager) {
            // Try different methods that might exist on enemyManager
            if (typeof this.skill.game.enemyManager.getEnemies === 'function') {
                enemies = this.skill.game.enemyManager.getEnemies();
            } else if (Array.isArray(this.skill.game.enemyManager.enemies)) {
                // Direct access to enemies array if getEnemies() doesn't exist
                enemies = this.skill.game.enemyManager.enemies;
            }
        }
        
        for (const enemy of enemies) {
            // Skip if already hit
            if (this.hitEnemies.has(enemy.id)) continue;
            
            const enemyPosition = enemy.getPosition();
            
            // Transform enemy position to local space of the wave
            const localEnemyPosition = enemyPosition.clone().sub(boxPosition);
            
            // Rotate point to align with box orientation
            localEnemyPosition.applyAxisAngle(new THREE.Vector3(0, 1, 0), -boxRotation);
            
            // Check if enemy is inside the box
            if (
                Math.abs(localEnemyPosition.x) <= boxSize.x / 2 &&
                Math.abs(localEnemyPosition.y) <= boxSize.y / 2 &&
                Math.abs(localEnemyPosition.z) <= boxSize.z / 2
            ) {
                // IMPORTANT: THIS CHECKED BY COLLISIONMANAGER
                // Apply damage
                // enemy.takeDamage(this.skill.damage, 'water');
                
                // Apply knockback in the direction of the wave
                const knockbackDirection = new THREE.Vector3(
                    Math.sin(boxRotation),
                    0.2, // Slight upward component
                    Math.cos(boxRotation)
                ).normalize();
                
                enemy.applyKnockback(knockbackDirection, this.knockbackForce);
                
                // Apply slow effect
                enemy.applyStatusEffect('slowed', 2.0, 0.3); // 30% slow for 2 seconds
                
                // Mark as hit
                this.hitEnemies.add(enemy.id);
                
                // Create splash effect at enemy position
                this._createEnemyCollisionEffect(enemyPosition);
                
                // Create damage number if HUD manager is available
                if (this.skill.game.hudManager) {
                    this.skill.game.hudManager.createDamageNumber(this.skill.damage, enemyPosition);
                }
            }
        }
    }
    
    /**
     * Create a collision effect when hitting an enemy
     * @param {THREE.Vector3} position - Position to create the effect
     * @private
     */
    _createEnemyCollisionEffect(position) {
        if (!this.effect) return;
        
        // Create splash particles
        const particleCount = 10;
        
        for (let i = 0; i < particleCount; i++) {
            const particleSize = 0.1 + Math.random() * 0.2;
            const particleGeometry = new THREE.SphereGeometry(particleSize, 8, 8);
            const particleMaterial = new THREE.MeshBasicMaterial({
                color: 0x88ccff,
                transparent: true,
                opacity: 0.7
            });
            
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            
            // Position at collision point
            particle.position.copy(position);
            
            // Random direction
            const angle = Math.random() * Math.PI * 2;
            const elevation = Math.random() * Math.PI;
            
            const direction = new THREE.Vector3(
                Math.sin(elevation) * Math.cos(angle),
                Math.cos(elevation),
                Math.sin(elevation) * Math.sin(angle)
            );
            
            // Store animation data
            particle.userData = {
                age: 0,
                maxAge: 0.5 + Math.random() * 0.3,
                speed: 2.0 + Math.random() * 2.0,
                direction: direction,
                gravity: 9.8,
                isCollisionParticle: true
            };
            
            this.effect.add(particle);
            
            // Add to a list for cleanup
            if (!this.collisionParticles) {
                this.collisionParticles = [];
            }
            this.collisionParticles.push(particle);
        }
    }
    
    /**
     * Override the update method to add custom behavior
     * @param {number} delta - Time since last update in seconds
     */
    update(delta) {
        // Call parent update method
        super.update(delta);
        
        // Update collision particles
        if (this.collisionParticles) {
            for (let i = this.collisionParticles.length - 1; i >= 0; i--) {
                const particle = this.collisionParticles[i];
                
                if (particle.userData && particle.userData.isCollisionParticle) {
                    // Update age
                    particle.userData.age += delta;
                    
                    // Apply gravity
                    particle.userData.direction.y -= particle.userData.gravity * delta;
                    
                    // Move particle
                    const moveAmount = particle.userData.speed * delta;
                    particle.position.add(particle.userData.direction.clone().multiplyScalar(moveAmount));
                    
                    // Fade out over time
                    const progress = particle.userData.age / particle.userData.maxAge;
                    particle.material.opacity = Math.max(0, 0.7 - progress * 0.7);
                    
                    // Remove if expired
                    if (particle.userData.age >= particle.userData.maxAge) {
                        // Remove from scene
                        if (particle.parent) {
                            particle.parent.remove(particle);
                        }
                        
                        // Dispose of resources
                        if (particle.geometry) particle.geometry.dispose();
                        if (particle.material) particle.material.dispose();
                        
                        // Remove from array
                        this.collisionParticles.splice(i, 1);
                    }
                }
            }
        }
    }
    
    /**
     * Enhanced dispose method to properly clean up all resources
     * Overrides the base class dispose method with more thorough cleanup
     */
    dispose() {
        // Clear foam particles
        if (this.foamParticles) {
            this.foamParticles.length = 0;
        }
        
        // Clear splash particles
        if (this.splashParticles) {
            this.splashParticles.length = 0;
        }
        
        // Clear collision particles
        if (this.collisionParticles) {
            for (const particle of this.collisionParticles) {
                if (particle.parent) {
                    particle.parent.remove(particle);
                }
                
                if (particle.geometry) particle.geometry.dispose();
                if (particle.material) particle.material.dispose();
            }
            this.collisionParticles.length = 0;
        }
        
        // Clear hit enemies set if it exists
        if (this.hitEnemies) {
            this.hitEnemies.clear();
        }
        
        // Call parent dispose method
        super.dispose();
    }
}