/**
 * Quality level configurations for the game's material and object settings.
 * These settings control various aspects of the game's visual quality and performance
 * related to materials, objects, and draw distances.
 * 
 * Device targeting:
 * - ultra: High-end desktops and powerful machines
 * - high: Good desktop computers
 * - medium: Slower desktops and good tablets
 * - low: Tablets and mid-range mobile devices
 * - minimal: Any low-end device to achieve playable FPS
 * 
 * Note: This file is imported by render.js which combines all quality-related settings.
 * For accessing all quality settings in one place, use COMBINED_QUALITY_CONFIG from render.js.
 * 
 * The quality level is stored in localStorage using the key 'monk_journey_quality_level'.
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
        drawDistance: 0.6, // Slightly increased from 0.5
        textureQuality: 0.5, // Reduced from 0.6
        objectDetail: 0.6, // Reduced from 0.7
        maxVisibleObjects: 250 // Reduced from 300
    },
    low: {
        shadowMapSize: 256,
        particleCount: 0.2, // Reduced from 0.3
        drawDistance: 0.3, // Reduced from 0.4
        textureQuality: 0.3, // Reduced from 0.4
        objectDetail: 0.4, // Reduced from 0.5
        maxVisibleObjects: 150 // Reduced from 200
    },
    minimal: {
        shadowMapSize: 0,
        particleCount: 0.05, // Reduced from 0.1
        drawDistance: 0.2, // Reduced from 0.3
        textureQuality: 0.1, // Reduced from 0.2
        objectDetail: 0.2, // Reduced from 0.3
        maxVisibleObjects: 75 // Reduced from 100
    }
};

export default QUALITY_LEVELS;