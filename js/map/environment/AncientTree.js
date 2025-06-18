import * as THREE from 'three';

/**
 * AncientTree - Creates large, ancient tree environment objects
 * These are significantly larger and more detailed than regular trees
 */
export class AncientTree {
    constructor(zoneType = 'Forest') {
        this.zoneType = zoneType;
        this.colors = this.getZoneColors(zoneType);
    }

    /**
     * Get colors based on zone type
     * @param {string} zoneType - The zone type
     * @returns {Object} - Color configuration
     */
    getZoneColors(zoneType) {
        switch (zoneType) {
            case 'Desert':
                return {
                    trunk: 0x8B4513,     // Saddle brown
                    leaves: 0x9ACD32,    // Yellow green (drought resistant)
                    accent: 0xDEB887     // Burlywood
                };
            case 'Mountain':
                return {
                    trunk: 0x654321,     // Dark brown
                    leaves: 0x228B22,    // Forest green
                    accent: 0x8FBC8F     // Dark sea green
                };
            case 'Forest':
            default:
                return {
                    trunk: 0x4A4A4A,     // Dark gray (ancient bark)
                    leaves: 0x006400,    // Dark green
                    accent: 0x228B22     // Forest green
                };
        }
    }

    /**
     * Create ancient tree mesh
     * @returns {THREE.Group} - The ancient tree group
     */
    createMesh() {
        const treeGroup = new THREE.Group();
        
        // Create massive trunk
        const trunk = this.createTrunk();
        treeGroup.add(trunk);
        
        // Create large canopy with multiple layers
        const canopy = this.createCanopy();
        treeGroup.add(canopy);
        
        // Add hanging vines or moss
        if (Math.random() < 0.7) {
            const vines = this.createVines();
            treeGroup.add(vines);
        }
        
        // Add exposed roots
        const roots = this.createRoots();
        treeGroup.add(roots);
        
        // Add some mushrooms at the base
        if (Math.random() < 0.5) {
            const mushrooms = this.createMushrooms();
            treeGroup.add(mushrooms);
        }
        
        // Random scale variation (but keep it large)
        const scale = 2.5 + Math.random() * 1.5; // 2.5 to 4.0 times larger than normal trees
        treeGroup.scale.set(scale, scale, scale);
        
        treeGroup.userData = {
            type: 'ancient_tree',
            zone: this.zoneType,
            isLandmark: true
        };
        
        return treeGroup;
    }

    /**
     * Create the massive trunk
     * @returns {THREE.Group} - The trunk group
     */
    createTrunk() {
        const trunkGroup = new THREE.Group();
        
        // Main trunk - much larger and more detailed
        const trunkHeight = 8 + Math.random() * 4; // 8-12 units tall
        const trunkRadius = 1.2 + Math.random() * 0.8; // 1.2-2.0 radius
        
        // Create trunk with more segments for better shape
        const trunkGeometry = new THREE.CylinderGeometry(
            trunkRadius * 0.8, // Top radius (tapers)
            trunkRadius,        // Bottom radius
            trunkHeight,
            12,                 // Radial segments
            8                   // Height segments
        );
        
        // Add some irregularity to the trunk
        const positions = trunkGeometry.attributes.position;
        for (let i = 0; i < positions.count; i++) {
            const x = positions.getX(i);
            const y = positions.getY(i);
            const z = positions.getZ(i);
            
            // Add noise to make it look more organic
            const noise = (Math.random() - 0.5) * 0.2;
            positions.setX(i, x + noise);
            positions.setZ(i, z + noise);
        }
        positions.needsUpdate = true;
        trunkGeometry.computeVertexNormals();
        
        const trunkMaterial = new THREE.MeshStandardMaterial({
            color: this.colors.trunk,
            roughness: 0.9,
            metalness: 0.1
        });
        
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.y = trunkHeight / 2;
        trunk.castShadow = true;
        trunk.receiveShadow = true;
        
        trunkGroup.add(trunk);
        
        // Add some bark texture with additional cylinders
        for (let i = 0; i < 3; i++) {
            const barkHeight = 2 + Math.random() * 2;
            const barkY = Math.random() * (trunkHeight - barkHeight);
            const barkGeometry = new THREE.CylinderGeometry(
                trunkRadius * 1.05,
                trunkRadius * 1.05,
                barkHeight,
                8
            );
            
            const barkMaterial = new THREE.MeshLambertMaterial({
                color: new THREE.Color(this.colors.trunk).multiplyScalar(0.8),
                transparent: true,
                opacity: 0.7
            });
            
            const bark = new THREE.Mesh(barkGeometry, barkMaterial);
            bark.position.y = barkY + barkHeight / 2;
            bark.rotation.y = Math.random() * Math.PI * 2;
            trunkGroup.add(bark);
        }
        
        return trunkGroup;
    }

    /**
     * Create the large canopy
     * @returns {THREE.Group} - The canopy group
     */
    createCanopy() {
        const canopyGroup = new THREE.Group();
        
        // Create multiple layers of foliage for a fuller look
        const layers = 4 + Math.floor(Math.random() * 3); // 4-6 layers
        
        for (let i = 0; i < layers; i++) {
            const layerY = 6 + i * 2 + Math.random() * 2;
            const layerRadius = 4 + Math.random() * 2 - i * 0.3; // Decreases with height
            
            // Create irregular sphere for foliage
            const foliageGeometry = new THREE.SphereGeometry(layerRadius, 12, 8);
            
            // Add irregularity to make it look more natural
            const positions = foliageGeometry.attributes.position;
            for (let j = 0; j < positions.count; j++) {
                const x = positions.getX(j);
                const y = positions.getY(j);
                const z = positions.getZ(j);
                
                const noise = (Math.random() - 0.5) * 0.5;
                const length = Math.sqrt(x * x + y * y + z * z);
                const factor = (length + noise) / length;
                
                positions.setX(j, x * factor);
                positions.setY(j, y * factor);
                positions.setZ(j, z * factor);
            }
            positions.needsUpdate = true;
            foliageGeometry.computeVertexNormals();
            
            // Vary the color slightly for each layer
            const colorVariation = (Math.random() - 0.5) * 0.2;
            const layerColor = new THREE.Color(this.colors.leaves);
            layerColor.offsetHSL(0, 0, colorVariation);
            
            const foliageMaterial = new THREE.MeshLambertMaterial({
                color: layerColor,
                transparent: true,
                opacity: 0.8 - i * 0.1 // Upper layers slightly more transparent
            });
            
            const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
            foliage.position.y = layerY;
            foliage.position.x = (Math.random() - 0.5) * 2; // Slight offset
            foliage.position.z = (Math.random() - 0.5) * 2;
            foliage.castShadow = true;
            foliage.receiveShadow = true;
            
            canopyGroup.add(foliage);
        }
        
        return canopyGroup;
    }

    /**
     * Create hanging vines or moss
     * @returns {THREE.Group} - The vines group
     */
    createVines() {
        const vinesGroup = new THREE.Group();
        
        const vineCount = 5 + Math.floor(Math.random() * 8);
        
        for (let i = 0; i < vineCount; i++) {
            const vineLength = 2 + Math.random() * 3;
            const vineGeometry = new THREE.CylinderGeometry(0.05, 0.02, vineLength, 4);
            
            const vineMaterial = new THREE.MeshLambertMaterial({
                color: this.colors.accent,
                transparent: true,
                opacity: 0.7
            });
            
            const vine = new THREE.Mesh(vineGeometry, vineMaterial);
            
            // Position around the canopy
            const angle = Math.random() * Math.PI * 2;
            const distance = 3 + Math.random() * 2;
            vine.position.x = Math.cos(angle) * distance;
            vine.position.z = Math.sin(angle) * distance;
            vine.position.y = 8 + Math.random() * 4 - vineLength / 2;
            
            // Add some sway
            vine.rotation.x = (Math.random() - 0.5) * 0.3;
            vine.rotation.z = (Math.random() - 0.5) * 0.3;
            
            vinesGroup.add(vine);
        }
        
        return vinesGroup;
    }

    /**
     * Create exposed roots
     * @returns {THREE.Group} - The roots group
     */
    createRoots() {
        const rootsGroup = new THREE.Group();
        
        const rootCount = 6 + Math.floor(Math.random() * 6);
        
        for (let i = 0; i < rootCount; i++) {
            const rootLength = 2 + Math.random() * 2;
            const rootGeometry = new THREE.CylinderGeometry(0.2, 0.4, rootLength, 6);
            
            const rootMaterial = new THREE.MeshLambertMaterial({
                color: new THREE.Color(this.colors.trunk).multiplyScalar(0.7)
            });
            
            const root = new THREE.Mesh(rootGeometry, rootMaterial);
            
            // Position around the base
            const angle = (i / rootCount) * Math.PI * 2 + Math.random() * 0.5;
            const distance = 1.5 + Math.random() * 1;
            root.position.x = Math.cos(angle) * distance;
            root.position.z = Math.sin(angle) * distance;
            root.position.y = -rootLength / 3; // Partially buried
            
            // Angle the roots outward and down
            root.rotation.x = Math.PI * 0.3 + Math.random() * 0.2;
            root.rotation.y = angle;
            root.rotation.z = (Math.random() - 0.5) * 0.3;
            
            root.castShadow = true;
            root.receiveShadow = true;
            
            rootsGroup.add(root);
        }
        
        return rootsGroup;
    }

    /**
     * Create mushrooms at the base
     * @returns {THREE.Group} - The mushrooms group
     */
    createMushrooms() {
        const mushroomsGroup = new THREE.Group();
        
        const mushroomCount = 3 + Math.floor(Math.random() * 5);
        
        for (let i = 0; i < mushroomCount; i++) {
            const stemHeight = 0.3 + Math.random() * 0.4;
            const capRadius = 0.2 + Math.random() * 0.3;
            
            // Stem
            const stemGeometry = new THREE.CylinderGeometry(0.05, 0.08, stemHeight, 6);
            const stemMaterial = new THREE.MeshLambertMaterial({ color: 0xF5DEB3 });
            const stem = new THREE.Mesh(stemGeometry, stemMaterial);
            
            // Cap
            const capGeometry = new THREE.SphereGeometry(capRadius, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2);
            const capColors = [0x8B4513, 0xA0522D, 0xCD853F, 0xD2691E];
            const capColor = capColors[Math.floor(Math.random() * capColors.length)];
            const capMaterial = new THREE.MeshLambertMaterial({ color: capColor });
            const cap = new THREE.Mesh(capGeometry, capMaterial);
            
            const mushroom = new THREE.Group();
            stem.position.y = stemHeight / 2;
            cap.position.y = stemHeight;
            mushroom.add(stem);
            mushroom.add(cap);
            
            // Position around the tree base
            const angle = Math.random() * Math.PI * 2;
            const distance = 2 + Math.random() * 2;
            mushroom.position.x = Math.cos(angle) * distance;
            mushroom.position.z = Math.sin(angle) * distance;
            mushroom.position.y = 0;
            
            mushroomsGroup.add(mushroom);
        }
        
        return mushroomsGroup;
    }
}