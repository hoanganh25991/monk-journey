import * as THREE from 'three';

/**
 * AshPile - Creates piles of volcanic ash for desert/volcanic environments
 */
export class AshPile {
    constructor(scene, worldManager) {
        this.scene = scene;
        this.worldManager = worldManager;
    }

    /**
     * Create the ash pile mesh
     * @param {THREE.Vector3} position - Position of the ash pile
     * @param {number} size - Size scale of the ash pile
     * @param {Object} data - Additional configuration data
     * @returns {THREE.Group} - The ash pile group
     */
    createMesh(position, size, data = {}) {
        const ashGroup = new THREE.Group();
        
        // Create multiple ash mounds for natural look
        const moundCount = 2 + Math.floor(Math.random() * 3);
        
        for (let i = 0; i < moundCount; i++) {
            // Create ash mound with flattened sphere geometry
            const ashGeometry = new THREE.SphereGeometry(0.3 * size, 8, 6);
            const ashMaterial = new THREE.MeshLambertMaterial({
                color: 0x4A4A4A, // Dark gray
                roughness: 1.0,
                metalness: 0.0
            });
            
            const ashMound = new THREE.Mesh(ashGeometry, ashMaterial);
            
            // Flatten the mound
            ashMound.scale.set(1.2, 0.3, 1.2);
            
            // Random position within the pile area
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 0.2 * size;
            ashMound.position.x = Math.cos(angle) * radius;
            ashMound.position.z = Math.sin(angle) * radius;
            ashMound.position.y = 0.1 * size;
            
            // Add some rotation for natural look
            ashMound.rotation.y = Math.random() * Math.PI * 2;
            
            ashMound.castShadow = true;
            ashMound.receiveShadow = true;
            
            ashGroup.add(ashMound);
        }
        
        // Add some ash particles floating above
        this.addAshParticles(ashGroup, size);
        
        // Position the entire group
        ashGroup.position.copy(position);
        
        // Add to scene
        this.scene.add(ashGroup);
        
        return ashGroup;
    }
    
    /**
     * Add floating ash particles
     * @param {THREE.Group} group - The group to add to
     * @param {number} size - Size scale
     */
    addAshParticles(group, size) {
        const particleCount = 15;
        const particleGeometry = new THREE.BufferGeometry();
        const particlePositions = [];
        
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 0.5 * size;
            const height = Math.random() * 0.3 * size;
            
            particlePositions.push(
                Math.cos(angle) * radius,
                height,
                Math.sin(angle) * radius
            );
        }
        
        particleGeometry.setAttribute('position', new THREE.Float32BufferAttribute(particlePositions, 3));
        
        const particleMaterial = new THREE.PointsMaterial({
            color: 0x6A6A6A,
            size: 0.02 * size,
            transparent: true,
            opacity: 0.6
        });
        
        const particles = new THREE.Points(particleGeometry, particleMaterial);
        group.add(particles);
    }
}