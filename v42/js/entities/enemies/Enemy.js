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
        // Skip update if dead
        if (this.state.isDead) {
            return;
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
        
        // Check if player is in attack range
        if (distanceToPlayer <= this.attackRange) {
            // Attack player if cooldown is ready
            if (this.state.attackCooldown <= 0) {
                this.attackPlayer();
                this.state.attackCooldown = 1 / this.attackSpeed;
            }
            
            // Set aggressive state when player is in attack range
            this.state.isAggressive = true;
            this.state.aggressionEndTime = Date.now() + (this.aggressionTimeout * 1000);
        } else if (distanceToPlayer <= this.detectionRange || this.state.isAggressive) {
            // Move towards player if within detection range or if enemy is in aggressive state
            
            // Check if aggression should end
            if (this.state.isAggressive && Date.now() > this.state.aggressionEndTime && !this.persistentAggression) {
                this.state.isAggressive = false;
            }
            
            // Only chase if within detection range or still aggressive
            if (distanceToPlayer <= this.detectionRange || this.state.isAggressive) {
                this.state.isMoving = true;
                
                // Calculate direction to player
                const directionX = playerPosition.x - this.position.x;
                const directionZ = playerPosition.z - this.position.z;
                
                // Normalize direction
                const length = Math.sqrt(directionX * directionX + directionZ * directionZ);
                const normalizedDirectionX = directionX / length;
                const normalizedDirectionZ = directionZ / length;
                
                // Update rotation to face player
                this.rotation.y = Math.atan2(normalizedDirectionX, normalizedDirectionZ);
                
                // Calculate new position
                const moveSpeed = this.speed * delta;
                const newPosition = {
                    x: this.position.x + normalizedDirectionX * moveSpeed,
                    y: this.position.y,
                    z: this.position.z + normalizedDirectionZ * moveSpeed
                };
                
                // Update position
                this.setPosition(newPosition.x, newPosition.y, newPosition.z);
                
                // If player is within detection range, refresh aggression timer
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
        
        // Create attack effect
        // (This could be expanded with different attack types based on enemy type)
        
        // Deal damage to target player (local or remote)
        this.targetPlayer.takeDamage(this.damage);
        
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
    
    takeDamage(amount, knockback = false, knockbackDirection = null) {
        // Reduce health
        this.health -= amount;
        
        // Check if dead
        if (this.health <= 0) {
            this.die();
            return amount;
        }
        
        // Apply knockback if specified
        if (knockback) {
            this.applyKnockback(knockbackDirection);
        }
        
        // Update health bar
        this.updateHealthBar();
        
        return amount;
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
        
        // Apply knockback movement
        if (direction) {
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
        
        // Trigger death animation or effects
        this.playDeathAnimation();
        
        // We no longer need to remove the enemy here
        // The EnemyManager will handle removal after the animation completes
        // This prevents the modelGroup from being null during the animation
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
            
            const animateDeath = () => {
                // Check if modelGroup still exists
                if (!this.modelGroup) {
                    console.warn('Enemy model group is null during death animation');
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
                if (this.modelGroup && this.modelGroup.rotation) {
                    this.modelGroup.rotation.x = startRotation.x + (targetRotation.x - startRotation.x) * easeOut;
                }
                
                // Continue animation if not complete
                if (progress < 1 && this.modelGroup) {
                    requestAnimationFrame(animateDeath);
                } else if (this.modelGroup) {
                    // Final position and rotation
                    this.position.x = targetPosition.x;
                    this.position.y = targetPosition.y;
                    this.position.z = targetPosition.z;
                    
                    if (this.modelGroup.rotation) {
                        this.modelGroup.rotation.x = targetRotation.x;
                    }
                    
                    // Mark animation as complete
                    this.deathAnimationInProgress = false;
                } else {
                    // If modelGroup is null, also mark animation as complete
                    this.deathAnimationInProgress = false;
                }
            };
            
            // Start animation
            animateDeath();
        }
    }

    removeFromScene() {
        // Remove model from scene
        if (this.modelGroup) {
            this.scene.remove(this.modelGroup);
            
            // Clean up geometry and materials
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
            
            this.modelGroup = null;
        }
    }

    updateTerrainHeight() {
        // Update position based on terrain height if world is available
        if (this.world) {
            const terrainHeight = this.world.getTerrainHeight(this.position.x, this.position.z);
            if (terrainHeight !== null) {
                this.position.y = terrainHeight + this.heightOffset;
                
                if (this.modelGroup) {
                    this.modelGroup.position.copy(this.position);
                    this.modelGroup.rotation.y = this.rotation.y;
                }
            }
        } else if (this.modelGroup) {
            // If no world, just update model position and rotation
            this.modelGroup.position.copy(this.position);
            this.modelGroup.rotation.y = this.rotation.y;
        }
    }

    setPosition(x, y, z) {
        // Update position
        this.position.set(x, y, z);
        
        // Update model position
        if (this.modelGroup) {
            this.modelGroup.position.copy(this.position);
        }
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