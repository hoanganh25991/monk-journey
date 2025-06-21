/**
 * Configuration settings for terrain generation and rendering
 */
export const TERRAIN_CONFIG = {
    // Base terrain properties
    size: 0, // Base terrain size
    resolution: 1, // Base terrain resolution
    height: 4, // Maximum terrain height
    
    // Terrain chunk properties
    chunkSize: 16, // Size of each terrain chunk
    chunkViewDistance: 2, // Reduced from 5 to 3 to improve performance
    
    // Terrain buffering properties
    bufferDistance: 0, // Reduced from 5 to 2 to improve performance
};