import * as THREE from 'three';

/**
 * Well - Creates a village well
 * A decorative well structure for village environments
 */
export class Well {
    constructor(scene, worldManager) {
        this.scene = scene;
        this.worldManager = worldManager;
    }

    /**
     * Create a well mesh
     * @param {Object} data - Configuration data
     * @param {THREE.Vector3} data.position - Position of the well
     * @param {number} data.size - Size multiplier
     * @param {Object} [data.options] - Additional options
     * @returns {THREE.Group} - The well group
     */
    createMesh(data) {
        const { position, size = 1, options = {} } = data;
        const wellGroup = new THREE.Group();
        
        // Create the base of the well (circular stone foundation)
        const baseGeometry = new THREE.CylinderGeometry(1.2 * size, 1.3 * size, 0.4 * size, 16);
        const baseMaterial = new THREE.MeshLambertMaterial({ color: 0x9E9E9E }); // Stone gray
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = 0.2 * size;
        wellGroup.add(base);
        
        // Create the well wall (cylinder with hollow center)
        const wallOuterRadius = 1 * size;
        const wallInnerRadius = 0.7 * size;
        const wallHeight = 1 * size;
        
        const wallGeometry = new THREE.CylinderGeometry(wallOuterRadius, wallOuterRadius, wallHeight, 16, 1, true);
        const wallMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x8D6E63, // Brown
            side: THREE.DoubleSide 
        });
        const wall = new THREE.Mesh(wallGeometry, wallMaterial);
        wall.position.y = 0.7 * size;
        wellGroup.add(wall);
        
        // Create the inner wall (darker color)
        const innerWallGeometry = new THREE.CylinderGeometry(wallInnerRadius, wallInnerRadius, wallHeight + 0.1, 16, 1, true);
        const innerWallMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x5D4037, // Darker brown
            side: THREE.DoubleSide 
        });
        const innerWall = new THREE.Mesh(innerWallGeometry, innerWallMaterial);
        innerWall.position.y = 0.7 * size;
        wellGroup.add(innerWall);
        
        // Create the water surface at the bottom of the well
        const waterGeometry = new THREE.CircleGeometry(wallInnerRadius - 0.05, 16);
        const waterMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x4FC3F7, // Light blue
            transparent: true,
            opacity: 0.8
        });
        const water = new THREE.Mesh(waterGeometry, waterMaterial);
        water.rotation.x = -Math.PI / 2; // Rotate to be horizontal
        water.position.y = 0.25 * size; // Position at the bottom of the well
        wellGroup.add(water);
        
        // Create the roof structure
        this.createRoof(wellGroup, size);
        
        // Create the bucket and rope
        this.createBucketAndRope(wellGroup, size);
        
        // Position the well
        wellGroup.position.copy(position);
        
        // Add to scene
        this.scene.add(wellGroup);
        
        return wellGroup;
    }
    
    /**
     * Create the roof structure for the well
     * @param {THREE.Group} wellGroup - The well group to add to
     * @param {number} size - Size multiplier
     */
    createRoof(wellGroup, size) {
        // Create two support posts
        const postGeometry = new THREE.CylinderGeometry(0.1 * size, 0.1 * size, 2 * size, 8);
        const postMaterial = new THREE.MeshLambertMaterial({ color: 0x5D4037 }); // Dark brown
        
        const post1 = new THREE.Mesh(postGeometry, postMaterial);
        post1.position.set(0.8 * size, 1 * size, 0);
        wellGroup.add(post1);
        
        const post2 = new THREE.Mesh(postGeometry, postMaterial);
        post2.position.set(-0.8 * size, 1 * size, 0);
        wellGroup.add(post2);
        
        // Create the crossbeam
        const beamGeometry = new THREE.BoxGeometry(2 * size, 0.15 * size, 0.15 * size);
        const beamMaterial = new THREE.MeshLambertMaterial({ color: 0x8D6E63 }); // Brown
        const beam = new THREE.Mesh(beamGeometry, beamMaterial);
        beam.position.y = 2 * size;
        wellGroup.add(beam);
        
        // Create a small roof (optional)
        const roofGeometry = new THREE.ConeGeometry(1.2 * size, 0.6 * size, 4);
        const roofMaterial = new THREE.MeshLambertMaterial({ color: 0x795548 }); // Brown
        const roof = new THREE.Mesh(roofGeometry, roofMaterial);
        roof.position.y = 2.3 * size;
        roof.rotation.y = Math.PI / 4; // Rotate 45 degrees
        wellGroup.add(roof);
    }
    
    /**
     * Create the bucket and rope for the well
     * @param {THREE.Group} wellGroup - The well group to add to
     * @param {number} size - Size multiplier
     */
    createBucketAndRope(wellGroup, size) {
        // Create the rope
        const ropeGeometry = new THREE.CylinderGeometry(0.03 * size, 0.03 * size, 1 * size, 8);
        const ropeMaterial = new THREE.MeshLambertMaterial({ color: 0xD7CCC8 }); // Light brown/tan
        const rope = new THREE.Mesh(ropeGeometry, ropeMaterial);
        rope.position.y = 1.5 * size;
        wellGroup.add(rope);
        
        // Create the bucket
        const bucketGeometry = new THREE.CylinderGeometry(0.2 * size, 0.15 * size, 0.3 * size, 10);
        const bucketMaterial = new THREE.MeshLambertMaterial({ color: 0x8D6E63 }); // Brown
        const bucket = new THREE.Mesh(bucketGeometry, bucketMaterial);
        bucket.position.y = 1 * size;
        wellGroup.add(bucket);
        
        // Create water in the bucket
        const bucketWaterGeometry = new THREE.CylinderGeometry(0.15 * size, 0.1 * size, 0.05 * size, 10);
        const bucketWaterMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x4FC3F7, // Light blue
            transparent: true,
            opacity: 0.8
        });
        const bucketWater = new THREE.Mesh(bucketWaterGeometry, bucketWaterMaterial);
        bucketWater.position.y = 1.15 * size;
        wellGroup.add(bucketWater);
    }
}