/**
 * Player.js
 * Main player class that integrates all player components
 * 
 * The Player class serves as the central integration point for all player-related
 * functionality, including movement, combat, skills, inventory, and stats.
 * It implements the IPlayer interface and delegates specific behaviors to specialized components.
 * 
 * @class
 * @extends {IPlayer}
 * @property {import("../../game/Game.js").Game} game - The main game instance
 * @property {import("three").Scene} scene - The Three.js scene
 * @property {import("three").PerspectiveCamera} camera - The main camera
 * @property {THREE.LoadingManager} loadingManager - The Three.js loading manager
 * @property {PlayerState} state - Manages player state (moving, attacking, etc.)
 * @property {PlayerStats} stats - Manages player statistics (health, mana, etc.)
 * @property {PlayerInventory} inventory - Manages player inventory and equipment
 * @property {PlayerModel} model - Manages player 3D model and animations
 * @property {PlayerMovement} movement - Manages player movement and positioning
 * @property {PlayerSkills} skills - Manages player skills and abilities
 * @property {PlayerCombat} combat - Manages player combat interactions
 */
import { PlayerStats } from './PlayerStats.js';
import { PlayerState } from './PlayerState.js';
import { PlayerInventory } from './PlayerInventory.js';
import { PlayerModel } from './PlayerModel.js';
import { PlayerMovement } from './PlayerMovement.js';
import { PlayerSkills } from './PlayerSkills.js';
import { PlayerCombat } from './PlayerCombat.js';

export class Player {
    /**
     * Creates a new Player instance
     * @param {import("../../game/Game.js").Game} game - The main game instance
     * @param {import("three").Scene} scene - The Three.js scene
     * @param {import("three").PerspectiveCamera} camera - The main camera
     * @param {THREE.LoadingManager} loadingManager - The Three.js loading manager
     */
    constructor(game, scene, camera, loadingManager) {
        this.scene = scene;
        this.camera = camera;
        this.loadingManager = loadingManager;
        this.game = game;
        
        // Initialize components
        this.state = new PlayerState();
        this.stats = new PlayerStats();
        this.inventory = new PlayerInventory();
        this.model = new PlayerModel(scene, game);
        
        // Components that need to be initialized after model is created
        this.movement = null;
        this.skills = null;
        this.combat = null;
    }
    
    /**
     * Initializes the player and all its components
     * This method must be called after creating a Player instance and before using it
     * 
     * @async
     * @returns {Promise<boolean>} True if initialization was successful
     */
    async init() {
        // Create player model
        await this.model.createModel();
        
        // Initialize components that depend on the model
        this.movement = new PlayerMovement(this.state, this.stats, this.model.getModelGroup(), this.camera, this.game);
        this.skills = new PlayerSkills(this.scene, this.stats, this.movement.getPosition(), this.movement.getRotation(), this.game);
        this.combat = new PlayerCombat(this.scene, this.state, this.stats, this.model, this.inventory, this.game);
        
        // Initialize skills
        this.skills.initializeSkills();
        
        console.debug("Player initialized with model group:", this.model.getModelGroup());
        
        return true;
    }
    
    /**
     * Updates the player and all its components
     * This method should be called once per frame in the game loop
     * 
     * @param {number} delta - Time in seconds since the last update
     */
    update(delta) {
        // Check if game is paused - if so, don't update player
        if (this.game && this.game.isPaused) {
            return; // Skip all player updates when game is paused
        }
        
        // Check for keyboard movement input
        if (this.game && this.game.inputHandler) {
            this.movement.handleKeyboardMovement(delta);
        }
        
        // Update movement
        this.movement.updateMovement(delta);
        
        // Ensure player is always at the correct terrain height
        this.movement.updateTerrainHeight();
        
        // Update camera
        this.movement.updateCamera();
        
        // Update skills
        this.skills.updateSkills(delta);
        
        // Update animations
        this.model.updateAnimations(delta, this.state);
        
        // Sync model position with movement position
        const currentPosition = this.movement.getPosition();
        this.model.setPosition(currentPosition);
        
        // Sync model rotation with movement rotation
        const currentRotation = this.movement.getRotation();
        this.model.setRotation(currentRotation);
        
        // Regenerate resources
        this.stats.regenerateResources(delta);
    }
    
    // Movement methods
    /**
     * Moves the player to a target position
     * 
     * @param {import("three").Vector3} target - The target position to move to
     */
    moveTo(target) {
        this.movement.moveTo(target);
    }
    
    /**
     * Sets the player's position directly
     * 
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {number} z - Z coordinate
     */
    setPosition(x, y, z) {
        this.movement.setPosition(x, y, z);
    }
    
    /**
     * Gets the player's current position
     * 
     * @returns {import("three").Vector3} The player's current position
     */
    getPosition() {
        return this.movement.getPosition();
    }
    
    /**
     * Gets the player's current rotation
     * This method returns the rotation values that determine the player's orientation in the 3D world.
     * 
     * @returns {{x: number, y: number, z: number}} The player's current rotation as an object with x, y, z properties in radians
     */
    getRotation() {
        return this.movement.getRotation();
    }
    
    /**
     * Sets the player's rotation
     * 
     * @param {number} x - Rotation around X axis (in radians)
     * @param {number} y - Rotation around Y axis (in radians)
     * @param {number} z - Rotation around Z axis (in radians)
     */
    setRotation(x, y, z) {
        if (this.movement) {
            // Update movement component rotation
            this.movement.rotation.y = y;
            
            // Update model rotation
            if (this.model) {
                this.model.setRotation({y: y});
            }
        }
    }
    
    /**
     * Sets the player's look direction (for camera control)
     * This method updates both the player's rotation and the model's rotation
     * based on the provided direction vector.
     * 
     * @param {import("three").Vector3} direction - Normalized direction vector
     */
    setLookDirection(direction) {
        // Update player's look direction
        if (this.movement) {
            // Calculate the horizontal rotation (around Y axis)
            const horizontalRotation = Math.atan2(direction.x, direction.z);
            
            // Update movement component rotation
            this.movement.rotation.y = horizontalRotation;
            
            // Update model rotation
            if (this.model) {
                this.model.setRotation({y: horizontalRotation});
                
                // Store vertical look direction for use in rendering/animations
                this.model.setVerticalLookDirection(direction.y);
            }
            
            // Log the look direction update
            // console.debug("Player look direction updated:", { direction, horizontalRotation, verticalDirection: direction.y});
        }
    }
    
    /**
     * Gets the player's collision radius for collision detection
     * 
     * @returns {number} The player's collision radius
     */
    getCollisionRadius() {
        return this.movement.getCollisionRadius();
    }
    
    /**
     * Gets the player's height offset from the ground
     * 
     * @returns {number} The player's height offset
     */
    getHeightOffset() {
        return this.movement.getHeightOffset();
    }
    
    // Combat methods
    /**
     * Attacks a target
     * 
     * @param {Object} target - The target to attack
     */
    attack(target) {
        this.combat.attack(target);
    }
    
    /**
     * Makes the player take damage
     * 
     * @param {number} damage - The amount of damage to take
     * @returns {number} The actual amount of damage taken (after modifiers)
     */
    takeDamage(damage) {
        return this.combat.takeDamage(damage);
    }
    
    /**
     * Kills the player
     */
    die() {
        this.combat.die();
    }
    
    /**
     * Revives the player from death
     */
    revive() {
        this.combat.revive();
    }
    
    /**
     * Uses a skill by its index
     * 
     * @param {number} skillIndex - The index of the skill to use
     * @returns {boolean} True if the skill was used successfully
     */
    useSkill(skillIndex) {
        return this.skills.useSkill(skillIndex);
    }
    
    /**
     * Uses the player's primary attack
     * 
     * @returns {boolean} True if the primary attack was used successfully
     */
    usePrimaryAttack() {
        return this.skills.usePrimaryAttack();
    }
    
    // Stats and progression
    /**
     * Adds experience points to the player
     * May trigger level up if enough experience is gained
     * 
     * @param {number} amount - The amount of experience to add
     */
    addExperience(amount) {
        const newLevel = this.stats.addExperience(amount);
        
        // Show level up notification if level changed
        if (newLevel > 0 && this.game && this.game.hudManager) {
            this.game.hudManager.showLevelUp(newLevel);
        }
    }
    
    /**
     * Manually triggers a level up for the player
     * 
     * @returns {boolean} True if the level up was successful
     */
    levelUp() {
        return this.stats.levelUp();
    }
    
    // Stats getters - delegate to PlayerStats
    /**
     * Gets the player's current level
     * 
     * @returns {number} The player's level
     */
    getLevel() {
        return this.stats.getLevel();
    }
    
    /**
     * Gets the player's current health
     * 
     * @returns {number} The player's current health
     */
    getHealth() {
        return this.stats.getHealth();
    }
    
    /**
     * Gets the player's maximum health
     * 
     * @returns {number} The player's maximum health
     */
    getMaxHealth() {
        return this.stats.getMaxHealth();
    }
    
    /**
     * Gets the player's current mana
     * 
     * @returns {number} The player's current mana
     */
    getMana() {
        return this.stats.getMana();
    }
    
    /**
     * Gets the player's maximum mana
     * 
     * @returns {number} The player's maximum mana
     */
    getMaxMana() {
        return this.stats.getMaxMana();
    }
    
    /**
     * Gets the player's current experience points
     * 
     * @returns {number} The player's current experience
     */
    getExperience() {
        return this.stats.getExperience();
    }
    
    /**
     * Gets the experience required to reach the next level
     * 
     * @returns {number} The experience required for the next level
     */
    getExperienceToNextLevel() {
        return this.stats.getExperienceToNextLevel();
    }
    
    /**
     * Gets the player's attack power
     * 
     * @returns {number} The player's attack power
     */
    getAttackPower() {
        return this.stats.getAttackPower();
    }
    
    /**
     * Gets the player's movement speed
     * 
     * @returns {number} The player's movement speed
     */
    getMovementSpeed() {
        return this.stats.getMovementSpeed();
    }
    
    /**
     * Gets the player's stats object directly
     * This method is provided for backward compatibility and should be used carefully
     * 
     * @returns {PlayerStats} The player's stats object
     * @deprecated Use specific getter methods instead
     */
    getStatsObject() {
        return this.stats;
    }
    
    /**
     * Gets the player's current animation name
     * 
     * @returns {string|null} The name of the current animation, or null if no animation is playing
     */
    getCurrentAnimation() {
        return this.model ? this.model.currentAnimation : null;
    }
    
    // Skills getters - delegate to PlayerSkills
    /**
     * Gets all player skills
     * Returns an array of all skills the player has learned, including both
     * active and passive skills.
     * 
     * @returns {Array<Object>} Array of all player skill objects
     */
    getSkills() {
        return this.skills.getSkills();
    }
    
    /**
     * Gets only the active skills that can be used
     * Returns an array of skills that the player can actively trigger,
     * excluding passive skills that provide permanent bonuses.
     * 
     * @returns {Array<Object>} Array of active player skill objects
     */
    getActiveSkills() {
        return this.skills.getActiveSkills();
    }
    
    /**
     * Loads skill tree data from configuration
     * 
     * @returns {boolean} True if skill tree data was loaded successfully
     */
    loadSkillTreeData() {
        if (this.skills) {
            return this.skills.loadSkillTreeData();
        }
        return false;
    }
    
    // Inventory getters - delegate to PlayerInventory
    /**
     * Gets the player's inventory items
     * Returns an array of all items currently in the player's inventory.
     * Each item is an object with properties like name, type, stats, etc.
     * 
     * @returns {Array<Object>} Array of inventory item objects
     */
    getInventory() {
        return this.inventory.getInventory();
    }
    
    /**
     * Gets the player's equipped items
     * Returns an object where keys are equipment slots (e.g., 'weapon', 'armor', 'helmet')
     * and values are the equipped item objects.
     * 
     * @returns {Object.<string, Object>} Object containing equipped items by slot
     */
    getEquipment() {
        return this.inventory.getEquipment();
    }
    
    /**
     * Gets the player's gold amount
     * 
     * @returns {number} The player's gold amount
     */
    getGold() {
        return this.inventory.getGold();
    }
    
    // Inventory and equipment
    /**
     * Adds an item to the player's inventory
     * This method adds a new item to the player's inventory. If the item is stackable
     * and already exists in the inventory, it will increase the quantity instead of
     * adding a duplicate item.
     * 
     * @param {Object} item - The item to add
     * @param {string} item.name - The name of the item
     * @param {string} item.type - The type of the item (weapon, armor, consumable, etc.)
     * @param {Object} [item.stats] - The stats of the item (optional)
     */
    addToInventory(item) {
        this.inventory.addToInventory(item);
    }
    
    /**
     * Removes an item from the player's inventory
     * 
     * @param {string} itemName - The name of the item to remove
     * @param {number} amount - The amount to remove
     * @returns {boolean} True if the item was successfully removed
     */
    removeFromInventory(itemName, amount) {
        return this.inventory.removeFromInventory(itemName, amount);
    }
    
    /**
     * Equips an item from the inventory
     * This method equips an item from the player's inventory to the appropriate equipment slot.
     * If there is already an item in that slot, it will be automatically unequipped and
     * returned to the inventory.
     * 
     * @param {Object} item - The item to equip
     * @param {string} item.name - The name of the item
     * @param {string} item.type - The type/slot of the item (weapon, armor, helmet, etc.)
     * @param {Object} [item.stats] - The stats bonuses provided by the item
     * @returns {boolean} True if the item was successfully equipped
     */
    equipItem(item) {
        return this.inventory.equipItem(item);
    }
    
    /**
     * Unequips an item by its type/slot
     * 
     * @param {string} type - The type/slot of the item to unequip
     * @returns {boolean} True if the item was successfully unequipped
     */
    unequipItem(type) {
        return this.inventory.unequipItem(type);
    }
    
    /**
     * Adds gold to the player's inventory
     * 
     * @param {number} amount - The amount of gold to add
     */
    addGold(amount) {
        this.inventory.addGold(amount);
    }
    
    /**
     * Removes gold from the player's inventory
     * 
     * @param {number} amount - The amount of gold to remove
     * @returns {boolean} True if the gold was successfully removed
     */
    removeGold(amount) {
        return this.inventory.removeGold(amount);
    }
    
    // State management
    /**
     * Sets whether the player is in water
     * 
     * @param {boolean} inWater - True if the player is in water
     */
    setInWater(inWater) {
        this.state.setInWater(inWater);
    }
    
    /**
     * Sets whether the player is currently interacting with an object
     * 
     * @param {boolean} isInteracting - True if the player is interacting
     */
    setInteracting(isInteracting) {
        this.state.setInteracting(isInteracting);
    }
    
    // interact() method removed - now handled by InputHandler.handleInteractionWithNearestObject()
    
    /**
     * Checks if the player is currently interacting with an object
     * 
     * @returns {boolean} True if the player is interacting
     */
    isInteracting() {
        return this.state.isInteracting();
    }
}