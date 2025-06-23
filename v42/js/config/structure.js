/**
 * Configuration for structure generation in the world
 */
export const STRUCTURE_CONFIG = {
    /**
     * Density values for different structure types on a scale of 1-100
     * 1 = extremely rare (need to explore far to find one)
     * 50 = moderate density (visible in most areas)
     * 100 = very common (multiple structures in each area)
     */
    structureDensityScale: {
        'house':       20, // Individual houses - somewhat common
        'tower':       40, // Watchtowers - visible from distance, moderately common
        'ruins':       20, // Ancient ruins - somewhat common
        'darkSanctum': 8,  // Dark sanctums - rare, special locations
        'mountain':    60, // Mountains - common, visible from distance
        'bridge':      8,  // Bridges - rare, only near water
        'village':     8   // Villages - rare, but contain multiple buildings
    },
    
    /**
     * Converts the user-friendly 1-100 scale to the actual density values used by the engine
     * These values are calculated automatically - DO NOT EDIT DIRECTLY
     */
    structureDensity: {
        // These values will be calculated at runtime based on structureDensityScale
    },
    
    /**
     * Minimum density value needed to generate at least one structure per chunk
     * This is based on the terrain chunk size of 16x16
     */
    minDensityPerChunk: 0.00390625
};