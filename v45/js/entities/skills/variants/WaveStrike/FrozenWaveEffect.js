import * as THREE from 'three';
import { WaveStrikeEffect } from '../../WaveStrikeEffect.js';

/**
 * Specialized effect for Wave Strike - Frozen Wave variant
 * Creates an ice wave that freezes enemies
 */
export class FrozenWaveEffect extends WaveStrikeEffect {
    constructor(skill) {
        super(skill);
        // Override base properties for this variant
        this.freezeDuration = 2.0; // Duration of freeze effect in seconds
        this.freezeChance = 0.7; // 70% chance to freeze enemies
        this.hitEnemies = new Set(); // Initialize hit enemies set
        this.frostEffects = []; // Initialize frost effects array
    }

    /**
     * Override the base method to create a specialized effect
     * @param {THREE.Group} effectGroup - Group to add the effect to
     * @private
     */
    createWaveStrikeEffect(effectGroup) {
        // Call the parent method to create the base effect
        super.createWaveStrikeEffect(effectGroup);
        
        // Modify the effect for Frozen Wave variant
        this._enhanceWaveEffect(effectGroup);
    }
    
    /**
     * Enhance the wave effect for frozen wave variant
     * @param {THREE.Group} effectGroup - Group to add the effect to
     * @private
     */
    _enhanceWaveEffect(effectGroup) {
        // Get the wave group (first child of effect group)
        const waveGroup = effectGroup.children[0];
        
        if (waveGroup) {
            // Modify wave appearance
            waveGroup.traverse(child => {
                if (child.isMesh && child.material) {
                    // Change color to ice blue
                    if (child.material.color) {
                        child.material.color.set(0xaaddff);
                    }
                    
                    // Add emissive glow
                    if ('emissive' in child.material) {
                        child.material.emissive = new THREE.Color(0x88ccff);
                        child.material.emissiveIntensity = 0.3;
                    }
                    
                    // Increase metalness and decrease roughness for ice look
                    if ('metalness' in child.material && 'roughness' in child.material) {
                        child.material.metalness = 0.7;
                        child.material.roughness = 0.2;
                    }
                }
            });
            
            // Add ice crystals to the wave
            const crystalCount = 15;
            const crystals = [];
            
            for (let i = 0; i < crystalCount; i++) {
                // Create a crystal group
                const crystalGroup = new THREE.Group();
                
                // Create crystal using cone geometry
                const crystalHeight = 0.2 + Math.random() * 0.3;
                const crystalRadius = 0.05 + Math.random() * 0.1;
                const crystalGeometry = new THREE.ConeGeometry(crystalRadius, crystalHeight, 6);
                const crystalMaterial = new THREE.MeshStandardMaterial({
                    color: 0xccffff,
                    transparent: true,
                    opacity: 0.8,
                    metalness: 0.9,
                    roughness: 0.1
                });
                
                const crystal = new THREE.Mesh(crystalGeometry, crystalMaterial);
                
                // Random rotation
                crystal.rotation.x = Math.PI / 2 + (Math.random() - 0.5) * 0.5;
                crystal.rotation.z = Math.random() * Math.PI * 2;
                
                crystalGroup.add(crystal);
                
                // Add smaller crystals around the main one
                const smallCrystalCount = Math.floor(Math.random() * 3) + 1;
                
                for (let j = 0; j < smallCrystalCount; j++) {
                    const smallHeight = crystalHeight * 0.6;
                    const smallRadius = crystalRadius * 0.6;
                    const smallGeometry = new THREE.ConeGeometry(smallRadius, smallHeight, 6);
                    const smallMaterial = new THREE.MeshStandardMaterial({
                        color: 0xccffff,
                        transparent: true,
                        opacity: 0.8,
                        metalness: 0.9,
                        roughness: 0.1
                    });
                    
                    const smallCrystal = new THREE.Mesh(smallGeometry, smallMaterial);
                    
                    // Position around main crystal
                    const angle = (j / smallCrystalCount) * Math.PI * 2;
                    smallCrystal.position.set(
                        Math.cos(angle) * crystalRadius * 1.5,
                        Math.sin(angle) * crystalRadius * 1.5,
                        0
                    );
                    
                    // Random rotation
                    smallCrystal.rotation.x = Math.PI / 2 + (Math.random() - 0.5) * 1.0;
                    smallCrystal.rotation.z = Math.random() * Math.PI * 2;
                    
                    crystalGroup.add(smallCrystal);
                }
                
                // Position on the wave
                const angle = (Math.random() * Math.PI) - (Math.PI/2);
                const radius = 1.0 * Math.random();
                const height = (Math.random() * 1.0) - 0.5;
                
                crystalGroup.position.set(
                    Math.cos(angle) * radius,
                    height,
                    Math.sin(angle) * radius
                );
                
                // Store animation data
                crystalGroup.userData = {
                    pulseSpeed: 0.5 + Math.random() * 1.0,
                    phase: Math.random() * Math.PI * 2,
                    isCrystal: true
                };
                
                waveGroup.add(crystalGroup);
                crystals.push(crystalGroup);
            }
            
            // Store reference
            this.crystals = crystals;
        }
        
        // Add frost trail behind the wave
        const frostTrailGeometry = new THREE.PlaneGeometry(2.0, 4.0);
        const frostTrailMaterial = new THREE.MeshBasicMaterial({
            color: 0xaaddff,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
        });
        
        const frostTrail = new THREE.Mesh(frostTrailGeometry, frostTrailMaterial);
        frostTrail.rotation.x = -Math.PI / 2; // Lay flat
        frostTrail.position.z = -2.0; // Behind the wave
        frostTrail.position.y = 0.05; // Just above ground
        
        effectGroup.add(frostTrail);
        
        // Store reference
        this.frostTrail = frostTrail;
        
        // Add frost particles
        const frostParticleCount = 20;
        const frostParticles = [];
        
        for (let i = 0; i < frostParticleCount; i++) {
            const particleSize = 0.05 + Math.random() * 0.1;
            const particleGeometry = new THREE.SphereGeometry(particleSize, 8, 8);
            const particleMaterial = new THREE.MeshBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.7
            });
            
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            
            // Position around and behind the wave
            particle.position.set(
                (Math.random() - 0.5) * 2.0,
                Math.random() * 1.0,
                -Math.random() * 3.0
            );
            
            // Store animation data
            particle.userData = {
                initialPos: particle.position.clone(),
                speed: 0.5 + Math.random() * 1.0,
                direction: new THREE.Vector3(
                    (Math.random() - 0.5) * 0.5,
                    (Math.random() - 0.5) * 0.5,
                    -Math.random() * 0.5
                ).normalize(),
                isFrostParticle: true
            };
            
            effectGroup.add(particle);
            frostParticles.push(particle);
        }
        
        // Store reference
        this.frostParticles = frostParticles;
        
        // Create collision detection box
        const collisionGeometry = new THREE.BoxGeometry(2.0, 1.5, 2.0);
        const collisionMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0.0, // Invisible
            wireframe: true
        });
        
        const collisionBox = new THREE.Mesh(collisionGeometry, collisionMaterial);
        collisionBox.position.set(0, 0.75, 0);
        
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
        
        // Update ice crystals
        if (this.crystals) {
            for (const crystal of this.crystals) {
                if (crystal.userData && crystal.userData.isCrystal) {
                    // Pulse crystal opacity and scale
                    const pulse = 0.5 + 0.5 * Math.sin(this.elapsedTime * crystal.userData.pulseSpeed + crystal.userData.phase);
                    
                    crystal.traverse(child => {
                        if (child.isMesh && child.material) {
                            child.material.opacity = 0.6 + 0.3 * pulse;
                            
                            // Subtle scale pulsing
                            const scale = 1.0 + 0.1 * pulse;
                            child.scale.set(scale, scale, scale);
                        }
                    });
                }
            }
        }
        
        // Update frost trail
        if (this.frostTrail) {
            // Fade out over time
            this.frostTrail.material.opacity = 0.3 * (1.0 - this.elapsedTime / this.skill.duration);
        }
        
        // Update frost particles
        if (this.frostParticles) {
            for (const particle of this.frostParticles) {
                if (particle.userData && particle.userData.isFrostParticle) {
                    // Move particle
                    const moveAmount = particle.userData.speed * delta;
                    particle.position.add(particle.userData.direction.clone().multiplyScalar(moveAmount));
                    
                    // Reset if moved too far
                    if (particle.position.z < -4.0) {
                        particle.position.copy(particle.userData.initialPos);
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
        
        // Get enemies from the enemyManager's enemies array
        const enemies = this.skill.game.enemyManager.enemies || [];
        
        for (const enemy of enemies) {
            // Skip if already hit
            if (this.hitEnemies.has(enemy.id)) continue;
            
            // Safely get enemy position - handle both direct position property and getPosition method
            let enemyPosition;
            if (typeof enemy.getPosition === 'function') {
                enemyPosition = enemy.getPosition();
            } else if (enemy.position && enemy.position instanceof THREE.Vector3) {
                enemyPosition = enemy.position;
            } else if (enemy.group && enemy.group.position) {
                enemyPosition = enemy.group.position;
            } else {
                // Skip this enemy if we can't determine its position
                console.warn('Could not determine position for enemy:', enemy);
                continue;
            }
            
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
                // enemy.takeDamage(this.skill.damage, 'ice');
                
                // Apply freeze effect (with chance)
                if (Math.random() < this.freezeChance) {
                    enemy.applyStatusEffect('frozen', this.freezeDuration);
                } else {
                    // Apply slow effect if not frozen
                    enemy.applyStatusEffect('slowed', 3.0, 0.5); // 50% slow for 3 seconds
                }
                
                // Mark as hit
                this.hitEnemies.add(enemy.id);
                
                // Create frost effect at enemy position
                this._createEnemyFrostEffect(enemyPosition);
                
                // Create damage number if HUD manager is available
                if (this.skill.game.hudManager) {
                    this.skill.game.hudManager.createDamageNumber(this.skill.damage, enemyPosition);
                }
            }
        }
    }
    
    /**
     * Create a frost effect when hitting an enemy
     * @param {THREE.Vector3} position - Position to create the effect
     * @private
     */
    _createEnemyFrostEffect(position) {
        if (!this.effect) return;
        
        // Create frost burst
        const burstGeometry = new THREE.CircleGeometry(0.5, 16);
        const burstMaterial = new THREE.MeshBasicMaterial({
            color: 0xaaddff,
            transparent: true,
            opacity: 0.7,
            side: THREE.DoubleSide
        });
        
        const burst = new THREE.Mesh(burstGeometry, burstMaterial);
        burst.position.copy(position);
        burst.position.y = 0.1; // Just above ground
        burst.rotation.x = -Math.PI / 2; // Lay flat
        
        // Store animation data
        burst.userData = {
            age: 0,
            maxAge: 0.5,
            isFrostBurst: true
        };
        
        this.effect.add(burst);
        
        // Create ice crystals
        const crystalCount = 5;
        
        for (let i = 0; i < crystalCount; i++) {
            // Create crystal using cone geometry
            const crystalHeight = 0.2 + Math.random() * 0.3;
            const crystalRadius = 0.05 + Math.random() * 0.1;
            const crystalGeometry = new THREE.ConeGeometry(crystalRadius, crystalHeight, 6);
            const crystalMaterial = new THREE.MeshStandardMaterial({
                color: 0xccffff,
                transparent: true,
                opacity: 0.8,
                metalness: 0.9,
                roughness: 0.1
            });
            
            const crystal = new THREE.Mesh(crystalGeometry, crystalMaterial);
            
            // Position around hit point
            const angle = (i / crystalCount) * Math.PI * 2;
            const radius = 0.2 + Math.random() * 0.3;
            
            crystal.position.set(
                position.x + Math.cos(angle) * radius,
                position.y + crystalHeight / 2,
                position.z + Math.sin(angle) * radius
            );
            
            // Random rotation
            crystal.rotation.x = Math.PI / 2 + (Math.random() - 0.5) * 0.5;
            crystal.rotation.z = Math.random() * Math.PI * 2;
            
            // Store animation data
            crystal.userData = {
                age: 0,
                maxAge: 1.0 + Math.random() * 0.5,
                isFrostCrystal: true
            };
            
            this.effect.add(crystal);
            
            // Add to a list for cleanup
            if (!this.frostEffects) {
                this.frostEffects = [];
            }
            this.frostEffects.push(crystal);
        }
        
        // Add burst to frost effects
        if (!this.frostEffects) {
            this.frostEffects = [];
        }
        this.frostEffects.push(burst);
    }
    
    /**
     * Override the update method to add custom behavior
     * @param {number} delta - Time since last update in seconds
     */
    update(delta) {
        // Call parent update method
        super.update(delta);
        
        // Update frost effects
        if (this.frostEffects) {
            for (let i = this.frostEffects.length - 1; i >= 0; i--) {
                const effect = this.frostEffects[i];
                
                if (effect.userData) {
                    // Update age
                    effect.userData.age += delta;
                    
                    // Handle frost burst
                    if (effect.userData.isFrostBurst) {
                        // Expand burst
                        const progress = effect.userData.age / effect.userData.maxAge;
                        const scale = 1.0 + progress * 2.0;
                        effect.scale.set(scale, scale, 1);
                        
                        // Fade out
                        effect.material.opacity = Math.max(0, 0.7 - progress * 0.7);
                    }
                    // Handle frost crystals
                    else if (effect.userData.isFrostCrystal) {
                        // Grow crystal
                        const growProgress = Math.min(1, effect.userData.age / 0.3);
                        effect.scale.set(growProgress, growProgress, growProgress);
                        
                        // Fade out near end of life
                        const fadeProgress = (effect.userData.age - (effect.userData.maxAge - 0.5)) / 0.5;
                        if (fadeProgress > 0) {
                            effect.material.opacity = Math.max(0, 0.8 - fadeProgress * 0.8);
                        }
                    }
                    
                    // Remove if expired
                    if (effect.userData.age >= effect.userData.maxAge) {
                        // Remove from scene
                        if (effect.parent) {
                            effect.parent.remove(effect);
                        }
                        
                        // Dispose of resources
                        if (effect.geometry) effect.geometry.dispose();
                        if (effect.material) effect.material.dispose();
                        
                        // Remove from array
                        this.frostEffects.splice(i, 1);
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
        // Clear crystal references
        if (this.crystals) {
            this.crystals.length = 0;
        }
        
        // Clear frost particle references
        if (this.frostParticles) {
            this.frostParticles.length = 0;
        }
        
        // Clear frost effects
        if (this.frostEffects) {
            for (const effect of this.frostEffects) {
                if (effect.parent) {
                    effect.parent.remove(effect);
                }
                
                if (effect.geometry) effect.geometry.dispose();
                if (effect.material) effect.material.dispose();
            }
            this.frostEffects.length = 0;
        }
        
        // Clear hit enemies set if it exists
        if (this.hitEnemies) {
            this.hitEnemies.clear();
        }
        
        // Call parent dispose method
        super.dispose();
    }
}