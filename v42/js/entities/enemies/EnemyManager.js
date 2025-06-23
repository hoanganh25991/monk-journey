import * as THREE from 'three';
import { Enemy } from './Enemy.js';
import { 
    ZONE_ENEMIES, 
    ZONE_BOSSES, 
    ENEMY_TYPES, 
    BOSS_TYPES, 
    ZONE_DIFFICULTY_MULTIPLIERS,
    DROP_CHANCES, 
    REGULAR_DROP_TABLE, 
    BOSS_DROP_TABLE,
    COMBAT_BALANCE, 
    DIFFICULTY_SCALING 
} from '../../config/game-balance.js';
import { ItemGenerator } from '../items/ItemGenerator.js';

/**
 * @typedef {Object} EnemyType
 * @property {string} type - Unique identifier for the enemy type
 * @property {string} name - Display name of the enemy
 * @property {string} model - Path to the 3D model file
 * @property {number} health - Base health points
 * @property {number} damage - Base damage points
 * @property {number} speed - Movement speed
 * @property {number} experienceValue - Experience points awarded when defeated
 * @property {number} [baseHealth] - Original health value before scaling
 * @property {boolean} [isBoss] - Whether this enemy is a boss
 * @property {string} [attackSound] - Sound to play when attacking
 * @property {string} [deathSound] - Sound to play when dying
 * @property {number} [attackRange] - Range at which enemy can attack
 * @property {number} [detectionRange] - Range at which enemy detects player
 */

/**
 * @typedef {Object} EnemyGroupSize
 * @property {number} min - Minimum number of enemies in a group
 * @property {number} max - Maximum number of enemies in a group
 */

/**
 * @typedef {Object} DropItem
 * @property {string} id - Unique identifier for the item
 * @property {string} name - Display name of the item
 * @property {string} type - Type of item (weapon, armor, consumable, etc.)
 * @property {number} weight - Drop weight/probability
 * @property {Object} [stats] - Item statistics
 */

/**
 * Manages enemy spawning, updating, and removal in the game world
 */
export class EnemyManager {
    /**
     * Creates a new EnemyManager instance
     * @param {THREE.Scene} scene - The Three.js scene
     * @param {import("../player/Player.js").Player} player - The player instance
     * @param {THREE.LoadingManager} loadingManager - The Three.js loading manager
     * @param {import("../../game/Game.js").Game} [game=null] - The main game instance
     */
    constructor(scene, player, loadingManager, game, itemDropManager) {
        this.scene = scene;
        this.player = player;
        this.loadingManager = loadingManager;
        this.enemies = new Map(); // Changed to Map for easier lookup by ID
        this.enemyMeshes = [];
        this.maxEnemies = 30; // Increased max enemies for world exploration
        this.spawnRadius = 30;
        this.spawnTimer = 0;
        this.spawnInterval = 5; // Spawn enemy every 5 seconds
        this.game = game; // Game reference passed in constructor
        this.nextEnemyId = 1; // For generating unique enemy IDs
        
        // For chunk-based enemy spawning
        this.enemyChunks = {}; // Track enemies per chunk
        this.enemiesPerChunk = 5; // Number of enemies to spawn per chunk
        this.chunkSpawnRadius = 80; // Radius within chunk to spawn enemies
        this.enemyGroupSize = { min: 2, max: 5 }; // Enemies spawn in groups
        
        // Import enemy configuration from config/enemies.js
        this.zoneEnemies = ZONE_ENEMIES;
        this.zoneBosses = ZONE_BOSSES;
        this.enemyTypes = ENEMY_TYPES;
        this.bossTypes = BOSS_TYPES;
        
        // Difficulty scaling
        this.difficultyMultiplier = 1.0;
        
        // Import zone difficulty multipliers from config
        this.zoneDifficultyMultipliers = ZONE_DIFFICULTY_MULTIPLIERS;
        // Track current difficulty
        this.currentDifficulty = 'basic'; // Default difficulty
        
        // Multiplayer support
        this.isMultiplayer = false;
        this.isHost = false;
        
        // Boss spawning configuration
        this.bossSpawnTimer = 0;
        this.bossSpawnInterval = 120; // Spawn boss every 120 seconds (2 minutes)
        this.bossSpawnChance = 0.2; // 20% chance to spawn a boss when timer is up
        
        // Item generation
        this.itemGenerator = new ItemGenerator(game);
        
        // Reference to the item drop manager (will be set by the game)
        this.itemDropManager = itemDropManager;
        
        // Track enemies that have already dropped items to prevent duplicate drops
        this.processedDrops = new Map();
    }
    
    // setGame method removed - game is now passed in constructor
    
    /**
     * Pause all enemies in the game
     * Stops animations and movement
     */
    pause() {
        console.debug(`Pausing ${this.enemies.size} enemies`);
        
        for (const [id, enemy] of this.enemies.entries()) {
            // Pause animation mixer if it exists
            if (enemy.model && enemy.model.mixer) {
                enemy.model.mixer.timeScale = 0;
            }
            
            // Set a paused flag on the enemy
            enemy.isPaused = true;
        }
    }
    
    /**
     * Resume all enemies in the game
     * Restarts animations and movement
     */
    resume() {
        console.debug(`Resuming ${this.enemies.size} enemies`);
        
        for (const [id, enemy] of this.enemies.entries()) {
            // Resume animation mixer if it exists
            if (enemy.model && enemy.model.mixer) {
                enemy.model.mixer.timeScale = 1;
            }
            
            // Clear the paused flag
            enemy.isPaused = false;
        }
    }
    
    async init() {
        // Spawn initial enemies
        for (let i = 0; i < this.maxEnemies / 2; i++) {
            this.spawnEnemy();
        }
        
        return true;
    }
    
    update(delta) {
        // Check if game is paused - if so, don't update enemies
        if (this.game && this.game.isPaused) {
            return; // Skip all enemy updates when game is paused
        }
        
        // In multiplayer mode, only the host should spawn enemies
        if (!this.isMultiplayer || (this.isMultiplayer && this.isHost)) {
            // Update regular enemy spawn timer
            this.spawnTimer += delta;
            
            // Spawn new enemies if needed
            if (this.spawnTimer >= this.spawnInterval && this.enemies.size < this.maxEnemies) {
                this.spawnEnemy();
                this.spawnTimer = 0;
            }
            
            // Update boss spawn timer
            this.bossSpawnTimer += delta;
            
            // Check if it's time to potentially spawn a boss
            if (this.bossSpawnTimer >= this.bossSpawnInterval) {
                // Reset timer regardless of whether a boss is spawned
                this.bossSpawnTimer = 0;
                
                // Random chance to spawn a boss
                if (Math.random() < this.bossSpawnChance) {
                    console.log('Spawning random boss...');
                    this.spawnRandomBoss();
                    
                    // Play boss theme if available
                    if (this.game && this.game.audioManager) {
                        this.game.audioManager.playMusic('bossTheme');
                    }
                }
            }
        }
        
        // Track if any bosses are alive
        let bossAlive = false;
        
        // Update enemies
        for (const [id, enemy] of this.enemies.entries()) {
            // Update enemy
            enemy.update(delta);
            
            // Check if this is a boss and it's alive
            if (enemy.isBoss && !enemy.isDead()) {
                bossAlive = true;
            }
            
            // Remove dead enemies
            if (enemy.isDead()) {
                // In multiplayer mode, only the host should handle quest updates and drops
                if (!this.isMultiplayer || (this.isMultiplayer && this.isHost)) {
                    // Check for quest updates
                    if (this.game && this.game.questManager) {
                        this.game.questManager.updateEnemyKill(enemy);
                    }
                    
                    // Check for item drops
                    this.handleEnemyDrop(enemy);
                }
                
                // Check if death animation is still in progress
                if (!enemy.deathAnimationInProgress) {
                    // Remove enemy only after death animation is complete
                    enemy.remove();
                    this.enemies.delete(id);
                    
                    // Clean up processed drops entry for this enemy
                    this.processedDrops.delete(id);
                }
            }
        }
        
        // Check if boss theme should be stopped (all bosses are dead)
        if (!bossAlive && this.game && this.game.audioManager && 
            this.game.audioManager.getCurrentMusic() === 'bossTheme') {
            // Stop boss theme and return to main theme
            this.game.audioManager.playMusic('mainTheme');
        }
        
        // Periodically clean up distant enemies (approximately every 10 seconds)
        // This ensures enemies are cleaned up even if the player moves slowly
        if (Math.random() < 0.01) { // ~1% chance per frame, assuming 60fps = ~once per 10 seconds
            this.cleanupDistantEnemies();
            
            // Also clean up any stale entries in the processedDrops map
            // (enemies that might have been removed without proper cleanup)
            this.cleanupProcessedDrops();
        }
    }
    
    spawnEnemy(specificType = null, position = null, enemyId = null) {
        let enemyType;
        
        if (specificType) {
            // Use specified enemy type
            enemyType = this.enemyTypes.find(type => type.type === specificType) || 
                        this.bossTypes.find(type => type.type === specificType);
            
            if (!enemyType) {
                console.warn(`Enemy type ${specificType} not found, using random type`);
                enemyType = this.getRandomEnemyType();
            }
        } else {
            // Get random enemy type based on current zone
            enemyType = this.getRandomEnemyType();
        }
        
        // Apply difficulty scaling
        const scaledEnemyType = this.applyDifficultyScaling(enemyType);
        
        // Get position
        const spawnPosition = position || this.getRandomSpawnPosition();
        
        // Create enemy
        const enemy = new Enemy(this.scene, this.player, scaledEnemyType);
        
        // Set world reference for terrain height
        if (this.game && this.game.world) {
            enemy.world = this.game.world;
            
            // Adjust initial position to be on terrain
            if (spawnPosition) {
                const terrainHeight = this.game.world.getTerrainHeight(spawnPosition.x, spawnPosition.z);
                spawnPosition.y = terrainHeight + enemy.heightOffset;
            }
        }
        
        enemy.init();
        enemy.setPosition(spawnPosition.x, spawnPosition.y, spawnPosition.z);
        
        // Assign enemy ID (for multiplayer)
        const id = enemyId || `enemy_${this.nextEnemyId++}`;
        enemy.id = id;
        
        // Add to enemies map
        this.enemies.set(id, enemy);
        
        return enemy;
    }
    
    /**
     * Get serializable enemy data for network transmission
     * Optimized to reduce bandwidth usage
     * @returns {Object} Object containing serialized enemy data
     */
    getSerializableEnemyData() {
        const enemyData = {};
        
        this.enemies.forEach((enemy, id) => {
            const position = enemy.getPosition();
            
            // Skip enemies with invalid positions
            if (isNaN(position.x) || isNaN(position.y) || isNaN(position.z)) {
                return;
            }
            
            // Only get y rotation (yaw) to save bandwidth
            const yRotation = enemy.mesh ? enemy.mesh.rotation.y : 0;
            
            // Create minimal enemy data object
            enemyData[id] = {
                id: id,
                p: { // Shortened property name to save bandwidth
                    x: Math.round(position.x * 100) / 100, // Round to 2 decimal places to save bandwidth
                    y: Math.round(position.y * 100) / 100,
                    z: Math.round(position.z * 100) / 100
                },
                r: Math.round(yRotation * 100) / 100, // Only send y rotation as a number
                h: enemy.health, // Shortened property name
                t: enemy.type, // Shortened property name
                s: typeof enemy.state === 'string' ? enemy.state : 
                   (enemy.state && enemy.state.isAttacking ? 'attacking' : 
                    enemy.state && enemy.state.isMoving ? 'moving' : 'idle'),
                b: enemy.isBoss || false // Shortened property name
            };
            
            // Only include maxHealth for new enemies or when health changes
            if (enemy.health === enemy.maxHealth) {
                enemyData[id].mh = enemy.maxHealth; // Include maxHealth when it's needed
            }
        });
        
        return enemyData;
    }
    
    /**
     * Update enemies from host data (member only)
     * @param {Object} enemiesData - Enemy data received from host
     */
    updateEnemiesFromHost(enemiesData) {
        if (!enemiesData) return;
        
        // Process enemy updates
        Object.values(enemiesData).forEach(enemyData => {
            const id = enemyData.id;
            
            // Handle optimized property names
            const position = enemyData.p || enemyData.position;
            const health = enemyData.h !== undefined ? enemyData.h : enemyData.health;
            const maxHealth = enemyData.mh !== undefined ? enemyData.mh : enemyData.maxHealth;
            const type = enemyData.t || enemyData.type;
            const state = enemyData.s || enemyData.state;
            const isBoss = enemyData.b !== undefined ? enemyData.b : enemyData.isBoss;
            
            // Skip if we don't have valid position data
            if (!position || isNaN(position.x) || isNaN(position.y) || isNaN(position.z)) {
                return;
            }
            
            // Check if enemy exists
            if (this.enemies.has(id)) {
                // Update existing enemy
                const enemy = this.enemies.get(id);
                
                // Update position
                enemy.setPosition(position.x, position.y, position.z);
                
                // Update rotation - handle both full rotation object and optimized y-only rotation
                if (enemy.mesh) {
                    if (enemyData.r !== undefined) {
                        // Optimized format - just y rotation
                        enemy.mesh.rotation.y = enemyData.r;
                    } else if (enemyData.rotation) {
                        // Full rotation object
                        enemy.mesh.rotation.set(
                            enemyData.rotation.x,
                            enemyData.rotation.y,
                            enemyData.rotation.z
                        );
                    }
                }
                
                // Update health
                if (health !== undefined) {
                    enemy.health = health;
                    
                    // Update maxHealth if provided
                    if (maxHealth !== undefined) {
                        enemy.maxHealth = maxHealth;
                    }
                    
                    enemy.updateHealthBar();
                }
                
                // Update state
                if (state && enemy.state !== state) {
                    // Handle string state or object state
                    if (typeof enemy.state === 'string') {
                        enemy.state = state;
                    } else {
                        // Convert string state to object state
                        enemy.state.isAttacking = state === 'attacking';
                        enemy.state.isMoving = state === 'moving';
                    }
                    
                    // Update animation based on state
                    if (state === 'attacking' || (typeof enemy.state !== 'string' && enemy.state.isAttacking)) {
                        enemy.playAttackAnimation();
                    } else if (state === 'idle') {
                        enemy.playIdleAnimation();
                    } else if (state === 'moving' || (typeof enemy.state !== 'string' && enemy.state.isMoving)) {
                        enemy.playWalkAnimation();
                    }
                }
            } else {
                // Create new enemy with the optimized data
                const fullEnemyData = {
                    id: id,
                    position: position,
                    health: health,
                    maxHealth: maxHealth || health, // Use health as maxHealth if not provided
                    type: type,
                    state: state,
                    isBoss: isBoss
                };
                this.createEnemyFromData(fullEnemyData);
            }
        });
        
        // Remove enemies that no longer exist in the host data
        const hostEnemyIds = new Set(Object.keys(enemiesData));
        
        for (const [id, enemy] of this.enemies.entries()) {
            if (!hostEnemyIds.has(id)) {
                enemy.remove();
                this.enemies.delete(id);
            }
        }
    }
    
    /**
     * Create enemy from network data
     * @param {Object} enemyData - Enemy data received from host
     * @returns {Enemy} The created enemy
     */
    createEnemyFromData(enemyData) {
        // Handle optimized property names
        const position = enemyData.p || enemyData.position;
        const health = enemyData.h !== undefined ? enemyData.h : enemyData.health;
        const maxHealth = enemyData.mh !== undefined ? enemyData.mh : enemyData.maxHealth;
        const type = enemyData.t || enemyData.type;
        const state = enemyData.s || enemyData.state;
        const isBoss = enemyData.b !== undefined ? enemyData.b : enemyData.isBoss;
        
        // Find enemy type
        let enemyType = this.enemyTypes.find(t => t.type === type);
        
        // If not found, use a default type
        if (!enemyType) {
            console.warn(`Enemy type ${type} not found, using default`);
            enemyType = this.enemyTypes[0];
        }
        
        // Validate position data
        if (!position || isNaN(position.x) || isNaN(position.y) || isNaN(position.z)) {
            console.warn(`Invalid position data for enemy ${enemyData.id}, using default position`);
            position = { x: 0, y: 0, z: 0 };
        }
        
        // Create position vector
        const positionVector = new THREE.Vector3(
            position.x,
            position.y,
            position.z
        );
        
        // Spawn enemy with the specified ID
        const enemy = this.spawnEnemy(enemyType.type, positionVector, enemyData.id);
        
        // Update enemy properties
        if (health !== undefined) {
            enemy.health = health;
        }
        
        if (maxHealth !== undefined) {
            enemy.maxHealth = maxHealth;
        } else if (health !== undefined) {
            enemy.maxHealth = health; // Use health as maxHealth if not provided
        }
        
        // Handle state (string or object)
        if (state) {
            if (typeof enemy.state === 'string') {
                enemy.state = state;
            } else {
                // Convert string state to object state
                enemy.state.isAttacking = state === 'attacking';
                enemy.state.isMoving = state === 'moving';
                enemy.state.isDead = false;
            }
        }
        
        if (isBoss !== undefined) {
            enemy.isBoss = isBoss;
        }
        
        // Update health bar
        enemy.updateHealthBar();
        
        // Set rotation if provided
        if (enemyData.r !== undefined && enemy.mesh) {
            enemy.mesh.rotation.y = enemyData.r;
        } else if (enemyData.rotation && enemy.mesh) {
            enemy.mesh.rotation.set(
                enemyData.rotation.x || 0,
                enemyData.rotation.y || 0,
                enemyData.rotation.z || 0
            );
        }
        
        return enemy;
    }
    
    /**
     * Set multiplayer mode
     * @param {boolean} isMultiplayer - Whether multiplayer is enabled
     * @param {boolean} isHost - Whether this client is the host
     */
    setMultiplayerMode(isMultiplayer, isHost) {
        this.isMultiplayer = isMultiplayer;
        this.isHost = isHost;
        
        console.debug(`EnemyManager: Multiplayer mode ${isMultiplayer ? 'enabled' : 'disabled'}, isHost: ${isHost}`);
    }
    
    /**
     * Enable local enemy spawning
     * Used when transitioning from multiplayer (member) to local mode
     * For example, when the host disconnects
     */
    enableLocalSpawning() {
        console.debug('EnemyManager: Enabling local enemy spawning');
        
        // Set multiplayer mode to false to enable local spawning
        this.isMultiplayer = false;
        this.isHost = false;
        
        // Reset spawn timer to start spawning immediately
        this.spawnTimer = this.spawnInterval;
        
        // Clear the enemies map (actual removal is handled by removeAllEnemies)
        this.enemies.clear();
        
        // Reset any other multiplayer-specific state
        this.nextEnemyId = 1;
        
        console.debug('EnemyManager: Local enemy spawning enabled');
    }

    setDifficulty(difficulty) {
        if (DIFFICULTY_SCALING.difficultyLevels[difficulty]) {
            this.currentDifficulty = difficulty;
            console.debug(`Difficulty set to ${DIFFICULTY_SCALING.difficultyLevels[difficulty].name}`);
        } else {
            console.warn(`Unknown difficulty: ${difficulty}, defaulting to basic`);
            this.currentDifficulty = 'basic';
        }
    }

    getDifficultySettings() {
        return DIFFICULTY_SCALING.difficultyLevels[this.currentDifficulty];
    }

    // Removed duplicate spawnEnemy method that was causing conflicts

    applyDifficultyScaling(enemy, difficultySettings) {
        // Scale health
        enemy.maxHealth *= difficultySettings.healthMultiplier;
        enemy.health = enemy.maxHealth;
        
        // Scale damage
        enemy.damage *= difficultySettings.damageMultiplier;
        
        // Scale boss stats further if this is a boss
        if (enemy.isBoss) {
            enemy.maxHealth *= difficultySettings.bossHealthMultiplier;
            enemy.health = enemy.maxHealth;
            enemy.damage *= difficultySettings.bossDamageMultiplier;
        }
        
        // Scale experience and item drops
        enemy.experienceValue *= difficultySettings.experienceMultiplier;
        enemy.itemDropChance *= difficultySettings.itemDropRateMultiplier;
        enemy.itemQualityBonus = (enemy.itemQualityBonus || 0) + 
            (difficultySettings.itemQualityMultiplier - 1) * 100;
    }

    assignRandomAffixes(enemy, count) {
        // Copy available affixes
        const availableAffixes = [...ENEMY_AFFIXES];
        
        // Assign random affixes
        enemy.affixes = [];
        
        for (let i = 0; i < count && availableAffixes.length > 0; i++) {
            // Select random affix
            const index = Math.floor(Math.random() * availableAffixes.length);
            const affix = availableAffixes[index];
            
            // Remove from available affixes
            availableAffixes.splice(index, 1);
            
            // Add to enemy
            enemy.affixes.push(affix);
            
            // Apply affix effects
            this.applyAffixToEnemy(enemy, affix);
        }
        
        // Update enemy name to reflect affixes
        if (enemy.affixes.length > 0) {
            const affixNames = enemy.affixes.map(affix => affix.name);
            enemy.name = `${affixNames.join(' ')} ${enemy.name}`;
        }
    }

    applyAffixToEnemy(enemy, affix) {
        // Add visual effect
        if (affix.visualEffect) {
            enemy.addVisualEffect(affix.visualEffect);
        }
        
        // Add abilities
        if (affix.abilities) {
            affix.abilities.forEach(ability => {
                enemy.addAbility(ability);
            });
        }
        
        // Apply passive effects
        if (affix.id === 'fast') {
            enemy.moveSpeed *= 1.5;
            enemy.attackSpeed *= 1.3;
        }
    }
    getRandomEnemyType() {
        // Get a random zone instead of using player's current zone
        const availableZones = Object.keys(this.zoneEnemies);
        const randomZone = availableZones[Math.floor(Math.random() * availableZones.length)];
        
        // Get enemy types for this random zone
        const zoneEnemyTypes = this.zoneEnemies[randomZone];
        
        // Select a random enemy type from the zone
        const randomTypeId = zoneEnemyTypes[Math.floor(Math.random() * zoneEnemyTypes.length)];
        
        // Find the enemy type object
        return this.enemyTypes.find(type => type.type === randomTypeId) || this.enemyTypes[0];
    }
    
    /**
     * Get a random boss type from the available boss types
     * @param {string} [zone=null] - Optional zone to get a boss from
     * @returns {Object} A random boss type configuration
     */
    getRandomBossType(zone = null) {
        // If no boss types are available, return null
        if (!this.bossTypes || this.bossTypes.length === 0) {
            console.warn('No boss types available');
            return null;
        }
        
        // If we have zone bosses configuration and a zone is specified or we can get a random zone
        if (this.zoneBosses) {
            let bossZone = zone;
            
            // If no zone specified, get a random zone that has bosses
            if (!bossZone) {
                const availableZones = Object.keys(this.zoneBosses);
                if (availableZones.length > 0) {
                    bossZone = availableZones[Math.floor(Math.random() * availableZones.length)];
                }
            }
            
            // If we have a valid zone with bosses, select a random boss from that zone
            if (bossZone && this.zoneBosses[bossZone] && this.zoneBosses[bossZone].length > 0) {
                const zoneBossTypes = this.zoneBosses[bossZone];
                const randomBossTypeId = zoneBossTypes[Math.floor(Math.random() * zoneBossTypes.length)];
                
                // Find the boss type object
                const bossType = this.bossTypes.find(type => type.type === randomBossTypeId);
                if (bossType) {
                    return bossType;
                }
            }
        }
        
        // Fallback to random selection from all boss types
        const randomIndex = Math.floor(Math.random() * this.bossTypes.length);
        return this.bossTypes[randomIndex];
    }
    
    applyDifficultyScaling(enemyType) {
        // Create a copy of the enemy type to modify
        const scaledType = { ...enemyType };
        
        // Get player level for scaling
        let playerLevel = 1;
        if (this.game && this.game.player) {
            playerLevel = this.game.player.getLevel();
        }
        
        // Get random zone for zone-based difficulty
        let zoneDifficultyMultiplier = 1.0;
        
        // Get a random zone from available zones
        const availableZones = Object.keys(this.zoneDifficultyMultipliers);
        const randomZone = availableZones[Math.floor(Math.random() * availableZones.length)];
        
        // Get zone difficulty multiplier
        zoneDifficultyMultiplier = this.zoneDifficultyMultipliers[randomZone] || 1.0;
        
        // Use game-balance settings for level scaling
        const levelScalingFactor = 1.0 + (playerLevel * COMBAT_BALANCE.enemy.levelScalingFactor);
        
        // Apply difficulty settings from game-balance
        let difficultySettings = DIFFICULTY_SCALING.difficultyLevels[this.currentDifficulty] || 
                                DIFFICULTY_SCALING.difficultyLevels.medium;
        
        // Calculate combined scaling factor
        const combinedScalingFactor = this.difficultyMultiplier * 
                                     levelScalingFactor * 
                                     zoneDifficultyMultiplier * 
                                     difficultySettings.healthMultiplier;
        
        // Apply scaling to enemy stats using game-balance settings
        // Apply base health multiplier from combat balance
        scaledType.baseHealth = scaledType.health; // Store original health for reference
        scaledType.health = Math.round(scaledType.health * COMBAT_BALANCE.enemy.healthMultiplier * combinedScalingFactor);
        
        // Apply damage scaling
        scaledType.damage = Math.round(scaledType.damage * 
                           COMBAT_BALANCE.enemy.damageMultiplier * 
                           difficultySettings.damageMultiplier * 
                           levelScalingFactor);
        
        // Apply experience scaling
        scaledType.experienceValue = Math.round(scaledType.experienceValue * 
                                   COMBAT_BALANCE.enemy.experienceMultiplier * 
                                   difficultySettings.experienceMultiplier);
        
        // Apply special multipliers for boss/elite/champion enemies
        if (scaledType.isBoss) {
            scaledType.health = Math.round(scaledType.health * COMBAT_BALANCE.enemy.bossHealthMultiplier);
            scaledType.damage = Math.round(scaledType.damage * COMBAT_BALANCE.enemy.bossDamageMultiplier);
        } else if (scaledType.isElite) {
            scaledType.health = Math.round(scaledType.health * COMBAT_BALANCE.enemy.eliteHealthMultiplier);
            scaledType.damage = Math.round(scaledType.damage * COMBAT_BALANCE.enemy.eliteDamageMultiplier);
        } else if (scaledType.isChampion) {
            scaledType.health = Math.round(scaledType.health * COMBAT_BALANCE.enemy.championHealthMultiplier);
            scaledType.damage = Math.round(scaledType.damage * COMBAT_BALANCE.enemy.championDamageMultiplier);
        }
        
        // Store the original health for reference
        scaledType.baseHealth = enemyType.health;
        
        return scaledType;
    }
    
    findNearestEnemy(position, maxDistance = 15) {
        // Find the nearest enemy within maxDistance
        let nearestEnemy = null;
        let nearestDistance = maxDistance;
        
        for (const [id, enemy] of this.enemies.entries()) {
            // Skip dead enemies
            if (enemy.isDead()) continue;
            
            const enemyPosition = enemy.getPosition();
            const distance = position.distanceTo(enemyPosition);
            
            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestEnemy = enemy;
            }
        }
        
        return nearestEnemy;
    }
    
    handleEnemyDrop(enemy) {
        // Check if we've already processed this enemy's drops
        if (this.processedDrops.has(enemy.id)) {
            return;
        }
        
        // Mark this enemy as processed to prevent duplicate drops
        this.processedDrops.set(enemy.id, true);
        
        // Check if enemy should drop an item
        const dropChance = enemy.isBoss ? DROP_CHANCES.bossDropChance : DROP_CHANCES.normalDropChance;
        
        if (Math.random() < dropChance) {
            // Generate an item using the ItemGenerator
            let item;
            
            if (enemy.isBoss) {
                // Generate a higher quality item for bosses
                const bossLevel = Math.max(1, this.player.stats.getLevel());
                item = this.itemGenerator.generateItem({
                    level: bossLevel,
                    rarity: this.getRandomBossRarity()
                });
            } else {
                // Generate a regular item for normal enemies
                const enemyLevel = Math.max(1, this.player.stats.getLevel() - 1);
                item = this.itemGenerator.generateItem({
                    level: enemyLevel,
                    rarity: this.getRandomEnemyRarity()
                });
            }
            
            // If we have an item drop manager, use it to create a visual drop
            if (this.itemDropManager && item) {
                const enemyPosition = enemy.getPosition();
                this.itemDropManager.dropItem(item, enemyPosition);
            } else if (this.game && this.game.player && item) {
                // Fallback: Add directly to player inventory if no drop manager
                this.game.player.addToInventory(item);
                
                // Show notification
                if (this.game.hudManager) {
                    this.game.hudManager.showNotification(`Found ${item.name}`);
                }
            }
        }
    }
    
    /**
     * Get a random rarity for boss drops
     * Bosses have higher chance for rare+ items
     * @returns {string} The rarity
     */
    getRandomBossRarity() {
        const rand = Math.random();
        
        if (rand < 0.05) return 'mythic';
        if (rand < 0.20) return 'legendary';
        if (rand < 0.40) return 'epic';
        if (rand < 0.70) return 'rare';
        if (rand < 0.90) return 'uncommon';
        return 'common';
    }
    
    /**
     * Get a random rarity for normal enemy drops
     * @returns {string} The rarity
     */
    getRandomEnemyRarity() {
        const rand = Math.random();
        
        if (rand < 0.01) return 'mythic';
        if (rand < 0.05) return 'legendary';
        if (rand < 0.15) return 'epic';
        if (rand < 0.30) return 'rare';
        if (rand < 0.60) return 'uncommon';
        return 'common';
    }
    
    /**
     * Legacy method for backward compatibility
     * @deprecated Use ItemGenerator instead
     */
    generateRegularDrop(enemy) {
        // Use drop table from config
        return this.selectWeightedItem(REGULAR_DROP_TABLE);
    }
    
    /**
     * Legacy method for backward compatibility
     * @deprecated Use ItemGenerator instead
     */
    generateBossDrop(enemy) {
        // Use boss drop table from config
        return this.selectWeightedItem(BOSS_DROP_TABLE);
    }
    
    selectWeightedItem(items) {
        // Calculate total weight
        const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
        
        // Get random value
        let random = Math.random() * totalWeight;
        
        // Find selected item
        for (const item of items) {
            random -= item.weight;
            if (random <= 0) {
                return { ...item };
            }
        }
        
        // Fallback
        return { ...items[0] };
    }
    
    getRandomSpawnPosition() {
        // Get random angle
        const angle = Math.random() * Math.PI * 2;
        
        // Get random distance from center
        const distance = this.spawnRadius * 0.5 + Math.random() * this.spawnRadius * 0.5;
        
        // Calculate position
        const x = Math.cos(angle) * distance;
        const z = Math.sin(angle) * distance;
        
        // Get terrain height at position
        const y = this.player.game.world.getTerrainHeight(x, z);
        
        return new THREE.Vector3(x, y, z);
    }
    
    getEnemiesNearPosition(position, radius) {
        const nearbyEnemies = [];
        
        for (const [id, enemy] of this.enemies.entries()) {
            const distance = position.distanceTo(enemy.getPosition());
            if (distance <= radius) {
                nearbyEnemies.push(enemy);
            }
        }
        
        return nearbyEnemies;
    }
    
    spawnBoss(bossType, position) {
        // Find the boss type
        const bossConfig = this.bossTypes.find(type => type.type === bossType);
        
        if (!bossConfig) {
            console.warn(`Boss type ${bossType} not found`);
            return null;
        }
        
        // Apply difficulty scaling
        const scaledBossConfig = this.applyDifficultyScaling(bossConfig);
        
        // Create boss
        const boss = new Enemy(this.scene, this.player, scaledBossConfig);
        boss.init();
        
        // Position boss
        if (position) {
            boss.setPosition(position.x, position.y + 1, position.z); // Raise slightly above ground
        } else {
            // Use player position as reference
            const playerPos = this.player.getPosition();
            boss.setPosition(playerPos.x, playerPos.y + 1, playerPos.z + 5); // 5 units in front of player
        }
        
        // Add to enemies map
        const id = `boss_${this.nextEnemyId++}`;
        boss.id = id;
        this.enemies.set(id, boss);
        
        // Play boss spawn effect
        if (this.game && this.game.audioManager) {
            this.game.audioManager.playSound('bossSpawn');
        }
        
        // Show notification
        if (this.game && this.game.hudManager) {
            this.game.hudManager.showNotification(`${bossConfig.name} has appeared!`, 5);
        }
        
        return boss;
    }
    
    /**
     * Spawn a random boss at a random position
     * @param {THREE.Vector3} [position=null] - Optional specific position to spawn the boss
     * @param {string} [zone=null] - Optional zone to spawn a boss from
     * @returns {Enemy} The spawned boss instance
     */
    spawnRandomBoss(position = null, zone = null) {
        // Try to get the current zone if not specified
        let currentZone = zone;
        if (!currentZone && position && this.game && this.game.world) {
            currentZone = this.game.world.getZoneAt(position)?.name?.toLowerCase()?.replace(' ', '_');
        }
        
        // Get a random boss type for the current zone
        const randomBossType = this.getRandomBossType(currentZone);
        
        if (!randomBossType) {
            console.warn('No boss types available for random spawning');
            return null;
        }
        
        // Get spawn position if not provided
        let spawnPosition = position;
        if (!spawnPosition) {
            spawnPosition = this.getRandomSpawnPosition();
            
            // Adjust height if world is available
            if (this.game && this.game.world) {
                const terrainHeight = this.game.world.getTerrainHeight(spawnPosition.x, spawnPosition.z);
                spawnPosition.y = terrainHeight + 1; // Add offset for boss height
            }
        }
        
        // Spawn the boss using the existing spawnBoss method
        return this.spawnBoss(randomBossType.type, spawnPosition);
    }
    
    getClosestEnemy(position, maxDistance = Infinity) {
        let closestEnemy = null;
        let closestDistance = maxDistance;
        
        this.enemies.forEach(enemy => {
            const distance = position.distanceTo(enemy.getPosition());
            if (distance < closestDistance) {
                closestEnemy = enemy;
                closestDistance = distance;
            }
        });
        
        return closestEnemy;
    }
    
    removeAllEnemies() {
        // Remove all enemies
        this.enemies.forEach(enemy => {
            enemy.remove();
        });
        
        // Clear the Map instead of redefining it as an array
        this.enemies.clear();
    }
    
    onPlayerMovedScreenDistance(playerPosition) {
        // Clean up enemies that are too far from the player
        this.cleanupDistantEnemies();
        
        // Spawn new enemies around the player's current position
        this.spawnEnemiesAroundPlayer(playerPosition);
    }
    
    cleanupDistantEnemies() {
        const playerPos = this.player.getPosition();
        
        // Increased distances to keep enemies around longer
        const maxDistance = 80; // Maximum distance to keep enemies (in world units)
        const bossMaxDistance = 120; // Maximum distance to keep bosses (larger than regular enemies)
        
        // Check if we're in a multiplier zone (higher enemy density)
        let inMultiplierZone = false;
        let multiplierValue = 1;
        
        if (this.game && this.game.teleportManager) {
            inMultiplierZone = this.game.teleportManager.activeMultiplier > 1;
            multiplierValue = this.game.teleportManager.activeMultiplier;
        }
        
        // In multiplier zones, keep enemies around longer
        const zoneDistanceMultiplier = inMultiplierZone ? 1.5 : 1.0;
        const adjustedMaxDistance = maxDistance * zoneDistanceMultiplier;
        const adjustedBossMaxDistance = bossMaxDistance * zoneDistanceMultiplier;
        
        let removedCount = 0;
        
        // Remove enemies that are too far away
        const enemiesToRemove = [];
        
        for (const [id, enemy] of this.enemies.entries()) {
            const position = enemy.getPosition();
            
            // Calculate distance to player
            const distance = position.distanceTo(playerPos);
            
            // Different distance thresholds for bosses and regular enemies
            const distanceThreshold = enemy.isBoss ? adjustedBossMaxDistance : adjustedMaxDistance;
            
            // If enemy is too far away, mark it for removal
            if (distance > distanceThreshold) {
                // In multiplier zones, don't remove all enemies at once - stagger removal
                // This creates a more gradual transition as player moves
                if (inMultiplierZone && Math.random() > 0.3) {
                    // Skip removal for 70% of enemies in multiplier zones
                    continue;
                }
                
                enemiesToRemove.push(id);
            }
        }
        
        // Remove marked enemies
        for (const id of enemiesToRemove) {
            const enemy = this.enemies.get(id);
            if (enemy) {
                enemy.remove();
                this.enemies.delete(id);
                // Also clean up processed drops entry for this enemy
                this.processedDrops.delete(id);
                removedCount++;
            }
        }
        
        // Log cleanup information if enemies were removed
        if (removedCount > 0) {
            console.debug(`Cleaned up ${removedCount} distant enemies. Remaining: ${this.enemies.size}`);
            
            // Force garbage collection hint if significant cleanup occurred
            if (removedCount > 5 && this.game && this.game.world) {
                this.game.world.hintGarbageCollection();
            }
        }
    }
    
    spawnEnemiesAroundPlayer(playerPosition) {
        // Check if we're in a multiplier zone (higher enemy density)
        let inMultiplierZone = false;
        let multiplierValue = 1;
        
        if (this.game && this.game.teleportManager) {
            inMultiplierZone = this.game.teleportManager.activeMultiplier > 1;
            multiplierValue = this.game.teleportManager.activeMultiplier;
        }
        
        // In multiplier zones, temporarily increase max enemies
        const originalMaxEnemies = this.maxEnemies;
        if (inMultiplierZone) {
            // Scale max enemies based on multiplier, but cap it for performance
            this.maxEnemies = Math.min(200, Math.floor(originalMaxEnemies * Math.sqrt(multiplierValue)));
            console.debug(`In multiplier zone (${multiplierValue}x) - increased max enemies to ${this.maxEnemies}`);
        }
        
        // Skip if we're at max enemies
        if (this.enemies.size >= this.maxEnemies) {
            // Restore original max enemies
            this.maxEnemies = originalMaxEnemies;
            return;
        }
        
        // Determine how many enemies to spawn - scale with multiplier
        let baseEnemyCount = 5 + Math.floor(Math.random() * 5); // 5-9 enemies per screen normally
        
        // In multiplier zones, spawn more enemies per wave
        if (inMultiplierZone) {
            // Scale enemy count based on multiplier, using square root for more reasonable scaling
            baseEnemyCount = Math.floor(baseEnemyCount * Math.sqrt(multiplierValue) * 0.5);
            
            // Ensure we spawn at least some enemies
            baseEnemyCount = Math.max(5, baseEnemyCount);
        }
        
        const enemiesToSpawn = Math.min(
            baseEnemyCount,
            this.maxEnemies - this.enemies.size // Don't exceed max enemies
        );
        
        // Get a random zone instead of using player's current zone
        const availableZones = Object.keys(this.zoneEnemies);
        const randomZone = availableZones[Math.floor(Math.random() * availableZones.length)];
        
        // Get enemy types for this random zone
        const zoneEnemyTypes = this.zoneEnemies[randomZone];
        
        // Spawn enemies in multiple groups - more groups in multiplier zones
        const numGroups = inMultiplierZone ? 
            2 + Math.floor(Math.random() * 3) : // 2-4 groups in multiplier zones
            1 + Math.floor(Math.random() * 2);  // 1-2 groups normally
            
        const enemiesPerGroup = Math.ceil(enemiesToSpawn / numGroups);
        
        // In multiplier zones, spawn enemies in a more surrounding pattern
        const angleStep = inMultiplierZone ? (Math.PI * 2) / numGroups : 0;
        let startAngle = Math.random() * Math.PI * 2;
        
        for (let g = 0; g < numGroups; g++) {
            // Select a random enemy type from the zone for this group
            const groupEnemyType = zoneEnemyTypes[Math.floor(Math.random() * zoneEnemyTypes.length)];
            
            // Determine group position
            let groupAngle;
            
            if (inMultiplierZone) {
                // In multiplier zones, distribute groups more evenly around the player
                // This creates a surrounding effect that's harder to escape
                groupAngle = startAngle + (angleStep * g);
            } else {
                // Normal random angle
                groupAngle = Math.random() * Math.PI * 2;
            }
            
            // Adjust distance based on multiplier - closer in multiplier zones
            const groupDistance = inMultiplierZone ?
                20 + Math.random() * 10 : // Closer in multiplier zones (20-30 units)
                25 + Math.random() * 10;  // Normal distance (25-35 units)
                
            const groupX = playerPosition.x + Math.cos(groupAngle) * groupDistance;
            const groupZ = playerPosition.z + Math.sin(groupAngle) * groupDistance;
            
            // Spawn the group of enemies
            for (let i = 0; i < enemiesPerGroup; i++) {
                // Skip if we've reached max enemies
                if (this.enemies.size >= this.maxEnemies) {
                    break;
                }
                
                // Calculate position within group (random spread)
                // Tighter groups in multiplier zones
                const spreadRadius = inMultiplierZone ?
                    3 + Math.random() * 4 : // Tighter groups in multiplier zones
                    5 + Math.random() * 5;  // Normal spread
                    
                const angle = Math.random() * Math.PI * 2;
                const distance = Math.random() * spreadRadius;
                const x = groupX + Math.cos(angle) * distance;
                const z = groupZ + Math.sin(angle) * distance;
                
                // Get terrain height at position
                const y = this.game.world.getTerrainHeight(x, z);
                
                // Spawn enemy
                const position = new THREE.Vector3(x, y, z);
                this.spawnEnemy(groupEnemyType, position);
            }
        }
        
        // Restore original max enemies
        this.maxEnemies = originalMaxEnemies;
        
        // In multiplier zones, schedule another wave of enemies after a delay
        // This creates continuous waves that will overwhelm the player if they don't defeat enemies quickly
        if (inMultiplierZone) {
            const waveDelay = 5000 + Math.random() * 5000; // 5-10 seconds between waves
            
            setTimeout(() => {
                // Only spawn if still in multiplier zone
                if (this.game && 
                    this.game.teleportManager && 
                    this.game.teleportManager.activeMultiplier > 1) {
                    
                    console.debug(`Spawning additional wave of enemies in multiplier zone`);
                    this.spawnEnemiesAroundPlayer(this.player.getPosition());
                }
            }, waveDelay);
        }
    }
    
    /**
     * Clean up stale entries in the processedDrops map
     * This prevents memory leaks from enemies that might have been removed without proper cleanup
     */
    cleanupProcessedDrops() {
        // Check each entry in processedDrops
        for (const [id, processed] of this.processedDrops.entries()) {
            // If this enemy no longer exists in the enemies map, remove the entry
            if (!this.enemies.has(id)) {
                this.processedDrops.delete(id);
            }
        }
    }
}