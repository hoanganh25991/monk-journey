import * as THREE from 'three';

/**
 * FallenLog - Creates a fallen log
 */
export class FallenLog {
    /**
     * Constructor for FallenLog
     * @param {THREE.Scene} scene - The scene to add the fallen log to
     * @param {Object} worldManager - The world manager
     */
    constructor(scene, worldManager) {
        this.scene = scene;
        this.worldManager = worldManager;
    }

    /**
     * Create a fallen log mesh
     * @param {THREE.Vector3} position - Position of the fallen log
     * @param {number} size - Size of the fallen log
     * @param {Object} data - Additional data for customization
     * @returns {THREE.Group} - The fallen log group
     */
    createMesh(position, size, data = {}) {
        // Create a simple fallen log using a cylinder
        const geometry = new THREE.CylinderGeometry(0.5 * size, 0.4 * size, 4 * size, 8);
        const material = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        const log = new THREE.Mesh(geometry, material);
        
        // Rotate to make it horizontal
        log.rotation.z = Math.PI / 2;
        log.rotation.y = Math.random() * Math.PI;
        
        // Position on terrain
        log.position.copy(position);
        // Adjust y-position to sit properly on the ground
        // Instead of embedding, we'll just place it on the surface
        log.position.y += 0.2; // Raise slightly above ground
        
        // Add some detail
        const barkGeometry = new THREE.CylinderGeometry(0.55 * size, 0.45 * size, 4.1 * size, 8);
        const barkMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x5D4037,
            wireframe: true,
            transparent: true,
            opacity: 0.5
        });
        const bark = new THREE.Mesh(barkGeometry, barkMaterial);
        bark.rotation.z = Math.PI / 2;
        
        // Create a group for the log
        const logGroup = new THREE.Group();
        logGroup.add(log);
        logGroup.add(bark);
        
        // Add to scene
        this.scene.add(logGroup);
        
        return logGroup;
    }
}