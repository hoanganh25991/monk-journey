import * as THREE from 'three';
import { Tree } from './Tree.js';

/**
 * TreeWithLOD - Extends the Tree class with Level of Detail (LOD) capabilities
 * Maintains consistent visual appearance at different distances
 */
export class TreeWithLOD {
    /**
     * Create a new tree with LOD
     * @param {string} zoneType - The type of zone (Forest, Desert, etc.)
     */
    constructor(zoneType = 'Forest') {
        this.tree = new Tree(zoneType);
        this.zoneType = zoneType;
        
        // Create LOD object
        this.lod = new THREE.LOD();
    }
    
    /**
     * Create the tree mesh with LOD
     * @returns {THREE.LOD} - The LOD object containing the tree
     */
    createMesh() {
        // Create the high-detail tree (original implementation)
        const highDetailTree = this.tree.createMesh();
        
        // Add the high-detail level (visible at all distances)
        this.lod.addLevel(highDetailTree, 0);
        
        // We're not adding lower detail levels to maintain consistent appearance
        // This way the tree will always look the same regardless of distance
        
        return this.lod;
    }
}