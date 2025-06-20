import * as THREE from 'three';

/**
 * MountainPass - Creates a mountain pass with rocky walls
 */
export class MountainPass {
    /**
     * Constructor for MountainPass
     * @param {THREE.Scene} scene - The scene to add the mountain pass to
     * @param {Object} worldManager - The world manager
     */
    constructor(scene, worldManager) {
        this.scene = scene;
        this.worldManager = worldManager;
    }

    /**
     * Create a mountain pass mesh
     * @param {THREE.Vector3} position - Position of the mountain pass
     * @param {number} size - Size of the mountain pass
     * @param {Object} data - Additional data for customization
     * @returns {THREE.Group} - The mountain pass group
     */
    createMesh(position, size, data = {}) {
        // Create a mountain pass with rocky walls
        const passGroup = new THREE.Group();
        
        // Create rocky walls on both sides
        for (let side = 0; side < 2; side++) {
            const wallGroup = new THREE.Group();
            const sideMultiplier = side === 0 ? -1 : 1;
            
            // Create multiple rocks for each wall
            for (let i = 0; i < 3; i++) {
                const rockGeometry = new THREE.BoxGeometry(
                    (1 + Math.random() * 0.5) * size,
                    (2 + Math.random() * 1) * size,
                    (0.8 + Math.random() * 0.4) * size
                );
                const rockMaterial = new THREE.MeshLambertMaterial({ color: 0x5D4037 });
                const rock = new THREE.Mesh(rockGeometry, rockMaterial);
                
                rock.position.x = sideMultiplier * (2 + Math.random() * 1) * size;
                rock.position.y = 1 * size;
                rock.position.z = (i - 1) * 1.5 * size;
                
                // Random rotation
                rock.rotation.y = (Math.random() - 0.5) * 0.5;
                
                wallGroup.add(rock);
            }
            
            passGroup.add(wallGroup);
        }
        
        // Position on terrain
        passGroup.position.copy(position);
        
        // Add to scene
        this.scene.add(passGroup);
        
        return passGroup;
    }
}