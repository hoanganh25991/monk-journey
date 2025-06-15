import * as THREE from 'three';

/**
 * StatueFragment - Creates a broken piece of an ancient statue
 */
export class StatueFragment {
    constructor(scene, worldManager) {
        this.scene = scene;
        this.worldManager = worldManager;
    }

    /**
     * Create the statue fragment mesh
     * @param {THREE.Vector3} position - Position of the fragment
     * @param {number} size - Size scale of the fragment
     * @param {Object} data - Additional configuration data
     * @returns {THREE.Group} - The fragment group
     */
    createMesh(position, size, data = {}) {
        const fragmentGroup = new THREE.Group();
        
        // Determine which part of a statue this fragment represents
        const fragmentType = data.fragmentType || Math.floor(Math.random() * 5);
        
        switch (fragmentType) {
            case 0: // Head fragment
                this.createHeadFragment(fragmentGroup, size);
                break;
            case 1: // Arm fragment
                this.createArmFragment(fragmentGroup, size);
                break;
            case 2: // Torso fragment
                this.createTorsoFragment(fragmentGroup, size);
                break;
            case 3: // Leg fragment
                this.createLegFragment(fragmentGroup, size);
                break;
            case 4: // Base/pedestal fragment
                this.createBaseFragment(fragmentGroup, size);
                break;
        }
        
        // Add some weathering and damage details
        this.addWeatheringDetails(fragmentGroup, size);
        
        // Position the entire group
        fragmentGroup.position.copy(position);
        
        // Add to scene
        this.scene.add(fragmentGroup);
        
        return fragmentGroup;
    }
    
    /**
     * Create a head fragment
     * @param {THREE.Group} group - The group to add to
     * @param {number} size - Size scale
     */
    createHeadFragment(group, size) {
        // Create a partial sphere for the head
        const headGeometry = new THREE.SphereGeometry(0.5 * size, 16, 16, 0, Math.PI * 1.5, 0, Math.PI);
        const material = new THREE.MeshLambertMaterial({ color: 0xE0E0E0 });
        const head = new THREE.Mesh(headGeometry, material);
        
        // Rotate to look natural as a broken piece
        head.rotation.z = Math.PI / 4;
        head.rotation.y = Math.PI / 3;
        
        group.add(head);
    }
    
    /**
     * Create an arm fragment
     * @param {THREE.Group} group - The group to add to
     * @param {number} size - Size scale
     */
    createArmFragment(group, size) {
        // Create a cylinder for the arm
        const armGeometry = new THREE.CylinderGeometry(0.2 * size, 0.15 * size, 1 * size, 8);
        const material = new THREE.MeshLambertMaterial({ color: 0xE0E0E0 });
        const arm = new THREE.Mesh(armGeometry, material);
        
        // Rotate to look like a fallen arm piece
        arm.rotation.z = Math.PI / 2;
        
        group.add(arm);
    }
    
    /**
     * Create a torso fragment
     * @param {THREE.Group} group - The group to add to
     * @param {number} size - Size scale
     */
    createTorsoFragment(group, size) {
        // Create a partial cylinder for the torso
        const torsoGeometry = new THREE.CylinderGeometry(0.5 * size, 0.4 * size, 1.2 * size, 8, 1, true, 0, Math.PI * 1.2);
        const material = new THREE.MeshLambertMaterial({ 
            color: 0xE0E0E0,
            side: THREE.DoubleSide
        });
        const torso = new THREE.Mesh(torsoGeometry, material);
        
        // Rotate to look natural as a broken piece
        torso.rotation.z = Math.PI / 6;
        
        group.add(torso);
    }
    
    /**
     * Create a leg fragment
     * @param {THREE.Group} group - The group to add to
     * @param {number} size - Size scale
     */
    createLegFragment(group, size) {
        // Create a cylinder for the leg
        const legGeometry = new THREE.CylinderGeometry(0.2 * size, 0.25 * size, 1.2 * size, 8);
        const material = new THREE.MeshLambertMaterial({ color: 0xE0E0E0 });
        const leg = new THREE.Mesh(legGeometry, material);
        
        // Rotate to look like a fallen leg piece
        leg.rotation.x = Math.PI / 4;
        
        group.add(leg);
    }
    
    /**
     * Create a base/pedestal fragment
     * @param {THREE.Group} group - The group to add to
     * @param {number} size - Size scale
     */
    createBaseFragment(group, size) {
        // Create a partial box for the base
        const baseGeometry = new THREE.BoxGeometry(1 * size, 0.4 * size, 0.8 * size);
        const material = new THREE.MeshLambertMaterial({ color: 0xE0E0E0 });
        const base = new THREE.Mesh(baseGeometry, material);
        
        group.add(base);
    }
    
    /**
     * Add weathering and damage details
     * @param {THREE.Group} group - The group to add to
     * @param {number} size - Size scale
     */
    addWeatheringDetails(group, size) {
        // Add cracks and weathering using line segments
        const crackMaterial = new THREE.LineBasicMaterial({ color: 0x616161 });
        
        // Create several cracks
        for (let i = 0; i < 5; i++) {
            const points = [];
            const startPoint = new THREE.Vector3(
                (Math.random() - 0.5) * size,
                (Math.random() - 0.5) * size,
                (Math.random() - 0.5) * size
            );
            
            points.push(startPoint);
            
            // Add 2-4 points to create a jagged crack
            const segments = 2 + Math.floor(Math.random() * 3);
            for (let j = 0; j < segments; j++) {
                points.push(new THREE.Vector3(
                    startPoint.x + (Math.random() - 0.5) * 0.5 * size,
                    startPoint.y + (Math.random() - 0.5) * 0.5 * size,
                    startPoint.z + (Math.random() - 0.5) * 0.5 * size
                ));
            }
            
            const crackGeometry = new THREE.BufferGeometry().setFromPoints(points);
            const crack = new THREE.Line(crackGeometry, crackMaterial);
            
            group.add(crack);
        }
    }
}