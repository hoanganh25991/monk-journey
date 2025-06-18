import * as THREE from 'three';

/**
 * Berry Bush - A specialized bush with colorful berries
 * Features a bush-like structure with clusters of berries
 */
export class BerryBush {
    constructor(scene, MapManager) {
        this.scene = scene;
        this.MapManager = MapManager;
    }
    
    /**
     * Create a berry bush mesh
     * @param {THREE.Vector3} position - Position of the bush
     * @param {number} size - Size multiplier for the bush
     * @param {Object} data - Additional data for customization
     * @returns {THREE.Group} - The bush group
     */
    createMesh(position, size = 1, data = {}) {
        // Create a group to hold all parts of the berry bush
        const bushGroup = new THREE.Group();
        
        // Get color variations from data or use defaults
        const foliageColor = data.foliageColor || 0x2d6a4f; // Dark green
        const berryColor = data.berryColor || this.getRandomBerryColor();
        
        // Create bush foliage (3-5 spheres)
        const numSpheres = 3 + Math.floor(Math.random() * 3);
        const bushMaterial = new THREE.MeshStandardMaterial({
            color: foliageColor,
            roughness: 0.8,
            metalness: 0.2
        });
        
        for (let i = 0; i < numSpheres; i++) {
            const baseSize = 0.5 + Math.random() * 0.5;
            const sphereSize = baseSize * size * (0.7 + Math.random() * 0.6);
            const bushGeometry = new THREE.SphereGeometry(sphereSize, 8, 6);
            const bushPart = new THREE.Mesh(bushGeometry, bushMaterial);
            
            // Position spheres to form a bush shape
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 0.3 * size;
            bushPart.position.set(
                Math.cos(angle) * radius,
                sphereSize * 0.8,
                Math.sin(angle) * radius
            );
            
            // Add some random scaling
            bushPart.scale.set(
                1.0 + Math.random() * 0.2,
                0.8 + Math.random() * 0.4,
                1.0 + Math.random() * 0.2
            );
            
            bushPart.castShadow = true;
            bushPart.receiveShadow = true;
            
            bushGroup.add(bushPart);
        }
        
        // Add berries to the bush (10-20 berries)
        const berryCount = 10 + Math.floor(Math.random() * 11);
        this.addBerries(bushGroup, berryCount, size, berryColor);
        
        // Position the bush
        bushGroup.position.copy(position);
        
        // Add to scene if scene is provided
        if (this.scene) {
            this.scene.add(bushGroup);
        }
        
        return bushGroup;
    }
    
    /**
     * Add berries to the bush
     * @param {THREE.Group} bushGroup - The bush group to add berries to
     * @param {number} count - Number of berries to add
     * @param {number} size - Size multiplier
     * @param {number} color - Color for the berries
     */
    addBerries(bushGroup, count, size, color) {
        // Create berry material with slight shine
        const berryMaterial = new THREE.MeshStandardMaterial({
            color: color,
            roughness: 0.3,
            metalness: 0.5
        });
        
        // Create berry geometry (small sphere)
        const berryGeometry = new THREE.SphereGeometry(0.05 * size, 8, 8);
        
        // Create berry clusters
        const clusterCount = 3 + Math.floor(Math.random() * 3); // 3-5 clusters
        
        for (let c = 0; c < clusterCount; c++) {
            // Create a cluster group
            const clusterGroup = new THREE.Group();
            
            // Position the cluster on the bush
            const angle = Math.random() * Math.PI * 2;
            const height = 0.3 + Math.random() * 0.7; // Vertical position (0.3-1.0)
            const radius = 0.3 + Math.random() * 0.4; // Distance from center
            
            clusterGroup.position.set(
                Math.cos(angle) * radius * size,
                height * size,
                Math.sin(angle) * radius * size
            );
            
            // Add berries to this cluster
            const berriesInCluster = Math.ceil(count / clusterCount);
            
            for (let i = 0; i < berriesInCluster; i++) {
                const berry = new THREE.Mesh(berryGeometry, berryMaterial);
                
                // Position berry within the cluster
                const berryAngle = Math.random() * Math.PI * 2;
                const berryRadius = Math.random() * 0.15 * size;
                
                berry.position.set(
                    Math.cos(berryAngle) * berryRadius,
                    Math.random() * 0.1 * size,
                    Math.sin(berryAngle) * berryRadius
                );
                
                // Random slight size variation
                const berryScale = 0.8 + Math.random() * 0.4;
                berry.scale.set(berryScale, berryScale, berryScale);
                
                berry.castShadow = true;
                
                clusterGroup.add(berry);
            }
            
            bushGroup.add(clusterGroup);
        }
    }
    
    /**
     * Get a random berry color
     * @returns {number} - The color as a hex value
     */
    getRandomBerryColor() {
        // Berry colors (red, blue, purple, black)
        const colors = [
            0xE53935, // Red
            0xD32F2F, // Dark red
            0x1E88E5, // Blue
            0x0D47A1, // Dark blue
            0x8E24AA, // Purple
            0x4A148C, // Dark purple
            0x424242, // Dark gray (blackberry)
            0x212121  // Very dark gray (blackberry)
        ];
        
        return colors[Math.floor(Math.random() * colors.length)];
    }
}