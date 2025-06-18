import * as THREE from 'three';
import { Tree } from './Tree.js';
import { LOD } from 'three';

/**
 * TreeCluster - Efficiently manages groups of trees as a single entity
 * Implements level-of-detail (LOD) for better performance
 */
export class TreeCluster {
    /**
     * Create a new tree cluster
     * @param {THREE.Scene} scene - The scene to add the cluster to
     * @param {Object} MapManager - The world manager
     * @param {Object} data - Data object containing cluster configuration
     */
    constructor(scene, MapManager, data = null) {
        this.scene = scene;
        this.MapManager = MapManager;
        
        // Ensure data is an object
        const safeData = data || {};
        
        // Extract data from the data object
        this.zoneType = safeData.zoneType || 'Forest';
        
        // Handle positions data
        if (Array.isArray(safeData.positions) && safeData.positions.length > 0) {
            this.treePositions = safeData.positions;
        } else if (safeData.position) {
            // If we have a single position object, use it to create a single-tree cluster
            const pos = safeData.position;
            this.treePositions = [{ 
                x: pos.x, 
                y: pos.y || 0, 
                z: pos.z 
            }];
        } else if (safeData.centerPosition) {
            // If we have a centerPosition but no positions, create a default cluster around the center
            const center = safeData.centerPosition;
            this.treePositions = [{ 
                x: center.x, 
                y: center.y || 0, 
                z: center.z 
            }];
        } else {
            // Fallback to empty array
            console.warn('TreeCluster: No valid position data provided');
            this.treePositions = [];
        }
        
        // Store the center position if provided
        if (safeData.centerPosition) {
            this.centerPosition = new THREE.Vector3(
                safeData.centerPosition.x,
                safeData.centerPosition.y || 0,
                safeData.centerPosition.z
            );
        }
        
        // Configuration options
        this.options = Object.assign({
            minSize: 0.7,
            maxSize: 1.3,
            useLOD: true,
            highDetailDistance: 50,
            mediumDetailDistance: 100,
            lowDetailDistance: 200
        }, safeData.options || {});
        
        // The main group containing all trees
        this.group = new THREE.Group();
        
        // For LOD implementation
        this.lodEnabled = this.options.useLOD;
        this.lodObjects = [];
        
        // Track individual tree objects for collision detection
        this.individualTrees = [];
        
        // Bounding box for the entire cluster
        this.boundingBox = new THREE.Box3();
        
        // Calculate center position if not provided
        if (!this.centerPosition) {
            this.centerPosition = this.calculateCenter();
        }
        
        // Create the cluster mesh
        this.createMesh();
    }
    
    /**
     * Calculate the center position of the cluster
     * @returns {THREE.Vector3} - Center position
     */
    calculateCenter() {
        // If we have a centerPosition in the data, use it
        if (this.centerPosition) {
            return this.centerPosition;
        }
        
        // If we have no tree positions, return origin
        if (!this.treePositions || this.treePositions.length === 0) {
            console.warn('TreeCluster: No tree positions provided, using default position at origin');
            return new THREE.Vector3(0, 0, 0);
        }
        
        // Calculate center from tree positions
        const center = new THREE.Vector3();
        this.treePositions.forEach(pos => {
            if (!pos || (typeof pos.x !== 'number' || typeof pos.z !== 'number')) {
                console.warn('TreeCluster: Invalid position in treePositions array', pos);
                return;
            }
            center.add(new THREE.Vector3(pos.x, pos.y || 0, pos.z));
        });
        
        center.divideScalar(this.treePositions.length);
        return center;
    }
    
    /**
     * Create the cluster mesh with LOD support
     */
    createMesh() {
        if (this.lodEnabled) {
            this.createLODMesh();
        } else {
            this.createStandardMesh();
        }
        
        // Calculate bounding box
        this.boundingBox.setFromObject(this.group);
        
        // Don't add to scene here - let the caller handle that
        // The MapLoader will position and add the group to the scene
        // Note: We're just returning the group, NOT adding it to the scene
        
        return this.group;
    }
    
    /**
     * Create standard mesh without LOD
     */
    createStandardMesh() {
        this.treePositions.forEach(pos => {
            const size = this.options.minSize + Math.random() * (this.options.maxSize - this.options.minSize);
            const tree = new Tree(this.zoneType);
            const treeMesh = tree.createMesh();
            
            treeMesh.position.set(pos.x, pos.y || 0, pos.z);
            treeMesh.scale.set(size, size, size);
            
            this.group.add(treeMesh);
            this.individualTrees.push({
                mesh: treeMesh,
                position: new THREE.Vector3(pos.x, pos.y || 0, pos.z),
                size: size
            });
        });
    }
    
    /**
     * Create mesh with Level of Detail (LOD) support
     */
    createLODMesh() {
        // Create high detail representation (individual trees)
        const highDetailGroup = new THREE.Group();
        this.treePositions.forEach(pos => {
            const size = this.options.minSize + Math.random() * (this.options.maxSize - this.options.minSize);
            const tree = new Tree(this.zoneType);
            const treeMesh = tree.createMesh();
            
            treeMesh.position.set(pos.x, pos.y || 0, pos.z);
            treeMesh.scale.set(size, size, size);
            
            highDetailGroup.add(treeMesh);
            this.individualTrees.push({
                mesh: treeMesh,
                position: new THREE.Vector3(pos.x, pos.y || 0, pos.z),
                size: size
            });
        });
        
        // Create medium detail representation (simplified trees)
        const mediumDetailGroup = new THREE.Group();
        this.treePositions.forEach(pos => {
            const size = this.options.minSize + Math.random() * (this.options.maxSize - this.options.minSize);
            
            // Simplified tree with fewer polygons
            const trunkGeometry = new THREE.CylinderGeometry(0.3, 0.4, 2, 6);
            const trunkMaterial = new THREE.MeshBasicMaterial({ color: 0x8B4513 });
            const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
            trunk.position.y = 1;
            
            const foliageGeometry = new THREE.ConeGeometry(1.5, 2, 6);
            const foliageMaterial = new THREE.MeshBasicMaterial({ color: 0x2F4F4F });
            const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
            foliage.position.y = 3;
            
            const simplifiedTree = new THREE.Group();
            simplifiedTree.add(trunk);
            simplifiedTree.add(foliage);
            simplifiedTree.position.set(pos.x, pos.y || 0, pos.z);
            simplifiedTree.scale.set(size, size, size);
            
            mediumDetailGroup.add(simplifiedTree);
        });
        
        // Create low detail representation (billboards or merged geometry)
        const lowDetailGroup = this.createLowDetailRepresentation();
        
        // Create LOD object
        const lod = new THREE.LOD();
        
        // Add detail levels
        lod.addLevel(highDetailGroup, 0);
        lod.addLevel(mediumDetailGroup, this.options.highDetailDistance);
        lod.addLevel(lowDetailGroup, this.options.mediumDetailDistance);
        
        // Add LOD to main group
        this.group.add(lod);
        this.lodObjects.push(lod);
    }
    
    /**
     * Create low detail representation of the cluster
     * @returns {THREE.Group} - Low detail representation
     */
    createLowDetailRepresentation() {
        const group = new THREE.Group();
        
        // For very distant view, just create a few representative trees
        // or a single merged geometry to represent the whole cluster
        const clusterRadius = this.calculateClusterRadius();
        
        // Create a simplified representation with just a few trees
        const maxLowDetailTrees = Math.min(5, Math.ceil(this.treePositions.length / 5));
        
        for (let i = 0; i < maxLowDetailTrees; i++) {
            const angle = (i / maxLowDetailTrees) * Math.PI * 2;
            const distance = clusterRadius * 0.5;
            
            const x = this.centerPosition.x + Math.cos(angle) * distance;
            const z = this.centerPosition.z + Math.sin(angle) * distance;
            
            // Very simple tree representation
            const trunkGeometry = new THREE.CylinderGeometry(0.3, 0.4, 2, 4);
            const trunkMaterial = new THREE.MeshBasicMaterial({ color: 0x8B4513 });
            const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
            trunk.position.y = 1;
            
            const foliageGeometry = new THREE.ConeGeometry(1.5, 2, 4);
            const foliageMaterial = new THREE.MeshBasicMaterial({ color: 0x2F4F4F });
            const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
            foliage.position.y = 3;
            
            const simplifiedTree = new THREE.Group();
            simplifiedTree.add(trunk);
            simplifiedTree.add(foliage);
            simplifiedTree.position.set(x, 0, z);
            
            group.add(simplifiedTree);
        }
        
        return group;
    }
    
    /**
     * Calculate the radius of the cluster
     * @returns {number} - Radius of the cluster
     */
    calculateClusterRadius() {
        if (this.treePositions.length === 0) {
            return 0;
        }
        
        let maxDistance = 0;
        this.treePositions.forEach(pos => {
            const distance = Math.sqrt(
                Math.pow(pos.x - this.centerPosition.x, 2) +
                Math.pow(pos.z - this.centerPosition.z, 2)
            );
            maxDistance = Math.max(maxDistance, distance);
        });
        
        return maxDistance;
    }
    
    /**
     * Update LOD based on camera position
     * @param {THREE.Vector3} cameraPosition - Current camera position
     */
    updateLOD(cameraPosition) {
        if (!this.lodEnabled || this.lodObjects.length === 0) {
            return;
        }
        
        this.lodObjects.forEach(lod => {
            lod.update(cameraPosition);
        });
    }
    
    /**
     * Get the mesh for this cluster
     * @returns {THREE.Group} - The cluster mesh
     */
    getMesh() {
        return this.group;
    }
    
    /**
     * Get individual trees for collision detection
     * @returns {Array} - Array of individual tree objects
     */
    getIndividualTrees() {
        return this.individualTrees;
    }
    
    /**
     * Check if a point is inside the cluster's bounding box
     * @param {THREE.Vector3} point - The point to check
     * @returns {boolean} - True if the point is inside the bounding box
     */
    containsPoint(point) {
        return this.boundingBox.containsPoint(point);
    }
    
    /**
     * Get the distance from a point to the cluster center
     * @param {THREE.Vector3} point - The point to check
     * @returns {number} - Distance to the cluster center
     */
    distanceToPoint(point) {
        return this.centerPosition.distanceTo(point);
    }
    
    /**
     * Dispose of all geometries and materials
     */
    dispose() {
        // Dispose of all geometries and materials
        this.group.traverse(object => {
            if (object.geometry) {
                object.geometry.dispose();
            }
            
            if (object.material) {
                if (Array.isArray(object.material)) {
                    object.material.forEach(material => material.dispose());
                } else {
                    object.material.dispose();
                }
            }
        });
        
        // Clear arrays
        this.individualTrees = [];
        this.lodObjects = [];
    }
}