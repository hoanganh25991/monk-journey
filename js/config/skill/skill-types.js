/**
 * Type definitions for skill configuration objects
 */

/**
 * Sound configuration for skills
 * @typedef {Object} SkillSounds
 * @property {string|null} cast - Sound played when the skill is cast
 * @property {string|null} impact - Sound played when the skill impacts enemies
 * @property {string|null} end - Sound played when the skill effect ends
 */

/**
 * Skill types supported by the game
 * @typedef {'teleport'|'projectile'|'wave'|'buff'|'heal'|'ranged'|'aoe'|'multi'|'summon'|'mark'|'dash'|'control'} SkillType
 */

/**
 * Optional ground rectangle properties for skill collision detection
 * @typedef {Object} GroundRectangleProps
 * @property {boolean} [useSkillRadiusForWidth] - Whether to use the skill's radius for the rectangle width
 * @property {boolean} [dynamicLength] - Whether the length should increase dynamically along travel direction
 * @property {number} [yOffset] - Y-axis offset from terrain height
 */

/**
 * Skill configuration object
 * Used to define skills in the skills.js configuration file
 * @typedef {Object} SkillConfig
 * @property {string} name - Name of the skill
 * @property {string} description - Description of what the skill does
 * @property {SkillType} type - Type of skill effect
 * @property {number} damage - Base damage of the skill
 * @property {number} manaCost - Mana cost to use the skill
 * @property {number} cooldown - Cooldown time in seconds before the skill can be used again
 * @property {number} range - Maximum range of the skill in game units
 * @property {number} radius - Radius of effect in game units
 * @property {number} duration - Duration of the skill effect in seconds
 * @property {function(): string} color - Color getter function that returns the skill's color from SKILL_ICONS
 * @property {function(): string} icon - Icon getter function that returns the skill's emoji from SKILL_ICONS
 * @property {SkillSounds} sounds - Sound configuration for the skill
 * 
 * // Optional properties based on skill type
 * @property {boolean} [primaryAttack] - Whether this is a primary attack that doesn't consume mana
 * @property {boolean} [piercing] - Whether the projectile can pierce through enemies
 * @property {boolean} [knockback] - Whether the skill can knock back enemies
 * @property {number} [projectileSpeed] - Speed of the projectile in game units per second
 * @property {boolean} [stationaryAttack] - Whether the player should remain stationary when using this skill
 * @property {number} [hits] - Number of hits for multi-hit skills
 * @property {number} [healing] - Amount of health restored for healing skills
 * @property {number} [allyCount] - Number of allies to summon for summon skills
 * @property {number} [dashSpeed] - Speed of the dash for dash skills
 * @property {boolean} [verticalLeap] - Whether the skill includes a vertical leap
 * @property {number} [multiHit] - Number of hits in a multi-hit sequence
 * @property {boolean} [windEffect] - Whether the skill has a wind visual effect
 * @property {number} [kickSpeed] - Speed of the kick for kick skills
 * @property {boolean} [immobilize] - Whether the skill immobilizes enemies
 * @property {number} [moveSpeed] - Speed at which the effect moves forward
 * @property {GroundRectangleProps} [groundRectangle] - Ground rectangle properties for collision detection
 * @property {boolean} [lockEnemiesDuringTravel] - Whether to lock enemies during travel
 * @property {number} [lockDuration] - Duration of the lock effect in seconds
 */

/**
 * Arrays of skill configurations exported from skills.js
 * @typedef {Object} SkillCollections
 * @property {SkillConfig[]} PRIMARY_ATTACKS - Primary attacks that don't consume mana
 * @property {SkillConfig[]} NORMAL_SKILLS - Normal skills that consume mana
 * @property {SkillConfig[]} SKILLS - Combined array of all skills
 * @property {SkillConfig[]} BATTLE_SKILLS - Skills available in battle
 */

// Export empty objects as placeholders
export const SkillTypes = {};