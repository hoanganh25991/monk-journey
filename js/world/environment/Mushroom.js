import * as THREE from 'three';

/**
 * Mushroom - Creates a simple mushroom
 */
export class Mushroom {
    /**
     * Constructor for Mushroom
     * @param {THREE.Scene} scene - The scene to add the mushroom to
     * @param {Object} worldManager - The world manager
     */
    constructor(scene, worldManager) {
        this.scene = scene;
        this.worldManager = worldManager;
    }

    /**
     * Create a mushroom mesh
     * @param {THREE.Vector3} position - Position of the mushroom
     * @param {number} size - Size of the mushroom
     * @param {Object} data - Additional data for customization
     * @returns {THREE.Group} - The mushroom group
     */
    createMesh(position, size, data = {}) {
        // Create a simple mushroom
        const stemGeometry = new THREE.CylinderGeometry(0.1 * size, 0.15 * size, 0.5 * size, 8);
        const stemMaterial = new THREE.MeshLambertMaterial({ color: 0xECEFF1 });
        const stem = new THREE.Mesh(stemGeometry, stemMaterial);
        
        // Create cap
        const capGeometry = new THREE.SphereGeometry(0.3 * size, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
        const capMaterial = new THREE.MeshLambertMaterial({ color: 0xE53935 });
        const cap = new THREE.Mesh(capGeometry, capMaterial);
        cap.position.y = 0.25 * size;
        cap.scale.set(1.2, 1, 1.2);
        
        // Create a group for the mushroom
        const mushroomGroup = new THREE.Group();
        mushroomGroup.add(stem);
        mushroomGroup.add(cap);
        
        // Position on terrain
        mushroomGroup.position.copy(position);
        // Ensure mushroom sits properly on the ground
        mushroomGroup.position.y += 0.15 * size;
        
        // Add to scene
        this.scene.add(mushroomGroup);
        
        return mushroomGroup;
    }
}