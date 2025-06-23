import * as THREE from 'three';
import { WaveOfLightEffect } from '../../WaveOfLightEffect.js';

/**
 * Specialized effect for Wave of Light - Lightning Bell variant
 * Creates a bell that strikes enemies with lightning
 */
export class LightningBellEffect extends WaveOfLightEffect {
    constructor(skill) {
        super(skill);
        // Override base properties for this variant
        this.lightningCount = 5; // Number of lightning bolts
        this.lightningRadius = 8.0; // Radius to search for targets
        this.chainLightning = true; // Whether lightning can chain between enemies
    }

    /**
     * Override the base method to create a specialized effect
     * @param {THREE.Group} effectGroup - Group to add the effect to
     * @private
     */
    createWaveEffect(effectGroup) {
        // Call the parent method to create the base effect
        super.createWaveEffect(effectGroup);
        
        // Modify the effect for Lightning Bell variant
        this._enhanceBellEffect(effectGroup);
    }
    
    /**
     * Enhance the bell effect for lightning variant
     * @param {THREE.Group} effectGroup - Group to add the effect to
     * @private
     */
    _enhanceBellEffect(effectGroup) {
        // Get the bell group (first child of effect group)
        const bellGroup = effectGroup.children[0];
        
        if (bellGroup) {
            // Modify bell appearance
            bellGroup.traverse(child => {
                if (child.isMesh && child.material) {
                    // Change color to electric blue
                    if (child.material.color) {
                        child.material.color.set(0x00aaff);
                    }
                    
                    // Add emissive glow
                    if ('emissive' in child.material) {
                        child.material.emissive = new THREE.Color(0x0088ff);
                        child.material.emissiveIntensity = 0.5;
                    }
                }
            });
            
            // Add electric particles to bell
            const particleCount = 20;
            const electricColors = [0x00aaff, 0x0088ff, 0x66ccff];
            
            for (let i = 0; i < particleCount; i++) {
                const particleSize = 0.05 + Math.random() * 0.1;
                const particleGeometry = new THREE.SphereGeometry(particleSize, 8, 8);
                const particleMaterial = new THREE.MeshBasicMaterial({
                    color: electricColors[Math.floor(Math.random() * electricColors.length)],
                    transparent: true,
                    opacity: 0.7
                });
                
                const particle = new THREE.Mesh(particleGeometry, particleMaterial);
                
                // Random position around bell
                const angle = Math.random() * Math.PI * 2;
                const radius = 0.5 + Math.random() * 1.0;
                const height = Math.random() * 2.0;
                
                particle.position.set(
                    Math.cos(angle) * radius,
                    height,
                    Math.sin(angle) * radius
                );
                
                // Store animation data
                particle.userData = {
                    initialPos: particle.position.clone(),
                    speed: 2 + Math.random() * 3,
                    phase: Math.random() * Math.PI * 2,
                    isElectric: true
                };
                
                bellGroup.add(particle);
            }
        }
        
        // Get the impact area (second child of effect group)
        const impactArea = effectGroup.children[1];
        
        if (impactArea && impactArea.isMesh) {
            // Change color to electric blue
            impactArea.material.color.set(0x00aaff);
        }
        
        // Create lightning container
        const lightningContainer = new THREE.Group();
        lightningContainer.visible = false; // Hide initially
        effectGroup.add(lightningContainer);
        
        // Store reference
        this.lightningContainer = lightningContainer;
        this.lightningBolts = [];
        this.lightningTargets = [];
    }
    
    /**
     * Create lightning effect
     * @private
     */
    _createLightningEffect() {
        if (!this.lightningContainer || !this.skill.game || !this.skill.game.enemyManager) return;
        
        // Make container visible
        this.lightningContainer.visible = true;
        
        // Clear any existing lightning bolts
        for (const bolt of this.lightningBolts) {
            if (bolt.parent) {
                bolt.parent.remove(bolt);
            }
            
            if (bolt.geometry) bolt.geometry.dispose();
            if (bolt.material) bolt.material.dispose();
        }
        this.lightningBolts = [];
        
        // Get position of the bell
        const bellPosition = this.effect.position.clone();
        
        // Find enemies in radius
        const enemies = this.skill.game.enemyManager.getEnemiesInRadius(bellPosition, this.lightningRadius);
        
        // If no enemies found, create random lightning bolts
        if (enemies.length === 0) {
            for (let i = 0; i < this.lightningCount; i++) {
                // Create random target position
                const angle = Math.random() * Math.PI * 2;
                const radius = 3.0 + Math.random() * (this.lightningRadius - 3.0);
                const targetPosition = new THREE.Vector3(
                    bellPosition.x + Math.cos(angle) * radius,
                    0,
                    bellPosition.z + Math.sin(angle) * radius
                );
                
                // Create lightning bolt to random position
                this._createLightningBolt(bellPosition, targetPosition);
            }
        }
        // Otherwise, create lightning bolts to enemies
        else {
            // Sort enemies by distance
            enemies.sort((a, b) => {
                const distA = a.getPosition().distanceTo(bellPosition);
                const distB = b.getPosition().distanceTo(bellPosition);
                return distA - distB;
            });
            
            // Store targets for chaining
            this.lightningTargets = [];
            
            // Create lightning bolts to closest enemies (up to lightningCount)
            const targetCount = Math.min(enemies.length, this.lightningCount);
            for (let i = 0; i < targetCount; i++) {
                const enemy = enemies[i];
                const enemyPosition = enemy.getPosition().clone();
                
                // Create lightning bolt to enemy
                this._createLightningBolt(bellPosition, enemyPosition);
                
                // IMPORTANT: THIS CHECKED BY COLLISIONMANAGER
                // Apply damage to enemy
                // enemy.takeDamage(this.skill.damage, 'lightning');
                
                // Apply shock effect
                enemy.applyStatusEffect('shocked', 3.0, this.skill.damage * 0.1);
                
                // Store target for chaining
                this.lightningTargets.push({
                    enemy: enemy,
                    position: enemyPosition,
                    chainCount: 0
                });
                
                // Create damage number if HUD manager is available
                if (this.skill.game.hudManager) {
                    this.skill.game.hudManager.createDamageNumber(this.skill.damage, enemyPosition);
                }
            }
            
            // Chain lightning if enabled
            if (this.chainLightning && this.lightningTargets.length > 0) {
                this._chainLightning();
            }
        }
        
        // Play lightning sound
        if (this.skill.game && this.skill.game.audioManager) {
            this.skill.game.audioManager.playSound('lightning', bellPosition);
        }
    }
    
    /**
     * Chain lightning between enemies
     * @private
     */
    _chainLightning() {
        if (!this.skill.game || !this.skill.game.enemyManager) return;
        
        // Maximum chain jumps
        const maxChains = 2;
        
        // Process each primary target
        for (const target of this.lightningTargets) {
            // Skip if already chained too many times
            if (target.chainCount >= maxChains) continue;
            
            // Find nearby enemies to chain to
            const nearbyEnemies = this.skill.game.enemyManager.getEnemiesInRadius(target.position, 5.0);
            
            // Filter out enemies that are already primary targets
            const chainTargets = nearbyEnemies.filter(enemy => {
                // Check if this enemy is not already a primary target
                return !this.lightningTargets.some(t => t.enemy === enemy);
            });
            
            // Chain to up to 2 nearby enemies
            const chainCount = Math.min(chainTargets.length, 2);
            for (let i = 0; i < chainCount; i++) {
                const chainEnemy = chainTargets[i];
                const chainPosition = chainEnemy.getPosition().clone();
                
                // Create lightning bolt from primary target to chain target
                this._createLightningBolt(target.position, chainPosition);
                
                // IMPORTANT: THIS CHECKED BY COLLISIONMANAGER
                // Apply reduced damage to chain target
                // const chainDamage = this.skill.damage * 0.5;
                // chainEnemy.takeDamage(chainDamage, 'lightning');
                
                // Apply shock effect
                chainEnemy.applyStatusEffect('shocked', 2.0, chainDamage * 0.1);
                
                // Create damage number if HUD manager is available
                if (this.skill.game.hudManager) {
                    this.skill.game.hudManager.createDamageNumber(chainDamage, chainPosition);
                }
                
                // Add to targets for potential further chaining
                this.lightningTargets.push({
                    enemy: chainEnemy,
                    position: chainPosition,
                    chainCount: target.chainCount + 1
                });
            }
        }
    }
    
    /**
     * Create a lightning bolt between two points
     * @param {THREE.Vector3} startPoint - Starting point
     * @param {THREE.Vector3} endPoint - Ending point
     * @private
     */
    _createLightningBolt(startPoint, endPoint) {
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
            color: 0x00aaff,
            transparent: true,
            opacity: 0.8
        });
        
        const lightningBolt = new THREE.Line(lightningGeometry, lightningMaterial);
        
        // Store animation data
        lightningBolt.userData = {
            age: 0,
            maxAge: 0.3 + Math.random() * 0.2,
            points: points,
            isLightning: true
        };
        
        this.lightningContainer.add(lightningBolt);
        this.lightningBolts.push(lightningBolt);
        
        // Create glow effect around the lightning
        const glowMaterial = new THREE.LineBasicMaterial({
            color: 0xaaddff,
            transparent: true,
            opacity: 0.5,
            linewidth: 3
        });
        
        const glowBolt = new THREE.Line(lightningGeometry.clone(), glowMaterial);
        
        // Store animation data
        glowBolt.userData = {
            age: 0,
            maxAge: 0.3 + Math.random() * 0.2,
            isGlow: true
        };
        
        this.lightningContainer.add(glowBolt);
        this.lightningBolts.push(glowBolt);
        
        // Create impact effect at end point
        const impactGeometry = new THREE.SphereGeometry(0.3, 16, 16);
        const impactMaterial = new THREE.MeshBasicMaterial({
            color: 0x00aaff,
            transparent: true,
            opacity: 0.8
        });
        
        const impact = new THREE.Mesh(impactGeometry, impactMaterial);
        impact.position.copy(endPoint);
        
        // Store animation data
        impact.userData = {
            age: 0,
            maxAge: 0.5,
            isImpact: true
        };
        
        this.lightningContainer.add(impact);
        this.lightningBolts.push(impact);
    }
    
    /**
     * Override the update method to add custom behavior
     * @param {number} delta - Time since last update in seconds
     * @private
     */
    updateWaveEffect(delta) {
        // Call the parent method to update the base effect
        super.updateWaveEffect(delta);
        
        // Get the bell group (first child of effect group)
        const bellGroup = this.effect.children[0];
        
        // Update electric particles on bell
        if (bellGroup) {
            bellGroup.traverse(child => {
                if (child.userData && child.userData.isElectric) {
                    // Make particles flicker
                    const initialPos = child.userData.initialPos;
                    const speed = child.userData.speed;
                    const phase = child.userData.phase;
                    
                    // Oscillate position
                    child.position.set(
                        initialPos.x + Math.sin(this.elapsedTime * speed + phase) * 0.1,
                        initialPos.y + Math.cos(this.elapsedTime * speed * 1.5 + phase) * 0.1,
                        initialPos.z + Math.sin(this.elapsedTime * speed + phase + Math.PI/2) * 0.1
                    );
                    
                    // Pulse opacity
                    child.material.opacity = 0.5 + 0.3 * Math.sin(this.elapsedTime * speed * 2 + phase);
                }
            });
        }
        
        // Update lightning effects
        if (this.lightningContainer && this.lightningContainer.visible) {
            let allExpired = true;
            
            // Update all lightning bolts
            for (let i = this.lightningBolts.length - 1; i >= 0; i--) {
                const bolt = this.lightningBolts[i];
                
                if (bolt.userData) {
                    // Update age
                    bolt.userData.age += delta;
                    
                    // Handle lightning bolt
                    if (bolt.userData.isLightning) {
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
                        bolt.material.opacity = Math.max(0, 0.8 - progress * 0.8);
                    }
                    // Handle glow effect
                    else if (bolt.userData.isGlow) {
                        // Fade out over time
                        const progress = bolt.userData.age / bolt.userData.maxAge;
                        bolt.material.opacity = Math.max(0, 0.5 - progress * 0.5);
                    }
                    // Handle impact effect
                    else if (bolt.userData.isImpact) {
                        // Scale up
                        const progress = bolt.userData.age / bolt.userData.maxAge;
                        const scale = 1.0 + progress * 3.0;
                        bolt.scale.set(scale, scale, scale);
                        
                        // Fade out over time
                        bolt.material.opacity = Math.max(0, 0.8 - progress * 0.8);
                    }
                    
                    // Check if expired
                    if (bolt.userData.age < bolt.userData.maxAge) {
                        allExpired = false;
                    } else {
                        // Remove expired bolt
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
            
            // Hide container if all bolts have expired
            if (allExpired) {
                this.lightningContainer.visible = false;
            }
        }
        
        // Check for bell impact to trigger lightning
        if (this.bellState && this.bellState.phase === 'impact') {
            // Create lightning when bell impacts
            this._createLightningEffect();
        }
    }
    
    /**
     * Enhanced dispose method to properly clean up all resources
     * Overrides the base class dispose method with more thorough cleanup
     */
    dispose() {
        // Clean up lightning bolts
        for (const bolt of this.lightningBolts) {
            if (bolt.parent) {
                bolt.parent.remove(bolt);
            }
            
            if (bolt.geometry) bolt.geometry.dispose();
            if (bolt.material) bolt.material.dispose();
        }
        this.lightningBolts = [];
        
        // Clear lightning targets
        this.lightningTargets = [];
        
        // Call parent dispose method
        super.dispose();
    }
}