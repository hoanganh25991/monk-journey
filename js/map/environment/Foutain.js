import * as THREE from 'three';

/**
 * Well - Creates a village well
 * A decorative well structure for village environments
 */
export class Foutain {
    constructor(scene, MapManager) {
        this.scene = scene;
        this.MapManager = MapManager;
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
        // Create a simple fountain (can be enhanced later)
        const baseGeometry = new THREE.CylinderGeometry(data.size * 1.5, data.size * 1.8, data.size * 0.5, 16);
        const baseMaterial = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.7 });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        
        const waterGeometry = new THREE.CylinderGeometry(data.size * 1.2, data.size * 1.2, data.size * 0.2, 16);
        const waterMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x3399FF, 
            roughness: 0.1,
            metalness: 0.3,
            transparent: true,
            opacity: 0.8
        });
        const water = new THREE.Mesh(waterGeometry, waterMaterial);
        water.position.y = data.size * 0.35;
        
        const centerGeometry = new THREE.CylinderGeometry(data.size * 0.3, data.size * 0.4, data.size * 0.8, 8);
        const centerMaterial = new THREE.MeshStandardMaterial({ color: 0x999999, roughness: 0.6 });
        const center = new THREE.Mesh(centerGeometry, centerMaterial);
        center.position.y = data.size * 0.65;
        
        const group = new THREE.Group();
        group.add(base);
        group.add(water);
        group.add(center);
        
        group.position.set(data.position.x, 0, data.position.z);
        group.userData = { type: 'fountain' };
        
        return group;
    }
}