/**
 * Biome Configuration
 * 
 * This file centralizes all biome definitions used across the application.
 * It provides a single source of truth for biome types and their string representations.
 */

/**
 * Biome constants for better code maintainability
 * Used throughout the application to reference different biome types
 */
export const BIOMES = {
    // Basic biomes
    TERRANT: 'Terrant',     // Default terrain type
    FOREST: 'Forest',
    DESERT: 'Desert',
    MOUNTAIN: 'Mountain',  // Note: This matches the 'Mountains' string used in TerrainColoringManager
    SWAMP: 'Swamp',
    RUINS: 'Ruins',
    DARK_SANCTUM: 'Dark Sanctum',
    MAGICAL: 'Magical',
    
    // Fantasy Realms
    ENCHANTED_GROVE: 'Enchanted Grove',
    CRYSTAL_CAVERNS: 'Crystal Caverns',
    CELESTIAL_REALM: 'Celestial Realm',
    VOLCANIC_WASTES: 'Volcanic Wastes',
    TWILIGHT_VEIL: 'Twilight Veil',
    
    // Realistic Biomes
    TUNDRA: 'Tundra',
    SAVANNA: 'Savanna',
    RAINFOREST: 'Rainforest',
    CORAL_REEF: 'Coral Reef',
    ALPINE: 'Alpine',
    
    // Abstract/Stylized
    NEON_GRID: 'Neon Grid',
    CANDY_KINGDOM: 'Candy Kingdom',
    MONOCHROME: 'Monochrome',
    PASTEL_DREAM: 'Pastel Dream',
    
    // Mixed Themes
    CORRUPTED_SANCTUARY: 'Corrupted Sanctuary',
    ANCIENT_TECH: 'Ancient Tech',
    FUNGAL_NETWORK: 'Fungal Network',
    QUANTUM_FLUX: 'Quantum Flux'
};

/**
 * Biome characteristics and properties
 * Defines the general characteristics of each biome type
 */
export const BIOME_PROPERTIES = {
    [BIOMES.TERRANT]: {
        elevation: 'medium',
        moisture: 'medium',
        temperature: 'moderate',
        vegetation: 'sparse',
        hostility: 'low',
        description: 'Default terrain with moderate characteristics'
    },
    [BIOMES.FOREST]: {
        elevation: 'low',
        moisture: 'high',
        temperature: 'moderate',
        vegetation: 'dense',
        hostility: 'low',
        description: 'Dense woodland with abundant vegetation'
    },
    [BIOMES.DESERT]: {
        elevation: 'low',
        moisture: 'very-low',
        temperature: 'hot',
        vegetation: 'very-sparse',
        hostility: 'medium',
        description: 'Arid landscape with minimal vegetation'
    },
    [BIOMES.MOUNTAIN]: {
        elevation: 'very-high',
        moisture: 'low',
        temperature: 'cold',
        vegetation: 'sparse',
        hostility: 'high',
        description: 'Elevated terrain with rocky formations and snow'
    },
    [BIOMES.SWAMP]: {
        elevation: 'very-low',
        moisture: 'very-high',
        temperature: 'warm',
        vegetation: 'dense',
        hostility: 'high',
        description: 'Waterlogged terrain with dense vegetation'
    },
    [BIOMES.RUINS]: {
        elevation: 'medium',
        moisture: 'medium',
        temperature: 'moderate',
        vegetation: 'medium',
        hostility: 'medium',
        description: 'Ancient structures reclaimed by nature'
    },
    [BIOMES.DARK_SANCTUM]: {
        elevation: 'medium',
        moisture: 'low',
        temperature: 'hot',
        vegetation: 'sparse',
        hostility: 'very-high',
        description: 'Corrupted area with dark energy'
    },
    [BIOMES.MAGICAL]: {
        elevation: 'medium',
        moisture: 'high',
        temperature: 'moderate',
        vegetation: 'dense',
        hostility: 'medium',
        description: 'Area infused with magical energy'
    }
    // Additional biome properties can be added as needed
};

/**
 * Biome transition compatibility
 * Defines which biomes can naturally transition to others
 */
export const BIOME_TRANSITIONS = {
    [BIOMES.TERRANT]: [BIOMES.FOREST, BIOMES.DESERT, BIOMES.MOUNTAIN, BIOMES.SWAMP, BIOMES.RUINS],
    [BIOMES.FOREST]: [BIOMES.TERRANT, BIOMES.SWAMP, BIOMES.MOUNTAIN, BIOMES.RUINS, BIOMES.ENCHANTED_GROVE],
    [BIOMES.DESERT]: [BIOMES.TERRANT, BIOMES.MOUNTAIN, BIOMES.RUINS, BIOMES.VOLCANIC_WASTES],
    [BIOMES.MOUNTAIN]: [BIOMES.TERRANT, BIOMES.FOREST, BIOMES.DESERT, BIOMES.ALPINE, BIOMES.TUNDRA],
    [BIOMES.SWAMP]: [BIOMES.TERRANT, BIOMES.FOREST, BIOMES.DARK_SANCTUM, BIOMES.FUNGAL_NETWORK],
    [BIOMES.RUINS]: [BIOMES.TERRANT, BIOMES.FOREST, BIOMES.DESERT, BIOMES.MOUNTAIN, BIOMES.ANCIENT_TECH],
    [BIOMES.DARK_SANCTUM]: [BIOMES.SWAMP, BIOMES.RUINS, BIOMES.CORRUPTED_SANCTUARY],
    [BIOMES.MAGICAL]: [BIOMES.FOREST, BIOMES.ENCHANTED_GROVE, BIOMES.CRYSTAL_CAVERNS, BIOMES.CELESTIAL_REALM]
    // Additional transitions can be added as needed
};

export default BIOMES;