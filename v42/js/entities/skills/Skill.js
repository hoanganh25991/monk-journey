import * as THREE from 'three';
import { SkillEffectFactory } from './SkillEffectFactory.js';

/**
 * Base class for all skills
 * @class
 */
export class Skill {
    /** @type {string} */
    name;
    /** @type {string} */
    description;
    /** @type {string} */
    type;
    /** @type {number} */
    damage;
    /** @type {number} */
    manaCost;
    /** @type {number} */
    cooldown;
    /** @type {number} */
    range;
    /** @type {number} */
    radius;
    /** @type {number} */
    duration;
    /** @type {number} */
    color;
    /** @type {number} */
    hits;
    /** @type {string} */
    icon;
    /** @type {string} */
    variant;
    /** @type {Object} */
    sounds;
    /** @type {number} */
    currentCooldown;
    /** @type {boolean} */
    isActive;
    /** @type {number} */
    elapsedTime;
    /** @type {THREE.Vector3} */
    position;
    /** @type {THREE.Vector3} */
    direction;
    /** @type {import("../../game/Game.js").Game} */
    game;
    /** @type {string} */
    instanceId;
    /** @type {Object} */
    effectHandler;

    /**
     * Create a new skill
     * @param {Object} config - Skill configuration
     */
    constructor(config) {
        this.name = config.name || 'Unknown Skill';
        this.description = config.description || '';
        this.type = config.type || 'ranged';
        this.damage = config.damage || 0;
        this.manaCost = config.manaCost || 0;
        this.cooldown = config.cooldown || 0;
        this.range = config.range || 0;
        this.radius = config.radius || 0;
        this.duration = config.duration || 0;
        this.color = config.color || 0xffffff;
        this.hits = config.hits || 1;
        this.icon = config.icon || '🤛';
        this.variant = config.variant || '';

        for (const key in config) {
            if (Object.prototype.hasOwnProperty.call(config, key)) {
                this[key] = config[key];
            }
        }

        // Sound configuration
        this.sounds = config.sounds || {
            cast: null,
            impact: null,
            end: null
        };
        
        // Skill state
        this.currentCooldown = 0;
        this.isActive = false;
        this.elapsedTime = 0;
        
        // Skill position and direction
        this.position = new THREE.Vector3();
        this.direction = new THREE.Vector3();

        // Game reference
        this.game = null;
        
        // Add a unique instance ID for this skill
        // This helps with tracking which skill instance has hit which enemies
        this.instanceId = `${this.name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Create the appropriate effect handler
        this.effectHandler = SkillEffectFactory.createEffect(this);
    }
    
    /**
     * Set the game reference
     * @param {import("../../game/Game.js").Game} game - The game instance
     */
    setGame(game) {
        this.game = game;
    }
    
    /**
     * Validate a vector to ensure it has valid components
     * @param {THREE.Vector3} vector - The vector to validate
     * @returns {boolean} - Whether the vector is valid
     */
    validateVector(vector) {
        if (!vector) return false;
        
        // Check if any component is NaN or infinite
        if (isNaN(vector.x) || isNaN(vector.y) || isNaN(vector.z) ||
            !isFinite(vector.x) || !isFinite(vector.y) || !isFinite(vector.z)) {
            console.warn("Invalid vector detected:", vector);
            return false;
        }
        
        return true;
    }
    
    /**
     * Create the skill effect
     * @param {THREE.Vector3} playerPosition - Position of the player
     * @param {Object} playerRotation - Rotation of the player
     * @returns {THREE.Group} - The created effect
     */
    createEffect(playerPosition, playerRotation) {
        // Reset the effect handler first to ensure a clean state
        if (this.effectHandler) {
            this.effectHandler.reset();
        }
        
        // Reset skill state
        this.isActive = false;
        this.elapsedTime = 0;
        
        // Validate input positions
        if (!this.validateVector(playerPosition)) {
            console.error("Invalid player position provided to skill:", this.name);
            // Use a default safe position
            playerPosition = new THREE.Vector3(0, 0, 0);
        }
        
        // Set skill position
        this.position.copy(playerPosition);
        this.position.y += 1; // Adjust height
        
        // Validate rotation
        if (!playerRotation || isNaN(playerRotation.y)) {
            console.error("Invalid player rotation provided to skill:", this.name);
            // Use a default rotation
            playerRotation = { y: 0 };
        }
        
        // Set skill direction based on player rotation
        this.direction.set(
            Math.sin(playerRotation.y),
            0,
            Math.cos(playerRotation.y)
        );
        
        // Validate direction vector
        if (!this.validateVector(this.direction)) {
            console.error("Invalid direction calculated for skill:", this.name);
            // Use a default direction
            this.direction.set(0, 0, 1);
        }
        
        // Play the cast sound
        this.playSound('cast');
        
        // Create effect using the effect handler
        try {
            const effect = this.effectHandler.create(this.position, this.direction);
            this.isActive = true;
            console.debug(`Created new effect for skill: ${this.name}`);
            return effect;
        } catch (error) {
            console.error(`Error creating effect for skill ${this.name}:`, error);
            // Return a simple default effect as fallback
            const fallbackGroup = new THREE.Group();
            const fallbackGeometry = new THREE.SphereGeometry(0.5, 8, 8);
            const fallbackMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
            const fallbackMesh = new THREE.Mesh(fallbackGeometry, fallbackMaterial);
            fallbackGroup.add(fallbackMesh);
            return fallbackGroup;
        }
    }
    
    /**
     * Update the skill
     * @param {number} delta - Time since last update in seconds
     */
    update(delta) {
        // Update cooldown
        this.updateCooldown(delta);
        
        // If skill is active, update elapsed time and effect
        if (this.isActive) {
            this.elapsedTime += delta;
            
            // Update effect using the effect handler
            this.effectHandler.update(delta);
            
            // Check if skill duration has expired
            if (this.elapsedTime >= this.duration) {
                this.isActive = false;
                this.elapsedTime = 0;
                
                // Start cooldown
                this.currentCooldown = this.cooldown;
            }
        }
    }
    
    /**
     * Update the skill's cooldown
     * @param {number} delta - Time since last update in seconds
     */
    updateCooldown(delta) {
        if (this.currentCooldown > 0) {
            this.currentCooldown -= delta;
            if (this.currentCooldown < 0) {
                this.currentCooldown = 0;
            }
        }
    }
    
    /**
     * Get the damage value of the skill
     * @returns {number} - The damage value
     */
    getDamage() {
        // Base damage from skill configuration
        let damage = this.damage;
        
        // If we have access to the player's stats, use them to calculate damage
        if (this.game && this.game.player) {
            const player = this.game.player;
            
            // Base damage from attack power
            damage = damage * (player.stats.getAttackPower() / 10);
            
            // Add bonus from strength (each point adds 0.5 damage)
            damage += player.stats.strength * 0.5;
            
            // Add level bonus (each level adds 2 damage)
            damage += (player.stats.getLevel() - 1) * 2;
            
            // Add weapon damage if equipped
            const equipment = player.inventory.getEquipment();
            if (equipment.weapon) {
                // Check if the weapon has the getStat method before calling it
                if (typeof equipment.weapon.getStat === 'function') {
                    damage += equipment.weapon.getStat('damage') || 0;
                    
                    // Apply elemental bonuses if matching
                    if (this.element && equipment.weapon.getStat(`${this.element}Damage`)) {
                        damage *= (1 + (equipment.weapon.getStat(`${this.element}Damage`) / 100));
                    }
                } else if (equipment.weapon.baseStats && equipment.weapon.baseStats.damage) {
                    // Fallback to directly accessing baseStats if getStat is not available
                    damage += equipment.weapon.baseStats.damage;
                }
            }
            
            // Apply skill damage bonuses from items
            let skillDamageBonus = 0;
            
            // Check all equipped items for skill damage bonuses
            for (const slot in equipment) {
                const item = equipment[slot];
                if (item) {
                    // Check if the item has the getStat method
                    if (typeof item.getStat === 'function') {
                        // General skill damage bonus
                        skillDamageBonus += item.getStat('skillDamage') || 0;
                        
                        // Specific skill type bonus
                        if (this.variant) {
                            skillDamageBonus += item.getStat(`${this.variant}Damage`) || 0;
                        }
                        
                        // Specific skill bonus
                        skillDamageBonus += item.getStat(`${this.name}Damage`) || 0;
                    } else if (item.processedSecondaryStats && Array.isArray(item.processedSecondaryStats)) {
                        // Fallback to directly checking secondary stats
                        item.processedSecondaryStats.forEach(stat => {
                            if (stat.type === 'skillDamage') {
                                skillDamageBonus += stat.value || 0;
                            }
                            if (this.variant && stat.type === `${this.variant}Damage`) {
                                skillDamageBonus += stat.value || 0;
                            }
                            if (stat.type === `${this.name}Damage`) {
                                skillDamageBonus += stat.value || 0;
                            }
                        });
                    }
                }
            }
            
            // Apply skill damage bonus
            damage *= (1 + (skillDamageBonus / 100));
            
            // Apply small random variation (±10%)
            const variation = damage * 0.2 * (Math.random() - 0.5);
            damage += variation;
            
            // Round to integer
            damage = Math.round(damage);
            console.debug(`Calculated skill damage: ${damage} (base: ${this.damage}, attackPower: ${player.stats.getAttackPower()}, strength: ${player.stats.strength})`);
        }

        return damage;
    }
    
    /**
     * Check if the skill is on cooldown
     * @returns {boolean} - Whether the skill is on cooldown
     */
    isOnCooldown() {
        return this.currentCooldown > 0;
    }
    
    /**
     * Get the remaining cooldown time
     * @returns {number} - Remaining cooldown time in seconds
     */
    getRemainingCooldown() {
        return this.currentCooldown;
    }
    
    /**
     * Get the cooldown progress (0-1)
     * @returns {number} - Cooldown progress from 0 (not on cooldown) to 1 (full cooldown)
     */
    getCooldownProgress() {
        if (this.cooldown === 0) return 0;
        return this.currentCooldown / this.cooldown;
    }
    
    /**
     * Get the cooldown percentage (0-1)
     * Alias for getCooldownProgress for backward compatibility
     * @returns {number} - Cooldown percentage from 0 (not on cooldown) to 1 (full cooldown)
     */
    getCooldownPercent() {
        return this.getCooldownProgress();
    }
    
    /**
     * Remove the skill effect and clean up resources
     */
    remove() {
        if (this.effectHandler) {
            this.effectHandler.dispose();
        }
        this.isActive = false;
    }
    
    /**
     * Check if the skill has expired
     * @returns {boolean} - Whether the skill has expired
     */
    isExpired() {
        return this.isActive && this.elapsedTime >= this.duration;
    }
    
    /**
     * Start the skill's cooldown
     */
    startCooldown() {
        this.currentCooldown = this.cooldown;
    }
    
    /**
     * Get the position of the skill
     * @returns {THREE.Vector3} - The position of the skill
     */
    getPosition() {
        return this.position;
    }
    
    /**
     * Get the radius of the skill for collision detection
     * @returns {number} - The radius of the skill
     */
    getRadius() {
        return this.radius;
    }
    
    /**
     * Play a sound associated with this skill
     * @param {string} type - The type of sound to play ('cast', 'impact', or 'end')
     * @returns {boolean} - Whether the sound was played successfully
     */
    playSound(type) {
        if (!this.game || !this.game.audioManager) return false;
        
        const soundName = this.sounds && this.sounds[type];
        if (soundName) {
            return this.game.audioManager.playSound(soundName);
        }
        
        return false;
    }
    
    /**
     * Reset the skill to its initial state
     * This allows the skill to be reused without creating a new instance
     */
    reset() {
        // Reset skill state
        this.isActive = false;
        this.elapsedTime = 0;
        
        // Reset position and direction
        this.position = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        
        // Generate a new instance ID when the skill is reset
        // This ensures that each use of the skill is treated as a new instance
        this.instanceId = `${this.name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Reset the effect handler if it exists
        if (this.effectHandler) {
            this.effectHandler.reset();
        }
        
        // Note: We don't reset the cooldown here, as that's managed separately
        // If you want to reset the cooldown as well, uncomment the next line
        // this.currentCooldown = 0;
        
        return this;
    }
}