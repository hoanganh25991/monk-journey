import * as THREE from 'three';

/**
 * Shrine - Creates a simple shrine structure
 */
export class Shrine {
    /**
     * Constructor for Shrine
     * @param {THREE.Scene} scene - The scene to add the shrine to
     * @param {Object} worldManager - The world manager
     */
    constructor(scene, worldManager) {
        this.scene = scene;
        this.worldManager = worldManager;
    }

    /**
     * Create a shrine mesh
     * @param {THREE.Vector3} position - Position of the shrine
     * @param {number} size - Size of the shrine
     * @param {Object} data - Additional data for customization
     * @returns {THREE.Group} - The shrine group
     */
    createMesh(position, size, data = {}) {
        // Create a simple shrine
        const baseGeometry = new THREE.BoxGeometry(2 * size, 0.5 * size, 2 * size);
        const baseMaterial = new THREE.MeshLambertMaterial({ color: 0x9E9E9E });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        
        // Create pillars
        const pillarGeometry = new THREE.CylinderGeometry(0.15 * size, 0.15 * size, 1.5 * size, 8);
        const pillarMaterial = new THREE.MeshLambertMaterial({ color: 0x757575 });
        
        const pillar1 = new THREE.Mesh(pillarGeometry, pillarMaterial);
        pillar1.position.set(0.7 * size, 0.75 * size, 0.7 * size);
        
        const pillar2 = new THREE.Mesh(pillarGeometry, pillarMaterial);
        pillar2.position.set(-0.7 * size, 0.75 * size, 0.7 * size);
        
        const pillar3 = new THREE.Mesh(pillarGeometry, pillarMaterial);
        pillar3.position.set(0.7 * size, 0.75 * size, -0.7 * size);
        
        const pillar4 = new THREE.Mesh(pillarGeometry, pillarMaterial);
        pillar4.position.set(-0.7 * size, 0.75 * size, -0.7 * size);
        
        // Create roof
        const roofGeometry = new THREE.BoxGeometry(2.4 * size, 0.3 * size, 2.4 * size);
        const roofMaterial = new THREE.MeshLambertMaterial({ color: 0x616161 });
        const roof = new THREE.Mesh(roofGeometry, roofMaterial);
        roof.position.y = 1.5 * size;
        
        // Create a small altar in the center
        const altarGeometry = new THREE.BoxGeometry(0.8 * size, 0.8 * size, 0.8 * size);
        const altarMaterial = new THREE.MeshLambertMaterial({ color: 0xBDBDBD });
        const altar = new THREE.Mesh(altarGeometry, altarMaterial);
        altar.position.y = 0.4 * size;
        
        // Create a group for the shrine
        const shrineGroup = new THREE.Group();
        shrineGroup.add(base);
        shrineGroup.add(pillar1);
        shrineGroup.add(pillar2);
        shrineGroup.add(pillar3);
        shrineGroup.add(pillar4);
        shrineGroup.add(roof);
        shrineGroup.add(altar);
        
        // Position on terrain
        shrineGroup.position.copy(position);
        // Ensure shrine sits properly on the ground
        shrineGroup.position.y += 0.25 * size;
        
        // Add to scene
        this.scene.add(shrineGroup);
        
        return shrineGroup;
    }
}