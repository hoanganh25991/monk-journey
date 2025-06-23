import * as THREE from 'three';
import { WaveStrikeEffect } from '../../WaveStrikeEffect.js';

/**
 * Specialized effect for Wave Strike - Thunder Wave variant
 * Creates a wave of lightning that chains between enemies
 */
export class ThunderWaveEffect extends WaveStrikeEffect {
    constructor(skill) {
        super(skill);
        // Override base properties for this variant
        this.chainRadius = 5.0; // Radius for chain lightning
        this.maxChains = 3; // Maximum number of chain jumps
        this.chainDamageMultiplier = 0.7; // Damage multiplier for each chain jump
    }

    /**
     * Override the base method to create a specialized effect
     * @param {THREE.Group} effectGroup - Group to add the effect to
     * @private
     */
    createWaveStrikeEffect(effectGroup) {
        // Call the parent method to create the base effect
        super.createWaveStrikeEffect(effectGroup);
        
        // Modify the effect for Thunder Wave variant
        this._enhanceWaveEffect(effectGroup);
    }
    
    /**
     * Enhance the wave effect for thunder wave variant
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
                    // Change color to electric blue/purple
                    if (child.material.color) {
                        child.material.color.set(0x6600ff);
                    }
                    
                    // Add emissive glow
                    if ('emissive' in child.material) {
                        child.material.emissive = new THREE.Color(0x4400aa);
                        child.material.emissiveIntensity = 0.5;
                    }
                }
            });
            
            // Add lightning arcs to the wave
            const arcCount = 8;
            const arcs = [];
            
            for (let i = 0; i < arcCount; i++) {
                // Create a lightning arc
                const arc = this._createLightningArc(0.5 + Math.random() * 1.0);
                
                // Position on the wave
                const angle = (Math.random() * Math.PI) - (Math.PI/2);
                const radius = 1.0 * Math.random();
                const height = (Math.random() * 1.0) - 0.5;
                
                arc.position.set(
                    Math.cos(angle) * radius,
                    height,
                    Math.sin(angle) * radius
                );
                
                // Random rotation
                arc.rotation.x = Math.random() * Math.PI * 2;
                arc.rotation.y = Math.random() * Math.PI * 2;
                arc.rotation.z = Math.random() * Math.PI * 2;
                
                waveGroup.add(arc);
                arcs.push(arc);
            }
            
            // Store reference
            this.arcs = arcs;
        }
        
        // Create lightning container for chain effects
        const lightningContainer = new THREE.Group();
        effectGroup.add(lightningContainer);
        
        // Store reference
        this.lightningContainer = lightningContainer;
        this.lightningBolts = [];
        
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
        this.chainTargets = []; // Track chain lightning targets
    }
    
    /**
     * Create a lightning arc
     * @param {number} size - Size of the arc
     * @returns {THREE.Group} - The created lightning arc
     * @private
     */
    _createLightningArc(size) {
        const arcGroup = new THREE.Group();
        
        // Create a jagged path for the lightning
        const segments = 10;
        const points = [];
        
        // Create arc points
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const angle = t * Math.PI;
            
            // Create arc shape
            const x = Math.cos(angle) * size;
            const y = Math.sin(angle) * size;
            const z = 0;
            
            // Add random jitter
            const jitter = size * 0.2;
            const point = new THREE.Vector3(
                x + (Math.random() - 0.5) * jitter,
                y + (Math.random() - 0.5) * jitter,
                z + (Math.random() - 0.5) * jitter
            );
            
            points.push(point);
        }
        
        // Create lightning geometry
        const arcGeometry = new THREE.BufferGeometry().setFromPoints(points);
        const arcMaterial = new THREE.LineBasicMaterial({
            color: 0x6600ff,
            transparent: true,
            opacity: 0.8
        });
        
        const arc = new THREE.Line(arcGeometry, arcMaterial);
        
        // Store animation data
        arc.userData = {
            points: points.map(p => p.clone()),
            jitterSpeed: 10 + Math.random() * 10,
            size: size,
            isLightningArc: true
        };
        
        arcGroup.add(arc);
        
        // Create glow effect
        const glowMaterial = new THREE.LineBasicMaterial({
            color: 0xaa88ff,
            transparent: true,
            opacity: 0.5
        });
        
        const glow = new THREE.Line(arcGeometry.clone(), glowMaterial);
        
        // Store animation data
        glow.userData = {
            isGlow: true
        };
        
        arcGroup.add(glow);
        
        return arcGroup;
    }
    
    /**
     * Override the update method to add custom behavior
     * @param {number} delta - Time since last update in seconds
     * @private
     */
    updateWaveStrikeEffect(delta) {
        // Call the parent method to update the base effect
        super.updateWaveStrikeEffect(delta);
        
        // Update lightning arcs
        if (this.arcs) {
            for (const arc of this.arcs) {
                // Get the main lightning arc (first child)
                const lightning = arc.children[0];
                const glow = arc.children[1];
                
                if (lightning && lightning.userData && lightning.userData.isLightningArc) {
                    // Jitter the lightning path
                    const points = lightning.userData.points;
                    const newPoints = [];
                    
                    // Keep start and end points fixed
                    newPoints.push(points[0].clone());
                    
                    // Jitter intermediate points
                    for (let i = 1; i < points.length - 1; i++) {
                        const point = points[i].clone();
                        const jitterAmount = lightning.userData.size * 0.1;
                        
                        point.x += (Math.random() - 0.5) * jitterAmount;
                        point.y += (Math.random() - 0.5) * jitterAmount;
                        point.z += (Math.random() - 0.5) * jitterAmount;
                        
                        newPoints.push(point);
                    }
                    
                    // Add end point
                    newPoints.push(points[points.length - 1].clone());
                    
                    // Update geometry
                    lightning.geometry.dispose();
                    lightning.geometry = new THREE.BufferGeometry().setFromPoints(newPoints);
                    
                    // Update glow geometry
                    if (glow) {
                        glow.geometry.dispose();
                        glow.geometry = new THREE.BufferGeometry().setFromPoints(newPoints);
                    }
                }
            }
        }
        
        // Update chain lightning effects
        if (this.lightningBolts.length > 0) {
            for (let i = this.lightningBolts.length - 1; i >= 0; i--) {
                const bolt = this.lightningBolts[i];
                
                if (bolt.userData) {
                    // Update age
                    bolt.userData.age += delta;
                    
                    // Jitter the lightning path
                    if (bolt.userData.points && bolt.userData.points.length > 2) {
                        const points = bolt.userData.points;
                        const newPoints = [];
                        
                        // Keep start and end points fixed
                        newPoints.push(points[0].clone());
                        
                        // Jitter intermediate points
                        for (let j = 1; j < points.length - 1; j++) {
                            const point = points[j].clone();
                            const jitterAmount = 0.1;
                            
                            point.x += (Math.random() - 0.5) * jitterAmount;
                            point.y += (Math.random() - 0.5) * jitterAmount;
                            point.z += (Math.random() - 0.5) * jitterAmount;
                            
                            newPoints.push(point);
                        }
                        
                        // Add end point
                        newPoints.push(points[points.length - 1].clone());
                        
                        // Update geometry
                        bolt.geometry.dispose();
                        bolt.geometry = new THREE.BufferGeometry().setFromPoints(newPoints);
                    }
                    
                    // Fade out over time
                    const progress = bolt.userData.age / bolt.userData.maxAge;
                    bolt.material.opacity = Math.max(0, bolt.userData.initialOpacity - progress * bolt.userData.initialOpacity);
                    
                    // Remove if expired
                    if (bolt.userData.age >= bolt.userData.maxAge) {
                        // Remove from scene
                        if (bolt.parent) {
                            bolt.parent.remove(bolt);
                        }
                        
                        // Dispose of resources
                        if (bolt.geometry) bolt.geometry.dispose();
                        if (bolt.material) bolt.material.dispose();
                        
                        // Remove from array
                        this.lightningBolts.splice(i, 1);
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
                // enemy.takeDamage(this.skill.damage, 'lightning');
                
                // Apply shock effect
                enemy.applyStatusEffect('shocked', 3.0, this.skill.damage * 0.1);
                
                // Mark as hit
                this.hitEnemies.add(enemy.id);
                
                // Add to chain targets
                this.chainTargets.push({
                    enemy: enemy,
                    position: enemyPosition.clone(),
                    chainCount: 0,
                    damage: this.skill.damage
                });
                
                // Create lightning effect at enemy position
                this._createEnemyLightningEffect(enemyPosition);
                
                // Create damage number if HUD manager is available
                if (this.skill.game.hudManager) {
                    this.skill.game.hudManager.createDamageNumber(this.skill.damage, enemyPosition);
                }
                
                // Process chain lightning
                this._processChainLightning();
            }
        }
    }
    
    /**
     * Process chain lightning jumps
     * @private
     */
    _processChainLightning() {
        if (!this.skill.game || !this.skill.game.enemyManager) return;
        
        // Process each target that hasn't reached max chains
        for (let i = 0; i < this.chainTargets.length; i++) {
            const target = this.chainTargets[i];
            
            // Skip if already at max chains
            if (target.chainCount >= this.maxChains) continue;
            
            // Find nearby enemies to chain to
            const nearbyEnemies = this.skill.game.enemyManager.getEnemiesInRadius(target.position, this.chainRadius);
            
            // Filter out enemies that are already hit
            const validTargets = nearbyEnemies.filter(enemy => !this.hitEnemies.has(enemy.id));
            
            // Chain to closest valid target
            if (validTargets.length > 0) {
                // Sort by distance
                validTargets.sort((a, b) => {
                    const distA = a.getPosition().distanceTo(target.position);
                    const distB = b.getPosition().distanceTo(target.position);
                    return distA - distB;
                });
                
                // Get closest enemy
                const chainEnemy = validTargets[0];
                const chainPosition = chainEnemy.getPosition().clone();
                
                // IMPORTANT: THIS CHECKED BY COLLISIONMANAGER
                // Calculate chain damage
                // const chainDamage = target.damage * this.chainDamageMultiplier;
                
                // Apply damage to chain target
                // chainEnemy.takeDamage(chainDamage, 'lightning');
                
                // Apply shock effect
                chainEnemy.applyStatusEffect('shocked', 2.0, chainDamage * 0.1);
                
                // Mark as hit
                this.hitEnemies.add(chainEnemy.id);
                
                // Create lightning bolt between targets
                this._createChainLightning(target.position, chainPosition);
                
                // Create damage number if HUD manager is available
                if (this.skill.game.hudManager) {
                    this.skill.game.hudManager.createDamageNumber(chainDamage, chainPosition);
                }
                
                // Add new chain target
                this.chainTargets.push({
                    enemy: chainEnemy,
                    position: chainPosition,
                    chainCount: target.chainCount + 1,
                    damage: chainDamage
                });
            }
        }
    }
    
    /**
     * Create a lightning effect when hitting an enemy
     * @param {THREE.Vector3} position - Position to create the effect
     * @private
     */
    _createEnemyLightningEffect(position) {
        if (!this.effect) return;
        
        // Create lightning burst
        const burstGeometry = new THREE.CircleGeometry(0.5, 16);
        const burstMaterial = new THREE.MeshBasicMaterial({
            color: 0x6600ff,
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
            isLightningBurst: true
        };
        
        this.effect.add(burst);
        
        // Create lightning arcs
        const arcCount = 5;
        
        for (let i = 0; i < arcCount; i++) {
            // Create a lightning arc
            const arc = this._createLightningArc(0.3 + Math.random() * 0.3);
            
            // Position at hit point
            arc.position.copy(position);
            
            // Random rotation
            arc.rotation.x = Math.random() * Math.PI * 2;
            arc.rotation.y = Math.random() * Math.PI * 2;
            arc.rotation.z = Math.random() * Math.PI * 2;
            
            // Store animation data
            arc.userData = {
                age: 0,
                maxAge: 0.5 + Math.random() * 0.3,
                isLightningEffect: true
            };
            
            this.effect.add(arc);
            
            // Add to a list for cleanup
            if (!this.lightningEffects) {
                this.lightningEffects = [];
            }
            this.lightningEffects.push(arc);
        }
        
        // Add burst to lightning effects
        if (!this.lightningEffects) {
            this.lightningEffects = [];
        }
        this.lightningEffects.push(burst);
    }
    
    /**
     * Create chain lightning between two points
     * @param {THREE.Vector3} startPoint - Starting point
     * @param {THREE.Vector3} endPoint - Ending point
     * @private
     */
    _createChainLightning(startPoint, endPoint) {
        if (!this.lightningContainer) return;
        
        // Create a jagged path for the lightning
        const distance = startPoint.distanceTo(endPoint);
        const segments = Math.max(5, Math.floor(distance * 2));
        const points = [];
        
        // Start point
        points.push(startPoint.clone());
        
        // Create jagged intermediate points
        for (let i = 1; i < segments; i++) {
            const t = i / segments;
            
            // Interpolate between start and end
            const point = new THREE.Vector3().lerpVectors(startPoint, endPoint, t);
            
            // Add random offset
            const offset = 0.3 + (distance * 0.1 * (1 - t)); // Less deviation near the end
            point.x += (Math.random() - 0.5) * offset;
            point.y += (Math.random() - 0.5) * offset;
            point.z += (Math.random() - 0.5) * offset;
            
            points.push(point);
        }
        
        // End point
        points.push(endPoint.clone());
        
        // Create lightning geometry
        const lightningGeometry = new THREE.BufferGeometry().setFromPoints(points);
        const lightningMaterial = new THREE.LineBasicMaterial({
            color: 0x6600ff,
            transparent: true,
            opacity: 0.8
        });
        
        const lightningBolt = new THREE.Line(lightningGeometry, lightningMaterial);
        
        // Store animation data
        lightningBolt.userData = {
            age: 0,
            maxAge: 0.5,
            points: points,
            initialOpacity: 0.8
        };
        
        this.lightningContainer.add(lightningBolt);
        this.lightningBolts.push(lightningBolt);
        
        // Create glow effect
        const glowMaterial = new THREE.LineBasicMaterial({
            color: 0xaa88ff,
            transparent: true,
            opacity: 0.5
        });
        
        const glowBolt = new THREE.Line(lightningGeometry.clone(), glowMaterial);
        
        // Store animation data
        glowBolt.userData = {
            age: 0,
            maxAge: 0.5,
            initialOpacity: 0.5
        };
        
        this.lightningContainer.add(glowBolt);
        this.lightningBolts.push(glowBolt);
    }
    
    /**
     * Override the update method to add custom behavior
     * @param {number} delta - Time since last update in seconds
     */
    update(delta) {
        // Call parent update method
        super.update(delta);
        
        // Update lightning effects
        if (this.lightningEffects) {
            for (let i = this.lightningEffects.length - 1; i >= 0; i--) {
                const effect = this.lightningEffects[i];
                
                if (effect.userData) {
                    // Update age
                    effect.userData.age += delta;
                    
                    // Handle lightning burst
                    if (effect.userData.isLightningBurst) {
                        // Expand burst
                        const progress = effect.userData.age / effect.userData.maxAge;
                        const scale = 1.0 + progress * 2.0;
                        effect.scale.set(scale, scale, 1);
                        
                        // Fade out
                        effect.material.opacity = Math.max(0, 0.7 - progress * 0.7);
                    }
                    // Handle lightning arcs
                    else if (effect.userData.isLightningEffect) {
                        // Fade out
                        const progress = effect.userData.age / effect.userData.maxAge;
                        
                        effect.traverse(child => {
                            if (child.material) {
                                child.material.opacity = Math.max(0, child.material.opacity - delta * 2);
                            }
                        });
                    }
                    
                    // Remove if expired
                    if (effect.userData.age >= effect.userData.maxAge) {
                        // Remove from scene
                        if (effect.parent) {
                            effect.parent.remove(effect);
                        }
                        
                        // Dispose of resources
                        effect.traverse(child => {
                            if (child.geometry) child.geometry.dispose();
                            if (child.material) child.material.dispose();
                        });
                        
                        // Remove from array
                        this.lightningEffects.splice(i, 1);
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
        // Clear arc references
        if (this.arcs) {
            this.arcs.length = 0;
        }
        
        // Clear lightning bolt references
        if (this.lightningBolts) {
            for (const bolt of this.lightningBolts) {
                if (bolt.parent) {
                    bolt.parent.remove(bolt);
                }
                
                if (bolt.geometry) bolt.geometry.dispose();
                if (bolt.material) bolt.material.dispose();
            }
            this.lightningBolts.length = 0;
        }
        
        // Clear lightning effects
        if (this.lightningEffects) {
            for (const effect of this.lightningEffects) {
                if (effect.parent) {
                    effect.parent.remove(effect);
                }
                
                effect.traverse(child => {
                    if (child.geometry) child.geometry.dispose();
                    if (child.material) child.material.dispose();
                });
            }
            this.lightningEffects.length = 0;
        }
        
        // Clear hit enemies set (safely)
        if (this.hitEnemies) {
            this.hitEnemies.clear();
        }
        
        // Clear chain targets (safely)
        if (this.chainTargets) {
            this.chainTargets.length = 0;
        }
        
        // Call parent dispose method
        super.dispose();
    }
}