import * as THREE from 'three';
import { Path } from './Path.js';

/**
 * Spiral Path - Creates a spiral path from a center point
 */
export class SpiralPath extends Path {
    /**
     * Create a spiral path with the given points and width
     * @param {Array} points - Array of Vector3 points
     * @param {number} width - Path width
     * @param {Object} options - Additional options
     * @returns {THREE.Group} - Path group
     */
    createPath(points, width, options = {}) {
        // Get zone information for coloring
        const zoneAt = this.worldManager.zoneManager.getZoneAt(points[0]);
        const zoneName = zoneAt ? zoneAt.name : 'Terrant';
        
        // Get theme colors
        const themeColors = this.worldManager.currentMap?.theme?.colors || {};
        
        // Create materials
        const pathMaterial = this.getPathMaterial(zoneName, themeColors);
        const borderMaterial = this.getBorderMaterial();
        
        // Create geometries
        const pathGeometry = this.createSpiralPathGeometry(points, width);
        const borderGeometry = this.createSpiralPathGeometry(points, width + 0.3);
        
        // Create meshes
        const pathMesh = new THREE.Mesh(pathGeometry, pathMaterial);
        pathMesh.receiveShadow = true;
        pathMesh.position.y = 0.1; // Slightly above ground level
        
        const borderMesh = new THREE.Mesh(borderGeometry, borderMaterial);
        borderMesh.receiveShadow = true;
        borderMesh.position.y = 0.05; // Slightly above ground but below the main path
        
        // Create a group for the path
        const pathGroup = new THREE.Group();
        pathGroup.add(borderMesh);
        pathGroup.add(pathMesh);
        
        // Add decorations
        this.addPathDecorations(pathGroup, points, width, pathMaterial.color.getHex());
        
        // Ensure the entire path group is visible
        pathGroup.position.y = 0.1; // Raise the entire path group above ground
        
        // Set user data
        pathGroup.userData = {
            type: 'path',
            pattern: 'spiral',
            zone: zoneName
        };
        
        // Add to scene if not specified otherwise
        if (options.addToScene !== false) {
            this.scene.add(pathGroup);
        }
        
        return pathGroup;
    }
    
    /**
     * Create geometry for a spiral path
     * @param {Array} points - Array of Vector3 points (center and end point)
     * @param {number} width - Path width
     * @returns {THREE.BufferGeometry} - Spiral path geometry
     */
    createSpiralPathGeometry(points, width) {
        // Spiral paths need at least a center point and an end point
        if (points.length < 2) {
            return this.createPathGeometry(points, width);
        }
        
        const center = points[0];
        const end = points[points.length - 1];
        
        // Calculate radius as distance from center to end
        const radius = center.distanceTo(end);
        
        // Create spiral points
        const spiralPoints = [];
        const turns = 2 + Math.random(); // 2-3 turns
        const pointsPerTurn = 20; // Points per turn for smoothness
        const totalPoints = Math.floor(turns * pointsPerTurn);
        
        for (let i = 0; i <= totalPoints; i++) {
            const t = i / totalPoints;
            const angle = turns * 2 * Math.PI * t;
            const radiusAtT = radius * t; // Radius increases with t
            
            const x = center.x + radiusAtT * Math.cos(angle);
            const z = center.z + radiusAtT * Math.sin(angle);
            
            spiralPoints.push(new THREE.Vector3(x, 0, z));
        }
        
        // Create geometry using the spiral points
        return this.createPathGeometry(spiralPoints, width);
    }
    
    /**
     * Add a central feature at the spiral center
     * @param {THREE.Group} pathGroup - Path group to add feature to
     * @param {Array} points - Path points
     * @param {number} width - Path width
     * @param {number} pathColor - Path color
     */
    addPathDecorations(pathGroup, points, width, pathColor) {
        if (!points || points.length === 0) return;
        
        // Add a central feature at the spiral center
        this.addCentralFeature(pathGroup, points[0], pathColor);
    }
    
    /**
     * Add a central feature at a point
     * @param {THREE.Group} pathGroup - Path group to add feature to
     * @param {THREE.Vector3} center - Center point
     * @param {number} pathColor - Path color
     */
    addCentralFeature(pathGroup, center, pathColor) {
        // Create a central marker or feature
        const markerGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.3, 8);
        const markerMaterial = new THREE.MeshLambertMaterial({ 
            color: pathColor,
            roughness: 0.7
        });
        
        const marker = new THREE.Mesh(markerGeometry, markerMaterial);
        marker.position.copy(center);
        marker.position.y = 0.15; // Slightly above path
        
        // Add to path group
        pathGroup.add(marker);
        
        // Add a decorative element on top
        const topGeometry = new THREE.ConeGeometry(0.3, 0.5, 8);
        const topMaterial = new THREE.MeshLambertMaterial({ 
            color: 0xDDDDDD,
            roughness: 0.5
        });
        
        const top = new THREE.Mesh(topGeometry, topMaterial);
        top.position.copy(center);
        top.position.y = 0.6; // Above the marker
        
        // Add to path group
        pathGroup.add(top);
    }
}