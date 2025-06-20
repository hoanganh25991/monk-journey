import * as THREE from 'three';

/**
 * StoneCircle - Creates a circle of standing stones
 */
export class StoneCircle {
    /**
     * Constructor for StoneCircle
     * @param {THREE.Scene} scene - The scene to add the stone circle to
     * @param {Object} worldManager - The world manager
     */
    constructor(scene, worldManager) {
        this.scene = scene;
        this.worldManager = worldManager;
    }

    /**
     * Create a stone circle mesh
     * @param {THREE.Vector3} position - Position of the stone circle
     * @param {number} size - Size of the stone circle
     * @param {Object} data - Additional data for customization
     * @returns {THREE.Group} - The stone circle group
     */
    createMesh(position, size, data = {}) {
        // Create a circle of standing stones
        const stoneCircleGroup = new THREE.Group();
        const numStones = 6;
        const radius = 2 * size;
        
        for (let i = 0; i < numStones; i++) {
            const angle = (i / numStones) * Math.PI * 2;
            const stoneGeometry = new THREE.BoxGeometry(
                0.3 * size, 
                (1.2 + Math.random() * 0.6) * size, 
                0.2 * size
            );
            const stoneMaterial = new THREE.MeshLambertMaterial({ color: 0x616161 });
            const stone = new THREE.Mesh(stoneGeometry, stoneMaterial);
            
            stone.position.x = Math.cos(angle) * radius;
            stone.position.y = 0.6 * size;
            stone.position.z = Math.sin(angle) * radius;
            
            // Slight random rotation
            stone.rotation.y = angle + (Math.random() - 0.5) * 0.3;
            
            stoneCircleGroup.add(stone);
        }
        
        // Position on terrain
        stoneCircleGroup.position.copy(position);
        
        // Add to scene
        this.scene.add(stoneCircleGroup);
        
        return stoneCircleGroup;
    }
}