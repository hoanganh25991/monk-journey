import * as THREE from 'three';
import { Path } from './Path.js';

/**
 * Natural Path - Creates a more organic, natural-looking path
 */
export class NaturalPath extends Path {
    /**
     * Create a natural path with the given points and width
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
        
        // For natural paths, make them more transparent and blend with terrain
        pathMaterial.opacity = 0.7;
        
        // Create a more natural-looking border material
        const borderMaterial = new THREE.MeshLambertMaterial({
            color: 0x33220B, // Darker brown
            transparent: true,
            opacity: 0.4,
            roughness: 1.0,
            side: THREE.DoubleSide // Important for thin vertical walls
        });
        
        // Create geometries with natural variations
        const pathGeometry = this.createNaturalPathGeometry(points, width);
        const borderGeometry = this.createNaturalPathGeometry(points, width + 0.5);
        
        // Create meshes for vertical walls
        const pathMesh = new THREE.Mesh(pathGeometry, pathMaterial);
        pathMesh.receiveShadow = true;
        pathMesh.castShadow = true;
        
        const borderMesh = new THREE.Mesh(borderGeometry, borderMaterial);
        borderMesh.receiveShadow = true;
        borderMesh.castShadow = true;
        // Make border slightly taller than main path
        borderMesh.scale.y = 1.05;
        
        // Create a group for the path
        const pathGroup = new THREE.Group();
        pathGroup.add(borderMesh);
        pathGroup.add(pathMesh);
        
        // Add natural decorations
        this.addPathDecorations(pathGroup, points, width, pathMaterial.color.getHex());
        
        // Ensure the entire path group is visible but not too raised
        pathGroup.position.y = 0.05; // Lower for natural paths
        
        // Set user data
        pathGroup.userData = {
            type: 'path',
            pattern: 'natural',
            zone: zoneName
        };
        
        // Add to scene if not specified otherwise
        if (options.addToScene !== false) {
            this.scene.add(pathGroup);
        }
        
        return pathGroup;
    }
    
    /**
     * Create geometry for a natural path with variations in width and height
     * @param {Array} points - Array of Vector3 points
     * @param {number} width - Path width
     * @returns {THREE.BufferGeometry} - Natural path geometry
     */
    createNaturalPathGeometry(points, width) {
        // First, create a curved path to make it more organic
        const curvedPoints = this.createOrganicCurve(points);
        
        // Then create the geometry with width variations
        const geometry = new THREE.BufferGeometry();
        const vertices = [];
        const indices = [];
        const uvs = [];
        
        // Add width variations for natural look
        for (let i = 0; i < curvedPoints.length; i++) {
            const point = curvedPoints[i];
            
            // Vary the height slightly for a more natural look
            const heightVariation = 0.02 * (Math.random() - 0.5);
            const height = 0.05 + heightVariation;
            
            // Calculate direction for path width
            let direction;
            if (i === 0) {
                direction = curvedPoints[1].clone().sub(point).normalize();
            } else if (i === curvedPoints.length - 1) {
                direction = point.clone().sub(curvedPoints[i - 1]).normalize();
            } else {
                const dir1 = point.clone().sub(curvedPoints[i - 1]).normalize();
                const dir2 = curvedPoints[i + 1].clone().sub(point).normalize();
                direction = dir1.add(dir2).normalize();
            }
            
            // Calculate perpendicular for width
            const perpendicular = new THREE.Vector3(-direction.z, 0, direction.x);
            
            // Vary the width for a more natural look
            const widthVariation = 0.2 * (Math.random() - 0.5);
            const halfWidth = (width / 2) * (1 + widthVariation);
            
            // Add vertices for both sides of the path
            const leftPoint = point.clone().add(perpendicular.clone().multiplyScalar(halfWidth));
            const rightPoint = point.clone().add(perpendicular.clone().multiplyScalar(-halfWidth));
            
            // Set explicit height with variation
            leftPoint.y = height;
            rightPoint.y = height;
            
            vertices.push(leftPoint.x, leftPoint.y, leftPoint.z);
            vertices.push(rightPoint.x, rightPoint.y, rightPoint.z);
            
            // Add UVs with some randomness for texture variation
            const u = i / (curvedPoints.length - 1);
            const vLeft = Math.random() * 0.1;
            const vRight = 1 - Math.random() * 0.1;
            uvs.push(vLeft, u);
            uvs.push(vRight, u);
            
            // Add indices for triangles (except for the last point)
            if (i < curvedPoints.length - 1) {
                const baseIndex = i * 2;
                
                // First triangle
                indices.push(baseIndex, baseIndex + 1, baseIndex + 2);
                // Second triangle
                indices.push(baseIndex + 1, baseIndex + 3, baseIndex + 2);
            }
        }
        
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
        geometry.setIndex(indices);
        geometry.computeVertexNormals();
        
        return geometry;
    }
    
    /**
     * Create an organic curve from the given points
     * @param {Array} points - Array of Vector3 points
     * @returns {Array} - Array of Vector3 points forming an organic curve
     */
    createOrganicCurve(points) {
        if (points.length < 2) return points;
        
        // Create a spline curve through all points
        const curve = new THREE.CatmullRomCurve3(points);
        curve.tension = 0.3; // Lower tension for more organic look
        
        // Sample points along the curve
        const curvePoints = curve.getPoints(Math.max(30, points.length * 8));
        
        // Add small random offsets to points for more natural look
        return curvePoints.map(point => {
            // Don't modify the first and last points
            if (point.equals(points[0]) || point.equals(points[points.length - 1])) {
                return point.clone();
            }
            
            // Add small random offset
            const offset = 0.2;
            return new THREE.Vector3(
                point.x + (Math.random() - 0.5) * offset,
                point.y,
                point.z + (Math.random() - 0.5) * offset
            );
        });
    }
    
    /**
     * Add natural decorations along the path
     * @param {THREE.Group} pathGroup - Path group to add decorations to
     * @param {Array} points - Path points
     * @param {number} width - Path width
     * @param {number} pathColor - Path color
     */
    addPathDecorations(pathGroup, points, width, pathColor) {
        // Add small rocks, grass tufts, and other natural elements
        const decorationCount = Math.floor(points.length / 3);
        
        for (let i = 0; i < decorationCount; i++) {
            // Choose a random point along the path
            const pointIndex = 1 + Math.floor(Math.random() * (points.length - 2));
            const point = points[pointIndex];
            
            // Position decoration at the edge of the path
            const direction = new THREE.Vector3();
            
            if (pointIndex > 0) {
                direction.subVectors(point, points[pointIndex-1]).normalize();
            } else {
                direction.subVectors(points[pointIndex+1], point).normalize();
            }
            
            // Perpendicular to path direction
            const perpendicular = new THREE.Vector3(-direction.z, 0, direction.x);
            
            // Randomly choose left or right side
            if (Math.random() > 0.5) {
                perpendicular.multiplyScalar(-1);
            }
            
            // Position at path edge with some variation
            const edgeOffset = width / 2 + 0.1 + Math.random() * 0.3;
            const decorPosition = point.clone().add(
                perpendicular.multiplyScalar(edgeOffset)
            );
            
            // Choose decoration type
            const decorType = Math.random();
            
            if (decorType < 0.4) {
                // Small rock
                this.addSmallRock(pathGroup, decorPosition);
            } else if (decorType < 0.7) {
                // Grass tuft
                this.addGrassTuft(pathGroup, decorPosition);
            } else {
                // Small flower or plant
                this.addSmallPlant(pathGroup, decorPosition);
            }
        }
    }
    
    /**
     * Add a small rock decoration
     * @param {THREE.Group} pathGroup - Path group to add decoration to
     * @param {THREE.Vector3} position - Position for the decoration
     */
    addSmallRock(pathGroup, position) {
        const rockSize = 0.1 + Math.random() * 0.2;
        const rockGeometry = new THREE.DodecahedronGeometry(rockSize, 0);
        const rockMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x777777,
            roughness: 0.9
        });
        
        const rock = new THREE.Mesh(rockGeometry, rockMaterial);
        rock.position.copy(position);
        rock.rotation.y = Math.random() * Math.PI * 2;
        rock.rotation.x = Math.random() * 0.3;
        rock.rotation.z = Math.random() * 0.3;
        
        // Add to path group
        pathGroup.add(rock);
    }
    
    /**
     * Add a grass tuft decoration
     * @param {THREE.Group} pathGroup - Path group to add decoration to
     * @param {THREE.Vector3} position - Position for the decoration
     */
    addGrassTuft(pathGroup, position) {
        const grassHeight = 0.2 + Math.random() * 0.3;
        const grassGeometry = new THREE.CylinderGeometry(0.01, 0.05, grassHeight, 3);
        const grassMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x4CAF50, // Green
            roughness: 0.8
        });
        
        const grassGroup = new THREE.Group();
        
        // Add several grass blades
        for (let i = 0; i < 3 + Math.floor(Math.random() * 3); i++) {
            const blade = new THREE.Mesh(grassGeometry, grassMaterial);
            
            // Position around center
            blade.position.x = position.x + (Math.random() - 0.5) * 0.1;
            blade.position.y = position.y + grassHeight / 2;
            blade.position.z = position.z + (Math.random() - 0.5) * 0.1;
            
            // Random rotation
            blade.rotation.y = Math.random() * Math.PI * 2;
            blade.rotation.x = (Math.random() - 0.5) * 0.3;
            blade.rotation.z = (Math.random() - 0.5) * 0.3;
            
            grassGroup.add(blade);
        }
        
        // Add to path group
        pathGroup.add(grassGroup);
    }
    
    /**
     * Add a small plant decoration
     * @param {THREE.Group} pathGroup - Path group to add decoration to
     * @param {THREE.Vector3} position - Position for the decoration
     */
    addSmallPlant(pathGroup, position) {
        const plantGroup = new THREE.Group();
        
        // Stem
        const stemHeight = 0.2 + Math.random() * 0.2;
        const stemGeometry = new THREE.CylinderGeometry(0.01, 0.02, stemHeight, 4);
        const stemMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x33691E, // Dark green
            roughness: 0.8
        });
        
        const stem = new THREE.Mesh(stemGeometry, stemMaterial);
        stem.position.y = stemHeight / 2;
        plantGroup.add(stem);
        
        // Flower or leaf
        if (Math.random() > 0.5) {
            // Flower
            const flowerSize = 0.05 + Math.random() * 0.05;
            const flowerGeometry = new THREE.SphereGeometry(flowerSize, 8, 4);
            
            // Random flower color
            const flowerColors = [0xE91E63, 0x9C27B0, 0xFFC107, 0xFF5722, 0x4CAF50];
            const flowerColor = flowerColors[Math.floor(Math.random() * flowerColors.length)];
            
            const flowerMaterial = new THREE.MeshLambertMaterial({ 
                color: flowerColor,
                roughness: 0.7
            });
            
            const flower = new THREE.Mesh(flowerGeometry, flowerMaterial);
            flower.position.y = stemHeight;
            plantGroup.add(flower);
        } else {
            // Leaves
            const leafSize = 0.08 + Math.random() * 0.08;
            const leafGeometry = new THREE.PlaneGeometry(leafSize, leafSize * 2);
            const leafMaterial = new THREE.MeshLambertMaterial({ 
                color: 0x4CAF50, // Green
                roughness: 0.8,
                side: THREE.DoubleSide
            });
            
            // Add a few leaves
            for (let i = 0; i < 2 + Math.floor(Math.random() * 3); i++) {
                const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
                leaf.position.y = stemHeight * (0.5 + Math.random() * 0.5);
                
                // Random rotation around Y axis for natural variation
                leaf.rotation.y = Math.random() * Math.PI * 2;
                // Rotate 90 degrees around X axis to make leaf stand upright from horizontal ground
                leaf.rotation.x = Math.PI / 2;
                
                plantGroup.add(leaf);
            }
        }
        
        // Position the plant
        plantGroup.position.copy(position);
        
        // Add to path group
        pathGroup.add(plantGroup);
    }
}