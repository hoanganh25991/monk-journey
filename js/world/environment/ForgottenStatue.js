import * as THREE from 'three';

/**
 * ForgottenStatue - Creates an ancient, weathered statue
 * Represents a forgotten monument from an ancient civilization
 */
export class ForgottenStatue {
    /**
     * Create a new ForgottenStatue instance
     * @param {THREE.Scene} scene - The scene to add the statue to
     * @param {Object} worldManager - The world manager
     * @param {THREE.Vector3} position - The position of the statue
     * @param {number} size - The size multiplier for the statue
     */
    constructor(scene, worldManager, position, size) {
        this.scene = scene;
        this.worldManager = worldManager;
        this.position = position;
        this.size = size || 1;
        
        // Create the statue
        this.object = this.createMesh();
    }
    
    /**
     * Create the mesh for the forgotten statue
     * @returns {THREE.Group} The statue group
     */
    createMesh() {
        const statueGroup = new THREE.Group();
        
        // Create base/pedestal
        const baseGeometry = new THREE.BoxGeometry(1.2 * this.size, 0.4 * this.size, 1.2 * this.size);
        const baseMaterial = new THREE.MeshLambertMaterial({ color: 0x7D7D7D });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = 0.2 * this.size;
        statueGroup.add(base);
        
        // Create statue body
        const bodyGeometry = new THREE.CylinderGeometry(
            0.3 * this.size, 
            0.5 * this.size, 
            2 * this.size, 
            8
        );
        const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x9E9E9E });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 1.4 * this.size;
        statueGroup.add(body);
        
        // Create statue head
        const headGeometry = new THREE.SphereGeometry(0.4 * this.size, 8, 8);
        const headMaterial = new THREE.MeshLambertMaterial({ color: 0x9E9E9E });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 2.6 * this.size;
        statueGroup.add(head);
        
        // Create arms
        const armGeometry = new THREE.CylinderGeometry(
            0.1 * this.size,
            0.1 * this.size,
            0.8 * this.size,
            6
        );
        const armMaterial = new THREE.MeshLambertMaterial({ color: 0x9E9E9E });
        
        // Left arm
        const leftArm = new THREE.Mesh(armGeometry, armMaterial);
        leftArm.position.set(-0.4 * this.size, 1.6 * this.size, 0);
        leftArm.rotation.z = Math.PI / 4; // Angle the arm outward
        statueGroup.add(leftArm);
        
        // Right arm
        const rightArm = new THREE.Mesh(armGeometry, armMaterial);
        rightArm.position.set(0.4 * this.size, 1.6 * this.size, 0);
        rightArm.rotation.z = -Math.PI / 4; // Angle the arm outward
        statueGroup.add(rightArm);
        
        // Add weathering/cracks effect with a second material layer
        const crackGeometry = new THREE.SphereGeometry(0.41 * this.size, 8, 8);
        const crackMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x5D4037, 
            transparent: true, 
            opacity: 0.3,
            wireframe: true
        });
        const cracks = new THREE.Mesh(crackGeometry, crackMaterial);
        cracks.position.y = 2.6 * this.size;
        statueGroup.add(cracks);
        
        // Add moss/overgrowth effect
        const mossGeometry = new THREE.SphereGeometry(0.42 * this.size, 8, 8);
        const mossMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x2E7D32, 
            transparent: true, 
            opacity: 0.2
        });
        const moss = new THREE.Mesh(mossGeometry, mossMaterial);
        moss.position.y = 2.6 * this.size;
        moss.scale.set(1, 0.3, 1); // Flatten to look like moss patches
        statueGroup.add(moss);
        
        // Position the statue
        statueGroup.position.copy(this.position);
        
        // Add to scene
        this.scene.add(statueGroup);
        
        return statueGroup;
    }
}