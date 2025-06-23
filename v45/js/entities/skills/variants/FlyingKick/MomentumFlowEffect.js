import * as THREE from 'three';
import { FlyingKickEffect } from '../../FlyingKickEffect.js';

/**
 * Effect for the Momentum's Flow variant of Flying Kick
 * Creates a series of rapid kicks that deal damage multiple times
 * Visual style: Blue energy with lightning-like trails
 */
export class MomentumFlowEffect extends FlyingKickEffect {
    constructor(skill) {
        super(skill);
        
        // Variant-specific properties
        this.kickCount = 3; // Number of kicks in the series
        this.kickInterval = 0.2; // Time between kicks in seconds
        this.currentKick = 0; // Current kick in the series
        this.lastKickTime = 0; // Time of the last kick
        
        // Visual properties
        this.momentumColor = new THREE.Color(0x3399ff); // Blue for momentum
        this.lightningColor = new THREE.Color(0x66ccff); // Light blue for lightning
        this.afterimages = []; // Array to store afterimages
        this.lightningTrails = [];
    }
    
    /**
     * Create the effect
     * @param {THREE.Vector3} startPosition - The starting position of the effect
     * @param {THREE.Vector3} targetPosition - The target position of the effect
     * @returns {Object} - The created effect object
     * @override
     */
    create(startPosition, targetPosition) {
        // Create base effect
        const effectObject = super.create(startPosition, targetPosition);
        
        // Reset kick counter
        this.currentKick = 0;
        // Check if game and clock are available, use 0 as fallback
        this.lastKickTime = (this.skill.game && this.skill.game.clock) ? 
            this.skill.game.clock.getElapsedTime() : 0;
        
        // Clear afterimages and lightning trails
        this.afterimages = [];
        this.lightningTrails = [];
        
        // Modify base effect colors
        if (effectObject.trail) {
            effectObject.trail.traverse(child => {
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(mat => {
                            mat.color = this.momentumColor.clone();
                        });
                    } else {
                        child.material.color = this.momentumColor.clone();
                    }
                }
            });
        }
        
        // Add lightning trails
        this.addLightningTrails(effectObject);
        
        return effectObject;
    }
    
    /**
     * Add lightning trails to the effect
     * @param {Object} effectObject - The effect object to add trails to
     */
    addLightningTrails(effectObject) {
        // Check if effectObject exists and has required properties
        if (!effectObject || !effectObject.player || 
            !this.skill.game || !this.skill.game.scene) return;
        
        // Create several lightning trails
        const trailCount = 3;
        
        for (let i = 0; i < trailCount; i++) {
            // Create a jagged line for lightning
            const segments = 10;
            const points = [];
            
            // Start at player
            points.push(new THREE.Vector3(0, 0, 0));
            
            // Create jagged segments
            for (let j = 1; j < segments; j++) {
                const t = j / segments;
                
                // Add randomness perpendicular to the direction of travel
                const perpOffset = (Math.random() - 0.5) * 0.5;
                
                points.push(new THREE.Vector3(
                    -t * 2 + (Math.random() - 0.5) * 0.2, // Behind player
                    0.5 + (Math.random() - 0.5) * 0.3, // Around player height
                    perpOffset
                ));
            }
            
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const material = new THREE.LineBasicMaterial({
                color: this.lightningColor,
                transparent: true,
                opacity: 0.7,
                blending: THREE.AdditiveBlending
            });
            
            const lightning = new THREE.Line(geometry, material);
            
            // Add to player
            effectObject.player.add(lightning);
            
            // Store for animation
            this.lightningTrails.push({
                line: lightning,
                geometry: geometry,
                material: material,
                points: points,
                offset: i * 0.1 // Offset for animation
            });
        }
    }
    
    /**
     * Create an afterimage of the player
     * @param {Object} effectObject - The effect object to create afterimage for
     */
    createAfterimage(effectObject) {
        // Check if effectObject exists and has required properties
        if (!effectObject || !effectObject.player || 
            !this.skill.game || !this.skill.game.scene) return;
        
        // Create a simple mesh to represent the player
        const geometry = new THREE.BoxGeometry(0.5, 1, 0.3);
        const material = new THREE.MeshBasicMaterial({
            color: this.momentumColor,
            transparent: true,
            opacity: 0.5,
            blending: THREE.AdditiveBlending
        });
        
        const afterimage = new THREE.Mesh(geometry, material);
        
        // Position at current player position
        afterimage.position.copy(effectObject.player.position);
        afterimage.rotation.copy(effectObject.player.rotation);
        
        // Add to scene
        this.skill.game.scene.add(afterimage);
        
        // Store for animation
        this.afterimages.push({
            mesh: afterimage,
            material: material,
            geometry: geometry,
            creationTime: (this.skill.game && this.skill.game.clock) ? 
                this.skill.game.clock.getElapsedTime() : 0
        });
    }
    
    /**
     * Update the effect
     * @param {number} delta - Time since last update in seconds
     * @param {Object} effectObject - The effect object to update
     * @override
     */
    update(delta, effectObject) {
        super.update(delta, effectObject);
        
        // Skip additional effects if effectObject is not provided
        if (!effectObject) return;
        
        // Create afterimages periodically
        if (Math.random() < delta * 10) {
            this.createAfterimage(effectObject);
        }
        
        // Update afterimages
        this.updateAfterimages(delta);
        
        // Update lightning trails
        this.updateLightningTrails(delta);
        
        // Check if we should perform additional kicks
        const currentTime = (this.skill.game && this.skill.game.clock) ? 
            this.skill.game.clock.getElapsedTime() : 0;
        
        // Check if effectObject exists and has progress property
        // If not, use elapsed time as a fallback
        const progress = (effectObject && effectObject.progress !== undefined) ? 
            effectObject.progress : (this.elapsedTime / (this.skill.duration || 1));
            
        if (progress >= 1 && 
            this.currentKick < this.kickCount && 
            currentTime - this.lastKickTime >= this.kickInterval) {
            
            // Perform the next kick
            this.performAdditionalKick(effectObject);
            
            // Update kick counter
            this.currentKick++;
            this.lastKickTime = currentTime;
        }
        
        // End the effect when all kicks are complete
        if (effectObject && effectObject.progress !== undefined) {
            if (effectObject.progress >= 1 && this.currentKick >= this.kickCount) {
                effectObject.complete = true;
            }
        } else if (this.currentKick >= this.kickCount) {
            // If we don't have an effectObject, mark the skill as inactive
            this.isActive = false;
        }
    }
    
    /**
     * Update afterimages
     * @param {number} delta - Time since last update in seconds
     */
    updateAfterimages(delta) {
        const currentTime = (this.skill.game && this.skill.game.clock) ? 
            this.skill.game.clock.getElapsedTime() : 0;
        const activeAfterimages = [];
        
        for (let i = 0; i < this.afterimages.length; i++) {
            const afterimage = this.afterimages[i];
            const age = currentTime - afterimage.creationTime;
            
            // Fade out after 0.5 seconds
            if (age < 0.5) {
                // Fade out
                afterimage.material.opacity = 0.5 * (1 - age / 0.5);
                
                activeAfterimages.push(afterimage);
            } else {
                // Remove from scene
                if (this.skill.game.scene) {
                    this.skill.game.scene.remove(afterimage.mesh);
                }
                
                // Dispose resources
                afterimage.geometry.dispose();
                afterimage.material.dispose();
            }
        }
        
        // Update the list of active afterimages
        this.afterimages = activeAfterimages;
    }
    
    /**
     * Update lightning trails
     * @param {number} delta - Time since last update in seconds
     */
    updateLightningTrails(delta) {
        for (let i = 0; i < this.lightningTrails.length; i++) {
            const trail = this.lightningTrails[i];
            
            // Animate lightning by changing the points
            for (let j = 1; j < trail.points.length; j++) {
                const point = trail.points[j];
                
                // Add some random movement
                point.x += (Math.random() - 0.5) * 0.1;
                point.y += (Math.random() - 0.5) * 0.1;
                point.z += (Math.random() - 0.5) * 0.1;
            }
            
            // Update geometry
            trail.geometry.setFromPoints(trail.points);
            
            // Pulse opacity
            const time = ((this.skill.game && this.skill.game.clock) ? 
                this.skill.game.clock.getElapsedTime() : 0) + trail.offset;
            trail.material.opacity = 0.5 + 0.3 * Math.sin(time * 10);
        }
    }
    
    /**
     * Perform an additional kick in the series
     * @param {Object} effectObject - The effect object
     */
    performAdditionalKick(effectObject) {
        // Check if effectObject exists and has required properties
        if (!effectObject || !effectObject.player || 
            !this.skill.game || !this.skill.game.enemyManager) return;
        
        // Get player position
        const playerPosition = effectObject.player.position.clone();
        
        // Find nearby enemies
        const enemies = this.skill.game.enemyManager.getEnemiesNearPosition(
            playerPosition,
            2 // Kick range
        );
        
        if (enemies.length > 0) {
            // Find the closest enemy
            let closestEnemy = null;
            let closestDistance = Infinity;
            
            enemies.forEach(enemy => {
                const enemyPosition = enemy.getPosition();
                if (!enemyPosition) return;
                
                const distance = playerPosition.distanceTo(enemyPosition);
                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestEnemy = enemy;
                }
            });
            
            if (closestEnemy) {
                // Get enemy position
                const enemyPosition = closestEnemy.getPosition();
                if (!enemyPosition) return;
                
                // Face the enemy
                effectObject.player.lookAt(
                    enemyPosition.x,
                    effectObject.player.position.y,
                    enemyPosition.z
                );
                
                // IMPORTANT: THIS CHECKED BY COLLISIONMANAGER
                // Apply damage
                // const damage = this.calculateDamage(closestEnemy) * 0.5; // 50% damage for additional kicks
                // closestEnemy.takeDamage(damage);
                
                // Create impact effect
                this.createImpactEffect(enemyPosition);
                
                // Create a dash effect toward the enemy
                this.createDashEffect(playerPosition, enemyPosition);
            }
        }
    }
    
    /**
     * Create a dash effect between two positions
     * @param {THREE.Vector3} startPosition - The starting position
     * @param {THREE.Vector3} endPosition - The ending position
     */
    createDashEffect(startPosition, endPosition) {
        if (!startPosition || !endPosition || !this.skill.game.scene) return;
        
        // Create a lightning bolt between positions
        const segments = 10;
        const points = [];
        
        // Start point
        points.push(startPosition.clone());
        
        // Middle points with randomness
        for (let i = 1; i < segments; i++) {
            const t = i / segments;
            
            // Interpolate between start and end
            const point = new THREE.Vector3(
                startPosition.x + (endPosition.x - startPosition.x) * t,
                startPosition.y + (endPosition.y - startPosition.y) * t,
                startPosition.z + (endPosition.z - startPosition.z) * t
            );
            
            // Add randomness perpendicular to the line
            const perpX = -(endPosition.z - startPosition.z);
            const perpZ = endPosition.x - startPosition.x;
            const perpLength = Math.sqrt(perpX * perpX + perpZ * perpZ);
            
            if (perpLength > 0) {
                const randomOffset = (Math.random() - 0.5) * 0.3;
                point.x += (perpX / perpLength) * randomOffset;
                point.z += (perpZ / perpLength) * randomOffset;
            }
            
            // Add vertical randomness
            point.y += (Math.random() - 0.5) * 0.2;
            
            points.push(point);
        }
        
        // End point
        points.push(endPosition.clone());
        
        // Create geometry and material
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({
            color: this.lightningColor,
            transparent: true,
            opacity: 1.0,
            blending: THREE.AdditiveBlending
        });
        
        const lightning = new THREE.Line(geometry, material);
        
        // Add to scene
        if (this.skill.game && this.skill.game.scene) {
            this.skill.game.scene.add(lightning);
        }
        
        // Animate the dash effect
        const startTime = (this.skill.game && this.skill.game.clock) ? 
            this.skill.game.clock.getElapsedTime() : 0;
        const duration = 0.3; // 0.3 seconds
        
        const updateDash = () => {
            const currentTime = (this.skill.game && this.skill.game.clock) ? 
                this.skill.game.clock.getElapsedTime() : startTime + 0.016; // Use 16ms as fallback delta
            const elapsed = currentTime - startTime;
            const t = elapsed / duration;
            
            if (t >= 1) {
                // Animation complete, remove lightning
                this.skill.game.scene.remove(lightning);
                geometry.dispose();
                material.dispose();
                
                // Remove from update loop
                if (this.skill.game && this.skill.game.removeFromUpdateList) {
                    this.skill.game.removeFromUpdateList(updateDash);
                }
                return;
            }
            
            // Fade out
            material.opacity = 1.0 * (1 - t);
        };
        
        // Add to update loop
        if (this.skill.game && this.skill.game.addToUpdateList) {
            this.skill.game.addToUpdateList(updateDash);
        }
    }
    
    /**
     * Clean up the effect
     * @param {Object} effectObject - The effect object to clean up
     * @override
     */
    cleanup(effectObject) {
        super.cleanup(effectObject);
        
        // Clean up lightning trails
        this.lightningTrails.forEach(trail => {
            if (effectObject.player) {
                effectObject.player.remove(trail.line);
            }
            
            trail.geometry.dispose();
            trail.material.dispose();
        });
        
        this.lightningTrails = [];
        
        // Clean up afterimages
        this.afterimages.forEach(afterimage => {
            if (this.skill.game.scene) {
                this.skill.game.scene.remove(afterimage.mesh);
            }
            
            afterimage.geometry.dispose();
            afterimage.material.dispose();
        });
        
        this.afterimages = [];
    }
    
    /**
     * Create impact effect when the kick hits
     * @param {THREE.Vector3} position - The position of the impact
     * @override
     */
    createImpactEffect(position) {
        super.createImpactEffect(position);
        
        // Add additional momentum impact effect
        this.createMomentumImpactEffect(position);
    }
    
    /**
     * Create a momentum-themed impact effect
     * @param {THREE.Vector3} position - The position to create the effect at
     */
    createMomentumImpactEffect(position) {
        if (!position || !this.skill.game.scene) return;
        
        // Create lightning burst
        const particleCount = 20;
        const particleGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        
        for (let i = 0; i < particleCount; i++) {
            // Start at impact position
            positions[i * 3] = position.x;
            positions[i * 3 + 1] = position.y + 0.5; // Slightly above ground
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
        
        // Create lightning bolts
        const boltCount = 5;
        const bolts = [];
        
        for (let i = 0; i < boltCount; i++) {
            // Create a jagged line for lightning
            const segments = 5;
            const points = [];
            
            // Start at impact position
            points.push(new THREE.Vector3(
                position.x,
                position.y + 0.5,
                position.z
            ));
            
            // Create jagged segments outward
            const angle = (i / boltCount) * Math.PI * 2;
            const length = 1 + Math.random() * 0.5;
            
            for (let j = 1; j <= segments; j++) {
                const t = j / segments;
                
                // Add randomness perpendicular to the direction
                const perpAngle = angle + Math.PI / 2;
                const perpOffset = (Math.random() - 0.5) * 0.3;
                
                points.push(new THREE.Vector3(
                    position.x + Math.cos(angle) * t * length + Math.cos(perpAngle) * perpOffset,
                    position.y + 0.5 + (Math.random() - 0.5) * 0.3,
                    position.z + Math.sin(angle) * t * length + Math.sin(perpAngle) * perpOffset
                ));
            }
            
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const material = new THREE.LineBasicMaterial({
                color: this.lightningColor,
                transparent: true,
                opacity: 0.8,
                blending: THREE.AdditiveBlending
            });
            
            const bolt = new THREE.Line(geometry, material);
            
            // Add to scene
            this.skill.game.scene.add(bolt);
            
            // Store for animation
            bolts.push({
                line: bolt,
                geometry: geometry,
                material: material
            });
        }
        
        // Animate the impact effect
        const startTime = (this.skill.game && this.skill.game.clock) ? 
            this.skill.game.clock.getElapsedTime() : 0;
        const duration = 0.5; // 0.5 seconds
        
        const updateImpact = () => {
            const currentTime = (this.skill.game && this.skill.game.clock) ? 
                this.skill.game.clock.getElapsedTime() : startTime + 0.016; // Use 16ms as fallback delta
            const elapsed = currentTime - startTime;
            const t = elapsed / duration;
            
            if (t >= 1) {
                // Animation complete, remove effects
                this.skill.game.scene.remove(particles);
                
                bolts.forEach(bolt => {
                    this.skill.game.scene.remove(bolt.line);
                    bolt.geometry.dispose();
                    bolt.material.dispose();
                });
                
                particleGeometry.dispose();
                particleMaterial.dispose();
                
                // Remove from update loop
                if (this.skill.game && this.skill.game.removeFromUpdateList) {
                    this.skill.game.removeFromUpdateList(updateImpact);
                }
                return;
            }
            
            // Move particles outward
            const positions = particleGeometry.attributes.position.array;
            
            for (let i = 0; i < particleCount; i++) {
                // Calculate direction from center
                const dx = positions[i * 3] - position.x;
                const dy = positions[i * 3 + 1] - position.y - 0.5;
                const dz = positions[i * 3 + 2] - position.z;
                
                // Normalize direction
                const length = Math.sqrt(dx * dx + dy * dy + dz * dz);
                const dirX = length > 0 ? dx / length : Math.random() - 0.5;
                const dirY = length > 0 ? dy / length : Math.random() - 0.3; // Mostly outward, not up
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
            
            // Fade out lightning bolts
            bolts.forEach(bolt => {
                bolt.material.opacity = 0.8 * (1 - t);
            });
        };
        
        // Add to update loop
        if (this.skill.game && this.skill.game.addToUpdateList) {
            this.skill.game.addToUpdateList(updateImpact);
        }
    }
}