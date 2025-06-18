import * as THREE from 'three';

/**
 * Well - Creates a village well
 * A decorative well structure for village environments
 */
export class Statue {
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
        // Create a simple statue (can be enhanced later)
        const baseGeometry = new THREE.CylinderGeometry(data.size * 0.5, data.size * 0.7, data.size * 0.5, 8);
        const baseMaterial = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.7 });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        
        const statueGeometry = new THREE.CylinderGeometry(data.size * 0.2, data.size * 0.2, data.size * 2, 8);
        const statueMaterial = new THREE.MeshStandardMaterial({ color: 0xAAAAAA, roughness: 0.5 });
        const statue = new THREE.Mesh(statueGeometry, statueMaterial);
        statue.position.y = data.size * 1.25;
        
        const group = new THREE.Group();
        group.add(base);
        group.add(statue);
        
        group.position.set(data.position.x, 0, data.position.z);
        group.userData = { type: 'statue' };
        
        return group;
    }
}