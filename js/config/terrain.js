/**
 * Configuration settings for terrain generation and rendering
 */
export const TERRAIN_CONFIG = {
    // Base terrain properties
    size: 1, // Base terrain size
    resolution: 2, // Base terrain resolution
    height: 4, // Maximum terrain height
    
    // Terrain chunk properties
    chunkSize: 16, // Size of each terrain chunk
    chunkViewDistance: 5, // Increased from 3 to 5 to improve visibility at distance
    
    // Terrain buffering properties
    bufferDistance: 5, // Distance beyond view distance to pre-generate terrain chunks
    
    // Debug/Testing properties
    debug: {
        enabled: false, // Enable debug mode for terrain
        transparent: false, // Make terrain transparent for testing underground objects
        wireframe: false, // Show terrain as wireframe
        opacity: 0.3, // Opacity when transparent (0.0 - 1.0)
        disableRendering: false // Completely disable terrain rendering
    },
    
    // Enhanced terrain features
    features: {
        // Height variation settings
        heightVariation: {
            enabled: true,
            scale: 1.0, // Overall scale of height variations
            largeFeatures: 0.8, // Scale of large terrain features (hills, valleys)
            mediumFeatures: 0.5, // Scale of medium terrain features (bumps, dips)
            smallFeatures: 0.3, // Scale of small terrain features (roughness)
            ridges: true, // Enable ridge formations
            plateaus: true // Enable plateau formations
        },
        
        // Texture and detail settings
        textures: {
            enabled: true,
            detailLevel: 2, // Level of texture detail (1-3)
            normalMapStrength: 1.0, // Strength of normal mapping
            roughnessVariation: true, // Enable roughness variation
            useProceduralTextures: true // Use procedural textures when image textures unavailable
        },
        
        // Color variation settings
        colorVariation: {
            enabled: true,
            microDetail: true, // Small color variations
            patches: true, // Enable terrain patches (grass tufts, rock outcrops)
            moistureEffects: true, // Enable moisture-based coloring
            weatheringEffects: true, // Enable weathering effects
            slopeColoring: true // Different colors on slopes
        }
    }
};