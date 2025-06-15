import * as THREE from 'three';

/**
 * AlpineFlower - Creates hardy mountain flowers that can survive in cold, high-altitude environments
 */
export class AlpineFlower {
    constructor(scene, worldManager) {
        this.scene = scene;
        this.worldManager = worldManager;
    }

    /**
     * Create the alpine flower mesh
     * @param {THREE.Vector3} position - Position of the flower
     * @param {number} size - Size scale of the flower
     * @param {Object} data - Additional configuration data
     * @returns {THREE.Group} - The flower group
     */
    createMesh(position, size, data = {}) {
        const flowerGroup = new THREE.Group();
        
        // Determine flower type
        const flowerTypes = ['edelweiss', 'alpine_poppy', 'mountain_avens', 'gentian'];
        const flowerType = data.flowerType || flowerTypes[Math.floor(Math.random() * flowerTypes.length)];
        
        // Create base with small leaves
        this.createBase(flowerGroup, size);
        
        // Create the specific flower type
        switch (flowerType) {
            case 'edelweiss':
                this.createEdelweiss(flowerGroup, size);
                break;
            case 'alpine_poppy':
                this.createAlpinePoppy(flowerGroup, size);
                break;
            case 'mountain_avens':
                this.createMountainAvens(flowerGroup, size);
                break;
            case 'gentian':
                this.createGentian(flowerGroup, size);
                break;
        }
        
        // Position the entire group
        flowerGroup.position.copy(position);
        
        // Add to scene
        this.scene.add(flowerGroup);
        
        return flowerGroup;
    }
    
    /**
     * Create the base with small leaves
     * @param {THREE.Group} group - The group to add to
     * @param {number} size - Size scale
     */
    createBase(group, size) {
        // Create small cluster of leaves at base
        const leafCount = 3 + Math.floor(Math.random() * 4);
        
        for (let i = 0; i < leafCount; i++) {
            const leafGeometry = new THREE.SphereGeometry(0.08 * size, 6, 4);
            const leafMaterial = new THREE.MeshStandardMaterial({
                color: 0x4F7942, // Dark green
                roughness: 0.8
            });
            
            const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
            leaf.scale.set(1.5, 0.3, 0.8); // Flatten to leaf shape
            
            const angle = (i / leafCount) * Math.PI * 2;
            const radius = 0.06 * size;
            
            leaf.position.x = Math.cos(angle) * radius;
            leaf.position.z = Math.sin(angle) * radius;
            leaf.position.y = 0.02 * size;
            
            leaf.rotation.y = angle;
            leaf.rotation.x = Math.PI * 0.1; // Slight upward angle
            
            leaf.castShadow = true;
            leaf.receiveShadow = true;
            
            group.add(leaf);
        }
    }
    
    /**
     * Create Edelweiss flower (white, star-shaped)
     * @param {THREE.Group} group - The group to add to
     * @param {number} size - Size scale
     */
    createEdelweiss(group, size) {
        // Create short stem
        const stemGeometry = new THREE.CylinderGeometry(0.01 * size, 0.015 * size, 0.15 * size, 4);
        const stemMaterial = new THREE.MeshLambertMaterial({
            color: 0x2F5233 // Dark green
        });
        
        const stem = new THREE.Mesh(stemGeometry, stemMaterial);
        stem.position.y = 0.075 * size;
        stem.castShadow = true;
        group.add(stem);
        
        // Create star-shaped white petals
        const petalCount = 6;
        
        for (let i = 0; i < petalCount; i++) {
            const petalGeometry = new THREE.SphereGeometry(0.06 * size, 6, 4);
            const petalMaterial = new THREE.MeshLambertMaterial({
                color: 0xF8F8FF, // Ghost white
                emissive: 0xF8F8FF,
                emissiveIntensity: 0.1
            });
            
            const petal = new THREE.Mesh(petalGeometry, petalMaterial);
            petal.scale.set(2, 0.2, 0.8); // Long, thin petals
            
            const angle = (i / petalCount) * Math.PI * 2;
            const radius = 0.05 * size;
            
            petal.position.x = Math.cos(angle) * radius;
            petal.position.z = Math.sin(angle) * radius;
            petal.position.y = 0.15 * size;
            
            petal.rotation.y = angle;
            petal.rotation.x = Math.PI * 0.05; // Slight upward curve
            
            petal.castShadow = true;
            group.add(petal);
        }
        
        // Add fuzzy white center
        const centerGeometry = new THREE.SphereGeometry(0.015 * size, 8, 8);
        const centerMaterial = new THREE.MeshLambertMaterial({
            color: 0xFFFACD // Light goldenrod yellow
        });
        
        const center = new THREE.Mesh(centerGeometry, centerMaterial);
        center.position.y = 0.16 * size;
        center.castShadow = true;
        group.add(center);
    }
    
    /**
     * Create Alpine Poppy (bright yellow/orange)
     * @param {THREE.Group} group - The group to add to
     * @param {number} size - Size scale
     */
    createAlpinePoppy(group, size) {
        // Create stem
        const stemGeometry = new THREE.CylinderGeometry(0.008 * size, 0.012 * size, 0.2 * size, 4);
        const stemMaterial = new THREE.MeshLambertMaterial({
            color: 0x228B22 // Forest green
        });
        
        const stem = new THREE.Mesh(stemGeometry, stemMaterial);
        stem.position.y = 0.1 * size;
        stem.castShadow = true;
        group.add(stem);
        
        // Create 4 bright petals
        const petalCount = 4;
        const petalColors = [0xFFD700, 0xFF8C00, 0xFFA500]; // Gold, dark orange, orange
        const petalColor = petalColors[Math.floor(Math.random() * petalColors.length)];
        
        for (let i = 0; i < petalCount; i++) {
            const petalGeometry = new THREE.SphereGeometry(0.08 * size, 8, 6);
            const petalMaterial = new THREE.MeshLambertMaterial({
                color: petalColor,
                emissive: petalColor,
                emissiveIntensity: 0.2
            });
            
            const petal = new THREE.Mesh(petalGeometry, petalMaterial);
            petal.scale.set(1.2, 0.3, 1); // Rounded petals
            
            const angle = (i / petalCount) * Math.PI * 2;
            const radius = 0.04 * size;
            
            petal.position.x = Math.cos(angle) * radius;
            petal.position.z = Math.sin(angle) * radius;
            petal.position.y = 0.2 * size;
            
            petal.rotation.y = angle;
            petal.rotation.x = Math.PI * 0.1;
            
            petal.castShadow = true;
            group.add(petal);
        }
        
        // Add dark center
        const centerGeometry = new THREE.SphereGeometry(0.02 * size, 8, 8);
        const centerMaterial = new THREE.MeshLambertMaterial({
            color: 0x8B4513 // Saddle brown
        });
        
        const center = new THREE.Mesh(centerGeometry, centerMaterial);
        center.position.y = 0.21 * size;
        group.add(center);
    }
    
    /**
     * Create Mountain Avens (white with yellow center)
     * @param {THREE.Group} group - The group to add to
     * @param {number} size - Size scale
     */
    createMountainAvens(group, size) {
        // Create stem
        const stemGeometry = new THREE.CylinderGeometry(0.01 * size, 0.013 * size, 0.12 * size, 4);
        const stemMaterial = new THREE.MeshLambertMaterial({
            color: 0x2E8B57 // Sea green
        });
        
        const stem = new THREE.Mesh(stemGeometry, stemMaterial);
        stem.position.y = 0.06 * size;
        stem.castShadow = true;
        group.add(stem);
        
        // Create 8 white petals in rosette pattern
        const petalCount = 8;
        
        for (let i = 0; i < petalCount; i++) {
            const petalGeometry = new THREE.SphereGeometry(0.04 * size, 6, 4);
            const petalMaterial = new THREE.MeshLambertMaterial({
                color: 0xFFFFF0 // Ivory
            });
            
            const petal = new THREE.Mesh(petalGeometry, petalMaterial);
            petal.scale.set(1.5, 0.25, 0.8);
            
            const angle = (i / petalCount) * Math.PI * 2;
            const radius = 0.035 * size;
            
            petal.position.x = Math.cos(angle) * radius;
            petal.position.z = Math.sin(angle) * radius;
            petal.position.y = 0.12 * size;
            
            petal.rotation.y = angle;
            
            petal.castShadow = true;
            group.add(petal);
        }
        
        // Add bright yellow center
        const centerGeometry = new THREE.SphereGeometry(0.02 * size, 8, 8);
        const centerMaterial = new THREE.MeshLambertMaterial({
            color: 0xFFFF00, // Yellow
            emissive: 0xFFFF00,
            emissiveIntensity: 0.3
        });
        
        const center = new THREE.Mesh(centerGeometry, centerMaterial);
        center.position.y = 0.13 * size;
        group.add(center);
    }
    
    /**
     * Create Gentian (deep blue, trumpet-shaped)
     * @param {THREE.Group} group - The group to add to
     * @param {number} size - Size scale
     */
    createGentian(group, size) {
        // Create stem
        const stemGeometry = new THREE.CylinderGeometry(0.012 * size, 0.015 * size, 0.18 * size, 4);
        const stemMaterial = new THREE.MeshLambertMaterial({
            color: 0x006400 // Dark green
        });
        
        const stem = new THREE.Mesh(stemGeometry, stemMaterial);
        stem.position.y = 0.09 * size;
        stem.castShadow = true;
        group.add(stem);
        
        // Create trumpet-shaped flower
        const flowerGeometry = new THREE.ConeGeometry(0.08 * size, 0.12 * size, 5);
        const flowerMaterial = new THREE.MeshLambertMaterial({
            color: 0x191970, // Midnight blue
            emissive: 0x191970,
            emissiveIntensity: 0.1
        });
        
        const flower = new THREE.Mesh(flowerGeometry, flowerMaterial);
        flower.position.y = 0.24 * size;
        flower.rotation.x = Math.PI; // Point upward
        flower.castShadow = true;
        group.add(flower);
        
        // Add petal details
        const petalCount = 5;
        
        for (let i = 0; i < petalCount; i++) {
            const petalGeometry = new THREE.SphereGeometry(0.03 * size, 6, 4);
            const petalMaterial = new THREE.MeshLambertMaterial({
                color: 0x4169E1 // Royal blue
            });
            
            const petal = new THREE.Mesh(petalGeometry, petalMaterial);
            petal.scale.set(1, 0.3, 0.6);
            
            const angle = (i / petalCount) * Math.PI * 2;
            const radius = 0.07 * size;
            
            petal.position.x = Math.cos(angle) * radius;
            petal.position.z = Math.sin(angle) * radius;
            petal.position.y = 0.3 * size;
            
            petal.rotation.y = angle;
            petal.rotation.x = -Math.PI * 0.2; // Curve outward
            
            petal.castShadow = true;
            group.add(petal);
        }
        
        // Add white center spot
        const centerGeometry = new THREE.SphereGeometry(0.01 * size, 6, 6);
        const centerMaterial = new THREE.MeshLambertMaterial({
            color: 0xFFFFFF // White
        });
        
        const center = new THREE.Mesh(centerGeometry, centerMaterial);
        center.position.y = 0.31 * size;
        group.add(center);
    }
}