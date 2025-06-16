/**
 * Renderer configuration for different quality levels
 * These settings are used by the PerformanceManager to adjust rendering quality
 * 
 * This file contains all quality-related configurations in one place:
 * - MATERIAL_QUALITY_LEVELS: Controls material and object quality settings
 * - FOG_CONFIG: Controls fog appearance and density for different quality levels
 * - RENDER_CONFIG: Controls renderer initialization and settings
 * 
 * Device targeting:
 * - high: Good desktop computers
 * - medium: Slower desktops and good tablets
 * - low: Tablets and mid-range mobile devices
 * - minimal: Any low-end device to achieve playable FPS
 * 
 * The quality level is stored in localStorage using the key 'monk_journey_quality_level'.
 */

/**
 * Material and object quality settings for different quality levels
 */
export const MATERIAL_QUALITY_LEVELS = {
    high: {
        shadowMapSize: 1024,
        particleCount: 0.8,
        drawDistance: 0.8,
        textureQuality: 0.8,
        objectDetail: 0.9,
        maxVisibleObjects: 500
    },
    medium: {
        shadowMapSize: 512,
        particleCount: 0.5,
        drawDistance: 0.6,
        textureQuality: 0.5,
        objectDetail: 0.6,
        maxVisibleObjects: 250
    },
    low: {
        shadowMapSize: 128, // Reduced from 256
        particleCount: 0.1, // Reduced from 0.2
        drawDistance: 0.2, // Reduced from 0.3
        textureQuality: 0.2, // Reduced from 0.3
        objectDetail: 0.3, // Reduced from 0.4
        maxVisibleObjects: 100, // Reduced from 150
        optimizedForLowEnd: true // Flag for additional optimizations
    },
    minimal: {
        shadowMapSize: 0,
        particleCount: 0.01, // Further reduced for 8-bit look
        drawDistance: 0.1, // Further reduced for 8-bit look
        textureQuality: 0.01, // Extremely low for pixelated textures
        objectDetail: 0.05, // Further reduced for simpler geometry
        maxVisibleObjects: 30, // Further reduced for performance
        is8BitMode: true // Flag to indicate 8-bit rendering mode
    }
};

export const FOG_CONFIG = {
    // Base fog settings
    enabled: true,
    type: 'exp2', // 'exp2' for exponential squared fog (more realistic), 'exp' for exponential, 'linear' for linear
    color: 0xF6C75B, // Lighter blue-gray color for a brighter atmosphere FFD39B F8D98D F6C75B E8C49A
    density: 0.0075 / 2, // Reduced base fog density for lighter atmosphere
    near: 10, // For linear fog only - increased distance where fog begins
    far: 50, // For linear fog only - increased distance where fog is fully opaque
    
    // Fog transition settings
    transitionSpeed: 0.05, // How quickly fog color transitions between zones
    
    // Distance-based fog settings
    distanceFalloff: 1.5, // Controls how quickly visibility drops with distance
    maxVisibleDistance: 150, // Maximum distance at which objects are still visible
    darkeningFactor: 0.7, // How much darker distant objects become (0-1)
    
    // Quality level adjustments - adjusted to maintain consistent brightness
    qualityMultipliers: {
        high: 0.9, // Slightly reduced fog density for high quality (better visibility)
        medium: 1.2, // Reduced from 1.5 to prevent darkening
        low: 1.5, // Reduced from 2.2 to prevent darkening
        minimal: 2.0 // Reduced from 6.0 to prevent excessive darkening while still improving performance
    }
};

export const RENDER_CONFIG = {
    // High quality - for good desktop computers
    high: {
        init: {
            antialias: true,
            powerPreference: 'high-performance',
            precision: 'highp',
            stencil: false,
            logarithmicDepthBuffer: false,
            depth: true,
            alpha: false
        },
        settings: {
            pixelRatio: Math.min(window.devicePixelRatio, 1.5),
            shadowMapEnabled: true,
            shadowMapType: 'PCFSoftShadowMap',
            outputColorSpace: 'SRGBColorSpace'
        }
    },
    
    // Medium quality - for slower desktops and good tablets
    medium: {
        init: {
            antialias: false,
            powerPreference: 'high-performance',
            precision: 'mediump',
            stencil: false,
            logarithmicDepthBuffer: false,
            depth: true,
            alpha: false
        },
        settings: {
            pixelRatio: Math.min(window.devicePixelRatio, 0.9),
            shadowMapEnabled: true,
            shadowMapType: 'PCFShadowMap',
            outputColorSpace: 'SRGBColorSpace'
        }
    },
    
    // Low quality - for tablets and mid-range mobile devices
    low: {
        init: {
            antialias: false,
            powerPreference: 'default',
            precision: 'lowp', // Changed from mediump for better performance
            stencil: false,
            logarithmicDepthBuffer: false,
            depth: true,
            alpha: false
        },
        settings: {
            pixelRatio: Math.min(window.devicePixelRatio, 0.5), // Reduced from 0.6
            shadowMapEnabled: false,
            shadowMapType: 'BasicShadowMap',
            outputColorSpace: 'LinearSRGBColorSpace', // Changed to linear for performance
            optimizedRendering: true // Flag for additional rendering optimizations
        }
    },
    
    // Minimal quality - for any low-end device to achieve playable FPS
    minimal: {
        init: {
            antialias: false,
            powerPreference: 'default', // Save battery on mobile
            precision: 'lowp',
            stencil: false,
            logarithmicDepthBuffer: false,
            depth: true,
            alpha: false
        },
        settings: {
            pixelRatio: 0.2, // Further reduced for more pixelated 8-bit look
            shadowMapEnabled: false,
            shadowMapType: 'BasicShadowMap',
            outputColorSpace: 'LinearSRGBColorSpace', // Linear for performance
            pixelatedMode: true, // New flag for 8-bit rendering
            colorPalette: 'limited', // Simulate limited color palette
            dithering: true // Enable dithering for retro look
        }
    }
};

/**
 * Combined configuration object that includes all quality-related settings
 * This is the recommended way to access all quality settings in one place
 */
export const COMBINED_QUALITY_CONFIG = {
    MATERIAL_QUALITY_LEVELS,
    RENDER_CONFIG,
    FOG_CONFIG
};
