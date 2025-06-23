/**
 * Quality level configurations for the game's rendering settings.
 * These settings control various aspects of the game's visual quality and performance.
 * 
 * Note: Renderer-specific settings like antialiasing, pixelRatio, and shadows
 * have been moved to render.js to avoid duplication.
 */
export const QUALITY_LEVELS = {
    ultra: {
        shadowMapSize: 2048,
        particleCount: 1.0,
        drawDistance: 1.0,
        textureQuality: 1.0,
        objectDetail: 1.0,
        maxVisibleObjects: Infinity
    },
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
        drawDistance: 0.5,
        textureQuality: 0.6,
        objectDetail: 0.7,
        maxVisibleObjects: 300
    },
    low: {
        shadowMapSize: 256,
        particleCount: 0.3,
        drawDistance: 0.4,
        textureQuality: 0.4,
        objectDetail: 0.5,
        maxVisibleObjects: 200
    },
    minimal: {
        shadowMapSize: 0,
        particleCount: 0.1,
        drawDistance: 0.3,
        textureQuality: 0.2,
        objectDetail: 0.3,
        maxVisibleObjects: 100
    }
};

export default QUALITY_LEVELS;