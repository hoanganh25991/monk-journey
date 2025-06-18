import * as THREE from 'three';

/**
 * Base Path class - Provides common functionality for all path types
 */
export class Path {
    constructor(scene, MapManager) {
        this.scene = scene;
        this.MapManager = MapManager;
    }
    
    /**
     * Create a path with the given points and width
     * @param {Array} points - Array of Vector3 points
     * @param {number} width - Path width
     * @param {Object} options - Additional options
     * @returns {THREE.Group} - Path group
     */
    createPath(points, width, options = {}) {
        // This method should be overridden by subclasses
        console.warn('Path.createPath() called on base class - should be overridden');
        return new THREE.Group();
    }
    
    /**
     * Create basic path geometry as vertical wall/fence
     * @param {Array} points - Array of Vector3 points
     * @param {number} width - Path width (now used as height)
     * @returns {THREE.BufferGeometry} - Path geometry
     */
    createPathGeometry(points, width) {
        const geometry = new THREE.BufferGeometry();
        const vertices = [];
        const indices = [];
        const uvs = [];
        
        // Use width as height for vertical wall
        const wallHeight = width || 2.0;
        
        // Create vertical wall geometry connecting the points
        for (let i = 0; i < points.length - 1; i++) {
            const currentPoint = points[i];
            const nextPoint = points[i + 1];
            
            // Get terrain heights at both points
            const currentTerrainHeight = currentPoint.y || 0;
            const nextTerrainHeight = nextPoint.y || 0;
            
            // Create 4 vertices for each segment: bottom-current, top-current, bottom-next, top-next
            const bottomCurrent = new THREE.Vector3(currentPoint.x, currentTerrainHeight, currentPoint.z);
            const topCurrent = new THREE.Vector3(currentPoint.x, currentTerrainHeight + wallHeight, currentPoint.z);
            const bottomNext = new THREE.Vector3(nextPoint.x, nextTerrainHeight, nextPoint.z);
            const topNext = new THREE.Vector3(nextPoint.x, nextTerrainHeight + wallHeight, nextPoint.z);
            
            // Add vertices for this segment
            const baseIndex = i * 4;
            vertices.push(bottomCurrent.x, bottomCurrent.y, bottomCurrent.z);  // 0: bottom-current
            vertices.push(topCurrent.x, topCurrent.y, topCurrent.z);          // 1: top-current  
            vertices.push(bottomNext.x, bottomNext.y, bottomNext.z);          // 2: bottom-next
            vertices.push(topNext.x, topNext.y, topNext.z);                   // 3: top-next
            
            // Add UVs for this segment
            const u1 = i / (points.length - 1);
            const u2 = (i + 1) / (points.length - 1);
            uvs.push(u1, 0); // bottom-current
            uvs.push(u1, 1); // top-current
            uvs.push(u2, 0); // bottom-next
            uvs.push(u2, 1); // top-next
            
            // Create two triangles for the vertical face
            // Triangle 1: bottom-current -> top-current -> bottom-next
            indices.push(baseIndex, baseIndex + 1, baseIndex + 2);
            // Triangle 2: top-current -> top-next -> bottom-next
            indices.push(baseIndex + 1, baseIndex + 3, baseIndex + 2);
        }
        
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
        geometry.setIndex(indices);
        geometry.computeVertexNormals();
        
        // Set double-sided material since it's a thin wall
        geometry.userData.doubleSided = true;
        
        return geometry;
    }
    
    /**
     * Get path material based on zone and theme
     * @param {string} zoneName - Zone name
     * @param {Object} themeColors - Theme colors
     * @returns {THREE.Material} - Path material
     */
    getPathMaterial(zoneName, themeColors) {
        // Default brown path color
        let pathColor = 0x8B7355;
        
        // Use zone-specific path color if available
        if (themeColors && themeColors.path) {
            // Convert hex string to number
            pathColor = parseInt(themeColors.path.replace('#', '0x'), 16);
        } else if (zoneName === 'Desert' && themeColors.sand) {
            pathColor = parseInt(themeColors.sand.replace('#', '0x'), 16);
        } else if (zoneName === 'Forest' && themeColors.ground) {
            pathColor = parseInt(themeColors.ground.replace('#', '0x'), 16);
        } else if (zoneName === 'Mountains' && themeColors.rock) {
            pathColor = parseInt(themeColors.rock.replace('#', '0x'), 16);
        }
        
        // Create path material with zone-appropriate color for vertical walls
        return new THREE.MeshLambertMaterial({
            color: pathColor,
            transparent: true,
            opacity: 0.9,
            roughness: 0.8,
            metalness: 0.1,
            side: THREE.DoubleSide // Important for thin vertical walls
        });
    }
    
    /**
     * Get border material
     * @returns {THREE.Material} - Border material
     */
    getBorderMaterial() {
        return new THREE.MeshLambertMaterial({
            color: 0x000000,
            transparent: true,
            opacity: 0.2,
            roughness: 0.9,
            side: THREE.DoubleSide // Important for thin vertical walls
        });
    }
    
    /**
     * Add path decorations
     * @param {THREE.Group} pathGroup - Path group
     * @param {Array} points - Path points
     * @param {number} width - Path width
     * @param {number} pathColor - Path color
     */
    addPathDecorations(pathGroup, points, width, pathColor) {
        // Base class doesn't add decorations
        // Subclasses should override this method if needed
    }
}