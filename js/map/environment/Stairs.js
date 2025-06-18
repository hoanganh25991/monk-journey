import * as THREE from 'three';

/**
 * Represents a stairs environment object
 */
export class Stairs {
    /**
     * Create a new stairs object
     * @param {THREE.Scene} scene - The scene to add the stairs to
     * @param {Object} MapManager - The map manager
     */
    constructor(scene, MapManager) {
        this.scene = scene;
        this.MapManager = MapManager;
    }

    /**
     * Create the stairs mesh
     * @param {Object} data - Stairs data including position, width, and height
     * @returns {THREE.Group} - The stairs group
     */
    createMesh(data) {
        const width = data.width || 4;
        const height = data.height || 2;
        const steps = 5; // Number of steps
        const stepHeight = height / steps;
        const stepDepth = width / steps;
        
        const stairsGroup = new THREE.Group();
        
        // Create each step
        for (let i = 0; i < steps; i++) {
            const stepGeometry = new THREE.BoxGeometry(width, stepHeight, stepDepth);
            const stepMaterial = new THREE.MeshStandardMaterial({ color: 0x999999, roughness: 0.8 });
            const step = new THREE.Mesh(stepGeometry, stepMaterial);
            
            // Position each step
            step.position.set(
                0,
                i * stepHeight + stepHeight / 2,
                i * stepDepth - width / 2 + stepDepth / 2
            );
            
            stairsGroup.add(step);
        }
        
        stairsGroup.position.set(data.position.x, data.position.y || 0, data.position.z);
        
        if (data.rotation !== undefined) {
            stairsGroup.rotation.y = data.rotation;
        }
        
        stairsGroup.userData = { type: 'stairs' };
        
        return stairsGroup;
    }
}