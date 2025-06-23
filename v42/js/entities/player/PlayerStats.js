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
        this.level = initialStats.level || DEFAULT_PLAYER_STATS.level;
        this.experience = initialStats.experience || DEFAULT_PLAYER_STATS.experience;
        this.experienceToNextLevel = initialStats.experienceToNextLevel || DEFAULT_PLAYER_STATS.experienceToNextLevel;
        this.health = initialStats.health || DEFAULT_PLAYER_STATS.health;
        this.maxHealth = initialStats.maxHealth || DEFAULT_PLAYER_STATS.maxHealth;
        this.mana = initialStats.mana || DEFAULT_PLAYER_STATS.mana;
        this.maxMana = initialStats.maxMana || DEFAULT_PLAYER_STATS.maxMana;
        this.strength = initialStats.strength || DEFAULT_PLAYER_STATS.strength;
        this.dexterity = initialStats.dexterity || DEFAULT_PLAYER_STATS.dexterity;
        this.intelligence = initialStats.intelligence || DEFAULT_PLAYER_STATS.intelligence;
        this.movementSpeed = initialStats.movementSpeed || DEFAULT_PLAYER_STATS.movementSpeed;
        this.attackPower = initialStats.attackPower || DEFAULT_PLAYER_STATS.attackPower;
        
        // Track temporary stat boosts
        /** @type {Object.<string, StatBoost>} */
        this.temporaryBoosts = {};
    }
    
    // Getters
    /**
     * Get current health points
     * @returns {number} Current health points
     */
    getHealth() {
        return this.health;
    }
    
    /**
     * Get maximum health points
     * @returns {number} Maximum health points
     */
    getMaxHealth() {
        return this.maxHealth;
    }
    
    /**
     * Get current mana points
     * @returns {number} Current mana points
     */
    getMana() {
        return this.mana;
    }
    
    /**
     * Get maximum mana points including equipment bonuses
     * @returns {number} Maximum mana points
     */
    getMaxMana() {
        // Get base max mana
        let maxMana = this.maxMana;
        
        // Add equipment bonus if player has an inventory
        if (this._player && this._player.inventory) {
            maxMana += this._player.inventory.getManaBonus();
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
        this.health = Math.max(0, Math.min(value, this.maxHealth));
    }
    
    /**
     * Heal the player by the specified amount
     * @param {number} amount - Amount of health to restore
     * @returns {number} - The actual amount healed
     */
    heal(amount) {
        const oldHealth = this.health;
        this.health = Math.min(this.health + amount, this.maxHealth);
        return this.health - oldHealth;
    }
    
    /**
     * Set mana points, clamped between 0 and maxMana
     * @param {number} value - New mana value
     */
    setMana(value) {
        this.mana = Math.max(0, Math.min(value, this.maxMana));
    }
    
    /**
     * Add experience points and handle level up if necessary
     * @param {number} amount - Amount of experience to add
     * @returns {number} - The current level if a level up occurred, otherwise 0
     */
    addExperience(amount) {
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
        // Increase level
        this.level++;
        
        // Subtract experience for this level
        this.experience -= this.experienceToNextLevel;
        
        // Calculate experience for next level
        this.experienceToNextLevel = Math.floor(this.experienceToNextLevel * LEVEL_UP_EXPERIENCE_MULTIPLIER);
        
        // Increase stats based on config
        this.maxHealth += LEVEL_UP_STAT_INCREASES.maxHealth;
        this.maxMana += LEVEL_UP_STAT_INCREASES.maxMana;
        this.strength += LEVEL_UP_STAT_INCREASES.strength;
        this.dexterity += LEVEL_UP_STAT_INCREASES.dexterity;
        this.intelligence += LEVEL_UP_STAT_INCREASES.intelligence;
        this.attackPower += LEVEL_UP_STAT_INCREASES.attackPower;
        
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
        
        // Reset to original value
        this[statName] = this.temporaryBoosts[statName].originalValue;
        
        // Apply all active boosts
        for (const boost of this.temporaryBoosts[statName].boosts) {
            if (boost.remainingTime > 0) {
                // For percentage boosts (e.g., moveSpeed)
                this[statName] += this[statName] * boost.amount;
            }
        }
    }
    
    /**
     * Update all temporary boosts, reducing their remaining time
     * @param {number} delta - Time since last update in seconds
     * @returns {boolean} - Whether any boosts were changed or removed
     */
    updateTemporaryBoosts(delta) {
        let boostsChanged = false;
        
        // Update each stat's boosts
        for (const statName in this.temporaryBoosts) {
            const statBoosts = this.temporaryBoosts[statName];
            let activeBoostsChanged = false;
            
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
        }
        
        return boostsChanged;
    }
    
    /**
     * Regenerate health and mana resources over time
     * @param {number} delta - Time since last update in seconds
     */
    regenerateResources(delta) {
        // Update temporary boosts
        this.updateTemporaryBoosts(delta);
        
        // Regenerate health using game balance settings
        if (this.health < this.maxHealth) {
            this.health += delta * RESOURCE_REGENERATION.health;
            if (this.health > this.maxHealth) {
                this.health = this.maxHealth;
            }
        }
        
        // Regenerate mana using game balance settings
        if (this.mana < this.maxMana) {
            this.mana += delta * RESOURCE_REGENERATION.mana;
            if (this.mana > this.maxMana) {
                this.mana = this.maxMana;
            }
        }
    }
}