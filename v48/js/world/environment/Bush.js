import * as THREE from 'three';

/**
 * Represents a bush environment object
 */
export class Bush {
    /**
     * Create a new bush
     */
    constructor() {
        // Randomize bush properties
        this.random = Math.random;
        this.baseSize = 0.5 + this.random() * 0.5; // Base size between 0.5-1 units
        this.numSpheres = 3 + Math.floor(this.random() * 3); // 3-5 spheres
    }
    
    /**
     * Create the bush mesh
     * @returns {THREE.Group} - The bush group
     */
    createMesh() {
        const bushGroup = new THREE.Group();
        
        // Create bush foliage
        const bushMaterial = new THREE.MeshStandardMaterial({
            color: 0x2d6a4f, // Dark green
            roughness: 0.8,
            metalness: 0.2
        });
        
        // Create several spheres for the bush
        for (let i = 0; i < this.numSpheres; i++) {
            const size = this.baseSize * (0.7 + this.random() * 0.6);
            const bushGeometry = new THREE.SphereGeometry(size, 8, 6);
            const bushPart = new THREE.Mesh(bushGeometry, bushMaterial);
            
            // Position spheres to form a bush shape
            const angle = this.random() * Math.PI * 2;
            const radius = this.random() * 0.3;
            bushPart.position.set(
                Math.cos(angle) * radius,
                size * 0.8,
                Math.sin(angle) * radius
            );
            
            // Add some random scaling
            bushPart.scale.set(
                1.0 + this.random() * 0.2,
                0.8 + this.random() * 0.4,
                1.0 + this.random() * 0.2
            );
            
            bushPart.castShadow = true;
            bushPart.receiveShadow = true;
            
            bushGroup.add(bushPart);
        }
        
        return bushGroup;
    }
}