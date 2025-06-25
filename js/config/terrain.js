/**
 * Configuration settings for terrain generation and rendering
 */
export const TERRAIN_CONFIG = {
    // Base terrain properties
    size: 1000, // Base terrain size (fixed from 0)
    resolution: 32, // Base terrain resolution (fixed from 1)
    height: 10, // Maximum terrain height (increased from 4)
    
    // Terrain chunk properties
    chunkSize: 64, // Size of each terrain chunk (increased from 16)
    chunkViewDistance: 3, // Reduced from 5 to 3 to improve performance
    
    // Terrain buffering properties
    bufferDistance: 5, // Reduced from 12 for better performance
    
    // Terrain caching properties
    cache: {
        maxCachedChunks: 100, // Maximum number of chunks to keep in memory
        saveToLocalStorage: true, // Whether to save terrain to localStorage
        localStorageKey: 'monk_journey_terrain_cache'
    }
};