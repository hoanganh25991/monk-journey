/**
 * GeometryFactory.js
 * Centralized factory for creating validated THREE.js geometries
 * Prevents NaN values and provides safe fallbacks
 */

import * as THREE from 'three';

/**
 * Validates a numeric parameter and provides a safe fallback
 * @param {*} value - The value to validate
 * @param {number} fallback - The fallback value if validation fails
 * @param {number} min - Minimum allowed value (optional)
 * @param {number} max - Maximum allowed value (optional)
 * @returns {number} - Validated number
 */
function validateNumber(value, fallback, min = -Infinity, max = Infinity) {
    if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
        return fallback;
    }
    return Math.max(min, Math.min(max, value));
}

/**
 * Safe CylinderGeometry factory
 * @param {number} radiusTop - Top radius
 * @param {number} radiusBottom - Bottom radius  
 * @param {number} height - Height
 * @param {number} radialSegments - Radial segments
 * @param {number} heightSegments - Height segments
 * @param {boolean} openEnded - Open ended
 * @param {number} thetaStart - Theta start
 * @param {number} thetaLength - Theta length
 * @returns {THREE.CylinderGeometry}
 */
export function createCylinderGeometry(
    radiusTop = 1, 
    radiusBottom = 1, 
    height = 1, 
    radialSegments = 32, 
    heightSegments = 1, 
    openEnded = false, 
    thetaStart = 0, 
    thetaLength = Math.PI * 2
) {
    const validatedRadiusTop = validateNumber(radiusTop, 1, 0);
    const validatedRadiusBottom = validateNumber(radiusBottom, 1, 0);
    const validatedHeight = validateNumber(height, 1, 0.001);
    const validatedRadialSegments = validateNumber(radialSegments, 32, 3, 256);
    const validatedHeightSegments = validateNumber(heightSegments, 1, 1, 256);
    const validatedThetaStart = validateNumber(thetaStart, 0);
    const validatedThetaLength = validateNumber(thetaLength, Math.PI * 2, 0.001);

    // Log if corrections were made
    if (radiusTop !== validatedRadiusTop || radiusBottom !== validatedRadiusBottom || 
        height !== validatedHeight || radialSegments !== validatedRadialSegments || 
        heightSegments !== validatedHeightSegments || thetaStart !== validatedThetaStart || 
        thetaLength !== validatedThetaLength) {
        console.warn('CylinderGeometry: Parameters corrected', {
            original: { radiusTop, radiusBottom, height, radialSegments, heightSegments, thetaStart, thetaLength },
            corrected: { 
                radiusTop: validatedRadiusTop, 
                radiusBottom: validatedRadiusBottom, 
                height: validatedHeight, 
                radialSegments: validatedRadialSegments, 
                heightSegments: validatedHeightSegments,
                thetaStart: validatedThetaStart,
                thetaLength: validatedThetaLength
            }
        });
    }

    return new THREE.CylinderGeometry(
        validatedRadiusTop,
        validatedRadiusBottom,
        validatedHeight,
        validatedRadialSegments,
        validatedHeightSegments,
        openEnded,
        validatedThetaStart,
        validatedThetaLength
    );
}

/**
 * Safe SphereGeometry factory
 * @param {number} radius - Sphere radius
 * @param {number} widthSegments - Width segments
 * @param {number} heightSegments - Height segments
 * @param {number} phiStart - Phi start
 * @param {number} phiLength - Phi length
 * @param {number} thetaStart - Theta start
 * @param {number} thetaLength - Theta length
 * @returns {THREE.SphereGeometry}
 */
export function createSphereGeometry(
    radius = 1, 
    widthSegments = 32, 
    heightSegments = 16, 
    phiStart = 0, 
    phiLength = Math.PI * 2, 
    thetaStart = 0, 
    thetaLength = Math.PI
) {
    const validatedRadius = validateNumber(radius, 1, 0.001);
    const validatedWidthSegments = validateNumber(widthSegments, 32, 3, 256);
    const validatedHeightSegments = validateNumber(heightSegments, 16, 2, 256);
    const validatedPhiStart = validateNumber(phiStart, 0);
    const validatedPhiLength = validateNumber(phiLength, Math.PI * 2, 0.001);
    const validatedThetaStart = validateNumber(thetaStart, 0);
    const validatedThetaLength = validateNumber(thetaLength, Math.PI, 0.001);

    // Log if corrections were made
    if (radius !== validatedRadius || widthSegments !== validatedWidthSegments || 
        heightSegments !== validatedHeightSegments || phiStart !== validatedPhiStart || 
        phiLength !== validatedPhiLength || thetaStart !== validatedThetaStart || 
        thetaLength !== validatedThetaLength) {
        console.warn('SphereGeometry: Parameters corrected', {
            original: { radius, widthSegments, heightSegments, phiStart, phiLength, thetaStart, thetaLength },
            corrected: { 
                radius: validatedRadius, 
                widthSegments: validatedWidthSegments, 
                heightSegments: validatedHeightSegments,
                phiStart: validatedPhiStart,
                phiLength: validatedPhiLength,
                thetaStart: validatedThetaStart,
                thetaLength: validatedThetaLength
            }
        });
    }

    return new THREE.SphereGeometry(
        validatedRadius,
        validatedWidthSegments,
        validatedHeightSegments,
        validatedPhiStart,
        validatedPhiLength,
        validatedThetaStart,
        validatedThetaLength
    );
}

/**
 * Safe TorusGeometry factory
 * @param {number} radius - Torus radius
 * @param {number} tube - Tube radius
 * @param {number} radialSegments - Radial segments
 * @param {number} tubularSegments - Tubular segments
 * @param {number} arc - Arc angle
 * @returns {THREE.TorusGeometry}
 */
export function createTorusGeometry(
    radius = 1, 
    tube = 0.4, 
    radialSegments = 12, 
    tubularSegments = 48, 
    arc = Math.PI * 2
) {
    const validatedRadius = validateNumber(radius, 1, 0.001);
    const validatedTube = validateNumber(tube, 0.4, 0.001);
    const validatedRadialSegments = validateNumber(radialSegments, 12, 3, 256);
    const validatedTubularSegments = validateNumber(tubularSegments, 48, 3, 256);
    const validatedArc = validateNumber(arc, Math.PI * 2, 0.001);

    // Log if corrections were made
    if (radius !== validatedRadius || tube !== validatedTube || 
        radialSegments !== validatedRadialSegments || tubularSegments !== validatedTubularSegments || 
        arc !== validatedArc) {
        console.warn('TorusGeometry: Parameters corrected', {
            original: { radius, tube, radialSegments, tubularSegments, arc },
            corrected: { 
                radius: validatedRadius, 
                tube: validatedTube, 
                radialSegments: validatedRadialSegments, 
                tubularSegments: validatedTubularSegments,
                arc: validatedArc
            }
        });
    }

    return new THREE.TorusGeometry(
        validatedRadius,
        validatedTube,
        validatedRadialSegments,
        validatedTubularSegments,
        validatedArc
    );
}

/**
 * Safe BoxGeometry factory
 * @param {number} width - Width
 * @param {number} height - Height
 * @param {number} depth - Depth
 * @param {number} widthSegments - Width segments
 * @param {number} heightSegments - Height segments
 * @param {number} depthSegments - Depth segments
 * @returns {THREE.BoxGeometry}
 */
export function createBoxGeometry(
    width = 1, 
    height = 1, 
    depth = 1, 
    widthSegments = 1, 
    heightSegments = 1, 
    depthSegments = 1
) {
    const validatedWidth = validateNumber(width, 1, 0.001);
    const validatedHeight = validateNumber(height, 1, 0.001);
    const validatedDepth = validateNumber(depth, 1, 0.001);
    const validatedWidthSegments = validateNumber(widthSegments, 1, 1, 256);
    const validatedHeightSegments = validateNumber(heightSegments, 1, 1, 256);
    const validatedDepthSegments = validateNumber(depthSegments, 1, 1, 256);

    return new THREE.BoxGeometry(
        validatedWidth,
        validatedHeight,
        validatedDepth,
        validatedWidthSegments,
        validatedHeightSegments,
        validatedDepthSegments
    );
}

/**
 * Safe PlaneGeometry factory
 * @param {number} width - Width
 * @param {number} height - Height
 * @param {number} widthSegments - Width segments
 * @param {number} heightSegments - Height segments
 * @returns {THREE.PlaneGeometry}
 */
export function createPlaneGeometry(
    width = 1, 
    height = 1, 
    widthSegments = 1, 
    heightSegments = 1
) {
    const validatedWidth = validateNumber(width, 1, 0.001);
    const validatedHeight = validateNumber(height, 1, 0.001);
    const validatedWidthSegments = validateNumber(widthSegments, 1, 1, 256);
    const validatedHeightSegments = validateNumber(heightSegments, 1, 1, 256);

    return new THREE.PlaneGeometry(
        validatedWidth,
        validatedHeight,
        validatedWidthSegments,
        validatedHeightSegments
    );
}

/**
 * Safe geometry creator with automatic type detection
 * @param {string} type - Geometry type ('cylinder', 'sphere', 'torus', 'box', 'plane')
 * @param {...any} params - Parameters for the geometry
 * @returns {THREE.BufferGeometry}
 */
export function createGeometry(type, ...params) {
    switch (type.toLowerCase()) {
        case 'cylinder':
            return createCylinderGeometry(...params);
        case 'sphere':
            return createSphereGeometry(...params);
        case 'torus':
            return createTorusGeometry(...params);
        case 'box':
            return createBoxGeometry(...params);
        case 'plane':
            return createPlaneGeometry(...params);
        default:
            console.warn(`Unknown geometry type: ${type}, falling back to box`);
            return createBoxGeometry();
    }
}

// Default export for convenience
export default {
    createCylinderGeometry,
    createSphereGeometry,
    createTorusGeometry,
    createBoxGeometry,
    createPlaneGeometry,
    createGeometry
};