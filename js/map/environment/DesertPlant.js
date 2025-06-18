import * as THREE from 'three';

/**
 * DesertPlant - Creates desert plants like cacti and succulents
 */
export class DesertPlant {
    constructor(scene, MapManager) {
        this.scene = scene;
        this.MapManager = MapManager;
    }

    /**
     * Create the desert plant mesh
     * @param {THREE.Vector3} position - Position of the plant
     * @param {number} size - Size scale of the plant
     * @param {Object} data - Additional configuration data
     * @returns {THREE.Group} - The plant group
     */
    createMesh(position, size, data = {}) {
        const plantGroup = new THREE.Group();
        
        // Determine plant type
        const plantTypes = ['cactus', 'succulent', 'desert_flower'];
        const plantType = data.plantType || plantTypes[Math.floor(Math.random() * plantTypes.length)];
        
        switch (plantType) {
            case 'cactus':
                this.createCactus(plantGroup, size);
                break;
            case 'succulent':
                this.createSucculent(plantGroup, size);
                break;
            case 'desert_flower':
                this.createDesertFlower(plantGroup, size);
                break;
        }
        
        // Position the entire group
        plantGroup.position.copy(position);
        
        // Add to scene
        this.scene.add(plantGroup);
        
        return plantGroup;
    }
    
    /**
     * Create a cactus plant
     * @param {THREE.Group} group - The group to add to
     * @param {number} size - Size scale
     */
    createCactus(group, size) {
        // Main cactus body
        const bodyGeometry = new THREE.CylinderGeometry(0.15 * size, 0.2 * size, 0.8 * size, 8);
        const bodyMaterial = new THREE.MeshLambertMaterial({
            color: 0x4A7C59, // Dark green
            roughness: 0.8
        });
        
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.4 * size;
        body.castShadow = true;
        body.receiveShadow = true;
        group.add(body);
        
        // Add arms to the cactus
        const armCount = 1 + Math.floor(Math.random() * 2);
        for (let i = 0; i < armCount; i++) {
            const armGeometry = new THREE.CylinderGeometry(0.08 * size, 0.12 * size, 0.4 * size, 6);
            const arm = new THREE.Mesh(armGeometry, bodyMaterial);
            
            const angle = Math.random() * Math.PI * 2;
            arm.position.x = Math.cos(angle) * 0.15 * size;
            arm.position.z = Math.sin(angle) * 0.15 * size;
            arm.position.y = 0.3 * size + Math.random() * 0.2 * size;
            arm.rotation.z = (Math.random() - 0.5) * Math.PI * 0.5;
            
            arm.castShadow = true;
            arm.receiveShadow = true;
            group.add(arm);
        }
        
        // Add spines as small lines
        this.addSpines(group, size, body);
    }
    
    /**
     * Create a succulent plant
     * @param {THREE.Group} group - The group to add to
     * @param {number} size - Size scale
     */
    createSucculent(group, size) {
        const leafCount = 6 + Math.floor(Math.random() * 6);
        
        for (let i = 0; i < leafCount; i++) {
            const leafGeometry = new THREE.SphereGeometry(0.15 * size, 8, 6);
            const leafMaterial = new THREE.MeshLambertMaterial({
                color: 0x6B8E23, // Olive green
                roughness: 0.7
            });
            
            const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
            leaf.scale.set(1.5, 0.5, 0.8);
            
            const angle = (i / leafCount) * Math.PI * 2;
            const radius = 0.1 * size;
            leaf.position.x = Math.cos(angle) * radius;
            leaf.position.z = Math.sin(angle) * radius;
            leaf.position.y = 0.05 * size;
            
            leaf.rotation.y = angle;
            leaf.rotation.x = Math.PI * 0.1;
            
            leaf.castShadow = true;
            leaf.receiveShadow = true;
            group.add(leaf);
        }
    }
    
    /**
     * Create a desert flower
     * @param {THREE.Group} group - The group to add to
     * @param {number} size - Size scale
     */
    createDesertFlower(group, size) {
        // Stem
        const stemGeometry = new THREE.CylinderGeometry(0.02 * size, 0.03 * size, 0.3 * size, 6);
        const stemMaterial = new THREE.MeshLambertMaterial({
            color: 0x654321 // Brown
        });
        
        const stem = new THREE.Mesh(stemGeometry, stemMaterial);
        stem.position.y = 0.15 * size;
        stem.castShadow = true;
        group.add(stem);
        
        // Flower
        const flowerGeometry = new THREE.SphereGeometry(0.08 * size, 8, 6);
        const flowerMaterial = new THREE.MeshLambertMaterial({
            color: 0xFF6B6B // Desert pink
        });
        
        const flower = new THREE.Mesh(flowerGeometry, flowerMaterial);
        flower.position.y = 0.3 * size;
        flower.scale.set(1, 0.5, 1);
        flower.castShadow = true;
        group.add(flower);
    }
    
    /**
     * Add spines to cactus
     * @param {THREE.Group} group - The group to add to
     * @param {number} size - Size scale
     * @param {THREE.Mesh} body - The cactus body
     */
    addSpines(group, size, body) {
        const spineCount = 20;
        
        for (let i = 0; i < spineCount; i++) {
            const spineGeometry = new THREE.CylinderGeometry(0.005 * size, 0.005 * size, 0.05 * size, 4);
            const spineMaterial = new THREE.MeshBasicMaterial({
                color: 0xD2B48C // Tan
            });
            
            const spine = new THREE.Mesh(spineGeometry, spineMaterial);
            
            const angle = Math.random() * Math.PI * 2;
            const height = Math.random() * 0.8 * size;
            
            spine.position.x = Math.cos(angle) * 0.18 * size;
            spine.position.z = Math.sin(angle) * 0.18 * size;
            spine.position.y = height;
            
            spine.lookAt(
                spine.position.x * 2,
                spine.position.y,
                spine.position.z * 2
            );
            
            group.add(spine);
        }
    }
}