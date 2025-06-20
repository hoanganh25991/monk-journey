import * as THREE from 'three';

/**
 * Stump - Creates a tree stump
 */
export class Stump {
    /**
     * Constructor for Stump
     * @param {THREE.Scene} scene - The scene to add the stump to
     * @param {Object} worldManager - The world manager
     */
    constructor(scene, worldManager) {
        this.scene = scene;
        this.worldManager = worldManager;
    }

    /**
     * Create a stump mesh
     * @param {THREE.Vector3} position - Position of the stump
     * @param {number} size - Size of the stump
     * @param {Object} data - Additional data for customization
     * @returns {THREE.Group} - The stump group
     */
    createMesh(position, size, data = {}) {
        // Create a tree stump
        const trunkGeometry = new THREE.CylinderGeometry(0.6 * size, 0.7 * size, 0.8 * size, 12);
        const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x8D6E63 });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        
        // Create top of stump with rings
        const topGeometry = new THREE.CylinderGeometry(0.6 * size, 0.6 * size, 0.1 * size, 12);
        const topMaterial = new THREE.MeshLambertMaterial({ color: 0xA1887F });
        const top = new THREE.Mesh(topGeometry, topMaterial);
        top.position.y = 0.45 * size;
        
        // Create rings on top
        const ringGeometry = new THREE.RingGeometry(0.2 * size, 0.25 * size, 32);
        const ringMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x795548, 
            side: THREE.DoubleSide 
        });
        const ring1 = new THREE.Mesh(ringGeometry, ringMaterial);
        ring1.rotation.x = -Math.PI / 2;
        ring1.position.y = 0.51 * size;
        
        const ring2 = new THREE.Mesh(
            new THREE.RingGeometry(0.35 * size, 0.4 * size, 32),
            ringMaterial
        );
        ring2.rotation.x = -Math.PI / 2;
        ring2.position.y = 0.51 * size;
        
        const ring3 = new THREE.Mesh(
            new THREE.RingGeometry(0.5 * size, 0.55 * size, 32),
            ringMaterial
        );
        ring3.rotation.x = -Math.PI / 2;
        ring3.position.y = 0.51 * size;
        
        // Create a group for the stump
        const stumpGroup = new THREE.Group();
        stumpGroup.add(trunk);
        stumpGroup.add(top);
        stumpGroup.add(ring1);
        stumpGroup.add(ring2);
        stumpGroup.add(ring3);
        
        // Position on terrain
        stumpGroup.position.copy(position);
        // Adjust y-position to sit properly on the ground
        // Instead of embedding, we'll place it on the surface
        stumpGroup.position.y += 0.1 * size; // Raise slightly above ground
        
        // Add to scene
        this.scene.add(stumpGroup);
        
        return stumpGroup;
    }
}