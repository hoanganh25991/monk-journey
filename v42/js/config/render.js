/**
 * Renderer configuration for different quality levels
 * These settings are used by the PerformanceManager to adjust rendering quality
 */
export const FOG_CONFIG = {
    // Base fog settings
    enabled: true,
    type: 'exp2', // 'exp2' for exponential squared fog (more realistic), 'exp' for exponential, 'linear' for linear
    color: 0x5a6d7e, // Darker blue-gray color for more atmospheric feel
    density: 0.1 / 2 / 1.5 / 1.5, // Increased base fog density for darker atmosphere
    near: 8, // For linear fog only - reduced distance where fog begins
    far: 40, // For linear fog only - reduced distance where fog is fully opaque
    
    // Fog transition settings
    transitionSpeed: 0.05, // How quickly fog color transitions between zones
    
    // Distance-based fog settings

    // Quality level adjustments
    qualityMultipliers: {
        ultra: 1.2, // Slightly increased fog density even at ultra quality
        high: 1.3, // Increased fog density for high quality
        medium: 1.5, // Increased fog density for medium quality
        low: 1.8, // Increased fog density for low quality
        minimal: 2.5 // Significantly increased fog density for minimal quality
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