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

export default {
    DENSITY_LEVELS,
    ZONE_ENVIRONMENT_DENSITY,
    ZONE_STRUCTURE_DENSITY
};