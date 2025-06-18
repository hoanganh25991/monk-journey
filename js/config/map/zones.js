/**
 * Zone Configuration
 * 
 * This file centralizes all zone-related configurations used across the application.
 * It provides density settings and object types for different biomes.
 */

import { BIOMES } from './biomes.js';
import { ENVIRONMENT_OBJECTS } from './environment.js';
import { STRUCTURE_TYPES } from './structure.js';

/**
 * Zone density configuration for different biomes
 * Defines environment and structure density along with the types of objects to spawn
 */
export const ZONE_DENSITIES = {
    [BIOMES.FOREST]: { 
        environment: 1.5, // Reduced from 2.5
        structures: 0.25, // Reduced from 0.4
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
            STRUCTURE_TYPES.RUINS,
            STRUCTURE_TYPES.VILLAGE,
            STRUCTURE_TYPES.HOUSE,
            STRUCTURE_TYPES.TOWER,
            STRUCTURE_TYPES.TEMPLE,
            STRUCTURE_TYPES.ALTAR
        ]
    },
    [BIOMES.DESERT]: { 
        environment: 1.0, // Reduced from 1.8
        structures: 0.2, // Reduced from 0.35
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
            STRUCTURE_TYPES.RUINS,
            STRUCTURE_TYPES.TEMPLE,
            STRUCTURE_TYPES.ALTAR,
            STRUCTURE_TYPES.HOUSE,
            STRUCTURE_TYPES.TOWER
        ]
    },
    [BIOMES.MOUNTAIN]: { 
        environment: 1.2, // Reduced from 2.0
        structures: 0.18, // Reduced from 0.3
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
            STRUCTURE_TYPES.RUINS,
            STRUCTURE_TYPES.FORTRESS,
            STRUCTURE_TYPES.TOWER,
            STRUCTURE_TYPES.MOUNTAIN,
            STRUCTURE_TYPES.HOUSE,
            STRUCTURE_TYPES.ALTAR
        ]
    },
    [BIOMES.SWAMP]: { 
        environment: 1.8, // Reduced from 3.0
        structures: 0.25, // Reduced from 0.4
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
            STRUCTURE_TYPES.RUINS,
            STRUCTURE_TYPES.DARK_SANCTUM,
            STRUCTURE_TYPES.ALTAR,
            STRUCTURE_TYPES.HOUSE,
            STRUCTURE_TYPES.TOWER
        ]
    },
    [BIOMES.MAGICAL]: { 
        environment: 1.5, // Reduced from 2.5
        structures: 0.25, // Reduced from 0.45
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
            STRUCTURE_TYPES.RUINS,
            STRUCTURE_TYPES.TEMPLE,
            STRUCTURE_TYPES.ALTAR,
            STRUCTURE_TYPES.TOWER,
            STRUCTURE_TYPES.DARK_SANCTUM
        ]
    },
    [BIOMES.TERRANT]: {
        environment: 1.0,
        structures: 0.15,
        environmentTypes: [
            ENVIRONMENT_OBJECTS.ROCK,
            ENVIRONMENT_OBJECTS.BUSH,
            ENVIRONMENT_OBJECTS.FLOWER,
            ENVIRONMENT_OBJECTS.TALL_GRASS,
            ENVIRONMENT_OBJECTS.SMALL_PLANT,
            ENVIRONMENT_OBJECTS.TREE
        ],
        structureTypes: [
            STRUCTURE_TYPES.RUINS,
            STRUCTURE_TYPES.HOUSE,
            STRUCTURE_TYPES.ALTAR
        ]
    },
    [BIOMES.RUINS]: {
        environment: 0.8,
        structures: 0.3,
        environmentTypes: [
            ENVIRONMENT_OBJECTS.BROKEN_COLUMN,
            ENVIRONMENT_OBJECTS.STATUE_FRAGMENT,
            ENVIRONMENT_OBJECTS.ANCIENT_STONE,
            ENVIRONMENT_OBJECTS.OVERGROWN_RUIN,
            ENVIRONMENT_OBJECTS.ROCK,
            ENVIRONMENT_OBJECTS.BUSH,
            ENVIRONMENT_OBJECTS.TALL_GRASS
        ],
        structureTypes: [
            STRUCTURE_TYPES.RUINS,
            STRUCTURE_TYPES.TEMPLE,
            STRUCTURE_TYPES.ALTAR,
            STRUCTURE_TYPES.TOWER
        ]
    },
    [BIOMES.DARK_SANCTUM]: {
        environment: 0.7,
        structures: 0.2,
        environmentTypes: [
            ENVIRONMENT_OBJECTS.ANCIENT_ALTAR,
            ENVIRONMENT_OBJECTS.MAGIC_CIRCLE,
            ENVIRONMENT_OBJECTS.RUNE_STONE,
            ENVIRONMENT_OBJECTS.GLOWING_MUSHROOM,
            ENVIRONMENT_OBJECTS.ROCK,
            ENVIRONMENT_OBJECTS.OBSIDIAN
        ],
        structureTypes: [
            STRUCTURE_TYPES.DARK_SANCTUM,
            STRUCTURE_TYPES.ALTAR,
            STRUCTURE_TYPES.RUINS
        ]
    }
    // Additional zone densities can be added for other biomes
};

/**
 * Zone difficulty levels
 * Defines the difficulty level for each zone type
 */
export const ZONE_DIFFICULTY = {
    [BIOMES.TERRANT]: 1,
    [BIOMES.FOREST]: 2,
    [BIOMES.DESERT]: 3,
    [BIOMES.MOUNTAIN]: 4,
    [BIOMES.SWAMP]: 5,
    [BIOMES.RUINS]: 3,
    [BIOMES.DARK_SANCTUM]: 6,
    [BIOMES.MAGICAL]: 4,
    [BIOMES.ENCHANTED_GROVE]: 3,
    [BIOMES.CRYSTAL_CAVERNS]: 5,
    [BIOMES.CELESTIAL_REALM]: 7,
    [BIOMES.VOLCANIC_WASTES]: 6,
    [BIOMES.TWILIGHT_VEIL]: 8,
    [BIOMES.TUNDRA]: 4,
    [BIOMES.SAVANNA]: 3,
    [BIOMES.RAINFOREST]: 5,
    [BIOMES.CORAL_REEF]: 4,
    [BIOMES.ALPINE]: 5,
    [BIOMES.NEON_GRID]: 6,
    [BIOMES.CANDY_KINGDOM]: 3,
    [BIOMES.MONOCHROME]: 5,
    [BIOMES.PASTEL_DREAM]: 4,
    [BIOMES.CORRUPTED_SANCTUARY]: 7,
    [BIOMES.ANCIENT_TECH]: 6,
    [BIOMES.FUNGAL_NETWORK]: 5,
    [BIOMES.QUANTUM_FLUX]: 9
};

export default ZONE_DENSITIES;