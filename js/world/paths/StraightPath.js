import * as THREE from 'three';
import { Path } from './Path.js';

/**
 * Straight Path - Creates a straight path between points
 */
export class StraightPath extends Path {
    /**
     * Create a straight path with the given points and width
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
        const pathGeometry = this.createPathGeometry(points, width);
        const borderGeometry = this.createPathGeometry(points, width + 0.3);
        
        // Create meshes for vertical walls
        const pathMesh = new THREE.Mesh(pathGeometry, pathMaterial);
        pathMesh.receiveShadow = true;
        pathMesh.castShadow = true;
        
        const borderMesh = new THREE.Mesh(borderGeometry, borderMaterial);
        borderMesh.receiveShadow = true;
        borderMesh.castShadow = true;
        // Make border slightly thicker/taller than main path
        borderMesh.scale.y = 1.1;
        
        // Create a group for the path
        const pathGroup = new THREE.Group();
        pathGroup.add(borderMesh);
        pathGroup.add(pathMesh);
        
        // Add decorations
        this.addPathDecorations(pathGroup, points, width, pathMaterial.color.getHex());
        
        // Set user data
        pathGroup.userData = {
            type: 'path',
            pattern: 'straight',
            zone: zoneName
        };
        
        // Add to scene if not specified otherwise
        if (options.addToScene !== false) {
            this.scene.add(pathGroup);
        }
        
        return pathGroup;
    }
    
    /**
     * Add simple markers along a straight path
     * @param {THREE.Group} pathGroup - Path group to add markers to
     * @param {Array} points - Path points
     * @param {number} width - Path width
     * @param {number} pathColor - Path color
     */
    addPathDecorations(pathGroup, points, width, pathColor) {
        // Add markers at start and end, and maybe one in the middle
        if (points.length < 2) return;
        
        // Only add markers if the path is long enough
        if (points[0].distanceTo(points[points.length - 1]) < 10) return;
        
        // Add start marker
        this.addPathMarker(pathGroup, points[0], width, 'start');
        
        // Add end marker
        this.addPathMarker(pathGroup, points[points.length - 1], width, 'end');
        
        // Maybe add a middle marker
        if (points.length > 3 && Math.random() > 0.5) {
            const middleIndex = Math.floor(points.length / 2);
            this.addPathMarker(pathGroup, points[middleIndex], width, 'middle');
        }
    }
    
    /**
     * Add a single path marker
     * @param {THREE.Group} pathGroup - Path group to add marker to
     * @param {THREE.Vector3} position - Marker position
     * @param {number} width - Path width
     * @param {string} type - Marker type (start, end, middle)
     */
    addPathMarker(pathGroup, position, width, type) {
        let markerGeometry, markerMaterial;
        
        switch (type) {
            case 'start':
                // Square marker for start
                markerGeometry = new THREE.BoxGeometry(0.5, 0.3, 0.5);
                markerMaterial = new THREE.MeshLambertMaterial({ 
                    color: 0x4CAF50, // Green
                    roughness: 0.7
                });
                break;
                
            case 'end':
                // Round marker for end
                markerGeometry = new THREE.CylinderGeometry(0.25, 0.25, 0.3, 8);
                markerMaterial = new THREE.MeshLambertMaterial({ 
                    color: 0xF44336, // Red
                    roughness: 0.7
                });
                break;
                
            case 'middle':
            default:
                // Triangle marker for middle
                markerGeometry = new THREE.ConeGeometry(0.25, 0.4, 3);
                markerMaterial = new THREE.MeshLambertMaterial({ 
                    color: 0x2196F3, // Blue
                    roughness: 0.7
                });
                break;
        }
        
        const marker = new THREE.Mesh(markerGeometry, markerMaterial);
        marker.position.copy(position);
        marker.position.y = 0.2; // Slightly above path
        
        // Add to path group
        pathGroup.add(marker);
    }
}