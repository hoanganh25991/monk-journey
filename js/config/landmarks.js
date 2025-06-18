/**
 * Landmark Configuration
 * 
 * This file centralizes all landmark definitions used across the application.
 * It provides a single source of truth for landmark types and their distributions across biomes.
 */

import { ENVIRONMENT_OBJECTS } from './environment.js';
import { STRUCTURE_TYPES } from './structure.js';
import { BIOMES } from './biomes.js';

/**
 * Landmark types based on environment and structure objects
 * Used to define significant points of interest in the world
 */
export const LANDMARK_TYPES = {
    // Environment-based landmarks
    ANCIENT_TREE: ENVIRONMENT_OBJECTS.ANCIENT_TREE,
    OASIS: ENVIRONMENT_OBJECTS.OASIS,
    MYSTERIOUS_PORTAL: ENVIRONMENT_OBJECTS.MYSTERIOUS_PORTAL,
    GIANT_MUSHROOM: ENVIRONMENT_OBJECTS.GIANT_MUSHROOM,
    CRYSTAL_FORMATION: ENVIRONMENT_OBJECTS.CRYSTAL_FORMATION,
    FAIRY_CIRCLE: ENVIRONMENT_OBJECTS.FAIRY_CIRCLE,
    ANCIENT_ALTAR: ENVIRONMENT_OBJECTS.ANCIENT_ALTAR,
    FORGOTTEN_STATUE: ENVIRONMENT_OBJECTS.FORGOTTEN_STATUE,
    MAGIC_CIRCLE: ENVIRONMENT_OBJECTS.MAGIC_CIRCLE,
    STONE_CIRCLE: ENVIRONMENT_OBJECTS.STONE_CIRCLE,
    MOUNTAIN_CAVE: ENVIRONMENT_OBJECTS.MOUNTAIN_CAVE,
    
    // Structure-based landmarks
    VILLAGE: STRUCTURE_TYPES.VILLAGE,
    TEMPLE: STRUCTURE_TYPES.TEMPLE,
    FORTRESS: STRUCTURE_TYPES.FORTRESS,
    DARK_SANCTUM: STRUCTURE_TYPES.DARK_SANCTUM,
    RUINS: STRUCTURE_TYPES.RUINS,
    MOUNTAIN_STRUCTURE: STRUCTURE_TYPES.MOUNTAIN
};

/**
 * Biome-specific landmark distributions
 * Defines which landmarks appear in each biome and their relative frequency
 */
export const BIOME_LANDMARKS = {
    [BIOMES.FOREST]: [
        { type: LANDMARK_TYPES.ANCIENT_TREE, weight: 30 },
        { type: LANDMARK_TYPES.VILLAGE, weight: 25 },
        { type: LANDMARK_TYPES.FAIRY_CIRCLE, weight: 15 },
        { type: LANDMARK_TYPES.TEMPLE, weight: 15 },
        { type: LANDMARK_TYPES.RUINS, weight: 10 },
        { type: LANDMARK_TYPES.STONE_CIRCLE, weight: 5 }
    ],
    [BIOMES.DESERT]: [
        { type: LANDMARK_TYPES.TEMPLE, weight: 30 },
        { type: LANDMARK_TYPES.OASIS, weight: 25 },
        { type: LANDMARK_TYPES.RUINS, weight: 20 },
        { type: LANDMARK_TYPES.ANCIENT_ALTAR, weight: 15 },
        { type: LANDMARK_TYPES.FORGOTTEN_STATUE, weight: 10 }
    ],
    [BIOMES.MOUNTAIN]: [
        { type: LANDMARK_TYPES.MOUNTAIN_STRUCTURE, weight: 30 },
        { type: LANDMARK_TYPES.FORTRESS, weight: 25 },
        { type: LANDMARK_TYPES.MOUNTAIN_CAVE, weight: 20 },
        { type: LANDMARK_TYPES.CRYSTAL_FORMATION, weight: 15 },
        { type: LANDMARK_TYPES.TEMPLE, weight: 10 }
    ],
    [BIOMES.SWAMP]: [
        { type: LANDMARK_TYPES.DARK_SANCTUM, weight: 30 },
        { type: LANDMARK_TYPES.RUINS, weight: 25 },
        { type: LANDMARK_TYPES.GIANT_MUSHROOM, weight: 20 },
        { type: LANDMARK_TYPES.MAGIC_CIRCLE, weight: 15 },
        { type: LANDMARK_TYPES.FORGOTTEN_STATUE, weight: 10 }
    ],
    [BIOMES.MAGICAL]: [
        { type: LANDMARK_TYPES.MYSTERIOUS_PORTAL, weight: 30 },
        { type: LANDMARK_TYPES.TEMPLE, weight: 25 },
        { type: LANDMARK_TYPES.CRYSTAL_FORMATION, weight: 20 },
        { type: LANDMARK_TYPES.FAIRY_CIRCLE, weight: 15 },
        { type: LANDMARK_TYPES.MAGIC_CIRCLE, weight: 10 }
    ]
};

export default {
    LANDMARK_TYPES,
    BIOME_LANDMARKS
};