import * as THREE from 'three';
import { Rock } from './Rock.js';

/**
 * RockFormation - Creates a formation of multiple rocks
 */
export class RockFormation {
    /**
     * Constructor for RockFormation
     * @param {THREE.Scene} scene - The scene to add the rock formation to
     * @param {Object} worldManager - The world manager
     */
    constructor(scene, worldManager) {
        this.scene = scene;
        this.worldManager = worldManager;
    }

    /**
     * Create a rock formation mesh
     * @param {THREE.Vector3} position - Position of the rock formation
     * @param {number} size - Size of the rock formation
     * @param {Object} data - Additional data for customization
     * @returns {THREE.Group} - The rock formation group
     */
    createMesh(position, size, data = {}) {
        // Create a rock formation with multiple rocks
        const rockFormationGroup = new THREE.Group();
        
        // Add 3-5 rocks of varying sizes
        const rockCount = 3 + Math.floor(Math.random() * 3);
        
        for (let i = 0; i < rockCount; i++) {
            const rock = new Rock();
            const rockMesh = rock.createMesh();
            
            // Random scale for each rock
            const rockScale = (0.6 + Math.random() * 0.8) * size;
            
            // Position rocks in a cluster
            const angle = Math.random() * Math.PI * 2;
            const distance = (0.5 + Math.random() * 1.5) * size;
            
            rockMesh.position.x = position.x + Math.cos(angle) * distance;
            rockMesh.position.y = position.y + 0.2 * rockScale; // Raise slightly to ensure visibility
            rockMesh.position.z = position.z + Math.sin(angle) * distance;
            rockMesh.scale.set(rockScale, rockScale, rockScale);
            
            // Random rotation
            rockMesh.rotation.y = Math.random() * Math.PI * 2;
            
            rockFormationGroup.add(rockMesh);
        }
        
        // Add to scene
        this.scene.add(rockFormationGroup);
        
        return rockFormationGroup;
    }
}