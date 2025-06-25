import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { SkillEffect } from './SkillEffect.js';
import { CHARACTER_MODELS } from '../../config/player-models.js';
import * as AnimationUtils from '../../utils/AnimationUtils.js';

/**
 * Specialized effect for Bul Shadow Clone skill
 * Creates multiple shadow clones of the monk in yellow theme color
 * These transparent clones automatically seek out enemies and attack them
 * Clones disappear when the skill duration expires
 */
export class BulShadowCloneEffect extends SkillEffect {
    constructor(skill) {
        super(skill);
        
        // Clone properties from skill config
        this.allyCount = skill.allyCount || 5;
        this.cloneAttackDamage = skill.cloneAttackDamage || 15;
        this.cloneSpeed = skill.cloneSpeed || 8;
        this.cloneTransparency = skill.cloneTransparency || 0.7;
        this.cloneColor = new THREE.Color(skill.cloneColor || "#ffdd00");
        this.autoTargetEnemies = skill.autoTargetEnemies !== false;
        
        // Internal properties
        this.summonTime = 1.0; // Time to complete the summoning animation
        this.summonStage = 'portal'; // 'portal', 'emerging', 'complete'
        this.portalSize = 1.5;
        this.summonHeight = 2.0;
        this.clones = [];
        this.modelPath = 'assets/models/monk.glb'; // Path to the hero model
        this.modelScale = 1.0; // Scale for the hero model
        this.targetUpdateInterval = 1.0; // How often clones should update their targets (seconds)
        this.lastTargetUpdate = 0;
        this.elapsedTime = 0; // Initialize elapsed time for animations
        
        // Find the model configuration
        const modelConfig = CHARACTER_MODELS.find(m => m.path === this.modelPath);
        if (modelConfig) {
            this.modelScale = modelConfig.baseScale * 1.0; // Slightly smaller than player
        }
    }

    /**
     * Create a Bul Shadow Clone effect
     * @param {THREE.Vector3} position - Summoning position
     * @param {THREE.Vector3} direction - Direction the summon should face
     * @returns {THREE.Group} - The created effect
     */
    create(position, direction) {
        position = position.clone();
        position.y -= 2.04;
        
        // Adjust for terrain height to ensure effect is visible
        const adjustedPosition = this.adjustPositionForTerrain(position);
        
        // Create a group for the effect
        const effectGroup = new THREE.Group();
        
        // Create the summoning effect
        this._createSummoningEffect(effectGroup, adjustedPosition, direction);
        
        // Position effect
        effectGroup.position.copy(adjustedPosition);
        effectGroup.rotation.y = Math.atan2(direction.x, direction.z);
        
        // Store effect
        this.effect = effectGroup;
        this.isActive = true;
        this.summonStage = 'portal';
        this.stageTime = 0;
        
        // Schedule clone creation
        setTimeout(() => {
            this._createClones(position, direction);
        }, 1000); // Create clones after 1 second
        
        return effectGroup;
    }
    
    /**
     * Create the summoning effect
     * @param {THREE.Group} effectGroup - Group to add the effect to
     * @param {THREE.Vector3} position - Summoning position
     * @param {THREE.Vector3} direction - Direction the summon should face
     * @private
     */
    _createSummoningEffect(effectGroup, position, direction) {
        // Create summoning circle
        const summoningGroup = new THREE.Group();
        
        // Create base summoning circle
        const circleGeometry = new THREE.CircleGeometry(2, 32 * 5);
        const circleMaterial = new THREE.MeshStandardMaterial({
            color: this.cloneColor,
            transparent: true,
            opacity: 0.5,
            emissive: this.cloneColor,
            emissiveIntensity: 0.5,
            side: THREE.DoubleSide
        });
        
        const circle = new THREE.Mesh(circleGeometry, circleMaterial);
        circle.rotation.x = -Math.PI / 2; // Lay flat on ground
        circle.position.y = 0.05; // Slightly above ground to avoid z-fighting
        summoningGroup.add(circle);
        
        // Create magical rings
        const ringCount = 3;
        for (let i = 0; i < ringCount; i++) {
            const ringRadius = 1.5 - (i * 0.3);
            const ringGeometry = new THREE.RingGeometry(ringRadius - 0.1, ringRadius, 32);
            const ringMaterial = new THREE.MeshStandardMaterial({
                color: this.cloneColor,
                transparent: true,
                opacity: 0.7 - (i * 0.1),
                emissive: this.cloneColor,
                emissiveIntensity: 1.0 - (i * 0.2),
                side: THREE.DoubleSide
            });
            
            const ring = new THREE.Mesh(ringGeometry, ringMaterial);
            ring.rotation.x = -Math.PI / 2; // Lay flat on ground
            ring.position.y = 0.06 + (i * 0.01); // Stack slightly above each other
            
            // Store rotation data
            ring.userData = {
                rotationSpeed: 0.5 - (i * 0.1), // Outer rings rotate slower
                direction: i % 2 === 0 ? 1 : -1 // Alternate directions
            };
            
            summoningGroup.add(ring);
        }
        
        // Create mystical runes
        const runeCount = 5;
        for (let i = 0; i < runeCount; i++) {
            const angle = (i / runeCount) * Math.PI * 2;
            const radius = 1.2;
            
            // Create a custom shape for the rune
            const shape = new THREE.Shape();
            
            // Draw a mystical symbol
            shape.moveTo(0, 0.2);
            shape.lineTo(0.1, 0);
            shape.lineTo(0, -0.2);
            shape.lineTo(-0.1, 0);
            shape.lineTo(0, 0.2);
            
            // Add some details
            shape.moveTo(0, 0.1);
            shape.lineTo(0.05, 0);
            shape.lineTo(0, -0.1);
            shape.lineTo(-0.05, 0);
            shape.lineTo(0, 0.1);
            
            const runeGeometry = new THREE.ShapeGeometry(shape);
            const runeMaterial = new THREE.MeshStandardMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.9,
                emissive: this.cloneColor,
                emissiveIntensity: 1.0,
                side: THREE.DoubleSide
            });
            
            const rune = new THREE.Mesh(runeGeometry, runeMaterial);
            
            // Position rune
            rune.position.set(
                Math.cos(angle) * radius,
                0.1,
                Math.sin(angle) * radius
            );
            
            // Rotate rune to face up
            rune.rotation.x = -Math.PI / 2;
            
            // Store animation data
            rune.userData = {
                initialPos: rune.position.clone(),
                initialAngle: angle,
                radius: radius,
                pulseSpeed: 0.5 + (Math.random() * 1.0),
                moveSpeed: 0.2 + (Math.random() * 0.3)
            };
            
            summoningGroup.add(rune);
        }
        
        // Create particles
        const particleCount = 30;
        const particles = [];
        
        for (let i = 0; i < particleCount; i++) {
            // Random position around the summoning circle
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 2;
            const height = 0.1 + (Math.random() * 3);
            
            // Create particle
            const particleSize = 0.05 + (Math.random() * 0.1);
            const particleGeometry = new THREE.SphereGeometry(particleSize, 8, 8);
            const particleMaterial = new THREE.MeshStandardMaterial({
                color: this.cloneColor,
                transparent: true,
                opacity: 0.6 + (Math.random() * 0.4),
                emissive: this.cloneColor,
                emissiveIntensity: 0.5
            });
            
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            particle.position.set(
                Math.cos(angle) * radius,
                height,
                Math.sin(angle) * radius
            );
            
            // Store animation data
            particle.userData = {
                initialPos: particle.position.clone(),
                speed: 0.5 + (Math.random() * 1.5)
            };
            
            summoningGroup.add(particle);
            particles.push(particle);
        }
        
        // Add summoning group to effect
        effectGroup.add(summoningGroup);
        this.summoningGroup = summoningGroup;
    }
    
    /**
     * Create shadow clones
     * @param {THREE.Vector3} position - Position to create clones at
     * @param {THREE.Vector3} direction - Direction clones should face
     * @private
     */
    _createClones(position, direction) {
        if (!this.skill.game || !this.skill.game.player) return;
        
        // Clear any existing clones
        this._clearClones();
        
        // Create new clones
        for (let i = 0; i < this.allyCount; i++) {
            this._createSingleClone(position, direction, i);
        }
    }
    
    /**
     * Create a single shadow clone
     * @param {THREE.Vector3} position - Base position
     * @param {THREE.Vector3} direction - Direction to face
     * @param {number} index - Clone index
     * @private
     */
    _createSingleClone(position, direction, index) {
        // Create a group for the clone
        const cloneGroup = new THREE.Group();
        
        // Calculate position offset (spread clones in a circle)
        const angle = (index / this.allyCount) * Math.PI * 2;
        const radius = 2 + Math.random() * 2; // Random distance from center
        const offsetX = Math.cos(angle) * radius;
        const offsetZ = Math.sin(angle) * radius;
        
        // Position the clone
        cloneGroup.position.copy(position);
        cloneGroup.position.x += offsetX;
        cloneGroup.position.z += offsetZ;
        
        // Load the hero model
        const loader = new GLTFLoader();
        loader.load(
            this.modelPath,
            (gltf) => {
                // Store the loaded model
                const cloneModel = gltf.scene;
                
                // Apply the shadow clone material to all meshes
                cloneModel.traverse((node) => {
                    if (node.isMesh) {
                        // Store the original material for reference
                        node.userData.originalMaterial = node.material;
                        
                        // Create a new transparent, glowing material
                        const cloneMaterial = new THREE.MeshStandardMaterial({
                            color: this.cloneColor,
                            transparent: true,
                            opacity: this.cloneTransparency,
                            emissive: this.cloneColor,
                            emissiveIntensity: 0.5,
                            side: THREE.DoubleSide
                        });
                        
                        // Apply the new material
                        node.material = cloneMaterial;
                    }
                });
                
                // Scale the model
                cloneModel.scale.set(this.modelScale, this.modelScale, this.modelScale);
                
                // Set up animations if they exist
                let mixer = null;
                let animations = {};
                let currentAnimation = null;
                
                if (gltf.animations && gltf.animations.length > 0) {
                    mixer = new THREE.AnimationMixer(cloneModel);
                    
                    // Create animation actions for all animations
                    gltf.animations.forEach(anim => {
                        const action = mixer.clipAction(anim);
                        animations[anim.name] = action;
                    });
                    
                    // Use AnimationUtils to play the idle animation
                    const result = AnimationUtils.playAnimation(
                        animations,
                        null,
                        'idle',
                        'stand',
                        0.3
                    );
                    
                    if (result.success) {
                        currentAnimation = result.currentAnimation;
                    } else {
                        // If no specific animation found, play the first one
                        if (gltf.animations.length > 0) {
                            const firstAnim = gltf.animations[0].name;
                            animations[firstAnim].play();
                            currentAnimation = firstAnim;
                        }
                    }
                }
                
                // Add the model to the group
                cloneGroup.add(cloneModel);
                
                // Add energy aura
                this._addCloneAura(cloneGroup);
                
                // Add to scene
                this.skill.game.scene.add(cloneGroup);
                
                // Create clone object
                const clone = {
                    group: cloneGroup,
                    model: cloneModel,
                    mixer: mixer,
                    animations: animations,
                    currentAnimation: currentAnimation,
                    target: null,
                    state: 'idle', // idle, seeking, attacking
                    lastAttackTime: 0,
                    attackCooldown: 1.0, // 1 second between attacks
                    index: index,
                    followPlayer: true // Default to following player when no enemies
                };
                
                // Add clone to the array
                this.clones.push(clone);
            },
            // Progress callback
            (xhr) => {
                console.debug(`Loading clone model ${index}: ${(xhr.loaded / xhr.total) * 100}% loaded`);
            },
            // Error callback
            (error) => {
                console.error(`Error loading clone model ${index}:`, error);
            }
        );
    }
    
    /**
     * Add energy aura to a clone
     * @param {THREE.Group} cloneGroup - Group to add aura to
     * @private
     */
    _addCloneAura(cloneGroup) {
        // Create energy sphere
        const auraGeometry = new THREE.SphereGeometry(0.8, 16, 16);
        const auraMaterial = new THREE.MeshBasicMaterial({
            color: this.cloneColor,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            wireframe: true
        });
        
        const aura = new THREE.Mesh(auraGeometry, auraMaterial);
        aura.scale.set(1.5, 1.5, 1.5);
        cloneGroup.add(aura);
        
        // Store for animation
        cloneGroup.userData.aura = aura;
    }
    
    /**
     * Clear all clones
     * @private
     */
    _clearClones() {
        for (const clone of this.clones) {
            // Stop and dispose of animation mixer if it exists
            if (clone.mixer) {
                clone.mixer.stopAllAction();
                clone.mixer.uncacheRoot(clone.model);
            }
            
            if (clone.group && clone.group.parent) {
                clone.group.parent.remove(clone.group);
            }
            
            // Dispose of geometries and materials
            if (clone.group) {
                clone.group.traverse(child => {
                    if (child.geometry) {
                        child.geometry.dispose();
                    }
                    
                    if (child.material) {
                        if (Array.isArray(child.material)) {
                            child.material.forEach(material => material.dispose());
                        } else {
                            child.material.dispose();
                        }
                    }
                });
            }
        }
        
        this.clones = [];
    }
    
    /**
     * Find nearest enemy for a clone to target
     * @param {THREE.Vector3} clonePosition - Position of the clone
     * @param {number} maxDistance - Maximum distance to search
     * @returns {Object|null} - The nearest enemy or null if none found
     * @private
     */
    _findNearestEnemy(clonePosition, maxDistance = 30) {
        if (!this.skill.game || !this.skill.game.enemyManager) return null;
        
        // Use getEnemiesNearPosition instead of getEnemies
        const enemies = this.skill.game.enemyManager.getEnemiesNearPosition(clonePosition, maxDistance);
        if (!enemies || enemies.length === 0) return null;
        
        let nearestEnemy = null;
        let nearestDistance = maxDistance;
        
        for (const enemy of enemies) {
            // Check if enemy is alive - use state.isDead if isAlive() doesn't exist
            if (typeof enemy.isAlive === 'function') {
                if (!enemy.isAlive()) continue;
            } else if (enemy.state && enemy.state.isDead) {
                continue;
            }
            
            // Get enemy position - use position property if getPosition() doesn't exist
            let enemyPosition;
            if (typeof enemy.getPosition === 'function') {
                enemyPosition = enemy.getPosition();
            } else if (enemy.position) {
                enemyPosition = enemy.position;
            } else {
                continue; // Skip if we can't get position
            }
            
            if (!enemyPosition) continue;
            
            const distance = clonePosition.distanceTo(enemyPosition);
            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestEnemy = enemy;
            }
        }
        
        return nearestEnemy;
    }
    
    /**
     * Update clone targets
     * @private
     */
    _updateCloneTargets() {
        if (!this.autoTargetEnemies) return;
        
        for (const clone of this.clones) {
            if (!clone.group) continue;
            
            // Find nearest enemy
            const enemy = this._findNearestEnemy(clone.group.position);
            
            // Update clone target
            clone.target = enemy;
            
            // Update clone state
            if (enemy) {
                clone.state = 'seeking';
            } else {
                clone.state = 'idle';
            }
        }
    }
    
    /**
     * Update clone movement and behavior
     * @param {number} delta - Time since last update in seconds
     * @private
     */
    _updateClones(delta) {
        for (const clone of this.clones) {
            if (!clone.group) continue;
            
            // Update animation mixer if it exists
            if (clone.mixer) {
                clone.mixer.update(delta);
                
                // Update animations based on state
                if (clone.animations && Object.keys(clone.animations).length > 0) {
                    let animationToPlay = 'idle';
                    
                    switch (clone.state) {
                        case 'idle':
                            animationToPlay = 'idle';
                            break;
                        case 'seeking':
                            animationToPlay = 'walk';
                            break;
                        case 'attacking':
                            animationToPlay = 'attack';
                            break;
                    }
                    
                    // Use AnimationUtils to handle animation transitions
                    const result = AnimationUtils.playAnimation(
                        clone.animations,
                        clone.currentAnimation,
                        animationToPlay,
                        null,
                        0.3
                    );
                    
                    if (result.success) {
                        clone.currentAnimation = result.currentAnimation;
                    }
                }
            }
            
            // Update clone based on state
            switch (clone.state) {
                case 'idle':
                    this._updateIdleClone(clone, delta);
                    break;
                    
                case 'seeking':
                    this._updateSeekingClone(clone, delta);
                    break;
                    
                case 'attacking':
                    this._updateAttackingClone(clone, delta);
                    break;
            }
            
            // Update aura animation
            if (clone.group.userData.aura) {
                const aura = clone.group.userData.aura;
                
                // Pulse the aura
                const pulseFactor = 1 + 0.2 * Math.sin(this.elapsedTime * 5 + clone.index);
                aura.scale.set(pulseFactor, pulseFactor, pulseFactor);
                
                // Rotate the aura
                aura.rotation.y += delta * 0.5;
                aura.rotation.z += delta * 0.3;
            }
        }
    }
    
    /**
     * Update an idle clone
     * @param {Object} clone - Clone data
     * @param {number} delta - Time since last update in seconds
     * @private
     */
    _updateIdleClone(clone, delta) {
        if (!clone.group) return;
        
        // If player exists, move towards player
        if (this.skill.game && this.skill.game.player) {
            const playerPosition = this.skill.game.player.getPosition();
            if (playerPosition) {
                // Get player's movement direction
                const playerDirection = this.skill.game.player.getDirection ? 
                    this.skill.game.player.getDirection() : 
                    new THREE.Vector3(0, 0, 1);
                
                // Calculate position around player based on formation pattern
                let targetX, targetZ;
                
                if (clone.followPlayer) {
                    // Calculate position in a circular formation around the player
                    const angle = (clone.index / this.allyCount) * Math.PI * 2 + this.elapsedTime * 0.2;
                    const radius = 2 + Math.sin(this.elapsedTime + clone.index) * 0.5;
                    targetX = playerPosition.x + Math.cos(angle) * radius;
                    targetZ = playerPosition.z + Math.sin(angle) * radius;
                } else {
                    // When not following, maintain current position but face same direction as player
                    targetX = clone.group.position.x;
                    targetZ = clone.group.position.z;
                    
                    // But if too far from player, start following again
                    const distanceToPlayer = clone.group.position.distanceTo(playerPosition);
                    if (distanceToPlayer > 15) {
                        clone.followPlayer = true;
                    }
                }
                
                // Move towards target position
                const moveSpeed = this.cloneSpeed * 0.5 * delta; // Move slower when idle
                const dx = targetX - clone.group.position.x;
                const dz = targetZ - clone.group.position.z;
                const distance = Math.sqrt(dx * dx + dz * dz);
                
                if (distance > 0.1) {
                    clone.group.position.x += (dx / distance) * moveSpeed;
                    clone.group.position.z += (dz / distance) * moveSpeed;
                    
                    // Face movement direction
                    clone.group.rotation.y = Math.atan2(dx, dz);
                } else {
                    // When not moving, face same direction as player
                    clone.group.rotation.y = Math.atan2(playerDirection.x, playerDirection.z);
                }
                
                // Match player's Y position
                clone.group.position.y = playerPosition.y;
            }
        }
    }
    
    /**
     * Update a seeking clone
     * @param {Object} clone - Clone data
     * @param {number} delta - Time since last update in seconds
     * @private
     */
    _updateSeekingClone(clone, delta) {
        if (!clone.group || !clone.target) {
            clone.state = 'idle';
            clone.followPlayer = true; // Return to following player when no target
            return;
        }
        
        // Check if target is still alive
        let isTargetAlive = true;
        if (typeof clone.target.isAlive === 'function') {
            isTargetAlive = clone.target.isAlive();
        } else if (clone.target.state && clone.target.state.isDead) {
            isTargetAlive = !clone.target.state.isDead;
        }
        
        if (!isTargetAlive) {
            clone.target = null;
            clone.state = 'idle';
            clone.followPlayer = true; // Return to following player when target dies
            return;
        }
        
        // Get target position
        let targetPosition;
        if (typeof clone.target.getPosition === 'function') {
            targetPosition = clone.target.getPosition();
        } else if (clone.target.position) {
            targetPosition = clone.target.position;
        }
        
        if (!targetPosition) {
            clone.state = 'idle';
            clone.followPlayer = true;
            return;
        }
        
        // Calculate distance to target
        const dx = targetPosition.x - clone.group.position.x;
        const dz = targetPosition.z - clone.group.position.z;
        const distance = Math.sqrt(dx * dx + dz * dz);
        
        // If target is too far away, go back to idle and follow player
        if (distance > 30) {
            clone.state = 'idle';
            clone.target = null;
            clone.followPlayer = true;
            return;
        }
        
        // If close enough, switch to attacking
        if (distance < 1.5) {
            clone.state = 'attacking';
            clone.followPlayer = false; // Stop following player while attacking
            return;
        }
        
        // Move towards target
        const moveSpeed = this.cloneSpeed * delta;
        clone.group.position.x += (dx / distance) * moveSpeed;
        clone.group.position.z += (dz / distance) * moveSpeed;
        
        // Match target's Y position
        clone.group.position.y = targetPosition.y;
        
        // Face target
        clone.group.rotation.y = Math.atan2(dx, dz);
        
        // While seeking, don't follow player
        clone.followPlayer = false;
    }
    
    /**
     * Update an attacking clone
     * @param {Object} clone - Clone data
     * @param {number} delta - Time since last update in seconds
     * @private
     */
    _updateAttackingClone(clone, delta) {
        if (!clone.group || !clone.target) {
            clone.state = 'idle';
            clone.followPlayer = true; // Return to following player when no target
            return;
        }
        
        // Check if target is still alive
        let isTargetAlive = true;
        if (typeof clone.target.isAlive === 'function') {
            isTargetAlive = clone.target.isAlive();
        } else if (clone.target.state && clone.target.state.isDead) {
            isTargetAlive = !clone.target.state.isDead;
        }
        
        if (!isTargetAlive) {
            clone.target = null;
            clone.state = 'idle';
            clone.followPlayer = true; // Return to following player when target dies
            return;
        }
        
        // Get target position
        let targetPosition;
        if (typeof clone.target.getPosition === 'function') {
            targetPosition = clone.target.getPosition();
        } else if (clone.target.position) {
            targetPosition = clone.target.position;
        }
        
        if (!targetPosition) {
            clone.state = 'idle';
            clone.followPlayer = true;
            return;
        }
        
        // Calculate distance to target
        const dx = targetPosition.x - clone.group.position.x;
        const dz = targetPosition.z - clone.group.position.z;
        const distance = Math.sqrt(dx * dx + dz * dz);
        
        // If too far, switch back to seeking
        if (distance > 2.0) {
            clone.state = 'seeking';
            clone.followPlayer = false; // Don't follow player while seeking
            return;
        }
        
        // Face target
        clone.group.rotation.y = Math.atan2(dx, dz);
        
        // Attack if cooldown has elapsed
        const now = Date.now() / 1000;
        if (now - clone.lastAttackTime >= clone.attackCooldown) {
            // Perform attack
            this._cloneAttack(clone);
            
            // Reset cooldown
            clone.lastAttackTime = now;
        }
        
        // While attacking, don't follow player
        clone.followPlayer = false;
    }
    
    /**
     * Perform clone attack
     * @param {Object} clone - Clone data
     * @private
     */
    _cloneAttack(clone) {
        if (!clone.target) return;
        
        // Apply damage to target if takeDamage method exists
        if (typeof clone.target.takeDamage === 'function') {
            clone.target.takeDamage(this.cloneAttackDamage);
        } else if (clone.target.health !== undefined) {
            // Fallback: directly modify health if available
            clone.target.health -= this.cloneAttackDamage;
            
            // Check if enemy died
            if (clone.target.health <= 0 && clone.target.state) {
                clone.target.state.isDead = true;
            }
            
            console.debug(`Clone attacked enemy for ${this.cloneAttackDamage} damage`);
        }
        
        // Create attack effect
        this._createAttackEffect(clone);
    }
    
    /**
     * Create visual effect for clone attack
     * @param {Object} clone - Clone data
     * @private
     */
    _createAttackEffect(clone) {
        if (!clone.group || !clone.target) return;
        
        // Get target position
        let targetPosition;
        if (typeof clone.target.getPosition === 'function') {
            targetPosition = clone.target.getPosition();
        } else if (clone.target.position) {
            targetPosition = clone.target.position;
        }
        
        if (!targetPosition) return;
        
        // Create attack line
        const lineGeometry = new THREE.BufferGeometry();
        const lineMaterial = new THREE.LineBasicMaterial({
            color: this.cloneColor,
            transparent: true,
            opacity: 0.7,
            linewidth: 3
        });
        
        // Set line points
        const points = [
            new THREE.Vector3(0, 0.8, 0), // Start at clone's hand level
            targetPosition.clone().sub(clone.group.position) // End at target
        ];
        lineGeometry.setFromPoints(points);
        
        const line = new THREE.Line(lineGeometry, lineMaterial);
        clone.group.add(line);
        
        // Create impact flash
        const flashGeometry = new THREE.SphereGeometry(0.5, 8, 8);
        const flashMaterial = new THREE.MeshBasicMaterial({
            color: this.cloneColor,
            transparent: true,
            opacity: 0.7,
            blending: THREE.AdditiveBlending
        });
        
        const flash = new THREE.Mesh(flashGeometry, flashMaterial);
        flash.position.copy(targetPosition.clone().sub(clone.group.position));
        clone.group.add(flash);
        
        // Animate and remove after short duration
        setTimeout(() => {
            if (line.parent) line.parent.remove(line);
            if (flash.parent) flash.parent.remove(flash);
            
            lineGeometry.dispose();
            lineMaterial.dispose();
            flashGeometry.dispose();
            flashMaterial.dispose();
        }, 200);
    }
    
    /**
     * Update the Bul Shadow Clone effect
     * @param {number} delta - Time since last update in seconds
     */
    update(delta) {
        // Call parent update to handle duration check
        super.update(delta);
        
        // If effect is no longer active (duration expired), return
        if (!this.isActive || !this.effect) return;
        
        // IMPORTANT: Update the skill's position property to match the effect's position
        // This is crucial for collision detection in CollisionManager
        this.skill.position.copy(this.effect.position);
        
        // Update summoning effect animation
        if (this.summonStage === 'portal' && this.summoningGroup) {
            this.stageTime += delta;
            
            // Animate summoning circle
            this.summoningGroup.children.forEach(child => {
                // Animate rings
                if (child.userData && child.userData.rotationSpeed) {
                    child.rotation.z += child.userData.rotationSpeed * child.userData.direction * delta;
                }
                
                // Animate runes
                if (child.userData && child.userData.pulseSpeed) {
                    const pulse = Math.sin(this.elapsedTime * child.userData.pulseSpeed) * 0.2 + 0.8;
                    child.scale.set(pulse, pulse, pulse);
                    
                    // Orbit movement
                    if (child.userData.initialAngle !== undefined) {
                        const angle = child.userData.initialAngle + this.elapsedTime * child.userData.moveSpeed;
                        const radius = child.userData.radius;
                        
                        child.position.x = Math.cos(angle) * radius;
                        child.position.z = Math.sin(angle) * radius;
                    }
                }
                
                // Animate particles
                if (child.userData && child.userData.speed) {
                    // Float upward
                    child.position.y += delta * child.userData.speed * 0.5;
                    
                    // Fade out as they rise
                    if (child.material) {
                        child.material.opacity = Math.max(0, 1.0 - (child.position.y / 5.0));
                    }
                    
                    // Reset particles that have risen too high
                    if (child.position.y > 5.0) {
                        child.position.y = 0.1 + (Math.random() * 0.5);
                        
                        // Randomize horizontal position
                        const angle = Math.random() * Math.PI * 2;
                        const radius = Math.random() * 2;
                        
                        child.position.x = Math.cos(angle) * radius;
                        child.position.z = Math.sin(angle) * radius;
                        
                        if (child.material) {
                            child.material.opacity = 0.6 + (Math.random() * 0.4);
                        }
                    }
                }
            });
            
            // Transition to next stage after summon time
            if (this.stageTime >= this.summonTime) {
                this.summonStage = 'complete';
                
                // Fade out summoning effect
                this._fadeSummoningEffect();
            }
        }
        
        // Update clone target selection periodically
        this.lastTargetUpdate += delta;
        if (this.lastTargetUpdate >= this.targetUpdateInterval) {
            this._updateCloneTargets();
            this.lastTargetUpdate = 0;
        }
        
        // Update clones
        this._updateClones(delta);
    }
    
    /**
     * Fade out the summoning effect
     * @private
     */
    _fadeSummoningEffect() {
        if (!this.summoningGroup) return;
        
        const fadeOutDuration = 1.0; // 1 second fade out
        const startTime = Date.now() / 1000;
        
        const fadeInterval = setInterval(() => {
            const now = Date.now() / 1000;
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / fadeOutDuration, 1);
            
            // Fade out all materials
            this.summoningGroup.traverse(child => {
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(mat => {
                            mat.opacity = (1 - progress) * mat.opacity;
                        });
                    } else {
                        child.material.opacity = (1 - progress) * child.material.opacity;
                    }
                }
            });
            
            // Remove when fully faded
            if (progress >= 1) {
                clearInterval(fadeInterval);
                
                if (this.summoningGroup.parent) {
                    this.summoningGroup.parent.remove(this.summoningGroup);
                }
                
                this.summoningGroup = null;
            }
        }, 50); // Update every 50ms
    }
    
    /**
     * Clean up resources when the effect is removed
     */
    cleanup() {
        super.cleanup();
        
        // Clear all clones
        this._clearClones();
        
        // Clear summoning effect
        if (this.summoningGroup && this.summoningGroup.parent) {
            this.summoningGroup.parent.remove(this.summoningGroup);
            this.summoningGroup = null;
        }
    }
    
    /**
     * Dispose of the effect and clean up resources
     * Overrides the parent class dispose method to ensure proper cleanup of clones
     */
    dispose() {
        // First clear all clones
        this._clearClones();
        
        // Clear summoning effect
        if (this.summoningGroup && this.summoningGroup.parent) {
            this.summoningGroup.parent.remove(this.summoningGroup);
            
            // Dispose of geometries and materials in the summoning group
            this.summoningGroup.traverse(child => {
                if (child.geometry) {
                    child.geometry.dispose();
                }
                
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(material => material.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
            });
            
            this.summoningGroup = null;
        }
        
        // Remove clones from the scene
        for (const clone of this.clones) {
            if (clone.mixer) {
                clone.mixer.stopAllAction();
                clone.mixer.uncacheRoot(clone.model);
            }
            
            if (clone.group && clone.group.parent) {
                clone.group.parent.remove(clone.group);
            }
        }
        
        // Clear the clones array
        this.clones = [];
        
        // Call the parent class dispose method to handle the main effect
        super.dispose();
    }
    
    /**
     * Reset the effect to its initial state
     * This allows the effect to be reused without creating a new instance
     * Overrides the parent class reset method to ensure proper cleanup of clones
     */
    reset() {
        // Clear all clones
        this._clearClones();
        
        // Clear summoning effect
        if (this.summoningGroup && this.summoningGroup.parent) {
            this.summoningGroup.parent.remove(this.summoningGroup);
            this.summoningGroup = null;
        }
        
        // Reset state variables
        this.summonStage = 'portal';
        this.stageTime = 0;
        this.lastTargetUpdate = 0;
        
        // Call the parent class reset method
        super.reset();
    }
}