/**
 * PlayerStats.js
 * Handles player statistics, experience, and leveling
 * @module entities/player/PlayerStats
 */

import { PLAYER_PROGRESSION } from '../../config/game-balance.js';
const {DEFAULT_PLAYER_STATS, LEVEL_UP_EXPERIENCE_MULTIPLIER, LEVEL_UP_STAT_INCREASES, RESOURCE_REGENERATION} = PLAYER_PROGRESSION

/**
 * @typedef {Object} TemporaryBoost
 * @property {number} amount - The amount to boost by (e.g., 0.3 for 30% increase)
 * @property {number} duration - Total duration of the boost in seconds
 * @property {number} remainingTime - Remaining time of the boost in seconds
 */

/**
 * @typedef {Object} StatBoost
 * @property {number} originalValue - The original value of the stat before any boosts
 * @property {TemporaryBoost[]} boosts - Array of active boosts for this stat
 */

/**
 * @typedef {Object} PlayerStatsInitializer
 * @property {number} [level] - Player's current level
 * @property {number} [experience] - Player's current experience points
 * @property {number} [experienceToNextLevel] - Experience points needed for next level
 * @property {number} [health] - Current health points
 * @property {number} [maxHealth] - Maximum health points
 * @property {number} [mana] - Current mana points
 * @property {number} [maxMana] - Maximum mana points
 * @property {number} [strength] - Strength attribute
 * @property {number} [dexterity] - Dexterity attribute
 * @property {number} [intelligence] - Intelligence attribute
 * @property {number} [movementSpeed] - Movement speed
 * @property {number} [attackPower] - Attack power
 */
export class PlayerStats {
    /**
     * Creates a new PlayerStats instance
     * @param {PlayerStatsInitializer} [initialStats={}] - Initial stats to override defaults
     */
    constructor(initialStats = {}) {
        // Initialize stats from config with any provided overrides
        this.level = this.validateNumber(initialStats.level) || DEFAULT_PLAYER_STATS.level;
        this.experience = this.validateNumber(initialStats.experience) || DEFAULT_PLAYER_STATS.experience;
        this.experienceToNextLevel = this.validateNumber(initialStats.experienceToNextLevel) || DEFAULT_PLAYER_STATS.experienceToNextLevel;
        this.health = this.validateNumber(initialStats.health) || DEFAULT_PLAYER_STATS.health;
        this.maxHealth = this.validateNumber(initialStats.maxHealth) || DEFAULT_PLAYER_STATS.maxHealth;
        this.mana = this.validateNumber(initialStats.mana) || DEFAULT_PLAYER_STATS.mana;
        this.maxMana = this.validateNumber(initialStats.maxMana) || DEFAULT_PLAYER_STATS.maxMana;
        this.strength = this.validateNumber(initialStats.strength) || DEFAULT_PLAYER_STATS.strength;
        this.dexterity = this.validateNumber(initialStats.dexterity) || DEFAULT_PLAYER_STATS.dexterity;
        this.intelligence = this.validateNumber(initialStats.intelligence) || DEFAULT_PLAYER_STATS.intelligence;
        this.movementSpeed = this.validateNumber(initialStats.movementSpeed) || DEFAULT_PLAYER_STATS.movementSpeed;
        this.attackPower = this.validateNumber(initialStats.attackPower) || DEFAULT_PLAYER_STATS.attackPower;
        
        // Track temporary stat boosts
        /** @type {Object.<string, StatBoost>} */
        this.temporaryBoosts = {};
    }
    
    /**
     * Validates and sanitizes a numeric value
     * @param {any} value - The value to validate
     * @param {number} [defaultValue=0] - Default value to return if invalid
     * @returns {number} - A valid number
     */
    validateNumber(value, defaultValue = 0) {
        // Check if value is undefined, null, NaN, or not a number
        if (value === undefined || value === null || isNaN(value) || typeof value !== 'number') {
            return defaultValue;
        }
        return value;
    }
    
    // Getters
    /**
     * Get current health points
     * @returns {number} Current health points
     */
    getHealth() {
        // Ensure health is a valid number
        if (isNaN(this.health) || this.health === undefined || this.health === null) {
            console.warn("Health value was invalid (NaN/undefined/null), resetting to 0");
            this.health = 0;
        }
        return this.health;
    }
    
    /**
     * Get maximum health points
     * @returns {number} Maximum health points
     */
    getMaxHealth() {
        // Ensure maxHealth is a valid number
        if (isNaN(this.maxHealth) || this.maxHealth === undefined || this.maxHealth === null) {
            console.warn("MaxHealth value was invalid (NaN/undefined/null), resetting to default");
            this.maxHealth = DEFAULT_PLAYER_STATS.maxHealth;
        }
        return this.maxHealth;
    }
    
    /**
     * Get current mana points
     * @returns {number} Current mana points
     */
    getMana() {
        // Ensure mana is a valid number
        if (isNaN(this.mana) || this.mana === undefined || this.mana === null) {
            console.warn("Mana value was invalid (NaN/undefined/null), resetting to 0");
            this.mana = 0;
        }
        return this.mana;
    }
    
    /**
     * Get maximum mana points including equipment bonuses
     * @returns {number} Maximum mana points
     */
    getMaxMana() {
        // Ensure maxMana is a valid number
        if (isNaN(this.maxMana) || this.maxMana === undefined || this.maxMana === null) {
            console.warn("MaxMana value was invalid (NaN/undefined/null), resetting to default");
            this.maxMana = DEFAULT_PLAYER_STATS.maxMana;
        }
        
        // Get base max mana
        let maxMana = this.maxMana;
        
        // Add equipment bonus if player has an inventory
        if (this._player && this._player.inventory) {
            try {
                const manaBonus = this._player.inventory.getManaBonus();
                // Validate the bonus
                maxMana += this.validateNumber(manaBonus, 0);
            } catch (error) {
                console.warn("Error getting mana bonus from inventory:", error);
            }
        }
        
        return maxMana;
    }
    
    /**
     * Set player reference for accessing equipment bonuses
     * @param {Player} player - The player object
     */
    setPlayer(player) {
        this._player = player;
    }
    
    /**
     * Get current player level
     * @returns {number} Current player level
     */
    getLevel() {
        return this.level;
    }
    
    /**
     * Get current experience points
     * @returns {number} Current experience points
     */
    getExperience() {
        return this.experience;
    }
    
    /**
     * Get experience points needed for next level
     * @returns {number} Experience points needed for next level
     */
    getExperienceToNextLevel() {
        return this.experienceToNextLevel;
    }
    
    /**
     * Get current attack power
     * @returns {number} Current attack power
     */
    getAttackPower() {
        return this.attackPower;
    }
    
    /**
     * Get current movement speed
     * @returns {number} Current movement speed
     */
    getMovementSpeed() {
        return this.movementSpeed;
    }
    
    // Setters
    /**
     * Set health points, clamped between 0 and maxHealth
     * @param {number} value - New health value
     */
    setHealth(value) {
        // Validate the input value
        value = this.validateNumber(value, 0);
        
        // Ensure maxHealth is valid before using it for clamping
        this.getMaxHealth();
        
        // Clamp health between 0 and maxHealth
        this.health = Math.max(0, Math.min(value, this.maxHealth));
    }
    
    /**
     * Heal the player by the specified amount
     * @param {number} amount - Amount of health to restore
     * @returns {number} - The actual amount healed
     */
    heal(amount) {
        // Validate the amount
        amount = this.validateNumber(amount, 0);
        
        // Get current health (this also validates it)
        const oldHealth = this.getHealth();
        
        // Ensure maxHealth is valid
        this.getMaxHealth();
        
        // Calculate new health value
        this.health = Math.min(oldHealth + amount, this.maxHealth);
        
        return this.health - oldHealth;
    }
    
    /**
     * Set mana points, clamped between 0 and maxMana
     * @param {number} value - New mana value
     */
    setMana(value) {
        // Validate the input value
        value = this.validateNumber(value, 0);
        
        // Ensure maxMana is valid
        if (isNaN(this.maxMana) || this.maxMana === undefined || this.maxMana === null) {
            this.maxMana = DEFAULT_PLAYER_STATS.maxMana;
        }
        
        // Clamp mana between 0 and maxMana
        this.mana = Math.max(0, Math.min(value, this.maxMana));
    }
    
    /**
     * Add experience points and handle level up if necessary
     * @param {number} amount - Amount of experience to add
     * @returns {number} - The current level if a level up occurred, otherwise 0
     */
    addExperience(amount) {
        // Validate the amount
        amount = this.validateNumber(amount, 0);
        
        // Validate current experience and experienceToNextLevel
        this.experience = this.validateNumber(this.experience, DEFAULT_PLAYER_STATS.experience);
        this.experienceToNextLevel = this.validateNumber(this.experienceToNextLevel, DEFAULT_PLAYER_STATS.experienceToNextLevel);
        
        // Add experience
        this.experience += amount;
        
        // Check for level up
        let levelChanged = false;
        while (this.experience >= this.experienceToNextLevel) {
            this.levelUp();
            levelChanged = true;
        }
        
        // Return the current level if a level up occurred, otherwise return 0
        return levelChanged ? this.level : 0;
    }
    
    /**
     * Level up the player, increasing stats and resetting resources
     * @returns {number} - The new level after leveling up
     */
    levelUp() {
        // Validate current level
        this.level = this.validateNumber(this.level, DEFAULT_PLAYER_STATS.level);
        
        // Increase level
        this.level++;
        
        // Validate experience and experienceToNextLevel
        this.experience = this.validateNumber(this.experience, 0);
        this.experienceToNextLevel = this.validateNumber(this.experienceToNextLevel, DEFAULT_PLAYER_STATS.experienceToNextLevel);
        
        // Subtract experience for this level
        this.experience = Math.max(0, this.experience - this.experienceToNextLevel);
        
        // Calculate experience for next level
        const multiplier = this.validateNumber(LEVEL_UP_EXPERIENCE_MULTIPLIER, 1.1);
        this.experienceToNextLevel = Math.floor(this.experienceToNextLevel * multiplier);
        
        // Validate current stats before increasing
        this.maxHealth = this.validateNumber(this.maxHealth, DEFAULT_PLAYER_STATS.maxHealth);
        this.maxMana = this.validateNumber(this.maxMana, DEFAULT_PLAYER_STATS.maxMana);
        this.strength = this.validateNumber(this.strength, DEFAULT_PLAYER_STATS.strength);
        this.dexterity = this.validateNumber(this.dexterity, DEFAULT_PLAYER_STATS.dexterity);
        this.intelligence = this.validateNumber(this.intelligence, DEFAULT_PLAYER_STATS.intelligence);
        this.attackPower = this.validateNumber(this.attackPower, DEFAULT_PLAYER_STATS.attackPower);
        
        // Increase stats based on config (with validation)
        this.maxHealth += this.validateNumber(LEVEL_UP_STAT_INCREASES.maxHealth, 0);
        this.maxMana += this.validateNumber(LEVEL_UP_STAT_INCREASES.maxMana, 0);
        this.strength += this.validateNumber(LEVEL_UP_STAT_INCREASES.strength, 0);
        this.dexterity += this.validateNumber(LEVEL_UP_STAT_INCREASES.dexterity, 0);
        this.intelligence += this.validateNumber(LEVEL_UP_STAT_INCREASES.intelligence, 0);
        this.attackPower += this.validateNumber(LEVEL_UP_STAT_INCREASES.attackPower, 0);
        
        // Restore health and mana
        this.health = this.maxHealth;
        this.mana = this.maxMana;
        
        return this.level;
    }
    
    /**
     * Add a temporary boost to a stat
     * @param {string} statName - The name of the stat to boost (e.g., 'movementSpeed', 'attackPower')
     * @param {number} amount - The amount to boost by (e.g., 0.3 for 30% increase)
     * @param {number} duration - Duration of the boost in seconds
     */
    addTemporaryBoost(statName, amount, duration) {
        // Validate inputs
        amount = this.validateNumber(amount, 0);
        duration = this.validateNumber(duration, 0);
        
        // Check if the stat exists
        if (this[statName] === undefined) {
            console.warn(`Cannot add boost to non-existent stat: ${statName}`);
            return;
        }
        
        // Ensure the stat value is valid
        this[statName] = this.validateNumber(this[statName], 0);
        
        // Store the original value if this is a new boost
        if (!this.temporaryBoosts[statName]) {
            this.temporaryBoosts[statName] = {
                originalValue: this[statName],
                boosts: []
            };
        }
        
        // Add the new boost
        /** @type {TemporaryBoost} */
        const boost = {
            amount: amount,
            duration: duration,
            remainingTime: duration
        };
        
        this.temporaryBoosts[statName].boosts.push(boost);
        
        // Apply the boost immediately
        this.applyBoosts(statName);
        
        console.debug(`Added temporary boost to ${statName}: +${amount} for ${duration} seconds`);
    }
    
    /**
     * Apply all active boosts for a specific stat
     * @param {string} statName - The name of the stat to apply boosts for
     */
    applyBoosts(statName) {
        if (!this.temporaryBoosts[statName]) return;
        
        // Validate the original value
        this.temporaryBoosts[statName].originalValue = this.validateNumber(
            this.temporaryBoosts[statName].originalValue, 
            this[statName] || 0
        );
        
        // Reset to original value
        this[statName] = this.temporaryBoosts[statName].originalValue;
        
        // Apply all active boosts
        for (const boost of this.temporaryBoosts[statName].boosts) {
            if (boost.remainingTime > 0) {
                // Validate boost amount
                boost.amount = this.validateNumber(boost.amount, 0);
                
                // For percentage boosts (e.g., moveSpeed)
                const boostAmount = this[statName] * boost.amount;
                this[statName] += this.validateNumber(boostAmount, 0);
            }
        }
        
        // Final validation to ensure the stat is a valid number
        this[statName] = this.validateNumber(this[statName], this.temporaryBoosts[statName].originalValue);
    }
    
    /**
     * Update all temporary boosts, reducing their remaining time
     * @param {number} delta - Time since last update in seconds
     * @returns {boolean} - Whether any boosts were changed or removed
     */
    updateTemporaryBoosts(delta) {
        // Validate delta
        delta = this.validateNumber(delta, 0);
        
        let boostsChanged = false;
        
        // Update each stat's boosts
        for (const statName in this.temporaryBoosts) {
            // Skip if the stat doesn't exist
            if (this[statName] === undefined) {
                delete this.temporaryBoosts[statName];
                continue;
            }
            
            const statBoosts = this.temporaryBoosts[statName];
            let activeBoostsChanged = false;
            
            // Validate the original value
            statBoosts.originalValue = this.validateNumber(statBoosts.originalValue, 0);
            
            // Update remaining time for each boost
            for (const boost of statBoosts.boosts) {
                if (boost.remainingTime > 0) {
                    boost.remainingTime -= delta;
                    if (boost.remainingTime <= 0) {
                        boost.remainingTime = 0;
                        activeBoostsChanged = true;
                    }
                }
            }
            
            // Clean up expired boosts
            if (activeBoostsChanged) {
                // Filter out expired boosts
                statBoosts.boosts = statBoosts.boosts.filter(boost => boost.remainingTime > 0);
                boostsChanged = true;
                
                // If no more boosts for this stat, revert to original value
                if (statBoosts.boosts.length === 0) {
                    this[statName] = statBoosts.originalValue;
                    delete this.temporaryBoosts[statName];
                } else {
                    // Otherwise, reapply the remaining boosts
                    this.applyBoosts(statName);
                }
            }
            
            // Final validation to ensure the stat is a valid number
            this[statName] = this.validateNumber(this[statName], statBoosts.originalValue);
        }
        
        return boostsChanged;
    }
    
    /**
     * Regenerate health and mana resources over time
     * @param {number} delta - Time since last update in seconds
     */
    regenerateResources(delta) {
        // Validate delta to prevent NaN propagation
        delta = this.validateNumber(delta, 0);
        
        // Update temporary boosts
        this.updateTemporaryBoosts(delta);
        
        // Validate health and maxHealth before regeneration
        this.getHealth();
        this.getMaxHealth();
        
        // Regenerate health using game balance settings
        if (this.health < this.maxHealth) {
            const healthRegen = delta * this.validateNumber(RESOURCE_REGENERATION.health, 0);
            this.health += healthRegen;
            
            // Ensure health doesn't exceed maxHealth
            if (this.health > this.maxHealth) {
                this.health = this.maxHealth;
            }
        }
        
        // Validate mana and maxMana before regeneration
        if (isNaN(this.mana) || this.mana === undefined || this.mana === null) {
            this.mana = 0;
        }
        
        if (isNaN(this.maxMana) || this.maxMana === undefined || this.maxMana === null) {
            this.maxMana = DEFAULT_PLAYER_STATS.maxMana;
        }
        
        // Regenerate mana using game balance settings
        if (this.mana < this.maxMana) {
            const manaRegen = delta * this.validateNumber(RESOURCE_REGENERATION.mana, 0);
            this.mana += manaRegen;
            
            // Ensure mana doesn't exceed maxMana
            if (this.mana > this.maxMana) {
                this.mana = this.maxMana;
            }
        }
        
        // Final validation to ensure we don't have NaN values
        this.validateStats();
    }
    
    /**
     * Validates all stats to ensure they are valid numbers
     * This is a safety check to prevent NaN values from persisting
     */
    validateStats() {
        // Validate core stats
        this.health = this.validateNumber(this.health, 0);
        this.maxHealth = this.validateNumber(this.maxHealth, DEFAULT_PLAYER_STATS.maxHealth);
        this.mana = this.validateNumber(this.mana, 0);
        this.maxMana = this.validateNumber(this.maxMana, DEFAULT_PLAYER_STATS.maxMana);
        this.strength = this.validateNumber(this.strength, DEFAULT_PLAYER_STATS.strength);
        this.dexterity = this.validateNumber(this.dexterity, DEFAULT_PLAYER_STATS.dexterity);
        this.intelligence = this.validateNumber(this.intelligence, DEFAULT_PLAYER_STATS.intelligence);
        this.movementSpeed = this.validateNumber(this.movementSpeed, DEFAULT_PLAYER_STATS.movementSpeed);
        this.attackPower = this.validateNumber(this.attackPower, DEFAULT_PLAYER_STATS.attackPower);
        this.level = this.validateNumber(this.level, DEFAULT_PLAYER_STATS.level);
        this.experience = this.validateNumber(this.experience, DEFAULT_PLAYER_STATS.experience);
        this.experienceToNextLevel = this.validateNumber(this.experienceToNextLevel, DEFAULT_PLAYER_STATS.experienceToNextLevel);
    }
}