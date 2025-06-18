/**
 * Structure Configuration
 * 
 * This file centralizes all structure object definitions used across the application.
 * It provides a single source of truth for structure types, their properties,
 * and their relationships to different biomes/themes.
 */

import { BIOMES } from './biomes.js';

/**
 * Structure types dictionary
 * A single source of truth for all structure string literals
 */
export const STRUCTURE_TYPES = {
    // Basic structures
    HOUSE: 'house',
    TOWER: 'tower',
    RUINS: 'ruins',
    DARK_SANCTUM: 'darkSanctum',
    MOUNTAIN: 'mountain',
    BRIDGE: 'bridge',
    VILLAGE: 'village',
    
    // Special buildings
    TAVERN: 'tavern',
    TEMPLE: 'temple',
    SHOP: 'shop',
    FORTRESS: 'fortress',
    ALTAR: 'altar'
};

/**
 * Structure properties
 * Defines default dimensions and properties for each structure type
 */
export const STRUCTURE_PROPERTIES = {
    [STRUCTURE_TYPES.HOUSE]: {
        width: 5,
        depth: 5,
        height: 3,
        canBeDecorated: true,
        canHaveNPCs: true,
        isInteractive: true
    },
    [STRUCTURE_TYPES.TOWER]: {
        width: 4,
        depth: 4,
        height: 8,
        canBeDecorated: true,
        canHaveNPCs: true,
        isInteractive: true
    },
    [STRUCTURE_TYPES.RUINS]: {
        width: 8,
        depth: 8,
        height: 4,
        canBeDecorated: false,
        canHaveNPCs: false,
        isInteractive: true
    },
    [STRUCTURE_TYPES.DARK_SANCTUM]: {
        width: 10,
        depth: 10,
        height: 6,
        canBeDecorated: false,
        canHaveNPCs: true,
        isInteractive: true
    },
    [STRUCTURE_TYPES.MOUNTAIN]: {
        width: 15,
        depth: 15,
        height: 12,
        canBeDecorated: false,
        canHaveNPCs: false,
        isInteractive: false
    },
    [STRUCTURE_TYPES.BRIDGE]: {
        width: 3,
        depth: 10,
        height: 2,
        canBeDecorated: false,
        canHaveNPCs: false,
        isInteractive: false
    },
    [STRUCTURE_TYPES.VILLAGE]: {
        width: 20,
        depth: 20,
        height: 4,
        canBeDecorated: true,
        canHaveNPCs: true,
        isInteractive: true
    },
    [STRUCTURE_TYPES.TAVERN]: {
        width: 7,
        depth: 7,
        height: 4,
        canBeDecorated: true,
        canHaveNPCs: true,
        isInteractive: true
    },
    [STRUCTURE_TYPES.TEMPLE]: {
        width: 8,
        depth: 10,
        height: 6,
        canBeDecorated: true,
        canHaveNPCs: true,
        isInteractive: true
    },
    [STRUCTURE_TYPES.SHOP]: {
        width: 6,
        depth: 6,
        height: 4,
        canBeDecorated: true,
        canHaveNPCs: true,
        isInteractive: true
    },
    [STRUCTURE_TYPES.FORTRESS]: {
        width: 12,
        depth: 12,
        height: 8,
        canBeDecorated: true,
        canHaveNPCs: true,
        isInteractive: true
    },
    [STRUCTURE_TYPES.ALTAR]: {
        width: 5,
        depth: 5,
        height: 3,
        canBeDecorated: true,
        canHaveNPCs: false,
        isInteractive: true
    }
};

/**
 * Theme-specific structure distributions
 * Defines which structures are more common in which biomes
 */
export const THEME_SPECIFIC_STRUCTURES = {
    // Forest biome specific structures
    [BIOMES.FOREST]: [
        { type: STRUCTURE_TYPES.HOUSE, weight: 5, variants: 3 },
        { type: STRUCTURE_TYPES.TOWER, weight: 3, variants: 2 },
        { type: STRUCTURE_TYPES.RUINS, weight: 2, variants: 3 },
        { type: STRUCTURE_TYPES.VILLAGE, weight: 1, variants: 2 },
        { type: STRUCTURE_TYPES.TEMPLE, weight: 1, variants: 1 },
        { type: STRUCTURE_TYPES.ALTAR, weight: 2, variants: 2 }
    ],
    
    // Mountain biome specific structures
    [BIOMES.MOUNTAIN]: [
        { type: STRUCTURE_TYPES.TOWER, weight: 4, variants: 2 },
        { type: STRUCTURE_TYPES.MOUNTAIN, weight: 5, variants: 3 },
        { type: STRUCTURE_TYPES.FORTRESS, weight: 3, variants: 2 },
        { type: STRUCTURE_TYPES.RUINS, weight: 2, variants: 2 },
        { type: STRUCTURE_TYPES.ALTAR, weight: 1, variants: 1 }
    ],
    
    // Desert biome specific structures
    [BIOMES.DESERT]: [
        { type: STRUCTURE_TYPES.RUINS, weight: 5, variants: 4 },
        { type: STRUCTURE_TYPES.TEMPLE, weight: 3, variants: 2 },
        { type: STRUCTURE_TYPES.TOWER, weight: 2, variants: 1 },
        { type: STRUCTURE_TYPES.ALTAR, weight: 3, variants: 2 },
        { type: STRUCTURE_TYPES.HOUSE, weight: 1, variants: 1 }
    ],
    
    // Swamp biome specific structures
    [BIOMES.SWAMP]: [
        { type: STRUCTURE_TYPES.DARK_SANCTUM, weight: 4, variants: 2 },
        { type: STRUCTURE_TYPES.RUINS, weight: 5, variants: 3 },
        { type: STRUCTURE_TYPES.HOUSE, weight: 2, variants: 1 },
        { type: STRUCTURE_TYPES.ALTAR, weight: 3, variants: 2 },
        { type: STRUCTURE_TYPES.TOWER, weight: 1, variants: 1 }
    ],
    
    // Magical biome specific structures
    [BIOMES.MAGICAL]: [
        { type: STRUCTURE_TYPES.TEMPLE, weight: 5, variants: 3 },
        { type: STRUCTURE_TYPES.ALTAR, weight: 4, variants: 3 },
        { type: STRUCTURE_TYPES.TOWER, weight: 3, variants: 2 },
        { type: STRUCTURE_TYPES.DARK_SANCTUM, weight: 2, variants: 1 },
        { type: STRUCTURE_TYPES.RUINS, weight: 1, variants: 1 }
    ],
    
    // Terrant (default) biome specific structures
    [BIOMES.TERRANT]: [
        { type: STRUCTURE_TYPES.HOUSE, weight: 4, variants: 2 },
        { type: STRUCTURE_TYPES.RUINS, weight: 3, variants: 2 },
        { type: STRUCTURE_TYPES.ALTAR, weight: 2, variants: 1 },
        { type: STRUCTURE_TYPES.TOWER, weight: 1, variants: 1 }
    ],
    
    // Ruins biome specific structures
    [BIOMES.RUINS]: [
        { type: STRUCTURE_TYPES.RUINS, weight: 6, variants: 4 },
        { type: STRUCTURE_TYPES.TEMPLE, weight: 3, variants: 2 },
        { type: STRUCTURE_TYPES.ALTAR, weight: 2, variants: 2 },
        { type: STRUCTURE_TYPES.TOWER, weight: 1, variants: 1 }
    ],
    
    // Dark Sanctum biome specific structures
    [BIOMES.DARK_SANCTUM]: [
        { type: STRUCTURE_TYPES.DARK_SANCTUM, weight: 5, variants: 3 },
        { type: STRUCTURE_TYPES.ALTAR, weight: 3, variants: 2 },
        { type: STRUCTURE_TYPES.RUINS, weight: 2, variants: 1 }
    ]
};

/**
 * Structure groups
 * Defines which structures can be grouped together
 */
export const STRUCTURE_GROUPS = {
    VILLAGE: [
        STRUCTURE_TYPES.HOUSE,
        STRUCTURE_TYPES.TAVERN,
        STRUCTURE_TYPES.SHOP
    ],
    
    TEMPLE_COMPLEX: [
        STRUCTURE_TYPES.TEMPLE,
        STRUCTURE_TYPES.ALTAR,
        STRUCTURE_TYPES.TOWER
    ],
    
    FORTRESS_COMPLEX: [
        STRUCTURE_TYPES.FORTRESS,
        STRUCTURE_TYPES.TOWER,
        STRUCTURE_TYPES.HOUSE
    ],
    
    RUINS_COMPLEX: [
        STRUCTURE_TYPES.RUINS,
        STRUCTURE_TYPES.ALTAR,
        STRUCTURE_TYPES.DARK_SANCTUM
    ]
};

/**
 * Structure spawn rules
 * Defines rules for structure placement in different biomes
 */
export const STRUCTURE_SPAWN_RULES = {
    [BIOMES.TERRANT]: {
        minDistance: 50,
        maxDensity: 0.15,
        allowedGroups: ['VILLAGE', 'RUINS_COMPLEX']
    },
    [BIOMES.FOREST]: {
        minDistance: 60,
        maxDensity: 0.25,
        allowedGroups: ['VILLAGE', 'TEMPLE_COMPLEX', 'RUINS_COMPLEX']
    },
    [BIOMES.DESERT]: {
        minDistance: 80,
        maxDensity: 0.2,
        allowedGroups: ['RUINS_COMPLEX', 'TEMPLE_COMPLEX']
    },
    [BIOMES.MOUNTAIN]: {
        minDistance: 100,
        maxDensity: 0.18,
        allowedGroups: ['FORTRESS_COMPLEX', 'RUINS_COMPLEX']
    },
    [BIOMES.SWAMP]: {
        minDistance: 70,
        maxDensity: 0.25,
        allowedGroups: ['RUINS_COMPLEX']
    },
    [BIOMES.RUINS]: {
        minDistance: 40,
        maxDensity: 0.3,
        allowedGroups: ['RUINS_COMPLEX', 'TEMPLE_COMPLEX']
    },
    [BIOMES.DARK_SANCTUM]: {
        minDistance: 90,
        maxDensity: 0.2,
        allowedGroups: ['RUINS_COMPLEX']
    },
    [BIOMES.MAGICAL]: {
        minDistance: 60,
        maxDensity: 0.25,
        allowedGroups: ['TEMPLE_COMPLEX', 'RUINS_COMPLEX']
    }
};

export default {
    STRUCTURE_TYPES,
    STRUCTURE_PROPERTIES,
    THEME_SPECIFIC_STRUCTURES,
    STRUCTURE_GROUPS,
    STRUCTURE_SPAWN_RULES
};