/**
 * Environment Configuration
 * 
 * This file centralizes all environment object definitions used across the application.
 * It provides a single source of truth for environment object types, their properties,
 * and their relationships to different biomes/themes.
 */

/**
 * Environment objects dictionary
 * A single source of truth for all environment object string literals
 */
export const ENVIRONMENT_OBJECTS = {
    // Water and liquid features
    WATER: 'water',
    LAVA: 'lava',
    WATERFALL: 'waterfall',
    
    // Crystal and magical formations
    CRYSTAL_FORMATION: 'crystal_formation',
    SMALL_CRYSTAL: 'small_crystal',
    MAGICAL_STONE: 'magical_stone',
    
    // Plants and vegetation
    RARE_PLANT: 'rare_plant',
    MOSS: 'moss',
    TREE: 'tree',
    BUSH: 'bush',
    FLOWER: 'flower',
    MAGICAL_FLOWER: 'magical_flower',
    TALL_GRASS: 'tall_grass',
    ANCIENT_TREE: 'ancient_tree',
    FERN: 'fern',
    BERRY_BUSH: 'berry_bush',
    PINE_TREE: 'pine_tree',
    ALPINE_FLOWER: 'alpine_flower',
    DESERT_PLANT: 'desert_plant',
    SWAMP_PLANT: 'swamp_plant',
    SWAMP_TREE: 'swamp_tree',
    SMALL_PLANT: 'small_plant',
    FOREST_DEBRIS: 'forest_debris',
    SMALL_MUSHROOM: 'small_mushroom',
    FOREST_FLOWER: 'forest_flower',
    GLOWING_FLOWERS: 'glowing_flowers',
    
    // Desert features
    OASIS: 'oasis',
    DESERT_SHRINE: 'desert_shrine',
    LAVA_ROCK: 'lava_rock',
    OBSIDIAN: 'obsidian',
    EMBER_VENT: 'ember_vent',
    ASH_PILE: 'ash_pile',
    
    // Rock formations
    OBSIDIAN_FORMATION: 'obsidian_formation',
    ROCK: 'rock',
    MOUNTAIN_ROCK: 'mountain_rock',
    ROCK_FORMATION: 'rock_formation',
    STONE_CIRCLE: 'stone_circle',
    
    // Water features
    LILY_PAD: 'lily_pad',
    BOG_PIT: 'bog_pit',
    
    // Magical features
    FAIRY_CIRCLE: 'fairy_circle',
    GLOWING_MUSHROOM: 'glowing_mushroom',
    SWAMP_LIGHT: 'swamp_light',
    RUNE_STONE: 'rune_stone',
    MAGIC_CIRCLE: 'magic_circle',
    ICE_SHARD: 'ice_shard',
    MYSTERIOUS_PORTAL: 'mysterious_portal',
    
    // Artifacts and special objects
    ANCIENT_ARTIFACT: 'ancient_artifact',
    ANCIENT_STONE: 'ancient_stone',
    ANCIENT_ALTAR: 'ancient_altar',
    FORGOTTEN_STATUE: 'forgotten_statue',
    
    // Terrain features
    TREE_CLUSTER: 'tree_cluster',
    SMALL_PEAK: 'small_peak',
    SNOW_PATCH: 'snow_patch',
    MOUNTAIN_PASS: 'mountain_pass',
    
    // Fungi
    MUSHROOM: 'mushroom',
    MUSHROOM_CLUSTER: 'mushroom_cluster',
    GIANT_MUSHROOM: 'giant_mushroom',
    
    // Ruins and structures
    BROKEN_COLUMN: 'broken_column',
    STATUE_FRAGMENT: 'statue_fragment',
    OVERGROWN_RUIN: 'overgrown_ruin',
    SHRINE: 'shrine',
    FOREST_SHRINE: 'forest_shrine',
    TREEHOUSE: 'treehouse',
    
    // Village and urban features
    MARKET: 'market',
    SQUARE: 'square',
    PLAZA: 'plaza',
    STAIRS: 'stairs',
    WELL: 'well',
    STATUE: 'statue',
    FOUNTAIN: 'fountain',
    
    // Miscellaneous
    FALLEN_LOG: 'fallen_log',
    STUMP: 'stump',
    SWAMP_DEBRIS: 'swamp_debris',
    ICE_FORMATION: 'ice_formation',
    CRYSTAL_OUTCROP: 'crystal_outcrop',
    MOUNTAIN_CAVE: 'mountain_cave'
};

/**
 * Theme-specific scattered objects
 * Used in getThemeSpecificScatteredObjects method
 */
export const THEME_SPECIFIC_OBJECTS = {
    // Common objects for all themes
    COMMON: [
        { type: ENVIRONMENT_OBJECTS.ROCK, minSize: 0.4, maxSize: 1.2, weight: 5, variants: 5, canCluster: true, canGlow: false },
        { type: ENVIRONMENT_OBJECTS.BUSH, minSize: 0.5, maxSize: 1.5, weight: 5, variants: 3, canCluster: true, canGlow: false },
        { type: ENVIRONMENT_OBJECTS.FLOWER, minSize: 0.3, maxSize: 0.8, weight: 4, variants: 6, canCluster: true, canGlow: true },
        { type: ENVIRONMENT_OBJECTS.TALL_GRASS, minSize: 0.4, maxSize: 1.0, weight: 4, variants: 3, canCluster: true, canGlow: false },
        { type: ENVIRONMENT_OBJECTS.SMALL_PLANT, minSize: 0.3, maxSize: 0.9, weight: 3, variants: 4, canCluster: true, canGlow: false }
    ],
    
    // Forest biome specific objects
    FOREST: [
        { type: ENVIRONMENT_OBJECTS.TREE, minSize: 0.8, maxSize: 2.0, weight: 8, variants: 5, canCluster: false, canGlow: false },
        { type: ENVIRONMENT_OBJECTS.STUMP, minSize: 0.5, maxSize: 1.2, weight: 3, variants: 3, canCluster: false, canGlow: false },
        { type: ENVIRONMENT_OBJECTS.FERN, minSize: 0.4, maxSize: 1.0, weight: 4, variants: 3, canCluster: true, canGlow: false },
        { type: ENVIRONMENT_OBJECTS.MUSHROOM, minSize: 0.3, maxSize: 0.7, weight: 5, variants: 4, canCluster: true, canGlow: true },
        { type: ENVIRONMENT_OBJECTS.SMALL_MUSHROOM, minSize: 0.2, maxSize: 0.5, weight: 6, variants: 5, canCluster: true, canGlow: true },
        { type: ENVIRONMENT_OBJECTS.FOREST_FLOWER, minSize: 0.3, maxSize: 0.8, weight: 5, variants: 6, canCluster: true, canGlow: false },
        { type: ENVIRONMENT_OBJECTS.GLOWING_FLOWERS, minSize: 0.4, maxSize: 1.0, weight: 2, variants: 3, canCluster: true, canGlow: true },
        { type: ENVIRONMENT_OBJECTS.FOREST_DEBRIS, minSize: 0.4, maxSize: 0.9, weight: 3, variants: 3, canCluster: false, canGlow: false },
        { type: ENVIRONMENT_OBJECTS.BERRY_BUSH, minSize: 0.5, maxSize: 1.2, weight: 3, variants: 2, canCluster: true, canGlow: false }
    ],
    
    // Mountain biome specific objects
    MOUNTAINS: [
        { type: ENVIRONMENT_OBJECTS.SNOW_PATCH, minSize: 0.6, maxSize: 1.8, weight: 6, variants: 3, canCluster: true, canGlow: false },
        { type: ENVIRONMENT_OBJECTS.ICE_SHARD, minSize: 0.5, maxSize: 1.5, weight: 4, variants: 3, canCluster: true, canGlow: true },
        { type: ENVIRONMENT_OBJECTS.MOUNTAIN_ROCK, minSize: 0.7, maxSize: 2.0, weight: 7, variants: 4, canCluster: true, canGlow: false },
        { type: ENVIRONMENT_OBJECTS.PINE_TREE, minSize: 0.8, maxSize: 2.2, weight: 5, variants: 3, canCluster: false, canGlow: false },
        { type: ENVIRONMENT_OBJECTS.ALPINE_FLOWER, minSize: 0.3, maxSize: 0.6, weight: 3, variants: 4, canCluster: true, canGlow: false }
    ],
    
    // Desert biome specific objects
    DESERT: [
        { type: ENVIRONMENT_OBJECTS.LAVA_ROCK, minSize: 0.5, maxSize: 1.5, weight: 6, variants: 3, canCluster: true, canGlow: true },
        { type: ENVIRONMENT_OBJECTS.OBSIDIAN, minSize: 0.4, maxSize: 1.2, weight: 4, variants: 2, canCluster: true, canGlow: false },
        { type: ENVIRONMENT_OBJECTS.EMBER_VENT, minSize: 0.3, maxSize: 0.8, weight: 3, variants: 2, canCluster: false, canGlow: true },
        { type: ENVIRONMENT_OBJECTS.ASH_PILE, minSize: 0.5, maxSize: 1.3, weight: 5, variants: 3, canCluster: true, canGlow: false },
        { type: ENVIRONMENT_OBJECTS.DESERT_PLANT, minSize: 0.4, maxSize: 1.0, weight: 3, variants: 3, canCluster: false, canGlow: false }
    ],
    
    // Swamp biome specific objects
    SWAMP: [
        { type: ENVIRONMENT_OBJECTS.SWAMP_PLANT, minSize: 0.5, maxSize: 1.4, weight: 6, variants: 4, canCluster: true, canGlow: false },
        { type: ENVIRONMENT_OBJECTS.LILY_PAD, minSize: 0.4, maxSize: 1.0, weight: 5, variants: 3, canCluster: true, canGlow: false },
        { type: ENVIRONMENT_OBJECTS.SWAMP_TREE, minSize: 0.8, maxSize: 2.0, weight: 4, variants: 3, canCluster: false, canGlow: false },
        { type: ENVIRONMENT_OBJECTS.GLOWING_MUSHROOM, minSize: 0.3, maxSize: 0.8, weight: 3, variants: 4, canCluster: true, canGlow: true },
        { type: ENVIRONMENT_OBJECTS.SWAMP_DEBRIS, minSize: 0.5, maxSize: 1.2, weight: 4, variants: 3, canCluster: false, canGlow: false }
    ],
    
    // Ruins biome specific objects
    RUINS: [
        { type: ENVIRONMENT_OBJECTS.BROKEN_COLUMN, minSize: 0.6, maxSize: 1.8, weight: 6, variants: 4, canCluster: true, canGlow: false },
        { type: ENVIRONMENT_OBJECTS.STATUE_FRAGMENT, minSize: 0.4, maxSize: 1.2, weight: 5, variants: 5, canCluster: true, canGlow: false },
        { type: ENVIRONMENT_OBJECTS.ANCIENT_STONE, minSize: 0.5, maxSize: 1.5, weight: 4, variants: 3, canCluster: true, canGlow: true },
        { type: ENVIRONMENT_OBJECTS.OVERGROWN_RUIN, minSize: 0.7, maxSize: 2.0, weight: 5, variants: 3, canCluster: false, canGlow: false },
        { type: ENVIRONMENT_OBJECTS.RUNE_STONE, minSize: 0.4, maxSize: 1.0, weight: 3, variants: 4, canCluster: false, canGlow: true }
    ],
    
    // Terrant (default) biome specific objects
    TERRANT: [
        { type: ENVIRONMENT_OBJECTS.ROCK, minSize: 0.4, maxSize: 1.2, weight: 6, variants: 4, canCluster: true, canGlow: false },
        { type: ENVIRONMENT_OBJECTS.BUSH, minSize: 0.5, maxSize: 1.3, weight: 5, variants: 3, canCluster: true, canGlow: false },
        { type: ENVIRONMENT_OBJECTS.FLOWER, minSize: 0.3, maxSize: 0.7, weight: 4, variants: 5, canCluster: true, canGlow: false },
        { type: ENVIRONMENT_OBJECTS.TALL_GRASS, minSize: 0.4, maxSize: 1.0, weight: 7, variants: 3, canCluster: true, canGlow: false },
        { type: ENVIRONMENT_OBJECTS.TREE, minSize: 0.8, maxSize: 1.8, weight: 3, variants: 4, canCluster: false, canGlow: false }
    ]
};

/**
 * Cross-theme features
 * Used in generateCrossThemeFeatures method
 */
export const CROSS_THEME_FEATURES = {
    FOREST: [
        ENVIRONMENT_OBJECTS.ANCIENT_TREE,
        ENVIRONMENT_OBJECTS.FAIRY_CIRCLE,
        ENVIRONMENT_OBJECTS.MUSHROOM_CLUSTER,
        ENVIRONMENT_OBJECTS.FOREST_SHRINE,
        ENVIRONMENT_OBJECTS.TREEHOUSE
    ],
    
    MOUNTAINS: [
        ENVIRONMENT_OBJECTS.ICE_FORMATION,
        ENVIRONMENT_OBJECTS.CRYSTAL_OUTCROP,
        ENVIRONMENT_OBJECTS.MOUNTAIN_CAVE
    ],
    
    DESERT: [
        ENVIRONMENT_OBJECTS.OASIS,
        ENVIRONMENT_OBJECTS.OBSIDIAN_FORMATION,
        ENVIRONMENT_OBJECTS.DESERT_SHRINE
    ],
    
    SWAMP: [
        ENVIRONMENT_OBJECTS.SWAMP_LIGHT,
        ENVIRONMENT_OBJECTS.GIANT_MUSHROOM,
        ENVIRONMENT_OBJECTS.BOG_PIT
    ],
    
    RUINS: [
        ENVIRONMENT_OBJECTS.ANCIENT_ALTAR,
        ENVIRONMENT_OBJECTS.FORGOTTEN_STATUE,
        ENVIRONMENT_OBJECTS.MAGIC_CIRCLE
    ],
    
    TERRANT: [
        ENVIRONMENT_OBJECTS.ROCK_FORMATION,
        ENVIRONMENT_OBJECTS.SMALL_PEAK,
        ENVIRONMENT_OBJECTS.SHRINE
    ]
};

/**
 * Background object types
 * Used in determineBackgroundObjectType method
 */
export const BACKGROUND_OBJECT_TYPES = {
    COMMON: [
        ENVIRONMENT_OBJECTS.TREE,
        ENVIRONMENT_OBJECTS.ROCK,
        ENVIRONMENT_OBJECTS.BUSH,
        ENVIRONMENT_OBJECTS.SMALL_PLANT
    ],
    
    FOREST: [
        ENVIRONMENT_OBJECTS.TREE,
        ENVIRONMENT_OBJECTS.FALLEN_LOG,
        ENVIRONMENT_OBJECTS.MUSHROOM,
        ENVIRONMENT_OBJECTS.SMALL_MUSHROOM,
        ENVIRONMENT_OBJECTS.FOREST_FLOWER
    ],
    
    MOUNTAINS: [
        ENVIRONMENT_OBJECTS.PINE_TREE,
        ENVIRONMENT_OBJECTS.ROCK,
        ENVIRONMENT_OBJECTS.SNOW_PATCH
    ],
    
    DESERT: [
        ENVIRONMENT_OBJECTS.DESERT_PLANT,
        ENVIRONMENT_OBJECTS.LAVA_ROCK,
        ENVIRONMENT_OBJECTS.ASH_PILE
    ],
    
    SWAMP: [
        ENVIRONMENT_OBJECTS.SWAMP_TREE,
        ENVIRONMENT_OBJECTS.SWAMP_PLANT,
        ENVIRONMENT_OBJECTS.GLOWING_MUSHROOM
    ],
    
    RUINS: [
        ENVIRONMENT_OBJECTS.OVERGROWN_RUIN,
        ENVIRONMENT_OBJECTS.BROKEN_COLUMN,
        ENVIRONMENT_OBJECTS.ANCIENT_STONE
    ],
    
    TERRANT: [
        ENVIRONMENT_OBJECTS.TREE,
        ENVIRONMENT_OBJECTS.ROCK,
        ENVIRONMENT_OBJECTS.BUSH,
        ENVIRONMENT_OBJECTS.TALL_GRASS
    ]
};

/**
 * Environment object categories
 * Useful for grouping similar objects
 */
export const ENVIRONMENT_CATEGORIES = {
    VEGETATION: [
        ENVIRONMENT_OBJECTS.TREE,
        ENVIRONMENT_OBJECTS.BUSH,
        ENVIRONMENT_OBJECTS.FLOWER,
        ENVIRONMENT_OBJECTS.TALL_GRASS,
        ENVIRONMENT_OBJECTS.ANCIENT_TREE,
        ENVIRONMENT_OBJECTS.RARE_PLANT,
        ENVIRONMENT_OBJECTS.MOSS,
        ENVIRONMENT_OBJECTS.SMALL_PLANT,
        ENVIRONMENT_OBJECTS.FERN,
        ENVIRONMENT_OBJECTS.BERRY_BUSH,
        ENVIRONMENT_OBJECTS.PINE_TREE,
        ENVIRONMENT_OBJECTS.ALPINE_FLOWER,
        ENVIRONMENT_OBJECTS.DESERT_PLANT,
        ENVIRONMENT_OBJECTS.SWAMP_PLANT,
        ENVIRONMENT_OBJECTS.SWAMP_TREE,
        ENVIRONMENT_OBJECTS.OVERGROWN_RUIN,
        ENVIRONMENT_OBJECTS.FOREST_FLOWER,
        ENVIRONMENT_OBJECTS.GLOWING_FLOWERS
    ],
    
    ROCKS: [
        ENVIRONMENT_OBJECTS.ROCK,
        ENVIRONMENT_OBJECTS.ROCK_FORMATION,
        ENVIRONMENT_OBJECTS.MOUNTAIN_ROCK,
        ENVIRONMENT_OBJECTS.LAVA_ROCK,
        ENVIRONMENT_OBJECTS.OBSIDIAN,
        ENVIRONMENT_OBJECTS.ANCIENT_STONE,
        ENVIRONMENT_OBJECTS.BROKEN_COLUMN,
        ENVIRONMENT_OBJECTS.STATUE_FRAGMENT
    ],
    
    WATER: [
        ENVIRONMENT_OBJECTS.WATER,
        ENVIRONMENT_OBJECTS.WATERFALL,
        ENVIRONMENT_OBJECTS.LILY_PAD,
        ENVIRONMENT_OBJECTS.BOG_PIT
    ],
    
    MAGICAL: [
        ENVIRONMENT_OBJECTS.CRYSTAL_FORMATION,
        ENVIRONMENT_OBJECTS.MAGICAL_STONE,
        ENVIRONMENT_OBJECTS.FAIRY_CIRCLE,
        ENVIRONMENT_OBJECTS.GLOWING_MUSHROOM,
        ENVIRONMENT_OBJECTS.GLOWING_FLOWERS,
        ENVIRONMENT_OBJECTS.SWAMP_LIGHT,
        ENVIRONMENT_OBJECTS.RUNE_STONE,
        ENVIRONMENT_OBJECTS.MAGIC_CIRCLE,
        ENVIRONMENT_OBJECTS.MYSTERIOUS_PORTAL
    ],
    
    STRUCTURES: [
        ENVIRONMENT_OBJECTS.SHRINE,
        ENVIRONMENT_OBJECTS.DESERT_SHRINE,
        ENVIRONMENT_OBJECTS.FOREST_SHRINE,
        ENVIRONMENT_OBJECTS.ANCIENT_ALTAR,
        ENVIRONMENT_OBJECTS.FORGOTTEN_STATUE,
        ENVIRONMENT_OBJECTS.TREEHOUSE
    ],
    
    FUNGI: [
        ENVIRONMENT_OBJECTS.MUSHROOM,
        ENVIRONMENT_OBJECTS.SMALL_MUSHROOM,
        ENVIRONMENT_OBJECTS.MUSHROOM_CLUSTER,
        ENVIRONMENT_OBJECTS.GIANT_MUSHROOM,
        ENVIRONMENT_OBJECTS.GLOWING_MUSHROOM
    ]
};

export default {
    ENVIRONMENT_OBJECTS,
    THEME_SPECIFIC_OBJECTS,
    CROSS_THEME_FEATURES,
    BACKGROUND_OBJECT_TYPES,
    ENVIRONMENT_CATEGORIES
};