import * as THREE from 'three';
import { Path } from './Path.js';

/**
 * Circular Path - Creates a circular path
 */
export class CircularPath extends Path {
    /**
     * Create a circular path with the given points and width
     * @param {Array} points - Array of Vector3 points
     * @param {number} width - Path width
     * @param {Object} options - Additional options
     * @returns {THREE.Group} - Path group
     */
    createPath(points, width, options = {}) {
        // Get zone information for coloring
        const zoneAt = this.MapManager.zoneManager.getZoneAt(points[0]);
        const zoneName = zoneAt ? zoneAt.name : 'Terrant';
        
        // Get theme colors
        const themeColors = this.MapManager.currentMap?.theme?.colors || {};
        
        // Create materials
        const pathMaterial = this.getPathMaterial(zoneName, themeColors);
        const borderMaterial = this.getBorderMaterial();
        
        // Create geometries
        const pathGeometry = this.createCircularPathGeometry(points, width);
        const borderGeometry = this.createCircularPathGeometry(points, width + 0.3);
        
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
            pattern: 'circular',
            zone: zoneName
        };
        
        // Add to scene if not specified otherwise
        if (options.addToScene !== false) {
            this.scene.add(pathGroup);
        }
        
        return pathGroup;
    }
    
    /**
     * Create geometry for a circular path
     * @param {Array} points - Array of Vector3 points (center and radius point)
     * @param {number} width - Path width
     * @returns {THREE.BufferGeometry} - Circular path geometry
     */
    createCircularPathGeometry(points, width) {
        // Circular paths need at least a center point and a radius point
        if (points.length < 2) {
            return this.createPathGeometry(points, width);
        }
        
        const center = points[0];
        const radiusPoint = points[1];
        
        // Calculate radius as distance from center to radius point
        const radius = center.distanceTo(radiusPoint);
        
        // Create circle points
        const circlePoints = [];
        const segments = 32; // Number of segments for smooth circle
        
        for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            const x = center.x + radius * Math.cos(angle);
            const z = center.z + radius * Math.sin(angle);
            
            circlePoints.push(new THREE.Vector3(x, 0, z));
        }
        
        // Create geometry using the circle points
        return this.createPathGeometry(circlePoints, width);
    }
    
    /**
     * Add decorations to circular path
     * @param {THREE.Group} pathGroup - Path group to add decorations to
     * @param {Array} points - Path points
     * @param {number} width - Path width
     * @param {number} pathColor - Path color
     */
    addPathDecorations(pathGroup, points, width, pathColor) {
        if (points.length < 2) return;
        
        // Add a central feature and perimeter markers
        this.addCentralFeature(pathGroup, points[0], pathColor);
        this.addPerimeterMarkers(pathGroup, points[0], points[0].distanceTo(points[1]));
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
    
    /**
     * Add markers around the perimeter of a circular path
     * @param {THREE.Group} pathGroup - Path group to add markers to
     * @param {THREE.Vector3} center - Center point
     * @param {number} radius - Circle radius
     */
    addPerimeterMarkers(pathGroup, center, radius) {
        // Add markers at cardinal points
        const markerCount = 4 + Math.floor(Math.random() * 4); // 4-7 markers
        
        for (let i = 0; i < markerCount; i++) {
            const angle = (i / markerCount) * Math.PI * 2;
            
            // Position at perimeter
            const x = center.x + radius * Math.cos(angle);
            const z = center.z + radius * Math.sin(angle);
            const position = new THREE.Vector3(x, 0, z);
            
            // Create a marker stone
            const stoneGeometry = new THREE.CylinderGeometry(0.3, 0.4, 0.8, 6);
            const stoneMaterial = new THREE.MeshLambertMaterial({ 
                color: 0x999999,
                roughness: 0.9
            });
            
            const stone = new THREE.Mesh(stoneGeometry, stoneMaterial);
            stone.position.copy(position);
            stone.position.y = 0.4; // Half height
            
            // Add to path group
            pathGroup.add(stone);
        }
    }
}