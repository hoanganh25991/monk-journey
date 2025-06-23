import * as THREE from 'three';
import { WaveOfLightEffect } from '../../WaveOfLightEffect.js';

/**
 * Specialized effect for Wave of Light - Wall of Light variant
 * Creates a wall of light that blocks enemies and projectiles
 */
export class WallOfLightEffect extends WaveOfLightEffect {
    constructor(skill) {
        super(skill);
        // Override base properties for this variant
        this.wallWidth = 5.0; // Width of the wall
        this.wallHeight = 3.0; // Height of the wall
        this.wallDuration = 6.0; // Duration of the wall in seconds
    }

    /**
     * Override the base method to create a specialized effect
     * @param {THREE.Group} effectGroup - Group to add the effect to
     * @private
     */
    createWaveEffect(effectGroup) {
        // Call the parent method to create the base effect
        super.createWaveEffect(effectGroup);
        
        // Modify the effect for Wall of Light variant
        this._createWallEffect(effectGroup);
    }
    
    /**
     * Create a wall of light effect
     * @param {THREE.Group} effectGroup - Group to add the effect to
     * @private
     */
    _createWallEffect(effectGroup) {
        // Create wall group
        const wallGroup = new THREE.Group();
        
        // Create main wall
        const wallGeometry = new THREE.BoxGeometry(this.wallWidth, this.wallHeight, 0.5);
        const wallMaterial = new THREE.MeshStandardMaterial({
            color: this.skill.color || 0xffffff,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide,
            emissive: this.skill.color || 0xffffff,
            emissiveIntensity: 0.5
        });
        
        const wall = new THREE.Mesh(wallGeometry, wallMaterial);
        wall.position.y = this.wallHeight / 2; // Position bottom at ground level
        wallGroup.add(wall);
        
        // Create wall frame
        const frameThickness = 0.1;
        const frameGeometry = new THREE.BoxGeometry(this.wallWidth + frameThickness, frameThickness, 0.6);
        const frameMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.8,
            emissive: 0xffffff,
            emissiveIntensity: 0.8
        });
        
        // Top frame
        const topFrame = new THREE.Mesh(frameGeometry, frameMaterial);
        topFrame.position.y = this.wallHeight;
        wallGroup.add(topFrame);
        
        // Bottom frame
        const bottomFrame = new THREE.Mesh(frameGeometry, frameMaterial);
        bottomFrame.position.y = 0;
        wallGroup.add(bottomFrame);
        
        // Left frame
        const leftFrameGeometry = new THREE.BoxGeometry(frameThickness, this.wallHeight, 0.6);
        const leftFrame = new THREE.Mesh(leftFrameGeometry, frameMaterial);
        leftFrame.position.set(-this.wallWidth / 2, this.wallHeight / 2, 0);
        wallGroup.add(leftFrame);
        
        // Right frame
        const rightFrame = new THREE.Mesh(leftFrameGeometry, frameMaterial);
        rightFrame.position.set(this.wallWidth / 2, this.wallHeight / 2, 0);
        wallGroup.add(rightFrame);
        
        // Create energy particles
        const particleCount = 50;
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
            
            // Position randomly on wall
            const x = (Math.random() - 0.5) * this.wallWidth;
            const y = Math.random() * this.wallHeight;
            
            particle.position.set(x, y, (Math.random() - 0.5) * 0.4);
            
            // Store animation data
            particle.userData = {
                initialPos: particle.position.clone(),
                speed: 0.5 + Math.random() * 1.5,
                direction: new THREE.Vector3(
                    (Math.random() - 0.5) * 2,
                    (Math.random() - 0.5) * 2,
                    (Math.random() - 0.5) * 0.5
                ).normalize(),
                maxDistance: 0.3 + Math.random() * 0.3
            };
            
            wallGroup.add(particle);
            particles.push(particle);
        }
        
        // Create runes on the wall
        const runeCount = 5;
        const runes = [];
        
        for (let i = 0; i < runeCount; i++) {
            // Create a rune group
            const runeGroup = new THREE.Group();
            
            // Create a rune symbol (simple geometric shape)
            const runeSize = 0.3 + Math.random() * 0.2;
            let runeGeometry;
            
            // Choose a random rune shape
            const shapeType = Math.floor(Math.random() * 4);
            switch (shapeType) {
                case 0: // Circle
                    runeGeometry = new THREE.CircleGeometry(runeSize, 16);
                    break;
                case 1: // Triangle
                    runeGeometry = new THREE.CircleGeometry(runeSize, 3);
                    break;
                case 2: // Square
                    runeGeometry = new THREE.PlaneGeometry(runeSize * 2, runeSize * 2);
                    break;
                case 3: // Pentagon
                    runeGeometry = new THREE.CircleGeometry(runeSize, 5);
                    break;
            }
            
            const runeMaterial = new THREE.MeshBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.8,
                side: THREE.DoubleSide
            });
            
            const rune = new THREE.Mesh(runeGeometry, runeMaterial);
            
            // Position rune on wall
            const x = (Math.random() - 0.5) * (this.wallWidth - runeSize * 2);
            const y = 0.5 + Math.random() * (this.wallHeight - runeSize * 2 - 0.5);
            
            rune.position.set(x, y, 0.1);
            rune.rotation.z = Math.random() * Math.PI * 2;
            
            // Store animation data
            rune.userData = {
                rotationSpeed: 0.2 + Math.random() * 0.3,
                pulseSpeed: 0.5 + Math.random() * 1.0,
                phase: Math.random() * Math.PI * 2
            };
            
            runeGroup.add(rune);
            wallGroup.add(runeGroup);
            runes.push(runeGroup);
        }
        
        // Create ground effect
        const groundWidth = this.wallWidth;
        const groundGeometry = new THREE.PlaneGeometry(groundWidth, 1);
        const groundMaterial = new THREE.MeshBasicMaterial({
            color: this.skill.color || 0xffffff,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
        });
        
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2; // Lay flat
        ground.position.y = 0.05; // Just above ground
        
        wallGroup.add(ground);
        
        // Add wall group to effect group
        effectGroup.add(wallGroup);
        
        // Store references
        this.wallGroup = wallGroup;
        this.wall = wall;
        this.particles = particles;
        this.runes = runes;
        this.ground = ground;
        this.frames = [topFrame, bottomFrame, leftFrame, rightFrame];
        
        // Hide the bell (from parent class)
        if (effectGroup.children[0]) {
            effectGroup.children[0].visible = false;
        }
        
        // Modify bell state to use wall behavior
        this.bellState = {
            phase: 'active', // Skip descending phase, go straight to active
            impactTime: 0,
            config: {
                bellHeight: 0 // Not used for wall
            }
        };
        
        // Set skill duration to wall duration
        this.skill.duration = this.wallDuration;
    }
    
    /**
     * Override the update method to add custom behavior
     * @param {number} delta - Time since last update in seconds
     * @private
     */
    updateWaveEffect(delta) {
        // Skip parent update method to use our own behavior
        
        // Update wall effect
        if (this.wallGroup) {
            // Pulse wall opacity
            if (this.wall) {
                this.wall.material.opacity = 0.4 + 0.2 * Math.sin(this.elapsedTime * 1.5);
                this.wall.material.emissiveIntensity = 0.3 + 0.2 * Math.sin(this.elapsedTime * 1.5);
            }
            
            // Pulse frames
            if (this.frames) {
                for (const frame of this.frames) {
                    frame.material.opacity = 0.7 + 0.2 * Math.sin(this.elapsedTime * 2);
                    frame.material.emissiveIntensity = 0.6 + 0.3 * Math.sin(this.elapsedTime * 2);
                }
            }
            
            // Update particles
            if (this.particles) {
                for (const particle of this.particles) {
                    if (particle.userData) {
                        // Move particle
                        const moveAmount = particle.userData.speed * delta;
                        particle.position.add(particle.userData.direction.clone().multiplyScalar(moveAmount));
                        
                        // Check if particle has moved too far from initial position
                        const distance = particle.position.distanceTo(particle.userData.initialPos);
                        if (distance > particle.userData.maxDistance) {
                            // Reset to initial position
                            particle.position.copy(particle.userData.initialPos);
                            
                            // New random direction
                            particle.userData.direction = new THREE.Vector3(
                                (Math.random() - 0.5) * 2,
                                (Math.random() - 0.5) * 2,
                                (Math.random() - 0.5) * 0.5
                            ).normalize();
                        }
                    }
                }
            }
            
            // Update runes
            if (this.runes) {
                for (const rune of this.runes) {
                    if (rune.children[0] && rune.children[0].userData) {
                        const runeObj = rune.children[0];
                        
                        // Rotate rune
                        runeObj.rotation.z += runeObj.userData.rotationSpeed * delta;
                        
                        // Pulse opacity
                        runeObj.material.opacity = 0.6 + 0.3 * Math.sin(this.elapsedTime * runeObj.userData.pulseSpeed + runeObj.userData.phase);
                        
                        // Pulse scale
                        const scale = 1.0 + 0.1 * Math.sin(this.elapsedTime * runeObj.userData.pulseSpeed * 1.5 + runeObj.userData.phase);
                        runeObj.scale.set(scale, scale, 1);
                    }
                }
            }
            
            // Update ground effect
            if (this.ground) {
                // Pulse opacity
                this.ground.material.opacity = 0.2 + 0.1 * Math.sin(this.elapsedTime * 1.0);
            }
            
            // Check for collisions with enemies and projectiles
            this._handleCollisions();
        }
        
        // Fade out wall near the end of duration
        const remainingTime = this.skill.duration - this.elapsedTime;
        if (remainingTime < 1.0) {
            const fadeOutFactor = remainingTime;
            
            // Fade out all components
            if (this.wall) {
                this.wall.material.opacity *= fadeOutFactor;
            }
            
            if (this.frames) {
                for (const frame of this.frames) {
                    frame.material.opacity *= fadeOutFactor;
                }
            }
            
            if (this.particles) {
                for (const particle of this.particles) {
                    if (particle.material) {
                        particle.material.opacity *= fadeOutFactor;
                    }
                }
            }
            
            if (this.runes) {
                for (const rune of this.runes) {
                    if (rune.children[0] && rune.children[0].material) {
                        rune.children[0].material.opacity *= fadeOutFactor;
                    }
                }
            }
            
            if (this.ground) {
                this.ground.material.opacity *= fadeOutFactor;
            }
        }
    }
    
    /**
     * Handle collisions with enemies and projectiles
     * @private
     */
    _handleCollisions() {
        if (!this.skill.game) return;
        
        // Get wall position and orientation
        const wallPosition = this.effect.position.clone();
        const wallRotation = this.effect.rotation.y;
        
        // Calculate wall normal vector (perpendicular to wall)
        const wallNormal = new THREE.Vector3(Math.sin(wallRotation), 0, Math.cos(wallRotation));
        
        // Calculate wall endpoints
        const halfWidth = this.wallWidth / 2;
        const leftEndpoint = new THREE.Vector3(
            wallPosition.x - Math.cos(wallRotation) * halfWidth,
            wallPosition.y,
            wallPosition.z + Math.sin(wallRotation) * halfWidth
        );
        
        const rightEndpoint = new THREE.Vector3(
            wallPosition.x + Math.cos(wallRotation) * halfWidth,
            wallPosition.y,
            wallPosition.z - Math.sin(wallRotation) * halfWidth
        );
        
        // Block enemies
        if (this.skill.game.enemyManager) {
            const enemies = this.skill.game.enemyManager.getEnemies();
            
            for (const enemy of enemies) {
                const enemyPosition = enemy.getPosition();
                
                // Check if enemy is near the wall
                if (this._isPointNearWall(enemyPosition, leftEndpoint, rightEndpoint, wallNormal, 0.5)) {
                    // Push enemy away from wall
                    const pushDirection = wallNormal.clone();
                    const dotProduct = pushDirection.dot(new THREE.Vector3().subVectors(enemyPosition, wallPosition));
                    
                    // Ensure we push in the correct direction (away from wall)
                    if (dotProduct < 0) {
                        pushDirection.multiplyScalar(-1);
                    }
                    
                    // Apply push force
                    enemy.applyKnockback(pushDirection, 2.0);
                    
                    // Apply damage if enemy is trying to move through wall
                    const enemyVelocity = enemy.getVelocity();
                    const velocityDotNormal = enemyVelocity.dot(wallNormal);
                    
                    if (Math.abs(velocityDotNormal) > 0.5) {
                        // IMPORTANT: THIS CHECKED BY COLLISIONMANAGER
                        // Apply small damage
                        // enemy.takeDamage(this.skill.damage * 0.1, this.skill.damageType);
                        
                        // Apply stun effect
                        enemy.applyStatusEffect('stunned', 0.5);
                        
                        // Create visual feedback
                        this._createCollisionEffect(enemyPosition);
                    }
                }
            }
        }
        
        // Block projectiles
        if (this.skill.game.projectileManager) {
            const projectiles = this.skill.game.projectileManager.getProjectiles();
            
            for (const projectile of projectiles) {
                // Only block enemy projectiles
                if (projectile.source === 'enemy') {
                    const projectilePosition = projectile.position.clone();
                    const projectileDirection = projectile.direction.clone();
                    
                    // Check if projectile is near the wall and moving toward it
                    if (this._isPointNearWall(projectilePosition, leftEndpoint, rightEndpoint, wallNormal, 0.3)) {
                        const dotProduct = projectileDirection.dot(wallNormal);
                        
                        // If projectile is moving toward wall
                        if (dotProduct < 0) {
                            // Reflect projectile
                            projectile.direction.reflect(wallNormal);
                            
                            // Change source to player
                            projectile.source = 'player';
                            
                            // Increase damage
                            projectile.damage *= 1.2;
                            
                            // Create reflection effect
                            this._createCollisionEffect(projectilePosition);
                        }
                    }
                }
            }
        }
    }
    
    /**
     * Check if a point is near the wall
     * @param {THREE.Vector3} point - Point to check
     * @param {THREE.Vector3} leftEndpoint - Left endpoint of wall
     * @param {THREE.Vector3} rightEndpoint - Right endpoint of wall
     * @param {THREE.Vector3} wallNormal - Normal vector of wall
     * @param {number} threshold - Distance threshold
     * @returns {boolean} - True if point is near wall
     * @private
     */
    _isPointNearWall(point, leftEndpoint, rightEndpoint, wallNormal, threshold) {
        // Project point onto wall line
        const wallDirection = new THREE.Vector3().subVectors(rightEndpoint, leftEndpoint).normalize();
        const pointToLeft = new THREE.Vector3().subVectors(point, leftEndpoint);
        
        // Calculate projection distance along wall
        const projectionDistance = pointToLeft.dot(wallDirection);
        
        // Check if projection is within wall length
        if (projectionDistance < 0 || projectionDistance > leftEndpoint.distanceTo(rightEndpoint)) {
            return false;
        }
        
        // Calculate closest point on wall
        const closestPoint = new THREE.Vector3().addVectors(
            leftEndpoint,
            wallDirection.clone().multiplyScalar(projectionDistance)
        );
        
        // Check distance to wall
        const distanceToWall = point.distanceTo(closestPoint);
        
        // Check height (y-coordinate)
        const heightCheck = point.y <= this.wallHeight;
        
        return distanceToWall <= threshold && heightCheck;
    }
    
    /**
     * Create a collision effect at the given position
     * @param {THREE.Vector3} position - Position to create the effect
     * @private
     */
    _createCollisionEffect(position) {
        if (!this.effect) return;
        
        // Create a flash effect at the collision point
        const flashGeometry = new THREE.SphereGeometry(0.3, 16, 16);
        const flashMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 1.0
        });
        
        const flash = new THREE.Mesh(flashGeometry, flashMaterial);
        flash.position.copy(position);
        
        // Store animation data
        flash.userData = {
            age: 0,
            maxAge: 0.3,
            isCollisionFlash: true
        };
        
        this.effect.add(flash);
        
        // Add to a list for cleanup
        if (!this.collisionEffects) {
            this.collisionEffects = [];
        }
        this.collisionEffects.push(flash);
    }
    
    /**
     * Override the update method to add custom behavior
     * @param {number} delta - Time since last update in seconds
     */
    update(delta) {
        // Call parent update method
        super.update(delta);
        
        // Update collision effects
        if (this.collisionEffects) {
            for (let i = this.collisionEffects.length - 1; i >= 0; i--) {
                const effect = this.collisionEffects[i];
                
                if (effect.userData && effect.userData.isCollisionFlash) {
                    // Update age
                    effect.userData.age += delta;
                    
                    // Scale up
                    const scale = 1.0 + effect.userData.age * 5;
                    effect.scale.set(scale, scale, scale);
                    
                    // Fade out
                    effect.material.opacity = Math.max(0, 1.0 - effect.userData.age / effect.userData.maxAge);
                    
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
                        this.collisionEffects.splice(i, 1);
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
        // Clear collision effects
        if (this.collisionEffects) {
            for (const effect of this.collisionEffects) {
                if (effect.parent) {
                    effect.parent.remove(effect);
                }
                
                if (effect.geometry) effect.geometry.dispose();
                if (effect.material) effect.material.dispose();
            }
            this.collisionEffects.length = 0;
        }
        
        // Clear particle references
        if (this.particles) {
            this.particles.length = 0;
        }
        
        // Clear rune references
        if (this.runes) {
            this.runes.length = 0;
        }
        
        // Clear frame references
        if (this.frames) {
            this.frames.length = 0;
        }
        
        // Call parent dispose method
        super.dispose();
    }
}