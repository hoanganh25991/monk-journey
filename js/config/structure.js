/**
 * Structure Configuration
 * 
 * This file centralizes all structure object definitions used across the application.
 * It provides a single source of truth for structure object types, their properties,
 * and their relationships to different biomes/themes.
 */

/**
 * Structure objects dictionary
 * A single source of truth for all structure string literals
 */
export const STRUCTURE_OBJECTS = {
    // Basic structures
    HOUSE: 'house',
    TOWER: 'tower',
    RUINS: 'ruins',
    DARK_SANCTUM: 'dark_sanctum', // Changed from 'darkSanctum' to 'dark_sanctum' for consistency
    MOUNTAIN: 'mountain',
    BRIDGE: 'bridge',
    VILLAGE: 'village',
    
    // Building variants
    TAVERN: 'tavern',
    TEMPLE: 'temple',
    SHOP: 'shop',
    FORTRESS: 'fortress',
    ALTAR: 'altar'
};

/**
 * Structure properties
 * Default properties for different structure types
 */
export const STRUCTURE_PROPERTIES = {
    [STRUCTURE_OBJECTS.HOUSE]: {
        width: 5,
        depth: 5,
        height: 3,
        isBuilding: true
    },
    [STRUCTURE_OBJECTS.TOWER]: {
        width: 3,
        depth: 3,
        height: 8,
        isBuilding: true
    },
    [STRUCTURE_OBJECTS.RUINS]: {
        width: 10,
        depth: 10,
        height: 2,
        isBuilding: false
    },
    [STRUCTURE_OBJECTS.DARK_SANCTUM]: {
        width: 15,
        depth: 15,
        height: 10,
        isBuilding: false
    },
    [STRUCTURE_OBJECTS.MOUNTAIN]: {
        width: 20,
        depth: 20,
        height: 15,
        isBuilding: false
    },
    [STRUCTURE_OBJECTS.BRIDGE]: {
        width: 3,
        depth: 10,
        height: 2,
        isBuilding: false
    },
    [STRUCTURE_OBJECTS.VILLAGE]: {
        width: 30,
        depth: 30,
        height: 2,
        isBuilding: false
    },
    [STRUCTURE_OBJECTS.TAVERN]: {
        width: 7,
        depth: 7,
        height: 4,
        isBuilding: true
    },
    [STRUCTURE_OBJECTS.TEMPLE]: {
        width: 8,
        depth: 10,
        height: 6,
        isBuilding: true
    },
    [STRUCTURE_OBJECTS.SHOP]: {
        width: 6,
        depth: 6,
        height: 3,
        isBuilding: true
    },
    [STRUCTURE_OBJECTS.FORTRESS]: {
        width: 12,
        depth: 12,
        height: 8,
        isBuilding: true
    },
    [STRUCTURE_OBJECTS.ALTAR]: {
        width: 5,
        depth: 5,
        height: 2,
        isBuilding: true
    }
};

/**
 * Structure groups
 * Defines which structures can be grouped together
 */
export const STRUCTURE_GROUPS = {
    VILLAGE_GROUP: [
        STRUCTURE_OBJECTS.HOUSE,
        STRUCTURE_OBJECTS.TAVERN,
        STRUCTURE_OBJECTS.SHOP,
        STRUCTURE_OBJECTS.TEMPLE
    ],
    MOUNTAIN_RANGE: [
        STRUCTURE_OBJECTS.MOUNTAIN
    ],
    FORTRESS_COMPLEX: [
        STRUCTURE_OBJECTS.FORTRESS,
        STRUCTURE_OBJECTS.TOWER
    ]
};

/**
 * Biome-specific structures
 * Defines which structures are more likely to appear in which biomes
 */
export const BIOME_STRUCTURES = {
    FOREST: [
        STRUCTURE_OBJECTS.HOUSE,
        STRUCTURE_OBJECTS.VILLAGE,
        STRUCTURE_OBJECTS.RUINS,
        STRUCTURE_OBJECTS.ALTAR
    ],
    MOUNTAINS: [
        STRUCTURE_OBJECTS.MOUNTAIN,
        STRUCTURE_OBJECTS.TOWER,
        STRUCTURE_OBJECTS.BRIDGE,
        STRUCTURE_OBJECTS.FORTRESS
    ],
    DESERT: [
        STRUCTURE_OBJECTS.RUINS,
        STRUCTURE_OBJECTS.TEMPLE,
        STRUCTURE_OBJECTS.ALTAR
    ],
    SWAMP: [
        STRUCTURE_OBJECTS.RUINS,
        STRUCTURE_OBJECTS.DARK_SANCTUM,
        STRUCTURE_OBJECTS.BRIDGE
    ],
    RUINS: [
        STRUCTURE_OBJECTS.RUINS,
        STRUCTURE_OBJECTS.DARK_SANCTUM,
        STRUCTURE_OBJECTS.ALTAR,
        STRUCTURE_OBJECTS.TEMPLE
    ]
};

export default {
    STRUCTURE_OBJECTS,
    STRUCTURE_PROPERTIES,
    STRUCTURE_GROUPS,
    BIOME_STRUCTURES
};