import * as THREE from 'three';

/**
 * Forest Debris class
 * Creates forest floor debris like fallen leaves, twigs, and small branches
 */
export class ForestDebris {
    constructor(scene, MapManager) {
        this.scene = scene;
        this.MapManager = MapManager;
    }

    /**
     * Create a forest debris mesh
     * @param {THREE.Vector3} position - Position for the debris
     * @param {number} size - Size multiplier
     * @param {object} options - Additional options
     * @returns {THREE.Group} - The created debris group
     */
    createMesh(position, size = 1.0, options = {}) {
        // Create a group to hold all debris elements
        const debrisGroup = new THREE.Group();
        
        // Create 5-10 debris elements
        const debrisCount = 5 + Math.floor(Math.random() * 6);
        
        // Create fallen leaves
        for (let i = 0; i < debrisCount; i++) {
            // Random position within a small radius
            const radius = 1.0 * size;
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * radius;
            
            const x = position.x + Math.cos(angle) * distance;
            const z = position.z + Math.sin(angle) * distance;
            
            // Get terrain height at this position
            const y = this.MapManager ? 
                this.MapManager.getTerrainHeight(x, z) : 
                position.y;
            
            // Determine what type of debris to create (leaf, twig, or small branch)
            const debrisType = Math.random();
            
            if (debrisType < 0.6) {
                // Create a leaf
                this.addLeaf(debrisGroup, x, y, z, size);
            } else if (debrisType < 0.9) {
                // Create a twig
                this.addTwig(debrisGroup, x, y, z, size);
            } else {
                // Create a small branch
                this.addSmallBranch(debrisGroup, x, y, z, size);
            }
        }
        
        // Position the group
        debrisGroup.position.copy(position);
        
        // Add to scene
        this.scene.add(debrisGroup);
        
        return debrisGroup;
    }
    
    /**
     * Add a leaf to the debris group
     * @param {THREE.Group} group - The group to add to
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} z - Z position
     * @param {number} size - Size multiplier
     */
    addLeaf(group, x, y, z, size) {
        // Create a simple leaf using a plane geometry
        const leafSize = (0.1 + Math.random() * 0.2) * size;
        const leafGeometry = new THREE.PlaneGeometry(leafSize, leafSize);
        
        // Random leaf color (green, yellow, red, brown)
        const leafColors = [
            0x2E7D32, // Dark green
            0x388E3C, // Green
            0xFBC02D, // Yellow
            0xE64A19, // Red-orange
            0x795548  // Brown
        ];
        
        const leafColor = leafColors[Math.floor(Math.random() * leafColors.length)];
        
        const leafMaterial = new THREE.MeshLambertMaterial({
            color: leafColor,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.9
        });
        
        const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
        
        // Position relative to the group
        leaf.position.set(x - group.position.x, 0.01, z - group.position.z);
        
        // Random rotation
        leaf.rotation.x = -Math.PI / 2; // Lay flat on the ground
        leaf.rotation.z = Math.random() * Math.PI * 2;
        
        group.add(leaf);
    }
    
    /**
     * Add a twig to the debris group
     * @param {THREE.Group} group - The group to add to
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} z - Z position
     * @param {number} size - Size multiplier
     */
    addTwig(group, x, y, z, size) {
        // Create a simple twig using a cylinder
        const twigLength = (0.2 + Math.random() * 0.3) * size;
        const twigRadius = 0.01 * size;
        
        const twigGeometry = new THREE.CylinderGeometry(
            twigRadius, twigRadius, twigLength, 4, 1
        );
        
        const twigMaterial = new THREE.MeshLambertMaterial({
            color: 0x8D6E63 // Brown
        });
        
        const twig = new THREE.Mesh(twigGeometry, twigMaterial);
        
        // Position relative to the group
        twig.position.set(x - group.position.x, 0.02, z - group.position.z);
        
        // Random rotation to lay on the ground
        twig.rotation.x = Math.PI / 2;
        twig.rotation.z = Math.random() * Math.PI * 2;
        
        group.add(twig);
    }
    
    /**
     * Add a small branch to the debris group
     * @param {THREE.Group} group - The group to add to
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} z - Z position
     * @param {number} size - Size multiplier
     */
    addSmallBranch(group, x, y, z, size) {
        // Create a small branch using a cylinder
        const branchLength = (0.4 + Math.random() * 0.5) * size;
        const branchRadius = 0.02 * size;
        
        const branchGeometry = new THREE.CylinderGeometry(
            branchRadius, branchRadius * 1.2, branchLength, 5, 1
        );
        
        const branchMaterial = new THREE.MeshLambertMaterial({
            color: 0x5D4037 // Dark brown
        });
        
        const branch = new THREE.Mesh(branchGeometry, branchMaterial);
        
        // Position relative to the group
        branch.position.set(x - group.position.x, 0.03, z - group.position.z);
        
        // Random rotation to lay on the ground
        branch.rotation.x = Math.PI / 2;
        branch.rotation.z = Math.random() * Math.PI * 2;
        
        group.add(branch);
    }
}