import {ZONE_TYPES} from './zone.js';
import {ENVIRONMENT_OBJECTS} from './environment.js';
import {STRUCTURE_OBJECTS} from './structure.js';
import {ZONE_COLORS} from './colors.js';

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
    TERRANT: 1.0,  // Default environment density for Terrant
    FOREST: 1.5,   // Reduced from 2.5
    DESERT: 1.0,   // Reduced from 1.8
    MOUNTAIN: 1.2, // Reduced from 2.0
    SWAMP: 1.8,    // Reduced from 3.0
    MAGICAL: 1.5   // Reduced from 2.5
};

/**
 * Zone-specific structure density values
 */
export const ZONE_STRUCTURE_DENSITY = {
    TERRANT: 0.3,  // Default structure density for Terrant
    FOREST: 0.25,  // Reduced from 0.4
    DESERT: 0.2,   // Reduced from 0.35
    MOUNTAIN: 0.18, // Reduced from 0.3
    SWAMP: 0.25,   // Reduced from 0.4
    MAGICAL: 0.25  // Reduced from 0.45
};

/**
 * Zone definitions with positions and radii
 * These define the physical layout of zones in the world
 */
export const ZONE_DEFINITIONS = [
    // Central Terrant zone (starting area)
    {
        name: ZONE_TYPES.TERRANT,
        center: { x: 0, y: 0, z: 0 },
        radius: 150,
        color: ZONE_COLORS.Terrant.soil
    },
    // Four cardinal direction zones
    {
        name: ZONE_TYPES.FOREST,
        center: { x: 200, y: 0, z: 0 },
        radius: 120,
        color: ZONE_COLORS.Forest.foliage
    },
    {
        name: ZONE_TYPES.DESERT,
        center: { x: -200, y: 0, z: 0 },
        radius: 120,
        color: ZONE_COLORS.Desert.sand
    },
    {
        name: ZONE_TYPES.MOUNTAIN,
        center: { x: 0, y: 0, z: 200 },
        radius: 120,
        color: ZONE_COLORS.Mountains.ice
    },
    {
        name: ZONE_TYPES.SWAMP,
        center: { x: 0, y: 0, z: -200 },
        radius: 120,
        color: ZONE_COLORS.Swamp.vegetation
    }
];

export const ZONE_DENSITIES = {
    [ZONE_TYPES.TERRANT]: {
        environment: ZONE_ENVIRONMENT_DENSITY.TERRANT,
        structures: ZONE_STRUCTURE_DENSITY.TERRANT,
        environmentTypes: [
            ENVIRONMENT_OBJECTS.TREE,
            ENVIRONMENT_OBJECTS.BUSH,
            ENVIRONMENT_OBJECTS.FLOWER,
            ENVIRONMENT_OBJECTS.TALL_GRASS,
            ENVIRONMENT_OBJECTS.SMALL_PLANT,
            ENVIRONMENT_OBJECTS.STONE_CIRCLE
        ],
        structureTypes: [
            STRUCTURE_OBJECTS.VILLAGE,
            STRUCTURE_OBJECTS.HOUSE,
            STRUCTURE_OBJECTS.TOWER,
            STRUCTURE_OBJECTS.TEMPLE,
            STRUCTURE_OBJECTS.TAVERN,
            STRUCTURE_OBJECTS.SHOP,
            STRUCTURE_OBJECTS.BRIDGE
        ]
    },
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
            ENVIRONMENT_OBJECTS.SMALL_MUSHROOM,
            ENVIRONMENT_OBJECTS.STUMP,
            ENVIRONMENT_OBJECTS.MUSHROOM_CLUSTER,
            ENVIRONMENT_OBJECTS.GIANT_MUSHROOM,
            ENVIRONMENT_OBJECTS.FOREST_SHRINE,
            ENVIRONMENT_OBJECTS.TREEHOUSE,
            ENVIRONMENT_OBJECTS.FAIRY_CIRCLE,
            ENVIRONMENT_OBJECTS.MAGICAL_FLOWER,
            ENVIRONMENT_OBJECTS.GLOWING_FLOWERS,
            ENVIRONMENT_OBJECTS.RARE_PLANT,
            ENVIRONMENT_OBJECTS.SMALL_PLANT,
            ENVIRONMENT_OBJECTS.STONE_CIRCLE,
            ENVIRONMENT_OBJECTS.OVERGROWN_RUIN
        ],
        structureTypes: [
            STRUCTURE_OBJECTS.RUINS,
            STRUCTURE_OBJECTS.VILLAGE,
            STRUCTURE_OBJECTS.HOUSE,
            STRUCTURE_OBJECTS.TOWER,
            STRUCTURE_OBJECTS.TEMPLE,
            STRUCTURE_OBJECTS.ALTAR,
            STRUCTURE_OBJECTS.TAVERN,
            STRUCTURE_OBJECTS.SHOP,
            STRUCTURE_OBJECTS.BRIDGE
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
            ENVIRONMENT_OBJECTS.OBSIDIAN,
            ENVIRONMENT_OBJECTS.EMBER_VENT,
            ENVIRONMENT_OBJECTS.OBSIDIAN_FORMATION,
            ENVIRONMENT_OBJECTS.LAVA,
            ENVIRONMENT_OBJECTS.ANCIENT_STONE,
            ENVIRONMENT_OBJECTS.FORGOTTEN_STATUE,
            ENVIRONMENT_OBJECTS.SHRINE,
            ENVIRONMENT_OBJECTS.STATUE_FRAGMENT,
            ENVIRONMENT_OBJECTS.BROKEN_COLUMN,
            ENVIRONMENT_OBJECTS.ANCIENT_ALTAR
        ],
        structureTypes: [
            STRUCTURE_OBJECTS.RUINS,
            STRUCTURE_OBJECTS.TEMPLE,
            STRUCTURE_OBJECTS.ALTAR,
            STRUCTURE_OBJECTS.HOUSE,
            STRUCTURE_OBJECTS.TOWER,
            STRUCTURE_OBJECTS.FORTRESS,
            STRUCTURE_OBJECTS.VILLAGE
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
            ENVIRONMENT_OBJECTS.TREE,
            ENVIRONMENT_OBJECTS.ICE_FORMATION,
            ENVIRONMENT_OBJECTS.CRYSTAL_OUTCROP,
            ENVIRONMENT_OBJECTS.MOUNTAIN_CAVE,
            ENVIRONMENT_OBJECTS.MOUNTAIN_PASS,
            ENVIRONMENT_OBJECTS.WATERFALL,
            ENVIRONMENT_OBJECTS.CRYSTAL_FORMATION,
            ENVIRONMENT_OBJECTS.SMALL_CRYSTAL,
            ENVIRONMENT_OBJECTS.STONE_CIRCLE
        ],
        structureTypes: [
            STRUCTURE_OBJECTS.RUINS,
            STRUCTURE_OBJECTS.FORTRESS,
            STRUCTURE_OBJECTS.TOWER,
            STRUCTURE_OBJECTS.MOUNTAIN,
            STRUCTURE_OBJECTS.HOUSE,
            STRUCTURE_OBJECTS.ALTAR,
            STRUCTURE_OBJECTS.BRIDGE,
            STRUCTURE_OBJECTS.TEMPLE
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
            ENVIRONMENT_OBJECTS.MUSHROOM,
            ENVIRONMENT_OBJECTS.SWAMP_LIGHT,
            ENVIRONMENT_OBJECTS.GIANT_MUSHROOM,
            ENVIRONMENT_OBJECTS.BOG_PIT,
            ENVIRONMENT_OBJECTS.WATER,
            ENVIRONMENT_OBJECTS.MUSHROOM_CLUSTER,
            ENVIRONMENT_OBJECTS.SMALL_MUSHROOM,
            ENVIRONMENT_OBJECTS.MAGICAL_STONE,
            ENVIRONMENT_OBJECTS.RUNE_STONE
        ],
        structureTypes: [
            STRUCTURE_OBJECTS.RUINS,
            STRUCTURE_OBJECTS.DARK_SANCTUM,
            STRUCTURE_OBJECTS.ALTAR,
            STRUCTURE_OBJECTS.HOUSE,
            STRUCTURE_OBJECTS.TOWER,
            STRUCTURE_OBJECTS.BRIDGE,
            STRUCTURE_OBJECTS.TEMPLE
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
            ENVIRONMENT_OBJECTS.MAGIC_CIRCLE,
            ENVIRONMENT_OBJECTS.SMALL_CRYSTAL,
            ENVIRONMENT_OBJECTS.CRYSTAL_OUTCROP,
            ENVIRONMENT_OBJECTS.MAGICAL_FLOWER,
            ENVIRONMENT_OBJECTS.ANCIENT_ALTAR,
            ENVIRONMENT_OBJECTS.FORGOTTEN_STATUE,
            ENVIRONMENT_OBJECTS.SHRINE,
            ENVIRONMENT_OBJECTS.STONE_CIRCLE,
            ENVIRONMENT_OBJECTS.ANCIENT_STONE
        ],
        structureTypes: [
            STRUCTURE_OBJECTS.RUINS,
            STRUCTURE_OBJECTS.TEMPLE,
            STRUCTURE_OBJECTS.ALTAR,
            STRUCTURE_OBJECTS.TOWER,
            STRUCTURE_OBJECTS.DARK_SANCTUM,
            STRUCTURE_OBJECTS.FORTRESS,
            STRUCTURE_OBJECTS.VILLAGE
        ]
    }
}

export default {
    DENSITY_LEVELS,
    ZONE_ENVIRONMENT_DENSITY,
    ZONE_STRUCTURE_DENSITY,
    ZONE_DEFINITIONS,
    ZONE_DENSITIES
};
