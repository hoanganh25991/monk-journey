/**
 * Configuration settings for terrain generation and rendering
 */
export const TERRAIN_CONFIG = {
    // Base terrain properties
    size: 0, // Base terrain size
    resolution: 1, // Base terrain resolution
    height: 4, // Maximum terrain height
    
    // Terrain chunk properties
    chunkSize: 16, // Size of each terrain chunk: original "16"
    chunkViewDistance: 8, // How far forward: add "4"
    
    // Terrain buffering properties
    bufferDistance: 1, // Buffer in-memory: smooth moving
}