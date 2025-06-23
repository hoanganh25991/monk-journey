import * as THREE from 'three';
import { WaveOfLightEffect } from '../../WaveOfLightEffect.js';

/**
 * Effect for the Lightning Burst variant of Wave of Light
 * Creates a burst of lightning that chains between enemies
 * Visual style: Electric blue energy with lightning arcs
 */
export class LightningBurstEffect extends WaveOfLightEffect {
    constructor(skill) {
        super(skill);
        
        // Variant-specific properties
        this.chainCount = 3; // Number of enemies to chain to
        this.chainRange = 5; // Range to look for chain targets
        this.chainDamageMultiplier = 0.7; // Each chain does 70% of previous damage
        this.hitEnemies = new Set(); // Track enemies that have been hit
        
        // Visual properties
        this.lightningColor = new THREE.Color(0x00ccff); // Electric blue for lightning
        this.arcColor = new THREE.Color(0x66ffff); // Light blue for arcs
        this.lightningBolts = [];
    }
    
    /**
     * Create the effect
     * @param {THREE.Vector3} position - The position to create the effect at
     * @param {THREE.Vector3} direction - The direction of the effect
     * @returns {Object} - The created effect object
     * @override
     */
    create(position, direction) {
        // Create base effect
        const effectObject = super.create(position, direction);
        
        // Clear hit enemies set
        this.hitEnemies.clear();
        this.lightningBolts = [];
        
        // Modify base effect colors if it exists
        if (effectObject.bell) {
            effectObject.bell.traverse(child => {
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(mat => {
                            mat.color = this.lightningColor.clone();
                            if (mat.emissive) {
                                mat.emissive = this.lightningColor.clone();
                            }
                        });
                    } else {
                        child.material.color = this.lightningColor.clone();
                        if (child.material.emissive) {
                            child.material.emissive = this.lightningColor.clone();
                        }
                    }
                }
            });
        }
        
        // Add lightning effect
        this.createLightningEffect(position);
        
        return effectObject;
    }
    
    /**
     * Create the lightning effect
     * @param {THREE.Vector3} position - The position to create the effect at
     */
    createLightningEffect(position) {
        if (!position || !this.skill.game.scene) return;
        
        // Create a burst of lightning
        const burstCount = 8;
        
        for (let i = 0; i < burstCount; i++) {
            // Create a lightning bolt in a random direction
            const angle = (i / burstCount) * Math.PI * 2;
            const length = 2 + Math.random() * 1;
            
            const endX = position.x + Math.cos(angle) * length;
            const endZ = position.z + Math.sin(angle) * length;
            
            const endPoint = new THREE.Vector3(endX, position.y, endZ);
            
            this.createLightningBolt(position, endPoint);
        }
        
        // Find initial target
        if (this.skill.game.enemyManager) {
            const enemies = this.skill.game.enemyManager.getEnemiesNearPosition(
                position,
                3 // Initial target range
            );
            
            if (enemies.length > 0) {
                // Find the closest enemy
                let closestEnemy = null;
                let closestDistance = Infinity;
                
                enemies.forEach(enemy => {
                    const enemyPosition = enemy.getPosition();
                    if (!enemyPosition) return;
                    
                    const distance = position.distanceTo(enemyPosition);
                    if (distance < closestDistance) {
                        closestDistance = distance;
                        closestEnemy = enemy;
                    }
                });
                
                if (closestEnemy) {
                    // IMPORTANT: THIS CHECKED BY COLLISIONMANAGER
                    // Apply damage to first target
                    // const damage = this.calculateDamage(closestEnemy);
                    // closestEnemy.takeDamage(damage);
                    
                    // Mark as hit
                    this.hitEnemies.add(closestEnemy.id);
                    
                    // Create lightning to first target
                    const enemyPosition = closestEnemy.getPosition();
                    if (enemyPosition) {
                        this.createLightningBolt(position, enemyPosition, true);
                        
                        // Chain to additional targets
                        this.chainLightning(closestEnemy, damage, 1);
                    }
                }
            }
        }
    }
    
    /**
     * Chain lightning to additional targets
     * @param {Enemy} sourceEnemy - The enemy to chain from
     * @param {number} previousDamage - The damage dealt to the previous enemy
     * @param {number} chainIndex - The current chain index
     */
    chainLightning(sourceEnemy, previousDamage, chainIndex) {
        if (chainIndex >= this.chainCount || !sourceEnemy || !this.skill.game.enemyManager) return;
        
        const sourcePosition = sourceEnemy.getPosition();
        if (!sourcePosition) return;
        
        // Find nearby enemies that haven't been hit yet
        const enemies = this.skill.game.enemyManager.getEnemiesNearPosition(
            sourcePosition,
            this.chainRange
        );
        
        // Filter out enemies that have already been hit
        const validTargets = enemies.filter(enemy => !this.hitEnemies.has(enemy.id));
        
        if (validTargets.length > 0) {
            // Find the closest enemy
            let closestEnemy = null;
            let closestDistance = Infinity;
            
            validTargets.forEach(enemy => {
                const enemyPosition = enemy.getPosition();
                if (!enemyPosition) return;
                
                const distance = sourcePosition.distanceTo(enemyPosition);
                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestEnemy = enemy;
                }
            });
            
            if (closestEnemy) {
                // IMPORTANT: THIS CHECKED BY COLLISIONMANAGER
                // Apply reduced damage to chained target
                // const chainDamage = previousDamage * this.chainDamageMultiplier;
                // closestEnemy.takeDamage(chainDamage);
                
                // Mark as hit
                this.hitEnemies.add(closestEnemy.id);
                
                // Create lightning to chained target
                const targetPosition = closestEnemy.getPosition();
                if (targetPosition) {
                    this.createLightningBolt(sourcePosition, targetPosition, true);
                    
                    // Chain to next target
                    setTimeout(() => {
                        this.chainLightning(closestEnemy, chainDamage, chainIndex + 1);
                    }, 150); // Slight delay between chains
                }
            }
        }
    }
    
    /**
     * Create a lightning bolt between two points
     * @param {THREE.Vector3} startPoint - The starting point
     * @param {THREE.Vector3} endPoint - The ending point
     * @param {boolean} isChain - Whether this is a chain lightning bolt
     */
    createLightningBolt(startPoint, endPoint, isChain = false) {
        if (!startPoint || !endPoint || !this.skill.game.scene) return;
        
        // Create a jagged line for lightning
        const segments = 10;
        const points = [];
        
        // Start point
        points.push(startPoint.clone());
        
        // Middle points with randomness
        for (let i = 1; i < segments; i++) {
            const t = i / segments;
            
            // Interpolate between start and end
            const point = new THREE.Vector3(
                startPoint.x + (endPoint.x - startPoint.x) * t,
                startPoint.y + (endPoint.y - startPoint.y) * t,
                startPoint.z + (endPoint.z - startPoint.z) * t
            );
            
            // Add randomness perpendicular to the line
            const perpX = -(endPoint.z - startPoint.z);
            const perpZ = endPoint.x - startPoint.x;
            const perpLength = Math.sqrt(perpX * perpX + perpZ * perpZ);
            
            if (perpLength > 0) {
                const randomOffset = (Math.random() - 0.5) * 0.5;
                point.x += (perpX / perpLength) * randomOffset;
                point.z += (perpZ / perpLength) * randomOffset;
            }
            
            // Add vertical randomness
            point.y += (Math.random() - 0.5) * 0.3;
            
            points.push(point);
        }
        
        // End point
        points.push(endPoint.clone());
        
        // Create geometry and material
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({
            color: isChain ? this.arcColor : this.lightningColor,
            transparent: true,
            opacity: 1.0,
            blending: THREE.AdditiveBlending
        });
        
        const lightning = new THREE.Line(geometry, material);
        
        // Add to scene
        this.skill.game.scene.add(lightning);
        
        // Create glow effect
        const glowMaterial = new THREE.LineBasicMaterial({
            color: isChain ? this.arcColor : this.lightningColor,
            transparent: true,
            opacity: 0.5,
            blending: THREE.AdditiveBlending,
            linewidth: 3
        });
        
        const glowLightning = new THREE.Line(geometry, glowMaterial);
        
        // Add to scene
        this.skill.game.scene.add(glowLightning);
        
        // Store for animation and cleanup
        this.lightningBolts.push({
            line: lightning,
            glow: glowLightning,
            geometry: geometry,
            material: material,
            glowMaterial: glowMaterial,
            points: points,
            startPoint: startPoint.clone(),
            endPoint: endPoint.clone(),
            isChain: isChain,
            creationTime: this.skill.game.time.getElapsedTime()
        });
        
        // Create impact effect at end point
        this.createLightningImpact(endPoint);
    }
    
    /**
     * Create a lightning impact effect
     * @param {THREE.Vector3} position - The position to create the effect at
     */
    createLightningImpact(position) {
        if (!position || !this.skill.game.scene) return;
        
        // Create a burst of particles
        const particleCount = 20;
        const particleGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        
        for (let i = 0; i < particleCount; i++) {
            // Start at impact position
            positions[i * 3] = position.x;
            positions[i * 3 + 1] = position.y;
            positions[i * 3 + 2] = position.z;
            
            // Lightning color with variations
            const colorVariation = 0.8 + Math.random() * 0.2;
            colors[i * 3] = this.lightningColor.r * colorVariation;
            colors[i * 3 + 1] = this.lightningColor.g * colorVariation;
            colors[i * 3 + 2] = this.lightningColor.b * colorVariation;
            
            // Random sizes
            sizes[i] = 0.05 + Math.random() * 0.1;
        }
        
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        const particleMaterial = new THREE.PointsMaterial({
            size: 0.1,
            transparent: true,
            opacity: 0.8,
            vertexColors: true,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true
        });
        
        const particles = new THREE.Points(particleGeometry, particleMaterial);
        
        // Add to scene
        this.skill.game.scene.add(particles);
        
        // Animate the impact effect
        const startTime = this.skill.game.time.getElapsedTime();
        const duration = 0.5; // 0.5 seconds
        
        const updateImpact = () => {
            const currentTime = this.skill.game.time.getElapsedTime();
            const elapsed = currentTime - startTime;
            const t = elapsed / duration;
            
            if (t >= 1) {
                // Animation complete, remove particles
                this.skill.game.scene.remove(particles);
                particleGeometry.dispose();
                particleMaterial.dispose();
                
                // Remove from update loop
                this.skill.game.removeFromUpdateList(updateImpact);
                return;
            }
            
            // Move particles outward
            const positions = particleGeometry.attributes.position.array;
            
            for (let i = 0; i < particleCount; i++) {
                // Calculate direction from center
                const dx = positions[i * 3] - position.x;
                const dy = positions[i * 3 + 1] - position.y;
                const dz = positions[i * 3 + 2] - position.z;
                
                // Normalize direction
                const length = Math.sqrt(dx * dx + dy * dy + dz * dz);
                const dirX = length > 0 ? dx / length : Math.random() - 0.5;
                const dirY = length > 0 ? dy / length : Math.random() - 0.5;
                const dirZ = length > 0 ? dz / length : Math.random() - 0.5;
                
                // Move outward
                const speed = 2;
                positions[i * 3] += dirX * speed * (this.skill.game.deltaTime || 0.016);
                positions[i * 3 + 1] += dirY * speed * (this.skill.game.deltaTime || 0.016);
                positions[i * 3 + 2] += dirZ * speed * (this.skill.game.deltaTime || 0.016);
            }
            
            particleGeometry.attributes.position.needsUpdate = true;
            
            // Fade out
            particleMaterial.opacity = 0.8 * (1 - t);
        };
        
        // Add to update loop
        this.skill.game.addToUpdateList(updateImpact);
    }
    
    /**
     * Update the effect
     * @param {number} delta - Time since last update in seconds
     * @override
     */
    update(delta) {
        super.update(delta);
        
        // Update lightning bolts
        this.updateLightningBolts(delta);
    }
    
    /**
     * Update lightning bolts
     * @param {number} delta - Time since last update in seconds
     */
    updateLightningBolts(delta) {
        const currentTime = this.skill.game.time.getElapsedTime();
        const activeBolts = [];
        
        for (let i = 0; i < this.lightningBolts.length; i++) {
            const bolt = this.lightningBolts[i];
            const age = currentTime - bolt.creationTime;
            
            // Lightning bolts last for 0.5 seconds
            const duration = bolt.isChain ? 0.7 : 0.5;
            
            if (age < duration) {
                // Flicker the lightning
                if (bolt.material) {
                    bolt.material.opacity = 0.7 + 0.3 * Math.sin(age * 30);
                }
                
                if (bolt.glowMaterial) {
                    bolt.glowMaterial.opacity = 0.3 + 0.2 * Math.sin(age * 30);
                }
                
                // Occasionally reshape the lightning
                if (Math.random() < delta * 5) {
                    // Reshape middle points
                    for (let j = 1; j < bolt.points.length - 1; j++) {
                        const t = j / (bolt.points.length - 1);
                        
                        // Interpolate between start and end
                        const point = new THREE.Vector3(
                            bolt.startPoint.x + (bolt.endPoint.x - bolt.startPoint.x) * t,
                            bolt.startPoint.y + (bolt.endPoint.y - bolt.startPoint.y) * t,
                            bolt.startPoint.z + (bolt.endPoint.z - bolt.startPoint.z) * t
                        );
                        
                        // Add randomness perpendicular to the line
                        const perpX = -(bolt.endPoint.z - bolt.startPoint.z);
                        const perpZ = bolt.endPoint.x - bolt.startPoint.x;
                        const perpLength = Math.sqrt(perpX * perpX + perpZ * perpZ);
                        
                        if (perpLength > 0) {
                            const randomOffset = (Math.random() - 0.5) * 0.5;
                            point.x += (perpX / perpLength) * randomOffset;
                            point.z += (perpZ / perpLength) * randomOffset;
                        }
                        
                        // Add vertical randomness
                        point.y += (Math.random() - 0.5) * 0.3;
                        
                        bolt.points[j].copy(point);
                    }
                    
                    // Update geometry
                    bolt.geometry.setFromPoints(bolt.points);
                }
                
                activeBolts.push(bolt);
            } else {
                // Remove from scene
                if (this.skill.game.scene) {
                    this.skill.game.scene.remove(bolt.line);
                    this.skill.game.scene.remove(bolt.glow);
                }
                
                // Dispose resources
                bolt.geometry.dispose();
                bolt.material.dispose();
                bolt.glowMaterial.dispose();
            }
        }
        
        // Update the list of active bolts
        this.lightningBolts = activeBolts;
    }
    
    /**
     * Clean up resources when the effect is destroyed
     * @override
     */
    cleanup() {
        super.cleanup();
        
        // Clean up lightning bolts
        this.lightningBolts.forEach(bolt => {
            if (this.skill.game.scene) {
                this.skill.game.scene.remove(bolt.line);
                this.skill.game.scene.remove(bolt.glow);
            }
            
            bolt.geometry.dispose();
            bolt.material.dispose();
            bolt.glowMaterial.dispose();
        });
        
        this.lightningBolts = [];
        
        // Clear hit enemies set
        this.hitEnemies.clear();
    }
}