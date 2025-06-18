import * as THREE from 'three';

/**
 * MountainRock - Creates large, angular rocks suitable for mountain environments
 */
export class MountainRock {
    constructor(scene, MapManager) {
        this.scene = scene;
        this.MapManager = MapManager;
    }

    /**
     * Create the mountain rock mesh
     * @param {THREE.Vector3} position - Position of the rock
     * @param {number} size - Size scale of the rock
     * @param {Object} data - Additional configuration data
     * @returns {THREE.Group} - The rock group
     */
    createMesh(position, size, data = {}) {
        const rockGroup = new THREE.Group();
        
        // Create main rock formation
        this.createMainRock(rockGroup, size);
        
        // Add smaller rock fragments
        this.addRockFragments(rockGroup, size);
        
        // Add weathering effects
        this.addWeatheringEffects(rockGroup, size);
        
        // Add snow or ice if specified
        if (data.hasSnow || Math.random() > 0.6) {
            this.addSnow(rockGroup, size);
        }
        
        // Position the entire group
        rockGroup.position.copy(position);
        
        // Add to scene
        this.scene.add(rockGroup);
        
        return rockGroup;
    }
    
    /**
     * Create the main rock structure
     * @param {THREE.Group} group - The group to add to
     * @param {number} size - Size scale
     */
    createMainRock(group, size) {
        // Create angular, layered rock structure typical of mountains
        const rockGeometry = new THREE.BoxGeometry(
            0.8 * size,
            1.2 * size,
            0.6 * size
        );
        
        // Apply some deformation for natural look
        const vertices = rockGeometry.attributes.position.array;
        for (let i = 0; i < vertices.length; i += 3) {
            vertices[i] += (Math.random() - 0.5) * 0.1 * size;     // X
            vertices[i + 1] += (Math.random() - 0.5) * 0.15 * size; // Y
            vertices[i + 2] += (Math.random() - 0.5) * 0.1 * size;  // Z
        }
        rockGeometry.attributes.position.needsUpdate = true;
        rockGeometry.computeVertexNormals();
        
        const rockMaterial = new THREE.MeshStandardMaterial({
            color: 0x708090, // Slate gray
            roughness: 0.9,
            metalness: 0.1
        });
        
        const mainRock = new THREE.Mesh(rockGeometry, rockMaterial);
        mainRock.position.y = 0.6 * size;
        
        // Add rotation for natural placement
        mainRock.rotation.x = (Math.random() - 0.5) * 0.2;
        mainRock.rotation.y = Math.random() * Math.PI * 2;
        mainRock.rotation.z = (Math.random() - 0.5) * 0.2;
        
        mainRock.castShadow = true;
        mainRock.receiveShadow = true;
        
        group.add(mainRock);
        
        // Add rock layers/strata
        this.addRockLayers(group, size);
    }
    
    /**
     * Add geological layers to the rock
     * @param {THREE.Group} group - The group to add to
     * @param {number} size - Size scale
     */
    addRockLayers(group, size) {
        const layerCount = 3 + Math.floor(Math.random() * 3);
        
        for (let i = 0; i < layerCount; i++) {
            const layerGeometry = new THREE.BoxGeometry(
                0.9 * size,
                0.05 * size,
                0.7 * size
            );
            
            // Different color for each layer
            const layerColors = [0x808080, 0x696969, 0x778899, 0x708090];
            const layerMaterial = new THREE.MeshStandardMaterial({
                color: layerColors[i % layerColors.length],
                roughness: 0.8,
                metalness: 0.1
            });
            
            const layer = new THREE.Mesh(layerGeometry, layerMaterial);
            layer.position.y = 0.2 * size + (i * 0.25 * size);
            
            // Slight rotation and offset for natural stratification
            layer.rotation.y = (Math.random() - 0.5) * 0.3;
            layer.position.x = (Math.random() - 0.5) * 0.1 * size;
            layer.position.z = (Math.random() - 0.5) * 0.1 * size;
            
            layer.castShadow = true;
            layer.receiveShadow = true;
            
            group.add(layer);
        }
    }
    
    /**
     * Add smaller rock fragments around the main rock
     * @param {THREE.Group} group - The group to add to
     * @param {number} size - Size scale
     */
    addRockFragments(group, size) {
        const fragmentCount = 4 + Math.floor(Math.random() * 6);
        
        for (let i = 0; i < fragmentCount; i++) {
            const fragmentSize = 0.1 * size + Math.random() * 0.2 * size;
            
            // Create angular fragments
            const geometries = [
                new THREE.TetrahedronGeometry(fragmentSize, 0),
                new THREE.OctahedronGeometry(fragmentSize, 0),
                new THREE.BoxGeometry(fragmentSize, fragmentSize * 0.8, fragmentSize * 1.2)
            ];
            
            const fragmentGeometry = geometries[Math.floor(Math.random() * geometries.length)];
            const fragmentMaterial = new THREE.MeshStandardMaterial({
                color: 0x696969, // Dim gray
                roughness: 0.9,
                metalness: 0.05
            });
            
            const fragment = new THREE.Mesh(fragmentGeometry, fragmentMaterial);
            
            // Position fragments around the main rock
            const angle = Math.random() * Math.PI * 2;
            const distance = 0.6 * size + Math.random() * 0.4 * size;
            
            fragment.position.x = Math.cos(angle) * distance;
            fragment.position.z = Math.sin(angle) * distance;
            fragment.position.y = Math.random() * 0.1 * size;
            
            // Random rotation
            fragment.rotation.x = Math.random() * Math.PI;
            fragment.rotation.y = Math.random() * Math.PI;
            fragment.rotation.z = Math.random() * Math.PI;
            
            fragment.castShadow = true;
            fragment.receiveShadow = true;
            
            group.add(fragment);
        }
    }
    
    /**
     * Add weathering effects like cracks and moss
     * @param {THREE.Group} group - The group to add to
     * @param {number} size - Size scale
     */
    addWeatheringEffects(group, size) {
        // Add cracks
        const crackCount = 3 + Math.floor(Math.random() * 4);
        
        for (let i = 0; i < crackCount; i++) {
            const crackGeometry = new THREE.BoxGeometry(
                0.01 * size,
                0.3 * size + Math.random() * 0.4 * size,
                0.01 * size
            );
            
            const crackMaterial = new THREE.MeshBasicMaterial({
                color: 0x2F2F2F // Very dark gray
            });
            
            const crack = new THREE.Mesh(crackGeometry, crackMaterial);
            
            // Position cracks on rock face
            const face = Math.floor(Math.random() * 4); // 4 faces
            const angle = (face * Math.PI / 2) + (Math.random() - 0.5) * 0.5;
            
            crack.position.x = Math.cos(angle) * 0.4 * size;
            crack.position.z = Math.sin(angle) * 0.3 * size;
            crack.position.y = 0.3 * size + Math.random() * 0.6 * size;
            
            crack.rotation.y = angle;
            crack.rotation.x = (Math.random() - 0.5) * 0.5;
            
            group.add(crack);
        }
        
        // Add some moss/lichen
        if (Math.random() > 0.5) {
            this.addMoss(group, size);
        }
    }
    
    /**
     * Add moss or lichen to the rock
     * @param {THREE.Group} group - The group to add to
     * @param {number} size - Size scale
     */
    addMoss(group, size) {
        const mossPatches = 2 + Math.floor(Math.random() * 3);
        
        for (let i = 0; i < mossPatches; i++) {
            const mossGeometry = new THREE.SphereGeometry(0.15 * size, 8, 6);
            const mossMaterial = new THREE.MeshLambertMaterial({
                color: 0x556B2F, // Dark olive green
                roughness: 1.0
            });
            
            const moss = new THREE.Mesh(mossGeometry, mossMaterial);
            moss.scale.set(1.5, 0.3, 1.2); // Flatten it
            
            // Position on shaded sides (typically north-facing)
            const angle = Math.PI + (Math.random() - 0.5) * Math.PI; // North-ish
            moss.position.x = Math.cos(angle) * 0.35 * size;
            moss.position.z = Math.sin(angle) * 0.35 * size;
            moss.position.y = 0.2 * size + Math.random() * 0.4 * size;
            
            group.add(moss);
        }
    }
    
    /**
     * Add snow or ice to the rock
     * @param {THREE.Group} group - The group to add to
     * @param {number} size - Size scale
     */
    addSnow(group, size) {
        // Add snow on top and ledges
        const snowGeometry = new THREE.BoxGeometry(0.7 * size, 0.1 * size, 0.5 * size);
        const snowMaterial = new THREE.MeshLambertMaterial({
            color: 0xF8F8FF, // Ghost white
            emissive: 0xF8F8FF,
            emissiveIntensity: 0.1
        });
        
        const snow = new THREE.Mesh(snowGeometry, snowMaterial);
        snow.position.y = 1.25 * size; // On top
        group.add(snow);
        
        // Add icicles
        const icicleCount = 3 + Math.floor(Math.random() * 4);
        
        for (let i = 0; i < icicleCount; i++) {
            const icicleGeometry = new THREE.ConeGeometry(0.02 * size, 0.2 * size, 6);
            const icicleMaterial = new THREE.MeshPhysicalMaterial({
                color: 0xE6F3FF,
                transmission: 0.8,
                roughness: 0.1,
                metalness: 0.0,
                clearcoat: 1.0,
                clearcoatRoughness: 0.1
            });
            
            const icicle = new THREE.Mesh(icicleGeometry, icicleMaterial);
            
            // Hang from rock ledges
            const angle = Math.random() * Math.PI * 2;
            icicle.position.x = Math.cos(angle) * (0.3 + Math.random() * 0.2) * size;
            icicle.position.z = Math.sin(angle) * (0.3 + Math.random() * 0.2) * size;
            icicle.position.y = 0.8 * size + Math.random() * 0.3 * size;
            
            group.add(icicle);
        }
    }
}