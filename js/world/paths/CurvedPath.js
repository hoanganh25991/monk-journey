import * as THREE from 'three';
import { Path } from './Path.js';

/**
 * Curved Path - Creates a smooth curved path between points
 */
export class CurvedPath extends Path {
    /**
     * Create a curved path with the given points and width
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
        const pathGeometry = this.createCurvedPathGeometry(points, width);
        const borderGeometry = this.createCurvedPathGeometry(points, width + 0.3);
        
        // Create meshes for vertical walls
        const pathMesh = new THREE.Mesh(pathGeometry, pathMaterial);
        pathMesh.receiveShadow = true;
        pathMesh.castShadow = true;
        
        const borderMesh = new THREE.Mesh(borderGeometry, borderMaterial);
        borderMesh.receiveShadow = true;
        borderMesh.castShadow = true;
        // Make border slightly taller than main path
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
            pattern: 'curved',
            zone: zoneName
        };
        
        // Add to scene if not specified otherwise
        if (options.addToScene !== false) {
            this.scene.add(pathGroup);
        }
        
        return pathGroup;
    }
    
    /**
     * Create geometry for a curved path with more segments for smoother curves
     * @param {Array} points - Array of Vector3 points
     * @param {number} width - Path width
     * @returns {THREE.BufferGeometry} - Curved path geometry
     */
    createCurvedPathGeometry(points, width) {
        // If we have only 2 points, create a bezier curve
        if (points.length === 2) {
            // Create a control point for the curve
            const start = points[0];
            const end = points[1];
            const midX = (start.x + end.x) / 2;
            const midZ = (start.z + end.z) / 2;
            
            // Add some randomness to the control point
            const offset = Math.min(start.distanceTo(end) * 0.3, 10);
            const controlPoint = new THREE.Vector3(
                midX + (Math.random() - 0.5) * offset,
                0,
                midZ + (Math.random() - 0.5) * offset
            );
            
            // Create a quadratic bezier curve
            const curve = new THREE.QuadraticBezierCurve3(start, controlPoint, end);
            
            // Sample points along the curve
            const curvePoints = curve.getPoints(20); // 20 segments for smooth curve
            
            // Create geometry using the curve points
            return this.createPathGeometry(curvePoints, width);
        } 
        // If we have more than 2 points, create a spline curve
        else if (points.length > 2) {
            // Create a spline curve through all points
            const curve = new THREE.CatmullRomCurve3(points);
            
            // Sample points along the curve
            const curvePoints = curve.getPoints(Math.max(20, points.length * 5)); // More segments for smoother curve
            
            // Create geometry using the curve points
            return this.createPathGeometry(curvePoints, width);
        }
        
        // Fallback to regular path geometry
        return this.createPathGeometry(points, width);
    }
    
    /**
     * Add small rocks along a curved path
     * @param {THREE.Group} pathGroup - Path group to add rocks to
     * @param {Array} points - Path points
     * @param {number} width - Path width
     * @param {number} pathColor - Path color
     */
    addPathDecorations(pathGroup, points, width, pathColor) {
        // Add rocks at regular intervals, but not too many
        const interval = Math.max(3, Math.floor(points.length / 5));
        
        for (let i = interval; i < points.length; i += interval) {
            if (Math.random() > 0.7) continue; // Only 30% chance to add a rock
            
            const point = points[i];
            
            // Position rock at the edge of the path
            const direction = new THREE.Vector3();
            
            if (i > 0) {
                direction.subVectors(point, points[i-1]).normalize();
            } else {
                direction.subVectors(points[i+1], point).normalize();
            }
            
            // Perpendicular to path direction
            const perpendicular = new THREE.Vector3(-direction.z, 0, direction.x);
            
            // Randomly choose left or right side
            if (Math.random() > 0.5) {
                perpendicular.multiplyScalar(-1);
            }
            
            // Position at path edge
            const rockPosition = point.clone().add(
                perpendicular.multiplyScalar(width / 2 + 0.2)
            );
            
            // Create a small rock
            const rockSize = 0.2 + Math.random() * 0.3;
            const rockGeometry = new THREE.DodecahedronGeometry(rockSize, 0);
            const rockMaterial = new THREE.MeshLambertMaterial({ 
                color: 0x888888,
                roughness: 0.9
            });
            
            const rock = new THREE.Mesh(rockGeometry, rockMaterial);
            rock.position.copy(rockPosition);
            rock.rotation.y = Math.random() * Math.PI * 2;
            
            // Add to path group
            pathGroup.add(rock);
        }
    }
}