import * as THREE from 'three';

/**
 * FairyCircle class - Creates a magical fairy circle environment object
 * A ring of glowing mushrooms or flowers with particle effects
 */
export class FairyCircle {
    /**
     * Create a new FairyCircle instance
     * @param {THREE.Scene} scene - The scene to add the fairy circle to
     * @param {Object} MapManager - The world manager instance
     */
    constructor(scene, MapManager) {
        this.scene = scene;
        this.MapManager = MapManager;
    }
    
    /**
     * Create the fairy circle mesh
     * @param {THREE.Vector3} position - The position to place the fairy circle
     * @param {number} size - The size of the fairy circle
     * @param {Object} data - Additional data for customization
     * @returns {THREE.Group} - The fairy circle group
     */
    createMesh(position, size = 1, data = {}) {
        // Create a group to hold all parts of the fairy circle
        const group = new THREE.Group();
        
        // Set position
        group.position.copy(position);
        
        // Create the base circle on the ground
        const circleGeometry = new THREE.CircleGeometry(size, 16); // Reduced segments
        const circleMaterial = new THREE.MeshLambertMaterial({
            color: 0x88ff99,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
        });
        const circle = new THREE.Mesh(circleGeometry, circleMaterial);
        circle.rotation.x = -Math.PI / 2; // Lay flat on the ground
        circle.position.y = 0.01; // Slightly above ground to prevent z-fighting
        group.add(circle);
        
        // Create a simplified ring of basic mushrooms (no flowers, no lights)
        const itemCount = Math.min(8, Math.floor(4 + size * 2)); // Fewer items, capped at 8
        const radius = size * 0.9; // Slightly smaller than the glowing circle
        
        for (let i = 0; i < itemCount; i++) {
            const angle = (i / itemCount) * Math.PI * 2;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            
            // Only create simple mushrooms (no alternating flowers)
            const mushroom = this.createSimpleMushroom(size * 0.3);
            mushroom.position.set(x, 0, z);
            group.add(mushroom);
        }
        
        // Remove particle effects for performance
        // const particles = this.createParticleSystem(size);
        // group.add(particles);
        
        // Add to scene
        this.scene.add(group);
        
        return group;
    }
    
    /**
     * Create a simple mushroom (performance optimized)
     * @param {number} size - The size of the mushroom
     * @returns {THREE.Group} - The mushroom group
     */
    createSimpleMushroom(size) {
        const mushroomGroup = new THREE.Group();
        
        // Create stem - reduced segments
        const stemGeometry = new THREE.CylinderGeometry(size * 0.1, size * 0.15, size * 0.5, 6);
        const stemMaterial = new THREE.MeshLambertMaterial({ color: 0xECEFF1 });
        const stem = new THREE.Mesh(stemGeometry, stemMaterial);
        stem.position.y = size * 0.25;
        mushroomGroup.add(stem);
        
        // Create cap - reduced segments, no emissive glow
        const capGeometry = new THREE.SphereGeometry(size * 0.3, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2);
        const capMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x88ffaa
            // Removed emissive properties for performance
        });
        const cap = new THREE.Mesh(capGeometry, capMaterial);
        cap.position.y = size * 0.5;
        cap.scale.set(1.2, 1, 1.2);
        mushroomGroup.add(cap);
        
        // Remove point light for performance
        // const light = new THREE.PointLight(0x88ffaa, 0.5, size * 2);
        // light.position.y = size * 0.5;
        // mushroomGroup.add(light);
        
        return mushroomGroup;
    }
    
    /**
     * Clean up resources (optional method for better resource management)
     * @param {THREE.Group} group - The fairy circle group to clean up
     */
    dispose(group) {
        if (group) {
            group.traverse((child) => {
                if (child.geometry) {
                    child.geometry.dispose();
                }
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(material => material.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
            });
            
            // Remove from scene
            if (this.scene && group.parent === this.scene) {
                this.scene.remove(group);
            }
        }
    }
}