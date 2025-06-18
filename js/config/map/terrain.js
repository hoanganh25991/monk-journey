/**
 * Configuration settings for terrain generation and rendering
 */
export const TERRAIN_CONFIG = {
    // Base terrain properties
    size: 1, // Base terrain size
    resolution: 2, // Base terrain resolution
    height: 10, // Maximum terrain height - increased for better visibility
    
    // Terrain chunk properties
    chunkSize: 16 * 4, // Size of each terrain chunk
    chunkViewDistance: 4,
    
    // Terrain buffering properties
    bufferDistance: 1,
    
    // Terrain noise settings
    noiseScale: 0.05, // Global scale for noise (smaller = larger features)
    noiseOctaves: 3,  // Number of noise octaves for detail
    noisePersistence: 0.5, // How much each octave contributes
    noiseAmplitude: 1.0, // Overall strength of the noise effect - increased for more pronounced terrain
};