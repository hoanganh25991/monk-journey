/**
 * Renderer configuration for different quality levels
 * These settings are used by the PerformanceManager to adjust rendering quality
 */
export const FOG_CONFIG = {
    // Base fog settings
    enabled: true,
    type: 'exp2', // 'exp2' for exponential squared fog (more realistic), 'exp' for exponential, 'linear' for linear
    color: 0x8ab3d5, // Lighter blue-gray color for a brighter atmosphere
    density: 0.1 / 2 / 1.5 / 2.0, // Reduced base fog density for lighter atmosphere
    near: 10, // For linear fog only - increased distance where fog begins
    far: 50, // For linear fog only - increased distance where fog is fully opaque
    
    // Fog transition settings
    transitionSpeed: 0.05, // How quickly fog color transitions between zones
    
    // Distance-based fog settings

    // Quality level adjustments
    qualityMultipliers: {
        ultra: 0.9, // Reduced fog density for ultra quality
        high: 1.0, // Standard fog density for high quality
        medium: 1.2, // Slightly increased fog density for medium quality
        low: 1.5, // Increased fog density for low quality
        minimal: 2.0 // Significantly increased fog density for minimal quality
    }
};

export const RENDER_CONFIG = {
    // Ultra quality - for high-end devices
    ultra: {
        // WebGLRenderer initialization options
        init: {
            antialias: true,
            powerPreference: 'high-performance',
            precision: 'highp',
            stencil: false,
            logarithmicDepthBuffer: true,
            depth: true,
            alpha: false
        },
        // Post-initialization settings
        settings: {
            pixelRatio: window.devicePixelRatio,
            shadowMapEnabled: true,
            shadowMapType: 'PCFSoftShadowMap', // Better shadow quality
            outputColorSpace: 'SRGBColorSpace'
        }
    },
    
    // High quality - for good devices
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
            shadowMapType: 'PCFShadowMap',
            outputColorSpace: 'SRGBColorSpace'
        }
    },
    
    // Medium quality - for average devices
    medium: {
        init: {
            antialias: false, // Matches quality-levels.js (line 33)
            powerPreference: 'high-performance',
            precision: 'mediump',
            stencil: false,
            logarithmicDepthBuffer: false,
            depth: true,
            alpha: false
        },
        settings: {
            pixelRatio: Math.min(window.devicePixelRatio, 1.0),
            shadowMapEnabled: true,
            shadowMapType: 'PCFShadowMap',
            outputColorSpace: 'SRGBColorSpace'
        }
    },
    
    // Low quality - for lower-end devices
    low: {
        init: {
            antialias: false,
            powerPreference: 'high-performance', // Changed from 'default' to 'high-performance'
            precision: 'mediump',
            stencil: false,
            logarithmicDepthBuffer: false,
            depth: true,
            alpha: false
        },
        settings: {
            pixelRatio: Math.min(window.devicePixelRatio, 0.75),
            shadowMapEnabled: true,
            shadowMapType: 'BasicShadowMap',
            outputColorSpace: 'SRGBColorSpace'
        }
    },
    
    // Minimal quality - for very low-end devices
    minimal: {
        init: {
            antialias: false,
            powerPreference: 'high-performance', // Changed from 'default' to 'high-performance'
            precision: 'lowp',
            stencil: false,
            logarithmicDepthBuffer: false,
            depth: true,
            alpha: false
        },
        settings: {
            pixelRatio: 0.5,
            shadowMapEnabled: false,
            shadowMapType: 'BasicShadowMap',
            outputColorSpace: 'SRGBColorSpace'
        }
    }
};