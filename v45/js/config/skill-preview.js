/**
 * camera-config.js
 * Centralized configuration for camera settings
 */

export const CAMERA_CONFIG = {
    // Camera distance settings
    distance: 12,          // Default camera distance
    minDistance: 4.5,      // Minimum allowed camera distance
    maxDistance: 200,      // Maximum allowed camera distance
    
    // Camera angle and position
    angle: -Math.PI / 5,  // Default camera angle (in radians)
    yPosition: 9.0,       // Default camera height (y-position)
    
    // Camera target
    target: { x: 0, y: 0, z: 0 }  // Default camera target/look-at point
};