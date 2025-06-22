import {ZONE_TYPES} from './zone.js';
import {ENVIRONMENT_OBJECTS} from './environment.js';
import {STRUCTURE_OBJECTS} from './structure.js';

/**
 * Density Configuration
 * 
 * This file centralizes all density-related constants used across the application.
 * It provides a single source of truth for environment and structure density values.
 */

/**
 * Environment density levels for different performance settings
 */
export const DENSITY_LEVELS = {
    HIGH: 2.0,    // Reduced from 3.0
    MEDIUM: 0.8,  // Reduced from 1.2 to improve performance
    LOW: 0.6,     // Reduced from 1.0
    MINIMAL: 0.3  // Reduced from 0.5
};

/**
 * Zone-specific environment density values
 */
export const ZONE_ENVIRONMENT_DENSITY = {
    FOREST: 1.5,  // Reduced from 2.5
    DESERT: 1.0,  // Reduced from 1.8
    MOUNTAIN: 1.2, // Reduced from 2.0
    SWAMP: 1.8,   // Reduced from 3.0
    MAGICAL: 1.5  // Reduced from 2.5
};

/**
 * Zone-specific structure density values
 */
export const ZONE_STRUCTURE_DENSITY = {
    FOREST: 0.25,  // Reduced from 0.4
    DESERT: 0.2,   // Reduced from 0.35
    MOUNTAIN: 0.18, // Reduced from 0.3
    SWAMP: 0.25,   // Reduced from 0.4
    MAGICAL: 0.25  // Reduced from 0.45
};

export const ZONE_DENSITIES = {
    [ZONE_TYPES.FOREST]: { 
        environment: ZONE_ENVIRONMENT_DENSITY.FOREST,
        structures: ZONE_STRUCTURE_DENSITY.FOREST,
        environmentTypes: [
            ENVIRONMENT_OBJECTS.TREE,
            ENVIRONMENT_OBJECTS.BUSH,
            ENVIRONMENT_OBJECTS.FLOWER,
            ENVIRONMENT_OBJECTS.TALL_GRASS,
            ENVIRONMENT_OBJECTS.FERN,
            ENVIRONMENT_OBJECTS.BERRY_BUSH,
            ENVIRONMENT_OBJECTS.ANCIENT_TREE,
            ENVIRONMENT_OBJECTS.MUSHROOM,
            ENVIRONMENT_OBJECTS.FALLEN_LOG,
            ENVIRONMENT_OBJECTS.TREE_CLUSTER,
            ENVIRONMENT_OBJECTS.FOREST_FLOWER,
            ENVIRONMENT_OBJECTS.FOREST_DEBRIS,
            ENVIRONMENT_OBJECTS.SMALL_MUSHROOM
        ],
        structureTypes: [
            STRUCTURE_OBJECTS.RUINS,
            STRUCTURE_OBJECTS.VILLAGE,
            STRUCTURE_OBJECTS.HOUSE,
            STRUCTURE_OBJECTS.TOWER,
            STRUCTURE_OBJECTS.TEMPLE,
            STRUCTURE_OBJECTS.ALTAR
        ]
    },
    [ZONE_TYPES.DESERT]: { 
        environment: ZONE_ENVIRONMENT_DENSITY.DESERT,
        structures: ZONE_STRUCTURE_DENSITY.DESERT,
        environmentTypes: [
            ENVIRONMENT_OBJECTS.DESERT_PLANT,
            ENVIRONMENT_OBJECTS.OASIS,
            ENVIRONMENT_OBJECTS.DESERT_SHRINE,
            ENVIRONMENT_OBJECTS.ASH_PILE,
            ENVIRONMENT_OBJECTS.ROCK,
            ENVIRONMENT_OBJECTS.ROCK_FORMATION,
            ENVIRONMENT_OBJECTS.SMALL_PEAK,
            ENVIRONMENT_OBJECTS.LAVA_ROCK,
            ENVIRONMENT_OBJECTS.OBSIDIAN
        ],
        structureTypes: [
            STRUCTURE_OBJECTS.RUINS,
            STRUCTURE_OBJECTS.TEMPLE,
            STRUCTURE_OBJECTS.ALTAR,
            STRUCTURE_OBJECTS.HOUSE,
            STRUCTURE_OBJECTS.TOWER
        ]
    },
    [ZONE_TYPES.MOUNTAIN]: { 
        environment: ZONE_ENVIRONMENT_DENSITY.MOUNTAIN,
        structures: ZONE_STRUCTURE_DENSITY.MOUNTAIN,
        environmentTypes: [
            ENVIRONMENT_OBJECTS.PINE_TREE,
            ENVIRONMENT_OBJECTS.MOUNTAIN_ROCK,
            ENVIRONMENT_OBJECTS.ICE_SHARD,
            ENVIRONMENT_OBJECTS.ALPINE_FLOWER,
            ENVIRONMENT_OBJECTS.SMALL_PEAK,
            ENVIRONMENT_OBJECTS.SNOW_PATCH,
            ENVIRONMENT_OBJECTS.ROCK,
            ENVIRONMENT_OBJECTS.ROCK_FORMATION,
            ENVIRONMENT_OBJECTS.TREE
        ],
        structureTypes: [
            STRUCTURE_OBJECTS.RUINS,
            STRUCTURE_OBJECTS.FORTRESS,
            STRUCTURE_OBJECTS.TOWER,
            STRUCTURE_OBJECTS.MOUNTAIN,
            STRUCTURE_OBJECTS.HOUSE,
            STRUCTURE_OBJECTS.ALTAR
        ]
    },
    [ZONE_TYPES.SWAMP]: { 
        environment: ZONE_ENVIRONMENT_DENSITY.SWAMP,
        structures: ZONE_STRUCTURE_DENSITY.SWAMP,
        environmentTypes: [
            ENVIRONMENT_OBJECTS.SWAMP_TREE,
            ENVIRONMENT_OBJECTS.LILY_PAD,
            ENVIRONMENT_OBJECTS.SWAMP_PLANT,
            ENVIRONMENT_OBJECTS.GLOWING_MUSHROOM,
            ENVIRONMENT_OBJECTS.MOSS,
            ENVIRONMENT_OBJECTS.SWAMP_DEBRIS,
            ENVIRONMENT_OBJECTS.TREE,
            ENVIRONMENT_OBJECTS.BUSH,
            ENVIRONMENT_OBJECTS.FALLEN_LOG,
            ENVIRONMENT_OBJECTS.MUSHROOM
        ],
        structureTypes: [
            STRUCTURE_OBJECTS.RUINS,
            STRUCTURE_OBJECTS.DARK_SANCTUM,
            STRUCTURE_OBJECTS.ALTAR,
            STRUCTURE_OBJECTS.HOUSE,
            STRUCTURE_OBJECTS.TOWER
        ]
    },
    [ZONE_TYPES.MAGICAL]: { 
        environment: ZONE_ENVIRONMENT_DENSITY.MAGICAL,
        structures: ZONE_STRUCTURE_DENSITY.MAGICAL,
        environmentTypes: [
            ENVIRONMENT_OBJECTS.GLOWING_FLOWERS,
            ENVIRONMENT_OBJECTS.CRYSTAL_FORMATION,
            ENVIRONMENT_OBJECTS.FAIRY_CIRCLE,
            ENVIRONMENT_OBJECTS.MAGICAL_STONE,
            ENVIRONMENT_OBJECTS.ANCIENT_ARTIFACT,
            ENVIRONMENT_OBJECTS.MYSTERIOUS_PORTAL,
            ENVIRONMENT_OBJECTS.ANCIENT_TREE,
            ENVIRONMENT_OBJECTS.GLOWING_MUSHROOM,
            ENVIRONMENT_OBJECTS.RUNE_STONE,
            ENVIRONMENT_OBJECTS.MAGIC_CIRCLE
        ],
        structureTypes: [
            STRUCTURE_OBJECTS.RUINS,
            STRUCTURE_OBJECTS.TEMPLE,
            STRUCTURE_OBJECTS.ALTAR,
            STRUCTURE_OBJECTS.TOWER,
            STRUCTURE_OBJECTS.DARK_SANCTUM
        ]
    }
}

export default {
    DENSITY_LEVELS,
    ZONE_ENVIRONMENT_DENSITY,
    ZONE_STRUCTURE_DENSITY
};
