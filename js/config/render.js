/**
 * Renderer configuration for different quality levels
 * These settings are used by the PerformanceManager to adjust rendering quality
 * 
 * This file combines all rendering and quality-related configurations in one place:
 * - FOG_CONFIG: Controls fog appearance and density for different quality levels
 * - RENDER_CONFIG: Controls renderer initialization and settings
 * - QUALITY_LEVELS: Imported from quality-levels.js for material and object quality settings
 */

import QUALITY_LEVELS from './quality-levels.js';
export const FOG_CONFIG = {
    // Base fog settings
    enabled: true,
    type: 'exp2', // 'exp2' for exponential squared fog (more realistic), 'exp' for exponential, 'linear' for linear
    color: 0xF6C75B, // Lighter blue-gray color for a brighter atmosphere FFD39B F8D98D F6C75B E8C49A
    density: 0.0075, // Reduced base fog density for lighter atmosphere
    near: 10, // For linear fog only - increased distance where fog begins
    far: 50, // For linear fog only - increased distance where fog is fully opaque
    
    // Fog transition settings
    transitionSpeed: 0.05, // How quickly fog color transitions between zones
    
    // Distance-based fog settings
    distanceFalloff: 1.5, // Controls how quickly visibility drops with distance
    maxVisibleDistance: 150, // Maximum distance at which objects are still visible
    darkeningFactor: 0.7, // How much darker distant objects become (0-1)
    
    // Quality level adjustments - higher values = more fog = fewer objects to render = better performance
    qualityMultipliers: {
        ultra: 0.8, // Reduced fog density for ultra quality (best visibility)
        high: 1.0, // Standard fog density for high quality
        medium: 1.5, // Moderately increased fog density for medium quality
        low: 2.2, // Significantly increased fog density for low quality (tablets)
        minimal: 3.0 // Very high fog density for minimal quality (low-end devices)
    }
};

export const RENDER_CONFIG = {
    // Ultra quality - for high-end desktops and powerful machines
    ultra: {
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
            pixelRatio: window.devicePixelRatio, // Full device pixel ratio
            shadowMapEnabled: true,
            shadowMapType: 'PCFSoftShadowMap',
            outputColorSpace: 'SRGBColorSpace'
        }
    },
    
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
            precision: 'mediump',
            stencil: false,
            logarithmicDepthBuffer: false,
            depth: true,
            alpha: false
        },
        settings: {
            pixelRatio: Math.min(window.devicePixelRatio, 0.6),
            shadowMapEnabled: false, // Disabled shadows for better performance
            shadowMapType: 'BasicShadowMap',
            outputColorSpace: 'SRGBColorSpace'
        }
    },
    
    // Minimal quality - for any low-end device to achieve playable FPS
    minimal: {
        init: {
            antialias: false,
            powerPreference: 'default', // Changed to 'default' to save battery on mobile
            precision: 'lowp',
            stencil: false,
            logarithmicDepthBuffer: false,
            depth: true,
            alpha: false
        },
        settings: {
            pixelRatio: 0.4, // Further reduced for maximum performance
            shadowMapEnabled: false,
            shadowMapType: 'BasicShadowMap',
            outputColorSpace: 'LinearSRGBColorSpace' // Changed to linear for performance
        }
    }
};

/**
 * Combined configuration object that includes all quality-related settings
 * This is the recommended way to access all quality settings in one place
 */
export const COMBINED_QUALITY_CONFIG = {
    QUALITY_LEVELS,
    RENDER_CONFIG,
    FOG_CONFIG
};