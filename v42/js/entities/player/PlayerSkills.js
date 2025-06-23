import * as THREE from 'three';
import { Skill } from '../skills/Skill.js';
import { SkillEffectFactory } from '../skills/SkillEffectFactory.js';
import { SKILLS, BATTLE_SKILLS } from '../../config/skills.js';
import { STORAGE_KEYS } from '../../config/storage-keys.js';

/**
 * @typedef {Object} SkillTreeEntry
 * @property {string} [activeVariant] - The active variant of the skill
 * @property {Object.<string, number>} [buffs] - Buffs applied to the skill
 */

/**
 * @typedef {Object} SkillTreeData
 * @property {SkillTreeEntry} [skillName] - Skill tree data for a specific skill
 */

/**
 * Class responsible for managing all player skills and abilities
 * 
 * @property {import("three").Scene} scene - The Three.js scene where skill effects will be added
 * @property {import("../player/PlayerStats.js")} playerStats - Reference to the player's stats for mana management
 * @property {import("three").Vector3} playerPosition - Reference to the player's position vector
 * @property {Object} playerRotation - Reference to the player's rotation object
 * @property {Array<import("../skills/Skill.js").Skill>} skills - Array of available skill templates
 * @property {Array<import("../skills/Skill.js").Skill>} activeSkills - Array of currently active skill instances
 * @property {import("../../game/Game.js").Game} game - Reference to the main game instance
 * @property {boolean} customSkillsEnabled - Flag indicating whether custom skills are enabled
 * @property {SkillTreeData} [skillTreeData] - Data from the skill tree, containing variants and buffs
 */
export class PlayerSkills {
    /**
     * Creates a new PlayerSkills instance
     * @param {import("three").Scene} scene - The Three.js scene where skill effects will be added
     * @param {import("../player/PlayerStats.js")} playerStats - Reference to the player's stats for mana management
     * @param {import("three").Vector3} playerPosition - Reference to the player's position vector
     * @param {Object} playerRotation - Reference to the player's rotation object
     */
    /**
     * Creates a new PlayerSkills instance
     * @param {import("three").Scene} scene - The Three.js scene where skill effects will be added
     * @param {import("../player/PlayerStats.js")} playerStats - Reference to the player's stats for mana management
     * @param {import("three").Vector3} playerPosition - Reference to the player's position vector
     * @param {Object} playerRotation - Reference to the player's rotation object
     * @param {import("../../game/Game.js").Game} [game=null] - Reference to the main game instance
     */
    constructor(scene, playerStats, playerPosition, playerRotation, game = null) {
        this.scene = scene;
        this.playerStats = playerStats;
        this.playerPosition = playerPosition;
        this.playerRotation = playerRotation;
        
        // Initialize skills array
        this.skills = [];
        this.activeSkills = [];
        
        // Game reference
        this.game = game;
        
        // Custom skills flag
        this.customSkillsEnabled = localStorage.getItem(STORAGE_KEYS.CUSTOM_SKILLS) === 'true';
    }
    
    // setGame method removed - game is now passed in constructor
    
    /**
     * Updates custom skills visibility based on the flag in localStorage
     * Reloads skills and updates UI components accordingly
     * @returns {void}
     */
    updateCustomSkillsVisibility() {
        // Update the flag
        this.customSkillsEnabled = localStorage.getItem(STORAGE_KEYS.CUSTOM_SKILLS) === 'true';
        console.debug(`Custom skills ${this.customSkillsEnabled ? 'enabled' : 'disabled'}`);
        
        // Reload skills to apply the filter
        this.initializeSkills();
        
        // Notify UI components to update
        if (this.game && this.game.ui) {
            // Update skill UI if available
            if (this.game.ui.skillsUI) {
                this.game.ui.skillsUI.updateSkillButtons();
            }
            
            // Update skill tree UI if available
            if (this.game.ui.skillTreeUI) {
                this.game.ui.skillTreeUI.refreshSkillTree();
            }
        }
    }
    
    /**
     * Filters skills based on the custom skills flag
     * @param {Array<Object>} skills - Array of skill configurations
     * @returns {Array<Object>} - Filtered array of skill configurations
     */
    filterCustomSkills(skills) {
        if (this.customSkillsEnabled) {
            // Include all skills
            return skills;
        } else {
            // Filter out custom skills
            return skills.filter(skill => !skill.isCustomSkill);
        }
    }
    
    /**
     * Loads skill tree data from localStorage
     * This method is called when the skill tree is saved or when skills are initialized
     * @returns {boolean} - True if skill tree data was successfully loaded, false otherwise
     */
    loadSkillTreeData() {
        try {
            const skillTreeDataJson = localStorage.getItem(STORAGE_KEYS.SKILL_TREE_DATA);
            
            if (skillTreeDataJson) {
                const skillTreeData = JSON.parse(skillTreeDataJson);
                console.debug('Loaded skill tree data from localStorage:', skillTreeData);
                
                // Apply skill variants and buffs to the player's skills
                // This will be used when creating skill instances
                this.skillTreeData = skillTreeData;
                
                // Update existing skills with the new variants and buffs
                this.updateSkillsWithVariants();
                
                return true;
            } else {
                console.debug('No skill tree data found in localStorage');
                return false;
            }
        } catch (error) {
            console.error('Error loading skill tree data from localStorage:', error);
            return false;
        }
    }
    
    /**
     * Updates existing skills with variants and buffs from skill tree data
     * Applies selected variants and buffs to each skill in the player's skill array
     * @returns {void}
     */
    updateSkillsWithVariants() {
        if (!this.skillTreeData) return;
        
        // For each skill in the player's skills array
        this.skills.forEach(skill => {
            const skillName = skill.name;
            const skillTreeEntry = this.skillTreeData[skillName];
            
            // If this skill has data in the skill tree
            if (skillTreeEntry) {
                // Apply variant if one is selected
                if (skillTreeEntry.activeVariant) {
                    console.debug(`Applying variant ${skillTreeEntry.activeVariant} to skill ${skillName}`);
                    skill.variant = skillTreeEntry.activeVariant;
                }
                
                // Apply buffs if any are selected
                if (skillTreeEntry.buffs && Object.keys(skillTreeEntry.buffs).length > 0) {
                    console.debug(`Applying buffs to skill ${skillName}:`, skillTreeEntry.buffs);
                    skill.buffs = skillTreeEntry.buffs;
                }
            }
        });
        
        console.debug('Updated skills with variants and buffs from skill tree data');
    }
    
    /**
     * Initializes player skills from localStorage or defaults to battle skills
     * Handles both old and new skill storage formats
     * @returns {void}
     */
    initializeSkills() {
        // Initialize monk skills using the configuration from config/skills.js
        const savedSkillsJson = localStorage.getItem(STORAGE_KEYS.SELECTED_SKILLS);
        
        if (savedSkillsJson) {
            const savedSkills = JSON.parse(savedSkillsJson);
            
            // Check if we're using the new format (array of skill IDs)
            if (savedSkills.length > 0 && 'id' in savedSkills[0]) {
                // New format - load skills from IDs
                this.loadSkillsFromIds(savedSkills);
            } else {
                // Old format - array of full skill objects
                // Filter out custom skills if disabled
                const filteredSkills = this.filterCustomSkills(savedSkills);
                this.skills = filteredSkills.map(skillConfig => new Skill(skillConfig));
            }
        } else {
            // No saved skills, use default battle skills
            // Filter out custom skills if disabled
            const filteredSkills = this.filterCustomSkills(BATTLE_SKILLS);
            this.skills = filteredSkills.map(skillConfig => new Skill(skillConfig));
        }
    }
    
    /**
     * Loads skills from an array of skill IDs
     * Creates skill instances with appropriate variants and buffs
     * @param {Array<{id: string, isPrimary: boolean}>} skillIds - Array of skill ID objects
     */
    loadSkillsFromIds(skillIds) {
        // Reset skills array
        this.skills = [];
        
        // Load skill tree data from localStorage if not already loaded
        if (!this.skillTreeData) {
            this.loadSkillTreeData();
        }
        
        // Get all available skills and filter out custom skills if disabled
        const availableSkills = this.filterCustomSkills(SKILLS);
        
        // Process each skill ID
        skillIds.forEach(skillIdObj => {
            const { id } = skillIdObj;
            
            // Find the full skill config based on the ID (name)
            const skillConfig = availableSkills.find(skill => skill.name === id);

            // If skill config is found, create a new skill instance
            if (skillConfig) {
                // Create a deep copy of the skill config to avoid modifying the original
                const skillConfigCopy = JSON.parse(JSON.stringify(skillConfig));
                
                // Apply variant and buffs from skill tree data if available
                if (this.skillTreeData && this.skillTreeData[id]) {
                    const skillTreeEntry = this.skillTreeData[id];
                    
                    // Apply variant if one is selected
                    if (skillTreeEntry.activeVariant) {
                        console.debug(`Applying variant ${skillTreeEntry.activeVariant} to skill ${id} during initialization`);
                        skillConfigCopy.variant = skillTreeEntry.activeVariant;
                    }
                    
                    // Apply buffs if any are selected
                    if (skillTreeEntry.buffs && Object.keys(skillTreeEntry.buffs).length > 0) {
                        console.debug(`Applying buffs to skill ${id} during initialization:`, skillTreeEntry.buffs);
                        skillConfigCopy.buffs = skillTreeEntry.buffs;
                    }
                }
                
                this.skills.push(new Skill(skillConfigCopy));
            } else {
                console.debug(`Skill configuration not found for ID: ${id} (may be a custom skill that is disabled)`);
            }
        });
        
        // If no skills were loaded, use default battle skills
        if (this.skills.length === 0) {
            console.warn('No valid skills found from IDs, using default battle skills');
            const filteredDefaultSkills = this.filterCustomSkills(BATTLE_SKILLS);
            this.skills = filteredDefaultSkills.map(skillConfig => new Skill(skillConfig));
        }
    }
    
    /**
     * Updates all active skills and their cooldowns
     * Handles skill expiration, error recovery, and cleanup
     * @param {number} delta - Time delta since last update in seconds
     * @returns {void}
     */
    updateSkills(delta) {
        // Update active skills
        for (let i = this.activeSkills.length - 1; i >= 0; i--) {
            // Safety check for array bounds
            if (i >= this.activeSkills.length) continue;
            
            const skill = this.activeSkills[i];
            if (!skill) continue;
            
            try {
                // Update skill
                skill.update(delta);
            } catch (error) {
                console.error(`Error updating skill ${skill.name}:`, error);
                // Remove problematic skill
                skill.remove();
                this.activeSkills.splice(i, 1);
                continue;
            }
            
            // Remove expired skills
            if (skill.isExpired()) {
                console.debug(`Removing expired skill ${skill.name}`);
                skill.remove();
                this.activeSkills.splice(i, 1);
                continue;
            }
            
            // We no longer force cleanup for skills that are being spammed
            // This allows multiple instances of the same skill to exist simultaneously
            // Each skill will naturally expire at the end of its duration
        }
        
        // We no longer limit the number of active skills of the same type
        // This allows multiple instances of the same skill to exist simultaneously
        
        // Optional: Log the number of active skills for debugging
        const skillCounts = {};
        this.activeSkills.forEach(skill => {
            if (skill) {
                skillCounts[skill.name] = (skillCounts[skill.name] || 0) + 1;
            }
        });
        
        // Log only if there are multiple instances of any skill
        const multipleInstances = Object.entries(skillCounts).filter(([_, count]) => count > 1);
        if (multipleInstances.length > 0) {
            // console.debug("Multiple skill instances active:", multipleInstances.map(([name, count]) => `${name}: ${count}`).join(", "));
        }
        
        // Perform a final cleanup pass to remove any null or undefined skills
        for (let i = this.activeSkills.length - 1; i >= 0; i--) {
            if (!this.activeSkills[i] || !this.activeSkills[i].isActive) {
                console.debug(`Removing invalid skill at index ${i}`);
                if (this.activeSkills[i]) {
                    this.activeSkills[i].remove();
                }
                this.activeSkills.splice(i, 1);
            }
        }
        
        // Update skill cooldowns
        this.skills.forEach(skill => skill.updateCooldown(delta));
    }
    
    /**
     * Activates a skill by its index in the skills array
     * Handles mana cost, cooldown, targeting, and effect creation
     * @param {number} skillIndex - Index of the skill in the skills array
     * @returns {boolean} - True if skill was successfully used, false otherwise
     */
    useSkill(skillIndex) {
        console.debug('PlayerSkills.useSkill called with index:', skillIndex);
        
        // Check if skill index is valid
        if (skillIndex < 0 || skillIndex >= this.skills.length) {
            console.debug('Invalid skill index:', skillIndex, 'Max index:', this.skills.length - 1);
            return false;
        }
        
        // Get skill template
        const skillTemplate = this.skills[skillIndex];
        console.debug('Using skill:', skillTemplate.name);
        
        // Check if skill is on cooldown
        if (skillTemplate.isOnCooldown()) {
            console.debug('Skill is on cooldown:', skillTemplate.name);
            return false;
        }
        
        // Check if player has enough mana
        if (this.playerStats.getMana() < skillTemplate.manaCost) {
            console.debug('Not enough mana for skill:', skillTemplate.name);
            return false;
        }
        
        // Use mana
        this.playerStats.setMana(this.playerStats.getMana() - skillTemplate.manaCost);
        
        // Start cooldown on the template (shared cooldown)
        skillTemplate.startCooldown();
        
        // We no longer clean up existing instances of this skill
        // This allows multiple instances of the same skill to exist simultaneously
        console.debug(`Creating a new instance of ${skillTemplate.name} while keeping existing instances`);
        
        // Optional: Log how many instances of this skill are currently active
        const activeInstancesCount = this.activeSkills.filter(s => s && s.name === skillTemplate.name).length;
        console.debug(`Currently active instances of ${skillTemplate.name}: ${activeInstancesCount}`);
        
        // Find the nearest enemy for auto-targeting (for all skill types)
        let targetEnemy = null;
        let targetDirection = null;
        
        if (this.game && this.game.enemyManager) {
            // Use skill range for targeting, or a default range if skill has no range
            const targetRange = skillTemplate.range > 0 ? skillTemplate.range : 15;
            targetEnemy = this.game.enemyManager.findNearestEnemy(this.playerPosition, targetRange);
            
            if (targetEnemy) {
                // Get enemy position
                const enemyPosition = targetEnemy.getPosition();
                
                // Calculate direction to enemy
                targetDirection = new THREE.Vector3().subVectors(enemyPosition, this.playerPosition).normalize();
                
                // Update player rotation to face enemy
                this.playerRotation.y = Math.atan2(targetDirection.x, targetDirection.z);
                
                console.debug(`Auto-targeting enemy for skill ${skillTemplate.name}, facing direction: ${this.playerRotation.y}`);
            }
        }
        
        // Broadcast skill cast to other players in multiplayer mode
        this.broadcastSkillCast(skillTemplate.name);
        
        // Create a new instance of the skill using the template from SKILLS config
        // Find the skill configuration by name (ID)
        const skillConfig = SKILLS.find(config => config.name === skillTemplate.name);
        
        // Check if skillConfig exists before creating a new Skill instance
        if (!skillConfig) {
            console.error(`Skill configuration not found for ID: ${skillTemplate.name}`);
            return false;
        }
        
        // Create a deep copy of the skill config to avoid modifying the original
        const skillConfigCopy = JSON.parse(JSON.stringify(skillConfig));
        
        // Apply variant and buffs from skill tree data if available
        if (this.skillTreeData && this.skillTreeData[skillTemplate.name]) {
            const skillTreeEntry = this.skillTreeData[skillTemplate.name];
            
            // Apply variant if one is selected
            if (skillTreeEntry.activeVariant) {
                console.debug(`Applying variant ${skillTreeEntry.activeVariant} to new instance of ${skillTemplate.name}`);
                skillConfigCopy.variant = skillTreeEntry.activeVariant;
            }
            
            // Apply buffs if any are selected
            if (skillTreeEntry.buffs && Object.keys(skillTreeEntry.buffs).length > 0) {
                console.debug(`Applying buffs to new instance of ${skillTemplate.name}:`, skillTreeEntry.buffs);
                skillConfigCopy.buffs = skillTreeEntry.buffs;
            }
        }
        
        const newSkillInstance = new Skill(skillConfigCopy);
        
        // Create a new effect handler for the new skill instance
        newSkillInstance.effectHandler = SkillEffectFactory.createEffect(newSkillInstance);
        
        // Pass game reference to the new skill instance
        newSkillInstance.game = this.game;
        
        // First priority: If there's a target enemy, face that direction (already handled above)
        if (targetEnemy) {
            // Direction already set in the code above
            console.debug("Using enemy direction for skill cast");
            
            // For skills with stationaryAttack flag, we don't move the player
            // This is specifically for ranged skills like "Deadly Reach"
            if (!skillTemplate.stationaryAttack && skillTemplate.name !== "Deadly Reach") {
                console.debug(`Skill ${skillTemplate.name} does not have stationaryAttack flag, player may move`);
            } else {
                console.debug(`Skill ${skillTemplate.name} has stationaryAttack flag or is Deadly Reach, player will not move`);
            }
        } 
        // Second priority: If player is moving, use movement direction
        else if (this.game && this.game.inputHandler) {
            const moveDir = this.game.inputHandler.getMovementDirection();
            
            if (moveDir.length() > 0) {
                // Player is actively moving - use that direction
                this.playerRotation.y = Math.atan2(moveDir.x, moveDir.z);
                console.debug(`Using movement direction for skill: ${moveDir.x.toFixed(2)}, ${moveDir.z.toFixed(2)}`);
            } else {
                // Player is not moving - use current facing direction
                console.debug(`Using current facing direction: ${Math.sin(this.playerRotation.y).toFixed(2)}, ${Math.cos(this.playerRotation.y).toFixed(2)}`);
            }
        }
        
        // Log the final direction that will be used
        console.debug(`Final rotation for skill cast: ${this.playerRotation.y.toFixed(2)} radians`);
        
        // Create the skill effect with the player's position and rotation
        const skillEffect = newSkillInstance.createEffect(this.playerPosition, this.playerRotation);
        
        // Add skill effect to scene
        if (skillEffect) {
            console.debug(`Adding ${skillTemplate.name} effect to scene`);
            this.scene.add(skillEffect);
        } else {
            console.error(`Failed to create effect for ${skillTemplate.name}`);
        }
        
        // Log enemy was auto-targeted (only if an enemy was found)
        if (targetEnemy) {
            console.debug(`Auto-targeting ${targetEnemy.type} with ${skillTemplate.name}`);
        } else {
            console.debug(`Using ${skillTemplate.name} without a target`);
        }

        // Sound is now handled by the skill itself in createEffect method
        // Add to active skills
        this.activeSkills.push(newSkillInstance);
        
        return true;
    }
    
    /**
     * Activates the player's primary attack skill
     * Handles different attack behaviors based on enemy distance
     * Uses teleport for distant enemies and normal attack for close enemies
     * @returns {boolean} - True if primary attack was successfully used, false otherwise
     */
    usePrimaryAttack() {
        // Find the Fist of Thunder skill (should be the last skill in the array)
        // This is the basic attack skill with the "h" key
        const primaryAttackSkill = this.skills.find(skill => skill.primaryAttack === true);
        
        // If no basic attack skill is found, use the first skill as fallback
        const skillTemplate = primaryAttackSkill || this.skills[0];
        
        console.debug('Using basic attack skill:', skillTemplate.name);
        
        // Check if skill is on cooldown
        if (skillTemplate.isOnCooldown()) {
            return false;
        }
        
        // Check if player has enough mana
        if (this.playerStats.getMana() < skillTemplate.manaCost) {
            return false;
        }
        
        // Broadcast skill cast to other players in multiplayer mode
        this.broadcastSkillCast(skillTemplate.name);
        
        // Find the nearest enemy
        if (this.game && this.game.enemyManager) {
            // Define ranges for different attack behaviors
            const meleeRange = 3.0; // Increased close range for punch to make it more reliable
            const minTeleportRange = 4.0; // Minimum distance required for teleport
            const maxTeleportRange = skillTemplate.range || 15.0; // Maximum teleport range
            
            // First check if there's an enemy in melee range
            const meleeEnemy = this.game.enemyManager.findNearestEnemy(this.playerPosition, meleeRange);
            
            if (meleeEnemy) {
                // Enemy is in melee range, use normal attack (no teleport)
                console.debug('Enemy in melee range, using normal attack without teleport');
                console.debug({meleeEnemy})
                
                // Use mana
                this.playerStats.setMana(this.playerStats.getMana() - skillTemplate.manaCost);
                
                // Start cooldown
                skillTemplate.startCooldown();
                
                // Create a new instance of the skill
                const skillConfig = SKILLS.find(config => config.name === skillTemplate.name);
                const newSkillInstance = new Skill(skillConfig);
                
                // Create a new effect handler for the new skill instance
                newSkillInstance.effectHandler = SkillEffectFactory.createEffect(newSkillInstance);
                
                // Pass game reference to the new skill instance
                newSkillInstance.game = this.game;
                
                // Get enemy position
                const enemyPosition = meleeEnemy.getPosition();
                
                // Calculate direction to enemy
                const direction = new THREE.Vector3().subVectors(enemyPosition, this.playerPosition).normalize();
                
                // Update player rotation to face enemy
                this.playerRotation.y = Math.atan2(direction.x, direction.z);
                
                // Create skill effect at the current position (no teleport needed since enemy is in melee range)
                const skillEffect = newSkillInstance.createEffect(this.playerPosition, this.playerRotation);
                
                // Add skill effect to scene
                this.scene.add(skillEffect);
                
                // Play sound
                if (this.game && this.game.audioManager) {
                    this.game.audioManager.playSound('playerAttack');
                }
                
                // Add to active skills
                this.activeSkills.push(newSkillInstance);
                
                return true;
            } else {
                // No enemy in melee range, check for enemies in teleport range
                // First look for enemies between min and max teleport range
                const teleportRangeEnemy = this.game.enemyManager.findNearestEnemy(this.playerPosition, maxTeleportRange);
                
                if (teleportRangeEnemy) {
                    console.debug({teleportRangeEnemy})
                    // Get enemy position
                    const enemyPosition = teleportRangeEnemy.getPosition();
                    
                    // Calculate distance to enemy
                    const distanceToEnemy = this.playerPosition.distanceTo(enemyPosition);
                    
                    // Calculate direction to enemy
                    const direction = new THREE.Vector3().subVectors(enemyPosition, this.playerPosition).normalize();
                    
                    // Update player rotation to face enemy
                    this.playerRotation.y = Math.atan2(direction.x, direction.z);
                    
                    // Use mana
                    this.playerStats.setMana(this.playerStats.getMana() - skillTemplate.manaCost);
                    
                    // Start cooldown
                    skillTemplate.startCooldown();
                    
                    // Create a new instance of the skill
                    const skillConfig = SKILLS.find(config => config.name === skillTemplate.name);
                    const newSkillInstance = new Skill(skillConfig);
                    
                    // Create a new effect handler for the new skill instance
                    newSkillInstance.effectHandler = SkillEffectFactory.createEffect(newSkillInstance);
                    
                    // Pass game reference to the new skill instance
                    newSkillInstance.game = this.game;
                    
                    // Check if this is a stationary attack skill or if enemy is too close for teleport
                    if (skillTemplate.stationaryAttack || 
                        skillTemplate.name === "Deadly Reach" || 
                        distanceToEnemy < minTeleportRange) {
                        
                        if (distanceToEnemy < minTeleportRange) {
                            console.debug(`Enemy at distance ${distanceToEnemy.toFixed(2)} is too close for teleport (min: ${minTeleportRange}), using ranged attack`);
                        } else {
                            console.debug(`Primary attack ${skillTemplate.name} has stationaryAttack flag or is Deadly Reach, player will not move`);
                        }
                        
                        // Create skill effect at the current position (no teleport)
                        const skillEffect = newSkillInstance.createEffect(this.playerPosition, this.playerRotation);
                        
                        // Add skill effect to scene
                        this.scene.add(skillEffect);
                    } else {
                        // Enemy is beyond minimum teleport range, teleport to the enemy
                        console.debug(`Enemy at distance ${distanceToEnemy.toFixed(2)} is beyond minimum teleport range (${minTeleportRange}), teleporting`);
                        
                        // Calculate teleport position (slightly before the enemy)
                        const teleportDistance = Math.min(distanceToEnemy - 1.5, maxTeleportRange);
                        const teleportPosition = new THREE.Vector3(
                            this.playerPosition.x + direction.x * teleportDistance,
                            enemyPosition.y, // Match enemy height
                            this.playerPosition.z + direction.z * teleportDistance
                        );
                        
                        // Teleport player
                        this.playerPosition.copy(teleportPosition);
                        
                        // Create skill effect at the new position
                        const skillEffect = newSkillInstance.createEffect(this.playerPosition, this.playerRotation);
                        
                        // Add skill effect to scene
                        this.scene.add(skillEffect);
                    }
                    
                    // Play sound
                    if (this.game && this.game.audioManager) {
                        this.game.audioManager.playSound('playerAttack');
                    }
                    
                    // Add to active skills
                    this.activeSkills.push(newSkillInstance);
                    
                    return true;
                } else {
                    // No enemy found in any range, show notification
                    if (this.game && this.game.hudManager) {
                        this.game.hudManager.showNotification('No enemy in range');
                    }
                    
                    return false;
                }
            }
        }
        
        return false;
    }
    
    /**
     * Gets the array of available skill templates
     * @returns {Array<Skill>} - Array of skill templates
     */
    getSkills() {
        return this.skills;
    }
    
    /**
     * Gets the array of currently active skill instances
     * @returns {Array<Skill>} - Array of active skill instances
     */
    getActiveSkills() {
        return this.activeSkills;
    }
    
    /**
     * Loads skills from saved data
     * @param {Array<Object>} savedSkills - Array of saved skill data
     */
    loadSkills(savedSkills) {
        if (!Array.isArray(savedSkills)) {
            console.warn('Invalid saved skills data:', savedSkills);
            return;
        }
        
        console.debug('Loading skills from saved data:', savedSkills);
        
        // Match saved skills with existing skills by name
        savedSkills.forEach(savedSkill => {
            const skill = this.skills.find(s => s.name === savedSkill.name);
            if (skill) {
                // Update skill properties from saved data
                if (savedSkill.cooldown !== undefined) {
                    skill.cooldown = savedSkill.cooldown;
                }
                if (savedSkill.currentCooldown !== undefined) {
                    skill.currentCooldown = savedSkill.currentCooldown;
                }
                
                console.debug(`Updated skill ${skill.name} with saved data`);
            } else {
                console.debug(`Skill ${savedSkill.name} from saved data not found in current skills`);
            }
        });
    }
    
    /**
     * Adds a skill from a remote player to the active skills list
     * @param {Skill} skill - The skill instance to add
     */
    addRemotePlayerSkill(skill) {
        if (!skill) return;
        
        console.debug(`[PlayerSkills] Adding remote player skill: ${skill.name}`);
        this.activeSkills.push(skill);
    }
    
    /**
     * Broadcasts a skill cast to other players in multiplayer mode
     * @param {string} skillName - The name of the skill being cast
     */
    broadcastSkillCast(skillName) {
        // Check if game and multiplayer manager exist
        if (!this.game || !this.game.multiplayerManager || !this.game.multiplayerManager.connection) {
            return;
        }
        
        // Check if connected to multiplayer
        if (!this.game.multiplayerManager.connection.isConnected) {
            return;
        }

        if (Math.random() < 0.05) {
            console.debug(`[PlayerSkills] Broadcasting skill cast: ${skillName}`);
        }

        // Get player position and rotation for accurate skill placement
        const position = this.playerPosition ? {
            x: this.playerPosition.x,
            y: this.playerPosition.y,
            z: this.playerPosition.z
        } : null;
        
        const rotation = this.playerRotation ? {
            y: this.playerRotation.y
        } : null;
        
        // Get the variant information if available
        let variant = null;
        if (this.skillTreeData && this.skillTreeData[skillName] && this.skillTreeData[skillName].activeVariant) {
            variant = this.skillTreeData[skillName].activeVariant;
            console.debug(`[PlayerSkills] Broadcasting skill variant: ${variant} for skill: ${skillName}`);
        }
        
        // If player is host, broadcast to all members
        if (this.game.multiplayerManager.connection.isHost) {
            this.game.multiplayerManager.connection.broadcast({
                type: 'skillCast',
                skillName: skillName,
                playerId: this.game.multiplayerManager.connection.peer.id,
                position: position,
                rotation: rotation,
                variant: variant // Include the variant information
            });
        } 
        // If player is member, send to host
        else {
            const hostConn = this.game.multiplayerManager.connection.peers.get(
                this.game.multiplayerManager.connection.hostId
            );
            
            if (hostConn) {
                hostConn.send({
                    type: 'skillCast',
                    playerId: this.game.multiplayerManager.connection.peer.id,
                    skillName: skillName,
                    position: position,
                    rotation: rotation,
                    variant: variant // Include the variant information
                });
            }
        }
    }
}