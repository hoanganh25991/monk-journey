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
    }
};

export default ZONE_DENSITIES;