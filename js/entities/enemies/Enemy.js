import * as THREE from 'three';
import { EnemyModelFactory } from './models/EnemyModelFactory.js';
import { ENEMY_BEHAVIOR_SETTINGS, ENEMY_TYPE_BEHAVIOR } from '../../config/enemy-behavior.js';
import { ENEMY_CONFIG } from '../../config/game-balance.js';

export class Enemy {
    // Static counter for generating unique IDs
    static idCounter = 0;
    
    /**
     * @param {THREE.Scene} scene - Generation options
     * @param {import("../player/Player.js").Player} player - Item level (defaults to player level)
     * @param {Object} options.subType - Force a specific subType
     */
    constructor(scene, player, config) {
        this.scene = scene;
        this.player = player;
        
        // Assign a unique ID to each enemy
        this.id = Enemy.idCounter++;
        
        // Enemy configuration
        this.type = config.type || 'skeleton';
        this.name = config.name || 'Enemy';
        this.health = config.health || 50;
        this.maxHealth = config.health || 50;
        this.damage = config.damage || 10;
        this.speed = config.speed || 3;
        this.attackRange = config.attackRange || 1.5;
        this.attackSpeed = config.attackSpeed || 1.5;
        this.experienceValue = config.experienceValue || 20;
        this.color = config.color || 0xcccccc;
        this.scale = config.scale || 1;
        this.isBoss = config.isBoss || false;
        this.isActive = true;
        
        // Flag for minimap identification
        this.isEnemy = true;
        
        // For multiplayer targeting
        this.targetPlayer = player; // Default target is the local player
        
        // Enemy state
        this.state = {
            isMoving: false,
            isAttacking: false,
            isDead: false,
            attackCooldown: 0,
            isKnockedBack: false,
            knockbackEndTime: 0,
            isAggressive: false,
            aggressionEndTime: 0,
            isStunned: false,
            stunEndTime: 0
        };
        
        // Apply behavior settings from config
        this.applyBehaviorSettings();
        
        // Enemy position and orientation
        this.position = new THREE.Vector3();
        this.rotation = new THREE.Euler(0, 0, 0);
        
        // Enemy collision
        this.collisionRadius = 0.5 * this.scale;
        this.heightOffset = 0.4 * this.scale; // Adjusted to place enemies on the ground
        
        // Enemy model
        this.modelGroup = null;
        this.model = null;
        
        // Reference to game world for terrain height
        this.world = null;
        
        // Flag to control terrain height updates (useful for bosses with fixed positions)
        // Disable terrain height updates for bosses to prevent sinking
        this.allowTerrainHeightUpdates = !this.isBoss;
        
        // Flag to track if initial position has been set (for bosses)
        this.initialPositionSet = false;
        
        // Store the initial Y position for bosses to prevent sinking
        this.initialYPosition = null;
    }
    
    init() {
        // Create enemy model
        this.createModel();
    }
    
    applyBehaviorSettings() {
        // Get type-specific behavior settings or use default
        const typeBehavior = ENEMY_TYPE_BEHAVIOR[this.type] || ENEMY_TYPE_BEHAVIOR['default'];
        
        // Apply detection range
        this.detectionRange = typeBehavior.detectionRange || ENEMY_BEHAVIOR_SETTINGS.detectionRange;
        
        // Apply attack range multiplier
        this.attackRange *= (typeBehavior.attackRangeMultiplier || ENEMY_BEHAVIOR_SETTINGS.attackRangeMultiplier);
        
        // Apply aggression settings
        this.persistentAggression = typeBehavior.persistentAggression || 
                                   ENEMY_BEHAVIOR_SETTINGS.aggressionSettings.persistentAggression;
        this.aggressionTimeout = typeBehavior.aggressionTimeout || 
                                ENEMY_BEHAVIOR_SETTINGS.aggressionSettings.aggressionTimeout;
    }

    createModel() {
        // Create a group for the enemy
        this.modelGroup = new THREE.Group();
        
        // Create the appropriate model using the factory
        this.model = EnemyModelFactory.createModel(this, this.modelGroup);
        
        // Create the actual 3D model
        this.model.createModel();
        
        // Scale model if needed
        if (this.scale !== 1) {
            this.modelGroup.scale.set(this.scale, this.scale, this.scale);
        }
        
        // Add model to scene
        this.scene.add(this.modelGroup);
    }
    
    updateAnimations(delta) {
        // Use the model's updateAnimations method
        if (this.model && typeof this.model.updateAnimations === 'function') {
            this.model.updateAnimations(delta);
        }
    }
    
    /**
     * Play idle animation
     */
    playIdleAnimation() {
        // Set state to idle
        if (this.state) {
            this.state.isMoving = false;
            this.state.isAttacking = false;
        }
        
        // Update animations will handle the actual animation
        // based on the state we just set
    }
    
    /**
     * Play walk animation
     */
    playWalkAnimation() {
        // Set state to moving
        if (this.state) {
            this.state.isMoving = true;
            this.state.isAttacking = false;
        }
    }
    
    /**
     * Play attack animation
     */
    playAttackAnimation() {
        // Set state to attacking
        if (this.state) {
            this.state.isAttacking = true;
        }
    }

    update(delta) {
        // Skip update if not active (pooled) or dead, but allow minimal updates for death animation
        if (!this.isActive || this.state.isDead) {
            // For bosses, we want to minimize processing when dead to prevent lag
            if (this.isBoss) {
                // Only update if death animation is still in progress
                if (this.deathAnimationInProgress) {
                    // Just update the model position/rotation if needed
                    if (this.modelGroup) {
                        this.modelGroup.position.copy(this.position);
                        this.modelGroup.rotation.copy(this.rotation);
                    }
                }
            }
            return;
        }
        
        // For bosses, ensure Y position is maintained at all times
        if (this.isBoss && this.initialPositionSet && this.initialYPosition !== null) {
            // Force Y position to always be the initial value
            if (this.position.y !== this.initialYPosition) {
                this.position.y = this.initialYPosition;
                
                // Also force the model's Y position
                if (this.modelGroup) {
                    this.modelGroup.position.y = this.initialYPosition;
                }
            }
        }
        
        // Handle knockback
        if (this.state.isKnockedBack) {
            if (Date.now() < this.state.knockbackEndTime) {
                // Continue knockback
                this.updateTerrainHeight();
                this.updateAnimations(delta);
                return;
            } else {
                // End knockback
                this.state.isKnockedBack = false;
            }
        }
        
        // Handle stun state
        if (this.state.isStunned) {
            if (Date.now() < this.state.stunEndTime) {
                // Enemy is stunned, only update terrain height and animations
                this.updateTerrainHeight();
                this.updateAnimations(delta);
                return;
            } else {
                // Stun has ended
                this.state.isStunned = false;
                console.debug(`${this.name} is no longer stunned`);
            }
        }
        
        // Update terrain height
        this.updateTerrainHeight();
        
        // Regenerate health based on enemy type
        this.regenerateHealth(delta);
        
        // Update attack cooldown
        if (this.state.attackCooldown > 0) {
            this.state.attackCooldown -= delta;
        }
        
        // Reset movement state
        this.state.isMoving = false;
        
        // Find the closest player (local or remote)
        this.findClosestPlayer();
        
        // Get distance to target player
        const playerPosition = this.targetPlayer.getPosition();
        const distanceToPlayer = Math.sqrt(
            Math.pow(playerPosition.x - this.position.x, 2) +
            Math.pow(playerPosition.z - this.position.z, 2)
        );
        
        // Debug log for targeting - log every 2 seconds to avoid spam
        if (Math.random() < 0.01) { // ~1% chance each frame to log
            const targetType = this.targetPlayer === this.player ? "player" : "remote player";
            console.debug(`Enemy ${this.id} targeting ${targetType}, distance: ${distanceToPlayer.toFixed(2)}, attack range: ${this.attackRange.toFixed(2)}`);
        }
        
        // Special abilities for certain enemy types
        if (this.type === 'frost_titan') {
            // Initialize special ability cooldowns if not already
            if (!this.specialAbilityCooldowns) {
                this.specialAbilityCooldowns = {
                    iceStorm: 0,
                    frostNova: 0
                };
            }
            
            // Reduce cooldowns
            if (this.specialAbilityCooldowns.iceStorm > 0) {
                this.specialAbilityCooldowns.iceStorm -= delta;
            }
            
            if (this.specialAbilityCooldowns.frostNova > 0) {
                this.specialAbilityCooldowns.frostNova -= delta;
            }
            
            // Ice Storm ability (ranged)
            if (distanceToPlayer <= 10 && distanceToPlayer > this.attackRange && this.specialAbilityCooldowns.iceStorm <= 0) {
                this.castIceStorm(playerPosition);
                this.specialAbilityCooldowns.iceStorm = 8; // 8 second cooldown
                return;
            }
            
            // Frost Nova ability (close range)
            if (distanceToPlayer <= this.attackRange * 1.5 && this.specialAbilityCooldowns.frostNova <= 0) {
                this.castFrostNova();
                this.specialAbilityCooldowns.frostNova = 5; // 5 second cooldown
                return;
            }
        }
        
        // Check if target (player or remote player) is in attack range
        if (distanceToPlayer <= this.attackRange) {
            console.debug(`Enemy ${this.id} in attack range of target, distance: ${distanceToPlayer.toFixed(2)}, attack range: ${this.attackRange.toFixed(2)}, cooldown: ${this.state.attackCooldown.toFixed(2)}`);
            
            // Stop moving when in attack range
            this.state.isMoving = false;
            
            // Attack target if cooldown is ready
            if (this.state.attackCooldown <= 0) {
                console.debug(`Enemy ${this.id} attacking target, cooldown ready`);
                this.attackPlayer(); // This will attack whatever is set as targetPlayer
                this.state.attackCooldown = 1 / this.attackSpeed;
            } else {
                console.debug(`Enemy ${this.id} waiting for attack cooldown: ${this.state.attackCooldown.toFixed(2)}`);
            }
            
            // Set aggressive state when target is in attack range
            this.state.isAggressive = true;
            this.state.aggressionEndTime = Date.now() + (this.aggressionTimeout * 1000);
        } else if (distanceToPlayer <= this.detectionRange || this.state.isAggressive) {
            // Move towards target if within detection range or if enemy is in aggressive state
            
            // Check if aggression should end
            if (this.state.isAggressive && Date.now() > this.state.aggressionEndTime && !this.persistentAggression) {
                this.state.isAggressive = false;
            }
            
            // Only chase if within detection range or still aggressive
            if (distanceToPlayer <= this.detectionRange || this.state.isAggressive) {
                this.state.isMoving = true;
                
                // Calculate direction to target
                const directionX = playerPosition.x - this.position.x;
                const directionZ = playerPosition.z - this.position.z;
                
                // Normalize direction
                const length = Math.sqrt(directionX * directionX + directionZ * directionZ);
                const normalizedDirectionX = directionX / length;
                const normalizedDirectionZ = directionZ / length;
                
                // Update rotation to face target
                this.rotation.y = Math.atan2(normalizedDirectionX, normalizedDirectionZ);
                
                // Calculate new position
                // Apply 1.5x speed multiplier for faster movement
                const speedMultiplier = 1.5;
                const moveSpeed = this.speed * delta * speedMultiplier;
                const newPosition = {
                    x: this.position.x + normalizedDirectionX * moveSpeed,
                    y: this.position.y,
                    z: this.position.z + normalizedDirectionZ * moveSpeed
                };
                
                // Update position
                this.setPosition(newPosition.x, newPosition.y, newPosition.z);
                console.debug(`Enemy ${this.id} moving toward player, distance: ${distanceToPlayer.toFixed(2)}`);
                
                // If target is within detection range, refresh aggression timer
                if (distanceToPlayer <= this.detectionRange) {
                    this.state.isAggressive = true;
                    this.state.aggressionEndTime = Date.now() + (this.aggressionTimeout * 1000);
                }
            }
        }
        
        // Update animations
        this.updateAnimations(delta);
    }

    /**
     * Find the closest player (local or remote) to target
     */
    findClosestPlayer() {
        // Start with the local player as the default target
        this.targetPlayer = this.player;
        let closestDistance = Number.MAX_VALUE;
        
        // Get local player position
        const localPlayerPos = this.player.getPosition();
        closestDistance = Math.sqrt(
            Math.pow(localPlayerPos.x - this.position.x, 2) +
            Math.pow(localPlayerPos.z - this.position.z, 2)
        );
        
        // Check if we have access to the game and multiplayer manager
        if (this.player.game && 
            this.player.game.multiplayerManager && 
            this.player.game.multiplayerManager.remotePlayerManager) {
            
            // Get all remote players
            const remotePlayers = this.player.game.multiplayerManager.remotePlayerManager.getPlayers();
            
            // Check each remote player
            remotePlayers.forEach((remotePlayer, peerId) => {
                if (remotePlayer && remotePlayer.group) {
                    const remotePos = remotePlayer.group.position;
                    const distance = Math.sqrt(
                        Math.pow(remotePos.x - this.position.x, 2) +
                        Math.pow(remotePos.z - this.position.z, 2)
                    );
                    
                    // If this remote player is closer, target them instead
                    if (distance < closestDistance) {
                        closestDistance = distance;
                        // Create a wrapper object that mimics the player interface
                        this.targetPlayer = {
                            getPosition: () => remotePos,
                            takeDamage: (amount) => {
                                // For remote players, we'll notify the host about the damage
                                // The actual damage will be applied by the host
                                if (this.player.game.multiplayerManager.isHost) {
                                    // If we're the host, broadcast damage to the specific player
                                    // Use the connection manager's sendToPeer method to ensure proper serialization
                                    this.player.game.multiplayerManager.connection.sendToPeer(peerId, {
                                        type: 'playerDamage',
                                        amount: amount,
                                        enemyId: this.id
                                    });
                                }
                            }
                        };
                    }
                }
            });
        }
    }
    
    attackPlayer() {
        // Set attack state
        this.state.isAttacking = true;
        console.debug(`ENEMY ATTACK: Enemy ${this.id} executing attack`);
        
        // Play attack animation
        this.playAttackAnimation();
        
        // Deal damage to target (player or remote player)
        if (this.targetPlayer) {
            const isRemotePlayer = this.targetPlayer !== this.player;
            console.debug(`ENEMY TARGET: Enemy ${this.id} has target: ${isRemotePlayer ? 'REMOTE PLAYER' : 'PLAYER'}`);
            
            if (typeof this.targetPlayer.takeDamage === 'function') {
                try {
                    console.debug(`ENEMY DAMAGE: Enemy ${this.id} dealing ${this.damage} damage to player`);
                    
                    // Apply damage to the target
                    this.targetPlayer.takeDamage(this.damage);
                } catch (error) {
                    console.error(`Error in enemy attack: ${error.message}`);
                }
            } else {
                console.error(`Enemy ${this.id} target doesn't have takeDamage function`);
            }
        } else {
            console.error(`Enemy ${this.id} has no target to attack`);
        }
        
        // Reset attack state after a short delay
        setTimeout(() => {
            this.state.isAttacking = false;
        }, 500);
    }
    
    castIceStorm(targetPosition) {
        // Set attack state
        this.state.isAttacking = true;
        
        // Create ice storm effect
        // (This would be implemented with particle effects and area damage)
        console.debug(`${this.name} casts Ice Storm at position ${targetPosition.x}, ${targetPosition.z}`);
        
        // Deal damage to player if in area
        const distanceToPlayer = Math.sqrt(
            Math.pow(targetPosition.x - this.player.getPosition().x, 2) +
            Math.pow(targetPosition.z - this.player.getPosition().z, 2)
        );
        
        if (distanceToPlayer < 5) {
            this.player.takeDamage(this.damage * 1.5);
            // Apply slow effect to player
            this.player.applyEffect('slow', 3);
        }
        
        // Reset attack state after a delay
        setTimeout(() => {
            this.state.isAttacking = false;
        }, 1000);
    }
    
    castFrostNova() {
        // Set attack state
        this.state.isAttacking = true;
        
        // Create frost nova effect
        // (This would be implemented with particle effects and area damage)
        console.debug(`${this.name} casts Frost Nova`);
        
        // Deal damage to player if in area
        const distanceToPlayer = Math.sqrt(
            Math.pow(this.position.x - this.player.getPosition().x, 2) +
            Math.pow(this.position.z - this.player.getPosition().z, 2)
        );
        
        if (distanceToPlayer < this.attackRange * 1.5) {
            this.player.takeDamage(this.damage);
            // Apply freeze effect to player
            this.player.applyEffect('freeze', 2);
        }
        
        // Reset attack state after a delay
        setTimeout(() => {
            this.state.isAttacking = false;
        }, 800);
    }
    
    /**
     * Handle enemy taking damage with defense calculations
     * @param {number} amount - The raw damage amount
     * @param {boolean} knockback - Whether to apply knockback
     * @param {THREE.Vector3} knockbackDirection - Direction of knockback
     * @param {boolean} ignoreDefense - Whether to ignore defense (for true damage)
     * @returns {number} - The actual damage taken after reductions
     */
    takeDamage(amount, knockback = false, knockbackDirection = null, ignoreDefense = false) {
        // Calculate actual damage after defense
        let actualDamage = amount;
        
        // Apply defense reduction if not ignoring defense
        if (!ignoreDefense) {
            // Base defense value - can be customized per enemy type
            let defenseValue = 0;
            
            // Get defense based on enemy type
            if (this.type === 'skeleton_king' || this.type === 'necromancer_lord' || 
                this.type === 'demon_lord' || this.type === 'frost_titan') {
                // Boss enemies have higher defense
                defenseValue = 25;
            } else if (this.type.includes('golem') || this.type === 'mountain_troll' || 
                       this.type === 'corrupted_treant' || this.type === 'ancient_guardian') {
                // Tank enemies have medium-high defense
                defenseValue = 15;
            } else if (this.type.includes('skeleton') || this.type.includes('zombie')) {
                // Undead enemies have low defense
                defenseValue = 5;
            } else {
                // Default defense for other enemies
                defenseValue = 10;
            }
            
            // Apply defense formula: damage reduction percentage based on defense
            // Formula: reduction = defense / (defense + 100)
            // This gives diminishing returns for high defense values
            const reductionPercent = defenseValue / (defenseValue + 100);
            actualDamage = amount * (1 - reductionPercent);
            
            console.debug(`Enemy ${this.name} defense: ${defenseValue}, damage reduction: ${(reductionPercent * 100).toFixed(1)}%, raw damage: ${amount}, actual damage: ${actualDamage.toFixed(1)}`);
        }
        
        // Round the damage to avoid floating point issues
        actualDamage = Math.round(actualDamage);
        
        // Ensure minimum damage of 1
        actualDamage = Math.max(1, actualDamage);
        
        // Reduce health by the actual damage
        this.health -= actualDamage;
        
        // Check if dead
        if (this.health <= 0) {
            this.die();
            return actualDamage;
        }
        
        // Apply knockback if specified
        if (knockback) {
            this.applyKnockback(knockbackDirection);
        }
        
        // Update health bar
        this.updateHealthBar();
        
        return actualDamage;
    }
    
    /**
     * Updates the enemy's health bar (if any)
     * This method is called when health changes
     */
    updateHealthBar() {
        // Implementation for health bar update
        // This can be empty for now as it's just to prevent the error
        // In a future update, this could be implemented to show visual health bars
    }
    
    /**
     * Regenerates health based on enemy type
     * Different enemy types have different regeneration rates
     * @param {number} delta - Time since last update in seconds
     */
    regenerateHealth(delta) {
        // Skip regeneration if dead
        if (this.state.isDead) {
            return;
        }
        
        // Get regeneration rate for this enemy type
        const regenerationRate = ENEMY_CONFIG.HEALTH_REGENERATION_RATES[this.type] || 
                                ENEMY_CONFIG.HEALTH_REGENERATION_RATES['default'] || 0;
        
        // Skip if no regeneration
        if (regenerationRate <= 0) {
            return;
        }
        
        // Calculate health to regenerate
        const healthToRegenerate = regenerationRate * delta;
        
        // Apply regeneration (don't exceed max health)
        if (this.health < this.maxHealth) {
            this.health = Math.min(this.health + healthToRegenerate, this.maxHealth);
            
            // Update health bar
            this.updateHealthBar();
            
            // Visual feedback for significant regeneration (optional)
            if (healthToRegenerate > 1) {
                this.showRegenerationEffect();
            }
        }
    }
    
    /**
     * Shows a visual effect when the enemy regenerates a significant amount of health
     * This is a placeholder that could be implemented with particle effects
     */
    showRegenerationEffect() {
        // This is a placeholder for visual feedback
        // In a future update, this could show particles or other visual effects
        
        // For now, just log to console in debug mode
        if (this.health > this.maxHealth * 0.9) {
            console.debug(`${this.name} regenerated to near full health`);
        }
    }
    
    applyKnockback(direction) {
        // Set knockback state
        this.state.isKnockedBack = true;
        this.state.knockbackEndTime = Date.now() + 300; // 300ms knockback duration
        
        // Apply knockback movement only for non-boss enemies
        if (direction && !this.isBoss) {
            const knockbackDistance = 1.0; // Knockback distance in units
            const newPosition = {
                x: this.position.x + direction.x * knockbackDistance,
                y: this.position.y,
                z: this.position.z + direction.z * knockbackDistance
            };
            
            this.setPosition(newPosition.x, newPosition.y, newPosition.z);
        }
    }
    
    die() {
        // Set dead state
        this.state.isDead = true;
        
        // Track when the enemy died (used for timeout cleanup)
        this.deathStartTime = Date.now();
        
        // Check if we're in multiplayer mode
        if (this.player.game && 
            this.player.game.multiplayerManager && 
            this.player.game.multiplayerManager.isActive()) {
            
            // Get the number of players (local + remote)
            const remotePlayerCount = this.player.game.multiplayerManager.remotePlayerManager ? 
                this.player.game.multiplayerManager.remotePlayerManager.getPlayers().size : 0;
            const totalPlayerCount = remotePlayerCount + 1; // +1 for local player
            
            // Calculate experience per player (divide equally)
            const expPerPlayer = Math.floor(this.experienceValue / totalPlayerCount);
            
            // Award experience to local player
            this.player.addExperience(expPerPlayer);
            
            // If we're the host, broadcast experience to all remote players
            if (this.player.game.multiplayerManager.isHost) {
                this.player.game.multiplayerManager.connection.broadcast({
                    type: 'shareExperience',
                    amount: expPerPlayer,
                    enemyId: this.id,
                    playerCount: totalPlayerCount
                });
                
                console.debug(`[Multiplayer] Shared ${expPerPlayer} experience with ${totalPlayerCount} players from enemy ${this.id}`);
            }
        } else {
            // Single player mode - award all experience to the player
            this.player.addExperience(this.experienceValue);
        }
        
        // Set a flag to track animation completion
        this.deathAnimationInProgress = true;
        
        // For bosses, use a simplified death animation to prevent lag
        if (this.isBoss) {
            this.playSimplifiedDeathAnimation();
        } else {
            // Regular enemies use the normal death animation
            this.playDeathAnimation();
        }
        
        // We no longer need to remove the enemy here
        // The EnemyManager will handle removal after the animation completes
        // This prevents the modelGroup from being null during the animation
    }
    
    /**
     * Simplified death animation for bosses to prevent lag
     */
    playSimplifiedDeathAnimation() {
        if (this.modelGroup) {
            // For bosses, use a simpler animation with no requestAnimationFrame
            // This prevents potential lag from complex animations
            
            // Apply a simple fade out effect
            if (this.modelGroup.traverse) {
                this.modelGroup.traverse((object) => {
                    if (object.material) {
                        if (Array.isArray(object.material)) {
                            object.material.forEach(material => {
                                if (material.opacity !== undefined) {
                                    material.transparent = true;
                                    material.opacity = 0.5; // Semi-transparent
                                }
                            });
                        } else if (object.material.opacity !== undefined) {
                            object.material.transparent = true;
                            object.material.opacity = 0.5; // Semi-transparent
                        }
                    }
                });
            }
            
            // Use a simple timeout instead of animation frames
            setTimeout(() => {
                // Mark animation as complete after a short delay
                this.deathAnimationInProgress = false;
                
                // Make sure we clean up any animation frame if it was somehow set
                if (this.deathAnimationFrameId) {
                    cancelAnimationFrame(this.deathAnimationFrameId);
                    this.deathAnimationFrameId = null;
                }
            }, 500); // 500ms delay - much shorter than regular animation
        } else {
            // No model to animate, mark as complete immediately
            this.deathAnimationInProgress = false;
        }
    }
    
    playDeathAnimation() {
        // Implement death animation
        // This could be different based on enemy type
        if (this.modelGroup) {
            // Simple death animation - fall over
            const targetPosition = new THREE.Vector3(
                this.position.x,
                this.position.y - 0.5,
                this.position.z
            );
            
            const targetRotation = new THREE.Euler(
                Math.PI / 2,
                this.rotation.y,
                this.rotation.z
            );
            
            // Animate falling over
            const startPosition = this.position.clone();
            const startRotation = this.rotation.clone();
            const startTime = Date.now();
            const duration = 1000; // 1 second animation
            
            // Store animation frame ID so we can cancel it if needed
            this.deathAnimationFrameId = null;
            
            // Store a reference to the model group that we'll use throughout the animation
            // This prevents issues if the main modelGroup reference is set to null
            const animationModelGroup = this.modelGroup;
            
            const animateDeath = () => {
                // Check if we should stop the animation
                if (this.state.isDead === false || !animationModelGroup.parent) {
                    this.deathAnimationInProgress = false;
                    this.deathAnimationFrameId = null;
                    return;
                }
                
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                // Ease out function
                const easeOut = 1 - Math.pow(1 - progress, 3);
                
                // Update position and rotation
                this.position.x = startPosition.x + (targetPosition.x - startPosition.x) * easeOut;
                this.position.y = startPosition.y + (targetPosition.y - startPosition.y) * easeOut;
                this.position.z = startPosition.z + (targetPosition.z - startPosition.z) * easeOut;
                
                // Safely update rotation
                if (animationModelGroup.rotation) {
                    animationModelGroup.rotation.x = startRotation.x + (targetRotation.x - startRotation.x) * easeOut;
                }
                
                // Continue animation if not complete
                if (progress < 1) {
                    this.deathAnimationFrameId = requestAnimationFrame(animateDeath);
                } else {
                    // Final position and rotation
                    this.position.x = targetPosition.x;
                    this.position.y = targetPosition.y;
                    this.position.z = targetPosition.z;
                    
                    if (animationModelGroup.rotation) {
                        animationModelGroup.rotation.x = targetRotation.x;
                    }
                    
                    // Mark animation as complete
                    this.deathAnimationInProgress = false;
                    this.deathAnimationFrameId = null;
                }
            };
            
            // Start animation
            this.deathAnimationFrameId = requestAnimationFrame(animateDeath);
        } else {
            // No model to animate, mark as complete immediately
            this.deathAnimationInProgress = false;
        }
    }

    removeFromScene() {
        // Cancel any ongoing death animation
        if (this.deathAnimationFrameId) {
            cancelAnimationFrame(this.deathAnimationFrameId);
            this.deathAnimationFrameId = null;
            this.deathAnimationInProgress = false;
        }
        
        // Remove model from scene
        if (this.modelGroup) {
            // For bosses, do a more thorough cleanup to prevent memory leaks
            if (this.isBoss) {
                console.debug(`Performing thorough cleanup for boss ${this.id}`);
                
                // Ensure all animations are stopped
                if (this.model && this.model.mixer) {
                    this.model.mixer.stopAllAction();
                    this.model.mixer.uncacheRoot(this.modelGroup);
                }
                
                // Dispose of any textures
                this.modelGroup.traverse((object) => {
                    if (object.material) {
                        const materials = Array.isArray(object.material) ? object.material : [object.material];
                        
                        materials.forEach(material => {
                            // Dispose textures
                            for (const prop in material) {
                                if (material[prop] && material[prop].isTexture) {
                                    material[prop].dispose();
                                }
                            }
                            
                            // Dispose material
                            material.dispose();
                        });
                    }
                    
                    // Dispose geometry
                    if (object.geometry) {
                        object.geometry.dispose();
                    }
                });
            } else {
                // Regular enemy cleanup
                this.modelGroup.traverse((object) => {
                    if (object.geometry) {
                        object.geometry.dispose();
                    }
                    
                    if (object.material) {
                        if (Array.isArray(object.material)) {
                            object.material.forEach(material => material.dispose());
                        } else {
                            object.material.dispose();
                        }
                    }
                });
            }
            
            // Remove from scene
            this.scene.remove(this.modelGroup);
            this.modelGroup = null;
            
            // Force a garbage collection hint (not guaranteed to run)
            if (this.isBoss && window.gc) {
                try {
                    window.gc();
                } catch (e) {
                    // Ignore if gc is not available
                }
            }
        }
        
        // Clear any special ability cooldowns for boss enemies
        if (this.isBoss && this.specialAbilityCooldowns) {
            this.specialAbilityCooldowns = null;
        }
    }

    updateTerrainHeight() {
        // For bosses, we NEVER update Y position after initial setup
        if (this.isBoss) {
            if (this.modelGroup) {
                // For bosses, only update rotation
                this.modelGroup.rotation.y = this.rotation.y;
                
                // Set initial Y position only once
                if (!this.initialPositionSet && this.world) {
                    const terrainHeight = this.world.getTerrainHeight(this.position.x, this.position.z);
                    if (terrainHeight !== null) {
                        // Store the initial Y position for bosses
                        this.initialYPosition = terrainHeight + this.heightOffset;
                        this.position.y = this.initialYPosition;
                        
                        // Update model position with this Y value
                        this.modelGroup.position.copy(this.position);
                        
                        // Mark as initialized
                        this.initialPositionSet = true;
                        console.debug(`Boss ${this.name} initial Y position set to ${this.initialYPosition}`);
                    }
                } else if (this.initialPositionSet) {
                    // Always restore the Y position to the initial value for bosses
                    // This ensures they never sink regardless of what other code might do
                    this.position.y = this.initialYPosition;
                    
                    // Force the model's Y position to match
                    this.modelGroup.position.y = this.initialYPosition;
                }
            }
            return;
        }
        
        // For non-boss enemies, update position based on terrain height if world is available and terrain updates are allowed
        if (this.world && this.allowTerrainHeightUpdates) {
            const terrainHeight = this.world.getTerrainHeight(this.position.x, this.position.z);
            if (terrainHeight !== null) {
                this.position.y = terrainHeight + this.heightOffset;
                
                if (this.modelGroup) {
                    this.modelGroup.position.copy(this.position);
                    this.modelGroup.rotation.y = this.rotation.y;
                }
            }
        } else if (this.modelGroup) {
            // If no world or terrain updates disabled, just update model position and rotation
            this.modelGroup.position.copy(this.position);
            this.modelGroup.rotation.y = this.rotation.y;
        }
    }

    setPosition(x, y, z) {
        // Special handling for bosses
        if (this.isBoss) {
            if (this.initialPositionSet && this.initialYPosition !== null) {
                // For bosses with established position, only update X and Z
                this.position.x = x;
                this.position.z = z;
                
                // ALWAYS use the stored initial Y position to prevent sinking
                this.position.y = this.initialYPosition;
                
                // Update model position, ensuring Y is correct
                if (this.modelGroup) {
                    this.modelGroup.position.x = this.position.x;
                    this.modelGroup.position.z = this.position.z;
                    this.modelGroup.position.y = this.initialYPosition;
                }
                
                // Debug log to track boss position
                if (Math.random() < 0.01) { // Log occasionally to avoid spam
                    console.debug(`Boss ${this.name} position maintained at Y=${this.initialYPosition}`);
                }
                return;
            } else if (!this.initialPositionSet) {
                // For initial boss positioning, we'll set all coordinates
                // but we'll also store the Y position for future reference
                this.position.set(x, y, z);
                
                // If we have a world reference, get the terrain height
                if (this.world) {
                    const terrainHeight = this.world.getTerrainHeight(x, z);
                    if (terrainHeight !== null) {
                        // Use terrain height + offset for Y position
                        this.initialYPosition = terrainHeight + this.heightOffset;
                        this.position.y = this.initialYPosition;
                    } else {
                        // If terrain height is not available, use provided Y
                        this.initialYPosition = y;
                    }
                } else {
                    // No world reference, use provided Y
                    this.initialYPosition = y;
                }
                
                // Update model position
                if (this.modelGroup) {
                    this.modelGroup.position.copy(this.position);
                }
                
                // Mark as initialized
                this.initialPositionSet = true;
                console.debug(`Boss ${this.name} initial position set at Y=${this.initialYPosition}`);
                return;
            }
        }
        
        // For non-boss enemies, update all coordinates normally
        this.position.set(x, y, z);
        
        // Update model position
        if (this.modelGroup) {
            this.modelGroup.position.copy(this.position);
        }
    }
    
    /**
     * Disable terrain height updates for this enemy
     * Useful for bosses or enemies that need fixed positioning
     */
    disableTerrainHeightUpdates() {
        this.allowTerrainHeightUpdates = false;
    }
    
    /**
     * Enable terrain height updates for this enemy
     */
    enableTerrainHeightUpdates() {
        this.allowTerrainHeightUpdates = true;
    }

    getPosition() {
        return this.position;
    }
    
    getCollisionRadius() {
        return this.collisionRadius;
    }
    
    /**
     * Stun the enemy for a specified duration
     * @param {number} duration - Duration of stun in seconds
     */
    stun(duration) {
        this.state.isStunned = true;
        this.state.stunEndTime = Date.now() + (duration * 1000);
        console.debug(`${this.name} stunned for ${duration} seconds`);
    }
    
    getHealth() {
        return this.health;
    }
    
    getExperienceValue() {
        return this.experienceValue;
    }
    
    getType() {
        return this.type;
    }
    
    getName() {
        return this.name;
    }
    
    getMaxHealth() {
        return this.maxHealth;
    }
    
    isBossEnemy() {
        return this.isBoss;
    }
    
    isDead() {
        return this.state.isDead;
    }
    
    remove() {
        this.removeFromScene();
    }
}