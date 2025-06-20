import * as THREE from 'three';

/**
 * SmallCrystal - Creates a small crystal formation
 */
export class SmallCrystal {
    /**
     * Constructor for SmallCrystal
     * @param {THREE.Scene} scene - The scene to add the crystal to
     * @param {Object} worldManager - The world manager
     */
    constructor(scene, worldManager) {
        this.scene = scene;
        this.worldManager = worldManager;
    }

    /**
     * Create a small crystal mesh
     * @param {THREE.Vector3} position - Position of the crystal
     * @param {number} size - Size of the crystal
     * @param {Object} data - Additional data for customization
     * @returns {THREE.Mesh} - The crystal mesh
     */
    createMesh(position, size, data = {}) {
        // Create a small crystal formation using a scaled-down crystal
        const geometry = new THREE.OctahedronGeometry(0.3 * size, 0);
        const material = new THREE.MeshLambertMaterial({ 
            color: 0x00FFFF,
            transparent: true,
            opacity: 0.8,
            emissive: 0x004444
        });
        const crystal = new THREE.Mesh(geometry, material);
        
        // Position on terrain
        crystal.position.copy(position);
        crystal.position.y += 0.15 * size; // Raise slightly above ground
        
        // Random rotation
        crystal.rotation.x = Math.random() * Math.PI;
        crystal.rotation.y = Math.random() * Math.PI * 2;
        crystal.rotation.z = Math.random() * Math.PI;
        
        // Add to scene
        this.scene.add(crystal);
        
        return crystal;
    }
}