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
     * Handles player taking damage
     * @param {number} damage - The amount of damage to take
     * @returns {number} The actual amount of damage taken after reductions
     */
    takeDamage(damage) {
        // Apply armor reduction
        let reducedDamage = damage;
        const equipment = this.playerInventory.getEquipment();
        if (equipment.armor) {
            reducedDamage *= (1 - equipment.armor.damageReduction);
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
    }
}