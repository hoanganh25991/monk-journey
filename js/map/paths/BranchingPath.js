import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';
import { Path } from './Path.js';

/**
 * Branching Path - Creates a path with branches
 */
export class BranchingPath extends Path {
    /**
     * Create a branching path with the given points and width
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
        const pathGeometry = this.createBranchingPathGeometry(points, width);
        const borderGeometry = this.createBranchingPathGeometry(points, width + 0.3);
        
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
            pattern: 'branching',
            zone: zoneName
        };
        
        // Add to scene if not specified otherwise
        if (options.addToScene !== false) {
            this.scene.add(pathGroup);
        }
        
        return pathGroup;
    }
    
    /**
     * Create geometry for a branching path
     * @param {Array} points - Array of Vector3 points
     * @param {number} width - Path width
     * @returns {THREE.BufferGeometry} - Branching path geometry
     */
    createBranchingPathGeometry(points, width) {
        // For branching paths, we'll create a main path with branches
        if (points.length < 3) {
            return this.createPathGeometry(points, width);
        }
        
        // Create the main path geometry
        const mainGeometry = this.createPathGeometry(points, width);
        
        // We'll merge all geometries together
        const geometries = [mainGeometry];
        
        // Add branches at some of the points (except first and last)
        const branchCount = Math.min(3, Math.floor(points.length / 3));
        const possibleBranchPoints = points.slice(1, points.length - 1);
        
        // Randomly select branch points
        for (let i = 0; i < branchCount; i++) {
            if (possibleBranchPoints.length === 0) break;
            
            // Select a random point for the branch
            const randomIndex = Math.floor(Math.random() * possibleBranchPoints.length);
            const branchStart = possibleBranchPoints[randomIndex];
            
            // Remove this point from candidates to avoid multiple branches at same point
            possibleBranchPoints.splice(randomIndex, 1);
            
            // Create a branch with 2-3 segments
            const branchSegments = 1 + Math.floor(Math.random() * 2);
            const branchPoints = [branchStart.clone()];
            
            // Calculate branch direction (perpendicular to main path)
            let mainDirection;
            const pointIndex = points.indexOf(branchStart);
            
            if (pointIndex > 0 && pointIndex < points.length - 1) {
                const prev = points[pointIndex - 1];
                const next = points[pointIndex + 1];
                mainDirection = next.clone().sub(prev).normalize();
            } else {
                // Fallback
                mainDirection = new THREE.Vector3(1, 0, 0);
            }
            
            // Perpendicular to main path
            const branchDirection = new THREE.Vector3(-mainDirection.z, 0, mainDirection.x);
            
            // Randomly choose left or right
            if (Math.random() > 0.5) {
                branchDirection.multiplyScalar(-1);
            }
            
            // Create branch segments
            let currentPoint = branchStart.clone();
            
            for (let j = 0; j < branchSegments; j++) {
                // Add some randomness to direction
                const randomAngle = (Math.random() - 0.5) * Math.PI / 4; // ±45 degrees
                const randomDirection = branchDirection.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), randomAngle);
                
                // Calculate next point
                const segmentLength = 5 + Math.random() * 10;
                const nextPoint = currentPoint.clone().add(randomDirection.multiplyScalar(segmentLength));
                
                branchPoints.push(nextPoint);
                currentPoint = nextPoint;
            }
            
            // Create branch geometry with reduced width
            const branchWidth = width * (0.5 + Math.random() * 0.3); // 50-80% of main path width
            const branchGeometry = this.createPathGeometry(branchPoints, branchWidth);
            
            geometries.push(branchGeometry);
        }
        
        // Merge all geometries
        const mergedGeometry = BufferGeometryUtils.mergeGeometries(geometries);
        return mergedGeometry;
    }
    
    /**
     * Add markers at branch points
     * @param {THREE.Group} pathGroup - Path group to add markers to
     * @param {Array} points - Path points
     * @param {number} width - Path width
     * @param {number} pathColor - Path color
     */
    addPathDecorations(pathGroup, points, width, pathColor) {
        // Add markers at some of the points (except first and last)
        const markerCount = Math.min(3, Math.floor(points.length / 3));
        const possibleMarkerPoints = points.slice(1, points.length - 1);
        
        // Randomly select marker points
        for (let i = 0; i < markerCount; i++) {
            if (possibleMarkerPoints.length === 0) break;
            
            // Select a random point for the marker
            const randomIndex = Math.floor(Math.random() * possibleMarkerPoints.length);
            const markerPoint = possibleMarkerPoints[randomIndex];
            
            // Remove this point from candidates
            possibleMarkerPoints.splice(randomIndex, 1);
            
            // Create a simple post marker
            const postGeometry = new THREE.CylinderGeometry(0.15, 0.15, 1, 6);
            const postMaterial = new THREE.MeshLambertMaterial({ 
                color: 0x8B4513, // Brown
                roughness: 0.8
            });
            
            const post = new THREE.Mesh(postGeometry, postMaterial);
            post.position.copy(markerPoint);
            post.position.y = 0.5; // Half height
            
            // Add to path group
            pathGroup.add(post);
            
            // Add a sign on top
            const signGeometry = new THREE.BoxGeometry(0.8, 0.4, 0.1);
            const signMaterial = new THREE.MeshLambertMaterial({ 
                color: 0xDDDDDD,
                roughness: 0.7
            });
            
            const sign = new THREE.Mesh(signGeometry, signMaterial);
            sign.position.copy(markerPoint);
            sign.position.y = 1.1; // Above post
            
            // Random rotation for the sign
            sign.rotation.y = Math.random() * Math.PI * 2;
            
            // Add to path group
            pathGroup.add(sign);
        }
    }
}