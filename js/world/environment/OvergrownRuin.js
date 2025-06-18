import * as THREE from 'three';

/**
 * OvergrownRuin - Creates an ancient ruin structure with vegetation growing on it
 */
export class OvergrownRuin {
    constructor(scene, MapManager) {
        this.scene = scene;
        this.MapManager = MapManager;
    }

    /**
     * Create the overgrown ruin mesh
     * @param {THREE.Vector3} position - Position of the ruin
     * @param {number} size - Size scale of the ruin
     * @param {Object} data - Additional configuration data
     * @returns {THREE.Group} - The ruin group
     */
    createMesh(position, size, data = {}) {
        const ruinGroup = new THREE.Group();
        
        // Create the base structure - a partially destroyed wall
        const wallGeometry = new THREE.BoxGeometry(3 * size, 2 * size, 0.5 * size);
        const wallMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x9E9E9E,
            roughness: 0.8,
            metalness: 0.2
        });
        const wall = new THREE.Mesh(wallGeometry, wallMaterial);
        
        // Create a more interesting shape by removing parts of the wall
        // We'll use a CSG-like approach by adding "damage" to the wall
        const damageGeometry = new THREE.SphereGeometry(0.8 * size, 16, 16);
        const damageMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
        
        // Create several damage points
        for (let i = 0; i < 3; i++) {
            const damage = new THREE.Mesh(damageGeometry, damageMaterial);
            
            // Position the damage at random points on the wall
            damage.position.x = (Math.random() - 0.5) * 2 * size;
            damage.position.y = (Math.random() - 0.5) * 1.5 * size;
            damage.position.z = (Math.random() - 0.5) * 0.2 * size;
            
            // Add the damage to the wall (visually only)
            ruinGroup.add(damage);
        }
        
        // Add the wall to the group
        ruinGroup.add(wall);
        
        // Add some fallen stones around the base
        for (let i = 0; i < 5; i++) {
            const stoneSize = (0.2 + Math.random() * 0.3) * size;
            const stoneGeometry = new THREE.BoxGeometry(stoneSize, stoneSize, stoneSize);
            const stoneMaterial = new THREE.MeshLambertMaterial({ color: 0x9E9E9E });
            const stone = new THREE.Mesh(stoneGeometry, stoneMaterial);
            
            // Position the stones around the base of the wall
            const angle = Math.random() * Math.PI * 2;
            const distance = (1 + Math.random()) * size;
            
            stone.position.x = Math.cos(angle) * distance;
            stone.position.z = Math.sin(angle) * distance;
            stone.position.y = stoneSize / 2; // Half height to sit on ground
            
            // Random rotation for natural look
            stone.rotation.x = Math.random() * Math.PI;
            stone.rotation.y = Math.random() * Math.PI;
            stone.rotation.z = Math.random() * Math.PI;
            
            ruinGroup.add(stone);
        }
        
        // Add vegetation growing on the wall
        for (let i = 0; i < 8; i++) {
            // Create simple vegetation using planes with transparent textures
            const vegGeometry = new THREE.PlaneGeometry(0.5 * size, 0.5 * size);
            const vegMaterial = new THREE.MeshBasicMaterial({ 
                color: 0x4CAF50,
                transparent: true,
                opacity: 0.9,
                side: THREE.DoubleSide
            });
            const vegetation = new THREE.Mesh(vegGeometry, vegMaterial);
            
            // Position the vegetation on the wall
            vegetation.position.x = (Math.random() - 0.5) * 2.5 * size;
            vegetation.position.y = (Math.random() - 0.5) * 1.5 * size + (size * 0.5); // Bias toward top
            vegetation.position.z = (Math.random() - 0.5) * 0.2 * size + (0.3 * size); // Slightly in front
            
            // Random rotation for natural look
            vegetation.rotation.x = Math.random() * Math.PI / 4;
            vegetation.rotation.y = Math.random() * Math.PI;
            vegetation.rotation.z = Math.random() * Math.PI / 4;
            
            ruinGroup.add(vegetation);
        }
        
        // Position the entire group
        ruinGroup.position.copy(position);
        
        // Add to scene
        this.scene.add(ruinGroup);
        
        return ruinGroup;
    }
}