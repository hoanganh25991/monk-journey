import * as THREE from 'three';

/**
 * @typedef {Object} PunchSystem
 * @property {number} cooldown - Current cooldown time remaining
 * @property {number} cooldownTime - Total cooldown time between punches
 * @property {number} range - Maximum range for detecting enemies to punch
 * @property {number} comboCount - Current combo counter (0-3)
 * @property {number} comboTimer - Time remaining in current combo window
 * @property {number} comboTimeWindow - Total time window to continue a combo
 * @property {number[]} damageMultipliers - Damage multipliers for each combo step
 * @property {number} knockbackDistance - Distance to knock back enemies on heavy punch
 * @property {number} knockbackDuration - Duration of knockback effect
 */
export class PlayerCombat {
    /**
     * @param {THREE.Scene} scene - The Three.js scene
     * @param {import('./PlayerInterface.js').IPlayerState} playerState - Player state manager
     * @param {import('./PlayerInterface.js').IPlayerStats} playerStats - Player statistics
     * @param {import('./PlayerInterface.js').IPlayerModel} playerModel - Player model and animations
     * @param {import('./PlayerInterface.js').IPlayerInventory} playerInventory - Player inventory
     */
    /**
     * @param {THREE.Scene} scene - The Three.js scene
     * @param {import('./PlayerInterface.js').IPlayerState} playerState - Player state manager
     * @param {import('./PlayerInterface.js').IPlayerStats} playerStats - Player statistics
     * @param {import('./PlayerInterface.js').IPlayerModel} playerModel - Player model and animations
     * @param {import('./PlayerInterface.js').IPlayerInventory} playerInventory - Player inventory
     * @param {Object} [game=null] - The main game instance
     */
    constructor(scene, playerState, playerStats, playerModel, playerInventory, game = null) {
        /**
         * The Three.js scene
         * @type {THREE.Scene}
         */
        this.scene = scene;
        
        /**
         * Player state manager
         * @type {import('./PlayerInterface.js').IPlayerState}
         */
        this.playerState = playerState;
        
        /**
         * Player statistics
         * @type {import('./PlayerInterface.js').IPlayerStats}
         */
        this.playerStats = playerStats;
        
        /**
         * Player model and animations
         * @type {import('./PlayerInterface.js').IPlayerModel}
         */
        this.playerModel = playerModel;
        
        /**
         * Player inventory
         * @type {import('./PlayerInterface.js').IPlayerInventory}
         */
        this.playerInventory = playerInventory;
        
        /**
         * Game reference
         * @type {Object|null}
         */
        this.game = game;
        
        /**
         * Simplified punch system
         * @type {PunchSystem}
         */
        this.punchSystem = {
            cooldown: 0,
            cooldownTime: 0.5,
            range: 2.0,
            comboCount: 0,
            comboTimer: 0,
            comboTimeWindow: 1.5,
            damageMultipliers: [1.0, 1.1, 1.3, 1.8],
            knockbackDistance: 3.0,
            knockbackDuration: 0.3
        };
    }
    
    // setGame method removed - game is now passed in constructor
    
    /**
     * Handle player taking damage with comprehensive defense calculations
     * @param {number} damage - The raw damage amount
     * @param {boolean} ignoreDefense - Whether to ignore defense (for true damage)
     * @returns {number} - The actual damage taken after reductions
     */
    takeDamage(damage, ignoreDefense = false) {
        // Check for invulnerability
        if (this.game?.player?.statusEffects?.hasEffect('invulnerable')) {
            console.debug("Player is invulnerable - no damage taken");
            return 0;
        }
        
        // Start with the raw damage
        let reducedDamage = damage;
        
        // Skip defense calculations if ignoreDefense is true (for true damage effects)
        if (!ignoreDefense) {
            // Get all equipment
            const equipment = this.playerInventory.getEquipment();
            
            // Calculate total defense value from all equipped items
            let totalDefense = 0;
            let totalDamageReduction = 0;
            
            // Process each equipment slot
            for (const slot in equipment) {
                const item = equipment[slot];
                if (!item) continue;
                
                // Check if the item has defense stats
                if (typeof item.getStat === 'function') {
                    // Add defense value
                    const defenseValue = item.getStat('defense') || 0;
                    totalDefense += defenseValue;
                    
                    // Add direct damage reduction percentage (if available)
                    const damageReduction = item.getStat('damageReduction') || 0;
                    totalDamageReduction += damageReduction;
                    
                    // Log the contribution of each item
                    if (defenseValue > 0 || damageReduction > 0) {
                        console.debug(`Defense from ${slot}: ${defenseValue}, Damage reduction: ${damageReduction}%`);
                    }
                } else if (item.damageReduction) {
                    // Legacy support for items with direct damageReduction property
                    totalDamageReduction += item.damageReduction * 100; // Convert to percentage
                }
            }
            
            // Check for defense boost effect from Fist of Thunder
            if (this.game?.player?.statusEffects?.hasEffect('defenseBoost')) {
                // Add 50% damage reduction from the Fist of Thunder defense boost
                totalDamageReduction += 50;
                console.debug("Applied 50% damage reduction from Fist of Thunder defense boost");
            }
            
            // Apply defense formula: damage reduction percentage based on defense
            // Formula: reduction = defense / (defense + 100)
            // This gives diminishing returns for high defense values
            const defenseReductionPercent = totalDefense / (totalDefense + 100);
            
            // Cap total direct damage reduction at 75% to prevent invincibility
            const cappedDamageReduction = Math.min(totalDamageReduction / 100, 0.75);
            
            // Apply both types of reduction
            // First apply defense-based reduction
            reducedDamage *= (1 - defenseReductionPercent);
            
            // Then apply direct damage reduction
            reducedDamage *= (1 - cappedDamageReduction);
            
            // Log the defense calculations
            console.debug(`Player defense: ${totalDefense}, defense reduction: ${(defenseReductionPercent * 100).toFixed(1)}%`);
            console.debug(`Direct damage reduction: ${(cappedDamageReduction * 100).toFixed(1)}%`);
            console.debug(`Raw damage: ${damage}, reduced damage: ${reducedDamage.toFixed(1)}`);
        }
        
        // Round the damage to avoid floating point issues
        reducedDamage = Math.round(reducedDamage);
        
        // Ensure minimum damage of 1 (unless it's a very small amount like 0.5 that got rounded down)
        if (damage > 0 && reducedDamage < 1) {
            reducedDamage = 1;
        }
        
        // Apply damage to health
        this.playerStats.setHealth(this.playerStats.getHealth() - reducedDamage);
        
        // Sound effect
        if (this.game?.audioManager) {
            this.game.audioManager.playSound('playerHit');
        }
        
        // Check for death
        if (this.playerStats.getHealth() <= 0) {
            this.die();
        }
        
        // Visual effect
        if (this.game?.hudManager) {
            const playerPosition = this.playerModel.getModelGroup().position;
            this.game.hudManager.createBleedingEffect(reducedDamage, playerPosition, true);
        }
        
        return reducedDamage;
    }
    
    /**
     * Handles player death
     */
    die() {
        // Set dead state
        this.playerState.setDead(true);
        this.playerState.setMoving(false);
        
        // Visual and sound effects
        this.playerModel.getModelGroup().rotation.x = Math.PI / 2;
        if (this.game?.audioManager) {
            this.game.audioManager.playSound('playerDeath');
        }
        
        // Show death screen
        if (this.game?.hudManager) {
            this.game.hudManager.showDeathScreen();
        }
    }
    
    /**
     * Revives the player after death
     */
    revive() {
        // Reset health and mana
        this.playerStats.setHealth(this.playerStats.getMaxHealth() * 0.75);
        this.playerStats.setMana(this.playerStats.getMaxMana() * 0.75);
        
        // Reset state
        this.playerState.setDead(false);
        
        // Reset position and rotation
        this.playerModel.setPosition(new THREE.Vector3(0, 0, 0));
        this.playerModel.getModelGroup().rotation.x = 0;
        
        // Hide death screen
        if (this.game?.hudManager) {
            this.game.hudManager.hideDeathScreen();
        }
        
        // Apply invulnerability for 3 seconds
        if (this.game?.player?.statusEffects) {
            this.game.player.statusEffects.applyEffect('invulnerable', 3.0, 1.0);
            console.debug("Applied 3-second invulnerability after respawn");
        }
    }
}