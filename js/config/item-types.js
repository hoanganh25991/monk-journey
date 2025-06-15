/**
 * Item Types Configuration
 * Contains type definitions for items in the game
 */

/**
 * @typedef {Object} ItemBaseStats
 * @property {number} [damage] - Base damage for weapons
 * @property {number} [attackSpeed] - Attack speed modifier for weapons
 * @property {number} [skillDamage] - Skill damage modifier for weapons
 * @property {number} [defense] - Defense value for armor
 * @property {number} [movementSpeed] - Movement speed modifier
 * @property {number} [wisdom] - Wisdom stat modifier
 * @property {number} [resourceMax] - Maximum resource (mana/spirit) modifier
 * @property {number} [manaBonus] - Bonus to maximum mana
 * @property {number} [critChance] - Critical hit chance modifier
 * @property {number} [attackPower] - Attack power modifier
 * @property {number} [elementalDamage] - Elemental damage modifier
 * @property {number} [allResistance] - All resistance modifier
 * @property {number} [healthRegen] - Health regeneration modifier
 * @property {number} [manaRegen] - Mana regeneration modifier
 * @property {number} [healthRestore] - Amount of health restored when consumed
 * @property {number} [manaRestore] - Amount of mana/spirit restored when consumed
 * @property {number} [staminaRestore] - Amount of stamina restored when consumed
 * @property {number} [healthBonus] - Temporary bonus to maximum health
 * @property {number} [maxHealth] - Temporary bonus to maximum health (alternative name)
 * @property {number} [duration] - Duration of temporary effects in seconds
 * @property {string} [effectType] - Type of effect for consumables: 'instant', 'over_time', 'buff'
 * @property {Object} [buffStats] - Stats affected by buff effects
 * @property {number} [buffStats.attackPower] - Attack power buff
 * @property {number} [buffStats.defense] - Defense buff
 * @property {number} [buffStats.critChance] - Critical chance buff
 * @property {number} [buffStats.allResistance] - All resistance buff
 * @property {number} [buffStats.wisdom] - Wisdom buff
 * @property {number} [buffStats.healthRegen] - Health regeneration buff
 * @property {number} [buffStats.manaRegen] - Mana regeneration buff
 * @property {number} [buffStats.movementSpeed] - Movement speed buff
 */

/**
 * @typedef {Object} ItemEffects
 * @property {number} [health] - Health restoration amount
 * @property {number} [mana] - Mana restoration amount
 * @property {number} [attack] - Temporary attack boost
 * @property {number} [defense] - Temporary defense boost
 * @property {number} [speed] - Temporary speed boost
 * @property {number} [duration] - Duration of temporary effects in seconds
 */

/**
 * @typedef {Object} ItemTemplate
 * @property {string} id - Unique identifier for the item
 * @property {string} name - Display name of the item
 * @property {string} type - Item type: 'weapon', 'armor', 'accessory', 'consumable'
 * @property {string} subType - Item subtype: 'fist', 'staff', 'robe', 'potion', etc.
 * @property {string} description - Item description text
 * @property {string} icon - Icon representation (emoji or path to image)
 * @property {ItemBaseStats} baseStats - Base statistics for the item
 * @property {ItemEffects} [effects] - Legacy effects system (for backward compatibility)
 * @property {boolean} [consumable] - Flag indicating if the item is consumable
 */

// Export type definitions for documentation purposes
export const ItemTypes = {
    // This object doesn't contain actual data, it's just for documentation
    // and to provide a namespace for the type definitions
};