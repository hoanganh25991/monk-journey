/**
 * Configuration settings for terrain generation and rendering
 */
export const TERRAIN_CONFIG = {
    // Base terrain properties
    size: 0, // Base terrain size
    resolution: 2, // Base terrain resolution
    height: 4, // Maximum terrain height
    
    // Terrain chunk properties
    chunkSize: 16, // Size of each terrain chunk
    chunkViewDistance: 3, // Reduced from 5 to 3 to improve performance
    
    // Terrain buffering properties
    bufferDistance: 2, // Reduced from 5 to 2 to improve performance
    
    // Debug/Testing properties
    debug: {
        enabled: false, // Enable debug mode for terrain
        transparent: false, // Make terrain transparent for testing underground objects
        wireframe: false, // Show terrain as wireframe
        opacity: 0.3, // Opacity when transparent (0.0 - 1.0)
        disableRendering: false // Completely disable terrain rendering
    },
};