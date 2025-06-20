import * as THREE from 'three';

/**
 * MagicalFlower - Creates a magical flower with glowing effect
 */
export class MagicalFlower {
    /**
     * Constructor for MagicalFlower
     * @param {THREE.Scene} scene - The scene to add the flower to
     * @param {Object} worldManager - The world manager
     */
    constructor(scene, worldManager) {
        this.scene = scene;
        this.worldManager = worldManager;
    }

    /**
     * Create a magical flower mesh
     * @param {THREE.Vector3} position - Position of the flower
     * @param {number} size - Size of the flower
     * @param {Object} data - Additional data for customization
     * @returns {THREE.Group} - The flower group
     */
    createMesh(position, size, data = {}) {
        // Create a magical flower with glowing effect
        const stemGeometry = new THREE.CylinderGeometry(0.02 * size, 0.03 * size, 0.4 * size, 8);
        const stemMaterial = new THREE.MeshLambertMaterial({ color: 0x2E7D32 });
        const stem = new THREE.Mesh(stemGeometry, stemMaterial);
        
        // Create petals
        const petalGeometry = new THREE.SphereGeometry(0.1 * size, 8, 6);
        const petalMaterial = new THREE.MeshLambertMaterial({ 
            color: 0xFF69B4,
            emissive: 0x441144,
            transparent: true,
            opacity: 0.9
        });
        
        const flowerGroup = new THREE.Group();
        flowerGroup.add(stem);
        
        // Add 5 petals in a circle
        for (let i = 0; i < 5; i++) {
            const petal = new THREE.Mesh(petalGeometry, petalMaterial);
            const angle = (i / 5) * Math.PI * 2;
            petal.position.x = Math.cos(angle) * 0.08 * size;
            petal.position.y = 0.2 * size;
            petal.position.z = Math.sin(angle) * 0.08 * size;
            flowerGroup.add(petal);
        }
        
        // Add center
        const centerGeometry = new THREE.SphereGeometry(0.03 * size, 8, 6);
        const centerMaterial = new THREE.MeshLambertMaterial({ 
            color: 0xFFFF00,
            emissive: 0x444400
        });
        const center = new THREE.Mesh(centerGeometry, centerMaterial);
        center.position.y = 0.2 * size;
        flowerGroup.add(center);
        
        // Position on terrain
        flowerGroup.position.copy(position);
        
        // Add to scene
        this.scene.add(flowerGroup);
        
        return flowerGroup;
    }
}